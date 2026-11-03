import { resolveCommandPath, runValidate } from "../runtime/ksl-lib.mjs";
import { syncKslToolEnv } from "../config/load-projects.mjs";

export function cmdValidate(flags, positional, cwd, wsOptions = {}) {
  if (positional.length > 1) {
    console.error(`Unexpected argument: ${positional[1]}`);
    return 2;
  }
  if (!["human", "json"].includes(flags.format)) {
    console.error("--format must be human or json.");
    return 2;
  }
  syncKslToolEnv(cwd, wsOptions);
  let target;
  try {
    target = resolveCommandPath(positional[0] ?? ".", cwd);
  } catch (e) {
    console.error(e.message);
    return 2;
  }
  let r;
  try {
    r = runValidate(target, {
      syntax: flags.syntax,
      layout: flags.layout,
      semantic: flags.semantic,
      format: flags.format,
    });
  } catch (e) {
    console.error(e.message ?? e);
    return 2;
  }
  return r.exitCode;
}
