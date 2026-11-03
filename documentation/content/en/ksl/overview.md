---
title: KSL Overview
description: Kom Specification Language v1.0 — author-facing contract for formal specs consumed by Yadra.
---

**KSL** (*Kom Specification Language*) is a high-level declarative DSL: business intent, domain modules, vertical features, and delivery manifests. It is **not** imperative code or class-level design.

## Three document kinds

| File | Role |
|------|------|
| `*.project.ksl` | Root, service, or library (`kind = root \| service \| lib`) |
| `*.module.ksl` | **Domain** module that owns one or more specs |
| `*.spec.ksl` | Vertical feature (`module = "<domain>"` required) |

Typical layout:

```text
services/order-service/
├── order-service.project.ksl
└── modules/
    └── checkout/
        ├── checkout.module.ksl
        └── order-checkout.spec.ksl
```

KSL keywords are in **English**. **Yadra** (Spec-to-Code Binder: T1/T2, validate, seal) is documented under **[Yadra](/docs/en/overview/)** — KSL does not encode Yadra runtime logic. The KSL spec **is** the feature document: update it when the feature evolves; create a new spec only for a major upgrade.

## Where to read the grammar

| Page | Content |
|------|---------|
| [KSL Reference](/docs/en/ksl/reference/) | **Imbrication** table: block → chain (`spec → strategies → strategy`) → doc link — `docs/ksl/reference/` |
| [Normative specification](/docs/en/ksl/language-spec/) | Normative prose and narrative examples (`docs/ksl-language-spec.md`) |
| [EBNF grammar](/docs/en/ksl/grammar/) | Canonical `ksl/grammar/ksl.ebnf` (L1 syntax) |

## Validate your files

With the CLI installed and `KSL_PROJECT_HOME` set:

```bash
yadra validate path/to/file.spec.ksl
yadra validate --syntax path/to/file.spec.ksl   # includes L1 (grammar)
```

See [yadra validate](/docs/en/validate/) and [yadra seal](/docs/en/seal/) for Timeline 1; [yadra plan](/docs/en/plan/) for Timeline 2.

## Examples in the repository

Minimal set: `ksl/examples/minimal/` (`order-service`, `checkout` and `cart` modules). The fullest reference spec is `order-checkout.spec.ksl`.
