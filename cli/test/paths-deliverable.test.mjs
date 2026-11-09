import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";
import { resolveKslDeliverablePath } from "../vendor/yadral-dist/ksl/tools/yadra/lib/paths.mjs";

test("resolveKslDeliverablePath accepts module and project", () => {
  const cwd = mkdtempSync(join(tmpdir(), "yadra-path-"));
  const mod = join(cwd, "foo.module.ksl");
  const proj = join(cwd, "bar.project.ksl");
  writeFileSync(mod, "module {}", "utf8");
  writeFileSync(proj, "project {}", "utf8");
  assert.equal(resolveKslDeliverablePath(mod, cwd), mod);
  assert.equal(resolveKslDeliverablePath(proj, cwd), proj);
});
