const DEFAULT_OPENAI_BASE = "https://api.openai.com/v1";

function resolveAuth(credentials) {
  if (credentials.token) {
    return { type: "bearer", value: credentials.token };
  }
  if (credentials.username && credentials.password) {
    const value = Buffer.from(
      `${credentials.username}:${credentials.password}`,
    ).toString("base64");
    return { type: "basic", value };
  }
  return null;
}

function authHeaders(auth) {
  if (!auth) return {};
  if (auth.type === "bearer") {
    return { Authorization: `Bearer ${auth.value}` };
  }
  return { Authorization: `Basic ${auth.value}` };
}

async function readErrorBody(res) {
  try {
    const j = await res.json();
    return j.error?.message ?? j.message ?? JSON.stringify(j);
  } catch {
    return await res.text();
  }
}

export async function chatCompletion(options) {
  const provider = (options.provider ?? "openai").toLowerCase();
  if (provider === "anthropic") {
    return anthropicMessages(options);
  }
  return openaiChatCompletions(options);
}

async function openaiChatCompletions({
  model,
  baseUrl,
  timeoutMs,
  credentials,
  messages,
}) {
  const auth = resolveAuth(credentials);
  if (!auth) {
    throw new Error(
      "LLM credentials missing. Run: yadra configure credentials --profile <name> --token <key>",
    );
  }
  if (!model) {
    throw new Error(
      "LLM model missing. Run: yadra configure set --profile <name> --model <id>",
    );
  }

  const url = `${(baseUrl ?? DEFAULT_OPENAI_BASE).replace(/\/$/, "")}/chat/completions`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs ?? 120_000);

  try {
    const res = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(auth),
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.2,
      }),
    });
    if (!res.ok) {
      throw new Error(`LLM HTTP ${res.status}: ${await readErrorBody(res)}`);
    }
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("LLM response missing message content.");
    return content;
  } finally {
    clearTimeout(timer);
  }
}

async function anthropicMessages({
  model,
  baseUrl,
  timeoutMs,
  credentials,
  messages,
}) {
  const auth = resolveAuth(credentials);
  if (!auth || auth.type !== "bearer") {
    throw new Error(
      "Anthropic requires a token: yadra configure credentials --profile <name> --token <key>",
    );
  }
  if (!model) {
    throw new Error("LLM model missing (yadra configure set --model …).");
  }

  let system = "";
  const anthropicMessages = [];
  for (const m of messages) {
    if (m.role === "system") system += `${m.content}\n`;
    else anthropicMessages.push({ role: m.role, content: m.content });
  }

  const url = `${(baseUrl ?? "https://api.anthropic.com").replace(/\/$/, "")}/v1/messages`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs ?? 120_000);

  try {
    const res = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": auth.value,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 16_384,
        system: system.trim() || undefined,
        messages: anthropicMessages,
        temperature: 0.2,
      }),
    });
    if (!res.ok) {
      throw new Error(`LLM HTTP ${res.status}: ${await readErrorBody(res)}`);
    }
    const data = await res.json();
    const block = data.content?.find((b) => b.type === "text");
    if (!block?.text) throw new Error("Anthropic response missing text content.");
    return block.text;
  } finally {
    clearTimeout(timer);
  }
}
