# Yadra CLI — référence des commandes

> **Documentation canonique** : projet Next.js [`yadra/documentation/`](../yadra/documentation/README.md) (`npm run dev` / export statique `out/`).

**Yadra** est un **Spec-to-Code Binder** : il lie le code à la spec KSL scellée. La **CLI** s’installe localement (comme `kubectl` ou `gradle`). Le code source vit sur Git ; le binaire/script embarque ou résout la grammaire KSL. Les **fichiers `.ksl` métier** restent dans chaque repo applicatif. La spec se met à jour avec la feature ; un upgrade majeur ouvre une nouvelle spec — pas une pile de `.md` obsolètes.

Voir aussi : [`yadra-ksl-processing.md`](yadra-ksl-processing.md), [`ksl-distribution.md`](ksl-distribution.md).

## Installation

```bash
# depuis la racine du clone yadral :
./scripts/install-yadra-cli.sh
# ou
cd yadra/cli && npm install && npm link
```

Vérifier : `yadra doctor`

| Variable | Rôle |
|----------|------|
| **`KSL_HOME`** | Grammaire / libs embarquées dans le paquet CLI (`npm install @yadral/yadra`) — défaut auto au démarrage. |
| **`KSL_PROJECT_HOME`** | Racine du **monorepo specs KSL** (`root.project.ksl`, `kind = "root"`, modules, specs) — **auto-détectée** depuis le path/cwd. |
| **`PROJECT_HOME`** | Racine **cible** du code généré en T2 — **auto** via `repo.path` du root KSL (override : `--project-home` / registre). |

## Configuration minimale recommandée

```bash
# 1. Une fois par machine — LLM uniquement
yadra configure set --profile cursor --provider cursor --model composer-2.5-fast
yadra configure credentials --profile cursor --token "…"
yadra configure test

# 2. Produit : root.project.ksl (ou ksl/) + repo.path + prompts/
# 3. Quotidien — pas de project use
yadra make prompts/ma-feature/
```

## Ancrage projet (optionnel) : `yadra project`

Utile pour **alias multi-produits / CI** (`--project <name>`), pas pour le chemin quotidien :

```bash
yadra project add order-demo \
  --ksl-project-home /chemin/vers/monorepo-ksl \
  --project-home /chemin/vers/cible-code
yadra make prompts/checkout/ --project order-demo
```

## Flux quotidien (repo métier)

```bash
# Workspace auto-détecté depuis le path (root.project.ksl / ksl/ + repo.path)
yadra make prompts/checkout/
# depuis n'importe où :
# yadra make /chemin/vers/prompts/checkout/

# Override multi-produits / CI :
# yadra make prompts/checkout/ --project order-demo

# Mode expert (une spec) :
yadra validate path/to/order-checkout.spec.ksl --semantic
yadra seal path/to/order-checkout.spec.ksl
yadra plan path/to/order-checkout.spec.ksl --skip-llm
yadra execute path/to/order-checkout.spec.ksl --allow-unsealed
yadra gate path/to/order-checkout.spec.ksl --dry-run --skip-llm --allow-unsealed
```

---

## Commandes utilitaires

### `yadra version`

Affiche la version du CLI et la grammaire KSL active (`KSL_HOME` ou embarquée).

### `yadra doctor`

Contrôle : CLI sur PATH, Node, `KSL_HOME`, projet actif (`yadra project`), `grammar/ksl.ebnf`, `YADRA_API_URL` si CLI thin, extension VSIX (indication manuelle).

## Règle runtime T1 / T2 (sauf `validate`)

Toutes les commandes d’orchestration (**`formalize`**, **`seal`**, **`plan`**, **`strategies explain`**, …) :

1. **LLM** — profil / modèle **`yadra configure`** (+ `yadra project set-profile --model` si besoin) et **credentials**.
2. **SKILL** — entrée du registre `yadra/skills/registry.yaml` pour la phase (A/B/C T1, A T2, catalogue…).
3. **Plan** — **`prompts/plan-validate/<aspect>/`** si promu, sinon draft **`prompts/plan/yadra/v1/`**.

**`yadra validate`** reste **déterministe** (L0–L3, sans LLM). **`--skip-llm`** sur les autres commandes : mode extract / validate-seal seul (CI).

---

## `yadra validate [PATH]`

**PATH** : fichier `.ksl`, répertoire, ou `.` (défaut = répertoire courant). Validation **sans IA**.

| Niveau | Activation | Contenu |
|--------|------------|---------|
| **L0** | défaut | En-tête `ksl`, déclaration top-level, `{}` équilibrés |
| **L1** | `--syntax` | Chaînes fermées, pas de caractères illégaux hors commentaires |
| **L2** | `--layout` | Conventions layout (module/spec/project cohérents avec les chemins) |
| **L3** | `--semantic` | `outputs.kinds` vs blocs `data` / `docs` / `e2e` ; chaque `strategy "…"` exige `description` |

Flags :

- `--format human|json`
- Combinaison : `yadra validate --layout --semantic .`

Exit code : `0` succès, `1` échec, `2` usage.

---

## `yadra plan [PATH]`

**T2 dry-run** (CLI packagé **0.1.2+**) : pour une **spec** `.spec.ksl` déjà écrite, affiche kinds, data targets, budget, architecture/strategies — **sans** générer d’artefacts. Flags : `--format human|json`, `--kinds a,b`. Ce n’est **pas** l’étape **A · COMPRENDRE** T1 (Doc First + KSL existant + SKILLS → synthèse KSL ; voir [`yadra-ksl-processing.md`](yadra-ksl-processing.md)). Contrat T2 · A : [`t2-comprendre-contrat.plan.md`](../prompts/plan-validate/yadra-t2/t2-comprendre-contrat.plan.md).

```bash
yadra plan order-checkout.spec.ksl
yadra plan .   # résolution si une seule spec dans le cwd
```

---

## `yadra strategies list | show`

**T2 référence** (CLI packagé **0.1.3+**) : lit le catalogue embarqué `yadra/strategies/catalog.yaml` (noms canoniques pour `strategy "…"`, principes SOLID/DIY, GoF, baseline). **Aucune spec** requise.

```bash
yadra strategies list
yadra strategies list --family principles --format json
yadra strategies show SOLID
```

Doc site : page `strategies` (Timeline 2).

---

## `yadra execute [PATH]`

**T2 · execute** (CLI packagé **0.1.7+**) : **LLM de l’utilisateur** (`yadra configure` + credentials) + plan déterministe + SKILLS **`execute/partie-b-produire`** + **`yadra/strategies/*.strategy.ksl`** (un pass LLM par strategy) → code sous **`PROJECT_HOME`**. Stack/langage = **`root.project.ksl`** / service. Sandbox **`gradle test`** si `stack.build = "gradle"`. Kinds **`phase.gate`** → **`yadra gate`**. Prérequis : `yadra project`, validate, seal T1 (sauf dev), LLM (sauf `--dry-run --skip-llm`).

| Cible | Exemple |
|-------|---------|
| Spec (recommandé CI) | `yadra execute path/to/foo.spec.ksl` |
| Répertoire courant | `yadra execute .` (résolution automatique) |

Flags :

- `--allow-unsealed` — dev : sans seal T1 valide
- `--kinds code,tests` — sous-ensemble de **`outputs.phase.execute`** uniquement
- `--dry-run` — plan + phase ; aucune écriture
- `--no-verify` — PRODUIRE sans sandbox / repair
- `--skip-llm` — uniquement avec `--dry-run`
- `--combined` — un pass LLM (strategies = contraintes)
- `--merge` — autorise l’écriture sur un fichier déjà possédé

En production T2 stricte : pas de `--allow-unsealed` ; seal T1 frais requis.

---

## `yadra make [PATH]`

**Chemin quotidien (CLI 0.1.14+)** : une commande, du Doc First au code sous `PROJECT_HOME`. KSL reste l’IR (validate / seal) — plus besoin de l’écrire ni d’enchaîner `formalize` → `plan` → `execute` → `gate`.

`PATH` : dossier (`prompts/…` ou `.`), `feature.yadra.md`, ou `.spec.ksl`. Découvre les features, les ordonne (root → service → specs → module), puis :

1. **T1** `formalize` (validate + seal)
2. **T2** `execute` en **slice unique** (`--combined`) avec **merge** d’ownership
3. **T2** `gate` (sauf `--no-gate`)

```bash
yadra make prompts/momo-cm/
yadra make . --dry-run --skip-llm
yadra make prompts/momo-cm/specs/request-to-pay/ --step t2
```

Flags notables : `--step all|t1|t2|execute|gate`, `--no-gate`, `--no-combined`, `--no-merge`, `--force` (relance même si execute est frais), `--verbose` / `-v` (chemins et SKILL ; défaut = une ligne par étape), `--format json`.

Doc site : [`make`](../documentation/content/fr/make.md) (FR) · [`make`](../documentation/content/en/make.md) (EN).

Les commandes `formalize` / `execute` / `gate` restent le **mode expert**.

> Le binaire monorepo `ksl/tools/yadra/bin/yadra.mjs` conserve encore un stub Gate ; le **CLI packagé** implémente B réel via `yadra/cli`.

---

## `yadra gate [PATH]`

**T2 · C · LIVRER** (CLI packagé **0.1.8+**) : kinds **`outputs.phase.gate`**, Conformance Gate, manifest
`KSL_PROJECT_HOME/.yadra/bundles/<spec-id>/manifest.json`. Evidence **`execute`** écrite par `yadra execute`.

| Flag | Rôle |
|------|------|
| `--dry-run` | Plan gate + SKILL C |
| `--produce` | LLM : docs/e2e sous `PROJECT_HOME` avant le gate |
| `--allow-no-execute` | Dev sans preuve B |
| `--format json` | Payload machine |

Sortie : `SATISFIED` | `VIOLATED` | `UNDECIDABLE` (codes 0 / 1 / 2)

```bash
yadra gate order-checkout.spec.ksl
yadra gate order-checkout.spec.ksl --dry-run --skip-llm --allow-unsealed
yadra gate order-checkout.spec.ksl --produce --allow-unsealed
```

SKILL : [`yadra/skills/execute/partie-c-livrer/SKILL.md`](../yadra/skills/execute/partie-c-livrer/SKILL.md).

---

## `yadra seal [SPEC.spec.ksl]`

**T1 · C · LIVRER** (MVP) : validation L0+L2+L3 (option `--syntax` pour L1), puis écriture de **`KSL_PROJECT_HOME/.yadra/sealed/<spec-id>.json`** (digests SHA-256 de la spec, du module sibling, et fichiers `--include`).

```bash
yadra seal path/to/member-creation.spec.ksl
yadra seal path/to/foo.spec.ksl --include path/to/root.project.ksl
```

SKILL : [`yadra/skills/formalize/partie-c-livrer/SKILL.md`](../yadra/skills/formalize/partie-c-livrer/SKILL.md).

---

## `yadra formalize <dossier>` (T1 — implémenté)

**Timeline 1** : **une commande** enchaîne **A · COMPRENDRE → B · PRODUIRE → C · LIVRER** (LLM + SKILLS formalize si les `.ksl` des `output_paths` manquent), puis **validate + seal** lorsque les fichiers sont présents.

```bash
yadra project use mon-projet
yadra formalize ./ma-feature-formalisation/
```

**Dossier d’entrée :**

- **`feature.yadra.md`** (requis) — Doc First ; **`output_paths`** (`spec` obligatoire, `module` / `root` si besoin).
- Pièces jointes optionnelles (PRD, notes).

**Branches :** A+B in-process (sauf `--skip-llm`) → écriture sous **`KSL_PROJECT_HOME`** ; C = validate L0–L3 + `seal`. Plans : [`t1-comprendre-intention`](../prompts/plan-validate/yadra-t1/t1-comprendre-intention.plan.md), [`t1-produire-ksl`](../prompts/plan-validate/yadra-t1/t1-produire-ksl.plan.md), [`t1-livrer-ksl`](../prompts/plan-validate/yadra-t1/t1-livrer-ksl.plan.md).

---

## Commandes futures (catalogue design)

| Commande | Timeline | Rôle |
|----------|----------|------|
| `yadra explain` | — | Résumé intention / scope / outputs |
| `yadra graph` | — | Modules et dépendances |
| `yadra init` | — | Squelette layout minimal |
| `yadra bundle` | T2 | Export VERIFIED RESULT BUNDLE |

Alias documentés : `validate` = `check` / `lint` ; `execute` = `run` / `materialize` (non enregistrés en MVP).

---

## Implémentation

Package Node : [`tools/yadra/`](../tools/yadra/). Phases :

CLI packagé **0.1.14** : transversal + **T1** (`formalize`, `validate`, `seal`) + **T2** (`plan`, `execute`, `gate`, `make`, `strategies`).

Parser EBNF complet (L1 strict) : [`docs/ksl-validator-roadmap.md`](ksl-validator-roadmap.md).
