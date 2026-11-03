/**
 * Deterministic pre-filter for T1 · A (feeds LLM + compact strategies section).
 */
export function inferOutputKinds(corpus) {
  const t = corpus.toLowerCase();
  const kinds = new Set();
  if (
    /\bcode\b/.test(t) ||
    /outputs.*code|kinds.*code|livrable.*code/.test(t)
  ) {
    kinds.add("code");
  }
  if (/\btests?\b/.test(t) || /outputs.*tests|kinds.*tests/.test(t)) {
    kinds.add("tests");
  }
  if (/\bdata\b/.test(t) || /outputs.*data|kinds.*data|postgres|migration/.test(t)) {
    kinds.add("data");
  }
  if (kinds.size === 0) kinds.add("code");
  return [...kinds];
}

export function suggestStrategiesFromCatalog(strategies, { corpus, kinds }) {
  const text = corpus.toLowerCase();
  const kindSet = new Set(kinds.map((k) => k.toLowerCase()));

  return strategies.filter((s) => {
    const when = s.when ?? {};
    const kindRules = when.outputs_kinds_any ?? [];
    if (kindRules.length > 0) {
      const kindOk = kindRules.some((k) => kindSet.has(k.toLowerCase()));
      if (!kindOk) return false;
    }
    const signals = when.signals_any ?? [];
    if (signals.length === 0) return true;
    return signals.some((sig) => text.includes(String(sig).toLowerCase()));
  });
}

export function formatStrategyCandidates(entries) {
  if (!entries.length) return "(aucune suggestion automatique — utiliser tout le catalogue)";
  return entries
    .map(
      (s) =>
        `- ${s.name} (id=${s.id}, role=${s.role}, family=${s.family})${
          s.description_hint ? `\n  hint: ${s.description_hint.split("\n")[0]}` : ""
        }`,
    )
    .join("\n");
}
