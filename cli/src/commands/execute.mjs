import { existsSync, statSync } from "node:fs";
import {
  formatPlanHuman,
  resolveSpecPath,
  runValidate,
} from "../runtime/ksl-lib.mjs";
import {
  requireKslProjectHome,
  syncKslToolEnv,
} from "../config/load-projects.mjs";
import {
  llmFromWorkspace,
  requireLlmConfigured,
} from "../runtime/command-context.mjs";
import { runPhaseBProduce } from "../runtime/t2/phase-produce.mjs";
import { runPhaseBRepair } from "../runtime/t2/phase-repair.mjs";
import { deterministicEdits, strategyFor } from "../runtime/t2/repair-strategy.mjs";
import { errorSignature, pathsCitedBySandbox, sandboxExcerpt } from "../runtime/t2/sandbox-errors.mjs";
import { materializeProjectFiles } from "../runtime/t2/phase-produce.mjs";
import { runProjectSandbox, sandboxLabel } from "../runtime/t2/phase-sandbox.mjs";
import { buildT2CompileContext } from "../runtime/t2/compile-context.mjs";
import { writeExecuteBundleEvidence } from "../runtime/t2/phase-livrer.mjs";
import { verifyT1Seal } from "../runtime/t2/seal-check.mjs";
import { logVerbose, logWrittenFiles } from "../util/log.mjs";

export async function cmdExecute(flags, positional, cwd, wsOptions = {}) {
  if (positional.length > 1) {
    console.error(`Unexpected argument: ${positional[1]}`);
    return 2;
  }
  if (flags.skipLlm && !flags.dryRun) {
    console.error("--skip-llm is only valid with --dry-run for yadra execute.");
    return 2;
  }
  const wsOpts = { ...wsOptions, seedPath: positional[0] ?? "." };
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
      "PROJECT_HOME is required for T2 B. Set repo.path in root.project.ksl, or pass --project-home / yadra project update.",
    );
    return 2;
  }
  if (!existsSync(ws.projectHome) || !statSync(ws.projectHome).isDirectory()) {
    console.error(`PROJECT_HOME does not exist or is not a directory: ${ws.projectHome}`);
    return 2;
  }

  let specPath;
  try {
    specPath = resolveSpecPath(positional[0] ?? ".", cwd);
  } catch (error) {
    console.error(error.message);
    return 2;
  }
  const validation = runValidate(specPath, {
    syntax: false,
    layout: false,
    semantic: true,
    format: "human",
  });
  if (!validation.ok) {
    console.error("execute aborted: semantic validation failed.");
    return 1;
  }

  const sealError = verifyT1Seal(ws, specPath);
  if (sealError && !flags.allowUnsealed) {
    console.error(`execute refused: ${sealError}`);
    console.error("Use --allow-unsealed only for local development.");
    return 1;
  }
  if (sealError) console.warn(`warning: ${sealError} (--allow-unsealed)`);

  const compileCtx = buildT2CompileContext(specPath, ws, {
    kinds: flags.kinds,
    phaseRole: "execute",
  });
  const { plan, bindings, fileManifest } = compileCtx;
  const gateKinds = plan.outputPhase?.gate ?? [];

  if (flags.kinds.length > 0) {
    const executePool = plan.outputPhase?.execute ?? plan.kinds;
    const unknown = flags.kinds.filter((kind) => !executePool.includes(kind));
    if (unknown.length > 0) {
      console.error(
        `Kinds not in outputs.phase.execute: ${unknown.join(", ")} (gate kinds: ${gateKinds.join(", ") || "none"})`,
      );
      return 2;
    }
  }
  if (plan.kinds.length === 0) {
    console.error(
      "No execute kinds (outputs.phase.execute). Gate-only specs use yadra gate.",
    );
    return 2;
  }
  if (plan.questions.length > 0) {
    console.error("execute aborted: unresolved strategies:");
    for (const question of plan.questions) console.error(`  - ${question}`);
    return 1;
  }

  const maxRepairLoops = Math.max(
    plan.budget?.max_repair_loops ?? 4,
    plan.budget?.max_iterations ?? 4,
  );
  const verifyByDefault = !flags.noVerify;

  if (flags.dryRun) {
    console.log("");
    console.log(formatPlanHuman(plan));
    console.log(`  PROJECT_HOME: ${ws.projectHome}`);
    console.log(`  basePackage: ${bindings.basePackage}`);
    console.log(`  file manifest: ${fileManifest.files.length} path(s)`);
    if (gateKinds.length > 0) {
      console.log(`  gate kinds (yadra gate): ${gateKinds.join(", ")}`);
    }
    console.log(
      verifyByDefault
        ? `  sandbox: ${sandboxLabel(bindings)} + repair loop (max_repair_loops=${maxRepairLoops})`
        : "  sandbox: skipped (--no-verify)",
    );
    if (flags.combined) console.log("  LLM pass: combined (all strategies)");
    if (flags.merge) console.log("  ownership: merge");
    console.log("T2 · execute dry-run: no file written.");
    return 0;
  }

  const llmError = requireLlmConfigured(llmFromWorkspace(ws), {
    skipLlm: false,
    commandLabel: "yadra execute (T2 · B)",
  });
  if (llmError) {
    console.error(llmError);
    return 2;
  }
  try {
    console.log(`execute ${plan.spec}`);
    if (flags.combined) logVerbose(flags, "  slice unique (strategies as constraints)");
    let result = await runPhaseBProduce({
      ws,
      specPath,
      deterministicPlan: plan,
      bindings,
      fileManifest,
      specialization: "",
      maxRepairLoops,
      combined: flags.combined === true,
      allowMerge: flags.merge === true,
      verbose: flags.verbose === true,
    });
    let producedPaths = result.files.map((f) => f.path);

    if (!verifyByDefault) {
      writeExecuteBundleEvidence(ws, specPath, {
        plan,
        verifyMode: "skipped",
        fileCount: result.files.length,
      });
      console.log("execute OK");
      return 0;
    }

    const label = sandboxLabel(bindings);
    let repairAttempt = 0;
    let previousSignature = "";
    let repeat = 0;
    for (;;) {
      console.log(`  ${label}`);
      const sandbox = runProjectSandbox(ws.projectHome, bindings);
      if (sandbox.skipped) {
        console.log(`  ${sandbox.reason}`);
        return 1;
      }
      if (sandbox.ok) {
        writeExecuteBundleEvidence(ws, specPath, {
          plan,
          verifyMode: sandbox.tool ?? "sandbox",
          fileCount: producedPaths.length,
        });
        console.log("execute OK");
        return 0;
      }
      const signature = errorSignature(sandbox.log);
      repeat = signature && signature === previousSignature ? repeat + 1 : 0;
      previousSignature = signature;
      if (repairAttempt >= maxRepairLoops) {
        console.log(`  code encore invalide après ${maxRepairLoops} réparations`);
        return 1;
      }
      repairAttempt += 1;
      const approach = strategyFor(sandbox.log, repeat);
      console.log(`  réparation ${approach.id}`);
      try {
        const cited = pathsCitedBySandbox(sandbox.log);
        let repaired = { files: [] };
        if (approach.deterministic) {
          const marked = deterministicEdits(ws.projectHome, sandbox.log, approach);
          if (marked.length > 0) {
              repaired = {
              files: materializeProjectFiles(ws.projectHome, marked, {
                specId: specPath,
                mode: "repair",
                errorPaths: cited,
                allowMerge: flags.merge === true,
              }),
            };
          }
        }
        if (repaired.files.length === 0) {
          repaired = await runPhaseBRepair({
            ws,
            specPath,
            bindings,
            specialization: "",
            sandboxLog: sandboxExcerpt(sandbox.log),
            testCommand: sandbox.label ?? label,
            producedPaths,
            errorPaths: cited,
            approach,
          });
        }
        logWrittenFiles(flags, repaired.files);
        for (const file of repaired.files) {
          if (!producedPaths.includes(file.path)) producedPaths.push(file.path);
        }
      } catch {
        // The next sandbox run shows whether the code is still invalid.
      }
    }
  } catch (error) {
    console.error(error.message ?? error);
    return 1;
  }
}
