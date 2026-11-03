# KSL — coloration syntaxique (VS Code / Cursor / IntelliJ)

La grammaire [`ksl/grammar/ksl.ebnf`](../ksl/grammar/ksl.ebnf) décrit le **langage** (parser / vérif formelle). Les éditeurs n’utilisent **pas** l’EBNF directement : ils ont besoin d’un **lexer** (TextMate, Monarch, JFlex, Tree-sitter, etc.) pour la coloration, et d’un **LSP** optionnel pour l’autocomplétion / diagnostics.

## VS Code et Cursor (recommandé)

Une extension minimale vit dans [`ksl/editor/ksl-vscode/`](../ksl/editor/ksl-vscode/) :

| Fichier | Rôle |
|---------|------|
| `package.json` | Id langage `ksl`, extension `.ksl`, lien vers la grammaire |
| `language-configuration.json` | Commentaires `//`, paires `{}[]`, pliage sur `{` |
| `syntaxes/ksl.tmLanguage.json` | Grammaire **TextMate** (coloration) |

### Installation locale (développement)

1. Ouvrir le dossier `ksl/editor/ksl-vscode` dans VS Code ou Cursor.
2. **Run and Debug** → lancer **Extension Development Host** (ou commande *Developer: Install Extension from Location…* selon la version).
3. Dans la fenêtre de dev, ouvrir un fichier `.ksl` du repo : le langage **KSL** doit apparaître en bas à droite.

### Installation en .vsix (équipe)

```bash
cd ksl/editor/ksl-vscode
npm install -g @vscode/vsce   # une fois
vsce package
code --install-extension kom-ksl-0.1.0.vsix
```

Cursor accepte en général les extensions VSIX de la même façon (`cursor --install-extension …`).

### Recommandation pour ce monorepo

Ajouter dans `.vscode/extensions.json` à la racine (optionnel) une note pour l’équipe ; l’extension reste **locale** tant qu’elle n’est pas publiée sur le Marketplace.

Quand vous modifiez `grammar/ksl.ebnf`, mettez à jour **`syntaxes/ksl.tmLanguage.json`** (mots-clés / blocs) — l’EBNF et TextMate ne se synchronisent pas seuls.

---

## IntelliJ IDEA

Trois niveaux possibles :

### 1. Rapide — plugin TextMate (coloration partielle)

1. **Settings → Plugins** → installer **TextMate Bundles** (bundled sur certaines versions) ou **IntelliJ TextMate Language**.
2. Convertir ou copier `ksl.tmLanguage.json` dans un bundle TextMate (structure `Syntaxes/KSL.tmLanguage`).
3. **Settings → Editor → TextMate Bundles** → ajouter le dossier du bundle, associer `*.ksl`.

Limites : pas de structure projet KSL, pas de navigation vers `*.module.ksl`.

### 2. Standard produit — plugin Language custom (Grammar-Kit)

Pour un support durable (highlight + structure + plus tard validation) :

1. Créer un module **IntelliJ Platform Plugin**.
2. Définir `KomKslFileType` + extension `.ksl`.
3. Générer un **lexer** (souvent à partir de règles alignées sur `ksl.ebnf`) avec [Grammar-Kit](https://github.com/JetBrains/Grammar-Kit).
4. Parser léger pour pliage / structure des blocs `{ }`.
5. Optionnel : **LSP4IntelliJ** + serveur qui lit `grammar/ksl.ebnf` ou ANTLR généré depuis EBNF.

JetBrains doc : [Custom Language Support](https://plugins.jetbrains.com/docs/intellij/custom-language-support.html).

### 3. Hybride — LSP partagé

Implémenter un **`ksl-language-server`** (Node ou Rust) qui :

- parse / valide via grammaire générée (ANTLR, tree-sitter, etc.) ;
- expose diagnostics et completion ;

Puis :

- **VS Code / Cursor** : client LSP via extension ;
- **IntelliJ** : [LSP4IJ](https://github.com/redhat-developer/lsp4ij) ou plugin LSP natif.

Une seule grammaire « source of truth » (`ksl.ebnf` → génération) alimente le serveur ; TextMate reste un fallback léger pour la couleur.

---

## Piste d’évolution

| Étape | Effort | Résultat |
|-------|--------|----------|
| Extension TextMate (fait) | Faible | Coloration `.ksl` |
| Snippets `*.code-snippets` | Faible | Blocs `spec`, `outputs`, `data` |
| Validator CLI sur EBNF | Moyen | CI + diagnostic sans IDE |
| LSP | Élevé | Erreurs, go-to, sync grammaire |

---

## EBNF vs TextMate

- **EBNF** : spec normative, tests parse, Yadra T1/T2.
- **TextMate** : regex / états pour la couleur uniquement ; pas de validation sémantique.

Garder les deux fichiers alignés manuellement (ou script qui extrait les littéraux `"keyword"` de l’EBNF pour regénérer la liste TextMate).
