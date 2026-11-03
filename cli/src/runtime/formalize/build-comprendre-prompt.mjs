import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const DOC_GLOB_EXT = new Set([".md", ".txt", ".yadra.md"]);
const MAX_DOC_BYTES = 120_000;
const MAX_KSL_SNIPPET = 24_000;

function readBounded(path, maxBytes) {
  const raw = readFileSync(path, "utf8");
  if (Buffer.byteLength(raw, "utf8") <= maxBytes) return raw;
  return `${raw.slice(0, maxBytes)}\n…(truncated)`;
}

export function collectDocCorpus(docDir) {
  const parts = [];
  let total = 0;

  function walk(dir) {
    for (const name of readdirSync(dir)) {
      if (name.startsWith(".")) continue;
      const abs = join(dir, name);
      const st = statSync(abs);
      if (st.isDirectory()) {
        walk(abs);
        continue;
      }
      const ext = name.includes(".") ? name.slice(name.lastIndexOf(".")) : "";
      if (!DOC_GLOB_EXT.has(ext) && name !== "feature.yadra.md") continue;
      const rel = relative(docDir, abs);
      const chunk = readFileSync(abs, "utf8");
      const block = `\n--- FILE: ${rel} ---\n${chunk}`;
      total += Buffer.byteLength(block, "utf8");
      if (total > MAX_DOC_BYTES) {
        parts.push("\n…(dossier formalisation tronqué pour limite taille)");
        return;
      }
      parts.push(block);
    }
  }

  walk(docDir);
  return parts.join("\n");
}

export function readNeighborKslSnippets(kslRoot, outputPaths, specRel) {
  const snippets = [];
  let used = 0;
  for (const rel of Object.values(outputPaths)) {
    if (!rel || rel === specRel) continue;
    const abs = join(kslRoot, rel);
    try {
      if (!statSync(abs).isFile()) continue;
      const text = readFileSync(abs, "utf8");
      const slice = text.slice(0, MAX_KSL_SNIPPET - used);
      snippets.push(`--- KSL neighbor: ${rel} ---\n${slice}`);
      used += slice.length;
      if (used >= MAX_KSL_SNIPPET) break;
    } catch {
      // ignore
    }
  }
  return snippets.join("\n\n");
}

export function buildComprendreMessages({
  systemPrompt,
  skillBody,
  planExcerpt,
  catalogYaml,
  strategyCandidates,
  inferredKinds,
  docCorpus,
  kslSnippets,
  paths,
}) {
  const user = [
    "# T1 · A · COMPRENDRE — produire un `.compact.ksl` complet",
    "",
    "## Chemins",
    `- KSL_PROJECT_HOME: ${paths.kslProjectHome}`,
    `- PROJECT_HOME: ${paths.projectHome ?? "(non défini)"}`,
    `- Compact cible: ${paths.compactPath}`,
    "",
    "## Kinds inférés (signaux doc)",
    inferredKinds.join(", "),
    "",
    "## Strategies suggérées (catalogue — à confirmer / compléter dans ## strategies)",
    strategyCandidates,
    "",
    "## Catalogue complet (yadra/strategies/catalog.yaml)",
    "```yaml",
    catalogYaml.length > 80_000
      ? `${catalogYaml.slice(0, 80_000)}\n# … truncated`
      : catalogYaml,
    "```",
    "",
    "## Extrait plan (structure compact)",
    planExcerpt,
    "",
    "## KSL voisin (contexte)",
    kslSnippets || "(aucun fichier voisin lisible)",
    "",
    "## Dossier formalisation (Doc First)",
    docCorpus,
    "",
    "## Consignes de sortie",
    "- Réponds avec **un seul** fichier `.compact.ksl` en texte brut.",
    "- Commence par `# deliverables` puis sections `# .project.ksl` / `# .module.ksl` / `# .spec.ksl` selon ksl_levels du feature.yadra.md.",
    "- `# .spec.ksl` doit inclure ## intention, scope, usecases, data, outputs, **strategies** (noms catalogue, descriptions concrètes).",
    "- Si information manquante : `# questions-resolues` avec questions numérotées ; sinon section vide ou `(aucune)`.",
    "- Pas de prose avant `# deliverables`. Option : fence ```compact.ksl … ```.",
    "",
    "SKILL (référence) :",
    skillBody,
  ].join("\n");

  return [
    { role: "system", content: systemPrompt.trim() },
    { role: "user", content: user },
  ];
}

export { extractSingleCompact as extractCompactKsl } from "./parse-llm-files.mjs";
