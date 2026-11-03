# Partager KSL avec l’équipe (et au-delà)

KSL se partage en **deux couches** distinctes :

| Couche | Contenu | Comment la partager |
|--------|---------|---------------------|
| **Langage** | `grammar/ksl.ebnf`, `docs/ksl-language-spec.md`, `examples/`, version `ksl 1.0` dans les fichiers | **Dépôt Git** (source de vérité) |
| **Éditeur** | `ksl/editor/ksl-vscode/` (coloration) | **VSIX** ou Marketplace / Open VSX |

Tout le monde doit travailler sur la **même révision Git** pour la spec ; l’extension éditeur peut être installée une fois par machine.

---

## Après install (extension vs spec)

L’extension installée dans Cursor/VS Code contient **uniquement** la coloration (`ksl.tmLanguage.json`, commentaires `//`, association `*.ksl`). Elle est **globale** : tu peux fermer le repo `yadral` et ouvrir des `.ksl` dans n’importe quel projet.

| Besoin | Encore requis après install ? |
|--------|-------------------------------|
| Coloration des `.ksl` | Non (extension suffit) |
| Norme du langage, grammaire, exemples | **Oui** — clone Git ou doc hébergée ([`ksl-language-spec.md`](ksl-language-spec.md), [`ksl/grammar/ksl.ebnf`](../ksl/grammar/ksl.ebnf)) |
| Alignement équipe (PR, tags, évolution KSL) | **Oui** — dépôt partagé |
| Validation syntaxique / sémantique | **Oui** — CLI **`yadra validate`** ([`yadra-cli.md`](yadra-cli.md)) |
| Yadra T1/T2, Conformance Gate | **Oui** — **`yadra execute`** / **`yadra gate`** + [`yadra-ksl-processing.md`](yadra-ksl-processing.md) |

Quand `grammar/ksl.ebnf` change, republier ou réinstaller une **nouvelle version du VSIX** (Release `vscode-isl-*` ou relancer le script) pour garder les mots-clés colorés à jour.

---

## 1. Langage KSL — dépôt Git (recommandé)

### Organisation

- Un repo dédié (`yadral`) ou un sous-dossier `spec/ksl/` dans un monorepo.
- Branche **`main`** = KSL stable ; **`feature/ksl-*`** pour évolutions de grammaire.
- Tag sémantique aligné sur la spec : `isl-spec-1.0.0` (doc) ≠ `kom-ksl-vscode-0.1.0` (extension).

### Fichiers à versionner ensemble

```
scripts/                      # install CLI / extension, validate phase 0
ksl/grammar/ksl.ebnf
docs/ksl-language-spec.md
docs/yadra-ksl-processing.md
ksl/examples/minimal/
ksl/CONTEXTE-PROMPT.md        # optionnel, pour onboarding IA
ksl/editor/ksl-vscode/        # extension (sources, pas obligatoire le .vsix)
ksl/tools/yadra/              # CLI
```

### Onboarding membre

```bash
git clone <url-du-repo> yadral
cd yadral
./scripts/install-ksl-editor.sh    # Cursor / VS Code
./scripts/install-yadra-cli.sh
yadra project add demo --ksl-project-home /chemin/vers/votre-monorepo-ksl --project-home /chemin/cible-code
yadra project use demo
eval "$(yadra project export)"
```

Dans un **autre clone** qui ne contient que vos `.ksl` (sans le repo outils) : installez `yadra` + VSIX une fois, puis **`yadra project`** enregistre **`KSL_PROJECT_HOME`** et **`PROJECT_HOME`**.

Dans les **repos applicatifs** (`order-service`, etc.) : soit copier / synchroniser les `.ksl` depuis ce repo, soit **submodule Git** :

```bash
git submodule add <url> vendor/yadral-dist
```

Les specs métier vivent en général **dans le repo service** ; le repo `yadral` reste la **norme + grammaire + exemples**.

### Hébergement

| Besoin | Option |
|--------|--------|
| Équipe interne | GitHub / GitLab **private**, ou [Cursor Origin](https://origin.cursor.com) |
| Partenaires | Repo read-only + release notes par tag |
| Public | Repo public + spec en Markdown (sans secrets dans les exemples) |

---

## 2. Extension éditeur — partage Cursor / VS Code

### A. Script local (petite équipe)

À la racine du clone :

```bash
./scripts/install-ksl-editor.sh
```

Le script empaquette `ksl/editor/ksl-vscode` en VSIX et l’installe (`cursor` ou `code`).

### B. Release Git (équipe moyenne)

Workflow : [`.github/workflows/release-vscode-ksl.yml`](../.github/workflows/release-vscode-ksl.yml)

1. Monter la version dans [`ksl/editor/ksl-vscode/package.json`](../ksl/editor/ksl-vscode/package.json) (sous `ksl/`).
2. Commit + tag : `git tag vscode-isl-0.1.0 && git push origin vscode-isl-0.1.0`
3. GitHub Actions produit une **Release** avec le `.vsix` en pièce jointe (pas besoin de cloner le repo pour empaqueter).
4. Chaque dev : télécharger le VSIX depuis **Releases** puis :

   ```bash
   cursor --install-extension kom-ksl-0.1.0.vsix
   ```

### C. Registre d’extensions (plusieurs dizaines de personnes)

| Registre | Visibilité | Commande côté dev |
|----------|------------|-------------------|
| [Open VSX](https://open-vsx.org/) | Public ou org | Extensions → chercher **Kom KSL** |
| [VS Marketplace](https://marketplace.visualstudio.com/) | Public | Idem dans VS Code |
| Marketplace **organisation** Microsoft | Privé entreprise | Admin publie, membres installent par id |

Publisher dans `package.json` : `"publisher": "yadral"` → une fois publié, id d’extension : **`yadral.ksl`**.

Ajouter alors à la racine des repos `.vscode/extensions.json` :

```json
{
  "recommendations": ["yadral.ksl"]
}
```

Cursor propose l’installation recommandée à l’ouverture du workspace.

### D. IntelliJ

Partager le même `ksl.tmLanguage.json` (bundle TextMate) via le repo ou un plugin interne JetBrains — voir [`ksl-editor-integration.md`](ksl-editor-integration.md).

---

## 3. Gouvernance du langage

1. **Changement breaking** (grammaire) → bump `ksl 1.0` → `isl 1.1` dans la spec + changelog dans `docs/ksl-language-spec.md`.
2. **PR** qui touchent `grammar/ksl.ebnf` doivent mettre à jour `ksl/editor/ksl-vscode/syntaxes/ksl.tmLanguage.json` (checklist PR).
3. **`CONTEXTE-PROMPT.md`** : lien ou copie pour sessions IA (Yadra / T1-T2) — même version que la branche `main`.

---

## 4. Ce qu’il ne faut pas confondre

- **Partager le langage** = accès Git + doc normative (+ exemples).
- **Partager la coloration** = VSIX ou Marketplace.
- **Valider les `.ksl`** = [`ksl/tools/ksl-validator/`](../ksl/tools/ksl-validator/) (phase 0 aujourd’hui ; parser/LSP/Yadra — [`ksl-validator-roadmap.md`](ksl-validator-roadmap.md)).

---

## 5. Checklist « nouvelle personne »

- [ ] Accès lecture (ou write) au repo KSL / Yadra
- [ ] Clone + branche `main` à jour
- [ ] `./scripts/install-ksl-editor.sh` (ou VSIX de la dernière Release)
- [ ] Lire `docs/ksl-language-spec.md` + parcourir `ksl/examples/minimal/`
- [ ] Ouvrir un `.ksl` → langage **KSL** en bas à droite
