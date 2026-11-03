---
title: strategies
description: Timeline 2 — catalogue interne des noms strategy (référence agents et validate L3).
---

La commande `yadra strategies` (CLI **v0.1.3**) expose le fichier **`yadra/strategies/catalog.yaml`** embarqué dans la distribution. Elle sert de **référence** pour T1 · A (déduction des `strategy "…"` dans le compact) et pour **`yadra validate --semantic`** (descriptions L3).

Aucun projet KSL actif n’est requis.

## Synopsis

```bash
yadra strategies list [options]
yadra strategies show <id|name> [options]
```

> **Description :** Liste ou détail des noms canoniques (Hexagonal, SOLID, GoF, …) avec `role`, `family` et `description_hint`.

## Sous-commandes

| Sous-commande | Rôle |
|---------------|------|
| **`list`** | Tableau groupé par section du catalogue (défaut si omis). |
| **`show`** | Une entrée par `id` ou `name` (ex. `SOLID`, `solid`). |

## Options (`list`)

| Option | Description |
|--------|-------------|
| `--format human\|json` | Sortie lisible ou JSON (`human` par défaut). |
| `--family <f>` | Filtre (`principles`, `creational`, `architecture`, …). |
| `--role <r>` | Filtre (`architecture`, `pattern`, `testing`). |
| `--section <text>` | Sous-chaîne dans le titre de section (ex. `GoF`, `Principes`). |
| `--hints` | En JSON, inclut `description_hint` pour chaque entrée. |
| `-h`, `--help` | Aide (`yadra strategies -h`). |

## Options (`show`)

| Option | Description |
|--------|-------------|
| `--format human\|json` | Détail texte ou objet JSON complet. |

## Exemples

```bash
yadra strategies list
yadra strategies list --family principles
yadra strategies show Populator/Converter
yadra strategies list --format json --section "Design patterns"
```

### JSON (`list`)

```bash
yadra strategies list --format json --hints | jq '.count'
```

## Rôle pour le développement

| Usage | Comment |
|-------|---------|
| T1 · A | Vérifier le nom exact avant d’écrire `strategy "…"` dans le KSL. |
| CI / scripts | `--format json` pour comparer spec vs catalogue. |
| Agents T2 | `show` pour récupérer le `description_hint` sans ouvrir le repo. |

Source de vérité : [`yadra/strategies/catalog.yaml`](../../../strategies/catalog.yaml). Doc strategies KSL : [référence strategies](/docs/ksl/reference/strategies/).
