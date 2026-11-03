import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  applyBindingTemplate,
  packagePathToFileRel,
} from "./t2-bindings.mjs";

const TEST_PATH_PREFIXES = [
  "usecase.",
  "tester.",
  "suite.",
  "testutil.",
  "config.",
];

function isTestPackagePath(packagePath) {
  return TEST_PATH_PREFIXES.some((prefix) => packagePath.startsWith(prefix));
}

export function parseSkeletonParticipants(skeletonText) {
  const participants = [];
  const re = /participant\s+"([^"]+)"\s*\{([\s\S]*?)\n\s*\}/g;
  for (const match of skeletonText.matchAll(re)) {
    const name = match[1];
    const body = match[2];
    const path = body.match(/\bpath\s*=\s*"([^"]+)"/)?.[1] ?? null;
    const optional = /\boptional\s*=\s*true/.test(body);
    if (path) participants.push({ name, path, optional });
  }
  return participants;
}

export function parseSkeletonRequiredRoles(skeletonText) {
  const block = skeletonText.match(/generation\s*\{([\s\S]*?)\n\s*\}/)?.[1] ?? "";
  const inner = block.match(/\brequired\s*=\s*\[([\s\S]*?)\]/)?.[1] ?? "";
  return [...inner.matchAll(/"([^"]+)"/g)]
    .map((m) => m[1])
    .filter((role) => /^[A-Z]/.test(role) && !role.includes(" "));
}

function roleRequired(requiredRoles, participantName) {
  if (requiredRoles.includes(participantName)) return true;
  if (participantName === "OutboundSpi" && requiredRoles.some((r) => /OutboundSpi/i.test(r))) {
    return true;
  }
  return false;
}

function shouldIncludeParticipant(participant, requiredRoles, strategyName, activeStrategyNames) {
  if (roleRequired(requiredRoles, participant.name)) return true;
  if (!participant.optional) return true;
  if (activeStrategyNames.has(strategyName)) return true;
  if (participant.name === "Validator" && activeStrategyNames.has("Validator")) return true;
  if (participant.name === "ResponseConverter" && activeStrategyNames.has("Populator/Converter")) {
    return true;
  }
  return false;
}

export function buildStrategyFileEntries(strategy, skeletonText, bindings, activeStrategyNames) {
  const participants = parseSkeletonParticipants(skeletonText);
  const requiredRoles = parseSkeletonRequiredRoles(skeletonText);
  const entries = [];
  for (const participant of participants) {
    if (!shouldIncludeParticipant(participant, requiredRoles, strategy.name, activeStrategyNames)) {
      continue;
    }
    const packagePath = applyBindingTemplate(participant.path, bindings);
    const test = isTestPackagePath(packagePath);
    const rel = packagePathToFileRel(bindings, packagePath, { test });
    entries.push({
      strategyId: strategy.id,
      strategyName: strategy.name,
      participant: participant.name,
      packagePath,
      path: rel,
      required: roleRequired(requiredRoles, participant.name) || !participant.optional,
    });
  }
  return entries;
}

export function buildFileManifest({ distRoot, deterministicPlan, bindings }) {
  const active = new Set(deterministicPlan.strategies.map((s) => s.name));
  const byPath = new Map();
  for (const strategy of deterministicPlan.strategies) {
    if (!strategy.skeleton) continue;
    const skeletonPath = join(distRoot, "yadra/strategies", strategy.skeleton);
    const skeletonText = readFileSync(skeletonPath, "utf8");
    const entries = buildStrategyFileEntries(
      strategy,
      skeletonText,
      bindings,
      active,
    );
    for (const entry of entries) {
      if (!byPath.has(entry.path)) byPath.set(entry.path, entry);
    }
  }
  return {
    bindings,
    files: [...byPath.values()],
    generatedAt: new Date().toISOString(),
  };
}

export function manifestForStrategy(fileManifest, strategyId) {
  return fileManifest.files.filter((f) => f.strategyId === strategyId);
}

export function assertManifestCoverage(writtenPaths, mandatoryPaths) {
  const missing = mandatoryPaths.filter((p) => !writtenPaths.has(p));
  if (missing.length === 0) return null;
  return `T2 B: missing mandatory files: ${missing.join(", ")}`;
}
