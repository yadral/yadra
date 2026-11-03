---
title: projects.json
description: Registre des projets Yadra et projet courant (v0.1.1+).
---

Fichier **`~/.config/yadra/projects.json`** : plusieurs projets nommés, un **`current`**.

## Exemple

```json
{
  "version": 1,
  "current": "tontine",
  "projects": {
    "tontine": {
      "kslProjectHome": "/Users/mac/IdeaProjects/tontine/a-experiment-ksl",
      "projectHome": "/Users/mac/IdeaProjects/tontine/tontine-app",
      "yadraProjectHome": "/opt/yadra",
      "rootProjectFile": "root.project.ksl",
      "projectId": "tontine-platform",
      "llm": {
        "profile": "default",
        "model": "claude-sonnet-4-20250514"
      },
      "updatedAt": "2026-10-25T12:00:00.000Z"
    }
  }
}
```

## Attributs racine

| Attribut | Description |
|----------|-------------|
| `version` | `1` |
| `current` | Nom du projet actif (`null` si aucun) |
| `projects` | Map nom → enregistrement |

## Attributs par projet

| Attribut | Requis | Description |
|----------|--------|-------------|
| `kslProjectHome` | Oui | Chemin **absolu** du dépôt KSL |
| `projectHome` | Non | Chemin **absolu** du dépôt code |
| `yadraProjectHome` | Non | Distribution Yadra / grammaire |
| `rootProjectFile` | Non | Fichier root KSL relatif |
| `projectId` | Non | Id du bloc `project` root |
| `llm.profile` | Non | Profil configure |
| `llm.model` | Non | Modèle par défaut |
| `updatedAt` | Non | ISO-8601 |

Édition manuelle possible ; préférer `yadra project add` / `update` pour valider le root KSL.

Voir [`yadra project`](/docs/project/).
