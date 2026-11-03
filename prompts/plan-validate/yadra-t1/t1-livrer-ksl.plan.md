---
id: t1-livrer-ksl
title: T1 · C · LIVRER — vérifier et sceller
status: validated
version: 2
aspect: yadra-t1
created: 2026-10-23
updated: 2026-10-28
validated_at: 2026-10-28
source_plan: plan/yadra/v1/yadra-t1-livrer-ksl.plan.md
validated_by: human
authors: []
---

# Objectif

**Mode plan** — comportement **C · LIVRER** dans **`yadra formalize`** (T1) : orchestration **SKILL C** + **oracles CLI** (`validate`, digest **`seal`**) ; pas d’appel LLM obligatoire dans `yadra seal`, mais la phase n’est pas « 100 % sans IA · hermétique » au sens diagramme historique.

- **Pas** de sous-commande CLI `comprendre` / `produire` : C est interne ; **`yadra seal`** = entrée explicite MVP.
- **Entrée** : fichiers `.ksl` aux `output_paths` (post-B) ; optionnellement le `.compact.ksl` du run pour traçabilité (hors digest obligatoire).
- **Sortie** : `KSL_PROJECT_HOME/.yadra/sealed/<spec-id>.json` — **non** écrit dans le surface KSL.
- **Échec** → retour **B** (pas A sauf ambiguïté métier).

Prérequis : plan B — [`yadra-t1-produire-ksl.plan.md`](yadra-t1-produire-ksl.plan.md).

# T1 · LIVRER vs T2 · LIVRER (Gate)

| | **T1 · C · LIVRER** | **T2 · C · LIVRER** |
|---|---------------------|---------------------|
| Rôle | Vérificateur + **seal** KSL | Conformance Gate · kinds `phase.gate` |
| IA | **Non** (oracles CLI) | **`--produce` opt.** + oracle verdict |
| CLI | `validate`, **`seal`** | **`yadra gate`** |
| Artefact | `.yadra/sealed/` | `.yadra/bundles/` |

La boucle sandbox/repair T2 vit dans **B · PRODUIRE** (`yadra execute`), pas dans C.

# Vérifications (ordre)

| # | Check | Commande / règle |
|---|--------|-------------------|
| 1 | Fichiers B présents | Tous les `ksl_levels` × `output_paths` existent sous **`KSL_PROJECT_HOME`**. |
| 2 | L0 + L2 + L3 | `yadra validate <fichier> --layout --semantic` sur **chaque** `.ksl` du run (module, spec, project si émis). |
| 3 | L1 (option) | `--syntax` quand L1 EBNF mûr ; recommandé en CI stricte. |
| 4 | Cohérence run | Spec référencée dans `specs = [...]` du module ; pas de `# questions-resolues` ouvert dans le compact du run. |
| 5 | Scellement | `yadra seal <spec.spec.ksl> [--include autres.ksl]` après validate OK. |

# Scellement (MVP)

Fichier : `.yadra/sealed/<spec-id>.json`

| Champ | Rôle |
|-------|------|
| `timeline` | `"T1"` |
| `phase` | `"C"` |
| `specId` | id de la spec |
| `kslProjectHome` | Racine projet (contexte) |
| `files[]` | `{ path relative, sha256 }` — spec + module sibling + `--include` |
| `validator` | versions CLI / grammar / niveaux exécutés |
| `sealedAt` | ISO-8601 |

**Idempotence** : re-seal écrase le JSON ; digest change si contenu change.

# Exécution du SKILL runtime

| Élément | Valeur |
|---------|--------|
| **Registre** | `skills.formalize.livrer` → [`formalize/partie-c-livrer/SKILL.md`](../../../../yadra/skills/formalize/partie-c-livrer/SKILL.md) |
| **Binding CLI** | `formalize:C` et **`seal`** — [`command-context.mjs`](../../../../yadra/cli/src/runtime/command-context.mjs) |
| **Commandes** | `yadra validate …` puis **`yadra seal <spec.spec.ksl>`** ; branche validate/seal de **`yadra formalize`** si `.ksl` déjà présents |
| **Plan chargé** | `plan-validate/yadra-t1/t1-livrer-ksl.plan.md` ou **ce draft** |
| **LLM** | **Non** (`usesLlm: false`, `disable-model-invocation: true`) |
| **Fichiers agent** | `SKILL.md` ; `system.prompt.md` = ancre, pas de chat créatif |

## Comportement attendu (agent / humain)

1. Vérifier présence des fichiers aux **`output_paths`** (post-B).
2. Exécuter **`yadra validate --layout --semantic`** (option **`--syntax`**) sur **chaque** `.ksl` du run.
3. Si échec → retour **B** ; **ne pas** patcher le KSL en C sauf correction trivialement mécanique explicitée par validate.
4. Si OK → **`yadra seal`** ; confirmer `.yadra/sealed/<spec-id>.json`.
5. **Ne pas** régénérer intention ni strategies (rôle **A**).

## Interdit en C (SKILL)

- Appeler le LLM pour réécrire la spec.
- Sceller sans validate OK sur tous les fichiers du run.

# Critères « C terminé »

- [ ] Validate OK sur tous les fichiers du run.
- [ ] `yadra seal` exit 0 ; JSON présent.
- [ ] `yadra execute <spec>` **sans** `--allow-unsealed` accepté (preuve T2).

# Périmètre

- **Inclus** : checks L0–L3, seal MVP, SKILL C, lien B→C.
- **Exclus** : index graphe projet complet, parser EBNF strict seul, T2 execute réel.

# Prochaines étapes

1. Valider plan avec A/B en fin de cycle.
2. Brancher C en fin de `yadra formalize`.
3. Promotion `plan-validate/` + CI seal.
