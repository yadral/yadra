---
title: validate
description: Verifies structural, syntactic, layout, and semantic conformance of KSL files.
---

The `yadra validate` command runs the deterministic KSL formal verifier (100% AI-free) on a single `.ksl` file or recursively across a directory.

## Synopsis

```bash
yadra validate [PATH] [options]
```

> **Description:** Inspects a `.ksl` file or all `.ksl` files within a directory (defaulting to `.` under `KSL_PROJECT_HOME`) against the selected validation levels and exits with code `0` only if all checks pass.

## Arguments

| Argument | Description |
|----------|-------------|
| `PATH` | Path to a `.ksl` file, a directory, or `.` to validate the current directory from `KSL_PROJECT_HOME`. |

## Options

| Option | Level | Description |
|--------|-------|-------------|
| *(always enabled)* | **L0** | Checks the `ksl 1.0` header, top-level declaration (`project`, `module`, `spec`), and balanced `{ }` blocks. |
| `--syntax` | **L1** | Checks lexical and syntactic conformance against the KSL grammar. |
| `--layout` | **L2** | Verifies consistency between `module = "<domain>"`, the parent folder `modules/<domain>/`, the sibling `<domain>.module.ksl` file, and the spec listing in `specs = [...]`. |
| `--semantic` | **L3** | Verifies consistency between `outputs.kinds` and declared blocks (`data`, `docs`, `e2e`), and ensures every `strategy` entry declares `description =`. |
| `--format human\|json` | — | Report output format (`human` by default). |
| `-h`, `--help` | — | Displays help for the `validate` command. |

## Examples

### Validate a module and its specification

```bash
yadra validate ksl/services/tontine-service/modules/members/members.module.ksl --layout --semantic
yadra validate ksl/services/tontine-service/modules/members/member-creation.spec.ksl --layout --semantic
```

Output:

```text
Validation passed (L0+L2+L3) on 1 file(s).
Validation passed (L0+L2+L3) on 1 file(s).
```

### Validate an entire repository in JSON format

```bash
yadra validate . --syntax --layout --semantic --format json
```

Output:

```json
{
  "ok": true,
  "files": 5,
  "issues": []
}
```
