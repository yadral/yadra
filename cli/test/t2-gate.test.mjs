import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";
import {
  runConformanceGate,
  writeExecuteBundleEvidence,
} from "../src/runtime/t2/phase-livrer.mjs";

test("writeExecuteBundleEvidence and runConformanceGate SATISFIED when paths exist", () => {
  const kslHome = mkdtempSync(join(tmpdir(), "yadra-ksl-gate-"));
  const projectHome = mkdtempSync(join(tmpdir(), "yadra-proj-gate-"));
  const specPath = join(kslHome, "feature.spec.ksl");
  writeFileSync(
    specPath,
    `
module = "checkout"
outputs {
  kinds = ["code", "docs", "e2e"]
  phase {
    execute = ["code"]
    gate = ["docs", "e2e"]
  }
}
`,
  );
  writeFileSync(
    join(kslHome, "svc.project.ksl"),
    `
project "order-service" { kind = "service"
  docs { path = "docs/api" }
  e2e { path = "tests/e2e" }
}
`,
  );
  mkdirSync(join(projectHome, "docs/api"), { recursive: true });
  writeFileSync(join(projectHome, "docs/api/readme.md"), "# api\n");
  mkdirSync(join(projectHome, "tests/e2e"), { recursive: true });
  writeFileSync(join(projectHome, "tests/e2e/SmokeTest.java"), "class SmokeTest {}\n");

  const ws = { kslProjectHome: kslHome, projectHome };
  const plan = { spec: "feature", kinds: ["docs", "e2e"] };
  writeExecuteBundleEvidence(ws, specPath, {
    plan: { kinds: ["code"] },
    verifyMode: "gradle",
    fileCount: 3,
  });

  const outcome = runConformanceGate({ ws, specPath, plan, allowNoExecute: false });
  assert.equal(outcome.result, "SATISFIED");
  assert.equal(outcome.violations.length, 0);

  rmSync(kslHome, { recursive: true, force: true });
  rmSync(projectHome, { recursive: true, force: true });
});

test("runConformanceGate UNDECIDABLE without execute evidence", () => {
  const kslHome = mkdtempSync(join(tmpdir(), "yadra-ksl-gate2-"));
  const projectHome = mkdtempSync(join(tmpdir(), "yadra-proj-gate2-"));
  const specPath = join(kslHome, "x.spec.ksl");
  writeFileSync(specPath, 'module = "x"\n');
  writeFileSync(
    join(kslHome, "svc.project.ksl"),
    'project "s" { kind = "service" docs { path = "docs" } e2e { path = "tests/e2e" } }',
  );
  const ws = { kslProjectHome: kslHome, projectHome };
  const outcome = runConformanceGate({
    ws,
    specPath,
    plan: { kinds: ["docs"] },
    allowNoExecute: false,
  });
  assert.equal(outcome.result, "UNDECIDABLE");

  rmSync(kslHome, { recursive: true, force: true });
  rmSync(projectHome, { recursive: true, force: true });
});
