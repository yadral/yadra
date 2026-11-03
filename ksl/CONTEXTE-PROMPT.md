# Contexte Yadra × KSL — pour reprendre le prompting ailleurs

Coller ce bloc (ou le fichier entier) en tête d’une nouvelle conversation Cursor / autre agent.

---

## Projet et emplacement

| Élément | Chemin |
|--------|--------|
| **Ce dépôt (architecture & spec visuelle)** | `yadral` (KSL + Yadra) |
| **Apps / monorepo existant** | `demo-apps` (sibling, optionnel) |
| **Artefact principal** | `docs/ksl-yadra-integrated-architecture.html` — diagramme SVG interactif + section « 4 grandes ruptures » |

**Prévisualisation locale :**

```bash
cd docs   # depuis la racine yadral
python3 -m http.server 8089
# puis http://localhost:8089/docs/ksl-yadra-integrated-architecture.html
```

---

## Vocabulaire

- **Yadra** : **Spec-to-Code Binder** — lie le code à la spec KSL scellée (pas un compilateur CompCert, pas un agent « vibe coding »). La spec **est** le document de la feature ; elle se met à jour avec la feature, nouvelle spec seulement pour un upgrade majeur — pas de pile de `.md` obsolètes.
- **KSL** (*Kom Specification Language*) : pivot sémantique / « IR » du développement IA (analogie LLVM).
- **SKILLS** : conventions projet (hors KSL). Yadra les **invoque** à partir du bloc `strategies` de chaque spec (entrées `role` + `description`) et du `stack` / `project` — l’auteur ne liste pas les SKILLS dans l’KSL.

---

## Règle d’or (non négociable)

**L’KSL est l’unique porte utilisée par Yadra pour générer le code du projet cible.**

- Pas de saut direct Doc First / Jira → code cible.
- Timeline 2 n’accepte **aucun** Doc First : entrée = contrats KSL scellés issus de T1 uniquement.

---

## Structure des documents KSL

Le KSL est un **DSL déclaratif de haut niveau**, riche en texte, structuré par blocs à accolades `{ }` :

1. **`*.project.ksl` (Décentralisé)** — Un fichier par composant :
   - `root.project.ksl` : projet racine (`kind = "root"`, `repo`, `stack` globale : build, runtime, framework, data, infra).
   - `<service>.project.ksl` : sous-projet service (`kind = "service"`, `parent = "<root-id>"`, `modules = ["checkout", "cart"]`, `repo`, `stack`, `dependencies`, `docs`, `e2e`, `communications`).
   - `<lib>.project.ksl` : sous-projet bibliothèque (`kind = "lib"`, `parent = "<root-id>"`).

2. **`*.module.ksl` (Module de domaine métier)** — Porte les specs d'un sous-domaine (pas un module Gradle/infra) :
   - Layout naturel : `services/<service>/modules/<domain>/<domain>.module.ksl` + `*.spec.ksl` dans le même dossier.
   - `module "<id>" { service = "<service-id>", specs = [...], vocabulary { ... } }`

3. **`*.spec.ksl`** — Spécification complète d'une fonctionnalité (mots-clés en anglais) :
   - `module = "checkout"` (rattachement explicite au module de domaine, obligatoire, doit matcher le dossier et le `*.module.ksl`)
   - `meta` (`name`, `target_service`, `version`, `labels`)
   - `openapi { ref, action = "update", version, breaking_changes, description = "..." }` (évolution haut niveau du contrat d'API, Yadra déduit les routes/schémas)
   - `intention` (texte riche / problème résolu / valeur utilisateur)
   - `scope { included = [...], excluded = [...] }` (périmètre strict pour borner l'IA)
   - `flows { flow "<id>" { description = "...", ref = "..." } }` (images locales, URLs distantes ou pages web Miro/Wiki avec description)
   - `integrations` (APIs avec `type = "internal" | "external"`, `auth = "jwt" | "apikey" | "oauth2"`, `doc` pour APIs externes, `in_config = true`)
   - `messaging` (Kafka, RabbitMQ, SQS : topic, role, `in_config = true`, `description = """texte libre : nb de consumers, retry, DLQ..."""`)
   - `storage` (raccourci objet ; de préférence `data { s3 | gcs | blob }` quand `"data"` est dans les outputs)
   - `data { postgres | mysql | bigquery | snowflake | redis | s3 | gcs | blob { schema, database, dataset, bucket, description, in_config } }` (cibles **data** que la spec fait produire)
   - `usecases { usecase "<id>" { description, given, when, then } }` (scénarios structurés)
   - `outputs { kinds = ["ksl", "code", "data", "tests", "docs", "e2e"], docs { ... }, e2e { ... } }` (manifeste de livraison ; `docs` / `e2e` peuvent aussi rester au top-level)
   - `e2e { scenarios = [...], mock_externals = true }` (aucun chemin requis, convention Yadra)
   - `docs { title, swagger = "/docs/swagger-ui", redoc = "/docs/redoc", confluence = "https://...", update_jira = true }` (routes d'exposition HTTP ou chemins statiques pour Swagger/Redoc, mise à jour Confluence et ticket Jira)
   - `strategies { strategy "…" { role, description } … }` — **Yadra en déduit les SKILLS** ; pas de fichier `.strategy.ksl` séparé
   - `budget { max_repair_loops, max_iterations, … }` au **niveau de la spec entière** (pas dans `strategies`)
   - `related_specs` (optionnel, variante / extension d’une autre spec du même module ou d’un autre)
   - `references` (`story`, `jira`, `architecture_doc`, `doc`, …)
   - Module : `depends_on_modules = ["cart"]` (lien **métier** entre domaines, optionnel)

---

## Deux timelines étanches

### Timeline 1 — Intention métier → spécifications formelles KSL

**Entrées conjointes :**

1. **Doc First** (Jira, user stories, intentions informelles)
2. **KSL existant du projet** (ancrage architecture, pas repartir de zéro)

**Cœur Yadra T1 — boucle fermée itérative :**

`[ A · COMPRENDRE ➔ B · PRODUIRE ➔ C · LIVRER ]` + **arrêt monotone**

| Étape | Rôle |
|-------|------|
| **A · COMPRENDRE** | Ancrage KSL ; **SKILLS invoquées par Yadra** (via `strategies` / stack) ; analyse Doc First ; garde-fou ambiguïté (contradiction → arrêt) |
| **B · PRODUIRE** | KSL Synthesizer (modèle IA) → `.project.ksl`, `.module.ksl`, `.spec.ksl` (bloc `strategies` **dans** chaque spec) |
| **C · LIVRER** | Scellement T1 / Gate T2 — **SKILL + oracles CLI** (validate, seal, verdict) ; **IA possible** (`gate --produce`) |

**Transitions visibles sur le diagramme (T1) :** `SPEC ➔` (A→B), `CHECK ➔` (B→C)

**Boucle de retour T1 :** échec invariant / typage → **C ──► B** (raffinement monotone dans B)

**Modèle IA :** un modèle **dédié par requête** (1 REQ = 1 INST), injecté dans **A & B** seulement.

**Sortie T1 :** spécifications KSL figées / scellées → transfert vers T2.

---

### Ruban pivot central

Transfert du **contrat KSL seul** (seul intérêt métier transmis) de T1 vers T2.

---

### Timeline 2 — Génération cible **uniquement** depuis l’KSL

**Entrée exclusive :** fichiers KSL de T1. Paramètres run (dépôts, deps, cibles, budgets) **intégrés dans le KSL** — pas de boîte RUN CONTEXT séparée.

**Cœur Yadra T2 — même triptyque en boucle :**

`[ A · COMPRENDRE ➔ B · PRODUIRE ➔ C · LIVRER ]` + **D · Orchestration & Evidence Sealing**

| Étape | Rôle |
|-------|------|
| **A · COMPRENDRE** | Parsing contrat KSL ; plan de compilation ; **SKILLS invoquées par Yadra** (strategies / stack) |
| **B · PRODUIRE** | Agents IA + **`yadra execute`** (artefacts `outputs.phase.execute`, sandbox Gradle, boucle repair) — **sans IA** pour la sandbox |
| **C · LIVRER** | `yadra gate` · kinds `phase.gate` · **`--produce` (IA opt.)** + **oracle** Conformance Gate (verdict déterministe) |
| **D** | Workflow déterministe, manifest artefacts, scellement des preuves |

**Transitions (T2) :** `PLAN ➔` (A→B), `BUILD ➔` (B→C)

**Boucle locale T2 :** build break / tests → **C ──► B** (réparation guidée bornée)

**Oracle Conformance Gate (verdict déterministe, hors LLM B / `--produce`) :**  
`KSL × Artifacts + Preuves ⟹ SATISFIED | VIOLATED | UNDECIDABLE`  
(La **phase** C · LIVRER inclut aussi SKILL et production IA optionnelle.)

- **VIOLATED** → remédiation automatique (retour vers B en T2)
- **UNDECIDABLE** → arbitrage humain (retour vers spec / T1)
- **SATISFIED** → **VERIFIED RESULT BUNDLE**

---

## Les 4 ruptures (section HTML du doc)

1. KSL comme IR du développement IA  
2. Oracle Gate vs LLM producteur (fin du « juge & partie » sur le **verdict**)  
3. Traitement `UNDECIDABLE` & arrêt monotone  
4. Ségrégation 2 timelines + ancrage projet (KSL + SKILLS)

---

## Dernières demandes UX sur le diagramme (état copié depuis demo-apps)

- **Transitions A–B–C** : badges lisibles sur les flèches (`SPEC`, `CHECK`, `PLAN`, `BUILD`), couloirs ~40px.
- **A–B–C = boucle** : bandeau `🔄 BOUCLE … [ A ➔ B ➔ C ]` + arc pointillé **C → B** sous les trois cartes (T1 et T2).
- Contraintes layout : pas de flèche traversant le texte ; `VERIFIED RESULT BUNDLE` et bandeau transfert KSL préservés ; couloirs VIOLATED / UNDECIDABLE en marges.

**Fichier source de vérité visuelle :** `docs/ksl-yadra-integrated-architecture.html` (SVG ~1560×1340).

**Scénarios de retour (section sous le grand schéma) :** diagramme de circulation des données entre entités (humain, A/B/C, Gate) et technologies (KSL, SKILLS, LLM, Gradle, FluentTest, SQL, OpenTofu). Trois payloads : ① C→B (logs/tests), ② VIOLATED→B (`clause_id` + diff), ③ UNDECIDABLE→T1 (cause + snapshot KSL). Le bundle SATISFIED n’est jamais réécrit par un retour.

---

## Pistes de travail suivantes (au choix)

- Affiner lisibilité des transitions / boucles (taille police, contraste, légende).
- Extraire l’KSL grammar / exemples `.spec.ksl` dans ce repo.
- Implémenter le squelette Yadra-Executor (T1 vs T2) en code.
- Synchroniser avec le monorepo `demo-apps` si l’HTML diverge.

---

## Prompt court (copier-coller)

```
Je travaille sur Yadra (Spec-to-Code Binder) et l’KSL (Kom Specification Language).
Repo : yadral (KSL + CLI Yadra)
Diagramme de référence : docs/ksl-yadra-integrated-architecture.html

Règle d’or : l’KSL est la seule porte pour générer le code cible.
Deux timelines étanches : T1 (Doc First + KSL existant → KSL scellé) puis T2 (KSL seul → artefacts + Conformance Gate).
Cœur = boucle [ A·COMPRENDRE (KSL+SKILLS) → B·PRODUIRE (IA) → C·LIVRER (SKILL + oracles + IA opt.) ] avec retour qualité → B et arrêt monotone (T2 : sandbox/repair dans B).

[Ta demande ici]
```
