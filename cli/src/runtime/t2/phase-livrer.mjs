import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import {
  findServiceProjectNearSpec,
  specIdFromPath,
} from "../ksl-lib.mjs";

function readBlock(text, blockName) {
  const match = text.match(new RegExp(`\\b${blockName}\\s*\\{([\\s\\S]*?)\\n\\s*\\}`, "m"));
  return match?.[1] ?? "";
}

function readStringField(block, field) {
  return block.match(new RegExp(`\\b${field}\\s*=\\s*"([^"]+)"`))?.[1] ?? null;
}

export function bundleDirForSpec(ws, specPath) {
  const specId = specIdFromPath(specPath);
  return join(ws.kslProjectHome, ".yadra", "bundles", specId);
}

export function manifestPathForSpec(ws, specPath) {
  return join(bundleDirForSpec(ws, specPath), "manifest.json");
}

export function readBundleManifest(ws, specPath) {
  const path = manifestPathForSpec(ws, specPath);
  if (!existsSync(path)) return { path, manifest: null };
  try {
    return { path, manifest: JSON.parse(readFileSync(path, "utf8")) };
  } catch {
    return { path, manifest: null, corrupt: true };
  }
}

export function writeExecuteBundleEvidence(ws, specPath, { plan, verifyMode, fileCount }) {
  const specId = specIdFromPath(specPath);
  const bundleDir = bundleDirForSpec(ws, specPath);
  mkdirSync(bundleDir, { recursive: true });
  const manifestPath = join(bundleDir, "manifest.json");
  let prior = {};
  if (existsSync(manifestPath)) {
    try {
      prior = JSON.parse(readFileSync(manifestPath, "utf8"));
    } catch {
      prior = {};
    }
  }
  const manifest = {
    ...prior,
    spec: specId,
    specRel: relative(ws.kslProjectHome, specPath),
    execute: {
      status: verifyMode === "skipped" ? "OK_NO_VERIFY" : "OK",
      kinds: plan.kinds,
      projectHome: ws.projectHome,
      fileCount: fileCount ?? 0,
      timestamp: new Date().toISOString(),
    },
    gate: prior.gate === "SATISFIED" ? prior.gate : "PENDING",
  };
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  return manifestPath;
}

function projectDeliveryPaths(specPath) {
  const service = findServiceProjectNearSpec(specPath);
  if (!service?.text) {
    return { docsPath: "docs/api", e2ePath: "tests/e2e" };
  }
  const docsBlock = readBlock(service.text, "docs");
  const e2eBlock = readBlock(service.text, "e2e");
  return {
    docsPath: readStringField(docsBlock, "path") ?? "docs/api",
    e2ePath: readStringField(e2eBlock, "path") ?? "tests/e2e",
  };
}

function dirHasFiles(dir) {
  if (!existsSync(dir)) return false;
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isFile()) return true;
      if (entry.isDirectory() && dirHasFiles(full)) return true;
    }
  } catch {
    return false;
  }
  return false;
}

function checkGateKind(kind, { projectHome, specPath, plan }) {
  const paths = projectDeliveryPaths(specPath);
  if (kind === "docs") {
    const rel = paths.docsPath.replace(/^\//, "");
    const abs = join(projectHome, rel);
    if (!dirHasFiles(abs)) {
      return `docs: expected artifacts under PROJECT_HOME/${rel}`;
    }
    return null;
  }
  if (kind === "e2e") {
    const rel = paths.e2ePath.replace(/^\//, "");
    const abs = join(projectHome, rel);
    if (!dirHasFiles(abs)) {
      return `e2e: expected tests under PROJECT_HOME/${rel}`;
    }
    return null;
  }
  return `gate kind "${kind}": no conformance rule yet (extend phase-livrer)`;
}

export function runConformanceGate({
  ws,
  specPath,
  plan,
  allowNoExecute = false,
}) {
  const { path: manifestPath, manifest, corrupt } = readBundleManifest(ws, specPath);
  const specId = specIdFromPath(specPath);
  const violations = [];
  const notes = [];

  if (corrupt) {
    return {
      spec: specId,
      result: "UNDECIDABLE",
      manifestPath,
      detail: "manifest.json is invalid JSON",
      violations: [],
    };
  }

  const executeOk =
    manifest?.execute?.status === "OK" || manifest?.execute?.status === "OK_NO_VERIFY";
  if (!executeOk) {
    if (!allowNoExecute) {
      return {
        spec: specId,
        result: "UNDECIDABLE",
        manifestPath,
        detail: "no execute evidence — run yadra execute first (or --allow-no-execute for local dev)",
        violations: [],
      };
    }
    notes.push("execute evidence skipped (--allow-no-execute)");
  } else if (manifest.execute.projectHome !== ws.projectHome) {
    violations.push(
      `execute manifest projectHome mismatch (manifest=${manifest.execute.projectHome}, current=${ws.projectHome})`,
    );
  }

  for (const kind of plan.kinds) {
    const issue = checkGateKind(kind, {
      projectHome: ws.projectHome,
      specPath,
      plan,
    });
    if (issue) violations.push(issue);
  }

  let result = "SATISFIED";
  if (violations.length > 0) result = "VIOLATED";

  const updated = {
    ...(manifest ?? {}),
    spec: specId,
    specRel: relative(ws.kslProjectHome, specPath),
    gate: result,
    gateKinds: plan.kinds,
    violations,
    note: notes.join("; ") || undefined,
    gateCheckedAt: new Date().toISOString(),
  };
  mkdirSync(bundleDirForSpec(ws, specPath), { recursive: true });
  writeFileSync(manifestPath, JSON.stringify(updated, null, 2));

  return {
    spec: specId,
    result,
    manifestPath,
    detail: violations.length ? violations.join("; ") : notes.join("; ") || manifestPath,
    violations,
  };
}
