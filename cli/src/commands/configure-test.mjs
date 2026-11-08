import { resolveWorkspace } from "../config/load-projects.mjs";
import { getProfileConfig } from "../config/load-configure.mjs";
import {
  isLlmConfigured,
  llmFromWorkspace,
  llmRuntime,
} from "../runtime/command-context.mjs";
import { exchangeUserApiKey } from "../runtime/llm/cursor-auth.mjs";
import {
  DEFAULT_CURSOR_ENDPOINT,
  isLegacyLocalCursorProxy,
  resolveCursorAuthEndpoint,
  resolveCursorCli,
  resolveCursorEndpoint,
} from "../runtime/llm/cursor-agent-cli.mjs";
import { chatCompletion } from "../runtime/llm/chat.mjs";
import { looksLikeCursorApiKey } from "../runtime/llm/resolve-endpoint.mjs";

export function maskSecret(value) {
  if (!value) return "(absent)";
  const s = String(value);
  if (s.length <= 10) return "***";
  const prefix = s.startsWith("crsr_")
    ? "crsr_"
    : s.startsWith("sk-")
      ? "sk-"
      : s.slice(0, Math.min(6, s.length));
  return `${prefix}…${s.slice(-4)} (${s.length} car.)`;
}

const DEFAULT_PROMPT =
  'Réponds en une seule ligne, sans explication : YADRA_OK';

export async function cmdConfigureTest(flags, cwd) {
  const ws = resolveWorkspace(cwd);
  const profile =
    flags.profile ??
    ws?.llm?.profile ??
    process.env.YADRA_PROFILE ??
    "default";
  const { configure, credentials } = getProfileConfig(profile);

  const llm = {
    profile,
    provider: configure.provider ?? null,
    model: flags.model ?? ws?.llm?.model ?? configure.model ?? process.env.YADRA_MODEL ?? null,
  };

  const authType = credentials.token
    ? "token"
    : credentials.username
      ? "login/password"
      : "(aucun)";

  console.log("yadra configure test — profil LLM");
  console.log("");
  if (ws?.name) console.log(`  Projet actif:   ${ws.name}`);
  console.log(`  Profil:         ${profile}`);
  console.log(`  Provider:       ${configure.provider ?? "(non défini)"}`);
  console.log(`  Modèle:         ${llm.model ?? "(non défini)"}`);
  const storedBase = configure.base_url ?? configure.baseUrl;
  const effectiveBase =
    (configure.provider ?? "").toLowerCase() === "cursor"
      ? resolveCursorEndpoint(storedBase)
      : storedBase ?? "(défaut provider)";
  console.log(`  Endpoint:       ${effectiveBase}`);
  if (
    (configure.provider ?? "").toLowerCase() === "cursor" &&
    storedBase &&
    isLegacyLocalCursorProxy(storedBase)
  ) {
    console.log(
      `  (configure:    ${storedBase} — ignoré, défaut ${DEFAULT_CURSOR_ENDPOINT})`,
    );
  } else if ((configure.provider ?? "").toLowerCase() === "cursor" && !storedBase) {
    console.log(`  (défaut Yadra:  ${DEFAULT_CURSOR_ENDPOINT})`);
  }
  console.log(`  Auth:           ${authType}`);
  if (credentials.token) {
    console.log(`  Token:          ${maskSecret(credentials.token)}`);
  }
  if (configure.timeout) console.log(`  Timeout:        ${configure.timeout} ms`);

  if (!isLlmConfigured(llm)) {
    console.error("");
    console.error("Échec: profil incomplet (modèle et/ou credentials manquants).");
    console.error("  yadra configure set --profile", profile, "--provider … --model …");
    console.error("  yadra configure credentials --profile", profile, "--token …");
    return 1;
  }

  const provider = (configure.provider ?? "openai").toLowerCase();
  const prompt = flags.prompt?.trim() || DEFAULT_PROMPT;
  const authOnly = Boolean(flags.authOnly);

  console.log("");
  console.log("1/2 — Vérification credentials…");

  try {
    if (provider === "cursor" && looksLikeCursorApiKey(credentials.token)) {
      const authEp = resolveCursorAuthEndpoint(
        configure.base_url ?? configure.baseUrl,
      );
      await exchangeUserApiKey(credentials.token, { endpoint: authEp });
      console.log(`  OK   échange API key → session (${authEp})`);
      const cli = resolveCursorCli();
      console.log(`  CLI  ${cli}`);
    } else if (provider === "cursor") {
      console.log("  skip échange (token non crsr_ — session ou autre)");
    } else if (provider === "anthropic") {
      console.log("  OK   token présent (test API à l’étape 2)");
    } else {
      console.log("  OK   token présent (test API à l’étape 2)");
    }
  } catch (err) {
    console.error(`  FAIL ${err.message}`);
    return 1;
  }

  if (authOnly) {
    console.log("");
    console.log("(--auth-only : pas d’appel modèle)");
    return 0;
  }

  console.log("");
  console.log("2/2 — Appel modèle (court)…");
  console.log(`  prompt: ${prompt.slice(0, 72)}${prompt.length > 72 ? "…" : ""}`);

  const runtime = llmRuntime(llm);
  const t0 = Date.now();
  try {
    const content = await chatCompletion({
      provider: runtime.provider,
      model: runtime.model,
      baseUrl: runtime.baseUrl,
      timeoutMs: runtime.timeoutMs,
      credentials: runtime.credentials,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });
    const ms = Date.now() - t0;
    const snippet = content.replace(/\s+/g, " ").trim().slice(0, 200);
    console.log(`  OK   réponse en ${ms} ms`);
    console.log(`  →    ${snippet}${content.length > 200 ? "…" : ""}`);
    return 0;
  } catch (err) {
    const ms = Date.now() - t0;
    console.error(`  FAIL après ${ms} ms`);
    console.error(err.message);
    return 1;
  }
}
