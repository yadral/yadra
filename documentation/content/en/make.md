---
title: make
description: Daily path — T1 formalize then T2 execute + gate in one command (CLI 0.1.15+).
---

`yadra make` is the **daily path**. One command, from the Doc First folder (`intention.md` + `feature.yadra.md`) to code under **`PROJECT_HOME`**.

KSL is **not removed**: it remains the compiled IR (`validate`, `seal`, `gate`). You no longer write it or chain `formalize` → `plan` → `execute` → `gate`. Those commands stay **expert mode**.

## Synopsis

```bash
yadra make [PATH] [options]
```

**Prerequisites:** a product tree reachable from `PATH`/`cwd` (auto-detect), or an override `--project` / `--ksl-project-home` / `--project-home`; LLM (`yadra configure`, once) unless **`--dry-run --skip-llm`**.

See [Recommended minimal configuration](/docs/en/overview/#recommended-minimal-configuration) on the overview page.

**Workspace (auto-detect):** Yadra walks up from `PATH` until it finds a `*.project.ksl` with `kind = "root"`, or a nested `ksl/` folder that contains one. `PROJECT_HOME` comes from `repo.path` in the root KSL. Daily use no longer needs `yadra project use`. `--project` remains an override for multi-product / CI.

`PATH` (default `.`):

| Form | Effect |
|------|--------|
| Folder (`prompts/…`, `.`) | Discovers every `feature.yadra.md` (and orphan KSL specs). |
| `feature.yadra.md` | One feature. |
| `*.spec.ksl` | T2 only (execute + gate) on that spec. |

If the folder has neither features nor specs, `make` looks at `prompts/` next to `KSL_PROJECT_HOME`, then the KSL tree.

## Internal pipeline

1. Discover and **order**: root → service → specs → module.
2. **T1** — `yadra formalize` (validate + seal) for each feature.
3. **T2** — `yadra execute` as a **single slice** (`--combined`: all strategies as constraints, one LLM pass) + ownership **merge** (a spec may update a file already written).
4. **T2** — `yadra gate` (unless `--no-gate`).

**Fresh** executes (valid T1 seal + evidence in `.yadra/bundles/`) are skipped unless `--force`.

## Logging

Default: one progress line per step (`make T1 …`, `execute <spec>`, `N fichier(s)`, `gate SATISFIED`). No SKILL/plan dump, no path list.

`--verbose` / `-v`: full graph, written paths, SKILL/plan context.

`--dry-run`: graph + T2 plan, **no** T1 writes.

`--format json`: machine-readable graph (with `--dry-run`: stops there).

## Options

| Option | Description |
|--------|-------------|
| `--step all\|t1\|t2\|execute\|gate` | Subset (default `all`). Alias: `formalize` → `t1`. |
| `--dry-run` | Graph + T2 dry-run; no T1 writes. |
| `--skip-llm` | Only with `--dry-run`. |
| `--format json` | Machine-readable graph. |
| `--no-gate` | Skip gate. |
| `--no-combined` | One LLM pass per strategy (legacy `execute`). |
| `--no-merge` | Do not overwrite a file owned by another spec. |
| `--force` | Re-run T1 A+B and T2 even when fresh. |
| `--verbose` / `-v` | Detail (paths, SKILL, graph). |
| `--no-verify` | Execute without sandbox. |
| `--allow-unsealed` | T2 without a T1 seal. |
| `--refresh` / `--no-seal` / `--kinds` | Forwarded to `formalize` / `execute`. |

## Examples

```bash
yadra project use iyadris-payments

# Whole project
yadra make .

# One module (MoMo rail)
yadra make prompts/momo-cm/

# One feature, T2 only
yadra make prompts/momo-cm/specs/request-to-pay/ --step t2

# No-LLM check
yadra make . --dry-run --skip-llm --format json

# Re-run + detail
yadra make prompts/momo-cm/ --force --verbose
```

## Exit codes

| Code | Meaning |
|------|---------|
| `0` | `make OK` (or dry-run OK). Gate `SATISFIED`. |
| `1` | formalize / execute failed / gate `VIOLATED` / empty graph. |
| `2` | Usage, project, LLM, gate `UNDECIDABLE`. |

Expert mode: [`formalize`](/docs/en/formalize/), [`execute`](/docs/en/execute/). T1/T2 architecture: [`Architecture`](/docs/en/architecture/).
