import { readFileSync } from "node:fs";
import { chatCompletion } from "../llm/chat.mjs";
import {
  loadCommandContext,
  llmRuntime,
  logCommandContext,
} from "../command-context.mjs";
import { extractMarkedFiles } from "../formalize/parse-llm-files.mjs";
import { findServiceProjectNearSpec } from "../ksl-lib.mjs";
import { materializeProjectFiles } from "./phase-produce.mjs";

function deliveryHints(specPath) {
  const service = findServiceProjectNearSpec(specPath);
  const text = service?.text ?? "";
  const docsPath =
    text.match(/\bdocs\s*\{[\s\S]*?\bpath\s*=\s*"([^"]+)"/)?.[1] ?? "docs/api";
  const e2ePath =
    text.match(/\be2e\s*\{[\s\S]*?\bpath\s*=\s*"([^"]+)"/)?.[1] ?? "tests/e2e";
  return { docsPath, e2ePath };
}

export async function runPhaseCGateProduce({
  ws,
  specPath,
  deterministicPlan,
  complete = chatCompletion,
}) {
  const ctx = loadCommandContext(ws, "gate:C");
  console.log("T2 gate — C · LIVRER · PRODUIRE (gate kinds, LLM + SKILL)");
  logCommandContext(ctx);
  const spec = readFileSync(specPath, "utf8");
  const contract = readFileSync(ctx.plan.path, "utf8");
  const hints = deliveryHints(specPath);
  const kinds = deterministicPlan.kinds.join(", ") || "(none)";

  const prompt = [
    "# T2 · C · LIVRER — gate kinds",
    "",
    `Gate kinds to materialize: ${kinds}`,
    "",
    "## Delivery paths (service project)",
    `- docs → PROJECT_HOME/${hints.docsPath.replace(/^\//, "")}/`,
    `- e2e → PROJECT_HOME/${hints.e2ePath.replace(/^\//, "")}/`,
    "",
    "## Spec KSL (outputs.docs / outputs.e2e)",
    spec.slice(0, 80_000),
    "",
    "## Plan déterministe",
    JSON.stringify(deterministicPlan, null, 2),
    "",
    "## Contrat C",
    contract.slice(0, 24_000),
    "",
    "## SKILL C",
    ctx.skill.skill,
    "",
    "## Réponse obligatoire",
    "- Uniquement des blocs `--- FILE: <chemin relatif à PROJECT_HOME> ---`.",
    "- Produis la documentation (OpenAPI stub, README feature, ADR pointer) et les tests e2e déclarés.",
    "- Chemins sous les racines docs/e2e ci-dessus ; pas de code métier hexagonal (déjà produit par execute).",
    "- Contenu complet ; aucun commentaire hors blocs.",
  ].join("\n");

  const raw = await complete({
    ...llmRuntime(ctx.llm),
    messages: [
      { role: "system", content: ctx.skill.system.trim() },
      { role: "user", content: prompt },
    ],
  });
  const marked = extractMarkedFiles(raw);
  if (!marked?.length) {
    throw new Error("T2 C: invalid LLM response; expected --- FILE: --- blocks.");
  }
  const files = materializeProjectFiles(ws.projectHome, marked);
  return { files };
}
