import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { runProjectSandbox } from "../src/runtime/t2/phase-sandbox.mjs";

test("runProjectSandbox reports skipped for an unknown stack", () => {
  const result = runProjectSandbox("/tmp", { stack: { build: "bazel" } });
  assert.equal(result.skipped, true);
  assert.equal(result.ok, false);
});

test("runProjectSandbox runs mvn test when stack.build is maven", () => {
  const home = mkdtempSync(join(tmpdir(), "yadra-maven-sandbox-"));
  writeFileSync(join(home, "mvnw"), "#!/bin/sh\n");
  let seen = null;
  try {
    const result = runProjectSandbox(
      home,
      { stack: { build: "maven" } },
      {
        runCommand: (cwd, command, args) => {
          seen = { cwd, command, args };
          return {
            exitCode: 0,
            stdout: "BUILD SUCCESS",
            stderr: "",
            signal: null,
            error: null,
          };
        },
      },
    );
    assert.equal(result.ok, true);
    assert.equal(result.tool, "maven");
    assert.equal(result.label, "mvn test");
    assert.equal(seen.cwd, home);
    assert.equal(seen.command, join(home, "mvnw"));
    assert.deepEqual(seen.args, ["-B", "test"]);
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
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
  assert.equal(result.tool, "gradle");
});
