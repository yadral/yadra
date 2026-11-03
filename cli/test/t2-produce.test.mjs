import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  materializeProjectFiles,
  safeProjectRelativePath,
} from "../src/runtime/t2/phase-produce.mjs";

test("safeProjectRelativePath rejects escapes and forbidden roots", () => {
  const root = mkdtempSync(join(tmpdir(), "yadra-produce-root-"));
  try {
    assert.throws(
      () => safeProjectRelativePath(root, "../outside.txt"),
      /forbidden|escapes PROJECT_HOME/,
    );
    assert.throws(
      () => safeProjectRelativePath(root, ".git/config"),
      /forbidden/,
    );
    const ok = safeProjectRelativePath(root, "src/main/App.java");
    assert.equal(ok.rel, "src/main/App.java");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("materializeProjectFiles writes under PROJECT_HOME", () => {
  const root = mkdtempSync(join(tmpdir(), "yadra-produce-root-"));
  try {
    const files = materializeProjectFiles(root, [
      { rel: "src/Example.java", content: "class Example {}\n" },
    ]);
    assert.equal(files.length, 1);
    assert.match(files[0].sha256, /^[a-f0-9]{64}$/);
    assert.match(
      readFileSync(join(root, "src/Example.java"), "utf8"),
      /class Example/,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
