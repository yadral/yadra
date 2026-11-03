---
title: plan
description: Timeline 2 · A · COMPRENDRE — compile plan from a KSL specification (dry-run).
---

`yadra plan` is the **Timeline 2** CLI entry (v0.1.2). It reads an **already written `.spec.ksl`**, extracts kinds, strategies, data targets, and budget, and prints T2 steps **without generating artifacts**.

This is **not** T1 · A (`formalize` + Doc First) and **not** T1 · C (`validate` + `seal`).

## Synopsis

```bash
yadra plan [SPEC.spec.ksl | .] [options]
```

> **Description:** T2 · A · COMPRENDRE dry-run. Resolves a spec (file, or the single `.spec.ksl` in the directory), extracts metadata (MVP regex), and prints a compile plan.

## Options

| Option | Description |
|--------|-------------|
| `--format human\|json` | Output format (`human` by default). |
| `--kinds a,b` | Subset of `outputs.kinds`. |
| `--project <name>` | Registered project (one-shot), same as `validate` / `seal`. |
| `--ksl-project-home`, `--project-home` | Root overrides. |
| `-h`, `--help` | Help (`yadra plan -h`). |

## Prerequisites

1. Active project: `yadra project use <name>` (or `--ksl-project-home`).
2. **Validated** spec: `yadra validate --semantic path/to/foo.spec.ksl` (recommended — `plan` does not require it).
3. **Sealed** spec: `yadra seal …` recommended before a real T2 run; `plan` does not require the seal file.

No `feature.yadra.md` folder is read.

## Examples

### Human output

```bash
yadra plan ksl/services/order-service/modules/checkout/order-checkout.spec.ksl
```

```text
Plan for spec "order-checkout"
  module: checkout
  architecture: …
  patterns: …
  testing: …
  delivery kinds: code, …
  data targets: postgres, …
  budget: {"max_repair_loops":5,…}

T2 steps (dry-run):
  A · COMPRENDRE — parse spec, resolve SKILLS from strategies/stack
  B · PRODUIRE — `yadra execute` (execute-phase kinds · code + Gradle sandbox + repair)
  C · LIVRER — `yadra gate` (docs / e2e · 0.1.8+)
  D · Orchestration — manifest + evidence sealing
  Gate — KSL × artifacts ⟹ SATISFIED | VIOLATED | UNDECIDABLE
```

### JSON (scripts / CI)

```bash
yadra plan order-checkout.spec.ksl --format json
```

```json
{
  "spec": "order-checkout",
  "module": "checkout",
  "kinds": ["code"],
  "dataTargets": ["postgres"],
  "budget": { "max_repair_loops": 5, "max_iterations": 8 }
}
```

## How developers use it

| Use | How |
|-----|-----|
| After T1 | Confirm the spec **states** kinds / budget / strategies before T2 · B agents. |
| CI | `--format json` to decide which jobs to run. |
| Not yet | Writes under `PROJECT_HOME`, real SKILL resolution, persisted DAG — see plan `yadra-t2-comprendre-contrat`. |

Source plan: `prompts/plan-validate/yadra-t2/t2-comprendre-contrat.plan.md`. SKILL stub: `yadra/skills/execute/partie-a-comprendre/`.
