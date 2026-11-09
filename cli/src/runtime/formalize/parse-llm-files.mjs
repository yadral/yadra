const FILE_MARKER = /^---\s*FILE:\s*(.+?)\s*---\s*$/m;

export function extractMarkedFiles(modelText) {
  const parts = modelText.split(FILE_MARKER);
  if (parts.length < 3) return null;
  const files = [];
  for (let i = 1; i < parts.length; i += 2) {
    const rel = parts[i].trim();
    let body = parts[i + 1] ?? "";
    body = body.replace(/^```(?:ksl)?\s*\n?/i, "").replace(/\n?```\s*$/, "");
    files.push({ rel, content: body.trim() });
  }
  return files.length ? files : null;
}

function findDeliverablesStart(text) {
  const m = text.match(/^#+\s*deliverables\b/im);
  if (m?.index !== undefined) return m.index;
  const bare = text.match(/^deliverables\s*:?\s*$/im);
  if (bare?.index !== undefined) return bare.index;
  return -1;
}

function normalizeCompactHead(compact) {
  if (/^#+\s*deliverables\b/im.test(compact)) return compact;
  if (/^deliverables\b/im.test(compact)) {
    return compact.replace(/^deliverables\b/im, "# deliverables");
  }
  return compact;
}

export function extractSingleCompact(modelText) {
  const fenced =
    modelText.match(/```(?:compact\.ksl|ksl|text)?\s*\n([\s\S]*?)```/i)?.[1] ??
    null;
  const body = (fenced ?? modelText).trim();
  let start = findDeliverablesStart(body);
  if (start === -1) start = body.toLowerCase().indexOf("# deliverables");
  if (start === -1) return null;
  return normalizeCompactHead(body.slice(start).trim());
}
