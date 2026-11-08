export const DEFAULT_OPENAI_BASE = "https://api.openai.com/v1";

import {
  DEFAULT_CURSOR_ENDPOINT,
  resolveCursorEndpoint,
} from "./cursor-agent-cli.mjs";

/** Endpoint HTTP Cursor (legacy base_url OpenAI-local possible via configure). */
export const DEFAULT_CURSOR_OPENAI_PROXY = `${DEFAULT_CURSOR_ENDPOINT}/v1`;

export const DEFAULT_OLLAMA_BASE = "http://127.0.0.1:11434/v1";

/**
 * URL pour clients type OpenAI (`/chat/completions`).
 * Le provider `cursor` n’est pas OpenAI : la clé `crsr_…` va vers un proxy local par défaut.
 */
export function resolveOpenAiCompatibleBaseUrl(provider, baseUrl) {
  const p = (provider ?? "openai").toLowerCase();
  if (p === "cursor") {
    return resolveCursorEndpoint(baseUrl);
  }
  const explicit = baseUrl?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  if (p === "ollama" || p === "custom") {
    return DEFAULT_OLLAMA_BASE;
  }
  return DEFAULT_OPENAI_BASE;
}

export function looksLikeCursorApiKey(token) {
  return typeof token === "string" && token.startsWith("crsr_");
}

export function openAiAuthMisrouteHint({ provider, baseUrl, token, httpStatus, detail }) {
  if (httpStatus !== 401 || !looksLikeCursorApiKey(token)) return null;
  const resolved = resolveOpenAiCompatibleBaseUrl(provider, baseUrl);
  if (resolved.includes("api.openai.com")) {
    return [
      "La clé Cursor (crsr_…) a été envoyée à l’API OpenAI — elle n’y est pas valide.",
      "Corrigez le profil :",
      "  yadra configure set --profile cursor --provider cursor --model composer-2.5-fast \\",
      `    --base-url ${DEFAULT_CURSOR_OPENAI_PROXY}`,
      "Utilisez --provider cursor --base-url https://api2.cursor.sh avec une clé crsr_…",
      "ou --provider openai avec une clé sk-…",
    ].join("\n");
  }
  if ((provider ?? "").toLowerCase() === "cursor") {
    return [
      `Proxy Cursor inaccessible ou clé refusée (${resolved}).`,
      detail ? `Détail: ${detail}` : "",
      "Vérifiez Cursor CLI (`cursor agent`) et --base-url / YADRA_CURSOR_BASE_URL (défaut api2.cursor.sh).",
      "Alternative : yadra configure set --provider openai --model <id> + clé sk-…",
    ]
      .filter(Boolean)
      .join("\n");
  }
  return null;
}
