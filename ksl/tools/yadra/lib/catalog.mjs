import { readFileSync } from "node:fs";
import { join } from "node:path";

const SECTION_RE = /^\s*#\s*─+\s*(.+?)\s*─+/;

function parseScalar(line, key) {
  const re = new RegExp(`^\\s*${key}:\\s*(.+)$`);
  const m = line.match(re);
  if (!m) return null;
  let v = m[1].trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  return v;
}

function parseInlineList(line, key) {
  const re = new RegExp(`^\\s*${key}:\\s*\\[(.*)\\]\\s*$`);
  const match = line.match(re);
  if (!match) return null;
  return match[1]
    .split(",")
    .map((item) => item.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean);
}

/**
 * MVP parser for yadra/strategies/catalog.yaml (no YAML dependency).
 */
export function parseStrategyCatalog(text) {
  const versionMatch = text.match(/^version:\s*(\d+)/m);
  const version = versionMatch ? Number(versionMatch[1]) : null;

  let section = "Catalogue";
  const strategies = [];
  let current = null;
  let inHint = false;
  let hintLines = [];
  let inWhen = false;
  let whenKey = null;

  function flush() {
    if (!current) return;
    if (hintLines.length) {
      current.description_hint = hintLines.join("\n").trim();
    }
    strategies.push(current);
    current = null;
    hintLines = [];
    inHint = false;
  }

  for (const line of text.split("\n")) {
    const sec = line.match(SECTION_RE);
    if (sec) {
      section = sec[1].trim();
      continue;
    }

    const idM = line.match(/^\s*-\s*id:\s*(\S+)/);
    if (idM) {
      flush();
      current = { id: idM[1], section };
      continue;
    }

    if (!current) continue;

    if (/^\s*when:\s*$/.test(line)) {
      current.when = {};
      inWhen = true;
      whenKey = null;
      continue;
    }
    if (inWhen) {
      const arrKey = line.match(
        /^\s{6}(outputs_kinds_any|signals_any):\s*\[(.*)\]\s*$/,
      );
      if (arrKey) {
        const items = arrKey[2]
          .split(",")
          .map((s) => s.trim().replace(/^["']|["']$/g, ""))
          .filter(Boolean);
        current.when[arrKey[1]] = items;
        continue;
      }
      if (/^\s{4}\S/.test(line) && !/^\s{6}/.test(line)) {
        inWhen = false;
      } else {
        continue;
      }
    }

    if (inHint) {
      if (/^\s+\S/.test(line) || line.trim() === "") {
        hintLines.push(line.replace(/^\s{6}/, ""));
      } else {
        inHint = false;
        if (hintLines.length) {
          current.description_hint = hintLines.join("\n").trim();
          hintLines = [];
        }
      }
      if (inHint) continue;
    }

    const name = parseScalar(line, "name");
    if (name != null) {
      current.name = name;
      continue;
    }
    const role = parseScalar(line, "role");
    if (role != null) {
      current.role = role;
      continue;
    }
    const family = parseScalar(line, "family");
    if (family != null) {
      current.family = family;
      continue;
    }
    const skeleton = parseScalar(line, "skeleton");
    if (skeleton != null) {
      current.skeleton = skeleton;
      continue;
    }
    const profile = parseScalar(line, "profile");
    if (profile != null) {
      current.profile = profile;
      continue;
    }
    const requires = parseInlineList(line, "requires");
    if (requires != null) {
      current.requires = requires;
      continue;
    }
    if (/^\s*description_hint:\s*\|\s*$/.test(line)) {
      inHint = true;
      hintLines = [];
    }
  }
  flush();

  return { version, strategies };
}

export function catalogPath(distRoot) {
  return join(distRoot, "yadra/strategies/catalog.yaml");
}

export function loadStrategyCatalog(distRoot) {
  const path = catalogPath(distRoot);
  const text = readFileSync(path, "utf8");
  return { path, ...parseStrategyCatalog(text) };
}
