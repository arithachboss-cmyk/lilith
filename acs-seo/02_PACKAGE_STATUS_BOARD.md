# ACS SEO — Package Status Board

**As of:** 20 September 2026
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
| **#4** | `REVISE` | Material / environment wording states certainty without a datasheet | CR-01, CR-07 | SRC-03 vendor datasheets | on datasheet |
| **#16** | `REVISE` | Specific price with no ACS price + effective date | CR-03 | SRC-06 ACS price list | on price list |
| **#17** | `REVISE` | Ranks brands; must become decision criteria instead | CR-04 | none — rewrite now | immediate |
| **#18** | `REVISE` | Same as #16 | CR-03 | SRC-06 ACS price list | on price list |
| **#21** | `REVISE` | Performance figures "65–70% → 95%+" must be deleted | CR-02 | SRC-03 evidence, or delete | immediate |

**#17 and #21 are the only two that can be finished today** — neither needs a source that does
not exist. #17 is a rewrite from ranking to criteria; #21 is a deletion. Both are pure writer work.

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
