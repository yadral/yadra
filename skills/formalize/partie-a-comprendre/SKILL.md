---
name: formalize-comprendre-intention
description: >-
  T1 · A · COMPRENDRE — Doc First + KSL context → .compact.ksl incluant ## strategies
  résolues (catalogue + nature de la feature). Utiliser avant PRODUIRE (B).
disable-model-invocation: false
---

# SKILL · formalize · A · COMPRENDRE

Plan source : [`t1-comprendre-intention.plan.md`](../../../prompts/plan-validate/yadra-t1/t1-comprendre-intention.plan.md) (v6).

## Racines

| Variable | Usage A |
|----------|---------|
| **`KSL_PROJECT_HOME`** | Lire KSL voisin ; écrire **uniquement** `.yadra/tmp/<run-id>/*.compact.ksl`. |
| **`PROJECT_HOME`** | Citer dans `## intention` / strategies si kind `code` prévu. |
| **`YADRA_PROJECT_HOME`** | Charger [`yadra/strategies/catalog.yaml`](../../../strategies/catalog.yaml). |

## Produit

Un **`.compact.ksl`** complet avec `# deliverables`, sections `# .spec.ksl` (intention, scope, usecases, data, outputs, **strategies**), `# questions-resolues` fermé ou vide.

## Résolution strategies (responsabilité A)

**B ne déduit pas** — tu remplis **`## strategies`** avant de fermer le compact.

1. Lire nature : Doc First, `## intention`, `## scope`, `## outputs`, `## data`, `## usecases`.
2. Charger **catalog.yaml** ; appliquer matrice `when` (plan A § Résolution).
3. Questions utilisateur si flou ou contradiction (Hexagonal, async variant, etc.).
4. Écrire chaque entrée :

   ```text
   strategy "Hexagonal" (role architecture)
     description : … module, couches, PROJECT_HOME …
   ```

5. Règles :
   - `outputs` contient **code** → une strategy **architecture** : **Hexagonal** s'il y a un adapter HTTP entrant (OpenAPI, callback provider, admin, job interne) ; **Hexagonal-Service** si l'appelant est un service du même processus et qu'aucun controller n'est dans le scope. Ne pas émettre les deux.
   - API/DTO/mapping/graphql → **`Populator/Converter`** (un seul nom).
   - **tests** / usecases → **FluentCaseTest** si pertinent.
   - Pas `(vide — …)` sur strategies si kinds lourds sans question utilisateur.

Traçabilité optionnelle : `# yadra:strategies resolved=N …` en tête de `## strategies`.

## Workflow

**CLI (0.1.4+)** : si les `.ksl` manquent, `yadra formalize <dossier>` appelle le **modèle** (`yadra configure` / `yadra project --model`) avec ce SKILL + **catalog.yaml** + suggestions `when` → écrit `KSL_PROJECT_HOME/.yadra/tmp/<run-id>/feature.compact.ksl`. Option `--skip-llm` = instructions manuelles seulement.

1. Lire `feature.yadra.md` + dossier + KSL sous `KSL_PROJECT_HOME`.
2. Rédiger `# deliverables` (`ksl_levels`, `output_paths`).
3. Remplir sections spec (famille 1) + **résolution strategies**.
4. Vérifier `# questions-resolues` — rien d’ouvert si compact « final » pour B.

## Références

- Catalogue : [`yadra/strategies/README.md`](../../../strategies/README.md)
- Plan B (matérialisation seulement) : [`t1-produire-ksl.plan.md`](../../../prompts/plan-validate/yadra-t1/t1-produire-ksl.plan.md)
