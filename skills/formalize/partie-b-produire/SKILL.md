---
name: formalize-produire-ksl
description: >-
  T1 · B · PRODUIRE — convertir un .compact.ksl (strategies déjà résolues en A) en KSL
  syntaxique sous KSL_PROJECT_HOME, puis yadra validate.
disable-model-invocation: false
---

# SKILL · formalize · B · PRODUIRE

Plan source : [`t1-produire-ksl.plan.md`](../../../prompts/plan-validate/yadra-t1/t1-produire-ksl.plan.md) (v7).

## Racines

| Variable | Usage B |
|----------|---------|
| **`KSL_PROJECT_HOME`** | Écrire `join(KSL_PROJECT_HOME, output_paths.*)`. |
| **`PROJECT_HOME`** | Enrichir `description` des strategies / intention si kind `code`. |
| **`YADRA_PROJECT_HOME`** | Grammaire, exemples — **pas** de déduction strategies ici. |

## Préconditions (stop si échec)

1. **`.compact.ksl`** avec `# deliverables`.
2. **`# questions-resolues`** fermé.
3. **`## strategies`** présent et **non vide** si `## outputs` contient `code` (sinon stop — renvoi **A**).
4. **`KSL_PROJECT_HOME`** connu.

## Workflow

1. Lire `# deliverables` → niveaux à émettre.
2. Lire sections compact (`# .spec.ksl`, …).
3. **Matérialiser `strategies`** : transcrire **`## strategies`** → bloc KSL ; enrichir `description` (chemins) **sans ajouter** de nouvelles strategies.
4. Émettre KSL 1.0 conforme EBNF ; écrire `output_paths`.
5. `yadra validate --layout --semantic` sur chaque fichier.

## Strategies (B)

- **Pas** de lecture de `catalog.yaml` pour compléter la liste.
- Déduction = **A** ([`partie-a-comprendre`](../partie-a-comprendre/SKILL.md)).
- Si compact incomplet sur strategies → **ne pas écrire** les `.ksl`.

```ksl
strategies {
  strategy "Validator" {
    role = "pattern"
    description = """
    … (compact + chemins KSL_PROJECT_HOME / PROJECT_HOME) …
    """
  }
}
```

## Mapping spec (famille 1)

| Bloc KSL | Source |
|----------|--------|
| `intention`, `scope`, `usecases`, `data`, `outputs`, `budget` | sections compact |
| `strategies { … }` | **`## strategies`** compact uniquement |

## Critères « B terminé »

Validate OK ; strategies = compact A (enrichies, pas déduites).

## Références

- Plan A résolution : [`t1-comprendre-intention.plan.md`](../../../prompts/plan-validate/yadra-t1/t1-comprendre-intention.plan.md#résolution-des-strategies-a)
- Exemple : `ksl/examples/minimal/.../cart-management.spec.ksl`
