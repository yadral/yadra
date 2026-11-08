---
name: formalize-livrer-ksl
description: >-
  T1 · C · LIVRER — vérifier les KSL produits par B (validate) et sceller le contrat
  (yadra seal). Oracles CLI validate/seal ; pas d’appel LLM obligatoire en MVP seal. Utiliser après PRODUIRE (B).
disable-model-invocation: true
---

# SKILL · formalize · C · LIVRER

Plan source : [`t1-livrer-ksl.plan.md`](../../../prompts/plan-validate/yadra-t1/t1-livrer-ksl.plan.md).

**C ne modifie pas les `.ksl`.** En cas d’échec → retour **B · PRODUIRE**.

## Prérequis

1. Fichiers B écrits sous **`KSL_PROJECT_HOME`** aux `output_paths` (lire `# deliverables` du compact ou `feature.yadra.md`).
2. **`# questions-resolues`** fermé (aucune question ouverte).
3. Contexte CLI : `KSL_PROJECT_HOME` via **`yadra project use`** (ou `--ksl-project-home`).

```bash
export KSL_HOME="${KSL_HOME:-$YADRA_PROJECT_HOME/ksl}"
yadra project add … --ksl-project-home /chemin/vers/KSL_PROJECT_HOME
yadra project use …
eval "$(yadra project export)"
```

Binaire : `yadra` sur PATH ou `node "$KSL_HOME/tools/yadra/bin/yadra.mjs"`.

## Fichiers à vérifier

Déduire la liste depuis `ksl_levels` + `output_paths` :

| Niveau | Fichier typique |
|--------|-----------------|
| `root` | `output_paths.root` |
| `module` | `output_paths.module` |
| `spec` | `output_paths.spec` |

Pour une spec, **toujours** valider aussi le **`{domain}.module.ksl`** sibling (L2).

## Étape 1 — Validation (obligatoire)

Sur **chaque** fichier `.ksl` du run :

```bash
yadra validate "$FICHIER" --layout --semantic
```

Option CI stricte :

```bash
yadra validate "$FICHIER" --layout --semantic --syntax
```

Tous les validate **exit 0** avant de sceller.

## Étape 2 — Scellement

```bash
yadra seal "$KSL_PROJECT_HOME/<output_paths.spec|module|root>"
```

Fichiers **project** co-émis (greenfield) :

```bash
yadra seal "$SPEC" --include "$KSL_PROJECT_HOME/<output_paths.root>"
```

**Produit :** `KSL_PROJECT_HOME/.yadra/sealed/<spec-id>.json`

## Étape 3 — Preuve T2 (optionnelle)

```bash
yadra execute "$SPEC" --dry-run
yadra execute "$SPEC"    # sans --allow-unsealed si seal OK
```

## Checklist « C terminé »

- [ ] Tous les `output_paths` du run existent.
- [ ] `yadra validate --layout --semantic` OK sur module + spec (+ project si applicable).
- [ ] `yadra seal` exit 0.
- [ ] `.yadra/sealed/<spec-id>.json` présent.

## Références

- B : [`partie-b-produire/SKILL.md`](../partie-b-produire/SKILL.md)
- CLI : [`docs/yadra-cli.md`](../../../docs/yadra-cli.md)
