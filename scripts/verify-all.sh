#!/usr/bin/env bash
# verify-all.sh
# Unified local verification script for the Account repository.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$ROOT_DIR"

echo "=== ForbocAI Account Verification Suite ==="

# Temporarily hide generated files so conformance scripts don't flag them
if [ -d "src/generated" ]; then
    mv src/generated .generated_hidden
fi

function cleanup {
    # Restore generated files
    if [ -d ".generated_hidden" ]; then
        mv .generated_hidden src/generated
    fi
}
trap cleanup EXIT

echo "-> Running FP/RTK Conformance checks..."
if [ -f "$ROOT_DIR/../classified/scripts/check-fp-conformance.sh" ]; then
    shopt -s globstar
    bash "$ROOT_DIR/../classified/scripts/check-fp-conformance.sh" src/**/*.ts src/**/*.tsx
else
    echo "[WARN] Classified repo not found alongside Account; skipping FP conformance check."
fi

if [ -f "$ROOT_DIR/../classified/scripts/check-rtk-conformance.sh" ]; then
    bash "$ROOT_DIR/../classified/scripts/check-rtk-conformance.sh" .
else
    echo "[WARN] Classified repo not found alongside Account; skipping RTK conformance check."
fi

echo ""
echo "=== All checks passed ==="
