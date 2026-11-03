import { homedir } from "node:os";
import { join } from "node:path";

export function yadraConfigDir() {
  return join(homedir(), ".config", "yadra");
}

export function configurePath() {
  return join(yadraConfigDir(), "configure");
}

export function credentialsPath() {
  return join(yadraConfigDir(), "credentials");
}

export function projectsRegistryPath() {
  return join(yadraConfigDir(), "projects.json");
}
