import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { findRootProjectInDir } from "./context.mjs";
import { extractSpecMeta } from "./spec-extract.mjs";

function readBlock(text, blockName) {
  const match = text.match(new RegExp(`\\b${blockName}\\s*\\{([\\s\\S]*?)\\n\\s*\\}`, "m"));
  return match?.[1] ?? "";
}

function readStringField(block, field) {
  return block.match(new RegExp(`\\b${field}\\s*=\\s*"([^"]+)"`))?.[1] ?? null;
}

function readListField(block, field) {
  const inner = block.match(new RegExp(`\\b${field}\\s*=\\s*\\[([\\s\\S]*?)\\]`))?.[1];
  if (!inner) return [];
  return [...inner.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

export function findServiceProjectNearSpec(specPath) {
  let dir = dirname(resolve(specPath));
  for (let i = 0; i < 14; i++) {
    if (!existsSync(dir)) break;
    for (const name of readdirSync(dir)) {
      if (!name.endsWith(".project.ksl")) continue;
      const text = readFileSync(join(dir, name), "utf8");
      if (!/kind\s*=\s*"service"/.test(text)) continue;
      return { file: join(dir, name), text, dir };
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function stackFromProjectText(text) {
  const stackBlock = readBlock(text, "stack");
  const repoBlock = readBlock(text, "repo");
  return {
    build: readStringField(stackBlock, "build"),
    runtime: readStringField(stackBlock, "runtime"),
    framework: readStringField(stackBlock, "framework"),
    data: readListField(stackBlock, "data"),
    repoPath: readStringField(repoBlock, "path"),
  };
}

function pascalCase(value) {
  return String(value ?? "")
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join("");
}

/** Segment de package : `momo-cm` → `momocm`. */
export function toPackageSegment(value) {
  const cleaned = String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
  return cleaned || "feature";
}

/**
 * Préfixe de fichier sous PROJECT_HOME.
 * Un `repo.path` qui contient `..` est résolu depuis le projet service :
 * s'il désigne PROJECT_HOME, le préfixe est vide (pas de `../../../root` dans les sorties).
 * Un chemin relatif simple (`services/order-service`) reste un sous-dossier.
 */
export function resolveRepoPrefix(repoPath, { serviceDir = null, projectHome = null } = {}) {
  const raw = String(repoPath ?? "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+|\/+$/g, "");
  if (!raw) return "";
  const segments = raw.split("/").filter(Boolean);
  const escapes = isAbsolute(String(repoPath ?? "")) || segments.includes("..");
  if (!escapes) return segments.join("/");
  if (!serviceDir || !projectHome) return "";
  const resolvedRepo = resolve(serviceDir, raw);
  const home = resolve(projectHome);
  if (resolvedRepo === home) return "";
  const rel = relative(home, resolvedRepo).replaceAll("\\", "/");
  if (!rel || rel === ".") return "";
  if (rel.split("/").includes("..") || isAbsolute(rel)) return "";
  return rel;
}

function inferEntity(specText, moduleName) {
  if (/\bOrder\b/.test(specText)) return "Order";
  if (/\bCart\b/.test(specText)) return "Cart";
  const capitalized = specText.match(/\b([A-Z][a-z]{2,})\s+(?:is|remains|stored)/);
  if (capitalized?.[1]) return capitalized[1];
  return pascalCase(moduleName) || "Entity";
}

function basePackageFromService(serviceProjectText, rootProjectText) {
  const serviceId =
    serviceProjectText?.match(/project\s+"([^"]+)"/)?.[1] ??
    rootProjectText?.match(/project\s+"([^"]+)"/)?.[1] ??
    "app";
  const slug = serviceId.toLowerCase().replace(/[^a-z0-9]+/g, "");
  const rootId =
    rootProjectText?.match(/project\s+"([^"]+)"/)?.[1]?.split("-")[0] ?? "yadral";
  return `com.${rootId.toLowerCase().replace(/[^a-z0-9]+/g, "")}.${slug || "app"}`;
}

function sourceExtension(runtime) {
  const r = (runtime ?? "java").toLowerCase();
  if (r === "kotlin") return "kt";
  return "java";
}

function inferTechnology(meta, serviceStack) {
  const data = meta.dataTargets?.[0] ?? serviceStack.data?.[0] ?? "postgres";
  if (data === "postgres" || data === "mysql") return "jpa";
  return data;
}

export function resolveT2Bindings({
  kslProjectHome,
  specPath,
  specText,
  projectHome = null,
}) {
  const meta = extractSpecMeta(specText);
  const module = meta.module ?? "feature";
  const feature = toPackageSegment(module);
  const Feature = pascalCase(module);
  const service = findServiceProjectNearSpec(specPath);
  const root = findRootProjectInDir(kslProjectHome);
  const rootText = root
    ? readFileSync(join(root.projectRoot, root.rootProjectFile), "utf8")
    : "";
  const serviceStack = service ? stackFromProjectText(service.text) : {};
  const rootStack = rootText ? stackFromProjectText(rootText) : {};
  const stack = {
    build: serviceStack.build ?? rootStack.build ?? "gradle",
    runtime: serviceStack.runtime ?? rootStack.runtime ?? "java",
    framework: serviceStack.framework ?? rootStack.framework ?? null,
    data: serviceStack.data?.length ? serviceStack.data : rootStack.data ?? [],
  };
  const Entity = inferEntity(specText, module);
  const technology = inferTechnology(meta, stack).toLowerCase();
  const Technology = pascalCase(technology);
  const basePackage = basePackageFromService(service?.text, rootText);
  const ext = sourceExtension(stack.runtime);
  const repoPrefix = resolveRepoPrefix(serviceStack.repoPath, {
    serviceDir: service?.dir ?? null,
    projectHome,
  });
  const targetService =
    specText.match(/\btarget_service\s*=\s*"([^"]+)"/)?.[1] ?? null;

  return {
    feature,
    Feature,
    Entity,
    Technology,
    technology: Technology.toLowerCase(),
    basePackage,
    sourceRootMain: "src/main/java",
    sourceRootTest: "src/test/java",
    ext,
    stack,
    repoPrefix,
    module,
    specId: specPath.split(/[/\\]/).pop()?.replace(/\.spec\.ksl$/, "") ?? "spec",
    targetService,
    serviceProjectFile: service?.file ?? null,
    rootProjectFile: root ? join(root.projectRoot, root.rootProjectFile) : null,
  };
}

export function applyBindingTemplate(template, bindings) {
  return template
    .replaceAll("<feature>", bindings.feature)
    .replaceAll("<Feature>", bindings.Feature)
    .replaceAll("<Entity>", bindings.Entity)
    .replaceAll("<technology>", bindings.technology)
    .replaceAll("<Technology>", bindings.Technology)
    .replaceAll("<basePackage>", bindings.basePackage)
    .replaceAll("<base-package>", bindings.basePackage)
    .replaceAll("<source-root>", bindings.sourceRootMain);
}

export function packagePathToFileRel(bindings, packagePath, { test = false } = {}) {
  const root = test ? bindings.sourceRootTest : bindings.sourceRootMain;
  const prefix = bindings.repoPrefix ? `${bindings.repoPrefix}/` : "";
  const fqcn = `${bindings.basePackage}.${packagePath}`;
  const rel = `${prefix}${root}/${fqcn.replaceAll(".", "/")}.${bindings.ext}`;
  return rel.replace(/\/+/g, "/");
}
