import { readFileSync } from "node:fs";

const HEADER = /^ksl\s+\d+\.\d+\s*;?\s*$/m;
const TOP_DECL = /\b(project|module|spec)\s+"/;

export function braceBalance(text) {
  let depth = 0;
  let inString = false;
  let inTriple = false;
  let escape = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next2 = text.slice(i, i + 3);
    if (inTriple) {
      if (next2 === '"""') {
        inTriple = false;
        i += 2;
      }
      continue;
    }
    if (inString) {
      if (escape) {
        escape = false;
        continue;
      }
      if (c === "\\") {
        escape = true;
        continue;
      }
      if (c === '"') inString = false;
      continue;
    }
    if (next2 === '"""') {
      inTriple = true;
      i += 2;
      continue;
    }
    if (c === '"') {
      inString = true;
      continue;
    }
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth < 0) return false;
    }
  }
  return depth === 0 && !inString && !inTriple;
}

export function validateL0(path) {
  const text = readFileSync(path, "utf8");
  const errors = [];
  if (!HEADER.test(text)) {
    errors.push("missing or invalid version header (expected: ksl 1.0)");
  }
  if (!TOP_DECL.test(text)) {
    errors.push("missing top-level project | module | spec declaration");
  }
  if (!braceBalance(text)) {
    errors.push("unbalanced { } (ignoring strings)");
  }
  return errors;
}
