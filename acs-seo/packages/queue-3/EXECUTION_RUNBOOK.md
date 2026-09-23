# Queue #3 — Execution Runbook: Option A

**Decision D-07 · 23 September 2026 · ACS Owner chose Option A**
301 `/barcode-scanner-thailand` → `/เครื่องสแกนบาร์โค้ด`, and pair the two head-term pages
with hreflang instead of letting them compete.

**Nothing in this runbook has been executed.** No production site, DNS, CMS or sitemap was
touched by this session, and none can be from here. This is the sequence for whoever holds
the deploy.

---

## 0. Do not start yet — one blocking precondition

**The rendering gate must clear first.** Two C-1 pages were fetched without JavaScript and
returned only their `<title>` — no body. Until SSR/prerender ships:

- A 301 consolidates signals that **do not currently exist**, so it buys nothing.
- hreflang tags that only appear after client-side hydration are not read.
- If the redirect lands first and SSR lands later, the consolidation has to be re-verified
  anyway, with a URL already destroyed.

Waiting costs nothing here: the collision is between pages that cannot currently rank.
**Execute steps 1–5 only after Manus confirms SSR/prerender is live.**

## 1. hreflang pairing — do this before the redirect

The two surviving head-term pages stop being duplicates the moment they declare each other.

| Page | Declares |
|---|---|
| `/เครื่องสแกนบาร์โค้ด` | `hreflang="th"` self · `hreflang="en"` → `/barcode-scanners` · `hreflang="x-default"` → itself |
| `/barcode-scanners` | `hreflang="en"` self · `hreflang="th"` → `/เครื่องสแกนบาร์โค้ด` · `hreflang="x-default"` → `/เครื่องสแกนบาร์โค้ด` |

Rules that decide whether this works:
- **Absolute URLs.** Relative hreflang is ignored. (Same defect was found in the Lili
  prototype's SEO scaffolding — it is a common one.)
- **Reciprocal.** An unreciprocated hreflang is discarded.
- **Server-rendered.** See step 0.
- `x-default` points at Thai because the market is Thailand.

Verify before moving on: fetch both pages **without JavaScript** and confirm both sets of
tags are in the served HTML.

## 2. The redirect

```
301  /barcode-scanner-thailand  →  /เครื่องสแกนบาร์โค้ด
```

- **301, not 302.** A temporary redirect does not consolidate.
- **One hop.** Not via `/barcode-scanners` and then on; a chain leaks.
- The Thai URL is percent-encoded in transit
  (`/%E0%B9%80%E0%B8%84%E0%B8%A3%E0%B8%B7%E0%B9%88%E0%B8%AD%E0%B8%87...`). Configure the
  rule so it emits exactly the encoded form the sitemap already uses, or the redirect
  target and the canonical URL will differ by encoding and be treated as two URLs.

## 3. Internal links — the step that gets skipped

Every internal link still pointing at `/barcode-scanner-thailand` must be repointed at the
destination. Leaving them means every internal click takes a redirect hop, and the retiring
URL keeps being re-discovered.

**The audit cannot be done by crawling the live site** — the body is not served to a
crawler (step 0). Run it against **the CMS or the source repository**, not the rendered HTML.

Search for: `barcode-scanner-thailand` in page content, navigation, footers, and any
hard-coded link maps.

## 4. Sitemap

- Remove `/barcode-scanner-thailand`.
- While in there: the sitemap carries `changefreq` and `priority` on all 82 URLs but
  **no `lastmod` on any of them**. Search engines largely ignore the first two and use the
  third, so the sitemap currently gives no freshness signal at all. Adding `lastmod` is
  worth doing in the same change — but only after SSR, per step 0.
- Do **not** submit the sitemap while `robots.txt` or the pages are still non-indexable.

## 5. The seven modifier pages

They keep their URLs. Two rules apply to each:

1. **None may target the bare head term** in its `<title>` or `<h1>`. Each keeps its own
   differentiator — industrial, wireless, warehouse, retail, 2D, long range, Honeywell.
2. **Each links up to the canonical owner in its own language** — Thai pages to
   `/เครื่องสแกนบาร์โค้ด`, English to `/barcode-scanners`.

One of them needs a separate check: `/honeywell-barcode-scanner` names a vendor, so it sits
under **CR-06 (partner claim, EVIDENCE_REQUIRED)**. Its title currently reads
"Honeywell Barcode Scanner Reference | ACS" — the word *Reference* is doing useful work
there and should stay until the vendor authorisation documents exist.

## 6. Verification after execution

| Check | Pass condition |
|---|---|
| `curl -I /barcode-scanner-thailand` | single `301`, `Location` = the encoded Thai URL |
| Redirect chain | exactly one hop, no `302`, no loop |
| Both head-term pages, JS disabled | reciprocal hreflang present in the served HTML |
| Canonical tags | each head-term page self-canonicals; neither canonicals to the other |
| Internal links | zero remaining references to the retired path in the source |
| Sitemap | retired URL absent; no new 404 introduced |
| `node acs-seo/tools/cannibalisation-check.mjs "เครื่องสแกนบาร์โค้ด"` | `PROCEED_WITH_CANONICAL` |

Then update `data/live-inventory.json` by regenerating it from the source pack index, and
set `decision.executed = true` in `data/clusters.json`.

## 7. Rollback

Remove the 301 and restore the page. The cost of rollback rises the longer the redirect has
been live and the more the old URL has been dropped from the index, which is the other
reason not to execute before step 0 clears — a redirect executed against pages that cannot
rank is all cost and no benefit.

## 8. Out of scope for this decision

- The other seven clusters still have **no canonical owner**. C-2, C-3 and C-5 are the next
  most severe. The gate holds any new package targeting them, which is the correct default.
- `C-8` — `/partner-ecosystem-hub` and `/why-acs/partner-ecosystem` appear to say the same
  thing and are one redirect apart. Cheapest remaining item on the board, but it is a
  separate Owner decision, not part of D-07.
