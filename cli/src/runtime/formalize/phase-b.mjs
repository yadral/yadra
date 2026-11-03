import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { chatCompletion } from "../llm/chat.mjs";
import {
  loadCommandContext,
  llmRuntime,
  logCommandContext,
} from "../command-context.mjs";
import { extractMarkedFiles } from "./parse-llm-files.mjs";

export async function runPhaseBProduire({
  ws,
  compactPath,
  outputPaths,
}) {
  const ctx = loadCommandContext(ws, "formalize:B");
  const compact = readFileSync(compactPath, "utf8");
  const planText = readFileSync(ctx.plan.path, "utf8");

  console.log("T1 formalize — B · PRODUIRE (LLM + SKILL)");
  logCommandContext(ctx);
  console.log(`  compact: ${compactPath}`);
  console.log("  calling LLM…");

  const user = [
    "# T1 · B · PRODUIRE — compact → fichiers KSL",
    "",
    "## Chemins de sortie (relatifs KSL_PROJECT_HOME)",
    JSON.stringify(outputPaths, null, 2),
    "",
    "## Plan (contrat)",
    planText.slice(0, 60_000),
    "",
    "## Compact (.compact.ksl)",
    compact,
    "",
    "## Consignes",
    "- Écris **un fichier KSL par output_path** nécessaire selon # deliverables.",
    "- Format de réponse **obligatoire** : pour chaque fichier :",
    "  --- FILE: <chemin relatif exact depuis output_paths> ---",
    "  puis le contenu KSL 1.0 (sans fence).",
    "- Transcrire ## strategies du compact en bloc `strategies { strategy \"…\" { … } }`.",
    "- Ne pas ajouter de strategies absentes du compact.",
    "",
    "SKILL :",
    ctx.skill.skill,
  ].join("\n");

  const messages = [
    { role: "system", content: ctx.skill.system.trim() },
    { role: "user", content: user },
  ];

  const raw = await chatCompletion({ ...llmRuntime(ctx.llm), messages });
  const files = extractMarkedFiles(raw);
  if (!files?.length) {
    throw new Error(
      "Réponse LLM invalide pour B : attendu blocs --- FILE: <path> ---",
    );
  }

  const written = [];
  for (const { rel, content } of files) {
    const abs = resolve(ws.kslProjectHome, rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content.endsWith("\n") ? content : `${content}\n`, "utf8");
    written.push(abs);
  }

  console.log("");
  console.log("Fichiers KSL écrits :");
  for (const f of written) console.log(`  ${f}`);
  return { written };
}
