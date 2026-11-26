---
title: execute
description: T2 · B · PRODUCE — yadra execute (phase.execute, sandbox/repair loop).
---

T2 trilogy: **COMPRENDRE** (`yadra plan`) → **PRODUCE** (`yadra execute`) → **DELIVER / LIVRER** (`yadra gate`).

The `yadra execute` command is **B · PRODUCE**: **`outputs.phase.execute`** kinds (default `code`, `data`, `tests`). It validates the spec, checks the T1 seal (unless dev), recomputes plan / bindings / manifest **in memory**, runs T2 · A specialization **in memory** (LLM), writes under **`PROJECT_HOME`**, then runs **`gradle test`** and a **repair** loop bounded by **`budget.max_repair_loops`**.

Kinds in **`outputs.phase.gate`** (`docs`, `e2e`, …) are handled by **`yadra gate`** (CLI 0.1.8+).

## Outputs

| Output | Description |
|--------|-------------|
| **Console** | Phase, progress, sandbox, repair, errors |
| **`PROJECT_HOME/**`** | Application sources (execute kinds) |

No JSON receipt, no `.yadra/compile-plans/` cache on the KSL tree.

## Options

| Option | Description |
|--------|-------------|
| `--kinds code,tests` | Subset of **`outputs.phase.execute`**. |
| `--dry-run` | Plan + phase; **no writes**. |
| `--no-verify` | PRODUCE only; no Gradle sandbox / repair. |
| `--allow-unsealed` | Dev without a valid T1 seal. |
| `--skip-llm` | Only with `--dry-run`. |
| `--combined` | One LLM pass (strategies as constraints). |
| `--merge` | Allow writing a file already owned by another spec. |
| `--verbose` / `-v` | List every written file (default: a count). |

## KSL stack (language and build)

T2 production **does not assume** a pre-filled application repo. **Language**, **build**, and **framework** come from:

- **`root.project.ksl`** — `stack { build runtime framework … }`
- Service **`*.project.ksl`** — `repo.path`, merged stack for bindings

`PROJECT_HOME` (`yadra project --project-home`) is the **write root** (usually `repo.path` from root KSL). Strategy skeletons set packages and extensions (`.kt`, `.java`, …) from `stack.runtime`.

## Prerequisites

1. `yadra project` with **`KSL_PROJECT_HOME`** + **`PROJECT_HOME`**.
2. `yadra validate --semantic` on the spec (`outputs.phase` recommended).
3. T1 seal recommended (or `--allow-unsealed`).
4. LLM configured for production.

`yadra plan` is an optional **preview**; not required before `execute`.

## Example

```bash
yadra execute order-checkout.spec.ksl --dry-run --allow-unsealed --skip-llm
yadra execute order-checkout.spec.ksl --kinds code,tests --allow-unsealed
yadra execute order-checkout.spec.ksl --no-verify --allow-unsealed
```

Code/test paths come from **`project.repo`**, stack, and strategy skeletons — not from per-kind paths in `outputs`.
