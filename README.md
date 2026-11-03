# Yadra (arbre produit Yadral)

Tout le produit **Yadra** + **KSL** vit ici : CLI, langage, documentation, catalogue strategies/skills, exemples.

## Layout

| Path | Rôle |
|------|------|
| `cli/` | CLI `@yadral/yadra` — `npm link`, release `.tgz` |
| `documentation/` | Site doc **Yadral** (Next.js, versions CLI + KSL) |
| `ksl/` | Grammaire, validateur, exemples, éditeur VS Code, moteur `tools/yadra/lib` |
| `docs/` | Spec KSL normative, HTML architecture, guides CLI |
| `prompts/` | Plans draft + `plan-validate/` (T1/T2) |
| `strategies/` | `catalog.yaml` + `.strategy.ksl` |
| `skills/` | SKILLS formalize / execute (source → vendor CLI) |
| `scripts/` | Install CLI, extension KSL, validate exemples |
| `manifest.mf` | Version officielle distribution (doc + compat) |

## Dev CLI

```bash
cd cli
npm install          # prepare → vendor/yadral-dist
npm test
npm link
yadra version
```

Release : `npm run release:pack` → `yadral-yadra-<version>.tgz`.

## Doc site

```bash
cd documentation
npm install
npm run dev          # http://localhost:3000
```

Version affichée : lue depuis `manifest.mf` à la racine de **`yadra/`**.

## Scripts (depuis la racine du dépôt)

```bash
./scripts/install-yadra-cli.sh    # délègue à yadra/scripts/
./scripts/validate-ksl.sh
```

## Variables projet

| Variable | Rôle |
|----------|------|
| `KSL_PROJECT_HOME` | Monorepo specs (`.project.ksl`, `.spec.ksl`) |
| `PROJECT_HOME` | Code généré T2 |
| `KSL_HOME` | Pack langage (`…/yadra/ksl` en dev monorepo ou vendor CLI) |
| `YADRA_PROJECT_HOME` | Racine distribution (vendor ou `yadra/` en dev) |

Voir [`docs/yadra-cli.md`](docs/yadra-cli.md).
