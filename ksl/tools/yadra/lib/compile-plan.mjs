import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export function compilePlanDir(kslProjectHome, specId) {
  return join(kslProjectHome, ".yadra", "compile-plans", specId);
}

export function compilePlanPaths(kslProjectHome, specId) {
  const dir = compilePlanDir(kslProjectHome, specId);
  return {
    dir,
    planJson: join(dir, "plan.json"),
    specialization: join(dir, "specialization.md"),
    bindingsJson: join(dir, "bindings.json"),
    manifestJson: join(dir, "file-manifest.json"),
  };
}

export function writeCompilePlanArtifact(kslProjectHome, specId, payload) {
  const paths = compilePlanPaths(kslProjectHome, specId);
  mkdirSync(paths.dir, { recursive: true });
  if (payload.plan !== undefined) {
    writeFileSync(
      paths.planJson,
      `${JSON.stringify({ ...payload.plan, savedAt: payload.savedAt ?? new Date().toISOString() }, null, 2)}\n`,
    );
  }
  if (payload.specialization !== undefined) {
    writeFileSync(paths.specialization, `${payload.specialization.trim()}\n`);
  }
  if (payload.bindings !== undefined) {
    writeFileSync(
      paths.bindingsJson,
      `${JSON.stringify(payload.bindings, null, 2)}\n`,
    );
  }
  if (payload.fileManifest !== undefined) {
    writeFileSync(
      paths.manifestJson,
      `${JSON.stringify(payload.fileManifest, null, 2)}\n`,
    );
  }
  return paths;
}

export function loadCompilePlan(kslProjectHome, specId) {
  const paths = compilePlanPaths(kslProjectHome, specId);
  if (!existsSync(paths.planJson)) {
    return { ok: false, paths, error: `Missing compile plan: ${paths.planJson}` };
  }
  const plan = JSON.parse(readFileSync(paths.planJson, "utf8"));
  const specialization = existsSync(paths.specialization)
    ? readFileSync(paths.specialization, "utf8").trim()
    : null;
  const bindings = existsSync(paths.bindingsJson)
    ? JSON.parse(readFileSync(paths.bindingsJson, "utf8"))
    : null;
  const fileManifest = existsSync(paths.manifestJson)
    ? JSON.parse(readFileSync(paths.manifestJson, "utf8"))
    : null;
  return {
    ok: true,
    paths,
    plan,
    specialization,
    bindings,
    fileManifest,
  };
}
