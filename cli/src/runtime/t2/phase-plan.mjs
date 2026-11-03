import { readFileSync } from "node:fs";
import { chatCompletion } from "../llm/chat.mjs";
import {
  loadCommandContext,
  llmRuntime,
} from "../command-context.mjs";
import { distRoot } from "../distribution.mjs";
import { buildPlan, formatPlanHuman } from "../ksl-lib.mjs";
import { specializationPromptSections } from "./compile-context.mjs";

export async function producePlanSpecialization(specPath, options, ws) {
  const ctx = loadCommandContext(ws, "plan:A");
  const specText = readFileSync(specPath, "utf8");
  const planText = readFileSync(ctx.plan.path, "utf8");
  const root = distRoot();
  const deterministicPlan = buildPlan(specPath, {
    ...options,
    distRoot: root,
  });
  const user = specializationPromptSections({
    specText,
    deterministicPlan,
    planContractText: planText,
    skillText: ctx.skill.skill,
    distRootPath: root,
  });
  const messages = [
    { role: "system", content: ctx.skill.system.trim() },
    { role: "user", content: user },
  ];
  const narrative = await chatCompletion({
    ...llmRuntime(ctx.llm),
    messages,
  });
  return { deterministicPlan, specialization: narrative.trim() };
}

export async function runPlanWithAgent(specPath, options, ws) {
  const { deterministicPlan, specialization } = await producePlanSpecialization(
    specPath,
    options,
    ws,
  );
  if (options.format === "json") {
    process.stdout.write(`${JSON.stringify(deterministicPlan, null, 2)}\n`);
    return;
  }

  console.log(formatPlanHuman(deterministicPlan));
  console.log("");
  console.log("Spécialisation:");
  console.log(specialization);
}
