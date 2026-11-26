import { readFileSync } from "node:fs";
import { join } from "node:path";
import { chatCompletion } from "../llm/chat.mjs";
import { loadCommandContext, llmRuntime } from "../command-context.mjs";
import { extractMarkedFiles } from "../formalize/parse-llm-files.mjs";
import { loadOwners } from "./file-owners.mjs";
import { materializeProjectFiles } from "./phase-produce.mjs";
import { pathCited, pathsCitedBySandbox } from "./sandbox-errors.mjs";

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
  testCommand = "the project tests",
  errorPaths,
  approach,
  complete = chatCompletion,
}) {
  const ctx = loadCommandContext(ws, "execute:B");
  const cited = errorPaths?.length ? errorPaths : pathsCitedBySandbox(sandboxLog);
  const limited = approach?.widen ? cited : cited.slice(0, 1);
  const paths = [...new Set(limited.length > 0 ? limited : producedPaths)].slice(0, 6);

  const fileSnippets = paths
    .map((p) => `### ${p}\n${snippet(p, ws.projectHome, 4_000)}`)
    .join("\n\n");

  const user = [
    `# Réparer ${testCommand}`,
    "",
    `basePackage ${bindings.basePackage}`,
    "",
    sandboxLog || "(no log)",
    "",
    fileSnippets,
    "",
    approach?.instruction ? `## Autre approche\n${approach.instruction}` : "",
    "Réponse : blocs `--- FILE: <chemin relatif> ---` uniquement, contenu complet.",
    "Réécris les fichiers cités dans l'erreur. Laisse les autres.",
    "Si cette erreur a déjà été vue, le source renvoyé doit être différent.",
  ].filter((line) => line !== "").join("\n");

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
  for (const file of marked) {
    const previous = snippet(file.rel, ws.projectHome, 100_000);
    if (previous !== "(unreadable)" && previous.trim() === file.content.trim()) {
      throw new Error(`contenu identique, autre approche requise: ${file.rel}`);
    }
  }
  const files = materializeProjectFiles(ws.projectHome, marked, {
    specId: String(specPath ?? "").replaceAll("\\", "/"),
    owners: loadOwners(ws.projectHome),
    mode: "repair",
    errorPaths: cited,
  });
  if (cited.length > 0 && !files.some((file) => pathCited(file.path, cited))) {
    throw new Error("réparation hors de l'erreur");
  }
  return { files };
}
