import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const TEST_DIR = dirname(fileURLToPath(import.meta.url));
const CLI = resolve(TEST_DIR, "../src/main.mjs");
const YADRA_ROOT = resolve(TEST_DIR, "../..");
const MINIMAL_KSL = join(YADRA_ROOT, "ksl/examples/minimal");

function run(args, options = {}) {
  const env = { ...process.env, HOME: options.home, ...(options.extraEnv ?? {}) };
  delete env.KSL_PROJECT_HOME;
  delete env.YADRA_PROJECT_ROOT;
  delete env.YADRA_CONTEXT;
  if (options.kslProjectHome) {
    env.KSL_PROJECT_HOME = options.kslProjectHome;
  }
  return spawnSync(process.execPath, [CLI, ...args], {
    cwd: options.cwd ?? YADRA_ROOT,
    env,
    encoding: "utf8",
    maxBuffer: 4 * 1024 * 1024,
  });
}

test("configure set keeps flags parsed before the subcommand dispatch", () => {
  const home = mkdtempSync(join(tmpdir(), "yadra-cli-home-"));
  try {
    const result = run(
      [
        "configure",
        "set",
        "--profile",
        "dev",
        "--provider",
        "openai",
        "--model",
        "gpt-test",
      ],
      { home },
    );

    assert.equal(result.status, 0, result.stderr);
    const config = readFileSync(join(home, ".config/yadra/configure"), "utf8");
    assert.match(config, /\[profile dev\]/);
    assert.match(config, /provider = openai/);
    assert.match(config, /model = gpt-test/);

    const listed = run(["configure", "list"], { home });
    assert.equal(listed.status, 0, listed.stderr);
    assert.doesNotMatch(listed.stdout, /_default/);
    assert.match(listed.stdout, /dev\s+openai\s+gpt-test\s+-/);

    const envAuth = run(["configure", "list"], {
      home,
      extraEnv: { YADRA_LLM_TOKEN: "tok-ci" },
    });
    assert.equal(envAuth.status, 0, envAuth.stderr);
    assert.match(envAuth.stdout, /dev\s+openai\s+gpt-test\s+token/);
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});

test("project add and use persist absolute homes and profile", () => {
  const home = mkdtempSync(join(tmpdir(), "yadra-cli-home-"));
  const kslHome = mkdtempSync(join(tmpdir(), "yadra-cli-ksl-"));
  const appHome = mkdtempSync(join(tmpdir(), "yadra-cli-app-"));
  writeFileSync(
    join(kslHome, "root.project.ksl"),
    'ksl 1.0\nproject "test" {\n  kind = "root"\n}\n',
  );

  try {
    const added = run(
      [
        "project",
        "add",
        "demo",
        "--ksl-project-home",
        kslHome,
        "--project-home",
        appHome,
        "--profile",
        "dev",
      ],
      { home },
    );

    assert.equal(added.status, 0, added.stderr);
    const registry = JSON.parse(
      readFileSync(join(home, ".config/yadra/projects.json"), "utf8"),
    );
    assert.equal(registry.current, "demo");
    assert.equal(registry.projects.demo.kslProjectHome, kslHome);
    assert.equal(registry.projects.demo.projectHome, appHome);
    assert.equal(registry.projects.demo.llm.profile, "dev");

    const secondKsl = mkdtempSync(join(tmpdir(), "yadra-cli-ksl2-"));
    writeFileSync(
      join(secondKsl, "root.project.ksl"),
      'ksl 1.0\nproject "other" {\n  kind = "root"\n}\n',
    );
    const added2 = run(
      [
        "project",
        "add",
        "other",
        "--ksl-project-home",
        secondKsl,
        "--project-home",
        appHome,
        "--no-current",
      ],
      { home },
    );
    assert.equal(added2.status, 0, added2.stderr);
    assert.equal(
      JSON.parse(readFileSync(join(home, ".config/yadra/projects.json"), "utf8"))
        .current,
      "demo",
    );

    const switched = run(["project", "use", "other"], { home });
    assert.equal(switched.status, 0, switched.stderr);

    const exported = run(["project", "export"], { home });
    assert.equal(exported.status, 0, exported.stderr);
    assert.match(exported.stdout, /export KSL_PROJECT_HOME=/);
    assert.match(exported.stdout, /export YADRA_PROJECT=/);
    assert.doesNotMatch(exported.stdout, /YADRA_PROJECT_ROOT/);

    const profileChange = run(
      ["project", "set-profile", "demo", "--profile", "prod", "--model", "gpt-test"],
      { home },
    );
    assert.equal(profileChange.status, 0, profileChange.stderr);
    const afterProfile = JSON.parse(
      readFileSync(join(home, ".config/yadra/projects.json"), "utf8"),
    );
    assert.equal(afterProfile.projects.demo.llm.profile, "prod");
    assert.equal(afterProfile.projects.demo.llm.model, "gpt-test");

    rmSync(secondKsl, { recursive: true, force: true });
  } finally {
    rmSync(home, { recursive: true, force: true });
    rmSync(kslHome, { recursive: true, force: true });
    rmSync(appHome, { recursive: true, force: true });
  }
});

test("formalize validates existing output paths without sealing", () => {
  const home = mkdtempSync(join(tmpdir(), "yadra-cli-home-"));
  const docs = mkdtempSync(join(tmpdir(), "yadra-cli-docs-"));
  writeFileSync(
    join(docs, "feature.yadra.md"),
    [
      "output_paths:",
      "  spec: services/order-service/modules/checkout/order-checkout.spec.ksl",
      "",
    ].join("\n"),
  );

  try {
    const result = run(["formalize", docs, "--no-seal", "--skip-llm"], {
      home,
      kslProjectHome: MINIMAL_KSL,
    });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Validation passed/);
  } finally {
    rmSync(home, { recursive: true, force: true });
    rmSync(docs, { recursive: true, force: true });
  }
});

test("formalize rejects output paths outside KSL_PROJECT_HOME", () => {
  const home = mkdtempSync(join(tmpdir(), "yadra-cli-home-"));
  const docs = mkdtempSync(join(tmpdir(), "yadra-cli-docs-"));
  writeFileSync(
    join(docs, "feature.yadra.md"),
    "output_paths:\n  spec: ../outside.spec.ksl\n",
  );

  try {
    const result = run(["formalize", docs], {
      home,
      kslProjectHome: MINIMAL_KSL,
    });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /escapes KSL_PROJECT_HOME/);
  } finally {
    rmSync(home, { recursive: true, force: true });
    rmSync(docs, { recursive: true, force: true });
  }
});

test("plan prints a T2 compile dry-run from a spec", () => {
  const home = mkdtempSync(join(tmpdir(), "yadra-cli-home-"));
  const spec = join(
    MINIMAL_KSL,
    "services/order-service/modules/checkout/order-checkout.spec.ksl",
  );
  try {
    const human = run(["plan", spec, "--skip-llm"], {
      home,
      kslProjectHome: MINIMAL_KSL,
    });
    assert.equal(human.status, 0, human.stderr);
    assert.match(human.stdout, /T2 · plan "order-checkout"/);
    assert.match(
      human.stdout,
      /Hexagonal \[architecture\].*hexagonal\.strategy\.ksl/,
    );
    assert.match(
      human.stdout,
      /Outbox → TransactionalOutbox \[pattern\].*transactional-outbox\.strategy\.ksl/,
    );
    assert.doesNotMatch(human.stdout, /C · EXÉCUTER|Gate/);

    const json = run(["plan", spec, "--format", "json"], {
      home,
      kslProjectHome: MINIMAL_KSL,
    });
    assert.equal(json.status, 0, json.stderr);
    const payload = JSON.parse(json.stdout);
    assert.equal(payload.spec, "order-checkout");
    assert.ok(Array.isArray(payload.kinds));
    assert.ok(Array.isArray(payload.strategies));
    assert.equal(
      payload.strategies.find((strategy) => strategy.id === "hexagonal")
        ?.skeleton,
      "ksl/hexagonal.strategy.ksl",
    );
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});

test("strategies lists catalog entries and show resolves by name", () => {
  const home = mkdtempSync(join(tmpdir(), "yadra-cli-home-"));
  try {
    const list = run(["strategies", "list", "--family", "principles"], { home });
    assert.equal(list.status, 0, list.stderr);
    assert.match(list.stdout, /SOLID/);
    assert.match(list.stdout, /Principes de conception/);

    const show = run(["strategies", "show", "SOLID"], { home });
    assert.equal(show.status, 0, show.stderr);
    assert.match(show.stdout, /Single responsibility/);

    const json = run(["strategies", "list", "--format", "json"], { home });
    assert.equal(json.status, 0, json.stderr);
    const payload = JSON.parse(json.stdout);
    assert.ok(payload.count > 0);
    assert.ok(Array.isArray(payload.strategies));
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});

test("execute dry-run requires PROJECT_HOME and prints compile plan", () => {
  const home = mkdtempSync(join(tmpdir(), "yadra-cli-home-"));
  const kslHome = MINIMAL_KSL;
  const appHome = mkdtempSync(join(tmpdir(), "yadra-cli-app-"));
  const spec = join(
    kslHome,
    "services/order-service/modules/checkout/order-checkout.spec.ksl",
  );
  try {
    const added = run(
      [
        "project",
        "add",
        "exec-demo",
        "--ksl-project-home",
        kslHome,
        "--project-home",
        appHome,
      ],
      { home },
    );
    assert.equal(added.status, 0, added.stderr);

    const dry = run(
      ["execute", spec, "--dry-run", "--allow-unsealed", "--skip-llm"],
      { home },
    );
    assert.equal(dry.status, 0, dry.stderr);
    assert.match(dry.stdout, /T2 · plan "order-checkout"/);
    assert.match(dry.stdout, /PROJECT_HOME:/);
    assert.match(dry.stdout, /T2 · execute dry-run/);
    assert.match(dry.stdout, /phase\.gate: docs, e2e/);
    assert.match(dry.stdout, /basePackage:/);
    assert.match(dry.stdout, /file manifest:/);

    const homeNoProject = mkdtempSync(join(tmpdir(), "yadra-cli-home-noproj-"));
    const noApp = run(["execute", spec, "--dry-run", "--allow-unsealed"], {
      home: homeNoProject,
      kslProjectHome: kslHome,
    });
    rmSync(homeNoProject, { recursive: true, force: true });
    assert.equal(noApp.status, 2);
    assert.match(noApp.stderr, /PROJECT_HOME is required/);
  } finally {
    rmSync(home, { recursive: true, force: true });
    rmSync(appHome, { recursive: true, force: true });
  }
});

test("execute dry-run shows phase gate kinds and sandbox hint", () => {
  const home = mkdtempSync(join(tmpdir(), "yadra-cli-home-"));
  const appHome = mkdtempSync(join(tmpdir(), "yadra-cli-app-"));
  const spec = join(
    MINIMAL_KSL,
    "services/order-service/modules/checkout/order-checkout.spec.ksl",
  );
  try {
    run(
      [
        "project",
        "add",
        "exec-demo",
        "--ksl-project-home",
        MINIMAL_KSL,
        "--project-home",
        appHome,
      ],
      { home },
    );
    const result = run(
      ["execute", spec, "--dry-run", "--allow-unsealed"],
      { home },
    );
    assert.equal(result.status, 0);
    assert.match(result.stdout, /phase\.gate: docs, e2e/);
    assert.match(result.stdout, /gate kinds \(yadra gate\)/);
    assert.match(result.stdout, /max_repair_loops=5/);
  } finally {
    rmSync(home, { recursive: true, force: true });
    rmSync(appHome, { recursive: true, force: true });
  }
});

test("gate dry-run shows gate kinds and plan", () => {
  const home = mkdtempSync(join(tmpdir(), "yadra-cli-home-"));
  const appHome = mkdtempSync(join(tmpdir(), "yadra-cli-app-"));
  const spec = join(
    MINIMAL_KSL,
    "services/order-service/modules/checkout/order-checkout.spec.ksl",
  );
  try {
    run(
      [
        "project",
        "add",
        "gate-demo",
        "--ksl-project-home",
        MINIMAL_KSL,
        "--project-home",
        appHome,
      ],
      { home },
    );
    const result = run(
      ["gate", spec, "--dry-run", "--allow-unsealed", "--skip-llm"],
      { home },
    );
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /T2 · plan "order-checkout"/);
    assert.match(result.stdout, /kinds: docs, e2e/);
    assert.match(result.stdout, /T2 · gate dry-run/);
  } finally {
    rmSync(home, { recursive: true, force: true });
    rmSync(appHome, { recursive: true, force: true });
  }
});

test("execute rejects gate kinds in --kinds", () => {
  const home = mkdtempSync(join(tmpdir(), "yadra-cli-home-"));
  const appHome = mkdtempSync(join(tmpdir(), "yadra-cli-app-"));
  const spec = join(
    MINIMAL_KSL,
    "services/order-service/modules/checkout/order-checkout.spec.ksl",
  );
  try {
    run(
      [
        "project",
        "add",
        "gate-kind-demo",
        "--ksl-project-home",
        MINIMAL_KSL,
        "--project-home",
        appHome,
      ],
      { home },
    );
    const result = run(
      ["execute", spec, "--dry-run", "--kinds", "docs", "--allow-unsealed"],
      { home },
    );
    assert.equal(result.status, 2);
    assert.match(result.stderr, /outputs\.phase\.execute/);
  } finally {
    rmSync(home, { recursive: true, force: true });
    rmSync(appHome, { recursive: true, force: true });
  }
});

test("CLI rejects unsupported and conflicting flags", () => {
  const home = mkdtempSync(join(tmpdir(), "yadra-cli-home-"));
  try {
    const unsupported = run(
      ["formalize", ".", "--provider", "openai"],
      { home, kslProjectHome: MINIMAL_KSL },
    );
    assert.equal(unsupported.status, 2);
    assert.match(unsupported.stderr, /Unsupported flag/);

    const conflicting = run(
      ["formalize", ".", "--seal", "--no-seal"],
      { home, kslProjectHome: MINIMAL_KSL },
    );
    assert.equal(conflicting.status, 2);
    assert.match(conflicting.stderr, /cannot be used together/);
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});
