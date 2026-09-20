# ACS SEO Package Factory — Owner Report

**20 September 2026 · one page · four decisions needed, one of them by 24 September**

## Where things stand

All 19 packages are `DRAFT_PENDING_REVIEW`. **Nothing is published and none is at `PASS`.**
The governance system you asked for is built: source pack index, central claim register,
status board, reusable QA checklist and the 7-file package template.

The live sitemap of `www.asiancoding.com` was retrieved and classified: **82 URLs — 27
Knowledge, 23 Product, 19 Landing, 13 Service. 61 of them (74%) carry at least one risk flag.**
That is the real finding of this pass.

## The thing that should change your plan

**Cannibalisation is not a queue problem, it is a site problem.** Queue #3 was put on HOLD for
colliding with existing pages. It is not an exception: the live site already runs **ten URLs
competing for one "barcode scanner" commercial intent**, six on barcode printers, seven on
RFID, five on manufacturing. Producing more packages into those clusters adds competitors to
ACS's own pages.

**Recommendation: stop new production into clusters C-1, C-2 and C-3 until each has a named
canonical owner.** Fixing the existing overlap is worth more than 13 more drafts.

## Four decisions

| # | Decision | Why now | Cost of delay |
|---|---|---|---|
| 1 | **Name the canonical owner for cluster C-1** (10 URLs, one intent) | Queue #3 HOLD expires **24 Sep** | Every later package inherits the collision |
| 2 | **Supply the ACS price list with an effective date**, or confirm no prices anywhere | Queue #16, #18 and `/barcode-scanner-price-guide` are stuck | 3 items stay `REVISE` indefinitely |
| 3 | **Supply vendor datasheets** (Brady, Honeywell, TSC) | Queue #4 and 8 spec-flagged live pages | Material and environment claims stay unverifiable |
| 4 | **Supply the keyword queue** (IDs, intent, target URL) | 13 of 19 packages have no identity in this session | 13 packages cannot be tracked at all |

## What the team can finish today without you

- **Queue #17** — rewrite from brand ranking to decision criteria. No dependency.
- **Queue #21** — delete the 65–70% → 95%+ figures. No dependency.
- **Cluster C-8** — `/partner-ecosystem-hub` and `/why-acs/partner-ecosystem` appear to say the
  same thing. One redirect. Cheapest win on the board.

## What I could not verify

The 13 unnamed packages, the ACS product list, prices, vendor datasheets and the keyword queue
were not supplied to this session, and **were not reconstructed or invented**. The site is
client-side rendered, so **no package may be called SEO-ready until Manus resolves
SSR/prerender**, whatever its QA state. The sitemap also carries no `lastmod` on any of its 82
URLs — worth fixing, but only after rendering is settled.
