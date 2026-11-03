---
title: execute
description: T2 · B · PRODUIRE — yadra execute (phase.execute, boucle sandbox/repair).
---

Triade T2 : **COMPRENDRE** (`yadra plan`) → **PRODUIRE** (`yadra execute`) → **LIVRER** (`yadra gate`).

La commande `yadra execute` est **B · PRODUIRE** : kinds **`outputs.phase.execute`** (par défaut `code`, `data`, `tests`). Elle valide la spec, vérifie le seal T1 (sauf dev), recalcule plan / bindings / manifest **en mémoire**, produit la spécialisation T2 · A **en mémoire** (LLM), matérialise sous **`PROJECT_HOME`**, puis lance **`gradle test`** et une boucle **repair** bornée par **`budget.max_repair_loops`**.

Les kinds **`outputs.phase.gate`** (`docs`, `e2e`, …) sont traités par **`yadra gate`** (CLI 0.1.8+).

## Sorties

| Sortie | Description |
|--------|-------------|
| **Console** | Phase, progression, sandbox, repair, erreurs |
| **`PROJECT_HOME/**`** | Sources applicatives (execute kinds) |

Aucun reçu JSON, aucun cache `.yadra/compile-plans/` sur le disque KSL.

## Options

| Option | Description |
|--------|-------------|
| `--kinds code,tests` | Sous-ensemble de **`outputs.phase.execute`**. |
| `--dry-run` | Plan + phase ; **aucune écriture**. |
| `--no-verify` | PRODUIRE sans sandbox Gradle / repair. |
| `--allow-unsealed` | Dev sans seal T1 valide. |
| `--skip-llm` | Uniquement avec `--dry-run`. |

## Stack KSL (langage et build)

La production T2 **ne suppose pas** un dépôt applicatif déjà peuplé. Le **langage**, le **build** et le **framework** viennent du contrat :

- **`root.project.ksl`** — bloc `stack { build runtime framework … }`
- **`*.project.ksl`** du service — `repo.path`, stack fusionnée pour les bindings

`PROJECT_HOME` (`yadra project --project-home`) est la racine **où Yadra écrit** (alignée sur `repo.path` du root). Les squelettes strategies (hexagonal, tests, …) spécialisent packages et extensions (`.kt`, `.java`, …) selon `stack.runtime`.

## Prérequis

1. `yadra project` avec **`KSL_PROJECT_HOME`** + **`PROJECT_HOME`**.
2. `yadra validate --semantic` sur la spec (`outputs.phase` recommandé).
3. Seal T1 recommandé (ou `--allow-unsealed`).
4. LLM configuré pour la production.

`yadra plan` reste un **aperçu** ; il n’est pas obligatoire avant `execute`.

## Exemple

```bash
yadra execute order-checkout.spec.ksl --dry-run --allow-unsealed --skip-llm
yadra execute order-checkout.spec.ksl --kinds code,tests --allow-unsealed
yadra execute order-checkout.spec.ksl --no-verify --allow-unsealed
```

Chemins code/tests : **`project.repo`**, stack et squelettes strategies — pas de `output_paths` dans `outputs` pour ces kinds.
