import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getProfileConfig } from "../config/load-configure.mjs";
import { resolveCursorEndpoint } from "./llm/cursor-agent-cli.mjs";
import { distRoot } from "./distribution.mjs";

/** Plan id → fichiers draft v1 (fallback si plan-validate absent). */
export const COMMAND_BINDINGS = {
  "formalize:A": {
    timeline: "T1",
    aspect: "yadra-t1",
    planId: "t1-comprendre-intention",
    draftPlan: "yadra-t1-comprendre-intention.plan.md",
    skill: "formalize/partie-a-comprendre",
    usesLlm: true,
  },
  "formalize:B": {
    timeline: "T1",
    aspect: "yadra-t1",
    planId: "t1-produire-ksl",
    draftPlan: "yadra-t1-produire-ksl.plan.md",
    skill: "formalize/partie-b-produire",
    usesLlm: true,
  },
  "formalize:C": {
    timeline: "T1",
    aspect: "yadra-t1",
    planId: "t1-livrer-ksl",
    draftPlan: "yadra-t1-livrer-ksl.plan.md",
    skill: "formalize/partie-c-livrer",
    usesLlm: false,
  },
  "plan:A": {
    timeline: "T2",
    aspect: "yadra-t2",
    planId: "t2-comprendre-contrat",
    draftPlan: "yadra-t2-comprendre-contrat.plan.md",
    skill: "execute/partie-a-comprendre",
    usesLlm: true,
  },
  "execute:B": {
    timeline: "T2",
    aspect: "yadra-t2",
    planId: "t2-produire-artefacts",
    draftPlan: "yadra-t2-produire-artefacts.plan.md",
    skill: "execute/partie-b-produire",
    usesLlm: true,
  },
  "gate:C": {
    timeline: "T2",
    aspect: "yadra-t2",
    planId: "t2-livrer-gate",
    draftPlan: "yadra-t2-livrer-gate.plan.md",
    skill: "execute/partie-c-livrer",
    usesLlm: true,
  },
  seal: {
    timeline: "T1",
    aspect: "yadra-t1",
    planId: "t1-livrer-ksl",
    draftPlan: "yadra-t1-livrer-ksl.plan.md",
    skill: "formalize/partie-c-livrer",
    usesLlm: false,
  },
  "strategies:reference": {
    timeline: "T2",
    aspect: "yadra-t2",
    planId: "t2-comprendre-contrat",
    draftPlan: "yadra-t2-comprendre-contrat.plan.md",
    skill: "strategies/catalog",
    usesLlm: true,
  },
};

export function llmFromWorkspace(ws) {
  const profile =
    process.env.YADRA_PROFILE ?? ws?.llm?.profile ?? "default";
  const { configure } = getProfileConfig(profile);
  return {
    profile,
    provider: configure.provider ?? null,
    model:
      ws?.llm?.model ??
      configure.model ??
      process.env.YADRA_MODEL ??
      null,
  };
}

export function llmRuntime(llm) {
  const profile = llm.profile ?? "default";
  const { configure, credentials } = getProfileConfig(profile);
  const timeoutRaw = configure.timeout ?? process.env.YADRA_LLM_TIMEOUT;
  const timeoutMs = timeoutRaw ? Number(timeoutRaw) : 120_000;
  const provider = (configure.provider ?? "openai").toLowerCase();
  const storedBase = configure.base_url ?? configure.baseUrl;
  const baseUrl =
    provider === "cursor"
      ? resolveCursorEndpoint(storedBase)
      : storedBase;
  return {
    profile,
    provider,
    model: llm.model ?? configure.model,
    baseUrl,
    timeoutMs: Number.isFinite(timeoutMs) ? timeoutMs : 120_000,
    credentials,
  };
}

export function isLlmConfigured(llm) {
  const profile = llm.profile ?? "default";
  const { configure, credentials } = getProfileConfig(profile);
  const hasAuth =
    credentials.token ||
    (credentials.username && credentials.password) ||
    process.env.YADRA_LLM_TOKEN;
  return Boolean(
    hasAuth && (llm.model || configure.model || process.env.YADRA_MODEL),
  );
}

export function requireLlmConfigured(llm, { skipLlm, commandLabel }) {
  if (skipLlm) return null;
  if (isLlmConfigured(llm)) return null;
  return [
    `LLM requis pour ${commandLabel} (yadra configure + credentials).`,
    "  yadra configure set --profile default --provider openai --model <id>",
    "  yadra configure credentials --profile default --token <key>",
    "  ou --skip-llm (référence / validate-seal seul sans agent).",
  ].join("\n");
}

export function resolveDistributionRoot(yadraProjectHome) {
  return yadraProjectHome ?? distRoot();
}

export function resolvePlanFile(root, binding) {
  const validated = join(
    root,
    "prompts/plan-validate",
    binding.aspect,
    `${binding.planId}.plan.md`,
  );
  const draft = join(root, "prompts/plan/yadra/v1", binding.draftPlan);
  if (existsSync(validated)) {
    return { path: validated, tier: "plan-validate" };
  }
  if (existsSync(draft)) {
    return { path: draft, tier: "draft" };
  }
  throw new Error(`Plan introuvable: ${binding.planId} (${validated} | ${draft})`);
}

export function loadSkillBundle(root, skillRel) {
  const base = join(root, "yadra/skills", skillRel);
  const skillPath = join(base, "SKILL.md");
  const systemPath = join(base, "system.prompt.md");
  if (!existsSync(skillPath)) {
    throw new Error(`SKILL manquant: ${skillPath}`);
  }
  const skill = readFileSync(skillPath, "utf8");
  const system = existsSync(systemPath)
    ? readFileSync(systemPath, "utf8")
    : skill.slice(0, 2000);
  return { skillPath, systemPath, skill, system };
}

export function loadCommandContext(ws, bindingKey) {
  const binding = COMMAND_BINDINGS[bindingKey];
  if (!binding) throw new Error(`Unknown command binding: ${bindingKey}`);
  const root = resolveDistributionRoot(ws?.yadraProjectHome);
  const plan = resolvePlanFile(root, binding);
  const skillBundle = loadSkillBundle(root, binding.skill);
  const llm = llmFromWorkspace(ws);
  return {
    binding,
    bindingKey,
    root,
    plan,
    skill: skillBundle,
    llm,
  };
}

export function logCommandContext(ctx, verbose = false) {
  if (!verbose) return;
  console.log(
    `  [${ctx.binding.timeline}] plan (${ctx.plan.tier}): ${ctx.plan.path}`,
  );
  console.log(`  SKILL: ${ctx.skill.skillPath}`);
  console.log(
    `  LLM: profile=${ctx.llm.profile ?? "default"} model=${ctx.llm.model ?? "(configure)"}`,
  );
}
