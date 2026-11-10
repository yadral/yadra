import { createHash } from "node:crypto";
import {
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { chatCompletion } from "../llm/chat.mjs";
import {
  loadCommandContext,
  llmRuntime,
  logCommandContext,
} from "../command-context.mjs";
import { extractMarkedFiles } from "../formalize/parse-llm-files.mjs";
import {
  assertManifestCoverage,
  manifestForStrategy,
} from "../ksl-lib.mjs";

function sha256(content) {
  return createHash("sha256").update(content).digest("hex");
}

export function safeProjectRelativePath(projectHome, candidate) {
  const rel = String(candidate ?? "").trim().replaceAll("\\", "/");
  if (!rel || isAbsolute(rel) || rel.includes("\0")) {
    throw new Error(`T2 B: invalid output path: ${candidate}`);
  }
  const segments = rel.split("/");
  if (
    segments.some((part) => part === ".." || part === "." || part === "") ||
    segments.some((part) => part === ".git" || part === ".yadra")
  ) {
    throw new Error(`T2 B: forbidden output path: ${candidate}`);
  }
  const root = resolve(projectHome);
  const absolute = resolve(root, ...segments);
  const fromRoot = relative(root, absolute);
  if (fromRoot.startsWith(`..${sep}`) || fromRoot === ".." || isAbsolute(fromRoot)) {
    throw new Error(`T2 B: output escapes PROJECT_HOME: ${candidate}`);
  }
  return { rel: segments.join("/"), absolute };
}

function atomicWrite(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  const temp = `${path}.yadra-${process.pid}-${Date.now()}.tmp`;
  try {
    writeFileSync(temp, content, "utf8");
    renameSync(temp, path);
  } finally {
    rmSync(temp, { force: true });
  }
}

export function materializeProjectFiles(projectHome, markedFiles, { allowOnly = null } = {}) {
  if (!markedFiles?.length) {
    throw new Error("T2 B: no FILE blocks returned by the LLM.");
  }
  const allowed = allowOnly ? new Set(allowOnly) : null;
  const prepared = markedFiles.map(({ rel, content }) => {
    const target = safeProjectRelativePath(projectHome, rel);
    if (allowed && !allowed.has(target.rel)) {
      const hint = [...allowed].join(", ");
      throw new Error(
        `T2 B: unexpected output file (not in manifest pass): ${rel}. Allowed: ${hint}`,
      );
    }
    const normalized = content.endsWith("\n") ? content : `${content}\n`;
    if (!content.trim()) throw new Error(`T2 B: empty output file: ${rel}`);
    return { ...target, content: normalized };
  });
  const seen = new Set();
  for (const file of prepared) {
    if (seen.has(file.rel)) throw new Error(`T2 B: duplicate output file: ${file.rel}`);
    seen.add(file.rel);
  }
  for (const file of prepared) atomicWrite(file.absolute, file.content);
  return prepared.map((file) => ({
    path: file.rel,
    sha256: sha256(file.content),
  }));
}

function buildPassPrompt({
  spec,
  contract,
  skill,
  deterministicPlan,
  bindings,
  specialization,
  skeletonText,
  strategy,
  passFiles,
  writtenSummary,
  mandatoryPaths,
  priorError = "",
}) {
  return [
    "# T2 · B · PRODUIRE (pass strategy)",
    "",
    `## Strategy courante: ${strategy.name} (${strategy.id})`,
    "",
    "## Bindings résolus (non négociables)",
    JSON.stringify(bindings, null, 2),
    "",
    "## Spécialisation T2 · A",
    specialization,
    "",
    "## Plan déterministe",
    JSON.stringify(deterministicPlan, null, 2),
    "",
    "## Spec KSL scellée",
    spec,
    "",
    "## Squelette actif",
    skeletonText,
    "",
    "## Fichiers obligatoires pour ce pass",
    mandatoryPaths.map((p) => `- ${p}`).join("\n") || "(aucun)",
    "",
    "## Fichiers déjà produits",
    writtenSummary || "(aucun)",
    "",
    priorError
      ? [
          "## Erreur du pass précédent",
          priorError,
          "Corrige la réponse. Produis exactement les chemins autorisés, rien d'autre.",
          "",
        ].join("\n")
      : "",
    "## Contrat B",
    contract,
    "",
    "## SKILL B",
    skill,
    "",
    "## Réponse obligatoire",
    "- Uniquement des blocs `--- FILE: <chemin relatif à PROJECT_HOME> ---`.",
    `- Produis **tous** les fichiers obligatoires listés ci-dessus (exactement ces chemins).`,
    `- Tu peux produire au plus ces fichiers pour ce pass: ${passFiles.join(", ") || "(liste vide)"}`,
    "- Respecte basePackage, stack et la spécialisation A.",
    "- Contenu complet ; aucun commentaire hors blocs.",
  ].join("\n");
}

export async function runPhaseBProduce({
  ws,
  specPath,
  deterministicPlan,
  bindings,
  fileManifest,
  specialization,
  distRoot,
  maxRepairLoops = 0,
  complete = chatCompletion,
}) {
  const ctx = loadCommandContext(ws, "execute:B");
  console.log("T2 execute — B · PRODUIRE (LLM + SKILL, multi-pass)");
  logCommandContext(ctx);
  const spec = readFileSync(specPath, "utf8");
  const contract = readFileSync(ctx.plan.path, "utf8");
  const written = new Map();
  const allFiles = [];

  for (const strategy of deterministicPlan.strategies) {
    if (!strategy.skeleton || !strategy.id) continue;
    const passManifest = manifestForStrategy(fileManifest, strategy.id);
    if (passManifest.length === 0) continue;
    const skeletonPath = join(ctx.root, "yadra/strategies", strategy.skeleton);
    const skeletonText = readFileSync(skeletonPath, "utf8");
    const mandatoryPaths = passManifest.filter((f) => f.required).map((f) => f.path);
    const passPaths = passManifest.map((f) => f.path);
    const writtenSummary = [...written.entries()]
      .map(([path, sha]) => `- ${path} (${sha.slice(0, 12)}…)`)
      .join("\n");

    console.log(`  pass: ${strategy.name} (${passPaths.length} files)`);

    const attempts = Math.max(1, Number(maxRepairLoops) + 1);
    let priorError = "";
    let passWritten = null;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      const prompt = buildPassPrompt({
        spec,
        contract,
        skill: ctx.skill.skill,
        deterministicPlan,
        bindings,
        specialization,
        skeletonText,
        strategy,
        passFiles: passPaths,
        writtenSummary,
        mandatoryPaths,
        priorError,
      });
      try {
        const raw = await complete({
          ...llmRuntime(ctx.llm),
          messages: [
            { role: "system", content: ctx.skill.system.trim() },
            { role: "user", content: prompt },
          ],
        });
        const marked = extractMarkedFiles(raw);
        if (!marked) {
          throw new Error(
            `T2 B: invalid LLM response for ${strategy.name}; expected --- FILE: --- blocks.`,
          );
        }
        passWritten = materializeProjectFiles(ws.projectHome, marked, {
          allowOnly: passPaths,
        });
        const coverageError = assertManifestCoverage(
          new Set(passWritten.map((f) => f.path)),
          mandatoryPaths,
        );
        if (coverageError) throw new Error(coverageError);
        break;
      } catch (error) {
        const message = error?.message ?? String(error);
        if (attempt >= attempts) throw error;
        priorError = message;
        console.log(
          `  pass retry ${attempt}/${maxRepairLoops} (${strategy.name}): ${message}`,
        );
      }
    }
    for (const file of passWritten) {
      written.set(file.path, file.sha256);
      allFiles.push(file);
    }
  }

  if (allFiles.length === 0) {
    throw new Error("T2 B: no files produced (empty file manifest?).");
  }

  return { files: allFiles };
}
