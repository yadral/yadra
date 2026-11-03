---
title: strategies
description: Timeline 2 — internal catalog of strategy names (agents and L3 validate).
---

`yadra strategies` (CLI **v0.1.3**) exposes the bundled **`yadra/strategies/catalog.yaml`**. It is a **reference** for T1 · A (deducing `strategy "…"` in the compact) and for **`yadra validate --semantic`** (L3 descriptions).

No active KSL project is required.

## Synopsis

```bash
yadra strategies list [options]
yadra strategies show <id|name> [options]
```

> **Description:** List or show canonical names (Hexagonal, SOLID, GoF, …) with `role`, `family`, and `description_hint`.

## Subcommands

| Subcommand | Role |
|------------|------|
| **`list`** | Grouped by catalog section (default when omitted). |
| **`show`** | One entry by `id` or `name` (e.g. `SOLID`, `solid`). |

## Options (`list`)

| Option | Description |
|--------|-------------|
| `--format human\|json` | Human-readable or JSON (`human` default). |
| `--family <f>` | Filter (`principles`, `creational`, `architecture`, …). |
| `--role <r>` | Filter (`architecture`, `pattern`, `testing`). |
| `--section <text>` | Substring in section title (e.g. `GoF`, `Principes`). |
| `--hints` | With JSON, include `description_hint` per entry. |
| `-h`, `--help` | Help (`yadra strategies -h`). |

## Options (`show`)

| Option | Description |
|--------|-------------|
| `--format human\|json` | Text detail or full JSON object. |

## Examples

```bash
yadra strategies list
yadra strategies list --family principles
yadra strategies show Populator/Converter
yadra strategies list --format json --section "Design patterns"
```

### JSON (`list`)

```bash
yadra strategies list --format json --hints | jq '.count'
```

## Development workflow

| Use | How |
|-----|-----|
| T1 · A | Confirm exact name before writing `strategy "…"` in KSL. |
| CI / scripts | `--format json` to compare spec vs catalog. |
| T2 agents | `show` to fetch `description_hint` without opening the repo. |

Source of truth: [`yadra/strategies/catalog.yaml`](../../../strategies/catalog.yaml). KSL strategies block: [strategies reference](/docs/en/ksl/reference/strategies/).
