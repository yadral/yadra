---
name: strategies-catalog-reference
description: >-
  T2 · référence catalogue — noms canoniques strategy (catalog.yaml) pour agents T1/T2.
disable-model-invocation: false
---

# SKILL · strategies · catalogue

Source : [`yadra/strategies/catalog.yaml`](../../../strategies/catalog.yaml).

Ne pas inventer de noms hors catalogue sans description longue (règle T1 · A).

# Exécution du SKILL runtime

| Élément | Valeur |
|---------|--------|
| **Registre** | `skills.strategies.reference` → ce fichier |
| **Binding CLI** | `strategies:reference` — [`command-context.mjs`](../../../cli/src/runtime/command-context.mjs) |
| **Commande** | **`yadra strategies explain <id|name> [contexte…]`** |
| **Plan chargé** | `t2-comprendre-contrat` (draft ou plan-validate) — contexte T2 ; T1 · A utilise plutôt le plan **t1-comprendre-intention** + catalogue en direct |
| **LLM** | **Oui** — profil `yadra configure` ; **`--skip-llm`** = pas d’appel |
| **Fichiers agent** | `SKILL.md` + [`system.prompt.md`](system.prompt.md) |

## Comportement attendu

1. Lire l’entrée catalogue (`id`, `name`, `description_hint`, `skeleton` si présent).
2. Répondre avec le **nom canonique**, le rôle, et quand l’utiliser (`when`).
3. Citer le chemin **`skeleton`** (`yadra/strategies/ksl/…`) si défini.
4. **Ne pas** produire un plan de compilation complet (rôle **`yadra plan`** / SKILL **`execute/partie-a-comprendre`**).
5. **Ne pas** déduire les strategies d’une feature à la place de T1 · A.

## Commandes complémentaires (sans LLM)

- `yadra strategies list|show` — binaire, pas ce SKILL.
