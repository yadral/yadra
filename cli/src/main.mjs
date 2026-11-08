#!/usr/bin/env node
import { applyInstallEnv } from "./runtime/distribution.mjs";
applyInstallEnv();

import { resolve } from "node:path";
import { cmdConfigure } from "./commands/configure.mjs";
import { cmdProject } from "./commands/project.mjs";
import { cmdDoctor } from "./commands/doctor.mjs";
import { cmdExecute } from "./commands/execute.mjs";
import { cmdGate } from "./commands/gate.mjs";
import { cmdFormalize } from "./commands/formalize.mjs";
import { cmdHelp } from "./commands/help.mjs";
import { cmdPlan } from "./commands/plan.mjs";
import { cmdStrategies } from "./commands/strategies.mjs";
import { cmdSeal } from "./commands/seal.mjs";
import { cmdValidate } from "./commands/validate.mjs";
import { cmdVersion } from "./commands/version.mjs";
import { commandHelp, globalHelp } from "./help/registry.mjs";
import { ENV_KSL, ENV_MODEL, ENV_PROJECT, ENV_YADRA } from "./config/load-projects.mjs";
import { parseArgs } from "./util/parse-args.mjs";

const COMMON_PROJECT_OVERRIDES = [
  "--project",
  "--ksl-project-home",
  "--project-home",
  "--yadra-project-home",
];

function allowedFlags(cmd, sub) {
  const byCommand = {
    version: ["--format"],
    doctor: [],
    formalize: [
      "--seal",
      "--no-seal",
      "--syntax",
      "--include",
      "--model",
      "--profile",
      "--skip-llm",
      ...COMMON_PROJECT_OVERRIDES,
    ],
  validate: ["--syntax", "--layout", "--semantic", "--format", ...COMMON_PROJECT_OVERRIDES],
  plan: ["--format", "--kinds", "--skip-llm", ...COMMON_PROJECT_OVERRIDES],
  execute: [
    "--kinds",
    "--dry-run",
    "--allow-unsealed",
    "--skip-llm",
    "--repair",
    "--no-verify",
    ...COMMON_PROJECT_OVERRIDES,
  ],
  gate: [
    "--format",
    "--kinds",
    "--dry-run",
    "--allow-unsealed",
    "--allow-no-execute",
    "--produce",
    "--skip-llm",
    ...COMMON_PROJECT_OVERRIDES,
  ],
  seal: ["--syntax", "--include", "--skip-llm", ...COMMON_PROJECT_OVERRIDES],
  strategies: ["--format", "--family", "--role", "--section", "--hints"],
  };
  if (cmd === "configure") {
    if (sub === "set") {
      return ["--profile", "--provider", "--model", "--base-url", "--timeout"];
    }
    if (sub === "credentials") {
      return ["--profile", "--token", "--username", "--password"];
    }
    if (sub === "get") return ["--profile"];
    if (sub === "test") {
      return ["--profile", "--model", "--prompt", "--auth-only", "--timeout"];
    }
    return [];
  }
  if (cmd === "strategies") {
    if (sub === "show") {
      return ["--format"];
    }
    if (sub === "explain") {
      return ["--format", "--skip-llm", ...COMMON_PROJECT_OVERRIDES];
    }
    if (!sub || sub === "list") {
      return ["--format", "--family", "--role", "--section", "--hints"];
    }
    return [];
  }
  if (cmd === "project") {
    if (sub === "add" || sub === "update") {
      return [
        "--ksl-project-home",
        "--project-home",
        "--yadra-project-home",
        "--model",
        "--profile",
        "--current",
        "--no-current",
        "--allow-pending-ksl",
      ];
    }
    if (sub === "set-profile") {
      return ["--profile", "--model"];
    }
    return [];
  }
  return byCommand[cmd] ?? [];
}

function unsupportedFlag(cmd, sub, provided) {
  const allowed = new Set(allowedFlags(cmd, sub));
  return [...provided].find(
    (flag) => flag !== "--help" && flag !== "-h" && !allowed.has(flag),
  );
}

function applyTransientOverrides(flags, cwd) {
  if (flags.kslProjectHome) {
    process.env[ENV_KSL] = resolve(cwd, flags.kslProjectHome);
  }
  if (flags.projectHome) process.env[ENV_PROJECT] = resolve(cwd, flags.projectHome);
  if (flags.yadraProjectHome) {
    process.env[ENV_YADRA] = resolve(cwd, flags.yadraProjectHome);
  }
  if (flags.model) process.env[ENV_MODEL] = flags.model;
  if (flags.profile) process.env.YADRA_PROFILE = flags.profile;
  if (flags.project) process.env.YADRA_PROJECT = flags.project;
}

function workspaceOptions(flags) {
  return flags.project ? { projectName: flags.project } : {};
}

async function main() {
  const argv = process.argv.slice(2);
  const cwd = process.cwd();

  if (argv.length === 0 || argv[0] === "--help" || argv[0] === "-h") {
    console.log(globalHelp());
    process.exit(argv.length === 0 ? 2 : 0);
  }

  const [cmd, ...rest] = argv;

  if (cmd === "help") {
    const { flags, positional, error } = parseArgs(rest);
    if (error) {
      console.error(error);
      process.exit(2);
    }
    process.exit(cmdHelp(positional[0], flags));
  }

  const { flags, positional, error, provided } = parseArgs(rest);
  if (error) {
    console.error(error);
    process.exit(2);
  }

  if (flags.help) {
    console.log(commandHelp(cmd));
    process.exit(0);
  }
  if (provided.has("--seal") && provided.has("--no-seal")) {
    console.error("--seal and --no-seal cannot be used together.");
    process.exit(2);
  }

  const knownCommands = new Set([
    "version",
    "doctor",
    "configure",
    "project",
    "formalize",
    "validate",
    "seal",
    "plan",
    "execute",
    "gate",
    "strategies",
  ]);
  const sub = ["configure", "project", "strategies"].includes(cmd)
    ? positional[0]
    : null;
  if (knownCommands.has(cmd)) {
    const unsupported = unsupportedFlag(cmd, sub, provided);
    if (unsupported) {
      console.error(
        `Unsupported flag for ${cmd}${sub ? ` ${sub}` : ""}: ${unsupported}`,
      );
      process.exit(2);
    }
  }

  applyTransientOverrides(flags, cwd);

  let code = 2;
  switch (cmd) {
    case "version":
      if (positional.length > 0) {
        console.error(`Unexpected argument: ${positional[0]}`);
        code = 2;
      } else {
        code = cmdVersion(flags, cwd);
      }
      break;
    case "doctor":
      if (positional.length > 0) {
        console.error(`Unexpected argument: ${positional[0]}`);
        code = 2;
      } else {
        code = cmdDoctor(flags, cwd);
      }
      break;
    case "configure": {
      const [sub, ...args] = positional;
      code = await cmdConfigure(sub, args, flags, cwd);
      break;
    }
    case "project": {
      const [sub, ...args] = positional;
      code = cmdProject(sub, args, flags, cwd);
      break;
    }
    case "formalize":
      code = await cmdFormalize(flags, positional, cwd, workspaceOptions(flags));
      break;
    case "validate":
      code = cmdValidate(flags, positional, cwd, workspaceOptions(flags));
      break;
    case "seal":
      code = await cmdSeal(flags, positional, cwd, workspaceOptions(flags));
      break;
    case "plan":
      code = await cmdPlan(flags, positional, cwd, workspaceOptions(flags));
      break;
    case "execute":
      code = await cmdExecute(flags, positional, cwd, workspaceOptions(flags));
      break;
    case "gate":
      code = await cmdGate(flags, positional, cwd, workspaceOptions(flags));
      break;
    case "strategies": {
      const [sub, ...args] = positional;
      code = await cmdStrategies(
        sub,
        args,
        flags,
        cwd,
        workspaceOptions(flags),
      );
      break;
    }
    default:
      console.error(`Unknown command: ${cmd}\n`);
      console.log(globalHelp());
      code = 2;
  }

  process.exitCode = code ?? 0;
}

main().catch((e) => {
  console.error(e?.message ?? e);
  process.exitCode = 2;
});
