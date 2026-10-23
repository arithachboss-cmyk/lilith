# Product URL spec

**Owner decision, 2026-10-23:** products get their own URLs. ("yes")
**Status:** DRAFT_PENDING_REVIEW. Spec only — nothing built, nothing published.

Today the 14 products have no addresses at all. Detail opens in
`<dialog id="product-dialog">`, and the grid itself is empty in the served HTML and
filled client-side from `catalog-data.js`. So there is no product page to rank and no
product text a crawler can read (`../../06_CRAWL_RECONCILIATION.md` DEF-06, §4).

This decision unblocks queue items #4, #16, #17, #18 and #21, which were all written
for a site with product pages. It also raises the stakes on every spec figure in the
catalogue, which §3 is about.

---

## 1. URL scheme

```
/products/<id>
```

using the `id` already in `catalog-data.js`, so no new identifier is invented:

```
/products/1950g      /products/te200       /products/zt411
/products/tc22       /products/m510        /products/ds3600
/products/1960g      /products/zd421       /products/ds2208
/products/rfid       /products/labels
/products/wax-ribbons  /products/wax-resin-ribbons  /products/resin-ribbons
```

Rules, all of which follow from defects the crawl found:

- **One address per product.** Do not also serve `/products/<id>.html`. The six
  existing pages each answer at two addresses with zero canonicals (DEF-03); do not
  extend that pattern. Put product pages on **www**, which the apex already 301s to.
- **Self-referencing canonical** on every product page, on the chosen host.
- **Server-rendered.** A client-side product page is worth nothing here — the whole
  point is crawlable product text. If the page cannot be server-rendered, this
  decision delivers no SEO value and should be deferred rather than shipped.
  This is feasible on the current stack: `GET /api/cart` returns 200, so a
  server-side layer already exists (`../../data/real-inventory.json` → `backend`).
- Keep `products.html?category=…` working as the filtered list. Those are query
  parameters on one page, not separate URLs, so they need no canonical work.

## 2. What belongs on a product page

Everything below already exists in `catalog-data.js`. This decision does not require
new copy, which is why it is cheap — the expensive part is §3.

| Element | Source field |
|---|---|
| `<h1>` | `thaiTitle`, falling back to `name` |
| Lead paragraph | `thaiDescription` |
| Spec list | `features[]` |
| Brand | `brand` |
| Category + breadcrumb | `category` → the matching `categories[]` entry |
| Manufacturer reference link | `url` |
| Image | `image` |
| Add-to-cart | existing `commerce.js` behaviour |

`keywords` stays out of the rendered page. It is an internal search aid, and the
strings in it ("เครื่องสแกนบาร์โค้ด เครื่องอ่านคิวอาร์โค้ด …") are a keyword list, not prose.

## 3. The claim problem this creates — read before building

Publishing these pages turns the catalogue's spec figures from client-side text into
indexable ACS assertions. Several are hard numbers that **CR-07 (vendor specs)** and
**CR-01 (material/environment)** require a datasheet for:

| Product | Figure asserted in `features[]` | Register row |
|---|---|---|
| `1950g` | `IP52`, `0–50 °C` | CR-07, CR-01 |
| `1960g` | `IP52` | CR-07 |
| `m510` | `300 dpi`, `1.5 นิ้ว (38.1 มม.)` | CR-07 |
| `zd421` | `203 หรือ 300 dpi` | CR-07 |
| `ds2208` | `640 × 480 พิกเซล` | CR-07 |

These are exactly the claims Owner decision Queue #4 covers: **ห้ามฟันธงถ้าไม่มี
datasheet สินค้าจริง.** They are already on the live site, which is a pre-existing
exposure this spec did not create — but giving them a URL each makes them the page's
main content, and `SRC-03` (datasheets) is still an open source gap.

**Gate:** run `tools/evidence-check.mjs` against each product before its page goes
live. A product whose figures have no attached datasheet ships its page **without the
figure**, not with the figure unsourced. The manufacturer `url` is a reference, not
evidence: a link is not a quoted spec with measured conditions.

### Reuse the site's own provenance marking

`catalog-data.js` already carries an `evidence` field. Its distribution:

| Value | Count | Products |
|---|---|---|
| `manufacturer_reference` | 7 | `te200`, `zt411`, `tc22`, `ds3600`, `1960g`, `zd421`, `ds2208` |
| `acs_named_family` | 3 | the three ribbon entries |
| `acs_named_model` | 2 | `1950g`, `m510` |
| *(field absent)* | 2 | `rfid`, `labels` |

Map these onto the claim register rather than inventing a parallel scheme. The two
entries with **no** `evidence` field are the weakest and should be last in the build
order, or left as category pages rather than product pages — `rfid` has
`kind: "solution"` and `labels` has `kind: "supplies"`, so neither is really a product
anyway.

By `kind`: 7 `model`, 2 `family`, 4 `supplies`, 1 `solution`. Only the 7 models are
unambiguously product pages.

## 4. Build order

1. **The 7 `kind: "model"` products**, lowest risk and clearest intent. Figures
   stripped where no datasheet is attached.
2. **The 2 `kind: "family"` products** (`tc22`, `ds3600`). A family page must not read
   as a single model — `tc22` covers TC22 *and* TC27.
3. **Sitemap + canonicals**, covering the 6 existing pages and the new product pages
   together. Nothing should be published before there is a sitemap to list it in
   (DEF-01).
4. **The 4 `supplies` and 1 `solution` entries**, as category pages, after a decision
   on whether they are products at all.

## 5. What this unblocks, and what it does not

**Unblocks:** queue #4 (material/environment wording now has product pages to live on),
#16/#18 (price claims now have a page each, still subject to `PRICE_CLAIM_SPEC.md`),
#17 (decision criteria now have somewhere to sit), #21 (figures now have a page —
still deleted until evidence exists).

**Does not unblock:** anything needing `SRC-02` (product list), `SRC-03` (datasheets),
`SRC-06` (price list), `SRC-07` (stock and lead time) or `SRC-08` (support coverage).
Those gaps are unchanged by this decision. In particular #16/#18 still cannot carry a
specific price without an ACS price list carrying a date.

## 6. Cannibalisation

**Done 2026-10-23.** `tools/cannibalisation-check.mjs` now reads
`../../data/real-inventory.json` plus the 14 planned `/products/<id>` URLs, and
`../../data/clusters.json` has been rebuilt as R-1 … R-7 from the real site. The
sitemap-era clusters are in `../../data/retired/`.

The cluster map was built *before* the pages exist, which is the point: the collisions
are visible now, while they still cost nothing to avoid.

| Cluster | Collision once built | Blocked on |
|---|---|---|
| R-3 ribbons | **Highest.** Three entries differing only in ribbon type, sharing one `url` today. | D-10 |
| R-1 scanners | Four pages; `1950g` and `1960g` are both Honeywell Xenon handhelds. | D-09 |
| R-2 printers | Four pages; `te200` and `zd421` are both desktop printers. | D-09 |
| R-7 company | No company page exists at all; `/why-acs` 404s. | D-11 |

All seven owners are `null`, so the gate currently HOLDs every head-term package and
names the decision that is blocking it. That is correct: the product-URL decision settled
the product level, not which page owns a generic head term. Three Owner decisions are
pending, recorded in `decisions_needed` in `clusters.json`:

- **D-09** — do category pages get their own URLs, or is `/products.html?category=X` the
  canonical home for each category head term?
- **D-10** — three ribbon pages with one owning the head term, or one page covering the
  choice?
- **D-11** — where does the approved about-ACS copy live now that `/why-acs` 404s?
