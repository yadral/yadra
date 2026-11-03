import { existsSync } from "node:fs";
import { grammarPath, readGrammarVersion, resolveKslHome } from "../runtime/ksl-lib.mjs";
import { readCliVersion } from "../config/manifest.mjs";
import { listProjects, resolveWorkspace } from "../config/load-projects.mjs";

export function cmdVersion(flags, cwd) {
  if (!["human", "json"].includes(flags.format)) {
    console.error("--format must be human or json.");
    return 2;
  }
  const ws = resolveWorkspace(cwd);
  const { current } = listProjects();
  const payload = {
    name: "yadra",
    version: readCliVersion(),
    grammarVersion: readGrammarVersion(),
    kslHome: resolveKslHome(),
    grammar: grammarPath(),
    grammarFound: existsSync(grammarPath()),
    yadraProject: ws?.name && ws.name !== "_env" ? ws.name : current,
    kslProjectHome: ws?.kslProjectHome ?? null,
    projectHome: ws?.projectHome ?? null,
    yadraProjectHome: ws?.yadraProjectHome ?? null,
    llm: ws?.llm ?? {},
  };

  if (flags.format === "json") {
    console.log(JSON.stringify(payload, null, 2));
    return 0;
  }

  console.log(`yadra CLI: ${payload.version}`);
  console.log(`KSL_HOME: ${payload.kslHome}`);
  console.log(
    `grammar: ${payload.grammar} (${payload.grammarFound ? "found" : "missing"})`,
  );
  console.log(`grammar version: ${payload.grammarVersion ?? "n/a"}`);
  console.log(`YADRA_PROJECT: ${payload.yadraProject ?? "(not set)"}`);
  console.log(`KSL_PROJECT_HOME: ${payload.kslProjectHome ?? "(not set)"}`);
  console.log(`PROJECT_HOME: ${payload.projectHome ?? "(not set)"}`);
  console.log(`YADRA_PROJECT_HOME: ${payload.yadraProjectHome ?? "(not set)"}`);
  return 0;
}
