import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  discoverMakeGraph,
  featureRank,
  makeSteps,
} from "../src/runtime/make/discover.mjs";

const TEST_DIR = dirname(fileURLToPath(import.meta.url));
const CLI = resolve(TEST_DIR, "../src/main.mjs");
const YADRA_ROOT = resolve(TEST_DIR, "../..");
const MINIMAL_KSL = join(YADRA_ROOT, "ksl/examples/minimal");

function run(args, options = {}) {
  const env = { ...process.env, HOME: options.home, ...(options.extraEnv ?? {}) };
  delete env.KSL_PROJECT_HOME;
  delete env.YADRA_PROJECT_ROOT;
  delete env.YADRA_CONTEXT;
  if (options.kslProjectHome) env.KSL_PROJECT_HOME = options.kslProjectHome;
  return spawnSync(process.execPath, [CLI, ...args], {
    cwd: options.cwd ?? YADRA_ROOT,
    env,
    encoding: "utf8",
    maxBuffer: 4 * 1024 * 1024,
  });
}

test("featureRank puts root then service then spec then module", () => {
  assert.equal(featureRank({ outputPaths: { root: "root.project.ksl" } }), 0);
  assert.equal(
    featureRank({ outputPaths: { root: "services/payments-service/payments-service.project.ksl" } }),
    1,
  );
  assert.equal(featureRank({ outputPaths: { spec: "a.spec.ksl" } }), 2);
  assert.equal(featureRank({ outputPaths: { module: "momo.module.ksl" } }), 3);
  assert.equal(
    featureRank({ outputPaths: { spec: "a.spec.ksl", module: "m.module.ksl" } }),
    2,
  );
});

test("makeSteps maps aliases and --no-gate", () => {
  assert.deepEqual(makeSteps({ step: "all" }), {
    step: "all",
    doT1: true,
    doExecute: true,
    doGate: true,
  });
  assert.deepEqual(makeSteps({ step: "formalize" }), {
    step: "t1",
    doT1: true,
    doExecute: false,
    doGate: false,
  });
  assert.deepEqual(makeSteps({ step: "t2", noGate: true }), {
    step: "t2",
    doT1: false,
    doExecute: true,
    doGate: false,
  });
  assert.throws(() => makeSteps({ step: "nope" }), /Invalid --step/);
});

test("discoverMakeGraph orders Doc First folders and resolves specs", () => {
  const root = mkdtempSync(join(tmpdir(), "yadra-make-graph-"));
  const prompts = join(root, "prompts");
  mkdirSync(join(prompts, "platform-root"), { recursive: true });
  mkdirSync(join(prompts, "momo-cm", "module"), { recursive: true });
  mkdirSync(join(prompts, "momo-cm", "specs", "request-to-pay"), { recursive: true });
  writeFileSync(
    join(prompts, "platform-root", "feature.yadra.md"),
    "kind: KSL\noutput_paths:\n  root: root.project.ksl\n",
  );
  writeFileSync(
    join(prompts, "momo-cm", "module", "feature.yadra.md"),
    "kind: KSL\noutput_paths:\n  module: services/order-service/modules/checkout/checkout.module.ksl\n",
  );
  writeFileSync(
    join(prompts, "momo-cm", "specs", "request-to-pay", "feature.yadra.md"),
    "kind: KSL\noutput_paths:\n  spec: services/order-service/modules/checkout/order-checkout.spec.ksl\n",
  );
  try {
    const graph = discoverMakeGraph(prompts, root, { kslProjectHome: MINIMAL_KSL });
    assert.deepEqual(
      graph.features.map((f) => f.rank),
      [0, 2, 3],
    );
    assert.equal(graph.specs.length, 1);
    assert.match(graph.specs[0], /order-checkout\.spec\.ksl$/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("yadra make --help and dry-run json graph", () => {
  const home = mkdtempSync(join(tmpdir(), "yadra-make-home-"));
  const appHome = mkdtempSync(join(tmpdir(), "yadra-make-app-"));
  const repo = mkdtempSync(join(tmpdir(), "yadra-make-repo-"));
  mkdirSync(join(repo, "prompts", "checkout"), { recursive: true });
  writeFileSync(
    join(repo, "prompts", "checkout", "feature.yadra.md"),
    [
      "kind: KSL",
      "output_paths:",
      "  spec: services/order-service/modules/checkout/order-checkout.spec.ksl",
      "",
    ].join("\n"),
  );
  try {
    const help = run(["make", "-h"], { home });
    assert.equal(help.status, 0, help.stderr);
    assert.match(help.stdout, /yadra make/);
    assert.match(help.stdout, /--step/);
    assert.match(help.stdout, /--verbose/);

    const added = run(
      [
        "project",
        "add",
        "make-demo",
        "--ksl-project-home",
        MINIMAL_KSL,
        "--project-home",
        appHome,
      ],
      { home },
    );
    assert.equal(added.status, 0, added.stderr);

    const dry = run(
      [
        "make",
        "prompts",
        "--dry-run",
        "--skip-llm",
        "--allow-unsealed",
        "--no-gate",
        "--format",
        "json",
      ],
      { home, cwd: repo },
    );
    assert.equal(dry.status, 0, `${dry.stdout}\n${dry.stderr}`);
    const payload = JSON.parse(dry.stdout);
    assert.equal(payload.step, "all");
    assert.equal(payload.combined, true);
    assert.equal(payload.merge, true);
    assert.equal(payload.features.length, 1);
    assert.equal(payload.specs.length, 1);
    assert.match(payload.specs[0], /order-checkout\.spec\.ksl$/);
  } finally {
    rmSync(home, { recursive: true, force: true });
    rmSync(appHome, { recursive: true, force: true });
    rmSync(repo, { recursive: true, force: true });
  }
});

test("yadra make --skip-llm without --dry-run is rejected", () => {
  const home = mkdtempSync(join(tmpdir(), "yadra-make-home-"));
  try {
    const result = run(["make", ".", "--skip-llm"], { home });
    assert.equal(result.status, 2);
    assert.match(result.stderr, /only valid with --dry-run/);
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});

test("yadra make auto-detects workspace without project use", () => {
  const home = mkdtempSync(join(tmpdir(), "yadra-make-autodetect-home-"));
  const product = mkdtempSync(join(tmpdir(), "yadra-make-autodetect-"));
  const kslDir = join(product, "ksl");
  const appDir = join(product, "app");
  mkdirSync(join(product, "prompts", "checkout"), { recursive: true });
  mkdirSync(appDir, { recursive: true });
  mkdirSync(join(kslDir, "services", "order-service", "modules", "checkout"), {
    recursive: true,
  });
  writeFileSync(
    join(kslDir, "root.project.ksl"),
    [
      "ksl 1.0",
      "",
      'project "auto-make" {',
      '  kind = "root"',
      "  repo {",
      '    path = "../app"',
      "  }",
      "}",
      "",
    ].join("\n"),
  );
  writeFileSync(
    join(
      kslDir,
      "services",
      "order-service",
      "modules",
      "checkout",
      "order-checkout.spec.ksl",
    ),
    [
      "ksl 1.0",
      "",
      'spec "order-checkout" {',
      '  module = "checkout"',
      "}",
      "",
    ].join("\n"),
  );
  writeFileSync(
    join(product, "prompts", "checkout", "feature.yadra.md"),
    [
      "kind: KSL",
      "output_paths:",
      "  spec: services/order-service/modules/checkout/order-checkout.spec.ksl",
      "",
    ].join("\n"),
  );
  try {
    const dry = run(
      [
        "make",
        "prompts/checkout",
        "--dry-run",
        "--skip-llm",
        "--allow-unsealed",
        "--no-gate",
        "--format",
        "json",
      ],
      { home, cwd: product },
    );
    assert.equal(dry.status, 0, `${dry.stdout}\n${dry.stderr}`);
    const payload = JSON.parse(dry.stdout);
    assert.equal(payload.features.length, 1);
    assert.equal(payload.specs.length, 1);
  } finally {
    rmSync(home, { recursive: true, force: true });
    rmSync(product, { recursive: true, force: true });
  }
});
