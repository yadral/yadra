# KSL validator — roadmap (hors extension éditeur)

La coloration VS Code/Cursor **ne valide pas** les fichiers `.ksl`. La validation formelle et l’intégration Yadra reposent sur une couche séparée, alimentée par [`ksl/grammar/ksl.ebnf`](../ksl/grammar/ksl.ebnf).

## Cible

| Phase | Livrable | Usage |
|-------|----------|--------|
| **0 (actuel)** | [`ksl/tools/ksl-validator/check.mjs`](../ksl/tools/ksl-validator/check.mjs) | Checks légers en CI locale : en-tête `ksl`, déclaration top-level, équilibre `{` `}` |
| **1** | Parser généré (ANTLR / autre) depuis EBNF | `yadra validate path/**/*.ksl` avec erreurs ligne/colonne |
| **2** | Règles sémantiques | `module =` cohérent avec dossier, `outputs.kinds` vs blocs `docs`/`data`, etc. |
| **3** | LSP `ksl-language-server` | Diagnostics dans Cursor, VS Code, IntelliJ (LSP4IJ) |
| **4** | Yadra T1/T2 | Scellement spec + Conformance Gate — voir [`yadra-ksl-processing.md`](yadra-ksl-processing.md) |

## Usage aujourd’hui (phase 0)

```bash
# depuis la racine du clone :
./scripts/validate-ksl.sh
# ou
node ksl/tools/ksl-validator/check.mjs ksl/examples/minimal
```

Exit code `0` = checks de base OK ; `1` = au moins un fichier en échec. **Ne remplace pas** une grammaire complète.

## Évolution EBNF

Toute modification de [`ksl/grammar/ksl.ebnf`](../ksl/grammar/ksl.ebnf) doit eventually regénérer le parser (phase 1+) et mettre à jour [`ksl/editor/ksl-vscode/syntaxes/ksl.tmLanguage.json`](../ksl/editor/ksl-vscode/syntaxes/ksl.tmLanguage.json).
