---
id: ksl-folder
title: Regrouper KSL sous ksl/
status: superseded
version: 1
aspect: repo-layout
created: 2026-10-15
updated: 2026-10-15
authors: []
source_plan: null
---

# Objectif

À la racine du dépôt, ne garder que `scripts/` ; déplacer grammaire, docs, exemples, éditeur et outils sous `ksl/`.

# Périmètre

- Inclus : déplacement Git, scripts, CI, docs, chemins CLI.
- Exclus : nouveau contenu métier KSL.

# Étapes

1. Créer `ksl/` et y déplacer `docs`, `grammar`, `examples`, `editor`, `tools`, `CONTEXTE-PROMPT.md`.
2. Mettre à jour `scripts/*`, workflows GitHub, README, `KSL_HOME` → dossier `ksl/`.
3. Valider `./scripts/validate-ksl.sh` et `yadra validate`.

# Critères de validation (aspect repo-layout)

- [x] Arborescence `ksl/` + `scripts/` à la racine
- [x] CI et scripts pointent vers `ksl/...`
- [x] Validation L0+L2+L3 sur `ksl/examples/minimal`
