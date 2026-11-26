---
title: Vue d'ensemble
description: Yadra Spec-to-Code Binder — CLI (v0.1.15) T1, T2, yadra make (chemin quotidien, auto-detect).
---

**Yadra** est un **Spec-to-Code Binder** : il lie le code applicatif à une spec **KSL (Kom Specification Language)** scellée. La spec **est** le document de la feature — on n’accumule pas de `.md` devenus brouillons obsolètes. Elle se met à jour quand la feature évolue ; un upgrade majeur ouvre une **nouvelle spec**.

La **CLI** formalise l’intention en contrat KSL vérifié et scellé (**Timeline 1**), puis orchestre la matérialisation du code collé à ce contrat (**Timeline 2**).

## Installation

### 1. Depuis le paquet `.tgz` (recommandé pour les développeurs)

```bash
npm install -g ./yadral-yadra-0.1.15.tgz
yadra version
```

`YADRA_PROJECT_HOME` et `KSL_HOME` sont résolus automatiquement depuis la distribution embarquée dans le paquet. Aucun clone du dépôt outil ni option `--yadra-project-home` n'est nécessaire au quotidien.

### 2. Générer le paquet (release) ou développer dans le monorepo

```bash
cd yadra/cli
npm run pack:release   # produit yadral-yadra-0.1.15.tgz
npm link               # optionnel pour les mainteneurs
```

Processus complet (build, GitHub Release, install) : [Package process](/docs/package-process/).

Grammaire et sémantique du langage : basculer vers **[KSL](/docs/ksl/overview/)** (menu en-tête **Yadra | KSL**).

## Configuration minimale recommandée

Pour le quotidien, **une seule configuration machine** suffit : le profil LLM. Le workspace (specs + code) est **auto-détecté** depuis le chemin passé à `yadra make` (ou le `cwd`).

### 1. Une fois par machine — LLM

```bash
# Clé crsr_… : provider cursor (défaut api2.cursor.sh — pas de base-url requis)
yadra configure set --profile cursor --provider cursor --model composer-2.5-fast
yadra configure credentials --profile cursor --token "VOTRE_CLE_CRSR"
yadra configure test
# Prérequis : CLI Cursor (`cursor agent`). Alternative : --provider openai + clé sk-…
```

Détails : [`yadra configure`](/docs/configure/).

### 2. Dans le produit — KSL prêt pour l’auto-detect

| Élément | Rôle |
|---------|------|
| `root.project.ksl` avec `kind = "root"` | À la racine du monorepo KSL, **ou** sous un dossier `ksl/` |
| `repo { path = "…" }` | Chemin vers le code applicatif (`PROJECT_HOME`), relatif au root KSL |
| Dossier Doc First | `intention.md` + `feature.yadra.md` (ex. `prompts/…`) |

Exemple d’arbre :

```text
mon-produit/
  ksl/
    root.project.ksl          # repo.path = "../root"
    services/…
  root/                       # PROJECT_HOME (code généré)
  prompts/
    ma-feature/
      intention.md
      feature.yadra.md
```

### 3. Quotidien — une commande

```bash
yadra make prompts/ma-feature/
# depuis n'importe quel répertoire :
yadra make /chemin/vers/mon-produit/prompts/ma-feature/
```

**Pas besoin** de `yadra project use`, ni d’exporter `KSL_PROJECT_HOME` / `PROJECT_HOME` / `eval "$(yadra project export)"` au quotidien.

Contrôle sans LLM :

```bash
yadra make prompts/ma-feature/ --dry-run --skip-llm --format json
```

### Optionnel — multi-produits / CI

[`yadra project`](/docs/project/) reste utile pour un **alias** (`--project <name>`) ou un override explicite des chemins. Ce n’est **pas** requis pour un seul produit avec auto-detect.

```bash
yadra project add tontine --ksl-project-home …/ksl --project-home …/root
yadra make prompts/ma-feature/ --project tontine
```

## Architecture des répertoires

Yadra sépare la distribution de l’outil, les specs KSL et le code applicatif. En usage quotidien ces racines sont **déduites** (paquet CLI + auto-detect) ; les variables restent utiles en CI ou en override.

| Variable | Rôle | Résolution quotidienne |
|----------|------|------------------------|
| `YADRA_PROJECT_HOME` / `KSL_HOME` | Distribution + grammaire KSL | Auto depuis le paquet CLI |
| `KSL_PROJECT_HOME` | Specs (`.project.ksl`, `.module.ksl`, `.spec.ksl`) | Auto : walk-up vers `root.project.ksl` ou `ksl/` |
| `PROJECT_HOME` | Code généré (T2) | Auto : `repo.path` du root KSL |

Overrides : `--project`, `--ksl-project-home`, `--project-home`, ou registre [`projects.json`](/docs/files/projects-json/).

## Fichiers de configuration

| Fichier | Portée | Rôle |
|---------|--------|------|
| `yadra/manifest.mf` | Distribution | Manifeste officiel contenant l'attribut `version` du CLI. |
| `~/.config/yadra/configure` | Utilisateur | **Requis** — profils de fournisseurs et modèles LLM. |
| `~/.config/yadra/credentials` | Utilisateur | **Requis** — jetons / clés (`chmod 600`). |
| `~/.config/yadra/projects.json` | Utilisateur | **Optionnel** — alias multi-produits (`--project`). |

## Commandes CLI

### CLI — Transversal

| Commande | Description |
|----------|-------------|
| [`yadra version`](/docs/version/) | Affiche la version CLI (`yadra/manifest.mf`), la grammaire KSL et le projet actif. |
| [`yadra help`](/docs/help/) | Affiche la liste des commandes disponibles ou l'aide détaillée d'une sous-commande (`yadra <commande> -h`). |
| [`yadra configure`](/docs/configure/) | Configure les profils LLM et enregistre les clés ou identifiants d'authentification. |
| [`yadra project`](/docs/project/) | Alias optionnels (KSL + code) ; override via `--project`. |
| `yadra doctor` | Vérifie Node.js (≥ 18), la grammaire KSL et le workspace. |

### Timeline 1 (T1)

| Commande | Description |
|----------|-------------|
| [`yadra formalize`](/docs/formalize/) | **T1 complet** : A→B→C (LLM si `.ksl` manquants) ; sinon validate + seal. |
| [`yadra validate`](/docs/validate/) | Vérifie la conformité structurelle (L0), syntaxique (L1), d'arborescence (L2) et sémantique (L3) des fichiers KSL. |
| [`yadra seal`](/docs/seal/) | Valide formellement une spécification KSL et génère son empreinte cryptographique dans `.yadra/sealed/`. |

### Timeline 2 (T2)

| Commande | Description |
|----------|-------------|
| [`yadra plan`](/docs/plan/) | Plan de compilation depuis une `.spec.ksl` (dry-run, `--format human\|json`). |
| [`yadra strategies`](/docs/strategies/) | Catalogue interne des noms `strategy` (`list` / `show`, `--format json`). |
| [`yadra execute`](/docs/execute/) | **B · PRODUIRE** — `phase.execute` + boucle sandbox/repair → `PROJECT_HOME` (v0.1.7). |
| `yadra gate` | **C · LIVRER** — `phase.gate` (docs, e2e) ; voir [Architecture](/docs/architecture/). |
| [`yadra make`](/docs/make/) | **Chemin quotidien** — T1 + T2 en une commande (v0.1.15, auto-detect). |

## Flux standard

```bash
# Une fois (machine) : LLM — voir Configuration minimale recommandée
yadra configure set --profile cursor --provider cursor --model composer-2.5-fast
yadra configure credentials --profile cursor --token "VOTRE_CLE_CRSR"

# Quotidien : Doc First → code (workspace auto-détecté)
yadra make ./contexte/member-creation/

# Mode expert — une spec :
# yadra formalize ./contexte/member-creation/ --seal
# yadra execute ./ksl/services/tontine-service/modules/members/member-creation.spec.ksl
```

Diagrammes et évolution T2 (produire vs execute) : [Architecture](/docs/architecture/).
