---
title: Vue d'ensemble KSL
description: Kom Specification Language v1.0 — contrat auteur pour les spécifications formelles consommées par Yadra.
---

**KSL** (*Kom Specification Language*) est un DSL déclaratif de haut niveau : intention métier, modules domaine, features verticales et manifeste de livraison. Ce n’est **pas** du code impératif ni du design de classes.

## Trois types de documents

| Fichier | Rôle |
|---------|------|
| `*.project.ksl` | Racine, service ou bibliothèque (`kind = root \| service \| lib`) |
| `*.module.ksl` | Module **domaine** qui possède une ou plusieurs specs |
| `*.spec.ksl` | Feature verticale (`module = "<domaine>"` obligatoire) |

Arborescence type :

```text
services/order-service/
├── order-service.project.ksl
└── modules/
    └── checkout/
        ├── checkout.module.ksl
        └── order-checkout.spec.ksl
```

Les mots-clés KSL sont en **anglais**. **Yadra** (Spec-to-Code Binder : T1/T2, validate, seal) est documenté dans l’espace **[Yadra](/docs/overview/)** — le KSL n’encode pas la logique Yadra. La spec KSL **est** le document de la feature : on la met à jour si la feature évolue, on en crée une nouvelle pour un upgrade majeur.

## Où lire la grammaire

| Page | Contenu |
|------|---------|
| [Référence KSL](/docs/ksl/reference/) | Table **Imbrication** : bloc → chaîne (`spec → strategies → strategy`) → lien vers la fiche — `docs/ksl/reference/` |
| [Spécification normative](/docs/ksl/language-spec/) | Prose normative et exemples narratifs (source : `docs/ksl-language-spec.md`) |
| [Grammaire EBNF](/docs/ksl/grammar/) | Fichier canonique `ksl/grammar/ksl.ebnf` (syntaxe L1) |

## Vérifier vos fichiers

Avec le CLI installé et `KSL_PROJECT_HOME` configuré :

```bash
yadra validate chemin/vers/fichier.spec.ksl
yadra validate --syntax chemin/vers/fichier.spec.ksl   # inclut L1 (grammaire)
```

Voir [yadra validate](/docs/validate/) et [yadra seal](/docs/seal/) pour la Timeline 1 ; [yadra plan](/docs/plan/) pour la Timeline 2.

## Exemples dans le dépôt

Jeu minimal : `ksl/examples/minimal/` (`order-service`, modules `checkout` et `cart`). La spec de référence la plus complète est `order-checkout.spec.ksl`.
