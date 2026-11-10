import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  buildFileManifest,
  buildPlan,
  resolveT2Bindings,
} from "../src/runtime/ksl-lib.mjs";
import { distRoot } from "../src/runtime/distribution.mjs";
import {
  materializeProjectFiles,
  runPhaseBProduce,
  safeProjectRelativePath,
} from "../src/runtime/t2/phase-produce.mjs";

const TEST_DIR = dirname(fileURLToPath(import.meta.url));
const YADRA_ROOT = resolve(TEST_DIR, "../..");
const CHECKOUT_SPEC = join(
  YADRA_ROOT,
  "ksl/examples/minimal/services/order-service/modules/checkout/order-checkout.spec.ksl",
);

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

test("produce pass retries a path error until the manifest paths are written", async () => {
  const root = distRoot();
  const specText = readFileSync(CHECKOUT_SPEC, "utf8");
  const plan = buildPlan(CHECKOUT_SPEC, { distRoot: root, phaseRole: "execute" });
  const hex = plan.strategies.find((strategy) => strategy.id === "hexagonal");
  assert.ok(hex);
  const bindings = resolveT2Bindings({
    kslProjectHome: join(YADRA_ROOT, "ksl/examples/minimal"),
    specPath: CHECKOUT_SPEC,
    specText,
  });
  const fileManifest = buildFileManifest({
    distRoot: root,
    deterministicPlan: plan,
    bindings,
  });
  const projectHome = mkdtempSync(join(tmpdir(), "yadra-produce-retry-"));
  let calls = 0;
  try {
    const result = await runPhaseBProduce({
      ws: { projectHome },
      specPath: CHECKOUT_SPEC,
      deterministicPlan: { ...plan, strategies: [hex] },
      bindings,
      fileManifest,
      specialization: "(test)",
      maxRepairLoops: 2,
      complete: async ({ messages }) => {
        calls += 1;
        const user = messages.at(-1).content;
        const line = user
          .split("\n")
          .find((row) => row.includes("Tu peux produire au plus"));
        const paths = line.split(": ").slice(1).join(": ").split(", ").map((p) => p.trim());
        if (calls === 1) {
          assert.equal(user.includes("Erreur du pass précédent"), false);
          return "--- FILE: src/main/java/Wrong.kt ---\nclass Wrong {}\n";
        }
        assert.match(user, /unexpected output file/);
        assert.match(user, /Erreur du pass précédent/);
        return paths
          .map((path) => `--- FILE: ${path} ---\nclass X {}\n`)
          .join("\n");
      },
    });
    assert.equal(calls, 2);
    assert.ok(result.files.length > 0);
    assert.ok(result.files.every((file) => !file.path.endsWith("Wrong.kt")));
  } finally {
    rmSync(projectHome, { recursive: true, force: true });
  }
});
