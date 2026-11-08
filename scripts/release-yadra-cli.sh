#!/usr/bin/env bash
# Publie une version CLI : bump manifest + package.json, pack, GitHub Release.
#
# Usage (depuis la racine du clone yadra/) :
#   ./scripts/release-yadra-cli.sh <version> [options]
#
# Exemple :
#   ./scripts/release-yadra-cli.sh 0.1.12
#   ./scripts/release-yadra-cli.sh 0.1.12 --no-commit
#
# Options :
#   --no-commit   Ne crée pas de commit git (versions déjà commitées)
#   --no-pack     Ne lance pas npm run release:pack (tgz déjà présent)
#   --dry-run     Affiche les étapes sans les exécuter
#
# Prérequis : Node ≥ 18, npm, gh auth login, branche à jour poussée sur origin (recommandé).

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CLI="$ROOT/cli"
MANIFEST="$ROOT/manifest.mf"
PKG_JSON="$CLI/package.json"
SCOPED_TGZ_BASE="yadral-yadra"

usage() {
  sed -n '2,16p' "$0"
  exit "${1:-0}"
}

DRY_RUN=0
NO_COMMIT=0
NO_PACK=0
VERSION=""

for arg in "$@"; do
  case "$arg" in
    -h | --help) usage 0 ;;
    --dry-run) DRY_RUN=1 ;;
    --no-commit) NO_COMMIT=1 ;;
    --no-pack) NO_PACK=1 ;;
    -*)
      echo "Option inconnue: $arg" >&2
      usage 1
      ;;
    *)
      if [[ -n "$VERSION" ]]; then
        echo "Une seule version attendue: $arg" >&2
        exit 1
      fi
      VERSION="$arg"
      ;;
  esac
done

if [[ -z "$VERSION" ]]; then
  echo "Version manquante (ex. 0.1.12)." >&2
  usage 1
fi

if [[ ! "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Version invalide (attendu semver X.Y.Z): $VERSION" >&2
  exit 1
fi

TAG="yadra-cli-v${VERSION}"
TGZ="$CLI/${SCOPED_TGZ_BASE}-${VERSION}.tgz"

run() {
  if [[ "$DRY_RUN" -eq 1 ]]; then
    echo "[dry-run] $*"
  else
    "$@"
  fi
}

echo "==> Yadra CLI release ${VERSION} (tag ${TAG})"
echo "    racine: $ROOT"

# --- 1. Bump manifest.mf + cli/package.json ---
bump_files() {
  node --input-type=module <<EOF
import { readFileSync, writeFileSync } from "node:fs";
const mf = "$MANIFEST";
const pkgPath = "$PKG_JSON";
const version = "$VERSION";

let raw = readFileSync(mf, "utf8");
if (/^version\s*[:=]/im.test(raw)) {
  raw = raw.replace(/^(\s*version\s*[:=]\s*)([^\s#]+)/im, \`\$1\${version}\`);
} else {
  raw = raw.trimEnd() + \`\\nversion: \${version}\\n\`;
}
writeFileSync(mf, raw);

const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
pkg.version = version;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\\n");
console.log("bump:", mf, "→", version);
console.log("bump:", pkgPath, "→", version);
EOF
}

if [[ "$DRY_RUN" -eq 1 ]]; then
  echo "[dry-run] bump manifest.mf + cli/package.json → ${VERSION}"
else
  bump_files
fi

# --- 2. Vendor (manifest embarqué) ---
run node "$CLI/scripts/sync-vendor.mjs"

# --- 3. Commit optionnel ---
if [[ "$NO_COMMIT" -eq 0 ]]; then
  if git -C "$ROOT" diff --quiet -- manifest.mf cli/package.json 2>/dev/null; then
    echo "==> Aucun changement de version à committer."
  else
    run git -C "$ROOT" add manifest.mf cli/package.json
    run git -C "$ROOT" commit -m "chore(release): bump yadra CLI to ${VERSION}"
    echo "==> Commit créé. Pense à: git push origin main"
  fi
else
  echo "==> --no-commit : pas de commit git."
fi

# --- 4. Pack ---
if [[ "$NO_PACK" -eq 0 ]]; then
  run bash -c "cd \"$CLI\" && npm run release:pack"
else
  echo "==> --no-pack : pack ignoré."
fi

if [[ "$DRY_RUN" -eq 1 ]]; then
  echo "[dry-run] fin."
  exit 0
fi

if [[ ! -f "$TGZ" ]]; then
  echo "Tarball introuvable: $TGZ (lance sans --no-pack)" >&2
  exit 1
fi

NOTES="$(cat <<EOF
Install:
  npm install -g ./${SCOPED_TGZ_BASE}-${VERSION}.tgz

From GitHub:
  curl -L -o ${SCOPED_TGZ_BASE}-${VERSION}.tgz \\
    "https://github.com/yadral/yadra/releases/download/${TAG}/${SCOPED_TGZ_BASE}-${VERSION}.tgz"
  npm install -g ./${SCOPED_TGZ_BASE}-${VERSION}.tgz

Then:
  yadra project add <name> --ksl-project-home <path> --project-home <path>
  yadra project use <name>
EOF
)"

# --- 5. GitHub Release (depuis racine git yadra) ---
(
  cd "$ROOT"
  if gh release view "$TAG" >/dev/null 2>&1; then
    echo "==> Release existante ${TAG} — nettoyage assets .tgz + upload."
    while IFS= read -r asset; do
      [[ -z "$asset" ]] && continue
      if [[ "$asset" == "${SCOPED_TGZ_BASE}-"*.tgz && "$asset" != "${SCOPED_TGZ_BASE}-${VERSION}.tgz" ]]; then
        gh release delete-asset "$TAG" "$asset" -y 2>/dev/null || true
      fi
    done < <(gh release view "$TAG" --json assets -q '.assets[].name' 2>/dev/null || true)
    gh release upload "$TAG" "$TGZ" --clobber
    gh release edit "$TAG" --title "Yadra CLI ${VERSION}" --notes "$NOTES"
  else
    echo "==> Création release ${TAG}"
    gh release create "$TAG" "$TGZ" --title "Yadra CLI ${VERSION}" --notes "$NOTES"
  fi
)

echo ""
echo "OK — ${TAG}"
echo "  tarball: $TGZ"
echo "  install: npm install -g ./${SCOPED_TGZ_BASE}-${VERSION}.tgz"
