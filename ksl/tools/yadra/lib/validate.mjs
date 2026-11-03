import { collectKslPaths } from "./paths.mjs";
import { validateL0 } from "./validate-l0.mjs";
import { validateL1 } from "./validate-l1.mjs";
import { validateL2 } from "./validate-l2.mjs";
import { validateL3 } from "./validate-l3.mjs";

export function runValidate(root, options) {
  const { syntax, layout, semantic, format } = options;
  const paths = collectKslPaths(root);
  if (paths.length === 0) {
    return { ok: false, exitCode: 1, issues: [{ path: root, errors: ["no .ksl files found"] }] };
  }

  const issues = [];
  for (const path of paths) {
    const errors = [...validateL0(path)];
    if (syntax) errors.push(...validateL1(path));
    if (layout) errors.push(...validateL2(path));
    if (semantic) errors.push(...validateL3(path));
    if (errors.length) issues.push({ path, errors });
  }

  const ok = issues.length === 0;
  if (format === "json") {
    console.log(JSON.stringify({ ok, files: paths.length, issues }, null, 2));
  } else if (!ok) {
    for (const { path, errors } of issues) {
      console.error(`${path}:`);
      for (const e of errors) console.error(`  - ${e}`);
    }
    console.error(`\n${issues.length} file(s) failed validation.`);
  } else {
    const levels = ["L0"];
    if (syntax) levels.push("L1");
    if (layout) levels.push("L2");
    if (semantic) levels.push("L3");
    console.log(`Validation passed (${levels.join("+")}) on ${paths.length} file(s).`);
  }

  return { ok, exitCode: ok ? 0 : 1, issues };
}
