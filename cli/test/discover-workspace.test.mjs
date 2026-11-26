import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import {
  discoverWorkspaceFromPath,
  projectHomeFromRootRepo,
  walkFindRootProject,
} from "../src/config/discover-workspace.mjs";
import { resolveWorkspace } from "../src/config/load-projects.mjs";

function writeRoot(kslDir, { projectId = "demo", repoPath = "../app" } = {}) {
  mkdirSync(kslDir, { recursive: true });
  writeFileSync(
    join(kslDir, "root.project.ksl"),
    [
      "ksl 1.0",
      "",
      `project "${projectId}" {`,
      '  kind = "root"',
      "  repo {",
      `    path = "${repoPath}"`,
      "  }",
      "}",
      "",
    ].join("\n"),
  );
}

test("walkFindRootProject finds nested ksl/ from prompts", () => {
  const root = mkdtempSync(join(tmpdir(), "yadra-discover-"));
  try {
    writeRoot(join(root, "ksl"), { projectId: "payments" });
    mkdirSync(join(root, "prompts", "feat"), { recursive: true });
    const found = walkFindRootProject(join(root, "prompts", "feat"));
    assert.ok(found);
    assert.equal(found.projectRoot, resolve(root, "ksl"));
    assert.equal(found.projectId, "payments");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("walkFindRootProject finds root.project.ksl at monorepo root", () => {
  const root = mkdtempSync(join(tmpdir(), "yadra-discover-root-"));
  try {
    writeRoot(root, { projectId: "platform", repoPath: "../demo-apps" });
    const found = walkFindRootProject(join(root, "services"));
    assert.ok(found);
    assert.equal(found.projectRoot, resolve(root));
    assert.equal(found.projectId, "platform");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("discoverWorkspaceFromPath resolves PROJECT_HOME via repo.path", () => {
  const root = mkdtempSync(join(tmpdir(), "yadra-discover-home-"));
  try {
    writeRoot(join(root, "ksl"), { repoPath: "../app" });
    mkdirSync(join(root, "app"), { recursive: true });
    mkdirSync(join(root, "prompts"), { recursive: true });
    const ws = discoverWorkspaceFromPath(join(root, "prompts"));
    assert.ok(ws);
    assert.equal(ws.kslProjectHome, resolve(root, "ksl"));
    assert.equal(ws.projectHome, resolve(root, "app"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("projectHomeFromRootRepo returns null without repo.path", () => {
  const root = mkdtempSync(join(tmpdir(), "yadra-discover-norepo-"));
  try {
    mkdirSync(root, { recursive: true });
    writeFileSync(
      join(root, "root.project.ksl"),
      'ksl 1.0\nproject "x" {\n  kind = "root"\n}\n',
    );
    assert.equal(projectHomeFromRootRepo(root), null);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("resolveWorkspace auto-detects without registry current", () => {
  const home = mkdtempSync(join(tmpdir(), "yadra-ws-home-"));
  const product = mkdtempSync(join(tmpdir(), "yadra-ws-product-"));
  const prevHome = process.env.HOME;
  const prevKsl = process.env.KSL_PROJECT_HOME;
  const prevProject = process.env.PROJECT_HOME;
  const prevYadraProject = process.env.YADRA_PROJECT;
  try {
    process.env.HOME = home;
    delete process.env.KSL_PROJECT_HOME;
    delete process.env.PROJECT_HOME;
    delete process.env.YADRA_PROJECT;
    delete process.env.YADRA_PROJECT_ROOT;
    delete process.env.YADRA_CONTEXT;

    writeRoot(join(product, "ksl"), { projectId: "auto-demo", repoPath: "../app" });
    mkdirSync(join(product, "app"), { recursive: true });
    mkdirSync(join(product, "prompts", "feat"), { recursive: true });

    const ws = resolveWorkspace(product, {
      seedPath: join(product, "prompts", "feat"),
    });
    assert.ok(ws);
    assert.equal(ws.source, "detect");
    assert.equal(ws.kslProjectHome, resolve(product, "ksl"));
    assert.equal(ws.projectHome, resolve(product, "app"));
    assert.equal(ws.projectId, "auto-demo");
  } finally {
    process.env.HOME = prevHome;
    if (prevKsl === undefined) delete process.env.KSL_PROJECT_HOME;
    else process.env.KSL_PROJECT_HOME = prevKsl;
    if (prevProject === undefined) delete process.env.PROJECT_HOME;
    else process.env.PROJECT_HOME = prevProject;
    if (prevYadraProject === undefined) delete process.env.YADRA_PROJECT;
    else process.env.YADRA_PROJECT = prevYadraProject;
    delete process.env.YADRA_PROJECT_ROOT;
    delete process.env.YADRA_CONTEXT;
    rmSync(home, { recursive: true, force: true });
    rmSync(product, { recursive: true, force: true });
  }
});

test("resolveWorkspace prefers detect over stale KSL_PROJECT_HOME env", () => {
  const home = mkdtempSync(join(tmpdir(), "yadra-ws-stale-"));
  const productA = mkdtempSync(join(tmpdir(), "yadra-ws-a-"));
  const productB = mkdtempSync(join(tmpdir(), "yadra-ws-b-"));
  const prevHome = process.env.HOME;
  const prevKsl = process.env.KSL_PROJECT_HOME;
  try {
    process.env.HOME = home;
    writeRoot(join(productA, "ksl"), { projectId: "a", repoPath: "../app" });
    writeRoot(join(productB, "ksl"), { projectId: "b", repoPath: "../app" });
    mkdirSync(join(productA, "app"), { recursive: true });
    mkdirSync(join(productB, "app"), { recursive: true });
    process.env.KSL_PROJECT_HOME = join(productA, "ksl");

    const ws = resolveWorkspace(productB, {
      seedPath: join(productB, "ksl"),
    });
    assert.ok(ws);
    assert.equal(ws.kslProjectHome, resolve(productB, "ksl"));
    assert.equal(ws.projectId, "b");
  } finally {
    process.env.HOME = prevHome;
    if (prevKsl === undefined) delete process.env.KSL_PROJECT_HOME;
    else process.env.KSL_PROJECT_HOME = prevKsl;
    rmSync(home, { recursive: true, force: true });
    rmSync(productA, { recursive: true, force: true });
    rmSync(productB, { recursive: true, force: true });
  }
});
