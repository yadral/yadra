import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_OPENAI_BASE,
  resolveOpenAiCompatibleBaseUrl,
} from "../src/runtime/llm/resolve-endpoint.mjs";
import {
  DEFAULT_CURSOR_ENDPOINT,
  isLegacyLocalCursorProxy,
  resolveCursorEndpoint,
} from "../src/runtime/llm/cursor-agent-cli.mjs";

test("cursor provider defaults to api2.cursor.sh", () => {
  assert.equal(
    resolveOpenAiCompatibleBaseUrl("cursor", undefined),
    DEFAULT_CURSOR_ENDPOINT,
  );
  assert.equal(
    resolveOpenAiCompatibleBaseUrl("cursor", "http://localhost:9999/v1"),
    DEFAULT_CURSOR_ENDPOINT,
  );
});

test("openai provider defaults to OpenAI API", () => {
  assert.equal(resolveOpenAiCompatibleBaseUrl("openai", undefined), DEFAULT_OPENAI_BASE);
});

test("cursor ignores legacy localhost base_url in configure", () => {
  assert.equal(
    resolveCursorEndpoint("http://127.0.0.1:8787/v1"),
    DEFAULT_CURSOR_ENDPOINT,
  );
  assert.equal(isLegacyLocalCursorProxy("http://127.0.0.1:8787/v1"), true);
  assert.equal(
    resolveCursorEndpoint("https://api2.cursor.sh"),
    DEFAULT_CURSOR_ENDPOINT,
  );
});
