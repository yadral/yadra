#!/usr/bin/env bash
# Simule téléchargement Release + install globale (sans GitHub).
# Usage: ./scripts/smoke-install-from-tgz.sh [path/to/yadral-yadra-0.1.1.tgz]
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TGZ="${1:-$ROOT/yadral-yadra-0.1.1.tgz}"
PREFIX="${YADRA_SMOKE_PREFIX:-/tmp/yadra-npm-global-smoke}"
MINIMAL="${YADRA_MINIMAL_KSL:-$(cd "$ROOT/.." && pwd)/ksl/examples/minimal}"
DL="/tmp/yadra-release-download-sim"
HOME="${YADRA_SMOKE_HOME:-/tmp/yadra-smoke-home-$$}"
PROJECT_NAME="smoke-$$"

if [[ ! -f "$TGZ" ]]; then
  echo "Missing tarball. Run: cd yadra/cli && npm run pack:release" >&2
  exit 1
fi

mkdir -p "$DL"
cp "$TGZ" "$DL/"
rm -rf "$PREFIX"
npm install -g --prefix "$PREFIX" "$DL/$(basename "$TGZ")"
export PATH="$PREFIX/bin:$PATH"
mkdir -p "$HOME/.config/yadra"

echo "=== yadra version ==="
yadra version --format json

echo "=== project + validate ==="
yadra project add "$PROJECT_NAME" --ksl-project-home "$MINIMAL" --project-home "/tmp/yadra-app-smoke-$$"
yadra project list
yadra validate "$MINIMAL/root.project.ksl"

echo "OK: smoke install from $(basename "$TGZ")"
