const DEFAULT_EXCHANGE_URL = "https://api2.cursor.sh";

const cache = new Map();

function jwtExpiryMs(token) {
  try {
    const part = token.split(".")[1];
    if (!part) return Date.now() + 55 * 60_000;
    const payload = JSON.parse(Buffer.from(part, "base64url").toString("utf8"));
    if (typeof payload.exp === "number") {
      return payload.exp * 1000 - 5 * 60_000;
    }
  } catch {
    /* ignore */
  }
  return Date.now() + 55 * 60_000;
}

/**
 * Échange une User API Key `crsr_…` contre un JWT session (~1h).
 * @see https://api2.cursor.sh/auth/exchange_user_api_key
 */
export async function exchangeUserApiKey(apiKey, { endpoint } = {}) {
  const key = apiKey.trim();
  const hit = cache.get(key);
  if (hit && Date.now() < hit.expiresAt) return hit.accessToken;

  const base = (endpoint || DEFAULT_EXCHANGE_URL).replace(/\/$/, "");
  const url = `${base}/auth/exchange_user_api_key`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: "{}",
  });

  const bodyText = await res.text();
  let data;
  try {
    data = JSON.parse(bodyText);
  } catch {
    data = { message: bodyText };
  }

  if (!res.ok) {
    const msg =
      data?.message ??
      data?.error ??
      (bodyText.slice(0, 200) || `HTTP ${res.status}`);
    throw new Error(msg);
  }

  const accessToken = data.accessToken;
  if (typeof accessToken !== "string" || !accessToken) {
    throw new Error("exchange_user_api_key: accessToken absent");
  }

  cache.set(key, {
    accessToken,
    expiresAt: jwtExpiryMs(accessToken),
  });
  return accessToken;
}
