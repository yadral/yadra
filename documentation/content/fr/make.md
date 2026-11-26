---
title: make
description: Chemin quotidien — T1 formalize puis T2 execute + gate en une commande (CLI 0.1.15+).
---

`yadra make` est le **chemin quotidien**. Une commande, du dossier Doc First (`intention.md` + `feature.yadra.md`) jusqu’au code sous **`PROJECT_HOME`**.

KSL n’est **pas supprimé** : il reste l’IR compilé (`validate`, `seal`, `gate`). Tu n’as plus à l’écrire ni à enchaîner `formalize` → `plan` → `execute` → `gate`. Ces commandes restent le **mode expert**.

## Synopsis

```bash
yadra make [PATH] [options]
```

**Prérequis :** un arbre produit joignable depuis `PATH`/`cwd` (auto-detect), ou un override `--project` / `--ksl-project-home` / `--project-home` ; LLM (`yadra configure`, une fois) sauf **`--dry-run --skip-llm`**.

Voir la [configuration minimale recommandée](/docs/overview/#configuration-minimale-recommandée) (overview).

**Workspace (auto-detect) :** Yadra remonte depuis `PATH` jusqu’à un `*.project.ksl` avec `kind = "root"`, ou un sous-dossier `ksl/` qui en contient un. `PROJECT_HOME` est lu depuis `repo.path` du root KSL. Plus besoin de `yadra project use` au quotidien. `--project` reste un override multi-produits / CI.

`PATH` (défaut `.`) :

| Forme | Effet |
|-------|--------|
| Dossier (`prompts/…`, `.`) | Découvre tous les `feature.yadra.md` (et specs KSL orphelines). |
| `feature.yadra.md` | Une feature. |
| `*.spec.ksl` | T2 seulement (execute + gate) sur cette spec. |

Si le dossier n’a ni feature ni spec, `make` cherche `prompts/` à côté de `KSL_PROJECT_HOME`, puis le monorepo KSL.

## Pipeline interne

1. Découvrir et **ordonner** : root → service → specs → module.
2. **T1** — `yadra formalize` (validate + seal) pour chaque feature.
3. **T2** — `yadra execute` en **slice unique** (`--combined` : toutes les strategies en contraintes, un pass LLM) + **merge** d’ownership (une spec peut mettre à jour un fichier déjà écrit).
4. **T2** — `yadra gate` (sauf `--no-gate`).

Les execute déjà **frais** (sceau T1 valide + evidence dans `.yadra/bundles/`) sont sautés, sauf `--force`.

## Journalisation

Par défaut : une ligne de progression par étape (`make T1 …`, `execute <spec>`, `N fichier(s)`, `gate SATISFIED`). Pas de dump SKILL/plan, pas de liste de chemins.

`--verbose` / `-v` : graphe complet, chemins écrits, contexte SKILL/plan.

`--dry-run` : graphe + plan T2, **sans** écriture T1.

`--format json` : graphe machine (avec `--dry-run` : s’arrête là).

## Options

| Option | Description |
|--------|-------------|
| `--step all\|t1\|t2\|execute\|gate` | Sous-ensemble (défaut `all`). Alias : `formalize` → `t1`. |
| `--dry-run` | Graphe + dry-run T2 ; pas d’écriture T1. |
| `--skip-llm` | Uniquement avec `--dry-run`. |
| `--format json` | Graphe machine. |
| `--no-gate` | Pas de gate. |
| `--no-combined` | Un pass LLM par strategy (comportement `execute` historique). |
| `--no-merge` | Ne pas écraser un fichier possédé par une autre spec. |
| `--force` | Relance T1 A+B et T2 même si le résultat est frais. |
| `--verbose` / `-v` | Détail (chemins, SKILL, graphe). |
| `--no-verify` | Execute sans sandbox. |
| `--allow-unsealed` | T2 sans seal T1. |
| `--refresh` / `--no-seal` / `--kinds` | Transmis à `formalize` / `execute`. |

## Exemples

```bash
yadra project use iyadris-payments

# Projet entier
yadra make .

# Un module (rail MoMo)
yadra make prompts/momo-cm/

# Une feature, T2 seulement
yadra make prompts/momo-cm/specs/request-to-pay/ --step t2

# Contrôle sans LLM
yadra make . --dry-run --skip-llm --format json

# Relance + détail
yadra make prompts/momo-cm/ --force --verbose
```

## Codes de sortie

| Code | Sens |
|------|------|
| `0` | `make OK` (ou dry-run OK). Gate `SATISFIED`. |
| `1` | Échec formalize / execute / gate `VIOLATED` / graphe vide. |
| `2` | Usage, projet, LLM, gate `UNDECIDABLE`. |

Mode expert : [`formalize`](/docs/formalize/), [`execute`](/docs/execute/). Architecture T1/T2 : [`Architecture`](/docs/architecture/).
