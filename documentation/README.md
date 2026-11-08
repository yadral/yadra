# Documentation Yadral

Site officiel **Yadral** — produit **Yadra** (CLI T1/T2) et langage **KSL**. Next.js 15, export statique (`out/`).

## Versions

- **CLI** : `../manifest.mf` (même source que `yadra version`)
- **Grammaire** : `../ksl/grammar/ksl.ebnf`
- **Spec auteur** : `../docs/ksl-language-spec.md` + `../docs/ksl/reference/`

## Local

**Développement** (hot reload) :

```bash
cd yadra/documentation
npm install
npm run dev
# → http://localhost:3000
```

Si erreur du type `Cannot find module './611.js'` : arrêter le serveur, puis `npm run clean && npm run dev` (cache `.next` incohérent après un `build` sans redémarrage).

**Build statique** (`output: "export"` dans `next.config.mjs`) :

```bash
npm run build
npm run serve:static
# → http://localhost:3000 (dossier out/)
```

Ne pas utiliser `npm run start` après un export statique : il attend un serveur Node `.next` complet, pas le site dans `out/`.

Architecture HTML : `public/architecture/0.1.0-*.html`.
