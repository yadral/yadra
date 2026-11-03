# Plans validés par aspect

Un plan apparaît ici **après validation** pour un **aspect** précis.

## Layout

```
plan-validate/
  <aspect>/
    <id>.plan.md
```

- **`<aspect>`** : identifiant stable (ex. `repo-layout`, `yadra-t2`). Voir la table dans [`../README.md`](../README.md).
- **`<id>`** : même `id` que dans l’en-tête YAML du plan source (souvent le nom de fichier sans `.plan.md`).

## En-tête obligatoire (validé)

```yaml
---
id: same-as-draft
title: ...
status: validated
version: 1
aspect: repo-layout
created: 2026-10-15
updated: 2026-10-15
validated_at: 2026-10-15
source_plan: plan/repo-layout-ksl-folder.plan.md
validated_by: human
---
```

## Exemple

Voir [`repo-layout/ksl-folder.plan.md`](repo-layout/ksl-folder.plan.md) — promotion du travail « tout KSL sous `ksl/` ».
