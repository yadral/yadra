---
title: yadra project
description: Alias optionnels (KSL + code), override --project, export shell — pas requis au quotidien avec l'auto-detect.
---

Un **projet Yadra** est un couple de dépôts :

- **`kslProjectHome`** — specs KSL (`KSL_PROJECT_HOME`)
- **`projectHome`** — code applicatif généré (`PROJECT_HOME`)

Les chemins enregistrés sont **toujours absolus**.

> **CLI ≥ 0.1.15 :** pour un seul produit, préférez l’[auto-detect](/docs/overview/#configuration-minimale-recommandée) (`root.project.ksl` + `repo.path`). `yadra project` reste utile pour les **alias multi-produits / CI** (`--project <name>`), pas comme étape quotidienne.

## Synopsis

```bash
yadra project list
yadra project add <name> --ksl-project-home <path> [options]
yadra project update <name> [options]
yadra project set-profile [<name>] --profile <profile> [--model <id>]
yadra project use <name>
yadra project show [name]
yadra project export
yadra project remove <name>
yadra project clear
```

Registre : [`projects.json`](/docs/files/projects-json/) dans `~/.config/yadra/`.

## Sous-commandes

| Sous-commande | Description |
|---------------|-------------|
| `list` | Liste les projets enregistrés (KSL home, project home, `*` = courant). |
| `add` | Valide le root KSL, enregistre le projet ; devient courant sauf `--no-current`. |
| `update` | Met à jour les chemins ou le LLM d’un projet existant. |
| `set-profile` | Change le profil `configure` et/ou le modèle (sans revalider les chemins KSL). |
| `use` | Active un projet enregistré. |
| `show` | Affiche le projet courant ou un projet nommé. |
| `export` | `export` shell pour le projet courant (`YADRA_PROJECT`, `KSL_PROJECT_HOME`, …). |
| `remove` | Supprime un projet du registre (pas le courant). |
| `clear` | Désactive le projet courant sans supprimer le registre. |

## Options (`add` / `update`)

| Option | Description |
|--------|-------------|
| `--ksl-project-home <path>` | Monorepo specs (`*.project.ksl`, `kind = "root"`). Enregistré en chemin absolu. |
| `--project-home <path>` | Dépôt code applicatif. |
| `--yadra-project-home <path>` | Distribution Yadra (souvent auto depuis le paquet CLI). |
| `--model <id>` | Modèle LLM par défaut pour ce projet. |
| `--profile <nom>` | Profil `yadra configure`. |
| `--no-current` | (`add` seulement) n’active pas le projet après création. |

## Exemples

```bash
yadra project add tontine \
  --ksl-project-home /Users/mac/tontine-ksl \
  --project-home /Users/mac/tontine-app \
  --profile default

yadra project add order-service \
  --ksl-project-home /Users/mac/platform-ksl \
  --project-home /Users/mac/order-app \
  --no-current

yadra project list
yadra project use order-service
yadra validate ksl/services/order-service/modules/checkout/order-checkout.spec.ksl

# Profil LLM dédié à ce microservice
yadra project set-profile order-service --profile prod --model claude-sonnet-4-20250514
# ou sur le projet courant :
yadra project set-profile --profile dev

eval "$(yadra project export)"
```

## Surcharge ponctuelle

Sur `formalize`, `validate`, `seal`, `plan` :

- `--project <name>` — utilise un projet enregistré sans changer le courant
- `--ksl-project-home`, `--project-home`, `--yadra-project-home` — comme avant (CI)

Variable d’environnement : **`YADRA_PROJECT=<name>`** (équivalent session à `use`).

## Ordre de résolution

1. Flags `--ksl-project-home`, `--project-home`, `--project`
2. Variables d’environnement `KSL_PROJECT_HOME`, `PROJECT_HOME`, `YADRA_PROJECT`
3. Projet **`current`** dans `projects.json`
