import assert from "node:assert/strict";
import test from "node:test";
import { runProjectSandbox } from "../src/runtime/t2/phase-sandbox.mjs";

test("runProjectSandbox reports skipped for non-gradle stack", () => {
  const result = runProjectSandbox("/tmp", { stack: { build: "maven" } });
  assert.equal(result.skipped, true);
  assert.equal(result.ok, false);
});

test("runProjectSandbox uses injected runCommand", () => {
  const result = runProjectSandbox(
    "/proj",
    { stack: { build: "gradle" } },
    {
      runCommand: () => ({
        exitCode: 0,
        stdout: "BUILD SUCCESSFUL",
        stderr: "",
        signal: null,
        error: null,
      }),
    },
  );
  assert.equal(result.ok, true);
});
