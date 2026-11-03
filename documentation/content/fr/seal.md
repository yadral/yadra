---
title: seal
description: Valide formellement une spécification KSL et génère son certificat de scellement cryptographique pour la Timeline 2.
---

La commande `yadra seal` clôture la **Timeline 1** en exécutant la vérification formelle d'une spécification et de son module associé, puis en enregistrant leurs empreintes SHA-256 dans `<KSL_PROJECT_HOME>/.yadra/sealed/<spec-id>.json`.

## Synopsis

```bash
yadra seal [SPEC.spec.ksl] [options]
```

> **Description :** Exécute les contrôles L0, L2 et L3 (ainsi que L1 si `--syntax` est fourni) sur la spécification cible et son fichier `<domaine>.module.ksl` adjacent, calcule le condensat SHA-256 de chaque fichier et écrit le manifeste de scellement requis par la Timeline 2.

## Arguments

| Argument | Description |
|----------|-------------|
| `SPEC.spec.ksl` | Chemin vers le fichier `.spec.ksl` à sceller (ou `.` si le répertoire courant contient une unique spécification). |

## Options

| Option | Description |
|--------|-------------|
| `--syntax` | Inclut le niveau L1 dans la validation préalable au scellement. |
| `--include <paths>` | Chemins supplémentaires (séparés par des virgules, ex. `root.project.ksl`) à valider et à inclure dans le scellement. |
| `-h`, `--help` | Affiche l'aide de la commande `seal`. |

## Exemples

### Sceller une spécification et son module

```bash
yadra seal ksl/services/tontine-service/modules/members/member-creation.spec.ksl
```

Sortie :

```text
T1 seal written: /Users/dev/tontine-ksl/.yadra/sealed/member-creation.json
  spec: ksl/services/tontine-service/modules/members/member-creation.spec.ksl
  files: ksl/services/tontine-service/modules/members/members.module.ksl, ksl/services/tontine-service/modules/members/member-creation.spec.ksl
  validator: L0+L2+L3
```

### Inclure le fichier projet racine dans le scellement

```bash
yadra seal ksl/services/tontine-service/modules/members/member-creation.spec.ksl \
  --include root.project.ksl \
  --syntax
```

## Aperçu du fichier `.yadra/sealed/<spec-id>.json`

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
