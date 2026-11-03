---
title: version
description: Affiche la version officielle de Yadra CLI lue depuis yadra/manifest.mf ainsi que l'état de l'environnement KSL.
---

La commande `yadra version` affiche la version exacte de Yadra CLI, la version de la grammaire KSL chargée et les chemins d'environnement actifs.

## Synopsis

```bash
yadra version [options]
```

> **Description :** Lit l'attribut `version` déclaré dans `yadra/manifest.mf`, vérifie la présence de la grammaire `ksl.ebnf` sous `KSL_HOME` et affiche le projet actif et les racines résolues.

## Options

| Option | Description |
|--------|-------------|
| `--format human\|json` | Format de sortie (`human` par défaut, `json` pour l'intégration CI/CD). |
| `-h`, `--help` | Affiche l'aide de la commande `version`. |

## Source de version (`yadra/manifest.mf`)

La version officielle du CLI et de la documentation est gouvernée par le fichier `yadra/manifest.mf` :

```ini
Manifest-Version: 1.0
name: yadra
version: 0.1.3
```

## Exemples

### Affichage standard

```bash
yadra version
```

Sortie :

```text
yadra CLI: 0.1.3
KSL_HOME: /opt/yadra/ksl
grammar: /opt/yadra/ksl/grammar/ksl.ebnf (found)
grammar version: 1.0
YADRA_PROJECT: tontine
KSL_PROJECT_HOME: /Users/dev/tontine-ksl
PROJECT_HOME: /Users/dev/tontine-app
YADRA_PROJECT_HOME: /opt/yadra
```

### Sortie JSON pour scripts

```bash
yadra version --format json
```

Sortie :

```json
{
  "name": "yadra",
  "version": "0.1.3",
  "grammarVersion": "1.0",
  "kslHome": "/opt/yadra/ksl",
  "grammar": "/opt/yadra/ksl/grammar/ksl.ebnf",
  "grammarFound": true,
  "yadraProject": "tontine",
  "kslProjectHome": "/Users/dev/tontine-ksl",
  "projectHome": "/Users/dev/tontine-app",
  "yadraProjectHome": "/opt/yadra",
  "llm": {}
}
```
