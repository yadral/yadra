---
name: execute-produire-artefacts
description: >-
  T2 · B · PRODUIRE — le LLM utilisateur (yadra configure) génère le code sous
  PROJECT_HOME à partir de la spec KSL scellée, du plan T2, des strategy.ksl et
  de ce SKILL. Commande yadra execute.
disable-model-invocation: false
---

# SKILL · execute · B · PRODUIRE (T2)

Plan source :
[`t2-produire-artefacts.plan.md`](../../../prompts/plan-validate/yadra-t2/t2-produire-artefacts.plan.md)
(v5).

CLI : **`yadra execute`**.

## LLM (obligatoire en production)

- Provider, modèle et credentials : **`yadra configure`** (+ profil `yadra project` si besoin).
- Le **CLI** enchaîne : plan déterministe → spécialisation T2 · A (LLM court) → **un appel LLM par strategy** du plan avec ce SKILL + squelette actif.
- **`--dry-run --skip-llm`** : aucune génération — aperçu plan/manifest uniquement.

## Entrées de génération

| Entrée | Source |
|--------|--------|
| Spec | `*.spec.ksl` scellée sous `KSL_PROJECT_HOME` |
| Plan | Kinds `outputs.phase.execute`, strategies résolues, bindings, manifest fichiers |
| Squelettes | `yadra/strategies/<skeleton>` du catalogue pour chaque strategy |
| Stack / langage | `root.project.ksl` + `*.project.ksl` service (`stack { runtime build … }`) |
| Contrat | Plan **`yadra-t2-produire-artefacts`** + ce SKILL |

## Racines

| Variable | Usage B |
|----------|---------|
| **`KSL_PROJECT_HOME`** | Lire la spec et le seal T1 ; ne pas modifier. |
| **`PROJECT_HOME`** | Racine exclusive des artefacts produits (`yadra project`). |
| **`YADRA_PROJECT_HOME`** | Catalogue, plans, squelettes ; lecture seule. |

## Préconditions

- validation sémantique réussie ;
- seal T1 présent et frais, sauf `--allow-unsealed` local ;
- plan sans strategy inconnue ;
- kinds demandés ⊆ `outputs.phase.execute` ;
- `PROJECT_HOME` configuré — répertoire cible (peut être vide) ;
- **LLM configuré** (sauf dry-run skip-llm).

## Workflow

1. Lire le plan déterministe et la spec scellée.
2. Pour chaque strategy du plan : charger le squelette, produire les chemins du manifest pour ce pass.
3. Spécialiser depuis use cases, data, contraintes et **stack KSL**.
4. Répondre uniquement par blocs `--- FILE: <chemin relatif à PROJECT_HOME> ---`.

## Obligations

- Respecter tous les `required` et `forbidden` des squelettes.
- Langage et extensions cohérents avec `stack.runtime` (ex. `.kt` si Kotlin).
- Contenu complet et cohérent avec la spec.
- Tests dérivés de la spec et des assertions des squelettes.

## Interdits

- Aucun `.code.ksl` ; aucune nouvelle strategy non listée dans la spec.
- Aucun chemin absolu, `..`, `.git/` ou `.yadra/`.
- Aucun fichier hors `PROJECT_HOME`.
- Ne pas modifier KSL, catalogue ou squelettes sur disque.

## Format de réponse

```text
--- FILE: src/main/kotlin/.../Example.kt ---
<contenu>
```

Pas de commentaire hors blocs fichier.
