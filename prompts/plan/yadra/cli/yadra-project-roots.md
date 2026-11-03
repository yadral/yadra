---
id: yadra-project-roots
title: CLI — deux homes utilisateur (yadra project)
status: ready
version: 2
aspect: yadra-cli
created: 2026-10-28
updated: 2026-10-30
authors: []
---

# Objectif

Ancrage **T1/T2** via **`yadra project`** (registre `~/.config/yadra/projects.json`) — **plus de commande `yadra context`**.

# Deux homes (+ registre)

| Variable | Rôle |
|----------|------|
| **`KSL_PROJECT_HOME`** | Monorepo **specs** : `root.project.ksl` (`kind = "root"`), modules, `.spec.ksl`. T1 écrit les `output_paths` ici ; T2 lit spec + seal. |
| **`PROJECT_HOME`** | Racine **cible** du code généré (T2 **`yadra execute`** / **`gate`**). Alignée sur `repo.path` du KSL quand possible. |

La **distribution produit** (grammaire embarquée, validate/seal, API pour strategies/skills/plans) vit dans le **paquet CLI** — pas de `YADRA_PROJECT_HOME` ni `--yadra-project-home`.

```bash
yadra project add my-app \
  --ksl-project-home /path/to/ksl-monorepo \
  --project-home /path/to/generated-code
yadra project use my-app
eval "$(yadra project export)"
# → export YADRA_PROJECT=… KSL_PROJECT_HOME=… PROJECT_HOME=…
```

# Résolution sans projet actif

- PATH explicite vers un `.spec.ksl` ou un dossier KSL, **ou**
- Flags one-shot : `--ksl-project-home`, `--project-home`, `--project <name>`.

# API (CLI thin)

`YADRA_API_URL` pour formalize/execute/gate LLM et compile-plan sans assets embarqués.

# Doc canonique

[`docs/yadra-cli.md`](../../../docs/yadra-cli.md) · site **`yadra project`**.
