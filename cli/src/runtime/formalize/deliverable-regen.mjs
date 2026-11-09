import { existsSync, readFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { moduleHasSpecsBlock } from "../../../vendor/yadral-dist/ksl/tools/yadra/lib/strip-ksl-comments.mjs";
import { fileKind, specIdFromPath } from "../../runtime/ksl-lib.mjs";
import { primaryDeliverablePath } from "../../util/feature-yadra.mjs";

function sealJsonPath(kslRoot, deliverableAbs) {
  const kind = fileKind(deliverableAbs);
  if (kind === "spec") {
    return join(kslRoot, ".yadra", "sealed", `${specIdFromPath(deliverableAbs)}.json`);
  }
  return join(kslRoot, ".yadra", "sealed", `${basename(deliverableAbs)}.json`);
}

/**
 * Doit-on relancer A · B · PRODUIRE (fichier absent, --force, --refresh, ou module stub) ?
 */
export function deliverablesNeedAbPhases({ kslRoot, feature, files, flags }) {
  if (flags.force) return { need: true, reason: "--force" };

  const missing = files.filter((f) => !existsSync(f));
  if (missing.length > 0) return { need: true, reason: "missing deliverable(s)" };

  const primaryRel = primaryDeliverablePath(feature.outputPaths);
  if (!primaryRel) return { need: false, reason: null };

  const primaryAbs = resolve(kslRoot, primaryRel);

  if (flags.refresh) {
    const seal = sealJsonPath(kslRoot, primaryAbs);
    if (!existsSync(seal)) {
      return { need: true, reason: "no T1 seal on disk (--refresh)" };
    }
  }

  if (feature.outputPaths.module && existsSync(primaryAbs)) {
    const related = feature.relatedSpecs ?? [];
    if (related.length > 0 && !moduleHasSpecsBlock(readFileSync(primaryAbs, "utf8"))) {
      return { need: true, reason: "module without specs = but related_specs in feature" };
    }
  }

  return { need: false, reason: null };
}
