---
title: configure & credentials Files
description: Format and security rules for ~/.config/yadra/configure and ~/.config/yadra/credentials.
---

Yadra separates LLM profile configuration (`configure`) from authentication secrets (`credentials`) inside the user directory `~/.config/yadra/`.

## Directory Layout

```text
~/.config/yadra/
  configure      # Profile parameters (provider, model, endpoint) — mode 0644
  credentials    # Authentication secrets (token, username/password) — mode 0600
  projects.json  # Yadra project registry
```

## `~/.config/yadra/configure` Preview

Each section defines a named profile. The default profile uses `[default]`; additional profiles use `[profile <name>]`.

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

### Supported Keys in `configure`

| Key | Required | Description |
|-----|----------|-------------|
| `provider` | Yes | LLM provider (`anthropic`, `openai`, `mistral`, `ollama`, `custom`). |
| `model` | Yes | Model identifier used when neither CLI flags nor the registered project override it. |
| `base_url` | No | Base URL for the provider API. |
| `timeout` | No | HTTP request timeout in milliseconds. |

## `~/.config/yadra/credentials` Preview

The `credentials` file pairs each profile with either an API token (`token`) or login credentials (`username` / `password`).

```ini
[default]
token = sk-ant-api03-98a7b6c5d4e3f2a1

[profile openai-prod]
token = sk-proj-1122334455667788

[profile local-gateway]
username = yadra-runner
password = InternalSecret!2026
```

## Environment Variables (CI/CD Overrides)

In automated pipelines, credentials can be supplied via environment variables without writing a `credentials` file to disk:

| Variable | Description |
|----------|-------------|
| `YADRA_PROFILE` | Selects the active profile from `configure`. |
| `YADRA_MODEL` | Overrides the LLM model for the session. |
| `YADRA_LLM_TOKEN` | API or Bearer token taking precedence over `credentials`. |
| `YADRA_LLM_USERNAME` | Login username taking precedence over `credentials`. |
| `YADRA_LLM_PASSWORD` | Login password taking precedence over `credentials`. |
