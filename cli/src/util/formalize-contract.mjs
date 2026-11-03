import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { distRoot } from "../runtime/distribution.mjs";

export function resolveFormalizeAssets(yadraProjectHome) {
  const root = resolve(yadraProjectHome ?? distRoot());
  const yadraHome = join(root, "yadra");
  const skillsRoot = join(yadraHome, "skills");
  const registryPath = join(skillsRoot, "registry.yaml");
  const plans = {
    comprendre: join(
      root,
      "prompts/plan-validate/yadra-t1/t1-comprendre-intention.plan.md",
    ),
    produire: join(
      root,
      "prompts/plan-validate/yadra-t1/t1-produire-ksl.plan.md",
    ),
    livrer: join(
      root,
      "prompts/plan-validate/yadra-t1/t1-livrer-ksl.plan.md",
    ),
  };
  const skills = {
    comprendre: join(skillsRoot, "formalize/partie-a-comprendre/SKILL.md"),
    produire: join(skillsRoot, "formalize/partie-b-produire/SKILL.md"),
    livrer: join(skillsRoot, "formalize/partie-c-livrer/SKILL.md"),
  };
  return {
    yadraHome,
    skillsRoot,
    registryPath,
    plans,
    skills,
    planValidateNote: join(root, "prompts/plan-validate/README.md"),
    exists: (p) => existsSync(p),
  };
}

export function printAbOrchestration({
  docDir,
  kslProjectHome,
  yadraProjectHome,
  llm,
  runId,
}) {
  const assets = resolveFormalizeAssets(yadraProjectHome);
  const tmpDir = join(kslProjectHome, ".yadra", "tmp", runId);

  console.log("T1 formalize — étapes A · COMPRENDRE et B · PRODUIRE (runtime SKILLS)");
  console.log("");
  console.log(`  Documents:     ${resolve(docDir)}`);
  console.log(`  KSL_PROJECT:   ${kslProjectHome}`);
  console.log(`  Run tmp:       ${tmpDir}`);
  console.log(`  LLM profile:   ${llm?.profile ?? "default"}`);
  console.log(`  LLM provider:  ${llm?.provider ?? "(yadra configure set)"}`);
  console.log(`  LLM model:     ${llm?.model ?? "(yadra configure set)"}`);
  console.log("");
  console.log("Plans référencés (prompts/plan-validate/yadra-t1/) :");
  for (const [k, p] of Object.entries(assets.plans)) {
    console.log(`  [${k}] ${p}${assets.exists(p) ? "" : " (missing)"}`);
  }
  console.log("");
  console.log("SKILLS (registre yadra/skills/registry.yaml) :");
  for (const [k, p] of Object.entries(assets.skills)) {
    console.log(`  [${k}] ${p}${assets.exists(p) ? "" : " (missing)"}`);
  }
  console.log(`  registry: ${assets.registryPath}`);
  console.log("");
  console.log("Variables utiles pour l’agent :");
  console.log(`  export YADRA_FORMALIZE_DOCS='${resolve(docDir).replace(/'/g, "'\\''")}'`);
  console.log(`  export YADRA_FORMALIZE_RUN_ID='${runId}'`);
  console.log(`  export YADRA_FORMALIZE_TMP='${tmpDir.replace(/'/g, "'\\''")}'`);
  console.log("");
  console.log(
    "Runtime A/B : agent + SKILLS ci-dessus ; modèle et provider via yadra configure / yadra project.",
  );
  console.log(
    `Relancez ensuite : yadra formalize ${resolve(docDir)} [--seal|--no-seal]`,
  );
}
