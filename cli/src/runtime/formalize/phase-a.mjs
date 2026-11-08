import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chatCompletion } from "../llm/chat.mjs";
import { distRoot } from "../distribution.mjs";
import {
  loadStrategyCatalog,
  suggestStrategiesFromCatalog,
  inferOutputKinds,
  formatStrategyCandidates,
} from "../ksl-lib.mjs";
import {
  loadCommandContext,
  llmRuntime,
  logCommandContext,
} from "../command-context.mjs";
import {
  collectDocCorpus,
  readNeighborKslSnippets,
  buildComprendreMessages,
} from "./build-comprendre-prompt.mjs";
import { extractSingleCompact } from "./parse-llm-files.mjs";
import { primaryDeliverablePath } from "../../util/feature-yadra.mjs";

function loadText(path) {
  return readFileSync(path, "utf8");
}

export async function runPhaseAComprendre({
  docDir,
  ws,
  feature,
  tmpDir,
  compactFileName = "feature.compact.ksl",
}) {
  const ctx = loadCommandContext(ws, "formalize:A");
  const docCorpus = collectDocCorpus(docDir);
  const catalogPath = join(distRoot(), "yadra/strategies/catalog.yaml");
  const catalogYaml = loadText(catalogPath);
  const { strategies } = loadStrategyCatalog(distRoot());

  const kinds = inferOutputKinds(docCorpus);
  const suggested = suggestStrategiesFromCatalog(strategies, {
    corpus: docCorpus,
    kinds,
  });
  const strategyCandidates = formatStrategyCandidates(suggested);

  const primaryRel = primaryDeliverablePath(feature.outputPaths);
  const kslSnippets = readNeighborKslSnippets(
    ws.kslProjectHome,
    feature.outputPaths,
    primaryRel,
  );

  const compactPath = join(tmpDir, compactFileName);
  const planExcerpt = loadText(ctx.plan.path).split("# Sortie A → B")[0];

  const messages = buildComprendreMessages({
    systemPrompt: ctx.skill.system,
    skillBody: ctx.skill.skill,
    planExcerpt: `${planExcerpt}\n(plan tier: ${ctx.plan.tier})\n`,
    catalogYaml,
    strategyCandidates,
    inferredKinds: kinds,
    docCorpus,
    kslSnippets,
    paths: {
      kslProjectHome: ws.kslProjectHome,
      projectHome: ws.projectHome,
      compactPath,
    },
  });

  console.log("T1 formalize — A · COMPRENDRE (LLM + SKILL)");
  logCommandContext(ctx);
  console.log(`  kinds:   ${kinds.join(", ")}`);
  console.log(`  catalog suggestions: ${suggested.length}`);
  console.log("  calling LLM…");

  const raw = await chatCompletion({ ...llmRuntime(ctx.llm), messages });
  const compact = extractSingleCompact(raw);
  if (!compact) {
    throw new Error(
      "Réponse LLM invalide : attendu bloc commençant par '# deliverables'.",
    );
  }
  writeFileSync(compactPath, `${compact}\n`, "utf8");

  console.log("");
  console.log(`Compact écrit : ${compactPath}`);
  return { compactPath, suggestedCount: suggested.length };
}
