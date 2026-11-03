import { resolveKslHome } from "../runtime/ksl-lib.mjs";
import {
  findRootProjectInDir,
  listProjects,
  projectAdd,
  projectClearCurrent,
  projectExportLines,
  projectRemove,
  projectSetProfile,
  projectUpdate,
  projectUse,
  resolveWorkspace,
} from "../config/load-projects.mjs";
import { projectsRegistryPath } from "../config/paths.mjs";

function projectOptionsFromFlags(flags) {
  return {
    kslProjectHome: flags.kslProjectHome,
    projectHome: flags.projectHome,
    yadraProjectHome: flags.yadraProjectHome,
    model: flags.model,
    profile: flags.profile,
    setCurrent: !flags.noCurrent,
  };
}

function printLlm(record) {
  console.log(`  LLM profile: ${record.llm?.profile ?? "default"}`);
  console.log(`  LLM model:   ${record.llm?.model ?? "(from configure)"}`);
}

export function cmdProject(sub, positional, flags, cwd) {
  if (sub === "list") {
    if (positional.length > 0) {
      console.error(`Unexpected argument: ${positional[0]}`);
      return 2;
    }
    const { current, projects } = listProjects();
    const names = Object.keys(projects).sort();
    if (names.length === 0) {
      console.log("No projects registered.");
      console.log(`Registry: ${projectsRegistryPath()}`);
      console.log("Add one: yadra project add <name> --ksl-project-home <path> [--project-home <path>]");
      return 0;
    }
    console.log("NAME\tKSL_HOME\tPROJECT_HOME\tCURRENT");
    for (const name of names) {
      const p = projects[name];
      const mark = name === current ? "*" : "";
      const ksl = p.kslProjectHome;
      const app = p.projectHome ?? "-";
      console.log(`${name}\t${ksl}\t${app}\t${mark}`);
    }
    return 0;
  }

  if (sub === "add") {
    const name = positional[0];
    if (!name) {
      console.error("Usage: yadra project add <name> --ksl-project-home <path> [options]");
      return 2;
    }
    if (positional.length > 1) {
      console.error(`Unexpected argument: ${positional[1]}`);
      return 2;
    }
    try {
      const record = projectAdd(name, projectOptionsFromFlags(flags), cwd);
      console.log(`Project added: ${name}`);
      console.log(`  KSL_PROJECT_HOME=${record.kslProjectHome}`);
      if (record.projectHome) console.log(`  PROJECT_HOME=${record.projectHome}`);
      console.log(`  root: ${record.rootProjectFile} (${record.projectId})`);
      printLlm(record);
      return 0;
    } catch (e) {
      console.error(e.message);
      return 1;
    }
  }

  if (sub === "set-profile") {
    const { current } = listProjects();
    const name = positional[0] ?? current;
    if (!name) {
      console.error(
        "Usage: yadra project set-profile <name> --profile <profile> [--model <id>]",
      );
      console.error("       yadra project set-profile --profile <profile>  # projet courant");
      return 2;
    }
    if (positional.length > 1) {
      console.error(`Unexpected argument: ${positional[1]}`);
      return 2;
    }
    try {
      const record = projectSetProfile(name, {
        profile: flags.profile,
        model: flags.model,
      });
      console.log(`Project profile updated: ${name}`);
      printLlm(record);
      return 0;
    } catch (e) {
      console.error(e.message);
      return 1;
    }
  }

  if (sub === "update") {
    const name = positional[0];
    if (!name) {
      console.error("Usage: yadra project update <name> [options]");
      return 2;
    }
    if (positional.length > 1) {
      console.error(`Unexpected argument: ${positional[1]}`);
      return 2;
    }
    try {
      const record = projectUpdate(name, projectOptionsFromFlags({ ...flags, setCurrent: undefined }), cwd);
      console.log(`Project updated: ${name}`);
      console.log(`  KSL_PROJECT_HOME=${record.kslProjectHome}`);
      if (record.projectHome) console.log(`  PROJECT_HOME=${record.projectHome}`);
      printLlm(record);
      return 0;
    } catch (e) {
      console.error(e.message);
      return 1;
    }
  }

  if (sub === "use") {
    const name = positional[0];
    if (!name) {
      console.error("Usage: yadra project use <name>");
      return 2;
    }
    if (positional.length > 1) {
      console.error(`Unexpected argument: ${positional[1]}`);
      return 2;
    }
    try {
      const record = projectUse(name);
      console.log(`Active project: ${name}`);
      console.log(`  KSL_PROJECT_HOME=${record.kslProjectHome}`);
      if (record.projectHome) console.log(`  PROJECT_HOME=${record.projectHome}`);
      if (record.yadraProjectHome) {
        console.log(`  YADRA_PROJECT_HOME=${record.yadraProjectHome}`);
      }
      return 0;
    } catch (e) {
      console.error(e.message);
      return 1;
    }
  }

  if (sub === "show") {
    const name = positional[0];
    if (positional.length > 1) {
      console.error(`Unexpected argument: ${positional[1]}`);
      return 2;
    }
    const { current, projects } = listProjects();
    const target = name ?? current;
    if (!target) {
      console.log("No active project.");
      console.log(`Registry: ${projectsRegistryPath()}`);
      return 0;
    }
    const p = projects[target];
    if (!p) {
      console.error(`Unknown project: ${target}`);
      return 1;
    }
    console.log(name ? `Project ${target}:` : "Active project:");
    console.log(`  name:               ${target}${target === current ? " (current)" : ""}`);
    console.log(`  KSL_PROJECT_HOME:   ${p.kslProjectHome}`);
    console.log(`  PROJECT_HOME:       ${p.projectHome ?? "(not set)"}`);
    console.log(`  YADRA_PROJECT_HOME: ${p.yadraProjectHome ?? "(auto)"}`);
    const meta = findRootProjectInDir(p.kslProjectHome);
    if (meta) {
      console.log(`  root file: ${meta.rootProjectFile}`);
      console.log(`  project id: ${meta.projectId}`);
    }
    console.log(`  LLM profile: ${p.llm?.profile ?? "default"}`);
    console.log(`  LLM model:   ${p.llm?.model ?? "(from configure)"}`);
    console.log(`  registry: ${projectsRegistryPath()}`);
    console.log(`  KSL_HOME: ${resolveKslHome()}`);
    return 0;
  }

  if (sub === "export") {
    if (positional.length > 0) {
      console.error(`Unexpected argument: ${positional[0]}`);
      return 2;
    }
    try {
      const ws = resolveWorkspace(cwd);
      if (!ws?.kslProjectHome) {
        throw new Error(
          "No active project. Run: yadra project use <name>",
        );
      }
      for (const line of projectExportLines(ws)) console.log(line);
      return 0;
    } catch (e) {
      console.error(e.message);
      return 1;
    }
  }

  if (sub === "remove") {
    const name = positional[0];
    if (!name) {
      console.error("Usage: yadra project remove <name>");
      return 2;
    }
    if (positional.length > 1) {
      console.error(`Unexpected argument: ${positional[1]}`);
      return 2;
    }
    try {
      projectRemove(name);
      console.log(`Removed project: ${name}`);
      return 0;
    } catch (e) {
      console.error(e.message);
      return 1;
    }
  }

  if (sub === "clear") {
    if (positional.length > 0) {
      console.error(`Unexpected argument: ${positional[0]}`);
      return 2;
    }
    projectClearCurrent();
    console.log("Cleared active project (registry entries kept).");
    return 0;
  }

  console.error(
    "Usage: yadra project list|add|update|set-profile|use|show|export|remove|clear",
  );
  return 2;
}
