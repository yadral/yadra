---
title: configure
description: Configures LLM providers, model profiles, and authentication credentials.
---

The `yadra configure` command manages connection settings for Large Language Model (LLM) providers as well as authentication secrets (API tokens, access keys, or username/password credentials).

## Synopsis

```bash
yadra configure
yadra configure set --profile <name> [options]
yadra configure credentials --profile <name> [options]
yadra configure get <key> [ --profile <name> ]
yadra configure list
```

> **Description:** Saves LLM provider settings in `~/.config/yadra/configure` and stores authentication secrets separately in `~/.config/yadra/credentials` with restricted file permissions (`0600`).

## Options

### `yadra configure set`

| Option | Description |
|--------|-------------|
| `--profile <name>` | Profile name to create or update (`default` when omitted). |
| `--provider <id>` | Provider identifier (`anthropic`, `openai`, `mistral`, `ollama`, `custom`). |
| `--model <id>` | Default model identifier associated with this profile. |
| `--base-url <url>` | Endpoint URL (for internal enterprise gateways or local servers). |
| `--timeout <ms>` | Maximum request timeout in milliseconds (e.g., `60000`). |

### `yadra configure credentials`

| Option | Description |
|--------|-------------|
| `--profile <name>` | Target profile (`default` when omitted). |
| `--token <value>` | Bearer authentication token or API key. |
| `--username <login>` | Account username (for login/password authentication). |
| `--password <secret>` | Password paired with `--username`. |
## Complete Examples

### 1. List profiles

Without a subcommand, `configure` is equivalent to `configure list`:

```bash
yadra configure
```

```text
PROFILE            PROVIDER    MODEL                        AUTH    BASE_URL
default            anthropic   claude-sonnet-4-20250514     token   -
```

### 2. Non-interactive setup with API token

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

### 3. Enterprise gateway with username and password

```bash
yadra configure set \
  --profile internal-gateway \
  --provider custom \
  --model llama-3.3-70b-instruct \
  --base-url https://llm.corp.internal/v1

yadra configure credentials \
  --profile internal-gateway \
  --username "svc-yadra-formalizer" \
  --password "ComplexSecret!2026"
```

### 4. List configured profiles

```bash
yadra configure list
```

Output:

```text
PROFILE            PROVIDER    MODEL                        AUTH       BASE_URL
default            anthropic   claude-sonnet-4-20250514     token      (default)
prod-spec          openai      gpt-4.1                      token      https://api.openai.com/v1
internal-gateway   custom      llama-3.3-70b-instruct       login      https://llm.corp.internal/v1
```

### 5. Read a configuration key

`get` reads only the non-secret `configure` file. This command never prints
credentials.

```bash
yadra configure get model --profile prod-spec
# -> gpt-4.1
```

## Generated Files Preview

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
password = ComplexSecret!2026
```

See [configure & credentials files](/docs/en/files/configure-credentials/) for precedence rules and CI/CD environment variables.
