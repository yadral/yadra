import { loadStrategyCatalog } from "./catalog.mjs";

function filterStrategies(strategies, options) {
  return strategies.filter((s) => {
    if (options.family && s.family !== options.family) return false;
    if (options.role && s.role !== options.role) return false;
    if (options.section) {
      const q = options.section.toLowerCase();
      if (!s.section.toLowerCase().includes(q)) return false;
    }
    return true;
  });
}

function findStrategy(strategies, query) {
  const q = query.toLowerCase();
  return (
    strategies.find((s) => s.id.toLowerCase() === q) ??
    strategies.find((s) => s.name.toLowerCase() === q) ??
    strategies.find((s) => s.name.toLowerCase().includes(q))
  );
}

export function runStrategiesList(distRoot, options = {}) {
  const { version, strategies, path } = loadStrategyCatalog(distRoot);
  const filtered = filterStrategies(strategies, options);

  if (options.format === "json") {
    const payload = JSON.stringify(
      {
        catalogVersion: version,
        catalog: "yadra/strategies/catalog.yaml",
        count: filtered.length,
        strategies: filtered.map(({ description_hint, ...rest }) => ({
          ...rest,
          ...(options.includeHints && description_hint
            ? { description_hint }
            : {}),
        })),
      },
      null,
      2,
    );
    process.stdout.write(`${payload}\n`);
    return;
  }

  console.log(
    `Strategy catalog (v${version ?? "?"}) — ${filtered.length} entrée(s)`,
  );
  console.log(`  source: ${path}`);
  console.log("");

  let lastSection = null;
  for (const s of filtered) {
    if (s.section !== lastSection) {
      console.log(`## ${s.section}`);
      lastSection = s.section;
    }
    console.log(
      `  ${s.name.padEnd(22)} role=${s.role ?? "-"}  family=${s.family ?? "-"}  id=${s.id}`,
    );
  }
}

export function runStrategiesShow(distRoot, query, options = {}) {
  const { version, strategies, path } = loadStrategyCatalog(distRoot);
  const entry = findStrategy(strategies, query);
  if (!entry) {
    throw new Error(`Strategy not found in catalog: ${query}`);
  }

  if (options.format === "json") {
    process.stdout.write(
      `${JSON.stringify(
        {
          catalogVersion: version,
          catalog: "yadra/strategies/catalog.yaml",
          strategy: entry,
        },
        null,
        2,
      )}\n`,
    );
    return;
  }

  console.log(`${entry.name} (${entry.id})`);
  console.log(`  section: ${entry.section}`);
  console.log(`  role: ${entry.role ?? "-"}`);
  console.log(`  family: ${entry.family ?? "-"}`);
  if (entry.description_hint) {
    console.log("");
    console.log(entry.description_hint);
  }
}
