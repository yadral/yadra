import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  applyBindingTemplate,
  buildFileManifest,
  buildPlan,
  packagePathToFileRel,
  resolveRepoPrefix,
  resolveT2Bindings,
  toPackageSegment,
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
    m1.files.some((f) => f.path.endsWith("domain/checkout/CheckoutApi.kt")),
  );
  assert.equal(
    m1.files.some((f) => f.path.includes("domain/api/")),
    false,
  );
  assert.ok(
    m1.files.some((f) => f.path.endsWith("domain/spi/checkout/OrderSpi.kt")),
  );
  assert.ok(
    m1.files.some((f) => f.path.endsWith("domain/mapper/checkout/OrderSpiMapper.kt")),
  );
});

test("Hexagonal-Service manifest does not emit a RestController", () => {
  const root = distRoot();
  const plan = buildPlan(SPEC, { distRoot: root });
  const specText = readFileSync(SPEC, "utf8");
  const bindings = resolveT2Bindings({
    kslProjectHome: join(YADRA_ROOT, "ksl/examples/minimal"),
    specPath: SPEC,
    specText,
  });
  const servicePlan = {
    ...plan,
    strategies: plan.strategies.map((strategy) =>
      strategy.id === "hexagonal"
        ? {
            ...strategy,
            declaredName: "Hexagonal-Service",
            id: "hexagonal-service",
            name: "Hexagonal-Service",
            skeleton: "ksl/hexagonal-service.strategy.ksl",
          }
        : strategy,
    ),
  };
  const manifest = buildFileManifest({
    distRoot: root,
    deterministicPlan: servicePlan,
    bindings,
  });
  assert.equal(
    manifest.files.some((file) => file.path.includes("RestController")),
    false,
  );
  assert.ok(
    manifest.files.some((file) => file.path.endsWith("domain/checkout/CheckoutApi.kt")),
  );
  assert.ok(
    manifest.files.some((file) =>
      file.path.endsWith("domain/workflow/api/checkout/CheckoutService.kt"),
    ),
  );
});

test("package segment drops hyphens", () => {
  assert.equal(toPackageSegment("momo-cm"), "momocm");
  assert.equal(toPackageSegment("checkout"), "checkout");
});

test("repo path that is PROJECT_HOME does not prefix output files", () => {
  const home = mkdtempSync(join(tmpdir(), "yadra-bindings-"));
  const code = join(home, "root");
  const serviceDir = join(home, "ksl/services/payments-service");
  const specDir = join(serviceDir, "modules/momo-cm");
  try {
    mkdirSync(specDir, { recursive: true });
    mkdirSync(code, { recursive: true });
    writeFileSync(
      join(home, "ksl/root.project.ksl"),
      `ksl 1.0\nproject "iyadris-payments" {\n  kind = "root"\n  stack { runtime = "kotlin" data = ["postgres"] }\n}\n`,
    );
    writeFileSync(
      join(serviceDir, "payments-service.project.ksl"),
      `ksl 1.0\nproject "payments-service" {\n  kind = "service"\n  repo { path = "../../../root" }\n  stack { runtime = "kotlin" data = ["postgres"] }\n}\n`,
    );
    const specPath = join(specDir, "momo-cm-request-to-pay.spec.ksl");
    const specText = `ksl 1.0\nspec "momo-cm-request-to-pay" {\n  module = "momo-cm"\n}\n`;
    writeFileSync(specPath, specText);
    assert.equal(
      resolveRepoPrefix("../../../root", { serviceDir, projectHome: code }),
      "",
    );
    assert.equal(
      resolveRepoPrefix("services/order-service"),
      "services/order-service",
    );
    const bindings = resolveT2Bindings({
      kslProjectHome: join(home, "ksl"),
      specPath,
      specText,
      projectHome: code,
    });
    assert.equal(bindings.feature, "momocm");
    assert.equal(bindings.Feature, "MomoCm");
    assert.equal(bindings.Entity, "MomoCm");
    assert.equal(bindings.Technology, "Jpa");
    assert.equal(bindings.repoPrefix, "");
    const rel = packagePathToFileRel(
      bindings,
      applyBindingTemplate("domain.model.<feature>.<Entity>", bindings),
    );
    assert.equal(
      rel,
      "src/main/java/com/iyadris/paymentsservice/domain/model/momocm/MomoCm.kt",
    );
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});
