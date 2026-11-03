---
title: seal
description: Formally validates a KSL specification and writes its cryptographic seal certificate for Timeline 2.
---

The `yadra seal` command completes **Timeline 1** by running formal verification on a specification and its companion module, then recording their SHA-256 digests in `<KSL_PROJECT_HOME>/.yadra/sealed/<spec-id>.json`.

## Synopsis

```bash
yadra seal [SPEC.spec.ksl] [options]
```

> **Description:** Executes L0, L2, and L3 checks (plus L1 when `--syntax` is passed) on the target specification and its sibling `<domain>.module.ksl` file, computes the SHA-256 digest of each file, and writes the seal manifest required by Timeline 2.

## Arguments

| Argument | Description |
|----------|-------------|
| `SPEC.spec.ksl` | Path to the `.spec.ksl` file to seal (or `.` when the current directory contains a single specification). |

## Options

| Option | Description |
|--------|-------------|
| `--syntax` | Includes level L1 in the pre-seal validation checks. |
| `--include <paths>` | Comma-separated paths of additional KSL files (such as `root.project.ksl`) to validate and include in the seal. |
| `-h`, `--help` | Displays help for the `seal` command. |

## Examples

### Seal a specification and its module

```bash
yadra seal ksl/services/tontine-service/modules/members/member-creation.spec.ksl
```

Output:

```text
T1 seal written: /Users/dev/tontine-ksl/.yadra/sealed/member-creation.json
  spec: ksl/services/tontine-service/modules/members/member-creation.spec.ksl
  files: ksl/services/tontine-service/modules/members/members.module.ksl, ksl/services/tontine-service/modules/members/member-creation.spec.ksl
  validator: L0+L2+L3
```

### Include the root project file in the seal

```bash
yadra seal ksl/services/tontine-service/modules/members/member-creation.spec.ksl \
  --include root.project.ksl \
  --syntax
```

## `.yadra/sealed/<spec-id>.json` Preview

```json
{
  "timeline": "T1",
  "phase": "C",
  "specId": "member-creation",
  "specPath": "ksl/services/tontine-service/modules/members/member-creation.spec.ksl",
  "kslProjectHome": "/Users/dev/tontine-ksl",
  "files": [
    {
      "path": "ksl/services/tontine-service/modules/members/members.module.ksl",
      "sha256": "a91f4c08c7d24b3a9f10b5e4c8d1f72e9031a4b6c7d8e9f0a1b2c3d4e5f60718"
    },
    {
      "path": "ksl/services/tontine-service/modules/members/member-creation.spec.ksl",
      "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    }
  ],
  "validator": {
    "yadraCli": "0.1.0",
    "grammarVersion": "1.0",
    "levels": ["L0", "L2", "L3"]
  },
  "sealedAt": "2026-10-23T12:15:00.000Z"
}
```
