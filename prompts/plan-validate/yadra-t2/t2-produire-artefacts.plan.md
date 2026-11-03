---
id: t2-produire-artefacts
title: T2 · B · PRODUIRE — matérialiser les artefacts liés à la spec
status: validated
version: 5
aspect: yadra-t2
created: 2026-10-26
updated: 2026-10-28
validated_at: 2026-10-28
source_plan: plan/yadra/v1/yadra-t2-produire-artefacts.plan.md
validated_by: human
authors: []
---

# Objectif

**T2 · B · PRODUIRE** (commande **`yadra execute`**) : matérialise les kinds
**`outputs.phase.execute`**, exécute la **boucle qualité** (sandbox Gradle +
**repair**, `budget.max_repair_loops`) et écrit sous `PROJECT_HOME`. La triade
produit est **COMPRENDRE → PRODUIRE → LIVRER** ; **C · LIVRER** = **`yadra gate`**
(voir [`yadra-t2-livrer-gate.plan.md`](yadra-t2-livrer-gate.plan.md)).

- Entrée normative : `*.spec.ksl` scellé sous `KSL_PROJECT_HOME`.
- Routing KSL : `outputs.phase { execute gate }` (défaut execute =
  code/data/tests, gate = docs/e2e si absents).
- A · COMPRENDRE : embarqué en mémoire au début de `execute` (+ `yadra plan` preview).
- Sortie B : fichiers sous `PROJECT_HOME` + stdout ; pas de reçu JSON ni bundle.
- Chemins code/tests/data : project `repo` + strategies (pas dans `outputs`).

# LLM — génération du code (contrat central)

**T2 · B · PRODUIRE** s’appuie **obligatoirement** (hors `--dry-run --skip-llm`) sur le **LLM configuré par l’utilisateur** :

| Entrée | Rôle |
|--------|------|
| **`yadra configure`** + **credentials** | Provider, modèle, profil (`yadra project set-profile` si besoin). |
| **Spec KSL scellée** | Contrat métier, use cases, `outputs`, `data`, contraintes. |
| **Plan déterministe** | Kinds `phase.execute`, strategies **résolues** (ordre catalogue), bindings (`basePackage`, stack). |
| **`yadra/strategies/*.strategy.ksl`** | Squelettes actifs — un pass LLM **par strategy** du plan. |
| **SKILL B** | `execute/partie-b-produire` + **`yadra-t2-produire-artefacts`** (ce plan). |
| **Spécialisation T2 · A** | Court appel LLM en mémoire au début de `execute` (même esprit que `yadra plan`). |

Le modèle **génère le code** (et tests/data execute) sous **`PROJECT_HOME`** via blocs `--- FILE: ---`. Langage et build = **`stack`** du **`root.project.ksl`** / service (ex. Kotlin, Gradle). **Aucun** moteur parallèle : le CLI orchestre plan + SKILLS + appels LLM.

# Préconditions

1. `yadra validate --semantic` réussit sur la spec.
2. Le seal T1 `.yadra/sealed/<spec-id>.json` existe et son digest de spec est
   encore valide. `--allow-unsealed` ne sert qu'au développement local.
3. `PROJECT_HOME` configuré (`yadra project`) — répertoire cible (peut être vide).
4. **LLM** configuré (`yadra configure` + credentials) sauf `--dry-run --skip-llm`.
5. Tous les noms de strategy sont résolus par le catalogue.
6. Les `--kinds`, s'ils sont fournis, appartiennent à `outputs.kinds` et le
   kind `ksl` est exclu.

Un échec de précondition arrête B avant toute écriture.

# Sorties utilisateur (contrat minimal)

| Sortie | Où |
|--------|-----|
| **Console** | Plan, progression, liste des fichiers, erreurs |
| **Code / tests** | `PROJECT_HOME` uniquement |

Pas de reçu JSON, pas de cache `.yadra/compile-plans/` : plan, bindings et manifest sont **recalculés en mémoire** ; la spécialisation T2 · A est produite **en mémoire** au début de `yadra execute` (appel LLM court). `yadra plan` reste un **aperçu** stdout sans écriture disque.

# Production

L'agent reçoit **un pass par strategy** (ordre du plan) :

- bindings résolus (non négociables) ;
- spécialisation T2 · A (mémoire, même contenu que `yadra plan` LLM) ;
- la spec KSL complète ;
- **un seul** squelette actif par appel ;
- liste **fermée** de chemins `FILE` pour ce pass (manifest) ;
- fichiers déjà produits des passes précédents ;
- le SKILL B et ce contrat.

Il spécialise les rôles et placeholders depuis la spec. Il respecte l'union des
`generation.required`, tous les `generation.forbidden`, le langage et le stack
du projet. Les exemples Java sont illustratifs ; ils ne forcent Java que si le
projet utilise Java.

La réponse utilise exclusivement :

```text
--- FILE: <chemin relatif à PROJECT_HOME> ---
<contenu complet>
```

Chaque chemin est relatif, normalisé et doit rester sous `PROJECT_HOME`.
`.git/`, `.yadra/` et les chemins absolus sont interdits. Les fichiers sont
écrits atomiquement. Une nouvelle exécution rematérialise la projection et peut
remplacer un fichier applicatif déjà produit ; Git reste le mécanisme d'annulation.

# Kinds

| Kind | Contrat B |
|------|-----------|
| `code` | Implémentation de la spec et participants requis/optionnels des squelettes. |
| `tests` | Tests dérivés des use cases, contraintes et assertions des squelettes. |
| `data` | Artefacts déclaratifs nécessaires aux cibles du bloc `data`. |
| `docs` | **Gate** — documentation / swagger (bloc `docs { }`). |
| `e2e` | **Gate** — scénarios E2E (bloc `e2e { }`). |

Execute ne traite que **`phase.execute`**. B n'invente ni kind, ni strategy, ni participant hors `required` / `optional`.

# CLI — `yadra execute`

```bash
yadra execute [SPEC.spec.ksl | .] [--kinds a,b] [--dry-run] [--no-verify]
              [--allow-unsealed] [--skip-llm] [options projet]
```

| Flag | Rôle |
|------|------|
| `--kinds a,b` | Sous-ensemble de **`outputs.phase.execute`** uniquement. |
| `--dry-run` | Préconditions, phase, manifest ; aucune écriture. |
| `--no-verify` | PRODUIRE sans sandbox Gradle / repair. |
| `--allow-unsealed` | Développement local uniquement ; ignore seal absent/périmé. |
| `--skip-llm` | Autorisé avec `--dry-run` seulement. |

Après PRODUIRE : **`gradle test`** sous `PROJECT_HOME` (MVP) ; échec → repair LLM borné par `budget.max_repair_loops`.

# Exécution du SKILL runtime

| Élément | Valeur |
|---------|--------|
| **Registre** | `skills.execute.produire` → `execute/partie-b-produire/SKILL.md` |
| **Binding CLI** | `execute:B` dans `command-context.mjs` |
| **Commande** | `yadra execute` |
| **Plan chargé** | `plan-validate/yadra-t2/` ou ce draft v1 |
| **LLM** | **Oui** — modèle utilisateur via `yadra configure` ; `--dry-run --skip-llm` = plan/manifest seulement |
| **Fichiers agent** | `SKILL.md` + `system.prompt.md` |

# Critères de validation

- [ ] `yadra execute --dry-run` n'écrit rien et affiche le même ordre que A.
- [ ] Une spec non valide, non scellée/périmée ou une strategy inconnue arrête B.
- [ ] Aucun chemin de réponse LLM ne peut sortir de `PROJECT_HOME`.
- [ ] Aucun artefact `.yadra` écrit sous `PROJECT_HOME` ni cache compile-plan sous `KSL_PROJECT_HOME`.
- [ ] Le CLI packagé contient le plan, le SKILL et les squelettes.
