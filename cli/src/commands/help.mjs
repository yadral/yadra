import { commandHelp, globalHelp } from "../help/registry.mjs";

export function cmdHelp(sub, flags) {
  if (flags.help && !sub) {
    console.log(globalHelp());
    return 0;
  }
  if (sub) {
    console.log(commandHelp(sub));
    return 0;
  }
  console.log(globalHelp());
  return 0;
}
