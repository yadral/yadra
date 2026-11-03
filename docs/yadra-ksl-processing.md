# Yadra — traitement de l’KSL (hors langage)

**Yadra** est un **Spec-to-Code Binder** : il lie le code à une spec KSL scellée (la spec **est** le document de la feature ; mise à jour si la feature évolue, nouvelle spec si upgrade majeur — pas une pile de `.md` obsolètes).

Ce document décrit **le comportement de Yadra**. Il ne fait **pas** partie de la grammaire KSL : l’auteur écrit `project` / `module` / `spec` ; Yadra interprète.

Référence langage : [`ksl-language-spec.md`](ksl-language-spec.md).  
CLI : [`yadra-cli.md`](yadra-cli.md) (`yadra validate`, `yadra execute`, `yadra gate`).

---

## 1. KSL vs Yadra

| KSL (auteur) | Yadra (runtime) |
|--------------|-----------------|
| Intention, scope, use cases, flows, integrations | COMPRENDRE + ancrage projet |
| `strategies { strategy "…" { role, description } … }` | Choix des **SKILLS** projet (architecture, patterns, testing), agents, sandboxes |
| `budget { max_repair_loops, max_iterations, … }` | Limites d’exécution pour **toute la spec** (hors `strategies`) |
| `outputs { kinds }`, `data { postgres \| bigquery \| s3 \| … }`, `docs`, `e2e` | Manifeste de livraison : **ksl**, **code**, **data**, tests, docs, e2e — **restent dans le KSL** ; Yadra les exécute |
| `openapi`, `messaging`, `storage` | Autres cibles de livraison / intégration |
| Layout `modules/<domain>/` + `module = "..."` | Vérification de cohérence (conventions) |

**SKILLS** : jamais listées dans l’KSL. Yadra les **invoque** à partir du contenu de la spec (ex. `architecture = "Hexagonal"`, `patterns = ["Validator"]`, `testing = "FluentCaseTest"`) et du `stack` / `project` — pas d’implémentation SKILLS dans le DSL.

### Contenu de SKILL (hors KSL) — T1 · formalize · COMPRENDRE

Les **SKILLS** portent les **contrats opérationnels** que l’KSL ne décrit pas : comment enchaîner A · B · C, quelles entrées humaines attendre, comment appeler le modèle, etc. Ce ne sont **pas** des sous-commandes CLI exposées — **`yadra formalize`** enchaîne **A+B (LLM in-process si `.ksl` manquants) puis C (validate + seal)** dans le CLI packagé ; les SKILLS formalize A/B/C cadrent chaque phase.

**Règle CLI (0.1.4+)** — T1/T2 **sauf `validate`** : chaque commande d’orchestration charge **LLM `yadra configure`** (si `usesLlm`), le **SKILL** de la phase, et le **plan validate** (`prompts/plan-validate/<aspect>/`, sinon draft `prompts/plan/yadra/v1/`). **`--skip-llm`** pour CI / mode déterministe. Implémentation : [`command-context.mjs`](../yadra/cli/src/runtime/command-context.mjs) + [`registry.yaml`](../yadra/skills/registry.yaml).

| Binding | Commande | LLM | SKILL | Plan |
|---------|----------|-----|-------|------|
| `formalize:A` | `yadra formalize` (`.ksl` manquants) | oui | `formalize/partie-a-comprendre` | [`t1-comprendre-intention`](../prompts/plan-validate/yadra-t1/t1-comprendre-intention.plan.md) |
| `formalize:B` | `yadra formalize` (branche A+B si `.ksl` manquants) | oui | `formalize/partie-b-produire` | [`t1-produire-ksl`](../prompts/plan-validate/yadra-t1/t1-produire-ksl.plan.md) |
| `formalize:C` / `seal` | `yadra seal`, branche validate de `formalize` | **non** | `formalize/partie-c-livrer` | [`t1-livrer-ksl`](../prompts/plan-validate/yadra-t1/t1-livrer-ksl.plan.md) |
| `plan:A` | `yadra plan` | oui | `execute/partie-a-comprendre` | [`t2-comprendre-contrat`](../prompts/plan-validate/yadra-t2/t2-comprendre-contrat.plan.md) |
| `execute:B` | `yadra execute` | oui (sauf `--dry-run --skip-llm`) | `execute/partie-b-produire` | [`t2-produire-artefacts`](../prompts/plan-validate/yadra-t2/t2-produire-artefacts.plan.md) |
| `gate:C` | `yadra gate` | oui avec `--produce` ; **non** en conformance seule | `execute/partie-c-livrer` | [`t2-livrer-gate`](../prompts/plan-validate/yadra-t2/t2-livrer-gate.plan.md) |
| `strategies:reference` | `yadra strategies explain` | oui | `strategies/catalog` | (contexte T2, même aspect) |

Chaque plan validate documente le détail dans **§ Exécution du SKILL runtime** (comportement agent, interdits, fichiers `system.prompt.md`).

**Entrée utilisateur de `yadra formalize` (design) :**

```bash
yadra formalize /chemin/vers/dossier-formalisation
```

Le **dossier** contient :

| Élément | Rôle |
|---------|------|
| **`feature.yadra.md`** | Doc First **obligatoire**. Minimum : **description**, **kind: KSL**, **IsNew**, **related_specs**, **`ksl_levels`**, **`output_paths`** (relatifs à **`KSL_PROJECT_HOME`** — **cible d’écriture B**). Plans A/B : [`t1-comprendre-intention`](../prompts/plan-validate/yadra-t1/t1-comprendre-intention.plan.md), [`t1-produire-ksl`](../prompts/plan-validate/yadra-t1/t1-produire-ksl.plan.md). |
| **Autres fichiers contextuels** | Optionnels : PRD, tickets, notes, liens exportés — tout ce que le SKILL autorise à injecter avec `feature.yadra.md`. |

**Hors dossier, fixé par le moteur :**

- **`KSL_PROJECT_HOME`** (`yadra project`) → contrats KSL du monorepo specs (`root.project.ksl`, modules, specs).
- **`YADRA_PROJECT_HOME`** → distribution outils ; **`KSL_PROJECT_HOME`** / **`PROJECT_HOME`** → [`yadra project`](yadra-cli.md#ancrage-projet--yadra-project) · plan [`yadra-project-roots.md`](../prompts/plan/yadra/cli/yadra-project-roots.md).
- **SKILLS** résolus (dont le SKILL **formalize** + stack / conventions projet).

Le SKILL **formalize** (parties A/B/C) vit dans le **registre SKILLS du projet cible**. **A** : **`.compact.ksl`** sous `KSL_PROJECT_HOME/.yadra/tmp/<run-id>/` (effacé en fin de run). **B** : écrit les **`*.ksl`** à **`KSL_PROJECT_HOME` + `output_paths`** (restent dans le working tree ; commit Git = utilisateur). Contrats : plans A/B ci-dessus.

---

## 2. Timeline 1 — Formalisation

**Entrées :** dossier de formalisation (`feature.yadra.md` + contexte) + KSL existant sous **`KSL_PROJECT_HOME`** + SKILLS.

**Livrables KSL scellés (exemples) :**

- `*.project.ksl` (root, service, lib)
- `*.module.ksl` (modules de domaine métier)
- `*.spec.ksl` (bloc **`strategies`** : entrées nommées + `description` — **`budget`** au niveau spec — **pas** de fichier `.strategy.ksl` séparé)

**Boucle T1 :** A · COMPRENDRE → B · PRODUIRE → C · **LIVRER** (validate + seal) ; retour vers B si échec de validation ; arrêt monotone si ambiguïté.

**Scellement :** mécanisme interne Yadra (digest, phase) — **non écrit par l’humain** dans les fichiers KSL surface.

**Fichiers temporaires (T1, ex. `yadra formalize`) :** **A** écrit le compact sous `.yadra/tmp/<run-id>/` ; **B** écrit les **`.ksl` aux `output_paths`** sous le repo cible (hors `tmp/`). **À la fin de la commande**, Yadra **supprime** `.yadra/tmp/<run-id>/` uniquement ; les **`.ksl` produits par B restent** (non commités tant que l’utilisateur ne le fait pas).

---

## 3. Timeline 2 — Matérialisation

**Entrée exclusive :** KSL scellé T1. Aucun Doc First.

**Triade T2 :** A · COMPRENDRE → B · **PRODUIRE** (boucle sandbox/repair dans **`yadra execute`**) → C · **LIVRER** (**`yadra gate`**, kinds `outputs.phase.gate`). **B** s’applique à **`PROJECT_HOME`**, pas à **`YADRA_PROJECT_HOME`** ni **`KSL_PROJECT_HOME`** (specs).

**MVP T2 · A :** **`yadra plan`** — plan de compilation + résolution des **`yadra/strategies/ksl/*.strategy.ksl`** (pas de **`.code.ksl`**). Contrat : [`t2-comprendre-contrat.plan.md`](../prompts/plan-validate/yadra-t2/t2-comprendre-contrat.plan.md) v5.

**Routing `outputs` (KSL) :** `outputs.phase { execute gate }` — **execute** = codebase (`code`,`data`,`tests` par défaut) ; **gate** = `docs`,`e2e`, … Voir [`outputs.md`](ksl/reference/outputs.md).

**T2 · execute (CLI 0.1.7+) :** **`yadra execute`** — **LLM utilisateur** (`yadra configure`) + plan + SKILLS + **`*.strategy.ksl`** → code sous **`PROJECT_HOME`** (stack = **`root.project.ksl`**) ; sandbox Gradle + repair (`budget`). Contrat : [`t2-produire-artefacts.plan.md`](../prompts/plan-validate/yadra-t2/t2-produire-artefacts.plan.md) v5.

**`yadra gate`** : kinds **`phase.gate`** — CLI packagé **0.1.8+** (Conformance Gate + `--produce` docs/e2e).

CLI packagé **0.1.2+** : **`yadra plan`**. **0.1.3+** : **`yadra strategies`**. **0.1.5+** : **`yadra execute`** (T2 · B).

**Phase C · LIVRER** : SKILL + plans ; T2 **`gate --produce`** (IA opt.). **Oracle Conformance Gate** (verdict **sans** LLM) :  
`KSL scellé × (artefacts + preuves) ⟹ SATISFIED | VIOLATED | UNDECIDABLE`

- **VIOLATED** → retour B (réparation bornée)
- **UNDECIDABLE** → arbitrage humain / retour T1
- **SATISFIED** → VERIFIED RESULT BUNDLE

---

## 4. Conventions de layout (vérifiées par Yadra, non syntaxe KSL)

- Spec sous `services/<service>/modules/<domain>/`
- Fichier `<domain>.module.ksl` dans le même dossier
- Chaque spec : `module = "<domain>"` identique au dossier et à l’id du `*.module.ksl`
- Fichiers listés dans `specs = [...]` du module
- Optionnel : `depends_on_modules` (lien métier entre domaines), `related_specs` (variante / extension d’une spec)

---

## 5. `.yadra/` — temporaire vs durable

| Emplacement | Durée | Exemple |
|-------------|--------|---------|
| `.yadra/context.json` | Optionnel / legacy | Ancrage local ; préférer **`yadra project`** + `~/.config/yadra/projects.json` |
| `.yadra/sealed/` | Durable | Scellement T1 |
| `.yadra/bundles/` | Durable (T2) | Manifest gate / preuves |
| `.yadra/tmp/<run-id>/` | **Éphémère** | T1 : `.compact.ksl` (`KSL_PROJECT_HOME`) ; effacé en fin de run |
| Chemins **`output_paths`** sous repo cible | **Durable (working tree)** | Fichiers **`.ksl`** émis par **B** ; commit Git = utilisateur |

Règle : **tout** sous `.yadra/tmp/` (ou équivalent temp par run) est **effacé** quand la commande Yadra se termine.

---

## 6. Diagrammes architecture

| Document | Contenu |
|----------|---------|
| [`ksl-yadra-integrated-architecture.html`](ksl-yadra-integrated-architecture.html) | Deux timelines, boucles A–B–C, Conformance Gate |
| [`yadra-core-ksl-families.html`](yadra-core-ksl-families.html) | **Zoom cœur impl.** : 4 familles KSL → moteur, SKILLS, producteurs |
