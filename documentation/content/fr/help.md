---
title: help
description: Consulte l'aide globale de Yadra CLI et la documentation détaillée de chaque sous-commande.
---

La commande `yadra help` (ou les options `-h` / `--help`) fournit la documentation intégrée au terminal pour l'ensemble des commandes disponibles dans la version active du CLI.

## Synopsis

```bash
yadra help [commande]
yadra -h
yadra <commande> -h
```

> **Description :** Sans argument, affiche la liste complète des sous-commandes disponibles avec leur résumé. Lorsqu'elle est associée à une commande (`yadra <commande> -h`), affiche le synopsis, la description, les options acceptées et des exemples d'exécution.

## Exemples d'utilisation

### Aide générale

```bash
yadra -h
# ou
yadra help
```

Sortie :

```text
Yadra CLI v0.1.3 — Ingénierie formelle KSL

Usage:
  yadra <commande> [options]

CLI — Transversal:
  version      Affiche la version CLI (yadra/manifest.mf) et le projet actif
  help         Aide globale ou yadra <commande> -h
  configure    Profils LLM et credentials (~/.config/yadra/)
  project      Enregistre et active les projets (KSL + code)
  doctor       Diagnostic environnement

Timeline 1 (T1):
  formalize    Si KSL absent : infos A/B ; si présent : validate + seal
  validate     Validation KSL L0–L3
  seal         Scellement T1 (.yadra/sealed/)

Timeline 2 (T2):
  plan         Plan de compilation depuis une spec (.spec.ksl) — T2 · A
  execute      Matérialisation sous PROJECT_HOME — T2 · B
  gate         Conformance Gate — T2 · C
  make         Une commande : T1 (formalize) → T2 (execute + gate)
  strategies   Catalogue interne des noms strategy (list / show)

Exécutez "yadra <commande> -h" pour le détail.
```

### Aide spécifique à une commande

```bash
yadra project -h
```

`yadra project -h` décrit toutes les sous-commandes (`list`, `add`, `update`, `set-profile`, `use`, …), les options, les surcharges `--project` / variables d’environnement et un **exemple de flux multi-projets**.

Documentation complète : page [`yadra project`](/docs/project/). Chemin quotidien : [`yadra make`](/docs/make/). Timeline 2 : [`yadra plan`](/docs/plan/), [`yadra execute`](/docs/execute/), [`yadra strategies`](/docs/strategies/).

## Comportement des codes de sortie

| Situation | Code de sortie | Comportement |
|-----------|----------------|--------------|
| `yadra help` ou `yadra <cmd> -h` | `0` | Affiche l'aide demandée sur la sortie standard. |
| `yadra` (aucun argument) | `2` | Affiche le résumé des commandes et indique comment obtenir de l'aide. |
| Option ou commande inconnue | `2` | Signale l'argument invalide et renvoie vers `yadra <cmd> -h`. |
