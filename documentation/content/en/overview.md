---
title: Overview
description: Yadra Spec-to-Code Binder — CLI (v0.1.9) T1, T2 plan, execute, gate (phase.gate).
---

**Yadra** is a **Spec-to-Code Binder**: it keeps application code bound to a sealed **KSL (Kom Specification Language)** spec. The spec **is** the feature document — not a pile of `.md` files that go unread and stale. Update the spec when the feature evolves; open a **new spec** only for a major upgrade.

The **CLI** turns intent into a verified, cryptographically sealed KSL contract (**Timeline 1**), then materializes code that stays coupled to that contract (**Timeline 2**).

## Installation

### 1. From the `.tgz` package (recommended for developers)

```bash
npm install -g ./yadral-yadra-0.1.3.tgz
yadra version
```

`YADRA_PROJECT_HOME` and `KSL_HOME` are automatically resolved from the bundled distribution inside the package. Cloning the tool repository or passing `--yadra-project-home` is not required for day-to-day usage.

### 2. Build the package (release) or develop inside the monorepo

```bash
cd yadra/cli
npm run pack:release   # produces yadral-yadra-0.1.3.tgz
npm link               # optional for maintainers
```

Full workflow (build, GitHub Release, install): [Package process](/docs/en/package-process/).

Language grammar and semantics: switch to **[KSL](/docs/en/ksl/overview/)** (header toggle **Yadra | KSL**).

## Workspace Directories

Yadra strictly separates the toolchain distribution, the KSL specification repository, and the generated application repository:

| Variable | Role |
|----------|------|
| `YADRA_PROJECT_HOME` | Root of the Yadra distribution and KSL grammar (`ksl/grammar/ksl.ebnf`). |
| `KSL_PROJECT_HOME` | Root of the target repository where `.project.ksl`, `.module.ksl`, and `.spec.ksl` specifications are generated and maintained. |
| `PROJECT_HOME` | Root of the application source code repository generated from KSL specifications. |
| `KSL_HOME` | KSL language pack directory (`$YADRA_PROJECT_HOME/ksl`). |

Export these variables into your current shell session using:

```bash
eval "$(yadra project export)"
```

## Configuration Files

| File | Scope | Purpose |
|------|-------|---------|
| `yadra/manifest.mf` | Distribution | Official manifest declaring the `version` attribute of the CLI. |
| `~/.config/yadra/configure` | User | LLM provider profiles and default model settings. |
| `~/.config/yadra/credentials` | User | Access tokens, API keys, or login credentials (`chmod 600`). |
| `~/.config/yadra/projects.json` | User | Project registry and active project (`current`). |

## CLI commands

### CLI — Cross-cutting

| Command | Description |
|---------|-------------|
| [`yadra version`](/docs/en/version/) | CLI version (`yadra/manifest.mf`), KSL grammar, and active project. |
| [`yadra help`](/docs/en/help/) | Displays the list of available commands or detailed help for a subcommand (`yadra <command> -h`). |
| [`yadra configure`](/docs/en/configure/) | Configures LLM profiles and stores authentication tokens or login credentials. |
| [`yadra project`](/docs/en/project/) | Register multiple projects (KSL + app), `use` to switch the active project. |
| `yadra doctor` | Checks Node.js (≥ 18), KSL grammar, and active project. |

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

## Standard Timeline 1 Workflow

```bash
# 1. Configure the LLM provider and credentials
# crsr_… keys: cursor provider (defaults to api2.cursor.sh — no base-url needed)
yadra configure set --profile cursor --provider cursor --model composer-2.5-fast
yadra configure credentials --profile cursor --token "YOUR_CRSR_KEY"
yadra configure test
# Requires Cursor CLI (`cursor agent`). Or use --provider openai + sk-… key.

# 2. Anchor the workspace directories
yadra project add tontine \
  --ksl-project-home ~/projects/tontine-ksl \
  --project-home ~/projects/tontine-app \
  --model composer-2.5-fast

# 3. Formalize and seal a feature from its context documents folder
yadra formalize ./context/member-creation/ --seal

# 4. T2 compile plan (dry-run, execute / gate phase)
yadra plan ./ksl/services/tontine-service/modules/members/member-creation.spec.ksl

# 5. T2 materialization (phase.execute)
yadra execute ./ksl/services/tontine-service/modules/members/member-creation.spec.ksl --dry-run --skip-llm
```

T2 produce vs execute vs gate: [Architecture](/docs/en/architecture/).
