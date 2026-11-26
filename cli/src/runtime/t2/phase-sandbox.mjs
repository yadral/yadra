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
 * Commande de test sous PROJECT_HOME selon stack.build.
 * Gradle : ./gradlew test --no-daemon, sinon gradle.
 * Maven : ./mvnw -B test, sinon mvn.
 */
export function resolveSandboxInvocation(projectHome, build) {
  const normalized = String(build ?? "gradle").toLowerCase();
  const isWin = process.platform === "win32";
  if (normalized === "gradle") {
    const wrapper = join(projectHome, isWin ? "gradlew.bat" : "gradlew");
    return {
      tool: "gradle",
      label: "gradle test",
      command: existsSync(wrapper) ? wrapper : "gradle",
      args: ["test", "--no-daemon"],
    };
  }
  if (normalized === "maven") {
    const wrapper = join(projectHome, isWin ? "mvnw.cmd" : "mvnw");
    return {
      tool: "maven",
      label: "mvn test",
      command: existsSync(wrapper) ? wrapper : "mvn",
      args: ["-B", "test"],
    };
  }
  return null;
}

export function sandboxLabel(bindings) {
  const invocation = resolveSandboxInvocation(
    "",
    bindings?.stack?.build ?? "gradle",
  );
  return invocation?.label ?? `${bindings?.stack?.build ?? "?"} (unsupported)`;
}

/**
 * Run build/tests under PROJECT_HOME.
 * @returns {{ ok: boolean, skipped?: boolean, reason?: string, exitCode: number, log: string, tool?: string, label?: string }}
 */
export function runProjectSandbox(projectHome, bindings, options = {}) {
  const runCommand = options.runCommand ?? defaultRunCommand;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const invocation = resolveSandboxInvocation(projectHome, bindings?.stack?.build ?? "gradle");
  if (!invocation) {
    return {
      ok: false,
      skipped: true,
      reason: `stack.build "${bindings?.stack?.build ?? "?"}" is not supported for sandbox (gradle, maven)`,
      exitCode: 2,
      log: "",
    };
  }

  const run = runCommand(projectHome, invocation.command, invocation.args, timeoutMs);
  const combined = [run.stdout, run.stderr].filter(Boolean).join("\n");
  const log = tail(combined, 120);
  const ok = run.exitCode === 0 && !run.signal && !run.error;

  if (run.error) {
    return {
      ok: false,
      exitCode: 1,
      log: `${run.error}\n${log}`,
      reason: run.error,
      tool: invocation.tool,
      label: invocation.label,
    };
  }

  return {
    ok,
    exitCode: run.exitCode ?? 1,
    log,
    tool: invocation.tool,
    label: invocation.label,
    reason: ok ? undefined : `${invocation.label} exited ${run.exitCode ?? 1}`,
  };
}
