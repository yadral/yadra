import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import {
  findRootProjectInDir,
  validateAndBuildContext,
} from "../runtime/ksl-lib.mjs";
import { assertProfileName } from "./load-configure.mjs";
import { defaultYadraProjectHome } from "./manifest.mjs";
import { projectsRegistryPath } from "./paths.mjs";

export const ENV_KSL = "KSL_PROJECT_HOME";
export const ENV_PROJECT = "PROJECT_HOME";
export const ENV_YADRA = "YADRA_PROJECT_HOME";
export const ENV_MODEL = "YADRA_MODEL";
export const ENV_YADRA_PROJECT = "YADRA_PROJECT";
const ENV_KSL_TOOL_ROOT = "YADRA_PROJECT_ROOT";

const PROJECT_NAME_RE = /^[a-zA-Z][a-zA-Z0-9_-]*$/;

export function assertProjectName(name) {
  if (!name || !PROJECT_NAME_RE.test(name)) {
    throw new Error(
      `Invalid project name "${name ?? ""}". Use letters, digits, _ or - (must start with a letter).`,
    );
  }
}

function readJson(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

function absPath(cwd, p) {
  return resolve(cwd, p);
}

function normalizeProjectEntry(raw, name) {
  if (!raw || typeof raw !== "object") return null;
  const ksl = raw.kslProjectHome ?? raw.projectRoot ?? null;
  if (!ksl) return null;
  return {
    name,
    kslProjectHome: resolve(ksl),
    projectHome: raw.projectHome ? resolve(raw.projectHome) : null,
    yadraProjectHome: raw.yadraProjectHome
      ? resolve(raw.yadraProjectHome)
      : defaultYadraProjectHome(),
    rootProjectFile: raw.rootProjectFile ?? null,
    projectId: raw.projectId ?? null,
    llm: raw.llm ?? {},
    updatedAt: raw.updatedAt ?? null,
  };
}

export function loadProjectsRegistry() {
  const raw = readJson(projectsRegistryPath());
  if (!raw || typeof raw !== "object") {
    return { version: 1, current: null, projects: {} };
  }
  const projects = {};
  for (const [name, entry] of Object.entries(raw.projects ?? {})) {
    const norm = normalizeProjectEntry(entry, name);
    if (norm) projects[name] = norm;
  }
  return {
    version: raw.version ?? 1,
    current:
      typeof raw.current === "string" && projects[raw.current]
        ? raw.current
        : null,
    projects,
  };
}

function saveProjectsRegistry(registry) {
  const payload = {
    version: 1,
    current: registry.current,
    projects: {},
  };
  for (const [name, p] of Object.entries(registry.projects)) {
    payload.projects[name] = {
      kslProjectHome: p.kslProjectHome,
      projectHome: p.projectHome ?? undefined,
      yadraProjectHome: p.yadraProjectHome ?? undefined,
      rootProjectFile: p.rootProjectFile ?? undefined,
      projectId: p.projectId ?? undefined,
      llm: Object.keys(p.llm ?? {}).length ? p.llm : undefined,
      updatedAt: p.updatedAt ?? undefined,
    };
  }
  mkdirSync(dirname(projectsRegistryPath()), { recursive: true });
  writeFileSync(
    projectsRegistryPath(),
    `${JSON.stringify(payload, null, 2)}\n`,
  );
}

export function listProjects() {
  const reg = loadProjectsRegistry();
  return { current: reg.current, projects: reg.projects };
}

export function getProject(name) {
  const reg = loadProjectsRegistry();
  return reg.projects[name] ?? null;
}

export function resolveWorkspace(cwd = process.cwd(), options = {}) {
  const projectName =
    options.projectName ??
    process.env[ENV_YADRA_PROJECT] ??
    null;

  let base = null;

  const envKsl =
    process.env[ENV_KSL] ??
    process.env[ENV_KSL_TOOL_ROOT] ??
    process.env.YADRA_CONTEXT;

  if (envKsl) {
    base = normalizeProjectEntry({ kslProjectHome: envKsl }, "_env");
  } else {
    const reg = loadProjectsRegistry();
    const name = projectName ?? reg.current;
    if (name && reg.projects[name]) {
      base = { ...reg.projects[name], name };
    }
  }

  if (!base) return null;

  return {
    ...base,
    projectHome: process.env[ENV_PROJECT]
      ? resolve(process.env[ENV_PROJECT])
      : base.projectHome,
    yadraProjectHome: process.env[ENV_YADRA]
      ? resolve(process.env[ENV_YADRA])
      : base.yadraProjectHome,
    llm: {
      ...(base.llm ?? {}),
      ...(process.env.YADRA_PROFILE
        ? { profile: process.env.YADRA_PROFILE }
        : {}),
      ...(process.env[ENV_MODEL] ? { model: process.env[ENV_MODEL] } : {}),
    },
  };
}

export function requireKslProjectHome(cwd = process.cwd(), options = {}) {
  const ws = resolveWorkspace(cwd, options);
  if (!ws?.kslProjectHome) {
    throw new Error(
      "No active Yadra project. Run: yadra project add <name> … then yadra project use <name>",
    );
  }
  if (!existsSync(ws.kslProjectHome)) {
    throw new Error(`KSL_PROJECT_HOME does not exist: ${ws.kslProjectHome}`);
  }
  return ws;
}

export function syncKslToolEnv(cwd = process.cwd(), options = {}) {
  const ws = resolveWorkspace(cwd, options);
  if (ws?.kslProjectHome) {
    process.env[ENV_KSL] = ws.kslProjectHome;
    process.env[ENV_KSL_TOOL_ROOT] = ws.kslProjectHome;
    process.env.YADRA_CONTEXT = ws.kslProjectHome;
  }
  if (ws?.projectHome) process.env[ENV_PROJECT] = ws.projectHome;
  if (ws?.yadraProjectHome) process.env[ENV_YADRA] = ws.yadraProjectHome;
  if (ws?.name && ws.name !== "_env") {
    process.env[ENV_YADRA_PROJECT] = ws.name;
  }
  const model = ws?.llm?.model ?? process.env[ENV_MODEL];
  if (model) process.env[ENV_MODEL] = model;
  const profile = ws?.llm?.profile ?? process.env.YADRA_PROFILE;
  if (profile) process.env.YADRA_PROFILE = profile;
}

function buildProjectRecord(cwd, options, existing = null) {
  const kslPath = options.kslProjectHome;
  if (!kslPath) {
    throw new Error("--ksl-project-home <path> is required.");
  }
  if (options.profile) assertProfileName(options.profile);
  const kslAbs = absPath(cwd, kslPath);
  if (options.allowPendingKsl) {
    mkdirSync(kslAbs, { recursive: true });
    const projectHome = options.projectHome
      ? absPath(cwd, options.projectHome)
      : existing?.projectHome ?? null;
    if (projectHome) mkdirSync(projectHome, { recursive: true });
    return {
      kslProjectHome: kslAbs,
      projectHome,
      yadraProjectHome: options.yadraProjectHome
        ? absPath(cwd, options.yadraProjectHome)
        : existing?.yadraProjectHome ?? defaultYadraProjectHome(),
      rootProjectFile: null,
      projectId: null,
      llm: {
        profile:
          options.profile ??
          existing?.llm?.profile ??
          "default",
        model: options.model ?? existing?.llm?.model ?? undefined,
      },
      updatedAt: new Date().toISOString(),
    };
  }
  const rootMeta = validateAndBuildContext(kslAbs);
  return {
    kslProjectHome: rootMeta.projectRoot,
    projectHome: options.projectHome
      ? absPath(cwd, options.projectHome)
      : existing?.projectHome ?? null,
    yadraProjectHome: options.yadraProjectHome
      ? absPath(cwd, options.yadraProjectHome)
      : existing?.yadraProjectHome ?? defaultYadraProjectHome(),
    rootProjectFile: rootMeta.rootProjectFile,
    projectId: rootMeta.projectId,
    llm: {
      profile:
        options.profile ??
        existing?.llm?.profile ??
        "default",
      model: options.model ?? existing?.llm?.model ?? undefined,
    },
    updatedAt: new Date().toISOString(),
  };
}

export function projectAdd(name, options, cwd = process.cwd()) {
  assertProjectName(name);
  const reg = loadProjectsRegistry();
  if (reg.projects[name]) {
    throw new Error(`Project already exists: ${name}. Use: yadra project update ${name}`);
  }
  const record = buildProjectRecord(cwd, options);
  reg.projects[name] = { ...record, name };
  if (options.setCurrent !== false) reg.current = name;
  saveProjectsRegistry(reg);
  applyProjectToProcessEnv(name, reg.projects[name]);
  return reg.projects[name];
}

function llmOnlyOptions(options) {
  return (
    !options.kslProjectHome &&
    !options.projectHome &&
    !options.yadraProjectHome &&
    (options.profile !== undefined || options.model !== undefined)
  );
}

export function projectSetProfile(name, options) {
  assertProjectName(name);
  if (!options.profile && options.model === undefined) {
    throw new Error("--profile <name> and/or --model <id> is required.");
  }
  if (options.profile) assertProfileName(options.profile);
  const reg = loadProjectsRegistry();
  const existing = reg.projects[name];
  if (!existing) {
    throw new Error(`Unknown project: ${name}. Run: yadra project list`);
  }
  const llm = { ...(existing.llm ?? {}) };
  if (options.profile) llm.profile = options.profile;
  if (options.model !== undefined) llm.model = options.model;
  reg.projects[name] = {
    ...existing,
    llm,
    updatedAt: new Date().toISOString(),
  };
  saveProjectsRegistry(reg);
  if (reg.current === name) applyProjectToProcessEnv(name, reg.projects[name]);
  return reg.projects[name];
}

export function projectUpdate(name, options, cwd = process.cwd()) {
  assertProjectName(name);
  const reg = loadProjectsRegistry();
  const existing = reg.projects[name];
  if (!existing) {
    throw new Error(`Unknown project: ${name}. Use: yadra project add ${name}`);
  }
  if (llmOnlyOptions(options)) {
    return projectSetProfile(name, options);
  }
  const partial = { ...options };
  if (!partial.kslProjectHome) partial.kslProjectHome = existing.kslProjectHome;
  const record = buildProjectRecord(cwd, partial, existing);
  reg.projects[name] = { ...record, name };
  saveProjectsRegistry(reg);
  if (reg.current === name) applyProjectToProcessEnv(name, reg.projects[name]);
  return reg.projects[name];
}

export function projectUse(name) {
  assertProjectName(name);
  const reg = loadProjectsRegistry();
  const p = reg.projects[name];
  if (!p) {
    throw new Error(`Unknown project: ${name}. Run: yadra project list`);
  }
  reg.current = name;
  saveProjectsRegistry(reg);
  applyProjectToProcessEnv(name, p);
  return p;
}

export function projectRemove(name) {
  assertProjectName(name);
  const reg = loadProjectsRegistry();
  if (!reg.projects[name]) {
    throw new Error(`Unknown project: ${name}`);
  }
  if (reg.current === name) {
    throw new Error(
      `Cannot remove active project "${name}". Run: yadra project use <other> first`,
    );
  }
  delete reg.projects[name];
  saveProjectsRegistry(reg);
}

export function projectClearCurrent() {
  const reg = loadProjectsRegistry();
  reg.current = null;
  saveProjectsRegistry(reg);
  delete process.env[ENV_KSL];
  delete process.env[ENV_KSL_TOOL_ROOT];
  delete process.env.YADRA_CONTEXT;
  delete process.env[ENV_PROJECT];
  delete process.env[ENV_YADRA];
  delete process.env[ENV_MODEL];
  delete process.env.YADRA_PROFILE;
  delete process.env[ENV_YADRA_PROJECT];
}

function applyProjectToProcessEnv(name, record) {
  process.env[ENV_KSL] = record.kslProjectHome;
  process.env[ENV_KSL_TOOL_ROOT] = record.kslProjectHome;
  process.env.YADRA_CONTEXT = record.kslProjectHome;
  process.env[ENV_YADRA_PROJECT] = name;
  if (record.projectHome) process.env[ENV_PROJECT] = record.projectHome;
  if (record.yadraProjectHome) process.env[ENV_YADRA] = record.yadraProjectHome;
  if (record.llm?.model) process.env[ENV_MODEL] = record.llm.model;
  if (record.llm?.profile) process.env.YADRA_PROFILE = record.llm.profile;
}

export function projectExportLines(ws) {
  const lines = [];
  if (ws.name && ws.name !== "_env") {
    lines.push(
      `export ${ENV_YADRA_PROJECT}='${String(ws.name).replace(/'/g, "'\\''")}'`,
    );
  }
  if (ws.yadraProjectHome) {
    lines.push(
      `export ${ENV_YADRA}='${ws.yadraProjectHome.replace(/'/g, "'\\''")}'`,
    );
  }
  lines.push(`export ${ENV_KSL}='${ws.kslProjectHome.replace(/'/g, "'\\''")}'`);
  if (ws.projectHome) {
    lines.push(
      `export ${ENV_PROJECT}='${ws.projectHome.replace(/'/g, "'\\''")}'`,
    );
  }
  if (ws.llm?.model) {
    lines.push(
      `export ${ENV_MODEL}='${String(ws.llm.model).replace(/'/g, "'\\''")}'`,
    );
  }
  if (ws.llm?.profile) {
    lines.push(
      `export YADRA_PROFILE='${String(ws.llm.profile).replace(/'/g, "'\\''")}'`,
    );
  }
  return lines;
}

export function removeProjectsRegistry() {
  const p = projectsRegistryPath();
  if (existsSync(p)) rmSync(p);
  projectClearCurrent();
}

export { findRootProjectInDir };
