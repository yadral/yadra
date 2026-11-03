#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { grammarPath, readGrammarVersion, resolveKslHome } from "../lib/ksl-home.mjs";
import { resolveSpecPath } from "../lib/paths.mjs";
import { runValidate } from "../lib/validate.mjs";
import { runPlan } from "../lib/plan.mjs";
import { runExecute } from "../lib/execute.mjs";
import { runGate } from "../lib/gate.mjs";
import { runSeal } from "../lib/seal.mjs";
import {
  contextSet,
  contextShow,
  contextClear,
  contextExport,
  resolveCommandPath,
  requireProjectRoot,
  resolveProjectRoot,
  ENV_PROJECT_ROOT,
} from "../lib/context.mjs";

function readManifestVersion() {
  try {
    const manifestPath = join(
      dirname(fileURLToPath(import.meta.url)),
      "../../../../manifest.mf",
    );
    const raw = readFileSync(manifestPath, "utf8");
    const m = raw.match(/^\s*version\s*[:=]\s*([^\s#]+)/im);
    if (m) return m[1].trim();
  } catch {
    // fallback
  }
  return "0.1.0";
}

const CLI_VERSION = readManifestVersion();

function usage() {
  console.error(`Yadra CLI v${CLI_VERSION} (monorepo stub — préférer yadra/cli packagé)

Usage:
  yadra version
  yadra doctor
  yadra context …          # legacy stub ; CLI packagé : yadra project
  yadra validate [PATH] [--syntax] [--layout] [--semantic] [--format human|json]
  yadra plan [SPEC.spec.ksl | .] [--kinds a,b] [--format human|json]
  yadra execute [SPEC.spec.ksl | .] [--allow-unsealed] [--kinds a,b] [--repair] [--dry-run]
  yadra gate [SPEC.spec.ksl | .] [--format human|json]
  yadra seal [SPEC.spec.ksl | .] [--syntax] [--include path,...]

PATH defaults to current directory (stub: context ou ${ENV_PROJECT_ROOT}). Packagé: yadra project.
KSL_HOME overrides grammar location.`);
}

function parseFlags(argv) {
  const flags = {
    syntax: false,
    layout: false,
    semantic: false,
    format: "human",
    kinds: [],
    allowUnsealed: false,
    repair: false,
    dryRun: false,
    include: [],
  };
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--syntax") flags.syntax = true;
    else if (a === "--layout") flags.layout = true;
    else if (a === "--semantic") flags.semantic = true;
    else if (a === "--allow-unsealed") flags.allowUnsealed = true;
    else if (a === "--repair") flags.repair = true;
    else if (a === "--dry-run") flags.dryRun = true;
    else if (a === "--format") flags.format = argv[++i] ?? "human";
    else if (a === "--kinds") flags.kinds = (argv[++i] ?? "").split(",").filter(Boolean);
    else if (a === "--include") flags.include = (argv[++i] ?? "").split(",").filter(Boolean);
    else if (a.startsWith("-")) {
      console.error(`Unknown flag: ${a}`);
      usage();
      process.exit(2);
    } else positional.push(a);
  }
  return { flags, positional };
}

function cmdVersion() {
  const home = resolveKslHome();
  const grammar = grammarPath();
  console.log(`yadra CLI: ${CLI_VERSION}`);
  console.log(`KSL_HOME: ${home}`);
  console.log(`grammar: ${grammar} (${existsSync(grammar) ? "found" : "missing"})`);
  console.log(`grammar version: ${readGrammarVersion() ?? "n/a"}`);
  const root = resolveProjectRoot();
  console.log(`${ENV_PROJECT_ROOT}: ${root ?? "(not set)"}`);
}

function cmdDoctor() {
  cmdVersion();
  console.log("");
  const node = process.version;
  console.log(`node: ${node}`);
  if (Number(node.replace("v", "").split(".")[0]) < 18) {
    console.error("warning: Node 18+ recommended");
  }
  console.log("vscode KSL extension: install manually (ksl/editor/ksl-vscode or VSIX release; ./scripts/install-ksl-editor.sh)");
}

function cmdContext(sub, arg, cwd) {
  if (sub === "set") {
    if (!arg) {
      console.error("Usage: yadra context set <path>");
      process.exit(2);
    }
    try {
      const record = contextSet(resolve(cwd, arg));
      console.log(`Context set: ${record.projectRoot}`);
      console.log(`  root file: ${record.rootProjectFile}`);
      console.log(`  project id: ${record.projectId}`);
      console.log("");
      console.log(`export ${ENV_PROJECT_ROOT}='${record.projectRoot}'`);
    } catch (e) {
      console.error(e.message);
      process.exit(1);
    }
    return;
  }
  if (sub === "show") {
    contextShow(cwd);
    return;
  }
  if (sub === "clear") {
    contextClear();
    return;
  }
  if (sub === "export") {
    contextExport();
    return;
  }
  console.error("Usage: yadra context set|show|clear|export");
  process.exit(2);
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  if (!cmd || cmd === "--help" || cmd === "-h") {
    usage();
    process.exit(cmd ? 0 : 2);
  }

  const cwd = process.cwd();

  if (cmd === "version") {
    cmdVersion();
    return;
  }
  if (cmd === "doctor") {
    cmdDoctor();
    return;
  }

  if (cmd === "context") {
    const [sub, pathArg] = rest;
    cmdContext(sub, pathArg, cwd);
    return;
  }

  const { flags, positional } = parseFlags(rest);
  const pathArg = positional[0];

  let target;
  try {
    target = resolveCommandPath(pathArg ?? ".", cwd);
  } catch (e) {
    console.error(e.message);
    process.exit(2);
  }

  if (cmd === "validate") {
    const r = runValidate(target, flags);
    process.exit(r.exitCode);
  }

  if (cmd === "plan" || cmd === "explain") {
    try {
      const spec = resolveSpecPath(pathArg ?? ".", cwd);
      runPlan(spec, flags);
    } catch (e) {
      console.error(e.message);
      process.exit(2);
    }
    return;
  }

  if (cmd === "execute" || cmd === "run" || cmd === "materialize") {
    try {
      const spec = resolveSpecPath(pathArg ?? ".", cwd);
      const code = runExecute(spec, flags);
      process.exit(code);
    } catch (e) {
      console.error(e.message);
      process.exit(2);
    }
  }

  if (cmd === "gate") {
    try {
      const spec = resolveSpecPath(pathArg ?? ".", cwd);
      process.exit(runGate(spec, flags));
    } catch (e) {
      console.error(e.message);
      process.exit(2);
    }
  }

  if (cmd === "seal") {
    try {
      const spec = resolveSpecPath(pathArg ?? ".", cwd);
      process.exit(
        runSeal(spec, {
          syntax: flags.syntax,
          layout: true,
          semantic: true,
          include: flags.include.map((p) => resolve(cwd, p)),
        }),
      );
    } catch (e) {
      console.error(e.message);
      process.exit(2);
    }
  }

  console.error(`Unknown command: ${cmd}`);
  usage();
  process.exit(2);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
