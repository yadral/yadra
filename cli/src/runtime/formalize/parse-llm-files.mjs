const FILE_MARKER = /^---\s*FILE:\s*(.+?)\s*---\s*$/m;

const SOURCE_EXT = new Set(["kt", "kts", "java"]);

const CODE_START =
  /[{};=<>@]|^\s*(\/\/|\/\*|\*(\/|\s)|package\b|import\b|class\b|fun\b|interface\b|object\b|val\b|var\b|typealias\b|public\b|private\b|protected\b|internal\b|abstract\b|data\b|sealed\b|enum\b|open\b|override\b|suspend\b|companion\b|const\b|lateinit\b|return\b|if\b|when\b|else\b|for\b|while\b|try\b|catch\b|throw\b|@)/;

function isProse(text) {
  const line = String(text ?? "").trim();
  if (!line || line.startsWith("```")) return Boolean(line);
  if (CODE_START.test(line)) return false;
  return line.split(/\s+/).length >= 4;
}

function cutTrailingProse(line) {
  let depth = 0;
  let inString = false;
  let closeAt = -1;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"' && line[i - 1] !== "\\") inString = !inString;
    if (inString) continue;
    if (char === "/" && line[i + 1] === "/") break;
    if (char === "{") depth += 1;
    if (char === "}") {
      if (depth > 0) depth -= 1;
      closeAt = i;
    }
  }
  if (closeAt === -1 || closeAt >= line.length - 1) return line;
  const rest = line.slice(closeAt + 1);
  if (!isProse(rest)) return line;
  return line.slice(0, closeAt + 1);
}

export function cleanMarkedBody(rel, body) {
  let text = unwrapFencedSource(body);
  const ext = String(rel ?? "").split(".").pop()?.toLowerCase() ?? "";
  if (!SOURCE_EXT.has(ext)) return text;
  const kept = [];
  for (const line of text.split(/\r?\n/)) {
    if (line.trim().startsWith("```") || /^---+$/.test(line.trim())) continue;
    const cut = cutTrailingProse(line);
    if (isProse(cut)) continue;
    kept.push(cut);
  }
  text = kept.join("\n").trim();
  if (!text || text.includes("```") || text.split(/\r?\n/).some((line) => isProse(line))) {
    throw new Error(`source illisible: ${rel}`);
  }
  return text;
}

function jvmParamTypes(params) {
  if (!String(params ?? "").trim()) return "";
  return params.split(",").map((param) => {
    const type = (param.split(":")[1] ?? "").split("=")[0].trim().replace(/\?$/, "");
    return type || "_";
  }).join(",");
}

/** Two Kotlin functions whose JVM descriptors match once nullability is erased. */
export function assertDistinctJvmSignatures(rel, content) {
  const ext = String(rel ?? "").split(".").pop()?.toLowerCase() ?? "";
  if (ext !== "kt" && ext !== "kts") return;
  const scopes = [];
  let depth = 0;
  let pending = null;
  const seen = new Map();
  const scopeKey = () => scopes.filter(Boolean).join("/") || "file";

  for (const line of String(content ?? "").split(/\r?\n/)) {
    if (!/^\s*\/\//.test(line)) {
      const decl = line.match(/\b(?:class|object|interface)\s+([A-Za-z_][\w]*)/);
      if (decl && !/\bfun\s/.test(line)) pending = decl[1];
      const fun = line.match(/\bfun\s+(?:<[^>\n]+>\s*)?([A-Za-z_][\w]*)\s*\(([^)]*)\)/);
      if (fun) {
        const sig = `${fun[1]}(${jvmParamTypes(fun[2])})`;
        const key = scopeKey();
        const bucket = seen.get(key) ?? new Set();
        if (bucket.has(sig)) {
          throw new Error(`signature JVM en double: ${sig} dans ${rel}`);
        }
        bucket.add(sig);
        seen.set(key, bucket);
      }
    }
    for (const char of line) {
      if (char === "{") {
        depth += 1;
        if (pending) {
          scopes[depth] = pending;
          pending = null;
        }
      } else if (char === "}") {
        scopes[depth] = undefined;
        depth = Math.max(0, depth - 1);
      }
    }
  }
}

export function extractMarkedFiles(modelText) {
  const parts = modelText.split(FILE_MARKER);
  if (parts.length < 3) return null;
  const files = [];
  for (let i = 1; i < parts.length; i += 2) {
    const rel = parts[i].trim();
    const body = cleanMarkedBody(rel, parts[i + 1] ?? "");
    files.push({ rel, content: body });
  }
  return files.length ? files : null;
}

/** Drop a leading ```lang fence and any commentary after the closing fence. */
export function unwrapFencedSource(body) {
  let text = String(body ?? "").replace(/^\uFEFF/, "").trim();
  const open = text.match(/^```[a-zA-Z0-9_-]*[ \t]*\r?\n/);
  if (!open) return text;
  text = text.slice(open[0].length);
  const closeAt = text.search(/\r?\n```[ \t]*(?:\r?\n|$)/);
  if (closeAt !== -1) text = text.slice(0, closeAt);
  return text.trim();
}

function findDeliverablesStart(text) {
  const m = text.match(/^#+\s*deliverables\b/im);
  if (m?.index !== undefined) return m.index;
  const bare = text.match(/^deliverables\s*:?\s*$/im);
  if (bare?.index !== undefined) return bare.index;
  return -1;
}

function normalizeCompactHead(compact) {
  if (/^#+\s*deliverables\b/im.test(compact)) return compact;
  if (/^deliverables\b/im.test(compact)) {
    return compact.replace(/^deliverables\b/im, "# deliverables");
  }
  return compact;
}

export function extractSingleCompact(modelText) {
  const fenced =
    modelText.match(/```(?:compact\.ksl|ksl|text)?\s*\n([\s\S]*?)```/i)?.[1] ??
    null;
  const body = (fenced ?? modelText).trim();
  let start = findDeliverablesStart(body);
  if (start === -1) start = body.toLowerCase().indexOf("# deliverables");
  if (start === -1) return null;
  return normalizeCompactHead(body.slice(start).trim());
}
