---
id: t1-comprendre-intention
title: T1 · A · COMPRENDRE — famille 1 (intention métier)
status: validated
version: 6
aspect: yadra-t1
created: 2026-10-15
updated: 2026-10-28
validated_at: 2026-10-28
source_plan: plan/yadra/v1/yadra-t1-comprendre-intention.plan.md
validated_by: human
authors: []
---

# Objectif

**Mode plan** — comportement **A · COMPRENDRE** dans **`yadra formalize`**. **CLI 0.1.4+** : appel LLM (`configure` + credentials) + SKILL + catalogue → `.compact.ksl` sous `.yadra/tmp/<run-id>/` (`--skip-llm` = manuel).

- **Pas** de commande CLI `comprendre` : A est une étape interne ; **contrat = ce plan** (SKILL **comprendre / formalize · A** dérivé **après** promotion `plan-validate/`).
- **Produit A → B** : un fichier temporaire **`.compact.ksl`** sous `.yadra/tmp/<run-id>/` (nom libre, ex. `feature.compact.ksl`) — **texte** repérable par B — puis **effacé** en fin de `formalize`.
- **T1 produit toujours une nouvelle KSL** (fichiers émis par B) ; le **commit Git** reste à l’utilisateur. **`IsNew`** et **`related_specs`** orientent la **compréhension**, pas un patch automatique d’un fichier existant.

# Où A écrit sur le disque (réponse explicite)

| Question | Réponse |
|----------|---------|
| **A écrit-il aux `output_paths` du repo ?** | **Non.** A n’écrit **que** le compact. |
| **Où ?** | **`KSL_PROJECT_HOME/.yadra/tmp/<run-id>/`** (ex. `feature.compact.ksl`) — voir § Ancrage. |
| **Fin de `formalize` ?** | Le **compact** est **supprimé** avec le reste de `.yadra/tmp/<run-id>/`. |
| **Rôle des `output_paths` dans `feature.yadra.md` ?** | Déclarer **où B devra écrire** les `.ksl` ; recopiés dans `# deliverables` + **`## intention`**. |

**B · PRODUIRE** (plan séparé) : écrit les **vrais** fichiers KSL sous **`KSL_PROJECT_HOME` + `output_paths`** — voir [`yadra-t1-produire-ksl.plan.md`](yadra-t1-produire-ksl.plan.md#où-b-écrit-réponse-explicite).

# Ancrage disque — trois racines

Ancrage : [`yadra-project-roots.md`](../cli/yadra-project-roots.md) — **`yadra project`** (`KSL_PROJECT_HOME`, `PROJECT_HOME`).

| Variable | Rôle pour **A** |
|----------|-----------------|
| **`KSL_HOME`** | Grammaire / libs CLI (`@yadral/yadra`) — lecture seule ; pas d’écriture compact/specs. |
| **`KSL_PROJECT_HOME`** | Monorepo specs — **tmp** `.yadra/tmp/<run-id>/`, lecture KSL existant, **`output_paths`** relatifs. |
| **`PROJECT_HOME`** | Repo **code généré depuis KSL** (T2) — compact / **`## intention`** peut le nommer pour les livrables `code`, distinct du chemin des `.ksl`. |

# Entrées (qui alimente A)

| Source | Comment |
|--------|---------|
| **Dossier formalisation** | `yadra formalize <dossier>/` |
| **`feature.yadra.md`** | **Obligatoire** — texte informel ; champs lus via **LLM** (moteur A — SKILL après promotion plan). |
| **Fichiers contextuels** | **Non normalisés** : Jira, Confluence, `.md`, etc. — tout contenu **lisible / accessible** dans le dossier ; le modèle s’en sert si utile. |
| **KSL existant** | Sous **`KSL_PROJECT_HOME`** (`yadra project`). Analyse pour **contexte** (cohérence, voisinage). |
| **Ce plan (draft)** | Contrat étape **A · COMPRENDRE** — pas le SKILL runtime. |
| **Catalogue strategies** | [`yadra/strategies/catalog.yaml`](../../../../yadra/strategies/catalog.yaml) — noms canoniques et règles `when` (interne). |

Doc renvoi : [`docs/yadra-ksl-processing.md`](../../../docs/yadra-ksl-processing.md) · [`docs/yadra-cli.md`](../../../docs/yadra-cli.md) · [`yadra-project-roots.md`](../cli/yadra-project-roots.md).

# `feature.yadra.md` — contenu minimum

| Information | Attendu |
|-------------|---------|
| **description** | Intention / périmètre métier. |
| **kind** | `KSL` — type de dossier formalisation (pas confondre avec `ksl_levels` ci-dessous). |
| **IsNew** | `true` \| `false` — **prioritaire** pour orienter A (nouvelle feature vs évolution d’un périmètre existant). |
| **related_specs** | Liste (peut être `[]`) — **aide** à formaliser (références, voisinage) ; **ne désigne pas** un fichier à écraser. |
| **ksl_levels** | Niveaux KSL que **B** matérialisera : un ou plusieurs parmi **`root`**, **`module`**, **`spec`**. |
| **output_paths** | Chemins **relatifs à `KSL_PROJECT_HOME`** pour chaque **`ksl_levels`** (obligatoire — sinon A pose la question). **B écrira ici** (pas A). Optionnel : champ **`project_home`** ou note dans description si **`PROJECT_HOME`** ≠ monorepo KSL. |

```markdown
kind: KSL
IsNew: true
related_specs: []
ksl_levels: [module, spec]
output_paths:
  module: services/tontine-service/modules/members/members.module.ksl
  spec: services/tontine-service/modules/members/member-creation.spec.ksl

## description

Enregistrer un membre avec profil minimal…
```

Entrée **`yadra formalize`** : dossier contenant **`feature.yadra.md`** (+ contexte optionnel) — inchangé.

# Sortie A → B : `.compact.ksl`

Fichier **texte** : sections selon **`ksl_levels`** — **détails textuels**, pas la syntaxe KSL finale scellée.

## `# deliverables` (obligatoire en tête de compact)

Reprise / enrichissement de `feature.yadra.md` :

| Champ compact | Rôle |
|---------------|------|
| **ksl_levels** | `[root]`, `[module]`, `[spec]` — **pilote** quelles sections `# .project.ksl` / `# .module.ksl` / `# .spec.ksl` A remplit et B compile. |
| **output_paths** | Chemin **relatif `KSL_PROJECT_HOME`** par niveau — **cible d’écriture de B**, recopié depuis `feature.yadra.md`. |
| **behavior** (par niveau) | Texte court : ex. `root` = créer monorepo root ; `module` = nouveau domaine `members` ; `spec` = nouvelle feature — guide B, pas de patch auto. |

- Si **`ksl_levels: [spec]`** seul → sections `# .module.ksl` / `# .project.ksl` **absentes** ou `(non requis — module existant)` sauf inférence explicite.
- Si **`ksl_levels`** inclut **`module`** → section `# .module.ksl` **obligatoire** (+ path).
- Si **`ksl_levels`** inclut **`root`** → section `# .project.ksl` **obligatoire** (+ path vers `*.project.ksl` kind root).

Les **chemins cibles** (`output_paths.*`) doivent apparaître dans **`## intention`** : emplacement des `.ksl` sous **`KSL_PROJECT_HOME`** ; mentionner **`PROJECT_HOME`** si le Doc First distingue dépôt specs et dépôt app.

Dans **`# .spec.ksl`** (si `spec` ∈ `ksl_levels`), l’étape A **doit toujours** produire les sous-sections suivantes — **même vides** si `feature.yadra.md` n’est pas explicite :

| Sous-section compact | Rôle |
|----------------------|------|
| **intention** | Famille 1 |
| **scope** | Famille 1 |
| **usecases** | Famille 1 |
| **data** | Cibles persistance (postgres, …) — texte ou `(vide — doc first insuffisant)` |
| **outputs** | `outputs.kinds`, docs/e2e — texte ou placeholder vide |
| **strategies** | Liste **déduite et résolue en A** (§ Résolution) — **pas** laissée vide pour que B devine ; chaque entrée : **nom**, **role**, **description** (où / comment) |

Grammaire KSL cible (§ 3.10 — [`docs/ksl-language-spec.md`](../../../docs/ksl-language-spec.md), [`ksl/grammar/ksl.ebnf`](../../../ksl/grammar/ksl.ebnf)) :

- Bloc **`strategies { }`** (pluriel) — **plus** l’ancien `strategy { architecture, patterns, testing, outputs }`.
- Entrées **`strategy "Nom" { role = "…" ; description = "…" }`** — plusieurs patterns autorisés (ex. Validator + Outbox).
- Les **kinds de livraison** restent **uniquement** dans **`outputs { kinds = [...] }`** (pas de miroir sous `strategies`).

En **compact** (A), le texte peut être informel ; **B · PRODUIRE** doit émettre la syntaxe ci-dessus. Référence exemples : `ksl/examples/minimal/.../order-checkout.spec.ksl`, `cart-management.spec.ksl`.

```text
# .project.ksl
(…)

# .module.ksl
(…)

# .spec.ksl
## intention …
## scope …
## usecases …
## data …
## outputs …
## strategies
strategy "Hexagonal" (role architecture)
  description : … couche domaine / adapters / modules concernés …
strategy "Validator" (role pattern)
  description : … point d’entrée validation, règles …
strategy "FluentCaseTest" (role testing)
  description : … emplacement tests, lien use cases …
```

# Résolution des strategies (A)

**Responsabilité A** : à partir de la **nature** de la feature (Doc First, `## intention`, `## scope`, `## outputs`, `## data`, `## usecases`, intégrations/messaging si mentionnés), **déduire** les `strategy "…"` à inclure dans **`## strategies`** du compact. **B · PRODUIRE** ne fait **pas** cette déduction — il **matérialise** le compact en KSL.

## Priorité

| Ordre | Source | Comportement |
|-------|--------|--------------|
| 1 | **Utilisateur** (questions § Interaction) | Trancher si plusieurs options plausibles (Hexagonal vs autre, async variant, etc.). |
| 2 | **Catalogue** [`yadra/strategies/catalog.yaml`](../../../../yadra/strategies/catalog.yaml) | Proposer les noms dont les `when` matchent la nature ; préférer noms canoniques du catalogue. |
| 3 | **`related_specs` / KSL voisin** | Reprendre noms pertinents ; **réécrire** descriptions pour la feature courante. |
| 4 | **Custom** | Nom hors catalogue seulement si **description** longue et précise. |

## Signaux « nature » (matrice)

Texte des sections compact en **minuscules** pour matcher `signals_any` du catalogue.

| Signal | Strategies typiques (catalogue) |
|--------|--------------------------------|
| `outputs.kinds` contient **`code`** | `Hexagonal` ; souvent `Validator` ; `Populator/Converter` si API/DTO/mapping/graphql ; **`SOLID`** / **`DIY`** (ou DRY, KISS, YAGNI) si intention qualité / simplicité / scope |
| `outputs.kinds` contient **`data`** | `TransactionalOutbox` si messaging/async ; persistence dans `description` |
| `outputs.kinds` contient **`tests`** ou `## usecases` riche | `FluentCaseTest` |
| Intégrations / partenaire externe | `Adapter` ou famille `AsyncRequest-*` |
| Messaging / kafka / queue | `TransactionalOutbox`, variante async |
| GraphQL / subscription / stream | `GraphQLStream`, `Populator/Converter` |
| Intention explicite (« observer », « builder », …) | Entrée GoF du catalogue **si** cohérent avec scope |

**`Populator/Converter`** : **une seule** entrée dans `## strategies` — jamais Populator et Converter séparés.

## Traçabilité dans le compact (recommandé)

En tête de `## strategies` :

```text
# yadra:strategies resolved=<n> user=<n> catalog=<n>
```

- **user** = choix explicitement confirmés par l’utilisateur  
- **catalog** = ajoutés via matrice + catalogue  
- **resolved** = total des entrées listées  

## Fin de A

- **`## strategies`** ne doit **pas** rester `(vide — …)` si `outputs.kinds` contient `code` sans équivalent architecture documenté ailleurs — **question utilisateur** ou liste complète avant de fermer le compact.
- B reçoit un compact où la **décision strategies est déjà prise** ; voir [`yadra-t1-produire-ksl.plan.md`](yadra-t1-produire-ksl.plan.md#matérialisation-strategies-b).

**`IsNew: true` / `false`** : toujours une **nouvelle** proposition dans `.compact.ksl` ; **`related_specs`** aide l’ancrage (y compris pour **reprendre** des `strategies` voisines en les **réécrivant** avec descriptions adaptées à la feature).

# Interaction utilisateur (étape A)

Si **data**, **outputs** ou **strategies** ne peuvent pas être renseignés avec un minimum de confiance (Doc First flou, pas d’KSL voisin, contexte dossier silencieux) :

1. **Ne pas inventer** silencieusement des choix techniques lourds.
2. **Interagir** avec l’utilisateur : questions courtes et ciblées — **data** (moteur, tables) ; **outputs** (kinds) ; **strategies** (quels patterns, **où** les appliquer, **comment** — ex. Hexagonal vs autre, Validator à quelle frontière, FluentCaseTest oui/non).
3. En **prélude CLI** (manuel / agent) : noter les Q/R dans `# meta-docfirst` ou `# questions-resolues` dans le `.compact.ksl`, ou attendre réponse avant de finaliser le compact.
4. À terme **`yadra formalize`** pourra poser ces questions en interactif ; ce plan décrit **quoi demander** et **quand** (SKILL dérivé après promotion).

**Ambiguïté et contradictions (périmètre A — pas le garde-fou architecture global)** :

- **Lacune, flou, options plausibles** → **questions utilisateur** (§ ci-dessus), pas d’invention silencieuse.
- **Contradiction explicite** entre `feature.yadra.md`, contexte dossier et/ou KSL voisin (`related_specs`) → **questions obligatoires** pour trancher ; **ne pas finaliser** le `.compact.ksl` (ou le laisser avec `# questions-resolues` ouvert) tant que l’utilisateur n’a pas répondu.
- Ce plan **ne** impose **pas** un arrêt CLI « hard stop » comme dans le diagramme architecture ; le comportement opérationnel en A est **interagir**, pas continuer vers B avec des choix arbitraires.

Sections laissées vides **uniquement** après interaction (ou décision explicite « reporter à B / dev ») — avec mention `(vide — …)`.

# Rôle de l’étape **A · COMPRENDRE** (contrat = ce plan)

- Lire **`feature.yadra.md`** + contexte dossier (LLM).
- Analyser KSL sous **`KSL_PROJECT_HOME`** (**related_specs** = aide).
- **Évaluer lacunes** sur data / outputs / strategies → **interaction utilisateur** si besoin (§ ci-dessus).
- Écrire **un** `.compact.ksl` **complet** (sections spec obligatoires, placeholders autorisés).
- Famille 1 détaillée ; **data** / **outputs** / **strategies** (N entrées **résolues en A** + descriptions) pour B — spec § 3.8–3.10.
- **Hors A** : syntaxe KSL finale → **B · PRODUIRE** ([`yadra-t1-produire-ksl.plan.md`](yadra-t1-produire-ksl.plan.md)) ; openapi/messaging détaillés en B si demandé ; **C** validate/seal ; CLI `yadra llm` (plan séparé).

# Périmètre de ce plan

- **Inclus** : entrées, `.compact.ksl`, **résolution strategies (A)**, catalogue interne, **`YADRA_PROJECT_HOME` / `KSL_PROJECT_HOME` / `PROJECT_HOME`**, **IsNew** / **related_specs**, SKILL A aligné (draft).
- **Exclus** : code, garde-fou **automatisé** architecture, `yadra llm`, B/C T1 détaillés.

# Exécution du SKILL runtime

Le **plan** fixe le contrat métier ; le **SKILL** est ce que le CLI charge pour l’agent. Les deux doivent rester alignés.

| Élément | Valeur |
|---------|--------|
| **Registre** | `skills.formalize.comprendre` → [`formalize/partie-a-comprendre/SKILL.md`](../../../../yadra/skills/formalize/partie-a-comprendre/SKILL.md) |
| **Binding CLI** | `formalize:A` — [`command-context.mjs`](../../../../yadra/cli/src/runtime/command-context.mjs) |
| **Commande** | `yadra formalize <dossier>` quand les `.ksl` des `output_paths` **manquent** (phase A du run) |
| **Plan chargé** | `prompts/plan-validate/yadra-t1/t1-comprendre-intention.plan.md` si présent, sinon **ce draft** `v1/` |
| **LLM** | **Oui** (`usesLlm: true`) — profil `yadra configure` + credentials ; **`--skip-llm`** = pas d’appel modèle, chemins plan/SKILL affichés |
| **Fichiers agent** | `SKILL.md` + [`system.prompt.md`](../../../../yadra/skills/formalize/partie-a-comprendre/system.prompt.md) (message système du chat) |

## Comportement attendu (agent / LLM)

1. Lire `feature.yadra.md` + dossier + KSL sous **`KSL_PROJECT_HOME`**.
2. Charger [`catalog.yaml`](../../../../yadra/strategies/catalog.yaml) ; **résoudre `## strategies`** (§ Résolution) — **B ne déduit pas**.
3. Écrire **un** `.compact.ksl` sous **`KSL_PROJECT_HOME/.yadra/tmp/<run-id>/`** avec `# deliverables` et sections spec.
4. Fermer **`# questions-resolues`** ou laisser ouvert si blocage — **pas de handoff B** si ouvert.
5. **Ne pas** émettre de `.spec.ksl` syntaxique (rôle **B**).

## Interdit en A (SKILL)

- Inventer des strategies sans catalogue / sans question utilisateur quand kinds lourds.
- Écrire aux `output_paths` ou sceller (rôle **C**).
- Sauter le catalogue pour les noms `strategy "…"`.

# Promotion plan vs SKILL

| Étape | Quoi |
|-------|------|
| **Pendant draft** | Itérer **ce plan** ; maintenir le SKILL aligné sur § Exécution + § Résolution strategies. |
| **`plan-validate/`** | Valider le **plan markdown** (contrat figé) — pas `yadra validate` sur le plan. |
| **Après promotion** | Le SKILL reste la surface runtime ; le plan validé devient source prioritaire au chargement CLI. |

# Étapes (prochaines — plan)

1. Valider **plan A** (avec **plan B** en fin de cycle, comme convenu).
2. Promotion `plan-validate/` → SKILL **comprendre** + prompts.
3. Impl CLI `formalize` quand plans A/B/C validés.

# Architecture

- [`docs/ksl-yadra-integrated-architecture.html`](../../../docs/ksl-yadra-integrated-architecture.html) — T1, A.
- [`docs/yadra-core-ksl-families.html`](../../../docs/yadra-core-ksl-families.html) — famille 1.
- Exemple KSL : `ksl/examples/minimal/.../order-checkout.spec.ksl`.

# Risques

- Croire que T1 **remplace** une spec existante automatiquement.
- Confondre **A T1** avec **T2 · A** ou `yadra plan`.
- Réutiliser l’ancien bloc **`strategy { architecture = … }`** ou lister des patterns **sans** `description` (rejet L3 en spec finale).
- Mettre **`outputs.kinds`** sous `strategies` au lieu de **`outputs { }`**.
