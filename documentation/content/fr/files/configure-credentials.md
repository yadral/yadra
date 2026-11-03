---
title: Fichiers configure & credentials
description: Format et sécurité des fichiers ~/.config/yadra/configure et ~/.config/yadra/credentials.
---

Yadra sépare la configuration des profils LLM (`configure`) et les secrets d'authentification (`credentials`) dans le répertoire utilisateur `~/.config/yadra/`.

## Arborescence

```text
~/.config/yadra/
  configure      # Paramètres des profils (fournisseur, modèle, endpoint) — permissions 0644
  credentials    # Secrets d'authentification (token, username/password) — permissions 0600
  projects.json  # Registre des projets Yadra
```

## Aperçu de `~/.config/yadra/configure`

Chaque section définit un profil nommé. Le profil principal porte le nom `[default]` ; les profils additionnels utilisent l'en-tête `[profile <nom>]`.

```ini
[default]
provider = anthropic
model = claude-sonnet-4-20250514
timeout = 60000

[profile openai-prod]
provider = openai
model = gpt-4.1
base_url = https://api.openai.com/v1

[profile local-gateway]
provider = custom
model = qwen-2.5-coder-32b
base_url = http://127.0.0.1:11434/v1
```

### Clés supportées dans `configure`

| Clé | Requis | Description |
|-----|--------|-------------|
| `provider` | Oui | Fournisseur LLM (`anthropic`, `openai`, `mistral`, `ollama`, `custom`). |
| `model` | Oui | Identifiant du modèle utilisé lorsque ni la commande ni le projet enregistré ne le surchargent. |
| `base_url` | Non | URL de base de l'API du fournisseur. |
| `timeout` | Non | Délai d'expiration des requêtes HTTP en millisecondes. |

## Aperçu de `~/.config/yadra/credentials`

Le fichier `credentials` associe à chaque profil soit un jeton (`token`), soit un couple identifiant / mot de passe (`username` / `password`).

```ini
[default]
token = sk-ant-api03-98a7b6c5d4e3f2a1

[profile openai-prod]
token = sk-proj-1122334455667788

[profile local-gateway]
username = yadra-runner
password = SecretInterne!2026
```

## Variables d'environnement (surcharge CI/CD)

Dans les environnements d'intégration continue, vous pouvez fournir l'authentification sans écrire de fichier `credentials` sur le disque :

| Variable | Description |
|----------|-------------|
| `YADRA_PROFILE` | Sélectionne le profil actif dans `configure`. |
| `YADRA_MODEL` | Surcharge le modèle LLM pour la session. |
| `YADRA_LLM_TOKEN` | Jeton API ou Bearer prioritaire sur le fichier `credentials`. |
| `YADRA_LLM_USERNAME` | Identifiant de connexion prioritaire sur `credentials`. |
| `YADRA_LLM_PASSWORD` | Mot de passe prioritaire sur `credentials`. |
