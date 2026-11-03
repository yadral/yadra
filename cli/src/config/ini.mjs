/** Minimal INI read/write (sections [name] or [profile name]). */

export function parseIni(text) {
  const sections = {};
  let current = "_default";
  sections[current] = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith(";") || trimmed.startsWith("#")) continue;
    const sec = trimmed.match(/^\[(.+)\]$/);
    if (sec) {
      current = sec[1].trim();
      if (!sections[current]) sections[current] = {};
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    sections[current][key] = val;
  }
  return sections;
}

export function stringifyIni(sections) {
  const lines = [];
  for (const [name, kv] of Object.entries(sections)) {
    if (name === "_default") continue;
    lines.push(`[${name}]`);
    for (const [k, v] of Object.entries(kv)) {
      lines.push(`${k} = ${v}`);
    }
    lines.push("");
  }
  return `${lines.join("\n").trimEnd()}\n`;
}

export function profileSectionName(profile) {
  return profile === "default" ? "default" : `profile ${profile}`;
}

export function resolveProfileSection(sections, profile) {
  const key = profileSectionName(profile);
  if (sections[key]) return { key, data: sections[key] };
  if (profile !== "default" && sections[profile]) {
    return { key: profile, data: sections[profile] };
  }
  return null;
}
