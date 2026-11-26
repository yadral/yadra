import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { findRootProjectInDir } from "../runtime/ksl-lib.mjs";

const MAX_WALK = 48;

/**
 * Resolve a filesystem seed to a directory (file → parent).
 * @param {string} seedPath
 * @returns {string | null}
 */
export function seedDirectory(seedPath) {
  const abs = resolve(seedPath);
  if (!existsSync(abs)) return null;
  try {
    return statSync(abs).isDirectory() ? abs : dirname(abs);
  } catch {
    return null;
  }
}

/**
 * Walk up from startDir looking for a KSL monorepo root
 * (`*.project.ksl` with kind = "root"), including a nested `ksl/` folder.
 * @param {string} startDir
 * @returns {{ projectRoot: string, rootProjectFile: string, projectId: string } | null}
 */
export function walkFindRootProject(startDir) {
  let dir = resolve(startDir);
  for (let i = 0; i < MAX_WALK; i++) {
    const direct = findRootProjectInDir(dir);
    if (direct) return direct;

    const nestedKsl = join(dir, "ksl");
    if (existsSync(nestedKsl)) {
      const nested = findRootProjectInDir(nestedKsl);
      if (nested) return nested;
    }

    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

/**
 * Read `repo.path` from the root project file and resolve it against KSL_PROJECT_HOME.
 * @param {string} kslProjectHome
 * @param {{ rootProjectFile?: string | null }} [meta]
 * @returns {string | null}
 */
export function projectHomeFromRootRepo(kslProjectHome, meta = {}) {
  const rootFile =
    meta.rootProjectFile ??
    findRootProjectInDir(kslProjectHome)?.rootProjectFile ??
    null;
  if (!rootFile) return null;
  const absFile = join(kslProjectHome, rootFile);
  if (!existsSync(absFile)) return null;
  let text;
  try {
    text = readFileSync(absFile, "utf8");
  } catch {
    return null;
  }
  const repoBlock = text.match(/\brepo\s*\{([\s\S]*?)\n\s*\}/m)?.[1] ?? "";
  const repoPath = repoBlock.match(/\bpath\s*=\s*"([^"]+)"/)?.[1] ?? null;
  if (!repoPath) return null;
  return resolve(kslProjectHome, repoPath);
}

/**
 * Discover KSL_PROJECT_HOME (+ PROJECT_HOME via repo.path) from any path under the product tree.
 * @param {string} seedPath
 * @returns {{
 *   kslProjectHome: string,
 *   projectHome: string | null,
 *   rootProjectFile: string,
 *   projectId: string,
 * } | null}
 */
export function discoverWorkspaceFromPath(seedPath) {
  const startDir = seedDirectory(seedPath);
  if (!startDir) return null;
  const root = walkFindRootProject(startDir);
  if (!root) return null;
  const projectHome = projectHomeFromRootRepo(root.projectRoot, root);
  return {
    kslProjectHome: root.projectRoot,
    projectHome,
    rootProjectFile: root.rootProjectFile,
    projectId: root.projectId,
  };
}
