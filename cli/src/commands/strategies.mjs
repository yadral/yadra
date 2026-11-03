import { readFileSync } from "node:fs";
import { distRoot } from "../runtime/distribution.mjs";
import {
  runStrategiesList,
  runStrategiesShow,
  loadStrategyCatalog,
} from "../runtime/ksl-lib.mjs";
import { chatCompletion } from "../runtime/llm/chat.mjs";
import {
  loadCommandContext,
  llmRuntime,
  logCommandContext,
  requireLlmConfigured,
  llmFromWorkspace,
} from "../runtime/command-context.mjs";
import { syncKslToolEnv, requireKslProjectHome } from "../config/load-projects.mjs";

function findStrategy(distRootPath, query) {
  const { strategies } = loadStrategyCatalog(distRootPath);
  const q = query.toLowerCase();
  return (
    strategies.find((s) => s.id.toLowerCase() === q) ??
    strategies.find((s) => s.name.toLowerCase() === q) ??
    strategies.find((s) => s.name.toLowerCase().includes(q))
  );
}

export async function cmdStrategies(sub, positional, flags, cwd, wsOptions = {}) {
  const format = flags.format ?? "human";
  if (!["human", "json"].includes(format)) {
    console.error("--format must be human or json.");
    return 2;
  }

  const command = sub ?? "list";

  if (command === "list") {
    if (positional.length > 0) {
      console.error(`Unexpected argument: ${positional[0]}`);
      return 2;
    }
    try {
      runStrategiesList(distRoot(), {
        format,
        family: flags.family,
        role: flags.role,
        section: flags.section,
        includeHints: flags.hints,
      });
    } catch (e) {
      console.error(e.message ?? e);
      return 2;
    }
    return 0;
  }

  if (command === "show") {
    const query = positional[0];
    if (!query) {
      console.error("Usage: yadra strategies show <id|name>");
      return 2;
    }
    if (positional.length > 1) {
      console.error(`Unexpected argument: ${positional[1]}`);
      return 2;
    }
    try {
      runStrategiesShow(distRoot(), query, { format });
    } catch (e) {
      console.error(e.message ?? e);
      return 2;
    }
    return 0;
  }

  if (command === "explain") {
    const query = positional[0];
    if (!query) {
      console.error("Usage: yadra strategies explain <id|name> [feature context…]");
      return 2;
    }
    syncKslToolEnv(cwd, wsOptions);
    let ws;
    try {
      ws = requireKslProjectHome(cwd, wsOptions);
    } catch {
      ws = { yadraProjectHome: distRoot() };
    }
    const llm = llmFromWorkspace(ws);
    const llmErr = requireLlmConfigured(llm, {
      skipLlm: flags.skipLlm,
      commandLabel: "yadra strategies explain (T2)",
    });
    if (llmErr) {
      console.error(llmErr);
      return 2;
    }
    const entry = findStrategy(distRoot(), query);
    if (!entry) {
      console.error(`Strategy not found in catalog: ${query}`);
      return 2;
    }
    const ctx = loadCommandContext(ws, "strategies:reference");
    const catalogYaml = readFileSync(
      `${distRoot()}/yadra/strategies/catalog.yaml`,
      "utf8",
    );
    const featureContext = positional.slice(1).join(" ") || "(non fourni)";

    console.log("T2 · strategies explain (LLM + SKILL + plan validate)");
    logCommandContext(ctx);
    console.log("  calling LLM…");

    const messages = [
      { role: "system", content: ctx.skill.system.trim() },
      {
        role: "user",
        content: [
          "Explique comment appliquer cette strategy sur la feature.",
          `Strategy: ${JSON.stringify(entry)}`,
          `Contexte feature: ${featureContext}`,
          "Catalogue (extrait):",
          catalogYaml.slice(0, 50_000),
          "SKILL:",
          ctx.skill.skill,
        ].join("\n\n"),
      },
    ];
    try {
      const text = await chatCompletion({ ...llmRuntime(llm), messages });
      console.log("");
      console.log(text.trim());
    } catch (e) {
      console.error(e.message ?? e);
      return 2;
    }
    return 0;
  }

  console.error(`Unknown strategies subcommand: ${command}`);
  return 2;
}
