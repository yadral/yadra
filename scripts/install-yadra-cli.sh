#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/ksl/tools/yadra"
npm link
echo "yadra CLI linked. Try: yadra doctor"
