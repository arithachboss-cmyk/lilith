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

## 4. Why this is a spec and not a commit

The Owner authorised the change. I could not locate the deployment source from this
session: it is not in any reachable GitHub repo (`arithachboss-cmyk/lilith`,
`the-middle-th/middle-property-rental-intelligence`,
`arithachboss-cmyk/creativex2026-chula-cea-arithach`), not in either Lovable
workspace, and there are no Vercel projects, no matching Netlify project and no
WordPress.com sites.

Circumstantial evidence points at OpenAI/ChatGPT site hosting: `/erp` links to
`acs-portal-six.yacht369.chatgpt.site` and `/signin-with-chatgpt` serves OpenAI's
own sign-in page on the ACS origin. That is a surface this session has no API access
to.

**To get this applied, one of:** point me at the repo or host that deploys
`catalog-data.js`, grant this session access to it, or hand this spec to whoever
has it. The patch is exact; nothing here needs re-deriving.
