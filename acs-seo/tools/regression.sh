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
# Rebuilt 2026-10-23 for the real URL set. The old expectations named clusters C-1..C-9
# and URLs like /knowledge/barcode-label-materials — all of which return 404.
chk "node cannibalisation-check.mjs 'เครื่องสแกนบาร์โค้ด ราคา'"                        1 "R-1 holds: head-term owner is a pending Owner decision (D-09)"
chk "node cannibalisation-check.mjs 'ริบบอน wax resin'"                                1 "R-3 holds on D-10, the three-ribbon collision"
chk "node cannibalisation-check.mjs 'about asian coding systems'"                      1 "R-7 holds on D-11: no company page exists"
chk "node cannibalisation-check.mjs 'anything' --url /cart.html"                       1 "a live URL holds"
chk "node cannibalisation-check.mjs 'anything' --url /products/1950g"                  1 "a PLANNED product URL holds too"
chk "node cannibalisation-check.mjs 'anything' --url /erp"                             1 "a non-public live URL holds"
chk "node cannibalisation-check.mjs 'GS1 barcode symbology standards explained'"      0 "an unrelated intent proceeds"
chk "node cannibalisation-check.mjs"                                                  2 "no intent is a usage error"

# The gate must never again run against URLs that do not exist.
# Match an actual read, not the comment that explains why the old one was dropped.
if grep -E 'readFileSync[^)]*live-inventory|from .*live-inventory' cannibalisation-check.mjs >/dev/null; then
  printf 'FAIL  %s\n' "cannibalisation-check still reads the retired live-inventory.json"
  fail=1
else
  printf 'PASS  %s\n' "cannibalisation-check reads real-inventory.json, not the retired file"
fi
inv_planned=$(node -e 'const c=require("./../data/clusters.json").clusters;console.log(new Set(c.flatMap(x=>x.planned_urls||[])).size)')
if [ "$inv_planned" = 14 ]; then
  printf 'PASS  %s\n' "all 14 catalogue products are claimed by a cluster"
else
  printf 'FAIL  %s\n' "clusters cover $inv_planned planned product URLs, expected 14"
  fail=1
fi

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
echo "data/retired/ is an archive, skipped by path not by filename"
chk "node claim-scan.mjs ../data/retired/" 0 "a directory scan of retired/ reports nothing"
ret_files=$(node claim-scan.mjs --json ../data/retired/ 2>/dev/null \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{console.log(JSON.parse(s).files.length)}catch(e){console.log("ERR")}})')
if [ "$ret_files" = 0 ]; then
  printf 'PASS  %s\n' "retired/ contributes 0 files to a scan"
else
  printf 'FAIL  %s\n' "retired/ contributed $ret_files file(s); a rename re-entered the gate"
  fail=1
fi

echo
[ "$fail" = 0 ] && { echo "all regression checks passed"; exit 0; } || { echo "REGRESSION FAILED"; exit 1; }
