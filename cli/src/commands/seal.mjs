import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { resolveKslDeliverablePath, runSeal } from "../runtime/ksl-lib.mjs";
import {
  syncKslToolEnv,
  requireKslProjectHome,
} from "../config/load-projects.mjs";
import {
  llmFromWorkspace,
  requireLlmConfigured,
  loadCommandContext,
  logCommandContext,
} from "../runtime/command-context.mjs";

export async function cmdSeal(flags, positional, cwd, wsOptions = {}) {
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

  const llm = llmFromWorkspace(ws);
  const llmErr = requireLlmConfigured(llm, {
    skipLlm: flags.skipLlm,
    commandLabel: "yadra seal (T1 · C context)",
  });
  if (llmErr) {
    console.error(llmErr);
    return 2;
  }

  if (!flags.skipLlm) {
    const ctx = loadCommandContext(ws, "seal");
    console.log("T1 · seal — SKILL + plan validate (C · LIVRER)");
    logCommandContext(ctx);
    console.log("");
  }

  let spec;
  try {
    spec = resolveKslDeliverablePath(positional[0] ?? ".", cwd);
  } catch (e) {
    console.error(e.message);
    if (/Not a KSL deliverable|\.spec \/ \.module/i.test(e.message)) {
      console.error("Tip: pour .project.ksl / .module.ksl, utilisez aussi : yadra formalize <dossier>");
    }
    return 2;
  }
  const include = flags.include.map((p) => resolve(cwd, p));
  const missing = include.filter((p) => !existsSync(p));
  if (missing.length > 0) {
    for (const path of missing) console.error(`seal: include file not found: ${path}`);
    return 2;
  }
  const invalid = include.filter(
    (p) => !p.endsWith(".ksl") || !statSync(p).isFile(),
  );
  if (invalid.length > 0) {
    for (const path of invalid) console.error(`seal: include is not a .ksl file: ${path}`);
    return 2;
  }
  return runSeal(spec, {
    syntax: flags.syntax,
    layout: true,
    semantic: true,
    include,
  });
}
