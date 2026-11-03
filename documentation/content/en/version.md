---
title: version
description: Displays the official Yadra CLI version read from yadra/manifest.mf along with the active KSL environment state.
---

The `yadra version` command prints the exact version of Yadra CLI, the loaded KSL grammar version, and the resolved workspace roots.

## Synopsis

```bash
yadra version [options]
```

> **Description:** Reads the `version` attribute declared in `yadra/manifest.mf`, verifies the presence of `ksl.ebnf` under `KSL_HOME`, and prints the active workspace paths.

## Options

| Option | Description |
|--------|-------------|
| `--format human\|json` | Output format (`human` by default, `json` for CI/CD scripts). |
| `-h`, `--help` | Displays help for the `version` command. |

## Version Source (`yadra/manifest.mf`)

The authoritative version of the CLI and documentation is governed by `yadra/manifest.mf`:

```ini
Manifest-Version: 1.0
name: yadra
version: 0.1.3
```

## Examples

### Standard output

```bash
yadra version
```

Output:

```text
yadra CLI: 0.1.3
KSL_HOME: /opt/yadra/ksl
grammar: /opt/yadra/ksl/grammar/ksl.ebnf (found)
grammar version: 1.0
YADRA_PROJECT: tontine
KSL_PROJECT_HOME: /Users/dev/tontine-ksl
PROJECT_HOME: /Users/dev/tontine-app
YADRA_PROJECT_HOME: /opt/yadra
```

### JSON output for automation

```bash
yadra version --format json
```

Output:

```json
{
  "name": "yadra",
  "version": "0.1.3",
  "grammarVersion": "1.0",
  "kslHome": "/opt/yadra/ksl",
  "grammar": "/opt/yadra/ksl/grammar/ksl.ebnf",
  "grammarFound": true,
  "yadraProject": "tontine",
  "kslProjectHome": "/Users/dev/tontine-ksl",
  "projectHome": "/Users/dev/tontine-app",
  "yadraProjectHome": "/opt/yadra",
  "llm": {}
}
```
