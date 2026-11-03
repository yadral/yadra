# Yadra CLI (`@yadral/yadra`)

CLI de **Yadra** (Spec-to-Code Binder). Binaire **`yadra`** (Node ≥ 18). Distribution embarquée dans `vendor/yadral-dist/` (tarball) ou lien monorepo (`npm install` / `prepare`).

## Release tarball

```bash
cd yadra/cli
npm run release:pack
# → yadral-yadra-<version>.tgz
```

Publier sur GitHub Releases du dépôt **yadral** : `npm run release:github`.

## Dev (monorepo yadral)

```bash
cd yadra/cli
npm install
npm test
npm link
```

Site doc : `yadra/documentation/` (`npm run dev`).
