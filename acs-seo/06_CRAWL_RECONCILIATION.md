# 06 · Crawl vs sitemap reconciliation

**Crawled:** 2026-10-23 · **Host:** asiancoding.com (apex and www) · **Method:** entered at the
homepage and followed internal links; separately fetched all 82 sitemap URLs.
Every fetch went through Brightdata, because the sandbox egress proxy blocks the domain.

**Status of this pack:** still `DRAFT_PENDING_REVIEW`. Nothing here was published, deployed or
changed on the live site. This document records what the site *is*, so the rest of the pack can
stop describing a site that no longer exists.

---

## 1. The headline

| | |
|---|---|
| URLs in the 2026-09-20 sitemap | 82 |
| Of those, still resolving | **1** (`/`) |
| Of those, returning 404 | **81** |
| Sitemap file itself | **gone** — `/sitemap.xml` and `/sitemap_index.xml` both 404 |
| `Sitemap:` directive in robots.txt | **none** |
| Distinct pages actually live | **6** public, plus 2 auth-gated |
| Addresses serving those 6 pages | **12** |
| Apex vs www | **resolved** — apex 301s to www |
| Canonical tags found | **0** |

All 82 were fetched individually. This is not a sample.

The site was rebuilt and the old structure was not carried across. The SEO work in this pack up
to now was planned against the sitemap, so its URL-level conclusions were planned against a site
that had already been replaced.

---

## 2. What is actually live

Six public pages. The apex 301-redirects to www, so www is the live host. Each page is then
reachable at two addresses on it — with and without `.html` — and none declares a canonical.

| Page | Addresses (on www) | Rendering |
|---|---|---|
| Home | `/`, `/index.html` | Server-rendered static HTML |
| Product catalogue | `/products.html`, `/products` | **Mixed** — see §4 |
| Cart / request submission | `/cart.html`, `/cart` | Server-rendered; cart loads client-side |
| Commerce Lab (Shopify sandbox) | `/commerce-lab.html`, `/commerce-lab` | Shell server-rendered, app client-side |
| Assessment intake | `/assessment`, `/assessment.html` | Fully server-rendered, form included |
| Download profile | `/download-profile`, `/download-profile.html` | Fully server-rendered |

Live but not public, and not for indexing: `/erp` and `/planning-inbox`, both auth-gated.

`/signin-with-chatgpt` serves **OpenAI's own sign-in page under the asiancoding.com origin**.
That is raised here for the Owner as a trust question, not an SEO one: a third-party credential
form on ACS's own domain is worth a deliberate decision either way.

---

## 3. Defects found, worst first

**DEF-01 · The sitemap is gone.** Both sitemap URLs 404 and robots.txt names no sitemap. Nothing
tells a crawler what the site contains.

**DEF-02 · 81 dead URLs with no redirects.** Every inbound link, bookmark and indexed result
pointing at the old structure lands on a 404.

**DEF-03 · Two-way duplication, zero canonicals.** *(Corrected 2026-10-23 — see §8.)* Each of
the six pages answers at two addresses, with and without `.html`, both 200 with identical bytes
and no canonical tag. `app.js` rewrites `/products` to `/products.html` in the address bar, but
that is client-side and no crawler sees it. The apex-vs-www half of this is **not** a defect:
the apex 301s to www.

**DEF-04 · The live catalogue links to ACS's own dead pages.** `catalog-data.js` sends 5 of the 14
products to ACS paths that 404. All five were fetched and confirmed:

| Product | Link target | Status |
|---|---|---|
| Honeywell Xenon XP 1950g | `/ads/barcode-scanner` | 404 |
| Brady M510 | `/brady/printers/m510` | 404 |
| Handheld RFID Systems | `/rfid-systems` | 404 |
| Barcode Labels & Tags | `/barcode-printers` | 404 |
| Wax / Wax-Resin / Resin Ribbon | `/barcode-ribbons` | 404 |

A customer clicking "ดูข้อมูลหมวดสินค้าจาก ACS" reaches a 404. This is a live customer-facing
defect, not a ranking one, and it is the cheapest thing on this list to fix.

**DEF-05 · Site-wide broken footer link.** Every page's footer links to
`https://www.asiancoding.com/contact` → 404. It is the highest-intent item in the footer.

**DEF-06 · The 14 products have no URLs.** Product detail opens in a `<dialog>`, so no product
page exists to rank and no product content is crawlable.

**DEF-07 · Commerce Lab is indexable.** A self-declared simulation carrying sample prices and
stock is publicly crawlable. Worth a `noindex` regardless of CR-03, since ACS did not author
those numbers as price claims but a crawler cannot tell.

---

## 4. The rendering gate, stated correctly this time

Earlier in this project I concluded the site was client-side rendered, then withdrew it when the
HTML showed full server-rendered markup. Both statements were too broad. What the HTML actually
shows:

- Page chrome, headings, breadcrumbs, body copy, forms: **server-rendered**. `/assessment` and
  `/download-profile` render their entire multi-step forms in source.
- The product grid: **client-side**. `<div class="product-grid" id="product-grid"></div>` is empty
  in source and filled from `catalog-data.js?v=5`.

So the gate applies to one component, not to the site. The 14 products and their Thai titles,
descriptions, features and keywords — the only product text on the domain — are not in any
server response.

---

## 5. What this corrects in the rest of the pack

| Artefact | Status after this crawl |
|---|---|
| `data/live-inventory.json` (82 pages) | **RETIRED.** 81 of 82 rows describe 404s. Superseded by `data/real-inventory.json`. |
| `data/clusters.json` (C-1 … C-9) | **RETIRED.** Every cluster owner and member 404s. No cannibalisation exists to resolve. |
| `data/c1-cluster.json` | **RETIRED.** All 10 URLs 404. |
| `00_SOURCE_PACK_INDEX.md` §S-2, §S-3 | **SUPERSEDED** for URL facts. Source-stream status is unaffected. |
| Cannibalisation gate (`tools/cannibalisation-check.mjs`) | **Code is sound, data was not.** Re-point it at `real-inventory.json` before trusting a verdict. |
| Decisions D-07 / D-08 (`/barcode-scanner-thailand`) | **MOOT.** Neither URL exists. Neither was executed. |
| `/why-acs` as publish target for the about-ACS copy | **INVALID.** Needs a new home among the 6 live pages. |
| CR-06 and CR-10 evidence closures | **UNAFFECTED.** They rest on email records, not on URLs. |
| Claim register, claim scanner, evidence checker | **UNAFFECTED.** They operate on draft content, not on URLs. |

The governance machinery survives. What failed was the URL inventory feeding it, and only
because it was taken from a sitemap instead of from the site.

---

## 6. Recommended order of work, cheapest first

These are recommendations for the Owner, not actions taken.

1. **Fix DEF-04 and DEF-05** — edit five link targets in `catalog-data.js` and one in the footer.
   Smallest change on this list, and it stops sending real customers to 404s today.
2. **Publish a sitemap** listing the 6 live pages at one chosen address each, and add the
   `Sitemap:` line to robots.txt.
3. **Pick a canonical host and form** (recommend `https://www.asiancoding.com` + extensionless),
   301 the other three variants, and add self-referencing canonicals.
4. **`noindex` `/commerce-lab`, `/erp`, `/planning-inbox`.**
5. **Decide on the 81 dead URLs.** For any that still earn traffic or links, 301 to the nearest
   live page; the rest can stay 404. This needs Search Console data, which this pack does not
   have — Ahrefs returned "Insufficient plan" and OpenRush "Insufficient credits".
6. **Decide whether products get URLs.** Until they do, there is no product-page SEO to do, and
   queue items #4, #16, #17, #18 and #21 have nowhere to publish to.

Step 6 is the one that gates the remaining queue. Everything in that queue was written for a
site with product and knowledge pages. Six pages cannot absorb it.

---

## 7. Method note

The method note in `05_SITE_REALITY_CHECK.md` said: fetch the HTML before concluding anything
about how a page renders. This crawl adds a second rule.

**Verify the URL set against the site, not against the sitemap.** A sitemap is a claim about a
site, and like every other claim in this pack it needs checking before anything is built on it.
An 82-row inventory that nobody fetched read exactly like an 82-row inventory that was true, and
produced nine clusters, two Owner decisions and a cannibalisation gate — all of them about pages
that return 404. The check cost nine batched fetches.

---

## 8. Correction, 2026-10-23

Two things in the first version of this document were wrong, both for the same reason, and both
are corrected above rather than quietly edited out.

**The apex does redirect to www.** I recorded "neither redirects to the other". It 301s. The
error came from reading batched scrapes that follow redirects silently: fetching
`asiancoding.com/` and `www.asiancoding.com/` both returned the homepage, which I read as two
independently reachable hosts rather than one plus a redirect. The response chain, requested
once, settled it. So DEF-03 is **medium, not high**, and the address count is 12, not 24.

**`/products` is not an HTTP redirect to `/products.html`.** It returns 200 directly; `app.js`
then rewrites the address bar. So the remaining duplication is real and a crawler does see both
200s — the browser's final URL made it look resolved when it was not. This half of DEF-03 stands.

Also found: **`GET /api/cart` returns 200**, so the site has a server-side API and is not
purely static hosting. That matters for the product-URL decision, because it means
server-rendering product pages is feasible on the stack that already exists.

**Method rule, third one.** The first two were: fetch the HTML before judging how a page
renders; verify the URL set against the site, not the sitemap. This one is narrower and sharper:
**a tool that follows redirects hides them.** Status codes are evidence; a final rendered page
is not. Read the response chain before claiming anything about redirects or canonicalisation.
