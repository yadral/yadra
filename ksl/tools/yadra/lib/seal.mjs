import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { readGrammarVersion } from "./ksl-home.mjs";
import { specIdFromPath } from "./paths.mjs";
import { validateL0 } from "./validate-l0.mjs";
import { validateL1 } from "./validate-l1.mjs";
import { validateL2 } from "./validate-l2.mjs";
import { validateL3 } from "./validate-l3.mjs";

const CLI_VERSION = "0.1.0";

/** Prefer KSL monorepo root (docfirst + ksl, or .yadra/context.json) over outer .git. */
function findKslProjectHome(specPath) {
  let dir = dirname(resolve(specPath));
  for (let i = 0; i < 20; i++) {
    if (existsSync(join(dir, ".yadra", "context.json"))) return dir;
    if (existsSync(join(dir, "docfirst")) && existsSync(join(dir, "ksl"))) return dir;
    if (existsSync(join(dir, "root.project.ksl"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  let fallback = dirname(resolve(specPath));
  for (let i = 0; i < 16; i++) {
    if (existsSync(join(fallback, ".git")) || existsSync(join(fallback, ".yadra"))) {
      return fallback;
    }
    const parent = dirname(fallback);
    if (parent === fallback) break;
    fallback = parent;
  }
  return dirname(resolve(specPath));
}

function discoverSealFiles(specPath) {
  const abs = resolve(specPath);
  const files = [abs];
  const text = readFileSync(abs, "utf8");
  const mod = text.match(/^\s*module\s*=\s*"([^"]+)"/m);
  if (mod) {
    const moduleFile = join(dirname(abs), `${mod[1]}.module.ksl`);
    if (existsSync(moduleFile)) files.unshift(moduleFile);
  }
  return [...new Set(files)];
}

function validateFileQuiet(path, { syntax, layout, semantic }) {
  const errors = [...validateL0(path)];
  if (syntax) errors.push(...validateL1(path));
  if (layout) errors.push(...validateL2(path));
  if (semantic) errors.push(...validateL3(path));
  return errors;
}

function sha256File(path) {
  const buf = readFileSync(path);
  return createHash("sha256").update(buf).digest("hex");
}

/**
 * T1 · C — validate then write .yadra/sealed/<spec-id>.json
 */
export function runSeal(specPath, options = {}) {
  const absSpec = resolve(specPath);
  if (!existsSync(absSpec)) {
    console.error(`seal: file not found: ${absSpec}`);
    return 1;
  }

  const include = (options.include ?? []).map((p) => resolve(p));
  const files = [
    ...new Set([...discoverSealFiles(absSpec), ...include]),
  ].filter((p) => existsSync(p));

  const vopts = {
    syntax: Boolean(options.syntax),
    layout: options.layout !== false,
    semantic: options.semantic !== false,
  };

  let failed = false;
  for (const path of files) {
    const errors = validateFileQuiet(path, vopts);
    if (errors.length) {
      failed = true;
      console.error(`${path}:`);
      for (const e of errors) console.error(`  - ${e}`);
    }
  }
  if (failed) {
    console.error("\nseal aborted: fix validation errors (return to B · PRODUIRE).");
    return 1;
  }

  const projectRoot = findKslProjectHome(absSpec);
  const specId = specIdFromPath(absSpec);
  const levels = ["L0"];
  if (vopts.syntax) levels.push("L1");
  if (vopts.layout) levels.push("L2");
  if (vopts.semantic) levels.push("L3");

  const record = {
    timeline: "T1",
    phase: "C",
    specId,
    specPath: relative(projectRoot, absSpec),
    kslProjectHome: projectRoot,
    files: files.map((path) => ({
      path: relative(projectRoot, path),
      sha256: sha256File(path),
    })),
    validator: {
      yadraCli: CLI_VERSION,
      grammarVersion: readGrammarVersion() ?? "unknown",
      levels,
    },
    sealedAt: new Date().toISOString(),
  };

  const sealDir = join(projectRoot, ".yadra", "sealed");
  mkdirSync(sealDir, { recursive: true });
  const sealPath = join(sealDir, `${specId}.json`);
  writeFileSync(sealPath, `${JSON.stringify(record, null, 2)}\n`);

  console.log(`T1 seal written: ${sealPath}`);
  console.log(`  spec: ${record.specPath}`);
  console.log(`  files: ${record.files.map((f) => f.path).join(", ")}`);
  console.log(`  validator: ${levels.join("+")}`);
  return 0;
}
