---
title: EBNF grammar
description: Formal KSL v1.0 syntax — ksl.ebnf file bundled with the Yadra CLI distribution (KSL_HOME).
---

KSL **L1** syntax is defined in EBNF in the monorepo at:

```text
ksl/grammar/ksl.ebnf
```

It is bundled in the CLI package (`vendor/yadral-dist/ksl/grammar/`) and resolved via **`KSL_HOME`**. Run `yadra version` to confirm the file is found and to read **`grammar version: 1.0`**.

## Recognized files

| Pattern | Root declaration |
|---------|------------------|
| `*.project.ksl` | `project "…" { … }` |
| `*.module.ksl` | `module "…" { … }` |
| `*.spec.ksl` | `spec "…" { … }` |

Every file starts with a version header:

```ksl
ksl 1.0
```

## Validation mapping

| Layer | Role |
|-------|------|
| **L0** | Layout, root `*.project.ksl`, path consistency |
| **L1** | Conformance to this EBNF (`yadra validate --syntax`) |
| **L2 / L3** | Semantic rules and business gate (see [yadra validate](/docs/en/validate/)) |

Author semantics (`intention`, `outputs`, etc.) are in the [normative specification](/docs/en/ksl/language-spec/), not spelled out line-by-line in EBNF.

## Canonical source

The block below is loaded at site build time from `ksl/grammar/ksl.ebnf` (single source of truth).
