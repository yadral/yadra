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
import { runProjectSandbox } from "../runtime/t2/phase-sandbox.mjs";
import { producePlanSpecialization } from "../runtime/t2/phase-plan.mjs";
import { buildT2CompileContext } from "../runtime/t2/compile-context.mjs";
import { writeExecuteBundleEvidence } from "../runtime/t2/phase-livrer.mjs";
import { verifyT1Seal } from "../runtime/t2/seal-check.mjs";

export async function cmdExecute(flags, positional, cwd, wsOptions = {}) {
  if (positional.length > 1) {
    console.error(`Unexpected argument: ${positional[1]}`);
    return 2;
  }
  if (flags.skipLlm && !flags.dryRun) {
    console.error("--skip-llm is only valid with --dry-run for yadra execute.");
    return 2;
  }
  syncKslToolEnv(cwd, wsOptions);
  let ws;
  try {
    ws = requireKslProjectHome(cwd, wsOptions);
  } catch (error) {
    console.error(error.message);
    return 2;
  }
  if (!ws.projectHome) {
    console.error(
      "PROJECT_HOME is required for T2 B. Configure --project-home with yadra project update.",
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

  const maxRepairLoops = plan.budget?.max_repair_loops ?? 5;
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
        ? `  sandbox: gradle test + repair loop (max_repair_loops=${maxRepairLoops})`
        : "  sandbox: skipped (--no-verify)",
    );
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
    console.log("");
    console.log(`T2 · execute · PRODUIRE "${plan.spec}"`);
    console.log(`  execute kinds: ${plan.kinds.join(", ")}`);
    if (gateKinds.length > 0) {
      console.log(`  gate kinds (yadra gate): ${gateKinds.join(", ")}`);
    }
    console.log(`  PROJECT_HOME: ${ws.projectHome}`);
    console.log(`  basePackage: ${bindings.basePackage}`);
    console.log(`  manifest: ${fileManifest.files.length} file(s), ${plan.strategies.length} strategies`);
    console.log("  T2 · A spécialisation (mémoire, sans écriture KSL)…");
    const { specialization } = await producePlanSpecialization(
      specPath,
      { kinds: flags.kinds, phaseRole: "execute" },
      ws,
    );
    console.log("  calling LLM (one pass per strategy)…");
    let result = await runPhaseBProduce({
      ws,
      specPath,
      deterministicPlan: plan,
      bindings,
      fileManifest,
      specialization,
      maxRepairLoops,
    });
    let producedPaths = result.files.map((f) => f.path);
    console.log(`  files: ${result.files.length}`);
    for (const file of result.files) console.log(`    ${file.path}`);

    if (!verifyByDefault) {
      const manifestPath = writeExecuteBundleEvidence(ws, specPath, {
        plan,
        verifyMode: "skipped",
        fileCount: result.files.length,
      });
      console.log(`  bundle evidence: ${manifestPath}`);
      console.log("T2 · execute OK (produce only, --no-verify).");
      return 0;
    }

    let repairAttempt = 0;
    for (;;) {
      console.log("");
      console.log("T2 · execute · sandbox (gradle test)…");
      const sandbox = runProjectSandbox(ws.projectHome, bindings);
      if (sandbox.skipped) {
        console.error(`sandbox skipped: ${sandbox.reason}`);
        console.error("Fix PROJECT_HOME / stack or use --no-verify.");
        return 1;
      }
      if (sandbox.ok) {
        const manifestPath = writeExecuteBundleEvidence(ws, specPath, {
          plan,
          verifyMode: "gradle",
          fileCount: producedPaths.length,
        });
        console.log(`  bundle evidence: ${manifestPath}`);
        console.log("T2 · execute OK (sandbox passed).");
        return 0;
      }
      console.error(`sandbox failed: ${sandbox.reason ?? "unknown"}`);
      if (sandbox.log) {
        console.error("");
        console.error(sandbox.log);
      }
      if (repairAttempt >= maxRepairLoops) {
        console.error("");
        console.error(
          `Repair budget exhausted (max_repair_loops=${maxRepairLoops}).`,
        );
        return 1;
      }
      repairAttempt += 1;
      console.log("");
      console.log(`T2 · execute · repair ${repairAttempt}/${maxRepairLoops}…`);
      const repaired = await runPhaseBRepair({
        ws,
        specPath,
        bindings,
        specialization,
        sandboxLog: sandbox.log,
        producedPaths,
      });
      for (const file of repaired.files) {
        console.log(`    updated ${file.path}`);
        if (!producedPaths.includes(file.path)) producedPaths.push(file.path);
      }
    }
  } catch (error) {
    console.error(error.message ?? error);
    return 1;
  }
}
