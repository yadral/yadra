---
id: t1-produire-ksl
title: T1 · B · PRODUIRE — KSL syntaxe scellable
status: validated
version: 7
aspect: yadra-t1
created: 2026-10-17
updated: 2026-10-28
validated_at: 2026-10-28
source_plan: plan/yadra/v1/yadra-t1-produire-ksl.plan.md
validated_by: human
authors: []
---

# Objectif

**Mode plan** — comportement **B · PRODUIRE** dans **`yadra formalize`** (CLI packagé : LLM utilisateur + SKILL B in-process).

- **Pas** de sous-commande `produire` : B est une étape de **`yadra formalize`** ; **contrat = ce plan** + SKILL **`formalize/partie-b-produire`**.
- **Entrée formalisation** (run complet) : dossier avec **`feature.yadra.md`** — aligné plan A ; **`.compact.ksl`** = entrée directe de B (même run, sous `.yadra/tmp/<run-id>/`).
- **Sortie B** : fichiers **KSL syntaxiques** conformes **grammaire** ([`ksl.ebnf`](../../../ksl/grammar/ksl.ebnf) + spec) — **génération normative** (compact → KSL valide).
- **T1 produit toujours une nouvelle proposition KSL** ; **commit / PR Git** = **utilisateur**.
- Enchaînement : **A → B → C** (validate T1) dans la même commande `formalize` ; détail **C** : plan séparé ou extension ultérieure — ici **critères minimum** pour que B soit « terminé ».

Prérequis : plan A validé ou aligné — [`yadra-t1-comprendre-intention.plan.md`](yadra-t1-comprendre-intention.plan.md).

Doc renvoi : [`docs/ksl-language-spec.md`](../../../docs/ksl-language-spec.md) · [`docs/yadra-ksl-processing.md`](../../../docs/yadra-ksl-processing.md) · [`docs/yadra-cli.md`](../../../docs/yadra-cli.md) · [`yadra-project-roots.md`](../cli/yadra-project-roots.md).

# Ancrage disque — trois racines

Contrat : [`yadra-project-roots.md`](../cli/yadra-project-roots.md) — **`yadra project`**.

| Variable | Rôle pour **B** |
|----------|-----------------|
| **`KSL_HOME`** | Paquet CLI / API Yadral (grammaire) — **B n’y écrit pas** les specs métier. |
| **`KSL_PROJECT_HOME`** | Monorepo **specs KSL** (`yadra project`) — **B écrit ici** : `join(KSL_PROJECT_HOME, output_paths.*)`. |
| **`PROJECT_HOME`** | Dépôt **code généré depuis les KSL** (T2) — **peut ≠ `KSL_PROJECT_HOME`**. |

- **`output_paths`** dans `feature.yadra.md` / `# deliverables` : toujours **relatifs à `KSL_PROJECT_HOME`**.
- La **KSL générée** doit **déjà documenter** :
  - emplacement du fichier spec/module sous **`KSL_PROJECT_HOME`** (`output_paths.*`) ;
  - cibles de livraison applicative sous **`PROJECT_HOME`** quand `outputs.kinds` (ex. `code`) ou le compact le prévoit — ex. dans `intention` / `outputs` / `meta`.
- **A** : compact sous **`KSL_PROJECT_HOME/.yadra/tmp/<run-id>/`** uniquement.

# Entrées (qui alimente B)

| Source | Comment |
|--------|---------|
| **`.compact.ksl`** | Sortie A ; **`# deliverables`** (`ksl_levels`, `output_paths`, `behavior`) + sections selon **`ksl_levels`**. |
| **`feature.yadra.md`** | `ksl_levels` + `output_paths` (relatifs **`KSL_PROJECT_HOME`**) — recopiés en `# deliverables`. |
| **`# questions-resolues`** | Si **ouvert** → **B n’écrit pas** les `.ksl`. |
| **`KSL_PROJECT_HOME`** | Contexte CLI ; KSL existant, layout, `related_specs`. |
| **Ce plan (draft)** | Contrat de l’étape **B · PRODUIRE** — pas le SKILL runtime (voir § Promotion). |
| **Références normatives** | Exemples `ksl/examples/minimal/...` ; [`ksl/grammar/ksl.ebnf`](../../../ksl/grammar/ksl.ebnf). |

# Sortie B : fichiers KSL

## Cœur B — interprétation grammaire

B · PRODUIRE est le **cœur de formalisation syntaxique** : le compact est l’IR métier textuelle ; B **interprète** la grammaire KSL v1 et **émet** des fichiers **valides** sans approximation.

| Exigence | Détail |
|----------|--------|
| **Conformité** | En-tête `ksl 1.0` ; blocs et membres conformes à `ksl.ebnf` + [`ksl-language-spec.md`](../../../docs/ksl-language-spec.md). |
| **Validation** | `yadra validate --layout --semantic` **obligatoire** sur chaque fichier (L0 toujours ; L2/L3). Option **`--syntax`** (L1 = contrôles légers, pas parser EBNF complet — voir [`ksl-validator-roadmap.md`](../../../docs/ksl-validator-roadmap.md)). |
| **LLM** | Profil **`yadra configure`** + credentials de l’utilisateur ; SKILL **`formalize/partie-b-produire`** + ce plan. |
| **Évolution** | Parser L1 complet → `--syntax` devient l’interprétation stricte de `ksl.ebnf`. |

## Où B écrit (réponse explicite)

| Question | Réponse |
|----------|---------|
| **B écrit-il aux `output_paths` dans le repo cible ?** | **Oui**, sous **`KSL_PROJECT_HOME`**. |
| **Chemin absolu** | `join(KSL_PROJECT_HOME, output_paths.<level>)` pour chaque **`ksl_levels`**. |
| **B écrit-il dans `.yadra/tmp/` ?** | **Non** (sauf logs / métadonnées run si le moteur le fait plus tard). Le compact reste le seul artefact temp sous `tmp/`, produit par **A**. |
| **« Intermédiaire » signifie quoi ?** | Fichiers **non scellés T1** et **non commités Git** — mais **déjà présents** dans l’arborescence du projet à l’emplacement déclaré. |
| **Fin de `formalize`** | Les **`.ksl` produits par B restent** sur le disque ; seul **`.yadra/tmp/<run-id>/`** (compact A) est **effacé**. |
| **Conflit fichier existant** | B **écrase le contenu** du path cible (nouvelle proposition T1) ; l’utilisateur **annule via Git** si besoin — pas de merge automatique. |

```text
KSL_PROJECT_HOME/                            # yadra project --ksl-project-home
  services/…/member-creation.spec.ksl        # = output_paths.spec  ← B écrit ICI

KSL_PROJECT_HOME/.yadra/tmp/<run-id>/
  feature.compact.ksl                        # A seulement → supprimé en fin de run
```

## Comportement selon `ksl_levels`

| `ksl_levels` | B émet | Section compact requise |
|-----------|--------|-------------------------|
| **root** | `*.project.ksl` (kind root) au path indiqué | `# .project.ksl` |
| **module** | `<domain>.module.ksl` | `# .module.ksl` + `specs = [...]` si spec co-produite |
| **spec** | `<id>.spec.ksl` | `# .spec.ksl` + sous-sections famille 1 |

Combinaisons usuelles : `[spec]`, `[module, spec]`, `[root, module, spec]` (greenfield).

## Fichier spec (si `spec` ∈ `ksl_levels`)

Obligatoire pour la feature Doc First typique :

| Bloc KSL | Source compact | Notes B |
|----------|----------------|---------|
| En-tête `ksl 1.0` + `spec "…" {` | meta spec id | Identifiant = id proposé en A |
| `module = "…"` | `# .spec.ksl` | = domaine + dossier parent |
| `intention { … }` | `## intention` | Prose → `""" … """` ; **inclure** le chemin spec sous **`KSL_PROJECT_HOME`** (`output_paths.spec`) et, si pertinent, les chemins **`PROJECT_HOME`** pour le code à générer |
| `scope { included / excluded }` | `## scope` | Listes ou texte structuré |
| `usecases { usecase "…" { … } }` | `## usecases` | given/when/then |
| `data { postgres { … } }` | `## data` | Omettre ou placeholder minimal si `(vide — …)` |
| `outputs { kinds = […] }` | `## outputs` | kinds **`ksl`**, `code`, … — pas sous `strategies` |
| `strategies { strategy "…" { role, description } }` | **`## strategies`** du compact (résolu en **A**) | **Description obligatoire** ; B **enrichit** chemins, ne **déduit** pas |
| `budget { … }` | compact ou défaut projet | Si absent en A : defaults conservateurs ou `(vide — reporter)` → B peut omettre budget avec note meta |

## Project / module

- Émettre **uniquement** les niveaux listés dans **`ksl_levels`**, chacun à **`KSL_PROJECT_HOME` + `output_paths.*`**.
- **Module** : si co-émis avec spec, `specs = [ "<spec-id>.spec.ksl" ]` aligné sur `output_paths.spec`.
- **Git** : add / commit / PR = **utilisateur** (fichiers déjà au bon chemin).

## Hors périmètre B (v1 plan)

- **`openapi` / `messaging` / `integrations` détaillés** : uniquement si le compact ou le Doc First les exige explicitement ; sinon **absents** ou stub `description` minimal (famille 2+).
- **Génération code / tests** (T2) : **jamais** en B T1.
- **Scellement** (digest `.yadra/sealed/`) : étape **C** — B livre des fichiers **validables**.

# Matérialisation strategies (B)

La **déduction** des strategies (catalogue, nature de la spec, matrice `when`) est faite en **A · COMPRENDRE** — voir [`yadra-t1-comprendre-intention.plan.md`](yadra-t1-comprendre-intention.plan.md#résolution-des-strategies-a).

B **matérialise** uniquement ce qui est dans **`## strategies`** du `.compact.ksl` :

| Règle | Comportement |
|-------|--------------|
| Entrées compact | Transcrire chaque `strategy "…" (role …)` → syntaxe KSL `strategies { strategy "…" { role, description } }`. |
| Descriptions | **Enrichir** avec chemins `KSL_PROJECT_HOME` (`output_paths.spec`) et **`PROJECT_HOME`** si kind `code` — sans changer le **choix** de patterns. |
| Lacune | Si `## strategies` absent, `(vide — …)`, ou incohérent avec `## outputs` (ex. `code` sans architecture) → **B n’écrit pas** les `.ksl` ; renvoyer vers **A** (compact incomplet). |
| Pas de catalogue en B | B **n’ajoute pas** de strategy par lecture seule de `catalog.yaml` / nature — sauf correction typo de nom **explicitement** notée dans `# meta-docfirst`. |

## Émission KSL

Pour chaque strategy listée en compact :

```ksl
strategy "<name>" {
  role = "<architecture|pattern|testing|…>"
  description = """
  … contextualisé (module, packages PROJECT_HOME, tables data, usecases) …
  """
}
```

# Mapping compact → syntaxe (exemple strategies)

Compact (A) :

```text
strategy "Validator" (role pattern)
  description : valider profil minimal à l'entrée du use case …
```

KSL (B) :

```ksl
strategies {
  strategy "Validator" {
    role = "pattern"
    description = """
    Valider profil minimal à l'entrée du use case …
    """
  }
}
```

# Interaction utilisateur (B)

  - Reprendre les mêmes principes qu’en A ([§ Interaction](../yadra-t1-comprendre-intention.plan.md#interaction-utilisateur-étape-a)) :
  - compact **incomplet** ou `# questions-resolues` **sans réponse** → **B n’écrit pas** les `.ksl` ;
  - ambiguïté de **chemin** (service name, package vs `services/…`) → **question** ou chemin explicite noté dans `# meta-docfirst` du compact.
  - **`outputs.kinds` contient `code`** mais `## strategies` vide ou sans entrée architecture → **B n’écrit pas** ; renvoi **A** pour résolution ([§ Résolution A](yadra-t1-comprendre-intention.plan.md#résolution-des-strategies-a)).
- B **ne corrige pas** silencieusement une erreur métier du compact ; il **matérialise** ou **signale** (log / exit ≠ 0 en CLI future).

# Rôle de l’étape **B · PRODUIRE** (contrat = ce plan)

1. Lire **`.compact.ksl`** + **`KSL_PROJECT_HOME`** (contexte CLI).
2. Refuser si `# questions-resolues` ouvert.
3. Lire **`# deliverables`** → `ksl_levels` + `output_paths` (relatifs **`KSL_PROJECT_HOME`**).
4. **Matérialiser `strategies`** depuis `## strategies` (compact) — § Matérialisation strategies (B).
5. Écrire **`KSL_PROJECT_HOME/<output_paths.*>`** — KSL **grammaire-conforme**.
6. **`yadra validate --layout --semantic`** sur chaque fichier (L0 implicite ; **`--syntax`** recommandé quand L1 mûrira).
7. Remettre à **C · LIVRER** T1 — [`yadra-t1-livrer-ksl.plan.md`](yadra-t1-livrer-ksl.plan.md) + SKILL C + `yadra seal`.

# Exécution du SKILL runtime

| Élément | Valeur |
|---------|--------|
| **Registre** | `skills.formalize.produire` → [`formalize/partie-b-produire/SKILL.md`](../../../../yadra/skills/formalize/partie-b-produire/SKILL.md) |
| **Binding CLI** | `formalize:B` — [`command-context.mjs`](../../../../yadra/cli/src/runtime/command-context.mjs) |
| **Commande** | **Hors binaire MVP** : agent après A dans le même run `yadra formalize` ; pas de `yadra produire` |
| **Plan chargé** | `plan-validate/yadra-t1/t1-produire-ksl.plan.md` ou **ce draft** |
| **LLM** | **Oui** (`usesLlm: true`) — même règle configure/credentials ; **`--skip-llm`** sur `formalize` = A seul affiché, B manuel |
| **Fichiers agent** | `SKILL.md` + [`system.prompt.md`](../../../../yadra/skills/formalize/partie-b-produire/system.prompt.md) |

## Comportement attendu (agent / LLM)

1. Lire **`.compact.ksl`** (`# deliverables`, `## strategies`, sections spec).
2. **Stop** si `# questions-resolues` ouvert ou `## strategies` vide alors que `code` ∈ kinds.
3. **Transcrire** `## strategies` → bloc KSL — **sans** redéduire depuis `catalog.yaml`.
4. Écrire **`KSL_PROJECT_HOME` + `output_paths.*`** — grammaire `ksl 1.0`.
5. Lancer **`yadra validate --layout --semantic`** sur chaque fichier émis.
6. Handoff **C · LIVRER** : validate OK → [`yadra-t1-livrer-ksl`](yadra-t1-livrer-ksl.plan.md) + `yadra seal`.

## Interdit en B (SKILL)

- Ajouter des `strategy "…"` absentes du compact A.
- Modifier le compact ou le Doc First.
- Sceller ou appeler T2.

# Promotion plan vs SKILL

| Étape | Quoi |
|-------|------|
| **Draft** | Itérer ce plan + SKILL § Exécution ; exercices manuels (member-creation). |
| **`plan-validate/`** | Plan markdown validé → chargé avant le SKILL au runtime. |

# Critères de « B terminé » (MVP)

| # | Critère |
|---|---------|
| 1 | Tous les **`ksl_levels`** sous **`KSL_PROJECT_HOME` + `output_paths`** ; KSL générée mentionne **`KSL_PROJECT_HOME`** (fichier) et **`PROJECT_HOME`** si livraison code/app déclarée. |
| 2 | `yadra validate --layout --semantic` **OK** sur chaque fichier. |
| 3 | Chaque `strategy "…"` a un `description =`. |
| 4 | `outputs.kinds` aligné avec blocs présents (ex. pas `data` kind sans `data { }`). |
| 5 | Aucune question bloquante laissée ouverte dans le compact du run. |
| 6 | **`strategies` = compact A** : bloc présent et cohérent avec `outputs.kinds` (ex. si `code` ∈ kinds → au moins une entrée `architecture` **déjà** dans le compact) ; B n’a pas ajouté de strategies par déduction. |

Exercice de référence : convertir `tontine/a-experiment-ksl/ksl/member-creation.compact.ksl` → `member-creation.spec.ksl` (+ module/project si besoin) — **manuel / agent** jusqu’à CLI branchée (projet Tontine hors monorepo specs client).

# Périmètre de ce plan

- **Inclus** : entrées/sorties B, **trois racines** (§ Ancrage), mapping familles 1, **matérialisation strategies** (sans déduction), critères validate, lien A→B, SKILL B aligné.
- **Exclus** : impl CLI `formalize`, `yadra llm`, scellement C détaillé, T2, **déduction strategies** (responsabilité **A**), validation L3 noms catalogue (futur).

# Étapes (prochaines — plan)

1. Valider **plan A** puis **plan B** (tu le feras en fin de cycle).
2. Exercice member-creation (checklist ci-dessous).
3. Promotion **`plan-validate/`** → rédiger **SKILL production** depuis le plan B validé.
4. Plan **T1 · C** + impl `yadra formalize`.

# Architecture

- [`docs/ksl-yadra-integrated-architecture.html`](../../../docs/ksl-yadra-integrated-architecture.html) — T1, boucle A→B→C.
- [`docs/yadra-core-ksl-families.html`](../../../docs/yadra-core-ksl-families.html) — familles 2+ optionnelles en B v1.

# Risques

- Traiter B comme **patch** d’une spec existante (`IsNew: false`) → toujours **proposition** + merge dev.
- Émettre de l’**openapi** inventé non demandé en Doc First.
- Oublier **`module` / `specs =`** → échec L2.
- Confondre **B T1** (KSL syntaxique) avec **B T2** (génération code).

# Critères de validation (aspect)

Quand OK, promouvoir vers `plan-validate/yadra-t1/` avec `id: t1-produire-ksl`.

- [x] Exercice member-creation : spec produite passe `yadra validate --layout --semantic` (2026-10-23, `a-experiment-ksl`).
- [ ] Alignement grammaire `strategies` + `outputs.kinds`.
- [x] SKILL B aligné (2026-10-26) ; déduction strategies → plan A v6.
- [ ] À la promotion plan : variante **SKILL production** si différenciation registre projet.
- [ ] Lien `source_plan: t1-comprendre-intention` acté.
