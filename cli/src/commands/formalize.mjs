import { existsSync, mkdirSync, statSync } from "node:fs";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { runSeal, runValidate } from "../runtime/ksl-lib.mjs";
import { requireKslProjectHome, syncKslToolEnv } from "../config/load-projects.mjs";
import {
  hasDeliverableOutputPaths,
  primaryDeliverablePath,
  loadFeatureYadra,
} from "../util/feature-yadra.mjs";
import { printAbOrchestration } from "../util/formalize-contract.mjs";
import { runPhaseAComprendre } from "../runtime/formalize/phase-a.mjs";
import { runPhaseBProduire } from "../runtime/formalize/phase-b.mjs";
import { ensureLayoutForSpecOutput } from "../runtime/formalize/ensure-layout.mjs";
import { deliverablesNeedAbPhases } from "../runtime/formalize/deliverable-regen.mjs";
import {
  llmFromWorkspace,
  requireLlmConfigured,
  loadCommandContext,
  logCommandContext,
} from "../runtime/command-context.mjs";

function kslFilesFromFeature(kslRoot, feature) {
  const paths = [];
  const seen = new Set();
  for (const key of ["root", "module", "spec"]) {
    const outputPath = feature.outputPaths[key];
    if (!outputPath) continue;
    if (isAbsolute(outputPath)) {
      throw new Error(`output_paths.${key} must be relative: ${outputPath}`);
    }
    const absolute = resolve(kslRoot, outputPath);
    const fromRoot = relative(kslRoot, absolute);
    if (fromRoot === ".." || fromRoot.startsWith(`..${sep}`)) {
      throw new Error(
        `output_paths.${key} escapes KSL_PROJECT_HOME: ${outputPath}`,
      );
    }
    if (seen.has(absolute)) continue;
    seen.add(absolute);
    paths.push(absolute);
  }
  return paths;
}

function runPhaseC(flags, cwd, ws, feature, files) {
  const ctx = loadCommandContext(ws, "formalize:C");
  console.log("T1 formalize — C · LIVRER (validate / seal)");
  logCommandContext(ctx);
  console.log("");

  const validateOpts = {
    syntax: flags.syntax,
    layout: true,
    semantic: true,
    format: "human",
  };

  for (const file of files) {
    console.log(`validate ${file}`);
    const r = runValidate(file, validateOpts);
    if (r.exitCode !== 0) return r.exitCode;
  }

  if (flags.noSeal || !flags.seal) {
    console.log("Validation OK (--no-seal: pas de scellement).");
    return 0;
  }

  const sealRel = primaryDeliverablePath(feature.outputPaths);
  const specAbs = resolve(ws.kslProjectHome, sealRel);
  const include = flags.include.map((p) => resolve(cwd, p));
  const missingInclude = include.filter((p) => !existsSync(p));
  if (missingInclude.length > 0) {
    for (const path of missingInclude) {
      console.error(`seal: include file not found: ${path}`);
    }
    return 2;
  }
  const invalidInclude = include.filter(
    (p) => !p.endsWith(".ksl") || !statSync(p).isFile(),
  );
  if (invalidInclude.length > 0) {
    for (const path of invalidInclude) {
      console.error(`seal: include is not a .ksl file: ${path}`);
    }
    return 2;
  }
  console.log(`seal ${specAbs}`);
  return runSeal(specAbs, {
    syntax: flags.syntax,
    layout: true,
    semantic: true,
    include,
  });
}

export async function cmdFormalize(flags, positional, cwd, wsOptions = {}) {
  const docArg = positional[0];
  if (!docArg) {
    console.error("Usage: yadra formalize <dossier-documents> [options]");
    return 2;
  }
  if (positional.length > 1) {
    console.error(`Unexpected argument: ${positional[1]}`);
    return 2;
  }

  syncKslToolEnv(cwd, wsOptions);
  let ws;
  try {
    ws = requireKslProjectHome(cwd, wsOptions);
  } catch (e) {
    console.error(e.message);
    return 2;
  }
  const docDir = resolve(cwd, docArg);
  const featurePath = join(docDir, "feature.yadra.md");
  if (!existsSync(featurePath)) {
    console.error(`Missing ${featurePath}`);
    return 1;
  }

  let feature;
  try {
    feature = loadFeatureYadra(docDir);
  } catch (e) {
    console.error(e.message);
    return 1;
  }

  if (!hasDeliverableOutputPaths(feature.outputPaths)) {
    console.error(
      "feature.yadra.md: au moins un output_paths (root, module ou spec) est requis.",
    );
    return 1;
  }

  let files;
  try {
    files = kslFilesFromFeature(ws.kslProjectHome, feature);
  } catch (e) {
    console.error(e.message);
    return 1;
  }
  const llm = llmFromWorkspace(ws);
  const llmErr = requireLlmConfigured(llm, {
    skipLlm: flags.skipLlm,
    commandLabel: "formalize (T1)",
  });
  if (llmErr) {
    console.error(llmErr);
    return 2;
  }

  const { need: needAb, reason: needAbReason } = deliverablesNeedAbPhases({
    kslRoot: ws.kslProjectHome,
    feature,
    files,
    flags,
  });

  if (needAb) {
    if (needAbReason && needAbReason !== "--force") {
      console.log(`T1 formalize — A+B (${needAbReason})`);
    }
    const runId =
      process.env.YADRA_FORMALIZE_RUN_ID ??
      `formalize-${new Date().toISOString().replace(/[:.]/g, "-")}`;
    const tmpDir = resolve(ws.kslProjectHome, ".yadra", "tmp", runId);
    mkdirSync(tmpDir, { recursive: true });

    if (flags.skipLlm) {
      const missing = files.filter((f) => !existsSync(f));
      printAbOrchestration({
        docDir,
        kslProjectHome: ws.kslProjectHome,
        yadraProjectHome: ws.yadraProjectHome,
        llm,
        runId,
      });
      console.error("");
      if (missing.length > 0) {
        console.error("Livrables KSL absents :");
        for (const f of missing) console.error(`  - ${f}`);
      } else {
        console.error("Relance A+B demandée (--force / --refresh / module stub) ; pas de --skip-llm.");
      }
      return 1;
    }

    if (flags.ensureLayout && feature.outputPaths.spec) {
      const layout = ensureLayoutForSpecOutput(
        ws.kslProjectHome,
        feature.outputPaths.spec,
      );
      if (layout.created) {
        console.log(`layout: created ${layout.path}`);
      }
    }

    try {
      const { compactPath } = await runPhaseAComprendre({
        docDir,
        ws,
        feature,
        tmpDir,
      });
      await runPhaseBProduire({
        ws,
        compactPath,
        outputPaths: feature.outputPaths,
      });
    } catch (e) {
      console.error(e.message ?? e);
      return 2;
    }

    files = kslFilesFromFeature(ws.kslProjectHome, feature);
    const stillMissing = files.filter((f) => !existsSync(f));
    if (stillMissing.length > 0) {
      console.error("");
      console.error("KSL encore absents après A+B :");
      for (const f of stillMissing) console.error(`  - ${f}`);
      return 1;
    }
  }

  return runPhaseC(flags, cwd, ws, feature, files);
}
