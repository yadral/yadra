import { cmdVersion } from "./version.mjs";

export function cmdDoctor(flags, cwd) {
  const code = cmdVersion({ ...flags, format: "human" }, cwd);
  console.log("");
  console.log(`node: ${process.version}`);
  if (Number(process.version.replace("v", "").split(".")[0]) < 18) {
    console.error("warning: Node 18+ recommended");
    return 1;
  }
  return code;
}
