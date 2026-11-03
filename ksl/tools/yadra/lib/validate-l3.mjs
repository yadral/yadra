import { readFileSync } from "node:fs";
import { fileKind } from "./paths.mjs";
import { extractSpecMeta } from "./spec-extract.mjs";
import { validateOutputPhase } from "./output-phase.mjs";

export function validateL3(path) {
  if (fileKind(path) !== "spec") return [];
  const text = readFileSync(path, "utf8");
  const meta = extractSpecMeta(text);
  const errors = [];

  const needs = (k) => meta.kinds.includes(k);

  if (needs("docs") && !meta.hasDocs) {
    errors.push('outputs include "docs" but no docs { } block found');
  }
  if (needs("e2e") && !meta.hasE2e) {
    errors.push('outputs include "e2e" but no e2e { } block found');
  }
  if (needs("data") && !meta.hasData) {
    errors.push('outputs include "data" but no data { } block found');
  }

  for (const m of text.matchAll(/strategy\s+"([^"]+)"\s*\{([\s\S]*?)\}/g)) {
    if (!/\bdescription\s*=/.test(m[2])) {
      errors.push(`strategy "${m[1]}" missing required description = "..."`);
    }
  }

  if (!meta.module) {
    errors.push('spec missing module = "..."');
  }

  errors.push(...validateOutputPhase(meta));

  return errors;
}
