---
title: Overview
description: Yadra Spec-to-Code Binder — CLI (v0.1.15) T1, T2, yadra make (daily path, auto-detect).
---

**Yadra** is a **Spec-to-Code Binder**: it keeps application code bound to a sealed **KSL (Kom Specification Language)** spec. The spec **is** the feature document — not a pile of `.md` files that go unread and stale. Update the spec when the feature evolves; open a **new spec** only for a major upgrade.

The **CLI** turns intent into a verified, cryptographically sealed KSL contract (**Timeline 1**), then materializes code that stays coupled to that contract (**Timeline 2**).

## Installation

### 1. From the `.tgz` package (recommended for developers)

```bash
npm install -g ./yadral-yadra-0.1.15.tgz
yadra version
```

`YADRA_PROJECT_HOME` and `KSL_HOME` are automatically resolved from the bundled distribution inside the package. Cloning the tool repository or passing `--yadra-project-home` is not required for day-to-day usage.

### 2. Build the package (release) or develop inside the monorepo

```bash
cd yadra/cli
npm run pack:release   # produces yadral-yadra-0.1.15.tgz
npm link               # optional for maintainers
```

Full workflow (build, GitHub Release, install): [Package process](/docs/en/package-process/).

Language grammar and semantics: switch to **[KSL](/docs/en/ksl/overview/)** (header toggle **Yadra | KSL**).

## Recommended minimal configuration

For day-to-day use, **one machine-level setup** is enough: the LLM profile. The workspace (specs + app code) is **auto-detected** from the path passed to `yadra make` (or the current working directory).

### 1. Once per machine — LLM

```bash
# crsr_… keys: cursor provider (defaults to api2.cursor.sh — no base-url needed)
yadra configure set --profile cursor --provider cursor --model composer-2.5-fast
yadra configure credentials --profile cursor --token "YOUR_CRSR_KEY"
yadra configure test
# Requires Cursor CLI (`cursor agent`). Or use --provider openai + sk-… key.
```

Details: [`yadra configure`](/docs/en/configure/).

### 2. In the product — KSL ready for auto-detect

| Item | Role |
|------|------|
| `root.project.ksl` with `kind = "root"` | At the KSL monorepo root, **or** under a `ksl/` folder |
| `repo { path = "…" }` | Path to application code (`PROJECT_HOME`), relative to the KSL root |
| Doc First folder | `intention.md` + `feature.yadra.md` (e.g. `prompts/…`) |

Example layout:

```text
my-product/
  ksl/
    root.project.ksl          # repo.path = "../root"
    services/…
  root/                       # PROJECT_HOME (generated code)
  prompts/
    my-feature/
      intention.md
      feature.yadra.md
```

### 3. Daily — one command

```bash
yadra make prompts/my-feature/
# from any directory:
yadra make /path/to/my-product/prompts/my-feature/
```

**No need** for `yadra project use`, nor exporting `KSL_PROJECT_HOME` / `PROJECT_HOME` / `eval "$(yadra project export)"` day to day.

Dry-run without an LLM:

```bash
yadra make prompts/my-feature/ --dry-run --skip-llm --format json
```

### Optional — multi-product / CI

[`yadra project`](/docs/en/project/) remains useful as an **alias** (`--project <name>`) or explicit path override. It is **not** required for a single product with auto-detect.

```bash
yadra project add tontine --ksl-project-home …/ksl --project-home …/root
yadra make prompts/my-feature/ --project tontine
```

## Workspace Directories

Yadra separates the toolchain distribution, KSL specs, and application code. Day to day these roots are **inferred** (CLI package + auto-detect); the variables remain useful in CI or as overrides.

| Variable | Role | Daily resolution |
|----------|------|------------------|
| `YADRA_PROJECT_HOME` / `KSL_HOME` | Distribution + KSL grammar | Auto from the CLI package |
| `KSL_PROJECT_HOME` | Specs (`.project.ksl`, `.module.ksl`, `.spec.ksl`) | Auto: walk-up to `root.project.ksl` or `ksl/` |
| `PROJECT_HOME` | Generated code (T2) | Auto: `repo.path` in the root KSL |

Overrides: `--project`, `--ksl-project-home`, `--project-home`, or the [`projects.json`](/docs/en/files/projects-json/) registry.

## Configuration Files

| File | Scope | Purpose |
|------|-------|---------|
| `yadra/manifest.mf` | Distribution | Official manifest declaring the `version` attribute of the CLI. |
| `~/.config/yadra/configure` | User | **Required** — LLM provider profiles and default models. |
| `~/.config/yadra/credentials` | User | **Required** — tokens / keys (`chmod 600`). |
| `~/.config/yadra/projects.json` | User | **Optional** — multi-product aliases (`--project`). |

## CLI commands

### CLI — Cross-cutting

| Command | Description |
|---------|-------------|
| [`yadra version`](/docs/en/version/) | CLI version (`yadra/manifest.mf`), KSL grammar, and active project. |
| [`yadra help`](/docs/en/help/) | Displays the list of available commands or detailed help for a subcommand (`yadra <command> -h`). |
| [`yadra configure`](/docs/en/configure/) | Configures LLM profiles and stores authentication tokens or login credentials. |
| [`yadra project`](/docs/en/project/) | Optional aliases (KSL + app); override via `--project`. |
| `yadra doctor` | Checks Node.js (≥ 18), KSL grammar, and workspace. |

### Timeline 1 (T1)

| Command | Description |
|---------|-------------|
| [`yadra formalize`](/docs/en/formalize/) | **T1 complete**: A→B→C (LLM if `.ksl` missing); else validate + seal. |
| [`yadra validate`](/docs/en/validate/) | Verifies structural (L0), syntactic (L1), layout (L2), and semantic (L3) conformance of KSL files. |
| [`yadra seal`](/docs/en/seal/) | Formally validates a KSL specification and writes its cryptographic seal into `.yadra/sealed/`. |

### Timeline 2 (T2)

| Command | Description |
|---------|-------------|
| [`yadra plan`](/docs/en/plan/) | Compile plan from a `.spec.ksl` (dry-run, `--format human\|json`). |
| [`yadra strategies`](/docs/en/strategies/) | Internal `strategy` name catalog (`list` / `show`, `--format json`). |
| [`yadra execute`](/docs/en/execute/) | **B · PRODUCE** — `phase.execute` + sandbox/repair loop → `PROJECT_HOME` (v0.1.7). |
| `yadra gate` | **C · DELIVER (LIVRER)** — `phase.gate` (docs, e2e); see [Architecture](/docs/en/architecture/). |
| [`yadra make`](/docs/en/make/) | **Daily path** — T1 + T2 in one command (v0.1.15, auto-detect). |

## Standard workflow

```bash
# Once (machine): LLM — see Recommended minimal configuration
yadra configure set --profile cursor --provider cursor --model composer-2.5-fast
yadra configure credentials --profile cursor --token "YOUR_CRSR_KEY"

# Daily: Doc First → code (workspace auto-detected)
yadra make ./context/member-creation/

# Expert mode — one spec:
# yadra formalize ./context/member-creation/ --seal
# yadra execute ./ksl/services/tontine-service/modules/members/member-creation.spec.ksl
```

T2 produce vs execute vs gate: [Architecture](/docs/en/architecture/).
