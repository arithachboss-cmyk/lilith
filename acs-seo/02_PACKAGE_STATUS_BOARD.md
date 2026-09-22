# ACS SEO — Package Status Board

**As of:** 22 September 2026
**Global state:** all 19 packages are `DRAFT_PENDING_REVIEW`. **Nothing is published. Nothing is approved to publish.**

---

## 1. States

| State | Meaning | Next actor |
|---|---|---|
| `PASS` | Mechanical check clean, no flagged claim open, rendering gate cleared | Owner, to approve publish |
| `REVISE` | Content exists, a specific claim or wording must change | Writer |
| `HOLD` | Do not work on it yet — an upstream decision is missing | Owner / Manus |
| `BLOCKED` | Cannot proceed: depends on a source that does not exist yet | Whoever owns the source |

`PASS` is **not** permission to publish. Publish needs `PASS` **plus** the rendering gate
**plus** Owner sign-off. No package on this board is at `PASS`.

## 2. Board — packages with a recorded Owner decision

| Queue | State | Reason | Claim rows | Blocking dependency | Due |
|---|---|---|---|---|---|
| **#3** | `HOLD` | Cannibalisation — target intent collides with existing live URLs | CR-05 | Intent mapping for cluster C-1 (10 live URLs) | **24 Sep 2026** |
| **#4** | `REVISE` | Material / environment wording states certainty without a datasheet | CR-01, CR-07 | SRC-03 datasheets **+** SRC-02 product list — **revision spec, detection and evidence intake all written**, `packages/queue-4/` | on datasheet, or take Form A now |
| **#16** | `REVISE` | Specific price with no ACS price + effective date | CR-03 | SRC-06 price list — **shared spec, 6 detection rules and an expiry gate written**, `packages/PRICE_CLAIM_SPEC.md` | on price list, or take Form A now |
| **#17** | `REVISE` | Ranks brands; must become decision criteria instead | CR-04 | none — **revision spec written**, `packages/queue-17/REVISION_SPEC.md` | awaiting the draft file |
| **#18** | `REVISE` | Same decision as #16 — one shared spec, no difference between them assumed | CR-03 | same as #16 | same as #16 |
| **#21** | `REVISE` | Performance figures "65–70% → 95%+" must be deleted | CR-02, CR-09 | none — **revision spec written and the deletion is automated**, `packages/queue-21/` + `tools/claim-scan.mjs --fix` | awaiting the draft file |

**#17 and #21 are prepared as far as they can go without the draft files.** Neither needs a
source that does not exist, so both were taken to the point where applying them is
mechanical: #17 has a criteria frame to replace the ranking, and #21's deletion runs as a
single command (`tools/claim-scan.mjs --fix`) that is verified against a fixture. The one
remaining input is the draft article for each, which was never supplied to this session and
was not reconstructed.

**#16 and #18 are prepared, and carry a decision for the Owner.** The decision is not
"never publish a price" — it is no price without an ACS price *and a date*. The second half
is what rots: a figure with no expiry stays on a live page looking sourced long after it is
wrong, which is what `/barcode-scanner-price-guide` is doing now. Detection covers six
kinds of price claim including comparatives and promos, and the expiry gate fails a stale
record and warns 30 days ahead — **but only if it runs on a schedule.** Form A (what drives
cost, plus a quote request) is publishable today with no price list at all.

**#4 is prepared but genuinely cannot reach PASS here.** Its blocker is a source that does
not exist — vendor datasheets, paired with the ACS product list so a datasheet maps to
something ACS actually sells. What is done: detection is automated
(`claim-scan.mjs --strict`), the rewrite rule is written as three permitted forms, evidence
intake has a template, and completeness is machine-checked (`evidence-check.mjs`).
**There is a publishable outcome without any datasheet:** every flagged sentence takes
Form A — state the mechanism, not the product's performance — or is deleted. Waiting is a
choice, not a requirement.

**Verified 22 Sep 2026 — the rendering gate is real, not theoretical.** Two live pages were
fetched with a non-JS crawler (`/barcode-scanner-comparison`, `/knowledge/rfid-vs-barcode`)
and both returned only the `<title>`. No body content is served without JavaScript, so no
package can be called SEO-ready until Manus resolves SSR/prerender.

## 3. Board — the remaining 13 packages

| Queue | State | Reason |
|---|---|---|
| 13 packages, identities **not supplied to this session** | `HOLD` | Queue IDs, titles, target URLs and intents were not provided. They are not reconstructed here. |

**This is a gap, not a finding.** The Owner decisions reference queue numbers up to #21 while
the package count is 19, so the queue is not a contiguous 1–19 range and the missing IDs
cannot be inferred. Supply the keyword queue (SRC-05) and these 13 rows fill in mechanically.

## 4. Counts

| State | Count | Packages |
|---|---|---|
| `PASS` | **0** | — |
| `REVISE` | 5 | #4, #16, #17, #18, #21 |
| `HOLD` | 14 | #3, plus 13 whose identity was not supplied |
| `BLOCKED` | 0 | none recorded — but #4, #16 and #18 become `BLOCKED` if their source never arrives |
| **Total** | **19** | |

## 5. Critical path

1. **By 24 Sep** — Owner names the canonical owner for cluster C-1. Unblocks #3 and stops the
   next packages from inheriting the same collision.
2. **Now** — writer clears #17 and #21. No dependency.
3. **On SRC-06 (price list)** — #16 and #18.
4. **On SRC-03 (vendor datasheets)** — #4.
5. **On SRC-05 (keyword queue)** — the 13 unidentified packages get real rows.
6. **Manus** — SSR/prerender decision. Until then no package may be called SEO-ready.
