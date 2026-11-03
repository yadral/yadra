/** Regex-based extraction for plan / semantic checks (not a full parser). */

export function extractSpecMeta(text) {
  const module = text.match(/^\s*module\s*=\s*"([^"]+)"/m)?.[1] ?? null;
  const kindsBlock = text.match(/outputs\s*\{[\s\S]*?kinds\s*=\s*\[([\s\S]*?)\]/);
  const parseList = (inner) =>
    inner ? [...inner.matchAll(/"([^"]+)"/g)].map((m) => m[1]) : [];

  const kinds = kindsBlock ? parseList(kindsBlock[1]) : [];

  const phaseBlock = text.match(/\bphase\s*\{([\s\S]*?)\}/);
  let phaseExecute = null;
  let phaseGate = null;
  if (phaseBlock) {
    const inner = phaseBlock[1];
    const execInner = inner.match(/\bexecute\s*=\s*\[([\s\S]*?)\]/)?.[1];
    const gateInner = inner.match(/\bgate\s*=\s*\[([\s\S]*?)\]/)?.[1];
    phaseExecute = execInner ? parseList(execInner) : [];
    phaseGate = gateInner ? parseList(gateInner) : [];
  }

  const budget = {};
  const budgetBlock = text.match(/budget\s*\{([\s\S]*?)\}/);
  if (budgetBlock) {
    for (const m of budgetBlock[1].matchAll(/(\w+)\s*=\s*(\d+)/g)) {
      budget[m[1]] = Number(m[2]);
    }
  }

  let architecture = null;
  const patternList = [];
  let testing = null;
  const strategies = [];
  for (const m of text.matchAll(/strategy\s+"([^"]+)"\s*\{([\s\S]*?)\}/g)) {
    const name = m[1];
    const body = m[2];
    const role = body.match(/\brole\s*=\s*"([^"]+)"/)?.[1]?.toLowerCase() ?? "";
    const description =
      body.match(/\bdescription\s*=\s*"""([\s\S]*?)"""/)?.[1]?.trim() ??
      body.match(/\bdescription\s*=\s*"([^"]*)"/)?.[1]?.trim() ??
      "";
    strategies.push({ name, role: role || null, description });
    if (role === "architecture" && !architecture) architecture = name;
    else if (role === "pattern") patternList.push(name);
    else if (role === "testing" && !testing) testing = name;
  }

  const hasBlock = (name) => new RegExp(`\\b${name}\\s*\\{`).test(text);

  const dataTargets = [...text.matchAll(/\b(postgres|mysql|bigquery|s3|gcs|redis)\s*\{/g)].map(
    (m) => m[1],
  );

  return {
    module,
    kinds,
    phaseExecute,
    phaseGate,
    budget,
    architecture,
    testing,
    patterns: patternList,
    strategies,
    hasDocs: hasBlock("docs"),
    hasE2e: hasBlock("e2e"),
    hasData: hasBlock("data"),
    dataTargets,
  };
}
