---
name: yadra
description: >-
  Guides agents on Yadral's Yadra SDD framework (KSL, formalize, seal,
  execute, gate, make). Use when the user mentions Yadra, Yadral, KSL, feature.yadra.md,
  formalize, seal, spec-to-code, iyadris-payments, iyadris-tontine, or
  specification-driven work on Iyadris repos — not when building unrelated apps
  without specs.
---

# Yadra — SDD (Yadral)

**Yadra** is Yadral’s **Spec-to-Code Binder**: [github.com/yadral/yadra](https://github.com/yadral/yadra). Canon docs in this repo: `docs/yadra-cli.md`, `docs/yadra-ksl-processing.md`.

The **spec is the feature** (KSL, sealed). Code must stay aligned via validate + seal (T1) and execute + gate (T2) — not a pile of stale Markdown.

## Mental model

| Concept | Meaning |
|---------|---------|
| **KSL** | DSL: `*.project.ksl`, `*.module.ksl`, `*.spec.ksl` — intention, use cases, data, strategies, outputs |
| **T1 · Formalisation** | Doc First → KSL → **validate** → **seal** |
| **T2 · Matérialisation** | Sealed spec only → **plan** → **execute** → **gate** |
| **Phases** | **A · COMPRENDRE → B · PRODUIRE → C · LIVRER** (same pattern in T1 and T2) |

## Four roots (never confuse)

| Variable | Role |
|----------|------|
| `YADRA_PROJECT_HOME` | Tooling distribution (CLI vendor, grammar, strategies catalog) |
| `KSL_PROJECT_HOME` | Spec monorepo: `ksl/`, `prompts/`, `.yadra/sealed/` |
| `PROJECT_HOME` | Application code T2 targets (auto from `repo.path` in root KSL) |
| `KSL_HOME` | Grammar + validator (packaged in CLI or `yadra/ksl`) |

Register with: `yadra project add <id> --ksl-project-home … --project-home …` then `yadra project use <id>` and `eval "$(yadra project export)"`.

## Commands (happy path)

```bash
yadra doctor
# Daily path — Doc First → sealed KSL → code
yadra make prompts/.../ma-feature/
# Expert — T1 / T2 split
yadra formalize prompts/.../ma-feature/
yadra execute path/to/foo.spec.ksl
yadra gate path/to/foo.spec.ksl
```

`yadra validate` is the CI anchor. Other orchestration commands use LLM + runtime SKILLS unless `--skip-llm`.

## Doc First entry (`feature.yadra.md`)

Required in each formalization folder:

- `kind: KSL`, `IsNew`, `related_specs`, `ksl_levels`, `output_paths` (relative to `KSL_PROJECT_HOME`)
- Human context: `intention.md`, `root.md` as needed

**KSL level rule (Iyadris):** detailed `usecases` / `strategies` live in **`*.spec.ksl` only**, not in root/module/service project files.

## What the agent must do

1. **Clarify the ask:** new feature → T1 folder + KSL paths; change code → which `.spec.ksl` is the authority?
2. **Prefer minimal diffs** scoped to one spec/capability; do not rewrite unrelated modules.
3. **Respect layout:** `services/<service>/modules/<domain>/<domain>.module.ksl` + specs; `module = "<domain>"` matches folder name.
4. **Before inventing architecture:** read existing `*.spec.ksl` and `intention.md` in that repo’s `prompts/`.
5. **Strategies** in KSL name catalog entries (`Hexagonal`, `Validator`, `FluentCaseTest`, …) — see `yadra strategies list` in CLI.
6. **Production path:** seal before strict execute; gate checks conformance to sealed spec.

## What the agent must not do

- Treat random README or chat as source of truth over **sealed KSL**.
- Put business use cases/strategies in `root.project.ksl` or `*.module.ksl` (Iyadris convention).
- Mix `KSL_PROJECT_HOME` and `PROJECT_HOME` (specs vs generated/edited code).
- Run full greenfield codegen when the user asked only to **formalize** or **document** one capability.
- Assume Mobile Money is implemented in the app because the product copy mentions MoMo — payments live in **iyadris-payments** as a neutral rail unless a spec says otherwise.

## Interpreting user requests

| User says | Agent does |
|-----------|------------|
| « formalize cette feature » | Create/update `prompts/.../feature.yadra.md` (+ intention), run or document `yadra formalize`, validate, seal |
| « génère le code » / « make » | `yadra make <prompts/…>` (T1+T2) ; KSL stays IR |
| « exécute la spec » | T2: check seal, `yadra plan` / `execute` on `PROJECT_HOME`, respect `stack` in root KSL |
| « le code a divergé » | `yadra gate`; if VIOLATED → repair under spec or return to T1 |
| « ajoute un use case » | Edit **spec** KSL + formalization docs; avoid drive-by refactors in `PROJECT_HOME` |
| Product intent only (e.g. tontine.md) | **Doc First** — do not dump code until `feature.yadra.md` + spec path exist |

## Deep reference

- [docs/yadra-cli.md](../../docs/yadra-cli.md)
- [docs/yadra-ksl-processing.md](../../docs/yadra-ksl-processing.md)
- Runtime SKILLS: [skills/registry.yaml](../registry.yaml)

Prefer **packaged CLI** (`cli/`, npm `@yadral/yadra`) over stub `ksl/tools/yadra/bin/yadra.mjs` for full T2.
