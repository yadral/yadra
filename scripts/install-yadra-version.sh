#!/usr/bin/env bash
# Installe une version publiée du CLI Yadra (GitHub Release ou tarball local).
#
# Usage :
#   ./scripts/install-yadra-version.sh [version] [options]
#
# Exemples :
#   ./scripts/install-yadra-version.sh                 # dernière release yadra-cli-v*
#   ./scripts/install-yadra-version.sh 0.1.12
#   ./scripts/install-yadra-version.sh latest
#   ./scripts/install-yadra-version.sh --list
#   ./scripts/install-yadra-version.sh 0.1.12 --local  # tgz déjà packagé dans cli/
#
# Options :
#   --list          Liste les releases CLI GitHub disponibles
#   --local         Installe le .tgz local (cli/yadral-yadra-<ver>.tgz)
#   --prefix DIR    Préfixe npm (sinon installation globale)
#   --dry-run       Affiche les étapes sans installer
#
# Prérequis : Node ≥ 18, npm. Pour GitHub : gh (recommandé, dépôt privé) ou curl.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [[ -d "$SCRIPT_DIR/../yadra/cli" ]]; then
  ROOT="$(cd "$SCRIPT_DIR/../yadra" && pwd)"
else
  ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
fi
CLI="$ROOT/cli"
REPO="${YADRA_GH_REPO:-yadral/yadra}"
SCOPED_TGZ_BASE="yadral-yadra"
TAG_PREFIX="yadra-cli-v"

usage() {
  sed -n '2,20p' "$0"
  exit "${1:-0}"
}

DRY_RUN=0
LIST=0
LOCAL=0
PREFIX=""
VERSION=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h | --help) usage 0 ;;
    --dry-run) DRY_RUN=1 ;;
    --list) LIST=1 ;;
    --local) LOCAL=1 ;;
    --prefix)
      if [[ $# -lt 2 || "$2" == -* ]]; then
        echo "--prefix attend un répertoire (ex. --prefix /usr/local)." >&2
        exit 1
      fi
      PREFIX="$2"
      shift
      ;;
    --prefix=*)
      PREFIX="${1#--prefix=}"
      if [[ -z "$PREFIX" ]]; then
        echo "--prefix attend un répertoire." >&2
        exit 1
      fi
      ;;
    -*)
      echo "Option inconnue: $1" >&2
      usage 1
      ;;
    *)
      if [[ -n "$VERSION" ]]; then
        echo "Une seule version attendue: $1" >&2
        exit 1
      fi
      VERSION="$1"
      ;;
  esac
  shift
done

run() {
  if [[ "$DRY_RUN" -eq 1 ]]; then
    echo "[dry-run] $*"
  else
    "$@"
  fi
}

normalize_version() {
  local raw="$1"
  raw="${raw#${TAG_PREFIX}}"
  raw="${raw#v}"
  printf '%s' "$raw"
}

have_gh() {
  command -v gh >/dev/null 2>&1
}

list_releases() {
  if have_gh; then
    gh release list --repo "$REPO" --limit 50
    return
  fi
  if ! command -v curl >/dev/null 2>&1; then
    echo "gh ou curl est requis pour lister les releases." >&2
    exit 1
  fi
  curl -fsSL "https://api.github.com/repos/${REPO}/releases" | node --input-type=module -e '
    const chunks = [];
    process.stdin.on("data", (c) => chunks.push(c));
    process.stdin.on("end", () => {
      const releases = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      if (!Array.isArray(releases)) {
        console.error("Réponse GitHub inattendue.");
        process.exit(1);
      }
      for (const r of releases) {
        const tag = String(r.tag_name || "");
        if (!tag.startsWith("yadra-cli-v")) continue;
        const title = r.name || tag;
        const when = r.published_at || "";
        console.log(`${title}\t${tag}\t${when}`);
      }
    });
  '
}

resolve_latest_version() {
  if have_gh; then
    gh release list --repo "$REPO" --limit 50 --json tagName,isDraft,isPrerelease \
      | node --input-type=module -e '
        const chunks = [];
        process.stdin.on("data", (c) => chunks.push(c));
        process.stdin.on("end", () => {
          const rows = JSON.parse(Buffer.concat(chunks).toString("utf8"));
          const hit = rows.find(
            (r) =>
              !r.isDraft &&
              !r.isPrerelease &&
              String(r.tagName || "").startsWith("yadra-cli-v"),
          );
          if (!hit) process.exit(1);
          console.log(String(hit.tagName).replace(/^yadra-cli-v/, ""));
        });
      '
    return
  fi
  if ! command -v curl >/dev/null 2>&1; then
    echo "gh ou curl est requis pour résoudre la dernière version." >&2
    exit 1
  fi
  curl -fsSL "https://api.github.com/repos/${REPO}/releases" | node --input-type=module -e '
    const chunks = [];
    process.stdin.on("data", (c) => chunks.push(c));
    process.stdin.on("end", () => {
      const releases = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      if (!Array.isArray(releases)) process.exit(1);
      const hit = releases.find(
        (r) =>
          !r.draft &&
          !r.prerelease &&
          String(r.tag_name || "").startsWith("yadra-cli-v"),
      );
      if (!hit) process.exit(1);
      console.log(String(hit.tag_name).replace(/^yadra-cli-v/, ""));
    });
  '
}

if [[ "$LIST" -eq 1 ]]; then
  echo "==> Releases CLI (${REPO})"
  list_releases
  exit 0
fi

if [[ -z "$VERSION" || "$VERSION" == "latest" ]]; then
  if [[ "$LOCAL" -eq 1 && -z "$VERSION" ]]; then
    VERSION="$(node -p "require('${CLI}/package.json').version")"
    echo "==> --local sans version : package.json → ${VERSION}"
  else
    echo "==> Résolution de la dernière release ${TAG_PREFIX}* (${REPO})"
    VERSION="$(resolve_latest_version)" || {
      echo "Impossible de trouver une release ${TAG_PREFIX}*. Utilise --list." >&2
      exit 1
    }
  fi
fi

VERSION="$(normalize_version "$VERSION")"
if [[ ! "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Version invalide (attendu semver X.Y.Z, latest, ou ${TAG_PREFIX}X.Y.Z): $VERSION" >&2
  exit 1
fi

TAG="${TAG_PREFIX}${VERSION}"
ASSET="${SCOPED_TGZ_BASE}-${VERSION}.tgz"
LOCAL_TGZ="$CLI/$ASSET"

echo "==> Yadra CLI install ${VERSION} (tag ${TAG})"

if [[ "$LOCAL" -eq 1 ]]; then
  TGZ="$LOCAL_TGZ"
  echo "    source: $TGZ"
  if [[ ! -f "$LOCAL_TGZ" ]]; then
    echo "Tarball local introuvable: $LOCAL_TGZ" >&2
    echo "Lance d'abord: ./scripts/release-yadra-cli.sh ${VERSION} --no-commit" >&2
    echo "ou: cd cli && npm run release:pack" >&2
    if [[ "$DRY_RUN" -eq 0 ]]; then
      exit 1
    fi
  fi
else
  TMPDIR="$(mktemp -d "${TMPDIR:-/tmp}/yadra-cli-install.XXXXXX")"
  trap 'rm -rf "$TMPDIR"' EXIT
  TGZ="$TMPDIR/$ASSET"
  URL="https://github.com/${REPO}/releases/download/${TAG}/${ASSET}"
  echo "    source: $URL"
  if [[ "$DRY_RUN" -eq 1 ]]; then
    echo "[dry-run] download ${ASSET}"
  elif have_gh; then
    gh release download "$TAG" --repo "$REPO" --pattern "$ASSET" --dir "$TMPDIR"
  elif command -v curl >/dev/null 2>&1; then
    if ! curl -fL -o "$TGZ" "$URL"; then
      echo "Téléchargement échoué. Dépôt privé ? Installe gh et lance: gh auth login" >&2
      exit 1
    fi
  else
    echo "gh ou curl est requis pour télécharger la release." >&2
    exit 1
  fi
fi

if [[ "$DRY_RUN" -eq 0 && ! -f "$TGZ" ]]; then
  echo "Tarball introuvable: $TGZ" >&2
  exit 1
fi

NPM_ARGS=(install -g)
if [[ -n "$PREFIX" ]]; then
  NPM_ARGS+=(--prefix "$PREFIX")
fi
NPM_ARGS+=("$TGZ")

run npm "${NPM_ARGS[@]}"

if [[ -n "$PREFIX" ]]; then
  echo "OK — yadra ${VERSION} (PATH: ${PREFIX}/bin)"
else
  echo "OK — yadra ${VERSION}"
fi

if [[ "$DRY_RUN" -eq 0 ]] && command -v yadra >/dev/null 2>&1; then
  yadra version || true
fi
