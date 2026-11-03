---
id: ksl-folder
title: Regrouper KSL sous ksl/
status: validated
version: 1
aspect: repo-layout
created: 2026-10-15
updated: 2026-10-15
validated_at: 2026-10-15
source_plan: plan/repo-layout-ksl-folder.plan.md
validated_by: human
authors: []
---

# Objectif

À la racine du dépôt, ne garder que `scripts/` (hors prompts) ; déplacer grammaire, docs, exemples, éditeur et outils sous `ksl/`.

# Périmètre

- Inclus : déplacement Git, scripts, CI, docs, chemins CLI.
- Exclus : nouveau contenu métier KSL.

# Étapes (réalisées)

1. Créer `ksl/` et y déplacer `docs`, `grammar`, `examples`, `editor`, `tools`, `CONTEXTE-PROMPT.md`.
2. Mettre à jour `scripts/*`, workflows GitHub, README, `KSL_HOME` → dossier `ksl/`.
3. Valider `./scripts/validate-ksl.sh` et `yadra validate`.

# Résultat

- **`KSL_HOME`** = `<clone>/ksl`
- Exemple projet : `yadra project add minimal --ksl-project-home …/ksl/examples/minimal --project-home …`
