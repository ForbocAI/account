#!/usr/bin/env bash
# verify-all.sh
# Local verification script for the ForbocAI Account repository.
#
# Wires in the classified FP/RTK conformance scripts so account gets the same
# guardrails as the SDK. Per account#2, this script is the gate; refactors of
# existing offenders land in follow-up PRs once the gate exists.

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$ROOT_DIR"

echo "=== ForbocAI Account Verification Suite ==="

# Temporarily hide generated Prisma files so conformance scripts don't flag
# them. The trap restores them on any exit path, including failure or Ctrl-C.
if [ -d "src/generated" ]; then
    mv src/generated .generated_hidden
fi

cleanup() {
    if [ -d ".generated_hidden" ]; then
        mv .generated_hidden src/generated
    fi
}
trap cleanup EXIT

# The FP/RTK conformance scripts resolve `typescript` via
# `require.resolve('typescript', { paths: [...] })`. If node_modules isn't on
# disk, both scripts emit "Could not resolve a local TypeScript parser for
# this file" and silently skip the AST checks. Make sure deps exist first.
if [ ! -d "$ROOT_DIR/node_modules/typescript" ]; then
    echo "-> Installing account dependencies (typescript parser must be on disk)..."
    npm install --no-audit --no-fund
fi

# Locate the classified scripts. Prefer a sibling Forboc.AI/classified checkout
# (the canonical local layout); fall back to a CI-side classified-checkout/ dir.
CLASSIFIED_DIR=""
for candidate in "$ROOT_DIR/../classified" "$ROOT_DIR/classified-checkout"; do
    if [ -d "$candidate/scripts" ] && [ -f "$candidate/scripts/check-fp-conformance.sh" ]; then
        CLASSIFIED_DIR="$candidate"
        break
    fi
done

if [ -z "$CLASSIFIED_DIR" ]; then
    echo "[FAIL] Could not find classified/scripts/. Expected a sibling Forboc.AI/classified checkout or classified-checkout/ inside the repo."
    exit 1
fi

echo "-> Using classified scripts at: $CLASSIFIED_DIR/scripts"

echo ""
echo "-> Running FP conformance checks against src/**/*.{ts,tsx}..."
shopt -s globstar nullglob
FP_TARGETS=(src/**/*.ts src/**/*.tsx)
shopt -u globstar nullglob
FP_STATUS=0
if [ "${#FP_TARGETS[@]}" -eq 0 ]; then
    echo "[WARN] No TS/TSX source files found for FP conformance check."
else
    bash "$CLASSIFIED_DIR/scripts/check-fp-conformance.sh" "${FP_TARGETS[@]}" || FP_STATUS=$?
fi

echo ""
echo "-> Running RTK conformance checks against project root..."
RTK_STATUS=0
bash "$CLASSIFIED_DIR/scripts/check-rtk-conformance.sh" "$ROOT_DIR" || RTK_STATUS=$?

echo ""
if [ "$FP_STATUS" -ne 0 ] || [ "$RTK_STATUS" -ne 0 ]; then
    echo "=== Conformance failures present (FP=$FP_STATUS, RTK=$RTK_STATUS) ==="
    echo "Grandfathered offenders tracked as bite-sized follow-ups:"
    echo "  - ForbocAI/account#3 — replace fetch() in src/components/vengeance/Header.tsx"
    echo "See ACCOUNT_FP_TRIAGE.md for the first-run inventory of FP warnings."
    exit 1
fi

echo "=== All checks passed ==="
