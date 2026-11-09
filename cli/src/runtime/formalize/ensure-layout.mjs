import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";

function inferServiceName(specDirAbs) {
  const m = specDirAbs.replace(/\\/g, "/").match(/\/services\/([^/]+)(?:\/|$)/);
  return m?.[1] ?? basename(specDirAbs);
}

/**
 * Crée un sibling `<domain>.module.ksl` minimal si absent (L2 avant sceau spec).
 */
export function ensureLayoutForSpecOutput(kslRoot, specRel) {
  const specAbs = resolve(kslRoot, specRel);
  const dir = dirname(specAbs);
  const domain = basename(dir);
  const moduleAbs = join(dir, `${domain}.module.ksl`);
  if (existsSync(moduleAbs)) {
    return { path: moduleAbs, created: false };
  }
  mkdirSync(dir, { recursive: true });
  const service = inferServiceName(dir);
  const body = [
    "ksl 1.0",
    "",
    `module "${domain}" {`,
    `  service = "${service}"`,
    "",
    "  meta {",
    `    name = "${domain}"`,
    '    description = "Layout stub auto-created by yadra formalize (--ensure-layout)."',
    "  }",
    "}",
    "",
  ].join("\n");
  writeFileSync(moduleAbs, body, "utf8");
  return { path: moduleAbs, created: true };
}
