import { execFileSync, spawn } from "node:child_process";
import { exchangeUserApiKey } from "./cursor-auth.mjs";

export const DEFAULT_CURSOR_ENDPOINT = "https://api2.cursor.sh";

/** Ancien contournement documenté (proxy OpenAI local) — ignoré sauf opt-in explicite. */
export function isLegacyLocalCursorProxy(baseUrl) {
  if (!baseUrl?.trim()) return false;
  if (process.env.YADRA_CURSOR_USE_LOCAL_PROXY === "1") return false;
  try {
    const host = new URL(baseUrl.trim().replace(/\/v1\/?$/, "")).hostname;
    return host === "127.0.0.1" || host === "localhost";
  } catch {
    return false;
  }
}

/**
 * Endpoint effectif pour `cursor agent --endpoint` (sans /v1).
 * Défaut : api2.cursor.sh — pas besoin de base_url dans configure.
 */
export function resolveCursorEndpoint(baseUrl) {
  const trimmed = baseUrl?.trim();
  if (trimmed && !isLegacyLocalCursorProxy(trimmed)) {
    return trimmed.replace(/\/v1\/?$/, "").replace(/\/$/, "");
  }
  const env =
    process.env.CURSOR_API_ENDPOINT?.trim() ||
    process.env.YADRA_CURSOR_BASE_URL?.trim();
  if (env && !isLegacyLocalCursorProxy(env)) {
    return env.replace(/\/v1\/?$/, "").replace(/\/$/, "");
  }
  return DEFAULT_CURSOR_ENDPOINT;
}

/** Hôte pour POST /auth/exchange_user_api_key (toujours l’API Cursor, pas un proxy local). */
export function resolveCursorAuthEndpoint(baseUrl) {
  const ep = resolveCursorEndpoint(baseUrl);
  if (/cursor\.(sh|com)$/i.test(new URL(ep).hostname)) return ep;
  return DEFAULT_CURSOR_ENDPOINT;
}

export function resolveCursorCli() {
  const fromEnv = process.env.CURSOR_CLI?.trim();
  if (fromEnv) return fromEnv;
  for (const name of ["cursor", "cursor-agent"]) {
    try {
      const found = execFileSync("bash", ["-lc", `command -v ${name}`], {
        encoding: "utf8",
      }).trim();
      if (found) return found;
    } catch {
      /* continue */
    }
  }
  return "cursor";
}

export function formatMessagesForCursorAgent(messages) {
  const parts = [];
  for (const m of messages) {
    const role = m.role ?? "user";
    const text = String(m.content ?? "").trim();
    if (!text) continue;
    if (role === "system") parts.push(`[system]\n${text}`);
    else if (role === "assistant") parts.push(`[assistant]\n${text}`);
    else parts.push(`[user]\n${text}`);
  }
  return parts.join("\n\n");
}

/** T1 formalize A/B : le CLI Cursor doit émettre du KSL compact, pas une réponse chat. */
export function isYadraFormalizePrompt(messages) {
  const blob = messages.map((m) => String(m.content ?? "")).join("\n");
  return (
    /# deliverables/i.test(blob) ||
    /T1 · A · COMPRENDRE/i.test(blob) ||
    /produire un `\.compact\.ksl`/i.test(blob) ||
    /compact\.ksl/i.test(blob)
  );
}

export const FORMALIZE_CURSOR_SUFFIX = [
  "",
  "---",
  "CONSIGNE DE SORTIE (obligatoire — Yadra T1)",
  "Réponds UNIQUEMENT avec le fichier `.compact.ksl` demandé ci-dessus.",
  "La toute première ligne de ta réponse DOIT être exactement : # deliverables",
  "Aucune phrase d’introduction, aucun résumé, aucune question après le KSL.",
  "Tu peux entourer le tout d’une seule fence ```compact.ksl … ```.",
].join("\n");

function mapCursorModel(model) {
  if (!model || model === "default") return "composer-2.5-fast";
  return model;
}

function spawnCursorAgent({ cli, args, cwd, timeoutMs }) {
  return new Promise((resolve, reject) => {
    const child = spawn(cli, args, {
      cwd,
      env: { ...process.env, NO_COLOR: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (c) => {
      stdout += c.toString();
    });
    child.stderr.on("data", (c) => {
      stderr += c.toString();
    });
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`Cursor agent timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    child.on("error", (err) => {
      clearTimeout(timer);
      if (err.code === "ENOENT") {
        reject(
          new Error(
            `Cursor CLI introuvable (${cli}). Installez Cursor CLI : curl https://cursor.com/install -fsS | bash`,
          ),
        );
        return;
      }
      reject(err);
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) {
        const text = stdout.trim();
        if (!text) {
          reject(new Error("Cursor agent: réponse vide"));
          return;
        }
        resolve(text);
        return;
      }
      const detail = (stderr || stdout).trim();
      reject(
        new Error(
          detail
            ? `Cursor agent exit ${code}: ${detail}`
            : `Cursor agent exit ${code}`,
        ),
      );
    });
  });
}

/**
 * Appel LLM via Cursor CLI → endpoint officiel (défaut api2.cursor.sh).
 * Accepte clé utilisateur `crsr_…` (--api-key) : pas de passage par OpenAI.
 */
export async function cursorAgentChatCompletion({
  model,
  baseUrl,
  timeoutMs,
  credentials,
  messages,
}) {
  const userApiKey = credentials?.token?.trim();
  if (!userApiKey) {
    throw new Error(
      "Cursor : token manquant. yadra configure credentials --profile cursor --token crsr_…",
    );
  }

  const endpoint = resolveCursorEndpoint(baseUrl);
  const cli = resolveCursorCli();
  let prompt = formatMessagesForCursorAgent(messages);
  if (!prompt) throw new Error("Cursor agent: messages vides");
  const formalize = isYadraFormalizePrompt(messages);
  if (formalize) {
    prompt = `${prompt}\n${FORMALIZE_CURSOR_SUFFIX}`;
  }

  /** Le CLI accepte crsr_ directement ; on tente aussi l’exchange pour diagnostic. */
  let apiKey = userApiKey;
  if (userApiKey.startsWith("crsr_")) {
    try {
      await exchangeUserApiKey(userApiKey, {
        endpoint: resolveCursorAuthEndpoint(baseUrl),
      });
    } catch (err) {
      throw new Error(
        `Clé Cursor invalide ou refusée par ${endpoint}/auth/exchange_user_api_key: ${err.message}`,
      );
    }
  }

  /** `ask` = Q&A (prose) — mauvais pour T1. Défaut formalize : pas de --mode (sortie directe). */
  const agentMode =
    process.env.YADRA_CURSOR_AGENT_MODE?.trim() ||
    (formalize ? "" : "ask");
  const args = [
    "agent",
    "--print",
    "--output-format",
    "text",
    ...(agentMode ? ["--mode", agentMode] : []),
    "--trust",
    "--api-key",
    apiKey,
    "--endpoint",
    endpoint,
    "--model",
    mapCursorModel(model),
    prompt,
  ];

  return spawnCursorAgent({
    cli,
    args,
    cwd: process.cwd(),
    timeoutMs: timeoutMs ?? 120_000,
  });
}
