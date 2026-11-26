import { resolveSpecPath, runPlan } from "../runtime/ksl-lib.mjs";
import { distRoot } from "../runtime/distribution.mjs";
import { syncKslToolEnv, requireKslProjectHome } from "../config/load-projects.mjs";
import {
  llmFromWorkspace,
  requireLlmConfigured,
} from "../runtime/command-context.mjs";
import { runPlanWithAgent } from "../runtime/t2/phase-plan.mjs";

export async function cmdPlan(flags, positional, cwd, wsOptions = {}) {
  if (positional.length > 1) {
    console.error(`Unexpected argument: ${positional[1]}`);
    return 2;
  }
  if (!["human", "json"].includes(flags.format)) {
    console.error("--format must be human or json.");
    return 2;
  }
  const wsOpts = { ...wsOptions, seedPath: positional[0] ?? "." };
  syncKslToolEnv(cwd, wsOpts);
  let ws;
  try {
    ws = requireKslProjectHome(cwd, wsOpts);
  } catch (e) {
    console.error(e.message);
    return 2;
  }
  let spec;
  try {
    spec = resolveSpecPath(positional[0] ?? ".", cwd);
  } catch (e) {
    console.error(e.message);
    return 2;
  }

  const llm = llmFromWorkspace(ws);
  const llmErr = requireLlmConfigured(llm, {
    skipLlm: flags.skipLlm || flags.format === "json",
    commandLabel: "yadra plan (T2)",
  });
  if (llmErr) {
    console.error(llmErr);
    return 2;
  }

  try {
    if (flags.skipLlm || flags.format === "json") {
      runPlan(spec, {
        kinds: flags.kinds,
        format: flags.format,
        distRoot: distRoot(),
      });
    } else {
      await runPlanWithAgent(
        spec,
        { kinds: flags.kinds, format: flags.format },
        ws,
      );
    }
  } catch (e) {
    console.error(e.message ?? e);
    return 2;
  }
  return 0;
}
