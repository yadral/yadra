import { readFileSync } from "node:fs";
import { join } from "node:path";
import { chatCompletion } from "../llm/chat.mjs";
import { loadCommandContext, llmRuntime } from "../command-context.mjs";
import { extractMarkedFiles } from "../formalize/parse-llm-files.mjs";
import { materializeProjectFiles } from "./phase-produce.mjs";

function snippet(path, projectHome, maxChars = 12_000) {
  try {
    const text = readFileSync(join(projectHome, path), "utf8");
    if (text.length <= maxChars) return text;
    return `${text.slice(0, maxChars)}\n… (truncated)`;
  } catch {
    return "(unreadable)";
  }
}

export async function runPhaseBRepair({
  ws,
  specPath,
  bindings,
  specialization,
  sandboxLog,
  producedPaths,
  complete = chatCompletion,
}) {
  const ctx = loadCommandContext(ws, "execute:B");
  const spec = readFileSync(specPath, "utf8");
  const contract = readFileSync(ctx.plan.path, "utf8");
  const paths = [...new Set(producedPaths)].sort();

  const fileSnippets = paths
    .slice(0, 24)
    .map((p) => `### ${p}\n${snippet(p, ws.projectHome)}`)
    .join("\n\n");

  const user = [
    "# T2 · B · REPAIR (sandbox failure)",
    "",
    "## Bindings (non négociables)",
    JSON.stringify(bindings, null, 2),
    "",
    "## Spécialisation T2 · A",
    specialization,
    "",
    "## Spec KSL",
    spec.slice(0, 60_000),
    "",
    "## Échec sandbox (build/tests)",
    sandboxLog || "(no log)",
    "",
    "## Fichiers déjà produits (corrige uniquement ceux nécessaires)",
    paths.map((p) => `- ${p}`).join("\n") || "(aucun)",
    "",
    fileSnippets,
    "",
    "## Contrat B",
    contract.slice(0, 30_000),
    "",
    "## Consignes",
    "- Corrige le code sous PROJECT_HOME pour faire passer `gradle test`.",
    "- Réponse : blocs `--- FILE: <chemin relatif> ---` uniquement.",
    "- Ne modifie que les fichiers pertinents ; contenu complet par fichier touché.",
  ].join("\n");

  const raw = await complete({
    ...llmRuntime(ctx.llm),
    messages: [
      { role: "system", content: ctx.skill.system.trim() },
      { role: "user", content: user },
    ],
  });
  const marked = extractMarkedFiles(raw);
  if (!marked?.length) {
    throw new Error("T2 repair: invalid LLM response; expected --- FILE: --- blocks.");
  }
  const allowed = new Set(paths);
  const files = materializeProjectFiles(ws.projectHome, marked, {
    allowOnly: allowed.size > 0 ? [...allowed] : null,
  });
  return { files };
}
