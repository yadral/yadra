---
name: execute-comprendre-contrat
description: >-
  T2 · A · COMPRENDRE — spec KSL scellée, plan de compilation, résolution des
  *.strategy.ksl du catalogue (sans fichier .code.ksl). yadra plan.
disable-model-invocation: false
---

# SKILL · execute · A · COMPRENDRE (T2)

Plan source : [`t2-comprendre-contrat.plan.md`](../../../prompts/plan-validate/yadra-t2/t2-comprendre-contrat.plan.md) (v5).

CLI : **`yadra plan`**. **LLM** via `yadra configure` + plan validate (fallback draft v1).

**Pas** de Doc First. **Pas** de fichier **`.code.ksl`**.

## Racines

| Variable | Usage A |
|----------|---------|
| **`KSL_PROJECT_HOME`** | Spec scellée, module, seal. |
| **`PROJECT_HOME`** | Cible future B — citer layout/stack dans le plan. |
| **`YADRA_PROJECT_HOME`** | [`catalog.yaml`](../../../strategies/catalog.yaml), [`strategies/ksl/*.strategy.ksl`](../../../strategies/ksl/README.md). |

## Produit

La CLI produit d’abord un plan déterministe :

- module, kinds, data et budget ;
- chaque strategy avec nom canonique, rôle et chemin `skeleton` ;
- ordre architecture → patterns → testing → principes ;
- questions pour les noms non résolus.

L’agent ajoute ensuite **au maximum 20 lignes**, sans répéter ces éléments :

- placeholders spécialisés ;
- mapping use cases → rôles ;
- `required` / `forbidden` pertinents ;
- questions réellement bloquantes.

## Workflow A

1. Lire la spec, le plan déterministe et les squelettes actifs fournis.
2. Relier intention/usecases aux rôles des squelettes.
3. Ne signaler que les ambiguïtés qui empêchent la production.
4. Ne produire ni code, ni `.code.ksl`, ni description de B/C/Gate.

## Références

- [`docs/ksl/reference/strategies.md`](../../../docs/ksl/reference/strategies.md)
- CLI : `yadra strategies list|show`
