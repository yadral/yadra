import {
  getProfileConfig,
  listProfiles,
  setProfileCredentials,
  setProfileFields,
} from "../config/load-configure.mjs";
import { cmdConfigureTest } from "./configure-test.mjs";

export async function cmdConfigure(sub, positional, flags, cwd = process.cwd()) {
  const profile = flags.profile ?? "default";

  if (!sub || sub === "list") {
    if (positional.length > 0) {
      console.error(`Unexpected argument: ${positional[0]}`);
      return 2;
    }
    const profiles = listProfiles();
    if (profiles.length === 0) {
      console.log("(no profiles — run yadra configure set --profile default ...)");
      return 0;
    }
    console.log("PROFILE            PROVIDER    MODEL                        AUTH    BASE_URL");
    for (const name of profiles) {
      const { configure, credentials } = getProfileConfig(name);
      const auth = credentials.token
        ? "token"
        : credentials.username
          ? "login"
          : "-";
      console.log(
        `${name.padEnd(18)} ${(configure.provider ?? "-").padEnd(11)} ${(configure.model ?? "-").padEnd(28)} ${auth.padEnd(7)} ${configure.base_url ?? "-"}`,
      );
    }
    return 0;
  }

  if (sub === "set") {
    if (positional.length > 0) {
      console.error(`Unexpected argument: ${positional[0]}`);
      return 2;
    }
    const fields = {};
    if (flags.provider) fields.provider = flags.provider;
    if (flags.model) fields.model = flags.model;
    if (flags.baseUrl) fields.base_url = flags.baseUrl;
    if (flags.timeout) {
      if (!/^\d+$/.test(flags.timeout) || Number(flags.timeout) <= 0) {
        console.error("--timeout must be a positive integer in milliseconds.");
        return 2;
      }
      fields.timeout = flags.timeout;
    }
    if (Object.keys(fields).length === 0) {
      console.error("yadra configure set: pass --provider, --model, etc.");
      return 2;
    }
    setProfileFields(profile, fields);
    console.log(`Profile "${profile}" updated in ~/.config/yadra/configure`);
    return 0;
  }

  if (sub === "credentials") {
    if (positional.length > 0) {
      console.error(`Unexpected argument: ${positional[0]}`);
      return 2;
    }
    const fields = {};
    if (flags.token) fields.token = flags.token;
    if (flags.username) fields.username = flags.username;
    if (flags.password) fields.password = flags.password;
    if (Object.keys(fields).length === 0) {
      console.error(
        "yadra configure credentials: pass --token or --username/--password",
      );
      return 2;
    }
    setProfileCredentials(profile, fields);
    console.log(`Credentials for "${profile}" saved (~/.config/yadra/credentials)`);
    return 0;
  }

  if (sub === "test") {
    if (positional.length > 0) {
      console.error(`Unexpected argument: ${positional[0]}`);
      return 2;
    }
    return cmdConfigureTest(flags, cwd);
  }

  if (sub === "get") {
    const key = positional[0];
    if (!key) {
      console.error("Usage: yadra configure get <key> [--profile name]");
      return 2;
    }
    if (positional.length > 1) {
      console.error(`Unexpected argument: ${positional[1]}`);
      return 2;
    }
    const { configure } = getProfileConfig(profile);
    const val = configure[key];
    if (val === undefined) {
      console.error(`Key not found: ${key}`);
      return 1;
    }
    console.log(val);
    return 0;
  }

  console.error(`Unknown configure subcommand: ${sub}`);
  return 2;
}
