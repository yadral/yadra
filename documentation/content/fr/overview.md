---
title: Vue d'ensemble
description: Yadra Spec-to-Code Binder — CLI (v0.1.9) T1, plan T2, execute, gate (phase.gate).
---

**Yadra** est un **Spec-to-Code Binder** : il lie le code applicatif à une spec **KSL (Kom Specification Language)** scellée. La spec **est** le document de la feature — on n’accumule pas de `.md` devenus brouillons obsolètes. Elle se met à jour quand la feature évolue ; un upgrade majeur ouvre une **nouvelle spec**.

La **CLI** formalise l’intention en contrat KSL vérifié et scellé (**Timeline 1**), puis orchestre la matérialisation du code collé à ce contrat (**Timeline 2**).

## Installation

### 1. Depuis le paquet `.tgz` (recommandé pour les développeurs)

```bash
npm install -g ./yadral-yadra-0.1.3.tgz
yadra version
```

`YADRA_PROJECT_HOME` et `KSL_HOME` sont résolus automatiquement depuis la distribution embarquée dans le paquet. Aucun clone du dépôt outil ni option `--yadra-project-home` n'est nécessaire au quotidien.

### 2. Générer le paquet (release) ou développer dans le monorepo

```bash
cd yadra/cli
npm run pack:release   # produit yadral-yadra-0.1.3.tgz
npm link               # optionnel pour les mainteneurs
```

Processus complet (build, GitHub Release, install) : [Package process](/docs/package-process/).

Grammaire et sémantique du langage : basculer vers **[KSL](/docs/ksl/overview/)** (menu en-tête **Yadra | KSL**).

## Architecture des répertoires

Yadra sépare strictement la distribution de l'outil, le dépôt des spécifications KSL et le dépôt du code applicatif généré :

| Variable | Rôle |
|----------|------|
| `YADRA_PROJECT_HOME` | Racine de la distribution Yadra et de la grammaire KSL (`ksl/grammar/ksl.ebnf`). |
| `KSL_PROJECT_HOME` | Racine du projet contenant les spécifications `.project.ksl`, `.module.ksl` et `.spec.ksl`. |
| `PROJECT_HOME` | Racine du projet applicatif cible généré à partir des spécifications KSL. |
| `KSL_HOME` | Répertoire du pack langage KSL (`$YADRA_PROJECT_HOME/ksl`). |

Exportez ces variables dans votre session shell courante via :

```bash
eval "$(yadra project export)"
```

## Fichiers de configuration

| Fichier | Portée | Rôle |
|---------|--------|------|
| `yadra/manifest.mf` | Distribution | Manifeste officiel contenant l'attribut `version` du CLI. |
| `~/.config/yadra/configure` | Utilisateur | Profils de fournisseurs et modèles LLM par défaut. |
| `~/.config/yadra/credentials` | Utilisateur | Jetons d'accès, clés d'API ou identifiants de connexion (`chmod 600`). |
| `~/.config/yadra/projects.json` | Utilisateur | Registre des projets et projet courant (`current`). |

## Commandes CLI

### CLI — Transversal

| Commande | Description |
|----------|-------------|
| [`yadra version`](/docs/version/) | Affiche la version CLI (`yadra/manifest.mf`), la grammaire KSL et le projet actif. |
| [`yadra help`](/docs/help/) | Affiche la liste des commandes disponibles ou l'aide détaillée d'une sous-commande (`yadra <commande> -h`). |
| [`yadra configure`](/docs/configure/) | Configure les profils LLM et enregistre les clés ou identifiants d'authentification. |
| [`yadra project`](/docs/project/) | Enregistre plusieurs projets (KSL + code), `use` pour changer de projet actif. |
| `yadra doctor` | Vérifie Node.js (≥ 18), la grammaire KSL et le projet actif. |

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

## Flux standard Timeline 1

```bash
# 1. Configurer le fournisseur LLM
yadra configure set --profile default --provider anthropic --model claude-sonnet-4-20250514
yadra configure credentials --profile default --token "sk-ant-..."

# 2. Enregistrer et activer un projet
yadra project add tontine \
  --ksl-project-home ~/projets/tontine-ksl \
  --project-home ~/projets/tontine-app \
  --model claude-sonnet-4-20250514

# 3. Formaliser et sceller une fonctionnalité à partir de son dossier de contexte
yadra formalize ./contexte/member-creation/ --seal

# 4. Plan de compilation T2 (dry-run, phase execute / gate)
yadra plan ./ksl/services/tontine-service/modules/members/member-creation.spec.ksl

# 5. Matérialisation T2 (phase.execute)
yadra execute ./ksl/services/tontine-service/modules/members/member-creation.spec.ksl --dry-run --skip-llm
```

Diagrammes et évolution T2 (produire vs execute) : [Architecture](/docs/architecture/).
