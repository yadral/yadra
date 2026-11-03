---
id: t2-livrer-gate
title: T2 · C · LIVRER — Conformance Gate (phase.gate)
status: validated
version: 1
aspect: yadra-t2
created: 2026-10-28
updated: 2026-10-28
validated_at: 2026-10-28
source_plan: plan/yadra/v1/yadra-t2-livrer-gate.plan.md
validated_by: human
authors: []
---

# Objectif

**T2 · C · LIVRER** (commande **`yadra gate`**) : kinds **`outputs.phase.gate`**
(`docs`, `e2e`, …), preuves d’exécution B, **Conformance Gate** et manifest
`KSL_PROJECT_HOME/.yadra/bundles/<spec-id>/manifest.json`.

- **Phase LIVRER** : SKILL C + bundle ; **IA** si `--produce` (docs/e2e).
- **Oracle Conformance Gate** : verdict **déterministe** (sans LLM), distinct de B / `--produce`.
- La boucle Gradle / repair reste dans **B** (`yadra execute`).

# Préconditions

1. `yadra validate --semantic` OK.
2. Seal T1 frais (sauf `--allow-unsealed`).
3. `PROJECT_HOME` configuré.
4. Evidence **`execute`** dans le manifest bundle (sauf `--allow-no-execute` dev).
5. `--kinds` ⊆ `outputs.phase.gate`.

# Conformance Gate (MVP)

| Étape | Règle |
|-------|--------|
| Execute evidence | `manifest.execute.status` ∈ `OK`, `OK_NO_VERIFY` |
| `docs` | Fichiers sous `PROJECT_HOME/<project.docs.path>` |
| `e2e` | Fichiers sous `PROJECT_HOME/<project.e2e.path>` |
| Résultat | `SATISFIED` \| `VIOLATED` \| `UNDECIDABLE` |

# CLI — `yadra gate`

```bash
yadra gate [SPEC.spec.ksl | .] [--format human|json] [--kinds a,b]
           [--dry-run] [--produce] [--allow-unsealed] [--allow-no-execute]
```

| Flag | Rôle |
|------|------|
| `--dry-run` | Plan gate + SKILL ; aucune écriture |
| `--produce` | LLM + SKILL C : blocs `--- FILE: ---` pour docs/e2e |
| `--allow-no-execute` | Dev : gate sans preuve B |
| `--skip-llm` | Uniquement avec `--dry-run` |

# Exécution du SKILL runtime

| Élément | Valeur |
|---------|--------|
| **Registre** | `skills.execute.livrer` → `execute/partie-c-livrer/SKILL.md` |
| **Binding CLI** | `gate:C` dans `command-context.mjs` |
| **Commande** | `yadra gate` |
| **Plan chargé** | `plan-validate/yadra-t2/` ou ce draft v1 |
| **LLM** | `--produce` uniquement |

# Critères de validation

- [ ] `yadra gate --dry-run` affiche kinds gate et SKILL C.
- [ ] Sans execute evidence → `UNDECIDABLE` (code 2).
- [ ] Après `execute` + `--produce` ou artefacts présents → `SATISFIED` possible.
- [ ] Manifest bundle mis à jour avec `gate`, `violations`, horodatage.
