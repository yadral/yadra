---
name: execute-livrer-gate
description: >-
  T2 · C · LIVRER — kinds phase.gate (docs, e2e), Conformance Gate et
  matérialisation optionnelle sous PROJECT_HOME. yadra gate.
disable-model-invocation: false
---

# SKILL · execute · C · LIVRER (T2)

Plan source :
[`t2-livrer-gate.plan.md`](../../../prompts/plan-validate/yadra-t2/t2-livrer-gate.plan.md).

CLI : **`yadra gate`**. **`--produce`** = LLM (docs/e2e). Le **verdict** Conformance Gate = **oracle CLI** (sans LLM), découplé du producteur.

## Racines

| Variable | Usage C |
|----------|---------|
| **`KSL_PROJECT_HOME`** | Spec, seal T1, `.yadra/bundles/` |
| **`PROJECT_HOME`** | Docs / e2e produits ; preuve execute B |
| **`YADRA_PROJECT_HOME`** | Plan et SKILL ; lecture seule |

## Workflow (`--produce`)

1. Lire la spec (blocs `outputs.docs`, `outputs.e2e`, scénarios).
2. Écrire sous les chemins `docs` / `e2e` du **project.ksl** service.
3. Ne pas régénérer le code hexagonal (déjà produit par `yadra execute`).
4. Répondre uniquement par blocs `--- FILE: <relatif PROJECT_HOME> ---`.

## Conformance (runtime CLI)

Le CLI vérifie manifest + présence de fichiers gate ; l’agent n’invente pas le verdict `SATISFIED`.
