import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
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
import { loadOwners } from "../src/runtime/t2/file-owners.mjs";
import {
  materializeProjectFiles,
  runPhaseBProduce,
  safeProjectRelativePath,
} from "../src/runtime/t2/phase-produce.mjs";
import { errorSignature, pathsCitedBySandbox } from "../src/runtime/t2/sandbox-errors.mjs";

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

test("produce pass keeps extra files and retries only missing mandatory paths", async () => {
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
  const extra = "src/test/java/com/iyadris/paymentsservice/config/PostgresTestContainer.kt";
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
        const section = user.split("## Fichiers obligatoires pour ce pass")[1]?.split("## ")[0] ?? "";
        const paths = [...section.matchAll(/^- (.+)$/gm)].map((match) => match[1].trim());
        if (calls === 1) {
          assert.equal(user.includes("Erreur du pass précédent"), false);
          return `--- FILE: ${extra} ---\nclass PostgresTestContainer {}\n`;
        }
        assert.match(user, /missing mandatory files/);
        assert.equal(user.includes("unexpected output file"), false);
        return [
          ...paths.map((path) => `--- FILE: ${path} ---\nclass X {}\n`),
          `--- FILE: ${extra} ---\nclass PostgresTestContainer {}\n`,
        ].join("\n");
      },
    });
    assert.equal(calls, 2);
    assert.ok(result.files.some((file) => file.path === extra));
    assert.match(
      readFileSync(join(projectHome, extra), "utf8"),
      /PostgresTestContainer/,
    );
  } finally {
    rmSync(projectHome, { recursive: true, force: true });
  }
});

test("safeProjectRelativePath strips a repeated PROJECT_HOME folder name", () => {
  const parent = mkdtempSync(join(tmpdir(), "yadra-produce-root-"));
  const root = join(parent, "root");
  mkdirSync(root);
  try {
    const ok = safeProjectRelativePath(root, "root/root/src/main/App.kt");
    assert.equal(ok.rel, "src/main/App.kt");
  } finally {
    rmSync(parent, { recursive: true, force: true });
  }
});

test("combined produce uses a single LLM pass for all strategies", async () => {
  const root = distRoot();
  const specText = readFileSync(CHECKOUT_SPEC, "utf8");
  const plan = buildPlan(CHECKOUT_SPEC, { distRoot: root, phaseRole: "execute" });
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
  const projectHome = mkdtempSync(join(tmpdir(), "yadra-produce-combined-"));
  let calls = 0;
  try {
    const result = await runPhaseBProduce({
      ws: { projectHome },
      specPath: CHECKOUT_SPEC,
      deterministicPlan: plan,
      bindings,
      fileManifest,
      specialization: "(test)",
      maxRepairLoops: 0,
      combined: true,
      complete: async ({ messages }) => {
        calls += 1;
        const user = messages.at(-1).content;
        assert.match(user, /Slice unique/);
        const section = user.split("## Fichiers obligatoires pour ce pass")[1]?.split("## ")[0] ?? "";
        const paths = [...section.matchAll(/^- (.+)$/gm)].map((match) => match[1].trim());
        assert.ok(paths.length > 0);
        return paths.map((path) => `--- FILE: ${path} ---\nclass X {}\n`).join("\n");
      },
    });
    assert.equal(calls, 1);
    assert.ok(result.files.length > 0);
  } finally {
    rmSync(projectHome, { recursive: true, force: true });
  }
});

test("materialize --merge overwrites a file owned by another spec", () => {
  const root = mkdtempSync(join(tmpdir(), "yadra-produce-root-"));
  const shared = "src/main/Shared.kt";
  try {
    materializeProjectFiles(root, [{ rel: shared, content: "class Shared { fun a() = 1 }\n" }], {
      specId: "spec-a",
    });
    const written = materializeProjectFiles(
      root,
      [{ rel: shared, content: "class Shared { fun a() = 2 }\n" }],
      { specId: "spec-b", allowMerge: true },
    );
    assert.equal(written[0].path, shared);
    assert.match(readFileSync(join(root, shared), "utf8"), /fun a\(\) = 2/);
    assert.equal(loadOwners(root)[shared], "spec-a");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("materialize keeps a new file and leaves another spec's file unchanged", () => {
  const root = mkdtempSync(join(tmpdir(), "yadra-produce-root-"));
  const shared = "src/main/Shared.kt";
  try {
    materializeProjectFiles(root, [{ rel: shared, content: "class Shared { fun a() = 1 }\n" }], {
      specId: "spec-a",
    });
    const written = materializeProjectFiles(
      root,
      [
        { rel: shared, content: "class Shared { fun a() = 2 }\n" },
        { rel: "src/main/Extra.kt", content: "class Extra\n" },
      ],
      { specId: "spec-b" },
    );
    assert.deepEqual(written.map((file) => file.path), ["src/main/Extra.kt"]);
    assert.match(readFileSync(join(root, shared), "utf8"), /fun a\(\) = 1/);
    assert.equal(loadOwners(root)[shared], "spec-a");
    assert.equal(loadOwners(root)["src/main/Extra.kt"], "spec-b");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("repair may rewrite a foreign file named by the compiler", () => {
  const root = mkdtempSync(join(tmpdir(), "yadra-produce-root-"));
  const shared = "src/main/Shared.kt";
  try {
    materializeProjectFiles(root, [{ rel: shared, content: "class Shared { fun a() = 1 }\n" }], {
      specId: "spec-a",
    });
    const written = materializeProjectFiles(
      root,
      [{ rel: shared, content: "class Shared { fun a() = 2 }\n" }],
      { specId: "spec-b", mode: "repair", errorPaths: [shared] },
    );
    assert.equal(written[0].path, shared);
    assert.match(readFileSync(join(root, shared), "utf8"), /fun a\(\) = 2/);
    assert.equal(loadOwners(root)[shared], "spec-a");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("materialize rejects two Kotlin functions with the same JVM signature", () => {
  const root = mkdtempSync(join(tmpdir(), "yadra-produce-root-"));
  try {
    assert.throws(
      () =>
        materializeProjectFiles(root, [
          {
            rel: "src/main/Clash.kt",
            content: [
              "class Clash {",
              "  fun convert(value: String): String = value",
              "  fun convert(value: String?): String? = value",
              "}",
            ].join("\n"),
          },
        ]),
      /signature JVM en double/,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("sandbox errors cite source paths and keep a stable signature", () => {
  const log = [
    "[ERROR] /Users/mac/proj/root/src/main/App.kt: (21, 5) Platform declaration clash",
    "[ERROR] /Users/mac/proj/root/src/main/App.kt:[21,5] Platform declaration clash",
  ].join("\n");
  assert.deepEqual(pathsCitedBySandbox(log), ["src/main/App.kt"]);
  assert.equal(errorSignature(log), errorSignature(log));
  assert.match(errorSignature(log), /Platform declaration clash/);
});
