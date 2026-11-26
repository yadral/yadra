import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export function ownersPath(projectHome) {
  return join(projectHome, ".yadra", "file-owners.json");
}

export function loadOwners(projectHome) {
  const path = ownersPath(projectHome);
  if (!existsSync(path)) return {};
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8"));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function saveOwners(projectHome, owners) {
  const path = ownersPath(projectHome);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(owners, null, 2)}\n`);
}

export function claimOwner(owners, specId, rel) {
  if (!specId || !rel || owners[rel]) return false;
  owners[rel] = specId;
  return true;
}
