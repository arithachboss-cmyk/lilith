#!/usr/bin/env bash
# Regression for the ACS claim tooling.
#
# Run it after any rule change. It has already caught four real bugs: an ASCII-only word
# boundary that silently dropped every Thai unit, a class tally that folded
# EVIDENCE_REQUIRED into OWNER_REQUIRED, and an argument filter that discarded the target
# directory whenever --as-of was absent — which was then written a second time in
# cannibalisation-check.mjs, so flag parsing now lives in argv.mjs. Every one of those
# would have shipped as a tool that quietly under-reports, which is worse than no tool.
set -u
cd "$(dirname "$0")"

fail=0
chk() {
  local cmd="$1" want="$2" name="$3" got
  eval "$cmd" > /dev/null 2>&1; got=$?
  if [ "$got" = "$want" ]; then
    printf 'PASS  %s\n' "$name"
  else
    printf 'FAIL  %s (exit %s, expected %s)\n' "$name" "$got" "$want"
    fail=1
  fi
}

echo "claim-scan"
chk "node claim-scan.mjs fixtures/sample-draft.md"                    1 "figures draft fails the default gate"
chk "node claim-scan.mjs fixtures/sample-material-draft.md"           0 "material draft passes the default gate"
chk "node claim-scan.mjs fixtures/sample-material-draft.md --strict"  1 "material draft fails the strict gate"
chk "node claim-scan.mjs fixtures/clean-draft.md"                     0 "a clean draft passes"
chk "node claim-scan.mjs fixtures/price-draft.md"                     1 "price draft is caught"
chk "node claim-scan.mjs fixtures/geo-page-draft.md"                  0 "geo draft: CR-15/CR-16 are owner-required, not blocked"
chk "node claim-scan.mjs fixtures/geo-page-draft.md --strict"         0 "geo draft: strict still passes — no evidence-required findings"

echo
echo "claim-scan --fix"
tmp="$(mktemp -d)"; cp fixtures/sample-draft.md "$tmp/d.md"
node claim-scan.mjs "$tmp/d.md" --fix > /dev/null 2>&1
# grep -c counts LINES, not occurrences; the fixture puts several markers on one line.
redacted=$(grep -o '⟦ลบตัวเลข' "$tmp/d.md" | wc -l | tr -d ' ')
[ "$redacted" -ge 7 ] && printf 'PASS  --fix redacted %s figure(s)\n' "$redacted" || { printf 'FAIL  --fix redacted %s, expected >= 7\n' "$redacted"; fail=1; }
before=$(grep -o '⟦ลบตัวเลข' "$tmp/d.md" | wc -l | tr -d ' ')
node claim-scan.mjs "$tmp/d.md" --fix > /dev/null 2>&1
after=$(grep -o '⟦ลบตัวเลข' "$tmp/d.md" | wc -l | tr -d ' ')
[ "$before" = "$after" ] && echo "PASS  --fix is idempotent" || { echo "FAIL  --fix is not idempotent"; fail=1; }
rm -rf "$tmp"

echo
echo "evidence-check"
chk "node evidence-check.mjs fixtures/pkg-bad"                            1 "incomplete evidence is rejected"
chk "node evidence-check.mjs fixtures/pkg-good"                           0 "complete evidence passes"
chk "node evidence-check.mjs fixtures/pkg-price-stale"                    1 "stale price is rejected"
chk "node evidence-check.mjs fixtures/pkg-price-good --as-of 2026-09-22"  0 "price valid on its effective date"
chk "node evidence-check.mjs fixtures/pkg-price-good --as-of 2027-01-15"  1 "same price rejected after expiry"
chk "node evidence-check.mjs fixtures"                                    1 "whole fixtures tree is rejected"

echo
echo "cannibalisation-check"
chk "node cannibalisation-check.mjs 'เครื่องสแกนบาร์โค้ด ราคา'"                        0 "C-1 proceeds now that D-07 named its owner"
chk "node cannibalisation-check.mjs 'rfid คลังสินค้า'"                                 1 "a cluster with no owner still holds"
chk "node cannibalisation-check.mjs 'label materials' --url /knowledge/barcode-label-materials" 1 "an existing URL holds"
chk "node cannibalisation-check.mjs 'GS1 barcode symbology standards explained'"      0 "an unrelated intent proceeds"
chk "node cannibalisation-check.mjs"                                                  2 "no intent is a usage error"

echo
echo "argument parsing (this off-by-one was written twice)"
chk "node evidence-check.mjs fixtures/pkg-good"                        0 "evidence-check works with no flags"
chk "node evidence-check.mjs fixtures/pkg-good --as-of 2026-09-22"     0 "evidence-check works with --as-of"
chk "node cannibalisation-check.mjs 'GS1 standards'"                   0 "cannibalisation-check works with no flags"
chk "node cannibalisation-check.mjs 'GS1 standards' --url /new-page"   0 "cannibalisation-check works with --url"

echo
[ "$fail" = 0 ] && { echo "all regression checks passed"; exit 0; } || { echo "REGRESSION FAILED"; exit 1; }
