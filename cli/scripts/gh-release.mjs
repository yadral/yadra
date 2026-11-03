#!/usr/bin/env node
/**
 * Publie le .tgz courant sur GitHub Releases (gh CLI).
 * Prérequis : npm run release:pack, gh auth login, git push déjà fait.
 */
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFileSync } from "node:fs";

const cliDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(
  readFileSync(join(cliDir, "package.json"), "utf8"),
);
const version = pkg.version;
const tag = process.argv[2] ?? `yadra-cli-v${version}`;
const scopedTgzBase = pkg.name.startsWith("@")
  ? pkg.name.slice(1).replace("/", "-")
  : pkg.name;
const tgz = join(cliDir, `${scopedTgzBase}-${version}.tgz`);

if (!existsSync(tgz)) {
  console.error(`Missing ${tgz}. Run: npm run release:pack`);
  process.exit(1);
}

const notes = [
  `Install: npm install -g ./${scopedTgzBase}-${version}.tgz`,
  "Then: yadra project add <name> --ksl-project-home <path> --project-home <path>",
  "      yadra project use <name>",
].join("\n");

const r = spawnSync(
  "gh",
  [
    "release",
    "create",
    tag,
    tgz,
    "--title",
    `Yadra CLI ${version}`,
    "--notes",
    notes,
  ],
  { stdio: "inherit", cwd: cliDir },
);

process.exit(r.status ?? 1);
