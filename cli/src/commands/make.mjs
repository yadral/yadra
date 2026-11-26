import { existsSync, statSync } from "node:fs";
import { relative } from "node:path";
import { cmdFormalize } from "./formalize.mjs";
import { cmdExecute } from "./execute.mjs";
import { cmdGate } from "./gate.mjs";
import {
  requireKslProjectHome,
  syncKslToolEnv,
} from "../config/load-projects.mjs";
import { discoverMakeGraph, makeSteps } from "../runtime/make/discover.mjs";
import { verifyT1Seal } from "../runtime/t2/seal-check.mjs";
import { readBundleManifest } from "../runtime/t2/phase-livrer.mjs";

function rel(root, path) {
  return path ? relative(root, path).replaceAll("\\", "/") : "";
}

function executeIsFresh(ws, specPath) {
  if (verifyT1Seal(ws, specPath)) return false;
  const { manifest } = readBundleManifest(ws, specPath);
  const status = manifest?.execute?.status;
  return status === "OK" || status === "OK_NO_VERIFY";
}

function printGraph(graph, steps, ws, flags, combined, merge) {
  const ksl = ws.kslProjectHome;
  const extras = [
    combined ? "combined" : null,
    merge ? "merge" : null,
    flags.noGate ? "no-gate" : null,
  ].filter(Boolean);
  console.log(
    `yadra make — ${graph.features.length} features, ${graph.specs.length} specs · ${steps.step}${extras.length ? ` · ${extras.join(" · ")}` : ""}`,
  );
  if (!flags.verbose && !flags.dryRun) return;
  console.log(`  search: ${graph.search}`);
  for (const feature of graph.features) {
    console.log(`    [${feature.rank}] ${rel(ksl, feature.dir) || feature.dir} → ${feature.deliverable}`);
  }
  for (const spec of graph.specs) {
    console.log(`    ${rel(ksl, spec) || spec}`);
  }
}

export async function cmdMake(flags, positional, cwd, wsOptions = {}) {
  if (positional.length > 1) {
    console.error(`Unexpected argument: ${positional[1]}`);
    return 2;
  }
  if (flags.skipLlm && !flags.dryRun) {
    console.error("--skip-llm is only valid with --dry-run for yadra make.");
    return 2;
  }

  let steps;
  try {
    steps = makeSteps(flags);
  } catch (error) {
    console.error(error.message);
    return 2;
  }

  const seedPath = positional[0] ?? ".";
  const wsOpts = { ...wsOptions, seedPath };
  syncKslToolEnv(cwd, wsOpts);
  let ws;
  try {
    ws = requireKslProjectHome(cwd, wsOpts);
  } catch (error) {
    console.error(error.message);
    return 2;
  }
  if (!ws.projectHome) {
    console.error(
      "PROJECT_HOME is required for yadra make. Set repo.path in root.project.ksl, or pass --project-home / yadra project update.",
    );
    return 2;
  }
  if (!existsSync(ws.projectHome) || !statSync(ws.projectHome).isDirectory()) {
    console.error(`PROJECT_HOME does not exist or is not a directory: ${ws.projectHome}`);
    return 2;
  }

  let graph;
  try {
    graph = discoverMakeGraph(seedPath, cwd, ws);
  } catch (error) {
    console.error(error.message);
    return 1;
  }

  if (graph.features.length === 0 && graph.specs.length === 0) {
    console.error("yadra make: no feature.yadra.md and no .spec.ksl under the given path.");
    return 1;
  }

  const combined = !flags.noCombined;
  const merge = !flags.noMerge;
  const childFlags = {
    ...flags,
    combined,
    merge,
    seal: flags.noSeal ? false : flags.seal !== false,
  };

  if (flags.format === "json") {
    console.log(
      JSON.stringify(
        {
          search: graph.search,
          step: steps.step,
          combined,
          merge,
          features: graph.features,
          specs: graph.specs,
        },
        null,
        2,
      ),
    );
    if (flags.dryRun) return 0;
  } else {
    printGraph(graph, steps, ws, flags, combined, merge);
  }

  if (flags.dryRun && flags.skipLlm && !steps.doExecute && !steps.doGate) {
    console.log("make dry-run: no command invoked.");
    return 0;
  }

  if (steps.doT1 && !flags.dryRun) {
    for (const feature of graph.features) {
      console.log(`make T1 ${rel(ws.kslProjectHome, feature.dir) || feature.dir}`);
      const code = await cmdFormalize(childFlags, [feature.dir], cwd, wsOptions);
      if (code !== 0) return code;
    }
  } else if (steps.doT1 && flags.dryRun) {
    console.log("make T1 dry-run: formalize skipped.");
  }

  for (const spec of graph.specs) {
    const specRel = rel(ws.kslProjectHome, spec) || spec;
    if (steps.doExecute) {
      const skipFresh = !flags.force && !flags.dryRun && executeIsFresh(ws, spec);
      if (skipFresh) {
        console.log(`make T2 skip execute (fresh) ${specRel}`);
      } else {
        console.log(`make T2 execute ${specRel}`);
        const code = await cmdExecute(childFlags, [spec], cwd, wsOptions);
        if (code !== 0) return code;
      }
    }
    if (steps.doGate) {
      console.log(`make T2 gate ${specRel}`);
      const code = await cmdGate(childFlags, [spec], cwd, wsOptions);
      if (code !== 0) return code;
    }
  }

  if (!flags.dryRun) console.log("make OK");
  else console.log("make dry-run OK");
  return 0;
}
