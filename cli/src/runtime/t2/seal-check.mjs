import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { specIdFromPath } from "../ksl-lib.mjs";

function digest(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

export function verifyT1Seal(ws, specPath) {
  const specId = specIdFromPath(specPath);
  const sealPath = join(ws.kslProjectHome, ".yadra", "sealed", `${specId}.json`);
  if (!existsSync(sealPath)) return `T1 seal missing: ${sealPath}`;
  let seal;
  try {
    seal = JSON.parse(readFileSync(sealPath, "utf8"));
  } catch {
    return `T1 seal is invalid JSON: ${sealPath}`;
  }
  const specAbsolute = resolve(specPath);
  const record = seal.files?.find(
    (file) => resolve(ws.kslProjectHome, file.path) === specAbsolute,
  );
  if (!record) {
    return `T1 seal does not include spec: ${relative(ws.kslProjectHome, specPath)}`;
  }
  if (record.sha256 !== digest(specPath)) {
    return `T1 seal is stale for spec: ${relative(ws.kslProjectHome, specPath)}`;
  }
  return null;
}
