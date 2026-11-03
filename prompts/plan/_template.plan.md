---
id: my-plan-id
title: Titre court du plan
status: draft
version: 1
aspect: null
created: 2026-10-15
updated: 2026-10-15
authors: []
source_plan: null
---

# Objectif

Une phrase : ce que ce plan doit produire ou décider.

# Contexte

Liens vers KSL, docs, tickets. Pas de logique Yadra normée dans l’KSL surface — renvoyer vers [`docs/yadra-ksl-processing.md`](../../docs/yadra-ksl-processing.md) si besoin.

# Exécution du SKILL runtime

*(Obligatoire pour les plans Yadra T1/T2 qui pilotent un SKILL — voir plans `yadra/v1/`.)*

| Élément | Valeur |
|---------|--------|
| **Registre** | `skills.…` → chemin `yadra/skills/…/SKILL.md` |
| **Binding CLI** | clé dans [`command-context.mjs`](../../yadra/cli/src/runtime/command-context.mjs) |
| **Commande** | ex. `yadra formalize`, `yadra plan`, `yadra seal` |
| **Plan chargé** | `plan-validate/<aspect>/` ou draft `plan/yadra/v1/` |
| **LLM** | oui/non ; `--skip-llm` |
| **Fichiers agent** | `SKILL.md` + `system.prompt.md` |

## Comportement attendu (agent)

1. …

## Interdit (SKILL)

- …

# Périmètre

- Inclus : …
- Exclus : …

# Étapes

1. …
2. …

# Critères de validation (aspect)

Quand ces critères sont OK, promouvoir vers `plan-validate/<aspect>/` avec le même `id`.

- [ ] …

# Risques / open questions

- …
