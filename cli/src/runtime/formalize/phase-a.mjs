import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
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
import { logVerbose } from "../../util/log.mjs";
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
  verbose = false,
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
  logCommandContext(ctx, verbose);
  logVerbose(verbose, `  kinds:   ${kinds.join(", ")}`);
  logVerbose(verbose, `  catalog suggestions: ${suggested.length}`);
  console.log("  calling LLM…");

  const llm = llmRuntime(ctx.llm);
  let raw = await chatCompletion({ ...llm, messages });
  let compact = extractSingleCompact(raw);
  if (!compact) {
    console.warn("  LLM: sortie sans # deliverables — nouvel essai…");
    if (process.env.YADRA_FORMALIZE_DEBUG_RAW === "1") {
      mkdirSync(tmpDir, { recursive: true });
      writeFileSync(join(tmpDir, "phase-a-llm-raw.txt"), raw, "utf8");
    }
    const retryMessages = [
      ...messages,
      { role: "assistant", content: raw },
      {
        role: "user",
        content: [
          "Ta réponse précédente n'était pas un `.compact.ksl` valide.",
          "Répète UNIQUEMENT le fichier compact : première ligne exactement `# deliverables`.",
          "Pas d'introduction, pas de markdown hors une fence ```compact.ksl` optionnelle.",
        ].join("\n"),
      },
    ];
    raw = await chatCompletion({ ...llm, messages: retryMessages });
    compact = extractSingleCompact(raw);
  }
  if (!compact) {
    if (process.env.YADRA_FORMALIZE_DEBUG_RAW === "1") {
      writeFileSync(join(tmpDir, "phase-a-llm-raw-retry.txt"), raw, "utf8");
    }
    throw new Error(
      "Réponse LLM invalide : attendu bloc commençant par '# deliverables'.",
    );
  }
  writeFileSync(compactPath, `${compact}\n`, "utf8");

  logVerbose(verbose, `Compact écrit : ${compactPath}`);
  return { compactPath, suggestedCount: suggested.length };
}
