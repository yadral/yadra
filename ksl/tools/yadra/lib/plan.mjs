import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { extractSpecMeta } from "./spec-extract.mjs";
import { loadStrategyCatalog } from "./catalog.mjs";
import { resolveOutputRouting } from "./output-phase.mjs";

function normalized(value) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function resolveCatalogStrategy(catalog, name) {
  const query = normalized(name);
  return (
    catalog.find((entry) => normalized(entry.id) === query) ??
    catalog.find((entry) => normalized(entry.name) === query) ??
    (query === "outbox"
      ? catalog.find((entry) => entry.id === "transactional-outbox")
      : null)
  );
}

function roleRank(role) {
  return { architecture: 0, pattern: 1, testing: 2 }[role] ?? 3;
}

export function buildPlan(specPath, options = {}) {
  const text = readFileSync(specPath, "utf8");
  const meta = extractSpecMeta(text);
  const specId = basename(specPath, ".spec.ksl");
  const routing = resolveOutputRouting(meta);
  const rolePool =
    options.phaseRole === "execute"
      ? routing.executeKinds
      : options.phaseRole === "gate"
        ? routing.gateKinds
        : routing.allKinds;
  const requestedKinds =
    options.kinds?.length > 0
      ? rolePool.filter((k) => options.kinds.includes(k))
      : rolePool;
  const kinds = requestedKinds.filter((kind) => kind !== "ksl");

  const catalog = options.distRoot
    ? loadStrategyCatalog(options.distRoot).strategies
    : [];
  const strategies = meta.strategies
    .map((declared) => {
      const entry = resolveCatalogStrategy(catalog, declared.name);
      return {
        declaredName: declared.name,
        role: declared.role ?? entry?.role ?? null,
        id: entry?.id ?? null,
        name: entry?.name ?? declared.name,
        skeleton: entry?.skeleton ?? null,
        profile: entry?.profile ?? null,
        resolved: Boolean(entry),
      };
    })
    .sort((a, b) => roleRank(a.role) - roleRank(b.role));

  return {
    spec: specId,
    module: meta.module,
    kinds,
    outputPhase: {
      execute: routing.executeKinds,
      gate: routing.gateKinds,
      explicit: routing.hasExplicitPhase,
    },
    dataTargets: [...new Set(meta.dataTargets)],
    budget: meta.budget,
    strategies,
    questions: strategies
      .filter((strategy) => !strategy.resolved)
      .map((strategy) => `Strategy inconnue du catalogue : ${strategy.declaredName}`),
  };
}

export function formatPlanHuman(plan) {
  const lines = [
    `T2 · plan "${plan.spec}"`,
    `  module: ${plan.module ?? "(unknown)"}`,
    `  kinds: ${plan.kinds.join(", ") || "(none)"}`,
    `  phase.execute: ${plan.outputPhase?.execute?.join(", ") || "(none)"}`,
    `  phase.gate: ${plan.outputPhase?.gate?.join(", ") || "(none)"}`,
    `  data: ${plan.dataTargets.join(", ") || "(none)"}`,
    `  budget: ${JSON.stringify(plan.budget)}`,
    "",
    "Strategies (ordre de fusion):",
  ];

  if (plan.strategies.length === 0) {
    lines.push("  (none)");
  } else {
    for (const strategy of plan.strategies) {
      const canonical =
        strategy.declaredName === strategy.name
          ? strategy.name
          : `${strategy.declaredName} → ${strategy.name}`;
      const source = strategy.skeleton
        ? `yadra/strategies/${strategy.skeleton}`
        : strategy.resolved
          ? "(catalogue sans skeleton)"
          : "(non résolue)";
      lines.push(`  - ${canonical} [${strategy.role ?? "role?"}] — ${source}`);
    }
  }

  if (plan.questions.length > 0) {
    lines.push("", "Questions:");
    for (const question of plan.questions) lines.push(`  - ${question}`);
  }

  return lines.join("\n");
}

export function runPlan(specPath, options = {}) {
  const plan = buildPlan(specPath, options);
  if (options.format === "json") {
    console.log(JSON.stringify(plan, null, 2));
  } else {
    console.log(formatPlanHuman(plan));
  }
}
