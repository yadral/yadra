#!/usr/bin/env node
/**
 * Phase-0 KSL checks — delegates to yadra validate L0.
 * Usage: node check.mjs <file.ksl | directory>
 */
import { resolve } from "node:path";
import { runValidate } from "../yadra/lib/validate.mjs";

const roots = process.argv.slice(2);
if (roots.length === 0) {
  console.error("Usage: node check.mjs <file.ksl | directory>");
  process.exit(2);
}

let exitCode = 0;
for (const root of roots) {
  const r = runValidate(resolve(root), {
    syntax: false,
    layout: false,
    semantic: false,
    format: "human",
  });
  if (!r.ok) exitCode = 1;
}
process.exit(exitCode);
