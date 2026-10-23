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
chk "node claim-scan.mjs ../packages/about-acs/draft-v2-full.md"      1 "partner, customer and tenure claims are caught"
chk "node claim-scan.mjs ../packages/about-acs/draft-v1-publishable.md" 0 "the publishable version is clean"
chk "node claim-scan.mjs ../packages/about-acs"                       1 "directory scan skips governance files but still finds the draft"
chk "node claim-scan.mjs ../packages/about-acs/publish"               0 "the publish-ready HTML is clean"
chk "node claim-scan.mjs fixtures/date-not-a-price.md"                0 "an ISO date is not read as a price range"
chk "node claim-scan.mjs fixtures/comment-warning.html"               0 "an HTML comment warning about a claim is not itself a claim"

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
chk "node evidence-check.mjs ../packages/about-acs/publish"              0 "the about-ACS evidence records are complete"
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
echo "CR-08 'serving' must need an actual customer (a bare 'serving' matched JSON keys)"
chk "node claim-scan.mjs fixtures/cr08-serving.md" 1 "cr08 fixture still fails the gate"
# The fixture is split: true positives above the FALSE POSITIVES marker, decoys below.
# Only the line numbers matter here, so count CR-08 hits on each side separately.
cr08_split=$(grep -n 'FALSE POSITIVES' fixtures/cr08-serving.md | cut -d: -f1)
cr08_hits=$(node claim-scan.mjs fixtures/cr08-serving.md 2>/dev/null | grep -o 'CR-08' | wc -l | tr -d ' ')
cr08_decoys=$(node claim-scan.mjs fixtures/cr08-serving.md 2>/dev/null \
  | awk -v s="$cr08_split" '/CR-08/ { split($1,a,":"); if (a[1]+0 > s) n++ } END { print n+0 }')
if [ "$cr08_hits" -ge 7 ]; then
  printf 'PASS  %s\n' "cr08: all 7 real customer claims are caught ($cr08_hits findings)"
else
  printf 'FAIL  %s\n' "cr08: only $cr08_hits findings, expected at least 7"
  fail=1
fi
if [ "$cr08_decoys" = 0 ]; then
  printf 'PASS  %s\n' "cr08: no false positive on 'serving' without a customer"
else
  printf 'FAIL  %s\n' "cr08: $cr08_decoys false positive(s) below the decoy marker"
  fail=1
fi

echo
[ "$fail" = 0 ] && { echo "all regression checks passed"; exit 0; } || { echo "REGRESSION FAILED"; exit 1; }
