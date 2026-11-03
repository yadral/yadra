import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { resolveKslHome } from "./ksl-home.mjs";

/** @deprecated Monorepo stub — CLI packagé : `yadra project` + ENV_KSL ; voir prompts/plan/yadra/cli/yadra-project-roots.md */
export const ENV_PROJECT_ROOT = "YADRA_PROJECT_ROOT";
export const ENV_CONTEXT_ALIAS = "YADRA_CONTEXT";

export function globalContextPath() {
  return join(homedir(), ".config", "yadra", "context.json");
}

export function localContextPath(projectRoot) {
  return join(projectRoot, ".yadra", "context.json");
}

function readProjectIslFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((n) => n.endsWith(".project.ksl"));
}

export function findRootProjectInDir(dir) {
  const absDir = resolve(dir);
  const files = readProjectIslFiles(absDir);
  for (const file of files) {
    const text = readFileSync(join(absDir, file), "utf8");
    if (!/kind\s*=\s*"root"/.test(text)) continue;
    const idMatch = text.match(/project\s+"([^"]+)"/);
    return {
      projectRoot: absDir,
      rootProjectFile: file,
      projectId: idMatch?.[1] ?? file,
    };
  }
  return null;
}

export function resolveCandidateDir(inputPath) {
  const abs = resolve(inputPath);
  if (!existsSync(abs)) {
    throw new Error(`Path does not exist: ${abs}`);
  }
  const st = statSync(abs);
  return st.isDirectory() ? abs : dirname(abs);
}

export function validateAndBuildContext(inputPath) {
  const dir = resolveCandidateDir(inputPath);
  const root = findRootProjectInDir(dir);
  if (!root) {
    const files = readProjectIslFiles(dir);
    if (files.length === 0) {
      throw new Error(
        `No *.project.ksl in ${dir}. Point to the KSL monorepo root (directory containing root project with kind = "root").`,
      );
    }
    throw new Error(
      `No root KSL project in ${dir}. Found ${files.join(", ")} but none with kind = "root".`,
    );
  }
  return {
    ...root,
    setAt: new Date().toISOString(),
  };
}

export function saveContext(record) {
  const globalPath = globalContextPath();
  mkdirSync(dirname(globalPath), { recursive: true });
  writeFileSync(globalPath, JSON.stringify(record, null, 2));

  const localPath = localContextPath(record.projectRoot);
  mkdirSync(dirname(localPath), { recursive: true });
  writeFileSync(localPath, JSON.stringify(record, null, 2));
}

export function loadGlobalContext() {
  const path = globalContextPath();
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

export function loadLocalContextFromWalk(cwd) {
  let dir = resolve(cwd);
  for (let i = 0; i < 32; i++) {
    const path = join(dir, ".yadra", "context.json");
    if (existsSync(path)) {
      try {
        return JSON.parse(readFileSync(path, "utf8"));
      } catch {
        return null;
      }
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

export function resolveProjectRoot(cwd = process.cwd()) {
  const fromEnv = process.env[ENV_PROJECT_ROOT] || process.env[ENV_CONTEXT_ALIAS];
  if (fromEnv) {
    const abs = resolve(fromEnv);
    if (!existsSync(abs)) {
      throw new Error(`${ENV_PROJECT_ROOT} points to missing path: ${abs}`);
    }
    return abs;
  }

  const global = loadGlobalContext();
  if (global?.projectRoot && existsSync(global.projectRoot)) {
    return resolve(global.projectRoot);
  }

  const local = loadLocalContextFromWalk(cwd);
  if (local?.projectRoot && existsSync(local.projectRoot)) {
    return resolve(local.projectRoot);
  }

  return null;
}

export function requireProjectRoot(cwd = process.cwd()) {
  const root = resolveProjectRoot(cwd);
  if (!root) {
    throw new Error(
      'No active Yadra project. Run: yadra project add <name> … then yadra project use <name>',
    );
  }
  return root;
}

export function contextSet(inputPath) {
  const record = validateAndBuildContext(inputPath);
  saveContext(record);
  process.env[ENV_PROJECT_ROOT] = record.projectRoot;
  process.env[ENV_CONTEXT_ALIAS] = record.projectRoot;
  return record;
}

export function contextShow(cwd) {
  const record = loadGlobalContext();
  const activeRoot = resolveProjectRoot(cwd);
  const islHome = process.env.KSL_HOME ?? resolveKslHome();

  console.log("Yadra project context");
  if (activeRoot) {
    console.log(`  ${ENV_PROJECT_ROOT}: ${activeRoot}`);
    const rootMeta = findRootProjectInDir(activeRoot);
    if (rootMeta) {
      console.log(`  root file: ${rootMeta.rootProjectFile}`);
      console.log(`  project id: ${rootMeta.projectId}`);
    }
  } else {
    console.log(`  ${ENV_PROJECT_ROOT}: (not set)`);
  }
  if (record) {
    console.log(`  global config: ${globalContextPath()}`);
    console.log(`  saved at: ${record.setAt ?? "unknown"}`);
  } else {
    console.log(`  global config: (none)`);
  }
  console.log(`  KSL_HOME: ${islHome}`);
}

export function contextExport() {
  const root = resolveProjectRoot();
  if (!root) {
    console.error(
      'No active Yadra project. Run: yadra project add <name> … then yadra project use <name>',
    );
    process.exit(1);
  }
  const escaped = root.replace(/'/g, "'\\''");
  console.log(`export ${ENV_PROJECT_ROOT}='${escaped}'`);
  console.log(`export ${ENV_CONTEXT_ALIAS}='${escaped}'`);
}

export function contextClear() {
  const globalPath = globalContextPath();
  if (existsSync(globalPath)) rmSync(globalPath);
  delete process.env[ENV_PROJECT_ROOT];
  delete process.env[ENV_CONTEXT_ALIAS];
  console.log("Cleared global Yadra context.");
}

/** Resolve PATH for validate: explicit path vs cwd (requires context). */
export function resolveCommandPath(pathArg, cwd) {
  const useDefault = pathArg === undefined || pathArg === null || pathArg === "" || pathArg === ".";
  if (useDefault) {
    requireProjectRoot(cwd);
    return resolve(cwd, ".");
  }
  return resolve(cwd, pathArg);
}
