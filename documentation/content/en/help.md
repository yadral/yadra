---
title: help
description: Displays global help for Yadra CLI and detailed documentation for each subcommand.
---

The `yadra help` command (or the `-h` / `--help` flags) provides built-in terminal documentation for every command available in the current CLI version.

## Synopsis

```bash
yadra help [command]
yadra -h
yadra <command> -h
```

> **Description:** Without arguments, prints the complete list of available subcommands with a one-line summary. When passed a command name (`yadra <command> -h`), displays its synopsis, description, accepted flags, and usage examples.

## Usage Examples

### Global help

```bash
yadra -h
# or
yadra help
```

Output:

```text
Yadra CLI v0.1.3 — Formal KSL Engineering

Usage:
  yadra <command> [options]

CLI — Cross-cutting:
  version      CLI version (yadra/manifest.mf) and active project
  help         Global help or yadra <command> -h
  configure    LLM profiles and credentials (~/.config/yadra/)
  project      Register and activate projects (KSL + app)
  doctor       Environment diagnostics

Timeline 1 (T1):
  formalize    If KSL missing: A/B hints; otherwise validate + seal
  validate     KSL checks L0–L3
  seal         T1 seal (.yadra/sealed/)

Timeline 2 (T2):
  plan         Compile plan from a spec (.spec.ksl) — T2 · A
  execute      Materialize under PROJECT_HOME — T2 · B
  gate         Conformance Gate — T2 · C
  make         One command: T1 (formalize) → T2 (execute + gate)
  strategies   Internal strategy name catalog (list / show)

Run "yadra <command> -h" for details.
```

### Command-specific help

```bash
yadra project -h
```

`yadra project -h` lists every subcommand (`list`, `add`, `update`, `set-profile`, `use`, …), options, `--project` / env overrides, and a **multi-project workflow example**.

Full reference: [`yadra project`](/docs/en/project/). Daily path: [`yadra make`](/docs/en/make/). Timeline 2: [`yadra plan`](/docs/en/plan/), [`yadra execute`](/docs/en/execute/), [`yadra strategies`](/docs/en/strategies/).

## Exit Code Behavior

| Case | Exit Code | Behavior |
|------|-----------|----------|
| `yadra help` or `yadra <cmd> -h` | `0` | Prints the requested help to standard output. |
| `yadra` (no arguments) | `2` | Prints the command summary and instructions to run `yadra -h`. |
| Unknown flag or command | `2` | Reports the invalid argument and suggests `yadra <cmd> -h`. |
