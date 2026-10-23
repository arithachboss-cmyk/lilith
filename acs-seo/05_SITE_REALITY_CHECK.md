# Site Reality Check — 22 October 2026

**This document corrects earlier findings in this pack. Read it before using
`00_SOURCE_PACK_INDEX.md`, `02_PACKAGE_STATUS_BOARD.md`, `data/live-inventory.json`
or `data/clusters.json`.** Those two data files now live under `data/retired/`; see
`06_CRAWL_RECONCILIATION.md`, which supersedes this document on every URL fact.

---

## 1. What prompted it

The Owner identified Lovable project `8cf2dcf0-484f-4bb4-980e-02519f32f9b8` as
asiancoding.com, to apply an SSR fix. Verifying before acting showed it is not the site,
and verifying the site showed that two earlier conclusions in this pack were wrong.

## 2. `8cf2dcf0` is not the website — FACT

It is **ACS ERP Command Center**, an internal staging prototype.

| Evidence | |
|---|---|
| Routes | `audit`, `executive`, `finance`, `fulfillment`, `inventory`, `pricing`, `products`, `purchasing`, `sales`, `settings`, `users`, `index` — twelve, all ERP |
| Components | everything under `src/components/erp/` |
| Data | `src/lib/mock-data.ts` |
| Page title | "Dashboard — ACS ERP Command Center (Staging)" |
| Marketing routes | none — no `/brady/`, no `/knowledge/`, no `/why-acs` |

**Nothing was changed in it.** An SSR migration run there would have rewritten an
unrelated internal prototype.

It is also already on TanStack Start with server-rendered route metadata, so it has no
SSR problem to fix.

## 3. The rendering gate was a misdiagnosis — CORRECTION

**Earlier claim, now withdrawn:** "the site is client-side rendered and serves only
`<title>` to a crawler, so no page can rank until SSR ships."

**What is actually true:**

| URL | Served | Evidence |
|---|---|---|
| `/` | **Full static HTML, body included** | `styles.css?v=4`, `app.js?v=4`, `catalog-data.js?v=5`, `commerce.js?v=4`; all copy present in source |
| `/assessment` | **Fully server-rendered**, substantial content | Next.js/vinext app; complete 3-step form and copy in the HTML |
| `/barcode-scanner-comparison` | **404** | `<h1>404</h1> This page could not be found.` |
| `/why-acs` | **404** | same |

The earlier fetches returned only a `<title>` not because the body was rendered client
side, but **because those pages do not exist.** A 404 has no body to return.

**There is no SSR work to do.** The site renders on the server already.

## 4. The sitemap is stale — the real finding

`00_SOURCE_PACK_INDEX.md` §S-2 lists 82 URLs taken from the live sitemap on 20 Sep 2026.
At least two of them, including the one this pack selected as a publish target, return
404. The homepage's own navigation points somewhere else entirely:
`products.html`, `cart.html`, `commerce-lab.html`, `/assessment`, `/download-profile`,
`/erp`.

**A sitemap that advertises pages which 404 is a real and current SEO problem** —
it spends crawl budget on dead URLs and tells search engines the site is less healthy than
it is. This matters more than anything else currently on the board.

The live domain appears to run **two stacks**: plain static HTML at the root, and a
Next.js/vinext application serving `/assessment` and the other new paths, behind
Cloudflare. How requests are split between them is not established here.

## 5. What this invalidates

| Earlier conclusion | Status |
|---|---|
| Rendering gate blocks indexing site-wide | **WITHDRAWN** — the site is server-rendered |
| Cluster C-1: ten live URLs competing for one intent | **WITHDRAWN** — the C-1 URLs checked return 404; there is no cannibalisation to resolve |
| Decisions D-07 and D-08 on `/barcode-scanner-thailand` | **MOOT** — neither the retiring URL nor the canonical owner exists. Neither was executed, so nothing has to be undone. |
| `/why-acs` as the publish target for the about-ACS copy | **INVALID** — the URL 404s |
| `data/live-inventory.json` (82 pages) and `data/clusters.json` | **UNRELIABLE** — both derive from the stale sitemap |
| CR-06 and CR-10 evidence closures (19 Oct) | **UNAFFECTED** — they rest on email records, not on the site |
| The claim register, the scanner and the evidence checker | **UNAFFECTED** — they operate on draft content, not on URLs |

## 6. What should happen before any more package work

1. **Establish the real URL set.** Crawl from the homepage rather than from the sitemap,
   and record which of the 82 sitemap URLs still resolve. That is the input every other
   artefact in this pack depends on.
2. **Fix or regenerate the sitemap** so it lists only URLs that return 200.
3. **Rebuild `live-inventory.json` and `clusters.json`** from the real set. Until then the
   cannibalisation gate is checking against a site that does not exist, and its verdicts
   should not be trusted.
4. **Re-site the about-ACS copy.** The content and its evidence stand; only the target URL
   was wrong.

## 7. Method note

Both earlier errors came from the same habit: a markdown scrape returning only a title was
read as "client-side rendered" when it equally means "this page is empty or absent". The
HTML, fetched once, settled it immediately. **Fetch the HTML before concluding anything
about how a page renders.**
