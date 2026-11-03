import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  buildFileManifest,
  buildPlan,
  resolveT2Bindings,
} from "../src/runtime/ksl-lib.mjs";
import { distRoot } from "../src/runtime/distribution.mjs";

const TEST_DIR = dirname(fileURLToPath(import.meta.url));
const YADRA_ROOT = resolve(TEST_DIR, "../..");
const SPEC = join(
  YADRA_ROOT,
  "ksl/examples/minimal/services/order-service/modules/checkout/order-checkout.spec.ksl",
);

test("resolveT2Bindings derives stack and basePackage from service project", () => {
  const specText = readFileSync(SPEC, "utf8");
  const bindings = resolveT2Bindings({
    kslProjectHome: join(YADRA_ROOT, "ksl/examples/minimal"),
    specPath: SPEC,
    specText,
  });
  assert.equal(bindings.feature, "checkout");
  assert.equal(bindings.Feature, "Checkout");
  assert.equal(bindings.Entity, "Order");
  assert.equal(bindings.stack.runtime, "kotlin");
  assert.match(bindings.basePackage, /^com\.yadral\./);
  assert.match(bindings.repoPrefix, /order-service/);
});

test("buildFileManifest is stable and lists hexagonal paths", () => {
  const root = distRoot();
  const plan = buildPlan(SPEC, { distRoot: root });
  const specText = readFileSync(SPEC, "utf8");
  const bindings = resolveT2Bindings({
    kslProjectHome: join(YADRA_ROOT, "ksl/examples/minimal"),
    specPath: SPEC,
    specText,
  });
  const m1 = buildFileManifest({ distRoot: root, deterministicPlan: plan, bindings });
  const m2 = buildFileManifest({ distRoot: root, deterministicPlan: plan, bindings });
  assert.deepEqual(
    m1.files.map((f) => f.path),
    m2.files.map((f) => f.path),
  );
  assert.ok(m1.files.length > 5);
  assert.ok(
    m1.files.some((f) => f.path.includes("CheckoutApi") && f.path.endsWith(".kt")),
  );
});
