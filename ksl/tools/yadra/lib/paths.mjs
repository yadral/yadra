import { existsSync, readdirSync, statSync } from "node:fs";
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

const DELIVERABLE_SUFFIXES = [".spec.ksl", ".module.ksl", ".project.ksl"];

function isKslDeliverable(filePath) {
  return DELIVERABLE_SUFFIXES.some((s) => filePath.endsWith(s));
}

/**
 * Résout un livrable T1 (.spec | .module | .project) pour validate / seal.
 */
export function resolveKslDeliverablePath(input, cwd) {
  const p = resolve(cwd, input ?? ".");
  if (!existsSync(p)) {
    throw new Error(`Not found: ${p}`);
  }
  const st = statSync(p);
  if (st.isFile()) {
    if (isKslDeliverable(p) || p.endsWith(".ksl")) return p;
    throw new Error(
      `Not a KSL deliverable (.spec | .module | .project .ksl): ${p}`,
    );
  }
  if (st.isDirectory()) {
    const deliverables = collectKslPaths(p).filter((f) => isKslDeliverable(f));
    if (deliverables.length === 1) return deliverables[0];
    if (deliverables.length === 0) {
      throw new Error(`No .spec / .module / .project .ksl under ${p}`);
    }
    throw new Error(
      `Ambiguous directory: ${deliverables.length} deliverables. Pass a path explicitly:\n${deliverables.map((s) => `  - ${s}`).join("\n")}`,
    );
  }
  throw new Error(`Not a KSL deliverable: ${p}`);
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
