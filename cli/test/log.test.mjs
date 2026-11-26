import assert from "node:assert/strict";
import test from "node:test";
import { isVerbose, logWrittenFiles } from "../src/util/log.mjs";

test("isVerbose reads flags.verbose", () => {
  assert.equal(isVerbose(true), true);
  assert.equal(isVerbose({ verbose: true }), true);
  assert.equal(isVerbose({ verbose: false }), false);
  assert.equal(isVerbose({}), false);
});

test("logWrittenFiles prints a count unless verbose", () => {
  const files = [{ path: "a.kt" }, { path: "b.kt" }];
  const lines = [];
  const orig = console.log;
  try {
    console.log = (...args) => lines.push(args.join(" "));
    logWrittenFiles(false, files);
    logWrittenFiles({ verbose: true }, files);
  } finally {
    console.log = orig;
  }
  assert.deepEqual(lines, ["  2 fichier(s)", "  a.kt", "  b.kt"]);
});
