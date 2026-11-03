---
title: yadra project
description: Register multiple projects (KSL + app code), switch with use, export shell variables.
---

A **Yadra project** is a pair of repositories:

- **`kslProjectHome`** — KSL specs (`KSL_PROJECT_HOME`)
- **`projectHome`** — generated application code (`PROJECT_HOME`)

Stored paths are **always absolute**. Switch microservices with **`yadra project use <name>`**.

## Synopsis

```bash
yadra project list
yadra project add <name> --ksl-project-home <path> [options]
yadra project update <name> [options]
yadra project set-profile [<name>] --profile <profile> [--model <id>]
yadra project use <name>
yadra project show [name]
yadra project export
yadra project remove <name>
yadra project clear
```

Registry: [`projects.json`](/docs/en/files/projects-json/) at `~/.config/yadra/`.

## Subcommands

| Subcommand | Description |
|------------|-------------|
| `list` | Lists registered projects (KSL home, project home, `*` = current). |
| `add` | Validates KSL root, registers the project; becomes current unless `--no-current`. |
| `update` | Updates paths or LLM settings for an existing project. |
| `set-profile` | Changes the `configure` profile and/or model (no KSL path re-validation). |
| `use` | Activates a registered project. |
| `show` | Shows the current or a named project. |
| `export` | Shell `export` lines for the current project (`YADRA_PROJECT`, `KSL_PROJECT_HOME`, …). |
| `remove` | Removes a project from the registry (not the current one). |
| `clear` | Clears the current project without deleting the registry. |

## Options (`add` / `update`)

| Option | Description |
|--------|-------------|
| `--ksl-project-home <path>` | Specs monorepo (`*.project.ksl`, `kind = "root"`). Stored as an absolute path. |
| `--project-home <path>` | Application repository. |
| `--yadra-project-home <path>` | Yadra distribution (often auto-resolved from the installed CLI). |
| `--model <id>` | Default LLM model for this project. |
| `--profile <name>` | `yadra configure` profile. |
| `--no-current` | (`add` only) do not activate after creation. |

## Examples

```bash
yadra project add tontine \
  --ksl-project-home /Users/mac/tontine-ksl \
  --project-home /Users/mac/tontine-app \
  --profile default

yadra project add order-service \
  --ksl-project-home /Users/mac/platform-ksl \
  --project-home /Users/mac/order-app \
  --no-current

yadra project list
yadra project use order-service
yadra validate ksl/services/order-service/modules/checkout/order-checkout.spec.ksl

yadra project set-profile order-service --profile prod --model claude-sonnet-4-20250514
yadra project set-profile --profile dev   # current project

eval "$(yadra project export)"
```

## One-shot overrides

On `formalize`, `validate`, `seal`, `plan`:

- `--project <name>` — use a registered project without changing the current one
- `--ksl-project-home`, `--project-home`, `--yadra-project-home` — CI overrides

Environment: **`YADRA_PROJECT=<name>`** (session equivalent to `use`).

## Resolution order

1. Flags `--ksl-project-home`, `--project-home`, `--project`
2. Environment variables `KSL_PROJECT_HOME`, `PROJECT_HOME`, `YADRA_PROJECT`
3. **`current`** entry in `projects.json`
