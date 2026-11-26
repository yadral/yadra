import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { chatCompletion } from "../llm/chat.mjs";
import { loadCommandContext, llmRuntime } from "../command-context.mjs";
import { assertDistinctJvmSignatures, extractMarkedFiles } from "../formalize/parse-llm-files.mjs";
import { logWrittenFiles } from "../../util/log.mjs";
import { claimOwner, loadOwners, saveOwners } from "./file-owners.mjs";
import { pathCited } from "./sandbox-errors.mjs";
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
  let segments = rel.split("/");
  if (
    segments.some((part) => part === ".." || part === "." || part === "") ||
    segments.some((part) => part === ".git" || part === ".yadra")
  ) {
    throw new Error(`T2 B: forbidden output path: ${candidate}`);
  }
  const root = resolve(projectHome);
  const base = basename(root);
  while (base && segments[0] === base && segments.length > 1) segments.shift();
  if (segments.length === 0) {
    throw new Error(`T2 B: invalid output path: ${candidate}`);
  }
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

export function materializeProjectFiles(projectHome, markedFiles, options = {}) {
  if (!markedFiles?.length) {
    throw new Error("T2 B: no FILE blocks returned by the LLM.");
  }
  const specId = options.specId ?? "";
  const mode = options.mode ?? "produce";
  const errorPaths = options.errorPaths ?? [];
  const owners = options.owners ?? loadOwners(projectHome);
  const prepared = markedFiles.map(({ rel, content }) => {
    const target = safeProjectRelativePath(projectHome, rel);
    const normalized = content.endsWith("\n") ? content : `${content}\n`;
    if (!content.trim()) throw new Error(`T2 B: empty output file: ${rel}`);
    return { ...target, content: normalized };
  });
  const seen = new Set();
  for (const file of prepared) {
    if (seen.has(file.rel)) throw new Error(`T2 B: duplicate output file: ${file.rel}`);
    seen.add(file.rel);
  }
  const written = [];
  let claimed = false;
  for (const file of prepared) {
    const owner = owners[file.rel];
    const foreign = owner && specId && owner !== specId && existsSync(file.absolute);
    const repairTarget = mode === "repair" && pathCited(file.rel, errorPaths);
    if (foreign && !repairTarget && !options.allowMerge) {
      if (options.verbose) console.log(`inchangé ${file.rel} (${owner})`);
      continue;
    }
    assertDistinctJvmSignatures(file.rel, file.content);
    atomicWrite(file.absolute, file.content);
    if (claimOwner(owners, specId, file.rel)) claimed = true;
    written.push({ path: file.rel, sha256: sha256(file.content) });
  }
  if (claimed && specId) saveOwners(projectHome, owners);
  return written;
}

function skeletonForPrompt(text) {
  const cut = text.search(/\n\s*examples\s*\{/);
  return (cut === -1 ? text : text.slice(0, cut)).trim();
}

function compactBindings(bindings) {
  return {
    basePackage: bindings.basePackage,
    feature: bindings.feature,
    Feature: bindings.Feature,
    Entity: bindings.Entity,
    ext: bindings.ext,
    stack: bindings.stack,
  };
}

function ownershipLine(allowMerge) {
  return allowMerge
    ? "Tu peux mettre à jour un fichier déjà écrit par une spec du même module (merge)."
    : "Un fichier déjà écrit par une autre spec est laissé tel quel.";
}

function buildPassPrompt({
  spec,
  bindings,
  skeletonText,
  strategy,
  passFiles,
  mandatoryPaths,
  priorError = "",
  allowMerge = false,
}) {
  return [
    `# ${strategy.name}`,
    "",
    "## Bindings",
    JSON.stringify(compactBindings(bindings)),
    "",
    "## Spec",
    spec,
    "",
    "## Squelette",
    skeletonForPrompt(skeletonText),
    "",
    "## Fichiers obligatoires pour ce pass",
    mandatoryPaths.map((p) => `- ${p}`).join("\n") || "(aucun)",
    "",
    priorError ? `## Erreur\n${priorError}\n` : "",
    "## Réponse",
    "Blocs `--- FILE: <chemin relatif à PROJECT_HOME> ---` seulement.",
    "Le corps est le source seul : pas de ```, pas de phrase, pas de note après le code.",
    "Écris les fichiers obligatoires. Un fichier nouveau en plus est accepté.",
    ownershipLine(allowMerge),
    passFiles.length ? `Suggérés: ${passFiles.join(", ")}` : "",
  ]
    .filter((line) => line !== "")
    .join("\n");
}

function buildCombinedPrompt({
  spec,
  bindings,
  strategyBlocks,
  passFiles,
  mandatoryPaths,
  priorError = "",
  allowMerge = false,
}) {
  return [
    "# Slice unique — toutes les strategies en contraintes",
    "",
    "## Bindings",
    JSON.stringify(compactBindings(bindings)),
    "",
    "## Spec",
    spec,
    "",
    "## Strategies",
    strategyBlocks.join("\n\n"),
    "",
    "## Fichiers obligatoires pour ce pass",
    mandatoryPaths.map((p) => `- ${p}`).join("\n") || "(aucun)",
    "",
    priorError ? `## Erreur\n${priorError}\n` : "",
    "## Réponse",
    "Blocs `--- FILE: <chemin relatif à PROJECT_HOME> ---` seulement.",
    "Le corps est le source seul : pas de ```, pas de phrase, pas de note après le code.",
    "Écris les fichiers obligatoires. Un fichier nouveau en plus est accepté.",
    ownershipLine(allowMerge),
    passFiles.length ? `Suggérés: ${passFiles.join(", ")}` : "",
  ]
    .filter((line) => line !== "")
    .join("\n");
}

function optionsSpecId(specPath) {
  return String(specPath ?? "").replaceAll("\\", "/");
}

async function produceOnePass({
  ws,
  ctx,
  spec,
  specId,
  owners,
  bindings,
  prompt,
  label,
  mandatoryPaths,
  maxRepairLoops,
  complete,
  allowMerge,
  verbose = false,
}) {
  const attempts = Math.max(1, Number(maxRepairLoops) + 1);
  let priorError = "";
  let passWritten = [];
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const body = priorError ? `${prompt}\n\n## Erreur\n${priorError}\n` : prompt;
    try {
      const raw = await complete({
        ...llmRuntime(ctx.llm),
        messages: [
          { role: "system", content: ctx.skill.system.trim() },
          { role: "user", content: body },
        ],
      });
      const marked = extractMarkedFiles(raw);
      if (!marked) {
        throw new Error(`réponse sans blocs FILE (${label})`);
      }
      passWritten = materializeProjectFiles(ws.projectHome, marked, {
        specId,
        owners,
        mode: "produce",
        allowMerge,
        verbose,
      });
      logWrittenFiles(verbose, passWritten);
      const covered = new Set(passWritten.map((f) => f.path));
      for (const path of mandatoryPaths) {
        if (covered.has(path)) continue;
        const owner = owners[path];
        if (owner && owner !== specId && existsSync(join(ws.projectHome, path))) {
          covered.add(path);
        }
      }
      const coverageError = assertManifestCoverage(covered, mandatoryPaths);
      if (coverageError) throw new Error(coverageError);
      return passWritten;
    } catch (error) {
      priorError = error?.message ?? String(error);
      if (attempt >= attempts) {
        throw new Error(priorError);
      }
    }
  }
  return passWritten;
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
  combined = false,
  allowMerge = false,
  verbose = false,
}) {
  const ctx = loadCommandContext(ws, "execute:B");
  const spec = readFileSync(specPath, "utf8");
  const specId = optionsSpecId(specPath);
  const owners = loadOwners(ws.projectHome);
  const allFiles = [];

  const active = deterministicPlan.strategies.filter(
    (strategy) => strategy.skeleton && strategy.id,
  );

  if (combined && active.length > 0) {
    const strategyBlocks = [];
    const mandatory = [];
    const suggested = [];
    for (const strategy of active) {
      const passManifest = manifestForStrategy(fileManifest, strategy.id);
      if (passManifest.length === 0) continue;
      const skeletonPath = join(ctx.root, "yadra/strategies", strategy.skeleton);
      const skeletonText = existsSync(skeletonPath)
        ? readFileSync(skeletonPath, "utf8")
        : "";
      strategyBlocks.push(
        [`### ${strategy.name}`, skeletonForPrompt(skeletonText)].join("\n"),
      );
      for (const item of passManifest) {
        suggested.push(item.path);
        if (item.required && !item.path.includes("<") && !item.path.includes(">")) {
          mandatory.push(item.path);
        }
      }
    }
    if (strategyBlocks.length === 0) {
      // fall through to per-strategy passes
    } else {
    const mandatoryPaths = [...new Set(mandatory)];
    const passFiles = [...new Set(suggested)];
    const prompt = buildCombinedPrompt({
      spec,
      bindings,
      strategyBlocks,
      passFiles,
      mandatoryPaths,
      allowMerge,
    });
    const written = await produceOnePass({
      ws,
      ctx,
      spec,
      specId,
      owners,
      bindings,
      prompt,
      label: "slice",
      mandatoryPaths,
      maxRepairLoops,
      complete,
      allowMerge,
      verbose,
    });
    return { files: written };
    }
  }

  for (const strategy of active) {
    const passManifest = manifestForStrategy(fileManifest, strategy.id);
    if (passManifest.length === 0) continue;
    const skeletonPath = join(ctx.root, "yadra/strategies", strategy.skeleton);
    const skeletonText = readFileSync(skeletonPath, "utf8");
    const mandatoryPaths = passManifest
      .filter((f) => f.required && !f.path.includes("<") && !f.path.includes(">"))
      .map((f) => f.path);
    const passPaths = passManifest.map((f) => f.path);
    const prompt = buildPassPrompt({
      spec,
      bindings,
      skeletonText,
      strategy,
      passFiles: passPaths,
      mandatoryPaths,
      allowMerge,
    });
    const passWritten = await produceOnePass({
      ws,
      ctx,
      spec,
      specId,
      owners,
      bindings,
      prompt,
      label: strategy.name,
      mandatoryPaths,
      maxRepairLoops,
      complete,
      allowMerge,
      verbose,
    });
    allFiles.push(...passWritten);
  }

  return { files: allFiles };
}
