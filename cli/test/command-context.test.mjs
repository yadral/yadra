import assert from "node:assert/strict";
import test from "node:test";
import { resolvePlanFile, COMMAND_BINDINGS } from "../src/runtime/command-context.mjs";
import { distRoot } from "../src/runtime/distribution.mjs";

test("resolvePlanFile prefers plan-validate when present", () => {
  const root = distRoot();
  const binding = COMMAND_BINDINGS["formalize:A"];
  const resolved = resolvePlanFile(root, binding);
  assert.ok(resolved.path.includes("prompts/plan-validate"));
  assert.equal(resolved.tier, "plan-validate");
});

test("execute:B binding resolves T2 produire plan and skill", () => {
  const root = distRoot();
  const binding = COMMAND_BINDINGS["execute:B"];
  assert.equal(binding.planId, "t2-produire-artefacts");
  const resolved = resolvePlanFile(root, binding);
  assert.match(resolved.path, /t2-produire-artefacts\.plan\.md$/);
});

test("gate:C binding resolves T2 livrer gate plan and skill", () => {
  const root = distRoot();
  const binding = COMMAND_BINDINGS["gate:C"];
  assert.equal(binding.planId, "t2-livrer-gate");
  const resolved = resolvePlanFile(root, binding);
  assert.match(resolved.path, /t2-livrer-gate\.plan\.md$/);
});
