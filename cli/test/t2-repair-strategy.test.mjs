import assert from "node:assert/strict";
import test from "node:test";
import {
  alignTypeOnLine,
  assignInsteadOfCopy,
  dropNullableOverload,
  strategyFor,
} from "../src/runtime/t2/repair-strategy.mjs";

const clashLog = "Foo.kt:[21,5] Platform declaration clash: same JVM signature (convert)";

test("a repeated error switches approach instead of stopping", () => {
  const first = strategyFor(clashLog, 0);
  const second = strategyFor(clashLog, 1);
  const third = strategyFor(clashLog, 2);
  assert.equal(first.id, "drop-nullable");
  assert.equal(second.id, "single-method");
  assert.equal(third.id, "widen-clash");
  assert.notEqual(first.instruction, second.instruction);
});

test("dropNullableOverload keeps the non-null function", () => {
  const source = [
    "class Clash {",
    "  fun convert(value: String): String = value",
    "  fun convert(value: String?): String? = value",
    "}",
  ].join("\n");
  const next = dropNullableOverload(source);
  assert.match(next, /fun convert\(value: String\)/);
  assert.doesNotMatch(next, /String\?/);
});

test("alignTypeOnLine removes toPlainString when BigDecimal is expected", () => {
  const source = "amount = seedAmount().toPlainString(),";
  const log = "Tester.kt:10:17 Type mismatch: inferred type is String but BigDecimal was expected";
  const next = alignTypeOnLine(source, 1, log);
  assert.equal(next, "amount = seedAmount(),");
});

test("assignInsteadOfCopy replaces a single-line copy", () => {
  const source = 'row.copy(status = "SUCCESSFUL", financialTransactionId = "FT-TEST")';
  const next = assignInsteadOfCopy(source, 1);
  assert.match(next, /row\.status = "SUCCESSFUL"/);
  assert.match(next, /row\.financialTransactionId = "FT-TEST"/);
  assert.doesNotMatch(next, /\.copy\(/);
});
