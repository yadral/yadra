import { readFileSync } from "node:fs";
import { join } from "node:path";
import { distRoot } from "../distribution.mjs";
import {
  buildPlan,
  buildFileManifest,
  resolveT2Bindings,
} from "../ksl-lib.mjs";

export function buildT2CompileContext(specPath, ws, options = {}) {
  const root = distRoot();
  const specText = readFileSync(specPath, "utf8");
  const plan = buildPlan(specPath, {
    kinds: options.kinds,
    distRoot: root,
    phaseRole: options.phaseRole ?? "execute",
  });
  const bindings = resolveT2Bindings({
    kslProjectHome: ws.kslProjectHome,
    specPath,
    specText,
  });
  const fileManifest = buildFileManifest({
    distRoot: root,
    deterministicPlan: plan,
    bindings,
  });
  return { plan, bindings, fileManifest, specText };
}

export function specializationPromptSections({
  specText,
  deterministicPlan,
  planContractText,
  skillText,
  distRootPath,
}) {
  const skeletons = deterministicPlan.strategies
    .filter((strategy) => strategy.skeleton)
    .map((strategy) => {
      const path = join(distRootPath, "yadra/strategies", strategy.skeleton);
      return `## ${strategy.name} — ${strategy.skeleton}\n${readFileSync(path, "utf8").slice(0, 24_000)}`;
    })
    .join("\n\n");
  return [
    "# T2 · A · spécialisation du plan",
    "",
    "## Plan déterministe déjà résolu",
    JSON.stringify(deterministicPlan, null, 2),
    "",
    "## Spec KSL",
    specText.slice(0, 80_000),
    "",
    "## Squelettes actifs",
    skeletons || "(aucun)",
    "",
    "## Consignes",
    "- Complète le plan déterministe, sans le répéter.",
    "- Maximum 20 lignes utiles.",
    "- Donne seulement : placeholders résolus, mapping usecases → rôles, contraintes required/forbidden pertinentes, questions réellement bloquantes.",
    "- Ne décris ni B, ni C, ni gate. Ne génère aucun code.",
    "",
    "## Contrat T2 · A",
    planContractText.slice(0, 20_000),
    "",
    "## SKILL",
    skillText,
  ].join("\n");
}
