import assert from "node:assert/strict";
import test from "node:test";
import { maskSecret } from "../src/commands/configure-test.mjs";

test("maskSecret redacts tokens without revealing full value", () => {
  assert.equal(maskSecret(""), "(absent)");
  assert.match(maskSecret("crsr_abcdefghijklmnop"), /^crsr_/);
  assert.match(maskSecret("crsr_abcdefghijklmnop"), /car\.\)$/);
  assert.doesNotMatch(maskSecret("crsr_abcdefghijklmnop"), /klmnop$/);
});
