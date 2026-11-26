import { existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import {
  hasDeliverableOutputPaths,
  loadFeatureYadra,
  primaryDeliverablePath,
} from "../../util/feature-yadra.mjs";

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".yadra",
  "vendor",
  "dist",
  "build",
  "target",
  "coverage",
  ".idea",
  ".cursor",
]);

function isSkippedDir(name) {
  return SKIP_DIRS.has(name) || name.startsWith(".");
}

function walkFiles(root, predicate, acc = []) {
  if (!existsSync(root)) return acc;
  const st = statSync(root);
  if (st.isFile()) {
    if (predicate(root)) acc.push(root);
    return acc;
  }
  if (!st.isDirectory()) return acc;
  let entries = [];
  try {
    entries = readdirSync(root, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const entry of entries) {
    const next = join(root, entry.name);
    if (entry.isDirectory()) {
      if (!isSkippedDir(entry.name)) walkFiles(next, predicate, acc);
    } else if (entry.isFile() && predicate(next)) {
      acc.push(next);
    }
  }
  return acc;
}

export function featureRank(feature) {
  if (feature.outputPaths?.spec) return 2;
  if (feature.outputPaths?.module) return 3;
  const root = feature.outputPaths?.root ?? "";
  if (root === "root.project.ksl" || root.endsWith("/root.project.ksl")) return 0;
  if (root) return 1;
  return 4;
}

function toPosix(path) {
  return String(path).replaceAll("\\", "/");
}

function resolveOutput(kslRoot, rel) {
  if (!rel) return null;
  const absolute = resolve(kslRoot, rel);
  const fromRoot = relative(kslRoot, absolute);
  if (fromRoot.startsWith("..") || fromRoot === "..") return null;
  return absolute;
}

export function loadFeatureAt(docDir) {
  const feature = loadFeatureYadra(docDir);
  if (!hasDeliverableOutputPaths(feature.outputPaths)) {
    throw new Error(`feature.yadra.md without output_paths: ${feature.path}`);
  }
  return { ...feature, dir: docDir };
}

function collectFeatures(searchRoot) {
  const files = walkFiles(searchRoot, (p) => /(?:^|\/|\\)feature\.yadra\.md$/i.test(p));
  const features = [];
  for (const path of files) {
    try {
      features.push(loadFeatureAt(dirname(path)));
    } catch {
      // skip unreadable / incomplete Doc First folders
    }
  }
  return features;
}

function collectSpecFiles(searchRoot) {
  return walkFiles(searchRoot, (p) => p.endsWith(".spec.ksl"));
}

function defaultSearchRoots(pathAbs, cwd, ws) {
  const roots = [pathAbs];
  if (collectFeatures(pathAbs).length > 0 || collectSpecFiles(pathAbs).length > 0) {
    return roots;
  }
  const cwdPrompts = join(cwd, "prompts");
  if (existsSync(cwdPrompts) && cwdPrompts !== pathAbs) roots.push(cwdPrompts);
  if (ws?.kslProjectHome) {
    const repoPrompts = join(dirname(ws.kslProjectHome), "prompts");
    if (existsSync(repoPrompts) && !roots.includes(repoPrompts)) roots.push(repoPrompts);
    if (existsSync(ws.kslProjectHome) && !roots.includes(ws.kslProjectHome)) {
      roots.push(ws.kslProjectHome);
    }
  }
  return roots;
}

export function discoverMakeGraph(input, cwd, ws = {}) {
  const kslRoot = ws.kslProjectHome;
  if (!kslRoot) {
    throw new Error("KSL_PROJECT_HOME is required for yadra make.");
  }
  const pathAbs = resolve(cwd, input ?? ".");
  if (!existsSync(pathAbs)) {
    throw new Error(`Not found: ${pathAbs}`);
  }

  const st = statSync(pathAbs);
  const features = [];
  const specSet = new Set();

  if (st.isFile() && pathAbs.endsWith(".spec.ksl")) {
    specSet.add(pathAbs);
  } else if (st.isFile() && /feature\.yadra\.md$/i.test(pathAbs)) {
    features.push(loadFeatureAt(dirname(pathAbs)));
  } else if (st.isDirectory()) {
    for (const root of defaultSearchRoots(pathAbs, cwd, ws)) {
      for (const feature of collectFeatures(root)) features.push(feature);
      for (const spec of collectSpecFiles(root)) specSet.add(spec);
    }
  } else {
    throw new Error(`Not a directory, feature.yadra.md, or .spec.ksl: ${pathAbs}`);
  }

  const seenDirs = new Set();
  const uniqueFeatures = [];
  for (const feature of features) {
    if (seenDirs.has(feature.dir)) continue;
    seenDirs.add(feature.dir);
    uniqueFeatures.push(feature);
  }
  uniqueFeatures.sort((a, b) => {
    const delta = featureRank(a) - featureRank(b);
    if (delta !== 0) return delta;
    return toPosix(a.dir).localeCompare(toPosix(b.dir));
  });

  const specsFromFeatures = [];
  for (const feature of uniqueFeatures) {
    const specRel = feature.outputPaths.spec;
    const specAbs = resolveOutput(kslRoot, specRel);
    if (specAbs?.endsWith(".spec.ksl")) {
      specsFromFeatures.push(specAbs);
      specSet.delete(specAbs);
    }
  }

  const extraSpecs = [...specSet]
    .filter((p) => p.endsWith(".spec.ksl"))
    .sort((a, b) => toPosix(a).localeCompare(toPosix(b)));

  const specs = [...specsFromFeatures, ...extraSpecs];
  const seenSpecs = new Set();
  const uniqueSpecs = [];
  for (const spec of specs) {
    if (seenSpecs.has(spec)) continue;
    seenSpecs.add(spec);
    uniqueSpecs.push(spec);
  }

  return {
    search: pathAbs,
    features: uniqueFeatures.map((feature) => ({
      dir: feature.dir,
      path: feature.path,
      rank: featureRank(feature),
      deliverable: primaryDeliverablePath(feature.outputPaths),
      outputPaths: feature.outputPaths,
      spec: resolveOutput(kslRoot, feature.outputPaths.spec),
    })),
    specs: uniqueSpecs,
  };
}

export function makeSteps(flags) {
  const raw = String(flags.step ?? "all").toLowerCase();
  const aliases = { formalize: "t1", produce: "execute" };
  const step = aliases[raw] ?? raw;
  const valid = new Set(["all", "t1", "t2", "execute", "gate"]);
  if (!valid.has(step)) {
    throw new Error(`Invalid --step ${flags.step}. Use all|t1|t2|execute|gate.`);
  }
  const doT1 = step === "all" || step === "t1";
  const doExecute = step === "all" || step === "t2" || step === "execute";
  const doGate =
    !flags.noGate && (step === "all" || step === "t2" || step === "gate");
  return { step, doT1, doExecute, doGate };
}
