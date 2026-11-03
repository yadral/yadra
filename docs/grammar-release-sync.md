# Grammaire KSL et releases CLI

**Source de vérité** : [`ksl/grammar/ksl.ebnf`](../ksl/grammar/ksl.ebnf) dans ce dépôt.

Le tarball **`@yadral/yadra`** embarque une copie via `yadra/cli/scripts/sync-vendor.mjs` (`vendor/yadral-dist/ksl/grammar/`).

Checklist release :

1. Modifier `ksl.ebnf` (+ doc langage si besoin).
2. `cd yadra/cli && node scripts/sync-vendor.mjs`
3. `npm test` dans `yadra/cli`
4. Bump `yadra/manifest.mf` si release publiée.
