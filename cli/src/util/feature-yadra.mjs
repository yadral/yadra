import { readFileSync } from "node:fs";
import { join } from "node:path";

/** Ordre de priorité pour seal / ancrage LLM (spec métier d’abord, puis module, puis racine projet). */
export const DELIVERABLE_OUTPUT_KEYS = ["spec", "module", "root"];

/** Chemin relatif KSL principal déclaré dans feature.yadra.md (au moins un des trois requis pour formalize). */
export function primaryDeliverablePath(outputPaths) {
  if (!outputPaths) return null;
  for (const key of DELIVERABLE_OUTPUT_KEYS) {
    const rel = outputPaths[key];
    if (rel) return rel;
  }
  return null;
}

export function hasDeliverableOutputPaths(outputPaths) {
  return primaryDeliverablePath(outputPaths) !== null;
}

/** Minimal parser for feature.yadra.md (output_paths, kind). */
export function parseFeatureYadraContent(content) {
  const outputPaths = {};
  let outputIndent = null;

  for (const line of content.split(/\r?\n/)) {
    const outputHeader = line.match(/^(\s*)output_paths:\s*(?:#.*)?$/i);
    if (outputHeader) {
      outputIndent = outputHeader[1].length;
      continue;
    }

    if (outputIndent !== null) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const indent = line.match(/^\s*/)[0].length;
      if (indent <= outputIndent) {
        outputIndent = null;
      } else {
        const field = line.match(
          /^\s+(module|spec|root):\s*(?:"([^"]+)"|'([^']+)'|([^#]+?))\s*(?:#.*)?$/,
        );
        if (field) {
          const value = (field[2] ?? field[3] ?? field[4] ?? "").trim();
          if (value) outputPaths[field[1]] = value;
        }
      }
    }
  }
  const kindM = content.match(/^kind:\s*(\S+)/im);
  return {
    kind: kindM?.[1] ?? null,
    outputPaths,
  };
}

export function loadFeatureYadra(docDir) {
  const path = join(docDir, "feature.yadra.md");
  const content = readFileSync(path, "utf8");
  return { path, ...parseFeatureYadraContent(content) };
}
