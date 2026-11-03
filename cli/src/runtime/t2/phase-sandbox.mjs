import { existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const DEFAULT_TIMEOUT_MS = 300_000;

function tail(text, maxLines = 80) {
  const lines = String(text ?? "").split(/\r?\n/);
  if (lines.length <= maxLines) return lines.join("\n");
  return lines.slice(-maxLines).join("\n");
}

export function defaultRunCommand(cwd, command, args, timeoutMs) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    timeout: timeoutMs,
    maxBuffer: 8 * 1024 * 1024,
    shell: false,
  });
  return {
    exitCode: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    signal: result.signal,
    error: result.error?.message ?? null,
  };
}

/**
 * Run build/tests under PROJECT_HOME (Gradle MVP).
 * @returns {{ ok: boolean, skipped?: boolean, reason?: string, exitCode: number, log: string }}
 */
export function runProjectSandbox(projectHome, bindings, options = {}) {
  const runCommand = options.runCommand ?? defaultRunCommand;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const build = String(bindings?.stack?.build ?? "gradle").toLowerCase();
  if (build !== "gradle") {
    return {
      ok: false,
      skipped: true,
      reason: `stack.build "${bindings?.stack?.build ?? "?"}" is not supported for sandbox (MVP: gradle)`,
      exitCode: 2,
      log: "",
    };
  }

  const isWin = process.platform === "win32";
  const wrapper = join(projectHome, isWin ? "gradlew.bat" : "gradlew");
  const hasWrapper = existsSync(wrapper);
  const command = hasWrapper ? wrapper : "gradle";
  const args = ["test", "--no-daemon"];

  const run = runCommand(projectHome, command, args, timeoutMs);
  const combined = [run.stdout, run.stderr].filter(Boolean).join("\n");
  const log = tail(combined, 120);
  const ok = run.exitCode === 0 && !run.signal && !run.error;

  if (run.error) {
    return {
      ok: false,
      exitCode: 1,
      log: `${run.error}\n${log}`,
      reason: run.error,
    };
  }

  return {
    ok,
    exitCode: run.exitCode ?? 1,
    log,
    reason: ok ? undefined : `gradle test exited ${run.exitCode ?? 1}`,
  };
}
