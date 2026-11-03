import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const CLI_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const VENDOR = join(CLI_ROOT, "vendor/yadral-dist");

const REQUIRED = [
  "yadra/manifest.mf",
  "yadra/strategies/catalog.yaml",
  "yadra/skills/registry.yaml",
  "ksl/grammar/ksl.ebnf",
  "ksl/tools/yadra/lib/validate.mjs",
  "prompts/plan-validate/yadra-t1/t1-comprendre-intention.plan.md",
  "prompts/plan-validate/yadra-t2/t2-comprendre-contrat.plan.md",
  "prompts/plan-validate/yadra-t2/t2-produire-artefacts.plan.md",
  "yadra/skills/execute/partie-a-comprendre/SKILL.md",
  "yadra/skills/execute/partie-b-produire/SKILL.md",
];

test("vendor tree matches pack:release expectations", () => {
  for (const rel of REQUIRED) {
    assert.ok(existsSync(join(VENDOR, rel)), `missing vendor/${rel} — run npm test or prepack`);
  }
});
