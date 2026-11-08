---
title: formalize
description: T1 — yadra formalize (A → B → C en une commande).
---

**Timeline 1** : une seule commande enchaîne **A · COMPRENDRE → B · PRODUIRE → C · LIVRER** lorsque les livrables KSL manquent, puis **validate + seal** lorsqu’ils sont présents.

## Synopsis

```bash
yadra formalize <dossier-documents> [options]
```

**Prérequis :** `yadra project use <name>` avec **`KSL_PROJECT_HOME`** ; LLM **`yadra configure`** + credentials (sauf **`--skip-llm`** sur la branche A/B).

**Entrée obligatoire :** `<dossier-documents>/feature.yadra.md` avec **au moins un** `output_paths` : **`spec`**, **`module`** ou **`root`** (selon le livrable — pas besoin de dupliquer les trois).

## Comportement (CLI packagé — T1 terminé)

| Étape | Condition | Action |
|-------|-----------|--------|
| **A + B** | Fichiers `.ksl` attendus (`output_paths` sous `KSL_PROJECT_HOME`) **absents** | LLM + SKILLS **formalize A/B** → écriture aux `output_paths` ; tmp `.yadra/tmp/<run-id>/` pour le compact. |
| **A + B (CI)** | Idem + **`--skip-llm`** | Affiche plans/SKILLS/LLM ; **n’écrit pas** ; code sortie `1`. |
| **C** | Tous les fichiers attendus **présents** (y compris après A+B) | **validate** L0+L2+L3 (+ L1 si `--syntax`) puis **`seal`** (sauf `--no-seal`). |

Pas de sous-commandes `formalize:a` / `formalize:b` : tout passe par **`yadra formalize`**. Équivalent C seul sur une spec déjà écrite : **`yadra validate`** + **`yadra seal`**.

## Options

| Option | Effet |
|--------|--------|
| `--seal` / `--no-seal` | Scellement après validation (défaut : seal). |
| `--syntax` | L1 dans validate/seal. |
| `--include <paths>` | Fichiers `.ksl` extra pour `seal`. |
| `--skip-llm` | Branche A/B : orchestration seulement (pas de génération KSL). |
| `--ksl-project-home`, `--project-home`, `--yadra-project-home`, `--model`, `--profile` | Surcharges one-shot. |

## Exemple

```bash
yadra project use mon-projet
yadra formalize ./contexte/member-creation/          # A→B→C si besoin
yadra formalize ./contexte/member-creation/ --no-seal   # re-validation seule
```

Plans : `yadra-t1-comprendre-intention`, `yadra-t1-produire-ksl`, `yadra-t1-livrer-ksl`. SKILLS : `formalize/partie-a-comprendre`, `partie-b-produire`, `partie-c-livrer`.
