import { readFileSync } from "node:fs";
import { join } from "node:path";
import { defaultYadraProjectHome, distRoot } from "../runtime/distribution.mjs";

export function readCliVersion() {
  const manifestPath = join(distRoot(), "yadra/manifest.mf");
  try {
    const raw = readFileSync(manifestPath, "utf8");
    const m = raw.match(/^\s*version\s*[:=]\s*([^\s#]+)/im);
    return m ? m[1].trim() : "0.1.0";
  } catch {
    return "0.1.0";
  }
}

export { defaultYadraProjectHome };
