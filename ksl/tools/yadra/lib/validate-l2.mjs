import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileKind } from "./paths.mjs";

export function validateL2(path) {
  const kind = fileKind(path);
  const text = readFileSync(path, "utf8");
  const errors = [];

  if (kind === "spec") {
    const mod = text.match(/^\s*module\s*=\s*"([^"]+)"/m);
    if (!mod) {
      errors.push("spec must declare module = \"<domain>\"");
    } else {
      const domain = mod[1];
      const dir = dirname(path);
      const folder = basename(dir);
      if (folder !== domain) {
        errors.push(
          `module = "${domain}" but parent folder is "${folder}" (expected modules/<domain>/)`,
        );
      }
      const expectedModuleFile = join(dir, `${domain}.module.ksl`);
      if (!existsSync(expectedModuleFile)) {
        errors.push(`missing sibling ${domain}.module.ksl in ${dir}`);
      } else {
        const modText = readFileSync(expectedModuleFile, "utf8");
        const specName = basename(path);
        const listed =
          modText.includes(`"${specName}"`) ||
          modText.includes(`'${specName}'`);
        if (!listed && /specs\s*=/.test(modText)) {
          errors.push(`${specName} not found in specs = [...] of ${expectedModuleFile}`);
        }
      }
    }
  }

  if (kind === "module") {
    const id = text.match(/^\s*module\s+"([^"]+)"/m);
    if (!id) {
      errors.push('module file must declare module "<id>"');
    } else {
      const domain = id[1];
      const expected = join(dirname(path), `${domain}.module.ksl`);
      if (basename(path) !== `${domain}.module.ksl`) {
        errors.push(`module id "${domain}" but file is ${basename(path)}`);
      }
      const specsMatch = text.match(/specs\s*=\s*\[([\s\S]*?)\]/);
      if (specsMatch) {
        const inner = specsMatch[1];
        const names = [...inner.matchAll(/"([^"]+\.spec\.ksl)"/g)].map((m) => m[1]);
        for (const name of names) {
          if (!existsSync(join(dirname(path), name))) {
            errors.push(`specs lists missing file: ${name}`);
          }
        }
      }
    }
  }

  if (kind === "project") {
    if (!/\bkind\s*=/.test(text) && !/\bstack\s*\{/.test(text)) {
      errors.push("project.ksl should declare kind and/or stack (convention)");
    }
  }

  return errors;
}
