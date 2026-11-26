const ERROR_LINE = /ERROR|FAILED|FAILURE|Unresolved|e: /;

export function sandboxExcerpt(log) {
  const lines = String(log ?? "")
    .split(/\r?\n/)
    .filter((line) => ERROR_LINE.test(line));
  const picked = (lines.length > 0 ? lines : String(log ?? "").split(/\r?\n/).slice(-6)).slice(0, 12);
  return picked.join("\n");
}

export function errorSignature(log) {
  return sandboxExcerpt(log).trim();
}

export function pathsCitedBySandbox(log) {
  const found = [];
  const pattern = /(?:[\w.-]+\/)*[\w.-]+\.(?:kt|java|kts)/g;
  for (const match of String(log ?? "").matchAll(pattern)) {
    let rel = match[0].replaceAll("\\", "/");
    const srcAt = rel.lastIndexOf("src/");
    if (srcAt >= 0) rel = rel.slice(srcAt);
    rel = rel.replace(/^(?:root\/)+/, "");
    if (!found.includes(rel)) found.push(rel);
  }
  return found;
}

export function pathCited(rel, errorPaths) {
  return (errorPaths ?? []).some(
    (cited) => cited === rel || rel.endsWith(`/${cited}`) || cited.endsWith(`/${rel}`),
  );
}
