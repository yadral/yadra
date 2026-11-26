export function isVerbose(flagsOrBool) {
  return flagsOrBool === true || flagsOrBool?.verbose === true;
}

export function logVerbose(flagsOrBool, ...args) {
  if (isVerbose(flagsOrBool)) console.log(...args);
}

/** Default: one count line. Verbose: each path. */
export function logWrittenFiles(flagsOrBool, files, indent = "  ") {
  const paths = (files ?? [])
    .map((file) => (typeof file === "string" ? file : file?.path))
    .filter(Boolean);
  if (paths.length === 0) return;
  if (isVerbose(flagsOrBool)) {
    for (const path of paths) console.log(`${indent}${path}`);
    return;
  }
  console.log(`${indent}${paths.length} fichier(s)`);
}
