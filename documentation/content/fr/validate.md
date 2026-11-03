---
title: validate
description: Vérifie la conformité structurelle, syntaxique, d'arborescence et sémantique des fichiers KSL.
---

La commande `yadra validate` exécute le vérificateur formel KSL (100 % déterministe, sans IA) sur un fichier `.ksl` ou récursivement sur un répertoire.

## Synopsis

```bash
yadra validate [PATH] [options]
```

> **Description :** Analyse un fichier `.ksl` ou l'ensemble des fichiers `.ksl` d'un répertoire (par défaut `.` sous `KSL_PROJECT_HOME`) selon les niveaux de validation sélectionnés et retourne un code de sortie `0` uniquement si toutes les règles sont satisfaites.

## Arguments

| Argument | Description |
|----------|-------------|
| `PATH` | Chemin d'un fichier `.ksl`, d'un dossier, ou `.` pour valider le répertoire courant à partir de `KSL_PROJECT_HOME`. |

## Options

| Option | Niveau | Description |
|--------|--------|-------------|
| *(toujours actif)* | **L0** | Vérifie l'en-tête `ksl 1.0`, la déclaration racine (`project`, `module`, `spec`) et l'équilibrage des blocs `{ }`. |
| `--syntax` | **L1** | Vérifie les règles lexicales et syntaxiques de la grammaire KSL. |
| `--layout` | **L2** | Vérifie la cohérence entre `module = "<domaine>"`, le nom du dossier parent `modules/<domaine>/`, la présence de `<domaine>.module.ksl` et l'inscription de la spec dans `specs = [...]`. |
| `--semantic` | **L3** | Vérifie la cohérence entre `outputs.kinds` et les blocs déclarés (`data`, `docs`, `e2e`), ainsi que la présence obligatoire de `description =` dans chaque entrée `strategy`. |
| `--format human\|json` | — | Format d'affichage du rapport (`human` par défaut). |
| `-h`, `--help` | — | Affiche l'aide de la commande `validate`. |

## Exemples

### Validation complète d'un module et de sa spécification

```bash
yadra validate ksl/services/tontine-service/modules/members/members.module.ksl --layout --semantic
yadra validate ksl/services/tontine-service/modules/members/member-creation.spec.ksl --layout --semantic
```

Sortie :

```text
Validation passed (L0+L2+L3) on 1 file(s).
Validation passed (L0+L2+L3) on 1 file(s).
```

### Validation de l'ensemble du dépôt KSL en JSON

```bash
yadra validate . --syntax --layout --semantic --format json
```

Sortie :

```json
{
  "ok": true,
  "files": 5,
  "issues": []
}
```
