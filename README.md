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

## Scripts (depuis la racine de ce dépôt `yadra/`)

```bash
./scripts/install-yadra-cli.sh
./scripts/validate-ksl.sh
./scripts/release-yadra-cli.sh <version>
```

## Configuration minimale recommandée (CLI ≥ 0.1.15)

```bash
# Une fois : LLM
yadra configure set --profile cursor --provider cursor --model composer-2.5-fast
yadra configure credentials --profile cursor --token "…"

# Quotidien : workspace auto-détecté (root.project.ksl / ksl/ + repo.path)
yadra make prompts/ma-feature/
```

Pas besoin de `yadra project use` au quotidien. Détails : site doc → **Vue d’ensemble → Configuration minimale recommandée**, ou [`docs/yadra-cli.md`](docs/yadra-cli.md).

## Variables projet

| Variable | Rôle | Quotidien |
|----------|------|-----------|
| `KSL_HOME` / `YADRA_PROJECT_HOME` | Pack langage / distribution | Auto (paquet CLI) |
| `KSL_PROJECT_HOME` | Monorepo specs | Auto-detect depuis le path |
| `PROJECT_HOME` | Code généré T2 | Auto via `repo.path` |

Voir [`docs/yadra-cli.md`](docs/yadra-cli.md).
