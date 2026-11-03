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
  loadCommandContext,
  logCommandContext,
  requireLlmConfigured,
} from "../runtime/command-context.mjs";
import { buildT2CompileContext } from "../runtime/t2/compile-context.mjs";
import { runPhaseCGateProduce } from "../runtime/t2/phase-gate-produce.mjs";
import { runConformanceGate } from "../runtime/t2/phase-livrer.mjs";
import { verifyT1Seal } from "../runtime/t2/seal-check.mjs";

function exitCodeForGateResult(result) {
  if (result === "SATISFIED") return 0;
  if (result === "VIOLATED") return 1;
  return 2;
}

export async function cmdGate(flags, positional, cwd, wsOptions = {}) {
  if (positional.length > 1) {
    console.error(`Unexpected argument: ${positional[1]}`);
    return 2;
  }
  if (flags.produce && flags.dryRun) {
    console.error("--produce cannot be used with --dry-run.");
    return 2;
  }
  if (flags.skipLlm && flags.produce) {
    console.error("--skip-llm cannot be used with --produce.");
    return 2;
  }
  if (flags.skipLlm && !flags.dryRun) {
    console.error("--skip-llm is only valid with --dry-run for yadra gate.");
    return 2;
  }
  if (!["human", "json"].includes(flags.format)) {
    console.error("--format must be human or json.");
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
      "PROJECT_HOME is required for T2 C. Configure --project-home with yadra project update.",
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
    console.error("gate aborted: semantic validation failed.");
    return 1;
  }

  const sealError = verifyT1Seal(ws, specPath);
  if (sealError && !flags.allowUnsealed) {
    console.error(`gate refused: ${sealError}`);
    console.error("Use --allow-unsealed only for local development.");
    return 1;
  }
  if (sealError) console.warn(`warning: ${sealError} (--allow-unsealed)`);

  const compileCtx = buildT2CompileContext(specPath, ws, {
    kinds: flags.kinds,
    phaseRole: "gate",
  });
  const { plan, bindings } = compileCtx;
  const executeKinds = plan.outputPhase?.execute ?? [];

  if (flags.kinds.length > 0) {
    const gatePool = plan.outputPhase?.gate ?? plan.kinds;
    const unknown = flags.kinds.filter((kind) => !gatePool.includes(kind));
    if (unknown.length > 0) {
      console.error(
        `Kinds not in outputs.phase.gate: ${unknown.join(", ")} (execute kinds: ${executeKinds.join(", ") || "none"})`,
      );
      return 2;
    }
  }
  if (plan.kinds.length === 0) {
    console.error(
      "No gate kinds (outputs.phase.gate). Execute-only specs use yadra execute.",
    );
    return 2;
  }
  if (plan.questions.length > 0) {
    console.error("gate aborted: unresolved strategies:");
    for (const question of plan.questions) console.error(`  - ${question}`);
    return 1;
  }

  if (flags.dryRun) {
    if (!flags.skipLlm) {
      const ctx = loadCommandContext(ws, "gate:C");
      console.log("T2 gate — C · LIVRER (dry-run · plan + SKILL)");
      logCommandContext(ctx);
    }
    console.log("");
    console.log(formatPlanHuman(plan));
    console.log(`  PROJECT_HOME: ${ws.projectHome}`);
    console.log(`  basePackage: ${bindings.basePackage}`);
    console.log(
      flags.produce
        ? "  (--produce ignored in dry-run)"
        : "  Conformance: manifest + docs/e2e paths under PROJECT_HOME",
    );
    console.log("T2 · gate dry-run: no file written.");
    return 0;
  }

  if (flags.produce) {
    const llmError = requireLlmConfigured(llmFromWorkspace(ws), {
      skipLlm: false,
      commandLabel: "yadra gate --produce (T2 · C)",
    });
    if (llmError) {
      console.error(llmError);
      return 2;
    }
    try {
      console.log("");
      console.log(`T2 · gate · LIVRER "${plan.spec}"`);
      console.log(`  gate kinds: ${plan.kinds.join(", ")}`);
      console.log(`  PROJECT_HOME: ${ws.projectHome}`);
      const produced = await runPhaseCGateProduce({
        ws,
        specPath,
        deterministicPlan: plan,
      });
      console.log(`  gate produce: ${produced.files.length} file(s)`);
      for (const file of produced.files) console.log(`    ${file.path}`);
    } catch (error) {
      console.error(error.message ?? error);
      return 1;
    }
  } else {
    console.log("");
    console.log(`T2 · gate · LIVRER "${plan.spec}" (conformance)`);
    console.log(`  gate kinds: ${plan.kinds.join(", ")}`);
  }

  const outcome = runConformanceGate({
    ws,
    specPath,
    plan,
    allowNoExecute: flags.allowNoExecute,
  });

  if (flags.format === "json") {
    console.log(JSON.stringify(outcome, null, 2));
  } else {
    console.log(`Conformance Gate: ${outcome.result}`);
    console.log(`  spec: ${outcome.spec}`);
    console.log(`  manifest: ${outcome.manifestPath}`);
    console.log(`  ${outcome.detail}`);
  }

  return exitCodeForGateResult(outcome.result);
}
