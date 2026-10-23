# Dead-link fix spec — ready to apply

**Authorised by:** Owner, 2026-10-23 ("granted")
**Status:** SPEC ONLY — not applied. See §4 for why.
**Evidence:** every URL below was fetched and confirmed 404 on 2026-10-23.
Recorded in `../../data/real-inventory.json` (DEF-04, DEF-05).

This is the smallest change on the reconciliation list and the only one that is
costing ACS customers today: six links on the live site lead to 404s.

---

## 1. `catalog-data.js` — five dead product links

Served at `https://asiancoding.com/catalog-data.js?v=5`.

Two distinct fields are affected, and they behave differently:

- `url` — the primary reference link. On three entries it points at a dead ACS page.
- `acsUrl` — a secondary ACS link. On two entries it points at a dead ACS page.

### 1a. `url` → repoint to the live on-site category filter

These three entries are categories, not models. Their `referenceLabel` is already
"ดูข้อมูลหมวดสินค้าจาก ACS", so an on-site destination is the faithful fix.

| `id` | current `url` (404) | replace with |
|---|---|---|
| `rfid` | `https://www.asiancoding.com/rfid-systems` | `products.html?category=rfid` |
| `labels` | `https://www.asiancoding.com/barcode-printers` | `products.html?category=labels` |
| `wax-ribbons` | `https://www.asiancoding.com/barcode-ribbons` | `products.html?category=ribbons` |
| `wax-resin-ribbons` | `https://www.asiancoding.com/barcode-ribbons` | `products.html?category=ribbons` |
| `resin-ribbons` | `https://www.asiancoding.com/barcode-ribbons` | `products.html?category=ribbons` |

Note `labels` currently points at `/barcode-printers`, which was wrong on two counts:
it is a 404 *and* it was the printers page on a labels entry.

That is five rows but only three distinct dead URLs, because the three ribbon
entries share one.

### 1b. `acsUrl` → remove the field

| `id` | current `acsUrl` (404) |
|---|---|
| `1950g` | `https://www.asiancoding.com/ads/barcode-scanner` |
| `m510` | `https://www.asiancoding.com/brady/printers/m510` |

Both entries already carry a working manufacturer `url` (Honeywell and BradyID
respectively), so deleting `acsUrl` loses nothing and restores a working page.

**Do not** repoint these two to `products.html?category=…`: the user is already on
the catalogue when they see them, so it would link a product back to its own list.

⚠️ **Verify before applying:** I did not have `app.js`/`commerce.js`, so I have not
read how `acsUrl` renders when absent. Confirm the renderer treats a missing
`acsUrl` as "no secondary link" and does not emit an empty `<a>`. If it cannot
handle absence, repoint to `products.html?category=scanners` / `?category=printers`
instead and accept the self-referential link as the lesser fault.

---

## 2. Footer — one dead link, every page

Present in the footer of `index.html`, `products.html`, `cart.html`.

```html
<a href="https://www.asiancoding.com/contact" target="_blank" rel="noopener">Contact ACS</a>
```

`https://www.asiancoding.com/contact` → **404**.

The site already has a working contact affordance: `<dialog id="contact-dialog">`,
opened by elements carrying `data-quote`. Replace the dead anchor with the same
trigger the rest of the page uses:

```html
<button data-quote>Contact ACS</button>
```

This keeps the footer item working without inventing a page. If a real contact page
is wanted later it should be built and then linked — not linked first.

### Also in the same footer

```html
<a href="https://www.asiancoding.com/" target="_blank" rel="noopener">About Asian Coding Systems</a>
```

This resolves (200) but only to the homepage the user is already on, labelled
"About". Not a 404, so out of scope for this fix, but it is the natural home for
the approved about-ACS copy in `../about-acs/draft-v3-evidenced.md` once §3 of
`../../06_CRAWL_RECONCILIATION.md` is settled.

---

## 3. Verification after applying

1. Fetch each of the three new `url` targets and confirm 200.
2. Open the catalogue and confirm every product card's reference link resolves.
3. Confirm the footer "Contact ACS" opens the contact dialog on all three pages.
4. Re-run `node tools/claim-scan.mjs` over any changed `.html` — the scanner covers
   `.html` and `.htm`, which is why it was added.

---

## 4. Where to apply it

**The platform is ChatGPT sites hosting (`*.chatgpt.site`), behind Cloudflare.** Identified
2026-10-23; the evidence is in `../../06_CRAWL_RECONCILIATION.md` §9 and
`../../data/real-inventory.json` → `hosting`. The ACS workspace subdomain is
`yacht369.chatgpt.site`, which already serves a sibling site at
`acs-portal-six.yacht369.chatgpt.site`.

Good news for this patch: **the site is not a framework app.** Every page is hand-written HTML
with plain CSS and JS, so `catalog-data.js` is an editable static file rather than a build
artefact. The change is a text edit in five `url`/`acsUrl` values and one footer anchor.

**Apply it wherever the `yacht369` ChatGPT workspace manages this site.** This session has no API
access to that platform, which is the only reason this is still a spec. Ruled out by checking:
no matching GitHub repo among the three reachable, neither Lovable workspace, zero Vercel
projects, one unrelated Netlify project, zero WordPress.com sites.

### One thing to watch when applying

Assets are cache-busted by query string, and the versions are not in step: every page loads
`catalog-data.js?v=5` except `/sales`, which loads `?v=4`. If the fix is published without
bumping the version, Cloudflare may keep serving the old file. **Bump `catalog-data.js` to `?v=6`
in every page that references it** — `index.html`, `products.html`, `cart.html` and `sales`
— so the corrected links actually reach visitors.

## 5. Also found while looking for the source

`/sales` returns 200 unauthenticated, carries no robots meta, and has no auth gate in its served
HTML, while listing customer requests. That is DEF-08, it is urgent, and it is not an SEO
problem. See `../../06_CRAWL_RECONCILIATION.md` §9 — including what was deliberately **not**
verified and why.
