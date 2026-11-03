---
title: plan
description: Timeline 2 · A · COMPRENDRE — plan de compilation depuis une spécification KSL (dry-run).
---

La commande `yadra plan` est l’entrée **Timeline 2** du CLI (v0.1.2). Elle lit une **`.spec.ksl` déjà écrite**, en extrait kinds, strategies, cibles data et budget, et affiche les étapes T2 **sans générer d’artefacts**.

Ce n’est **pas** T1 · A (`formalize` + Doc First) ni T1 · C (`validate` + `seal`).

## Synopsis

```bash
yadra plan [SPEC.spec.ksl | .] [options]
```

> **Description :** Dry-run T2 · A · COMPRENDRE. Résout une spec (fichier ou unique `.spec.ksl` dans le répertoire), parse les métadonnées (regex MVP) et imprime un plan de compilation.

## Options

| Option | Description |
|--------|-------------|
| `--format human\|json` | Format de sortie (`human` par défaut). |
| `--kinds a,b` | Sous-ensemble de `outputs.kinds`. |
| `--project <name>` | Projet enregistré (one-shot), comme `validate` / `seal`. |
| `--ksl-project-home`, `--project-home` | Surcharge des racines. |
| `-h`, `--help` | Aide (`yadra plan -h`). |

## Prérequis

1. Projet actif : `yadra project use <name>` (ou `--ksl-project-home`).
2. Spec **validée** : `yadra validate --semantic path/to/foo.spec.ksl` (recommandé — `plan` ne l’exige pas).
3. Spec **scellée** : `yadra seal …` recommandé avant une vraie T2 ; `plan` n’exige pas le manifeste.

**Aucun** dossier `feature.yadra.md` n’est lu.

## Exemples

### Sortie lisible

```bash
yadra plan ksl/services/order-service/modules/checkout/order-checkout.spec.ksl
```

```text
Plan for spec "order-checkout"
  module: checkout
  architecture: …
  patterns: …
  testing: …
  delivery kinds: code, …
  data targets: postgres, …
  budget: {"max_repair_loops":5,…}

T2 steps (dry-run):
  A · COMPRENDRE — parse spec, resolve SKILLS from strategies/stack
  B · PRODUIRE — `yadra execute` (kinds execute · code + sandbox Gradle + repair)
  C · LIVRER — `yadra gate` (docs / e2e · 0.1.8+)
  D · Orchestration — manifest + evidence sealing
  Gate — KSL × artifacts ⟹ SATISFIED | VIOLATED | UNDECIDABLE
```

### JSON (scripts / CI)

```bash
yadra plan order-checkout.spec.ksl --format json
```

```json
{
  "spec": "order-checkout",
  "module": "checkout",
  "kinds": ["code"],
  "dataTargets": ["postgres"],
  "budget": { "max_repair_loops": 5, "max_iterations": 8 }
}
```

## Rôle pour le développement

| Usage | Comment |
|-------|---------|
| Après T1 | Vérifier que la spec **dit** bien kinds / budget / strategies avant d’ouvrir les agents T2 · B. |
| CI | `--format json` pour décider quels jobs lancer. |
| Pas encore | Écriture dans `PROJECT_HOME`, résolution réelle des SKILLS, DAG persisté — voir le plan `yadra-t2-comprendre-contrat`. |

Plan source : `prompts/plan-validate/yadra-t2/t2-comprendre-contrat.plan.md`. SKILL stub : `yadra/skills/execute/partie-a-comprendre/`.
