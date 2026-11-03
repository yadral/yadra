import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { runValidate } from "./validate.mjs";
import { runPlan } from "./plan.mjs";
import { specIdFromPath } from "./paths.mjs";
import { readFileSync } from "node:fs";
import { extractSpecMeta } from "./spec-extract.mjs";

export function runExecute(specPath, options) {
  const v = runValidate(specPath, {
    syntax: true,
    layout: false,
    semantic: true,
    format: "human",
  });
  if (!v.ok) {
    console.error("execute aborted: run yadra validate --semantic on this spec first.");
    return 1;
  }

  const meta = extractSpecMeta(readFileSync(specPath, "utf8"));
  const specId = specIdFromPath(specPath);
  const projectRoot = findProjectRoot(specPath);

  if (!options.allowUnsealed) {
    const sealPath = join(projectRoot, ".yadra", "sealed", `${specId}.json`);
    if (!existsSync(sealPath)) {
      console.error(
        `execute refused: no T1 seal at ${sealPath}. Use --allow-unsealed for local dev.`,
      );
      return 1;
    }
  }

  if (options.dryRun) {
    runPlan(specPath, { kinds: options.kinds, format: options.format });
    return 0;
  }

  const kinds =
    options.kinds?.length > 0
      ? meta.kinds.filter((k) => options.kinds.includes(k))
      : meta.kinds;

  const maxLoops = meta.budget.max_repair_loops ?? 5;
  const maxIter = meta.budget.max_iterations ?? 8;

  console.log(`Executing spec "${specId}" (kinds: ${kinds.join(", ")})`);
  console.log(`  budget: max_repair_loops=${maxLoops}, max_iterations=${maxIter}`);
  if (options.repair) console.log("  repair loop: enabled (bounded by budget)");

  const bundleDir = join(projectRoot, ".yadra", "bundles", specId);
  mkdirSync(bundleDir, { recursive: true });

  const manifest = {
    spec: specId,
    specPath,
    kinds,
    status: "SIMULATED",
    gate: "SATISFIED",
    note: "MVP stub — no real artifacts generated yet",
    timestamp: new Date().toISOString(),
  };
  writeFileSync(join(bundleDir, "manifest.json"), JSON.stringify(manifest, null, 2));

  console.log(`  manifest written: ${join(bundleDir, "manifest.json")}`);
  console.log("  Gate (stub): SATISFIED");
  return 0;
}

function findProjectRoot(specPath) {
  let dir = dirname(specPath);
  for (let i = 0; i < 12; i++) {
    if (existsSync(join(dir, ".git")) || existsSync(join(dir, ".yadra"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return dirname(specPath);
}
