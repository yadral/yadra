#!/usr/bin/env node
/**
 * Copie la distribution minimale dans vendor/yadral-dist (tarball + dev).
 */
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const CLI_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const YADRA_ROOT = resolve(CLI_ROOT, "..");
const VENDOR = join(CLI_ROOT, "vendor/yadral-dist");

const PATHS = [
  { from: join(YADRA_ROOT, "manifest.mf"), to: "yadra/manifest.mf" },
  { from: join(YADRA_ROOT, "strategies"), to: "yadra/strategies" },
  { from: join(YADRA_ROOT, "skills"), to: "yadra/skills" },
  { from: join(YADRA_ROOT, "ksl/grammar"), to: "ksl/grammar" },
  { from: join(YADRA_ROOT, "ksl/tools/yadra/lib"), to: "ksl/tools/yadra/lib" },
  {
    from: join(YADRA_ROOT, "prompts/plan-validate"),
    to: "prompts/plan-validate",
  },
];

function main() {
  const strict = process.env.YADRA_VENDOR_STRICT === "1";
  if (!existsSync(join(YADRA_ROOT, "manifest.mf"))) {
    const msg = "sync-vendor: not in yadra tree (manifest.mf missing)";
    if (strict) {
      throw new Error(msg);
    }
    console.warn(`${msg}; skip`);
    return;
  }
  for (const { from } of PATHS) {
    if (!existsSync(from)) {
      throw new Error(`sync-vendor: missing ${from}`);
    }
  }
  rmSync(VENDOR, { recursive: true, force: true });
  mkdirSync(VENDOR, { recursive: true });
  for (const { from, to } of PATHS) {
    const dest = join(VENDOR, to);
    mkdirSync(dirname(dest), { recursive: true });
    cpSync(from, dest, { recursive: true });
  }
  console.log(`vendor: copied → ${VENDOR}`);
}

main();
