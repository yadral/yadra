---
title: formalize
description: T1 — yadra formalize (A → B → C in one command).
---

**Timeline 1**: one command runs **A · COMPRENDRE → B · PRODUIRE → C · LIVRER** when KSL deliverables are missing, then **validate + seal** when they exist.

## Synopsis

```bash
yadra formalize <documents-folder> [options]
```

**Prerequisites:** `yadra project use <name>` with **`KSL_PROJECT_HOME`**; LLM via **`yadra configure`** + credentials (unless **`--skip-llm`** on the A/B branch).

**Required input:** `<documents-folder>/feature.yadra.md` with **`output_paths.spec`** (and `module` / `root` when declared).

## Behavior (packaged CLI — T1 complete)

| Step | Condition | Action |
|------|-----------|--------|
| **A + B** | Expected `.ksl` files (`output_paths` under `KSL_PROJECT_HOME`) **missing** | LLM + **formalize** SKILLS A/B → write to `output_paths`; tmp under `.yadra/tmp/<run-id>/`. |
| **A + B (CI)** | Same + **`--skip-llm`** | Print plans/SKILLS/LLM hints; **no writes**; exit `1`. |
| **C** | All expected files **present** (including after A+B) | **validate** L0+L2+L3 (+ L1 if `--syntax`) then **`seal`** (unless `--no-seal`). |

No `formalize:a` / `formalize:b` subcommands. For C only on an existing spec: **`yadra validate`** + **`yadra seal`**.

## Options

| Option | Effect |
|--------|--------|
| `--seal` / `--no-seal` | Seal after validation (default: seal). |
| `--syntax` | L1 in validate/seal. |
| `--include <paths>` | Extra `.ksl` for `seal`. |
| `--skip-llm` | A/B branch: orchestration only (no KSL generation). |
| `--ksl-project-home`, `--project-home`, `--yadra-project-home`, `--model`, `--profile` | One-shot overrides. |

## Example

```bash
yadra project use my-project
yadra formalize ./context/member-creation/
yadra formalize ./context/member-creation/ --no-seal
```

Plans: `yadra-t1-comprendre-intention`, `yadra-t1-produire-ksl`, `yadra-t1-livrer-ksl`. SKILLS: `formalize/partie-a-comprendre`, `partie-b-produire`, `partie-c-livrer`.
