#!/usr/bin/env bash
# Build and install the Kom KSL VS Code / Cursor extension from this repo.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
EXT_DIR="$ROOT/ksl/editor/ksl-vscode"

cd "$EXT_DIR"

if ! command -v npx >/dev/null 2>&1; then
  echo "npx (Node.js) is required to package the extension." >&2
  exit 1
fi

VERSION="$(node -p "require('./package.json').version")"
VSIX="$EXT_DIR/kom-ksl-${VERSION}.vsix"

echo "Packaging KSL extension v${VERSION}..."
npx --yes @vscode/vsce package --allow-missing-repository -o "kom-ksl-${VERSION}.vsix"

INSTALLER=""
if command -v cursor >/dev/null 2>&1; then
  INSTALLER="cursor"
elif command -v code >/dev/null 2>&1; then
  INSTALLER="code"
else
  echo "Built: $VSIX"
  echo "Install manually: cursor --install-extension \"$VSIX\"  (or code ...)"
  exit 0
fi

echo "Installing with $INSTALLER..."
"$INSTALLER" --install-extension "$VSIX" --force

echo "Done. Reload the editor window, then open a .ksl file (language mode: KSL)."
