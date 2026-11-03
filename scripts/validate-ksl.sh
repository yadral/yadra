#!/usr/bin/env bash
# Run phase-0 KSL checks on examples (extend paths as needed).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
node "$ROOT/ksl/tools/ksl-validator/check.mjs" "$ROOT/ksl/examples/minimal"
