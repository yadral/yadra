---
title: configure
description: Configure les fournisseurs LLM, les profils de modèles et les identifiants d'authentification.
---

La commande `yadra configure` gère les paramètres de connexion aux fournisseurs de modèles de langage (LLM) ainsi que les secrets d'authentification (jetons API, clés d'accès ou couples identifiant/mot de passe).

## Configuration minimale recommandée

C’est **la seule config utilisateur requise** au quotidien (CLI ≥ 0.1.15). Le workspace KSL/code est auto-détecté par [`yadra make`](/docs/make/) — pas besoin de `yadra project use` pour un seul produit.

```bash
# Une fois par machine
yadra configure set --profile cursor --provider cursor --model composer-2.5-fast
yadra configure credentials --profile cursor --token "VOTRE_CLE_CRSR"
yadra configure test

# Ensuite
yadra make prompts/ma-feature/
```

Vue d’ensemble : [Configuration minimale recommandée](/docs/overview/#configuration-minimale-recommandée).

## Synopsis

```bash
yadra configure
yadra configure set --profile <nom> [options]
yadra configure credentials --profile <nom> [options]
yadra configure get <clé> [ --profile <nom> ]
yadra configure list
```

> **Description :** Enregistre les paramètres des fournisseurs LLM dans `~/.config/yadra/configure` et stocke les secrets de manière isolée dans `~/.config/yadra/credentials` avec des permissions restreintes (`0600`).

## Options

### `yadra configure set`

| Option | Description |
|--------|-------------|
| `--profile <nom>` | Nom du profil à créer ou modifier (`default` si omis). |
| `--provider <id>` | Identifiant du fournisseur (`anthropic`, `openai`, `mistral`, `ollama`, `custom`). |
| `--model <id>` | Identifiant du modèle par défaut associé à ce profil. |
| `--base-url <url>` | URL de l'endpoint API (pour passerelle interne ou serveur local). |
| `--timeout <ms>` | Délai maximal par requête en millisecondes (ex. `60000`). |

### `yadra configure credentials`

| Option | Description |
|--------|-------------|
| `--profile <nom>` | Profil cible (`default` si omis). |
| `--token <valeur>` | Jeton d'authentification Bearer ou clé API (`api_key`). |
| `--username <login>` | Identifiant utilisateur (pour authentification par compte). |
| `--password <secret>` | Mot de passe associé à `--username`. |
## Exemples complets

### 1. Lister les profils

Sans sous-commande, `configure` est équivalent à `configure list` :

```bash
yadra configure
```

```text
PROFILE            PROVIDER    MODEL                        AUTH    BASE_URL
default            anthropic   claude-sonnet-4-20250514     token   -
```

### 2. Configuration directe par options (jeton API)

```bash
yadra configure set \
  --profile prod-spec \
  --provider openai \
  --model gpt-4.1 \
  --base-url https://api.openai.com/v1

yadra configure credentials \
  --profile prod-spec \
  --token "sk-proj-9f8a7b6c5d4e3f2a1b"
```

### 3. Configuration avec identifiant et mot de passe (passerelle d'entreprise)

```bash
yadra configure set \
  --profile internal-gateway \
  --provider custom \
  --model llama-3.3-70b-instruct \
  --base-url https://llm.corp.internal/v1

yadra configure credentials \
  --profile internal-gateway \
  --username "svc-yadra-formalizer" \
  --password "MotDePasseComplexe!2026"
```

### 4. Inspecter les profils configurés

```bash
yadra configure list
```

Sortie :

```text
PROFILE            PROVIDER    MODEL                        AUTH       BASE_URL
default            anthropic   claude-sonnet-4-20250514     token      (default)
prod-spec          openai      gpt-4.1                      token      https://api.openai.com/v1
internal-gateway   custom      llama-3.3-70b-instruct       login      https://llm.corp.internal/v1
```

### 5. Lire une valeur spécifique

`get` lit uniquement le fichier non secret `configure`. Les secrets ne sont jamais
affichés par cette commande.

```bash
yadra configure get model --profile prod-spec
# -> gpt-4.1
```

## Aperçu des fichiers générés

### `~/.config/yadra/configure`

```ini
[default]
provider = anthropic
model = claude-sonnet-4-20250514

[profile prod-spec]
provider = openai
model = gpt-4.1
base_url = https://api.openai.com/v1

[profile internal-gateway]
provider = custom
model = llama-3.3-70b-instruct
base_url = https://llm.corp.internal/v1
timeout = 90000
```

### `~/.config/yadra/credentials`

```ini
[default]
token = sk-ant-api03-xxxx

[profile prod-spec]
token = sk-proj-9f8a7b6c5d4e3f2a1b

[profile internal-gateway]
username = svc-yadra-formalizer
password = MotDePasseComplexe!2026
```

Consultez également la page [Fichiers configure & credentials](/docs/files/configure-credentials/) pour les règles de priorité et les variables d'environnement en intégration continue.
