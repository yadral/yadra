# Documentation Yadral

Site officiel **Yadral** — produit **Yadra** (CLI T1/T2) et langage **KSL**. Next.js 15, export statique (`out/`).

## Versions

- **CLI** : `../manifest.mf` (même source que `yadra version`)
- **Grammaire** : `../ksl/grammar/ksl.ebnf`
- **Spec auteur** : `../docs/ksl-language-spec.md` + `../docs/ksl/reference/`

## Local

```bash
cd yadra/documentation
npm install
npm run dev
```

Build : `npm run build` → `out/`.

Architecture HTML : `public/architecture/0.1.0-*.html`.
