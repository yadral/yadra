import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PKG_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const VENDOR_ROOT = join(PKG_ROOT, "vendor/yadral-dist");
const YADRA_ROOT = resolve(PKG_ROOT, "..");

export function packageRoot() {
  return PKG_ROOT;
}

/** Racine installée ou arbre `yadra/` en dev (ksl/, prompts/, manifest.mf). */
export function distRoot() {
  if (existsSync(join(VENDOR_ROOT, "yadra/manifest.mf"))) {
    return resolve(VENDOR_ROOT);
  }
  if (existsSync(join(YADRA_ROOT, "manifest.mf"))) {
    return YADRA_ROOT;
  }
  throw new Error(
    "Distribution Yadra introuvable. Dans yadra/cli : npm install (prepare → vendor).",
  );
}

export function defaultYadraProjectHome() {
  if (process.env.YADRA_PROJECT_HOME) {
    return resolve(process.env.YADRA_PROJECT_HOME);
  }
  return distRoot();
}

export function defaultKslHome() {
  if (process.env.KSL_HOME) return resolve(process.env.KSL_HOME);
  return join(distRoot(), "ksl");
}

export function kslLibDir() {
  return join(distRoot(), "ksl/tools/yadra/lib");
}

/** Définir YADRA_PROJECT_HOME et KSL_HOME si absents (install npm). */
export function applyInstallEnv() {
  if (!process.env.YADRA_PROJECT_HOME) {
    process.env.YADRA_PROJECT_HOME = defaultYadraProjectHome();
  }
  if (!process.env.KSL_HOME) {
    process.env.KSL_HOME = defaultKslHome();
  }
}
