---
title: Grammaire EBNF
description: Syntaxe formelle KSL v1.0 — fichier ksl.ebnf embarqué dans la distribution Yadra (KSL_HOME).
---

La grammaire **L1** du KSL est définie en EBNF dans le monorepo :

```text
ksl/grammar/ksl.ebnf
```

Elle est copiée dans le paquet CLI (`vendor/yadral-dist/ksl/grammar/`) et exposée via **`KSL_HOME`**. La commande `yadra version` indique si le fichier est trouvé et affiche **`grammar version: 1.0`**.

## Fichiers reconnus

| Motif | Déclaration racine |
|-------|-------------------|
| `*.project.ksl` | `project "…" { … }` |
| `*.module.ksl` | `module "…" { … }` |
| `*.spec.ksl` | `spec "…" { … }` |

Chaque fichier commence par l’en-tête de version :

```ksl
ksl 1.0
```

## Lien avec la validation

| Niveau | Rôle |
|--------|------|
| **L0** | Layout, racine `*.project.ksl`, cohérence chemins |
| **L1** | Conformité à cette grammaire EBNF (`yadra validate --syntax`) |
| **L2 / L3** | Règles sémantiques et gate métier (voir [yadra validate](/docs/validate/)) |

La sémantique auteur (blocs `intention`, `outputs`, etc.) est décrite dans la [spécification normative](/docs/ksl/language-spec/), pas ligne par ligne dans l’EBNF.

## Texte canonique

Le contenu ci-dessous est lu à la compilation du site depuis `ksl/grammar/ksl.ebnf` (source unique).
