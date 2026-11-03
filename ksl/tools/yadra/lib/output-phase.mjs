/** Default Yadra routing when outputs.phase is absent (T2). */
export const DEFAULT_EXECUTE_KINDS = ["code", "data", "tests"];
export const DEFAULT_GATE_KINDS = ["docs", "e2e"];

/**
 * @param {{ kinds: string[], phaseExecute?: string[] | null, phaseGate?: string[] | null }} meta
 */
export function resolveOutputRouting(meta) {
  const allKinds = meta.kinds.filter((k) => k !== "ksl");
  const hasPhase =
    (meta.phaseExecute?.length ?? 0) > 0 || (meta.phaseGate?.length ?? 0) > 0;

  let executeKinds;
  let gateKinds;
  if (hasPhase) {
    executeKinds = [...new Set(meta.phaseExecute ?? [])].filter((k) => k !== "ksl");
    gateKinds = [...new Set(meta.phaseGate ?? [])].filter((k) => k !== "ksl");
  } else {
    const known = new Set([...DEFAULT_EXECUTE_KINDS, ...DEFAULT_GATE_KINDS]);
    executeKinds = allKinds.filter((k) => DEFAULT_EXECUTE_KINDS.includes(k));
    gateKinds = allKinds.filter((k) => DEFAULT_GATE_KINDS.includes(k));
    const other = allKinds.filter((k) => !known.has(k));
    executeKinds = [...executeKinds, ...other];
  }

  return { allKinds, executeKinds, gateKinds, hasExplicitPhase: hasPhase };
}

/**
 * L3 checks for outputs.phase vs kinds (when phase is explicit).
 * @returns {string[]}
 */
export function validateOutputPhase(meta) {
  const errors = [];
  const allKinds = meta.kinds.filter((k) => k !== "ksl");
  const hasPhase =
    (meta.phaseExecute?.length ?? 0) > 0 || (meta.phaseGate?.length ?? 0) > 0;
  if (!hasPhase || allKinds.length === 0) return errors;

  const execute = new Set(meta.phaseExecute ?? []);
  const gate = new Set(meta.phaseGate ?? []);
  for (const k of execute) {
    if (gate.has(k)) {
      errors.push(`outputs.phase: kind "${k}" appears in both execute and gate`);
    }
  }
  for (const k of allKinds) {
    if (!execute.has(k) && !gate.has(k)) {
      errors.push(
        `outputs.phase: kind "${k}" is listed in kinds but missing from phase.execute and phase.gate`,
      );
    }
  }
  for (const k of execute) {
    if (!allKinds.includes(k)) {
      errors.push(`outputs.phase.execute includes "${k}" but it is not in outputs.kinds`);
    }
  }
  for (const k of gate) {
    if (!allKinds.includes(k)) {
      errors.push(`outputs.phase.gate includes "${k}" but it is not in outputs.kinds`);
    }
  }
  return errors;
}
