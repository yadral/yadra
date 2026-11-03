import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { specIdFromPath } from "./paths.mjs";

function findProjectRoot(specPath) {
  let dir = dirname(specPath);
  for (let i = 0; i < 12; i++) {
    if (existsSync(join(dir, ".yadra"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return dirname(specPath);
}

export function runGate(specPath, options) {
  const specId = specIdFromPath(specPath);
  const manifestPath = join(
    findProjectRoot(specPath),
    ".yadra",
    "bundles",
    specId,
    "manifest.json",
  );

  let result = "UNDECIDABLE";
  let detail = "no manifest found — run yadra execute first";

  if (existsSync(manifestPath)) {
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    result = manifest.gate ?? "UNDECIDABLE";
    detail = manifest.note ?? manifestPath;
  }

  if (options.format === "json") {
    console.log(JSON.stringify({ spec: specId, result, manifestPath, detail }, null, 2));
  } else {
    console.log(`Conformance Gate: ${result}`);
    console.log(`  spec: ${specId}`);
    console.log(`  ${detail}`);
  }

  return result === "SATISFIED" ? 0 : result === "VIOLATED" ? 1 : 2;
}
