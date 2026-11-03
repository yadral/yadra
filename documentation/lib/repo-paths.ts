import path from "node:path";

/** Product tree root (`yadra/`). */
export const YADRA_ROOT = path.join(process.cwd(), "..");

export const MANIFEST_PATH = path.join(YADRA_ROOT, "manifest.mf");

export const CLI_PACKAGE_JSON = path.join(YADRA_ROOT, "cli/package.json");

export const KSL_EBNF_PATH = path.join(YADRA_ROOT, "ksl/grammar/ksl.ebnf");

export const KSL_SPEC_PATH = path.join(YADRA_ROOT, "docs/ksl-language-spec.md");

export const KSL_REFERENCE_DIR = path.join(YADRA_ROOT, "docs/ksl/reference");
