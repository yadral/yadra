import { readFileSync } from "node:fs";

/** Lightweight syntax checks until full EBNF parser exists. */
export function validateL1(path) {
  const text = readFileSync(path, "utf8");
  const errors = [];
  let i = 0;
  let line = 1;
  let col = 0;
  let inLineComment = false;
  let inString = false;
  let inTriple = false;
  let escape = false;

  while (i < text.length) {
    const c = text[i];
    const next2 = text.slice(i, i + 3);

    if (c === "\n") {
      line++;
      col = 0;
      inLineComment = false;
      i++;
      continue;
    }
    col++;

    if (inLineComment) {
      i++;
      continue;
    }

    if (inTriple) {
      if (next2 === '"""') {
        inTriple = false;
        i += 3;
        col += 2;
        continue;
      }
      i++;
      continue;
    }

    if (inString) {
      if (escape) {
        escape = false;
        i++;
        continue;
      }
      if (c === "\\") {
        escape = true;
        i++;
        continue;
      }
      if (c === '"') inString = false;
      i++;
      continue;
    }

    if (next2 === "//") {
      inLineComment = true;
      i += 2;
      col++;
      continue;
    }
    if (next2 === '"""') {
      inTriple = true;
      i += 3;
      col += 2;
      continue;
    }
    if (c === '"') {
      inString = true;
      i++;
      continue;
    }

    if (c === "\0") {
      errors.push(`line ${line}: null character`);
    }
    i++;
  }

  if (inString) errors.push("unclosed double-quoted string");
  if (inTriple) errors.push("unclosed triple-quoted string");

  return errors;
}
