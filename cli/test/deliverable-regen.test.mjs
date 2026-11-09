import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";
import { deliverablesNeedAbPhases } from "../src/runtime/formalize/deliverable-regen.mjs";

test("deliverablesNeedAbPhases detects module stub with related_specs", () => {
  const kslRoot = mkdtempSync(join(tmpdir(), "yadra-regen-"));
  const modPath = join(kslRoot, "modules", "momo-cm", "momo-cm.module.ksl");
  mkdirSync(join(kslRoot, "modules", "momo-cm"), { recursive: true });
  writeFileSync(
    modPath,
    'module "momo-cm" { service = "payments-service" meta { name = "x" } }',
    "utf8",
  );
  const feature = {
    outputPaths: { module: "modules/momo-cm/momo-cm.module.ksl" },
    relatedSpecs: ["modules/momo-cm/a.spec.ksl"],
  };
  const r = deliverablesNeedAbPhases({
    kslRoot,
    feature,
    files: [modPath],
    flags: { force: false, refresh: false },
  });
  assert.equal(r.need, true);
});

test("deliverablesNeedAbPhases --force", () => {
  const r = deliverablesNeedAbPhases({
    kslRoot: "/tmp",
    feature: { outputPaths: { spec: "a.spec.ksl" }, relatedSpecs: [] },
    files: ["/tmp/a.spec.ksl"],
    flags: { force: true, refresh: false },
  });
  assert.equal(r.need, true);
  assert.equal(r.reason, "--force");
});
