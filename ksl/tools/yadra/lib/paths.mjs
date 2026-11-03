import { readdirSync, statSync } from "node:fs";
import { extname, join, basename, resolve } from "node:path";
import { requireProjectRoot } from "./context.mjs";

export function collectKslPaths(root) {
  const abs = resolve(root);
  const st = statSync(abs);
  if (st.isFile()) return extname(abs) === ".ksl" ? [abs] : [];
  const out = [];
  for (const name of readdirSync(abs)) {
    if (name === "node_modules" || name === ".git") continue;
    out.push(...collectKslPaths(join(abs, name)));
  }
  return out;
}

export function defaultPath(cwd) {
  return cwd;
}

export function resolveSpecPath(input, cwd) {
  if (input === undefined || input === null || input === "" || input === ".") {
    requireProjectRoot(cwd);
  }
  const p = resolve(cwd, input ?? ".");
  const st = statSync(p);
  if (st.isFile() && p.endsWith(".spec.ksl")) return p;
  if (st.isDirectory()) {
    const specs = collectKslPaths(p).filter((f) => f.endsWith(".spec.ksl"));
    if (specs.length === 1) return specs[0];
    if (specs.length === 0) throw new Error(`No .spec.ksl under ${p}`);
    throw new Error(
      `Ambiguous directory: ${specs.length} specs. Pass a .spec.ksl explicitly:\n${specs.map((s) => `  - ${s}`).join("\n")}`,
    );
  }
  throw new Error(`Not a .spec.ksl file: ${p}`);
}

export function fileKind(path) {
  if (path.endsWith(".spec.ksl")) return "spec";
  if (path.endsWith(".module.ksl")) return "module";
  if (path.endsWith(".project.ksl")) return "project";
  return "unknown";
}

export function specIdFromPath(path) {
  return basename(path, ".spec.ksl");
}
