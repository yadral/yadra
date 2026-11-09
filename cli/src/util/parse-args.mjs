export function parseArgs(argv) {
  const flags = {
    syntax: false,
    layout: false,
    semantic: false,
    format: "human",
    seal: true,
    noSeal: false,
    help: false,
    include: [],
    kinds: [],
    profile: undefined,
    model: undefined,
    kslProjectHome: undefined,
    projectHome: undefined,
    yadraProjectHome: undefined,
    provider: undefined,
    baseUrl: undefined,
    timeout: undefined,
    token: undefined,
    username: undefined,
    password: undefined,
    project: undefined,
    current: false,
    noCurrent: false,
    family: undefined,
    role: undefined,
    section: undefined,
    hints: false,
    skipLlm: false,
    dryRun: false,
    allowUnsealed: false,
    repair: false,
    noVerify: false,
    allowNoExecute: false,
    produce: false,
    allowPendingKsl: false,
    authOnly: false,
    prompt: undefined,
    force: false,
    refresh: false,
    ensureLayout: true,
  };
  const positional = [];
  const provided = new Set();
  const valueFlags = {
    "--format": "format",
    "--include": "include",
    "--kinds": "kinds",
    "--profile": "profile",
    "--model": "model",
    "--ksl-project-home": "kslProjectHome",
    "--project-home": "projectHome",
    "--yadra-project-home": "yadraProjectHome",
    "--provider": "provider",
    "--base-url": "baseUrl",
    "--timeout": "timeout",
    "--token": "token",
    "--username": "username",
    "--password": "password",
    "--project": "project",
    "--family": "family",
    "--role": "role",
    "--section": "section",
    "--prompt": "prompt",
  };

  function readValue(flag, inlineValue, index) {
    const value = inlineValue ?? argv[index + 1];
    if (value === undefined || value === "" || value.startsWith("--")) {
      return { error: `Missing value for ${flag}` };
    }
    return { value, consumed: inlineValue === undefined ? 1 : 0 };
  }

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    const equals = token.startsWith("--") ? token.indexOf("=") : -1;
    const a = equals === -1 ? token : token.slice(0, equals);
    const inlineValue = equals === -1 ? undefined : token.slice(equals + 1);
    if (inlineValue !== undefined && !valueFlags[a]) {
      return { error: `Flag does not take a value: ${a}`, flags, positional, provided };
    }

    if (a.startsWith("-")) provided.add(a);

    if (a === "--help" || a === "-h") flags.help = true;
    else if (a === "--syntax") flags.syntax = true;
    else if (a === "--layout") flags.layout = true;
    else if (a === "--semantic") flags.semantic = true;
    else if (a === "--seal") flags.seal = true;
    else if (a === "--no-seal") {
      flags.noSeal = true;
      flags.seal = false;
    }
    else if (a === "--current") flags.current = true;
    else if (a === "--no-current") flags.noCurrent = true;
    else if (a === "--hints") flags.hints = true;
    else if (a === "--skip-llm") flags.skipLlm = true;
    else if (a === "--dry-run") flags.dryRun = true;
    else if (a === "--allow-unsealed") flags.allowUnsealed = true;
    else if (a === "--repair") flags.repair = true;
    else if (a === "--no-verify") flags.noVerify = true;
    else if (a === "--allow-no-execute") flags.allowNoExecute = true;
    else if (a === "--produce") flags.produce = true;
    else if (a === "--allow-pending-ksl") flags.allowPendingKsl = true;
    else if (a === "--auth-only") flags.authOnly = true;
    else if (a === "--force") flags.force = true;
    else if (a === "--refresh") flags.refresh = true;
    else if (a === "--no-ensure-layout") flags.ensureLayout = false;
    else if (valueFlags[a]) {
      const parsed = readValue(a, inlineValue, i);
      if (parsed.error) {
        return { error: parsed.error, flags, positional, provided };
      }
      i += parsed.consumed;
      if (a === "--include" || a === "--kinds") {
        const key = a === "--include" ? "include" : "kinds";
        flags[key].push(
          ...parsed.value.split(",").map((s) => s.trim()).filter(Boolean),
        );
      } else {
        flags[valueFlags[a]] = parsed.value;
      }
    }
    else if (a.startsWith("-")) {
      return { error: `Unknown flag: ${a}`, flags, positional, provided };
    } else positional.push(token);
  }
  return { flags, positional, error: null, provided };
}
