import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  buildPlan,
  extractSpecMeta,
  resolveOutputRouting,
} from "../src/runtime/ksl-lib.mjs";
import { distRoot } from "../src/runtime/distribution.mjs";

const TEST_DIR = dirname(fileURLToPath(import.meta.url));
const YADRA_ROOT = resolve(TEST_DIR, "../..");
const SPEC = join(
  YADRA_ROOT,
  "ksl/examples/minimal/services/order-service/modules/checkout/order-checkout.spec.ksl",
);

test("extractSpecMeta reads outputs.phase execute and gate", () => {
  const meta = extractSpecMeta(readFileSync(SPEC, "utf8"));
  assert.deepEqual(meta.phaseExecute, ["code", "data", "tests"]);
  assert.deepEqual(meta.phaseGate, ["docs", "e2e"]);
});

test("resolveOutputRouting uses explicit phase", () => {
  const meta = extractSpecMeta(readFileSync(SPEC, "utf8"));
  const routing = resolveOutputRouting(meta);
  assert.deepEqual(routing.executeKinds, ["code", "data", "tests"]);
  assert.deepEqual(routing.gateKinds, ["docs", "e2e"]);
  assert.equal(routing.hasExplicitPhase, true);
});

test("buildPlan phaseRole execute excludes gate kinds", () => {
  const plan = buildPlan(SPEC, { distRoot: distRoot(), phaseRole: "execute" });
  assert.ok(!plan.kinds.includes("docs"));
  assert.ok(!plan.kinds.includes("e2e"));
  assert.ok(plan.kinds.includes("code"));
  assert.deepEqual(plan.outputPhase.gate, ["docs", "e2e"]);
});
