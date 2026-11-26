import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathsCitedBySandbox } from "./sandbox-errors.mjs";

const LADDERS = {
  "jvm-clash": [
    {
      id: "drop-nullable",
      deterministic: true,
      instruction: "Garde une seule fonction. Supprime la surcharge qui ne diffère que par la nullabilité.",
    },
    {
      id: "single-method",
      instruction: "Une seule méthode, sans deuxième surcharge. N'ajoute pas un convert nullable à côté du convert non nullable.",
    },
    {
      id: "widen-clash",
      widen: true,
      instruction: "Le choc de signature est toujours là. Supprime la méthode en double dans chaque fichier cité.",
    },
  ],
  "type-mismatch": [
    {
      id: "align-type",
      deterministic: true,
      instruction: "Aligne l'expression de la ligne citée sur le type attendu.",
    },
    {
      id: "rewrite-expr",
      instruction: "Change uniquement l'expression à la ligne citée pour produire le type attendu. Ne réécris pas les autres fonctions.",
    },
    {
      id: "widen-type",
      widen: true,
      instruction: "Le type attendu vient d'un autre fichier. Adapte l'appelant, pas le même cast.",
    },
  ],
  "unresolved-copy": [
    {
      id: "assign-fields",
      deterministic: true,
      instruction: "Cette classe n'a pas copy. Remplace .copy(...) par des affectations de propriétés.",
    },
    {
      id: "rewrite-copy",
      instruction: "Pas de data class. Affecte chaque propriété sur l'objet existant, puis sauvegarde-le.",
    },
  ],
  "test-failure": [
    {
      id: "fix-impl",
      widen: true,
      instruction: "L'assertion a échoué. Corrige le code de production cité dans la pile, pas le texte de l'assertion.",
    },
    {
      id: "fix-other-branch",
      widen: true,
      instruction: "La même assertion échoue. Change une autre branche du comportement, pas le même if.",
    },
    {
      id: "align-assertion",
      widen: true,
      instruction: "Si le service a déjà le comportement demandé, aligne l'assertion sur expected/but was. Sinon change le service.",
    },
  ],
  generic: [
    {
      id: "patch-line",
      instruction: "Corrige uniquement la ligne citée.",
    },
    {
      id: "rewrite-fn",
      instruction: "La même erreur est revenue. Réécris la fonction qui contient cette ligne avec une autre structure.",
    },
    {
      id: "widen",
      widen: true,
      instruction: "Inclus les fichiers de la pile. Change le site d'appel ou le contrat, pas la même ligne de la même façon.",
    },
  ],
};

export function classifyRepair(log) {
  const text = String(log ?? "");
  if (/Platform declaration clash|signature JVM en double|same JVM signature/i.test(text)) return "jvm-clash";
  if (/Type mismatch|Argument type mismatch|inferred type is/i.test(text)) return "type-mismatch";
  if (/Unresolved reference.*\bcopy\b|\bcopy\b.*Unresolved/i.test(text)) return "unresolved-copy";
  if (/expected:\s*</i.test(text) || /AssertionFailed|AssertionError/i.test(text)) return "test-failure";
  return "generic";
}

export function strategyFor(log, repeat = 0) {
  const kind = classifyRepair(log);
  const ladder = LADDERS[kind] ?? LADDERS.generic;
  const index = Math.min(Math.max(0, repeat), ladder.length - 1);
  const step = ladder[index];
  const extra = repeat >= ladder.length ? ` Tentative ${repeat + 1} : le source précédent est interdit.` : "";
  return { ...step, kind, instruction: `${step.instruction}${extra}` };
}

function jvmParamTypes(params) {
  if (!String(params ?? "").trim()) return "";
  return params.split(",").map((param) => {
    const type = (param.split(":")[1] ?? "").split("=")[0].trim().replace(/\?$/, "");
    return type || "_";
  }).join(",");
}

function scopeAt(lines) {
  const funs = [];
  const scopes = [];
  let pending = null;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!/^\s*\/\//.test(line)) {
      const decl = line.match(/\b(?:class|object|interface)\s+([A-Za-z_][\w]*)/);
      if (decl && !/\bfun\s/.test(line)) pending = decl[1];
      const fun = line.match(/\bfun\s+(?:<[^>\n]+>\s*)?([A-Za-z_][\w]*)\s*\(([^)]*)\)/);
      if (fun) {
        const key = `${scopes.filter(Boolean).join("/")}|${fun[1]}(${jvmParamTypes(fun[2])})`;
        const nullable = /\?/.test(fun[2]) || /\)\s*:\s*[^={\n]*\?/.test(line);
        funs.push({ index: i, key, nullable });
      }
    }
    for (const char of line) {
      if (char === "{") {
        if (pending) {
          scopes.push(pending);
          pending = null;
        } else scopes.push(null);
      } else if (char === "}") scopes.pop();
    }
  }
  return funs;
}

function removeFunction(lines, start) {
  const line = lines[start] ?? "";
  if (!line.includes("{") && line.includes("=")) {
    lines.splice(start, 1);
    return;
  }
  let depth = 0;
  let started = false;
  let end = start;
  for (let i = start; i < lines.length; i += 1) {
    for (const char of lines[i]) {
      if (char === "{") {
        depth += 1;
        started = true;
      } else if (char === "}") depth -= 1;
    }
    if (started && depth <= 0) {
      end = i;
      break;
    }
  }
  lines.splice(start, end - start + 1);
}

export function dropNullableOverload(source) {
  const lines = String(source ?? "").split(/\r?\n/);
  const funs = scopeAt(lines);
  const groups = new Map();
  for (const fun of funs) {
    const bucket = groups.get(fun.key) ?? [];
    bucket.push(fun);
    groups.set(fun.key, bucket);
  }
  const remove = [];
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    remove.push((group.find((fun) => fun.nullable) ?? group[1]).index);
  }
  if (remove.length === 0) return null;
  for (const index of remove.sort((a, b) => b - a)) removeFunction(lines, index);
  const next = lines.join("\n");
  return next === source ? null : next;
}

export function citedLines(log) {
  const found = [];
  const pattern = /((?:[\w.-]+\/)*[\w.-]+\.(?:kt|java|kts))(?::\s*\((\d+),\s*\d+\)|:\[(\d+),\s*\d+\]|:(\d+):\d+)/g;
  for (const match of String(log ?? "").matchAll(pattern)) {
    let rel = match[1].replaceAll("\\", "/");
    const srcAt = rel.lastIndexOf("src/");
    if (srcAt >= 0) rel = rel.slice(srcAt);
    rel = rel.replace(/^(?:root\/)+/, "");
    const line = Number(match[2] || match[3] || match[4]);
    if (!found.some((item) => item.rel === rel && item.line === line)) found.push({ rel, line });
  }
  return found;
}

function replaceLine(source, lineNo, mapLine) {
  const lines = String(source ?? "").split(/\r?\n/);
  const index = lineNo - 1;
  if (index < 0 || index >= lines.length) return null;
  const next = mapLine(lines[index]);
  if (next == null || next === lines[index]) return null;
  lines[index] = next;
  return lines.join("\n");
}

export function alignTypeOnLine(source, lineNo, log) {
  const text = String(log ?? "");
  const wantsBigDecimal = /BigDecimal was expected|but 'BigDecimal' was expected/i.test(text);
  const wantsString = /String was expected|but 'String' was expected/i.test(text);
  const inferredString = /inferred type is String|actual type is 'String'/i.test(text);
  const inferredBigDecimal = /inferred type is BigDecimal|actual type is 'BigDecimal'/i.test(text);
  return replaceLine(source, lineNo, (line) => {
    if (wantsBigDecimal && inferredString && line.includes(".toPlainString()")) {
      return line.replace(".toPlainString()", "");
    }
    if (wantsString && inferredBigDecimal && !line.includes(".toPlainString()")) {
      return line.replace(/\)(\s*,?\s*)$/, ").toPlainString()$1");
    }
    return null;
  });
}

function splitArgs(args) {
  const parts = [];
  let current = "";
  let quote = "";
  for (const char of args) {
    if (quote) {
      current += char;
      if (char === quote) quote = "";
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      current += char;
      continue;
    }
    if (char === ",") {
      parts.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

export function assignInsteadOfCopy(source, lineNo) {
  return replaceLine(source, lineNo, (line) => {
    if (/\breturn\b/.test(line)) return null;
    const match = line.match(/^(\s*)([A-Za-z_][\w]*)\.copy\((.*)\)\s*$/);
    if (!match) return null;
    const [, indent, receiver, args] = match;
    const fields = splitArgs(args).map((arg) => {
      const eq = arg.indexOf("=");
      if (eq === -1) return null;
      return `${indent}${receiver}.${arg.slice(0, eq).trim()} = ${arg.slice(eq + 1).trim()}`;
    });
    if (fields.some((field) => field == null)) return null;
    return fields.join("\n");
  });
}

function readSource(projectHome, rel) {
  try {
    return readFileSync(join(projectHome, rel), "utf8");
  } catch {
    return null;
  }
}

export function deterministicEdits(projectHome, log, step) {
  const marked = [];
  if (step.id === "drop-nullable") {
    for (const rel of pathsCitedBySandbox(log).filter((path) => path.endsWith(".kt") || path.endsWith(".kts"))) {
      const source = readSource(projectHome, rel);
      const next = source == null ? null : dropNullableOverload(source);
      if (next) marked.push({ rel, content: next });
    }
  }
  if (step.id === "align-type") {
    for (const cite of citedLines(log)) {
      const source = readSource(projectHome, cite.rel);
      const next = source == null ? null : alignTypeOnLine(source, cite.line, log);
      if (next) marked.push({ rel: cite.rel, content: next });
    }
  }
  if (step.id === "assign-fields") {
    for (const cite of citedLines(log)) {
      const source = readSource(projectHome, cite.rel);
      const next = source == null ? null : assignInsteadOfCopy(source, cite.line);
      if (next) marked.push({ rel: cite.rel, content: next });
    }
  }
  return marked;
}
