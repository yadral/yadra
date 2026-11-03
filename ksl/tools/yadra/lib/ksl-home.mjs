import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function resolveKslHome() {
  if (process.env.KSL_HOME) {
    return process.env.KSL_HOME;
  }
  return join(__dirname, "../../..");
}

export function grammarPath() {
  const home = resolveKslHome();
  return join(home, "grammar", "ksl.ebnf");
}

export function readGrammarVersion() {
  const path = grammarPath();
  if (!existsSync(path)) return null;
  const head = readFileSync(path, "utf8").slice(0, 200);
  const m = head.match(/KSL v(\d+\.\d+)/);
  return m ? m[1] : "unknown";
}
