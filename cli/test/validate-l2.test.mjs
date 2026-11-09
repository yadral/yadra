import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";
import { validateL2 } from "../vendor/yadral-dist/ksl/tools/yadra/lib/validate-l2.mjs";

test("validateL2 ignores specs = in comments only", () => {
  const root = mkdtempSync(join(tmpdir(), "yadra-l2-"));
  const dir = join(root, "modules", "momo-cm");
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, "momo-cm.module.ksl"),
    [
      "ksl 1.0",
      "// plus tard specs = [7 fichiers]",
      'module "momo-cm" { service = "svc" }',
    ].join("\n"),
    "utf8",
  );
  writeFileSync(
    join(dir, "momo-cm-foo.spec.ksl"),
    ['spec "x" {', '  module = "momo-cm"', "}"].join("\n"),
    "utf8",
  );
  const errors = validateL2(join(dir, "momo-cm-foo.spec.ksl"));
  assert.equal(errors.length, 0);
});

test("validateL2 enforces specs list when specs block present", () => {
  const root = mkdtempSync(join(tmpdir(), "yadra-l2b-"));
  const dir = join(root, "modules", "momo-cm");
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, "momo-cm.module.ksl"),
    'module "momo-cm" { specs = ["other.spec.ksl"] }',
    "utf8",
  );
  writeFileSync(
    join(dir, "momo-cm-foo.spec.ksl"),
    ['spec "x" {', '  module = "momo-cm"', "}"].join("\n"),
    "utf8",
  );
  const errors = validateL2(join(dir, "momo-cm-foo.spec.ksl"));
  assert.ok(errors.some((e) => e.includes("not found in specs")));
});
