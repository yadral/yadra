import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import {
  configurePath,
  credentialsPath,
  yadraConfigDir,
} from "./paths.mjs";
import {
  parseIni,
  profileSectionName,
  resolveProfileSection,
  stringifyIni,
} from "./ini.mjs";

export function assertProfileName(profile) {
  if (!/^[A-Za-z0-9._-]+$/.test(profile)) {
    throw new Error(
      "Profile names may only contain letters, digits, dot, underscore, and hyphen.",
    );
  }
}

function assertFieldValues(fields) {
  for (const [key, value] of Object.entries(fields)) {
    if (/[\r\n]/.test(String(value))) {
      throw new Error(`Configuration value for ${key} must be one line.`);
    }
  }
}

export function loadConfigureFile() {
  const path = configurePath();
  if (!existsSync(path)) return {};
  return parseIni(readFileSync(path, "utf8"));
}

export function loadCredentialsFile() {
  const path = credentialsPath();
  if (!existsSync(path)) return {};
  return parseIni(readFileSync(path, "utf8"));
}

export function saveConfigureFile(sections) {
  mkdirSync(yadraConfigDir(), { recursive: true });
  writeFileSync(configurePath(), stringifyIni(sections), { mode: 0o644 });
}

export function saveCredentialsFile(sections) {
  mkdirSync(yadraConfigDir(), { recursive: true });
  writeFileSync(credentialsPath(), stringifyIni(sections), { mode: 0o600 });
  try {
    chmodSync(credentialsPath(), 0o600);
  } catch {
    // ignore on windows
  }
}

export function listProfiles() {
  const cfg = loadConfigureFile();
  const cred = loadCredentialsFile();
  const names = new Set();
  for (const k of Object.keys(cfg)) {
    if (k === "_default") continue;
    if (k === "default") names.add("default");
    else if (k.startsWith("profile ")) names.add(k.slice("profile ".length));
    else names.add(k);
  }
  for (const k of Object.keys(cred)) {
    if (k === "_default") continue;
    if (k === "default") names.add("default");
    else if (k.startsWith("profile ")) names.add(k.slice("profile ".length));
    else names.add(k);
  }
  return [...names].sort();
}

export function getProfileConfig(profile = "default") {
  assertProfileName(profile);
  const cfg = loadConfigureFile();
  const cred = loadCredentialsFile();
  const c = resolveProfileSection(cfg, profile);
  const r = resolveProfileSection(cred, profile);
  const credentials = { ...(r?.data ?? {}) };
  if (process.env.YADRA_LLM_TOKEN) {
    credentials.token = process.env.YADRA_LLM_TOKEN;
  }
  if (process.env.YADRA_LLM_USERNAME) {
    credentials.username = process.env.YADRA_LLM_USERNAME;
  }
  if (process.env.YADRA_LLM_PASSWORD) {
    credentials.password = process.env.YADRA_LLM_PASSWORD;
  }
  return {
    profile,
    configure: c?.data ?? {},
    credentials,
  };
}

export function setProfileFields(profile, fields) {
  assertProfileName(profile);
  assertFieldValues(fields);
  const cfg = loadConfigureFile();
  const key = profileSectionName(profile);
  if (!cfg[key]) cfg[key] = {};
  Object.assign(cfg[key], fields);
  saveConfigureFile(cfg);
}

export function setProfileCredentials(profile, fields) {
  assertProfileName(profile);
  assertFieldValues(fields);
  const cred = loadCredentialsFile();
  const key = profileSectionName(profile);
  if (!cred[key]) cred[key] = {};
  Object.assign(cred[key], fields);
  saveCredentialsFile(cred);
}
