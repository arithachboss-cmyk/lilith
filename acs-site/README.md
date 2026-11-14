# ACS website rebuild

A rebuild of asiancoding.com as a tested static site. **It runs in demo mode and is not
deployed anywhere.** Nothing here touches the live domain, DNS or traffic; go-live is a
separate Owner decision with its own gate (backup, rollback plan, explicit approval).

PRD: https://claude.ai/artifact/YXVU5Vr7byRo78XAD1rino

## Run it

```sh
npm install
npm run build      # renders dist/ and writes dist/build-report.json
npm test           # unit tests (Vitest) → test-results/unit.json
npm run verify     # canonical, sitemap and structured-data rules on a live-config variant → test-results/
npm run stamp      # re-stamp page versions after changing page content; commit the result
npm run e2e        # Playwright + axe against the preview server → test-results/
npm run claims     # ACS claim scanner over the built HTML → test-results/claims.json
npm run cwv        # lab Core Web Vitals on a throttled phone profile → test-results/cwv.json
npm run qa         # all of the above, then the T1–T18 matrix → test-results/summary.json
node tests/qa/offline.mjs <scratch-dir>   # T2: clean clone, no network (Linux, root, unshare)
npm run preview    # serve dist/ on http://127.0.0.1:4173
```

`npm run e2e` expects Playwright to be installed globally (it is in the build container).
Do not add it as a project dependency. It starts its own preview server on a free port and
checks that the server answering is this project's, because a fixed port once left it
testing a stale server from an earlier run.

## Increments

| # | What | Unit | E2E | Claims |
|---|---|---|---|---|
| M0 | Skeleton: 20 pages reachable in demo mode, one status config, store boundary, evidence gate, enquiry wizard, basket | 82/82 | 30/30 | BLOCKED 0 |
| M1 | Discoverability: one address per page, self-referencing canonical, sitemap of exactly the indexable pages, robots naming it; family pages say so | 108/108 | 34/34 | BLOCKED 0 |
| M2a | Product structured data with no price, offer, availability or rating; sitemap `lastmod` from a committed content-hash manifest | 125/125 | 35/35 | BLOCKED 0 |
| M2b | Owner decisions D-09, D-10, D-11 built: six category pages, the ribbon category owning the ribbon choice, the approved company copy at `/about/` with `/why-acs` and `/company` redirecting to it; evidence drafts and a recorded-approval path | 169/169 | 41/41 | BLOCKED 0 |
| M2c | Evidence drafts for five of the seven held-back figures, each quoting the manufacturer's own page; the gate now compares number and unit (Thai or English spelling) and rejects a longer number that merely ends the same way | 176/176 | 41/41 | BLOCKED 0 |
| M2d | Brady M510 page read: a ready draft for 300 dpi; the label-width line stays blocked because the source states inches only | 177/177 | 41/41 | BLOCKED 0 |
| M2e | Owner decision D-12: the M510 label width is shown in inches only, as Brady states it. Recorded as an override beside the untouched snapshot; all seven drafts now wait only for an approver | 184/184 | 41/41 | BLOCKED 0 |
| M2f | The Owner approved all seven evidence records. The seven spec figures are now shown, each on its product page with its source named; nothing is held back | 186/186 | 41/41 | BLOCKED 0 |
| M3 (author's part) | QA harness, acceptance matrix T1–T18, offline clean-checkout run, lab Core Web Vitals; two defects found and fixed | 127/127 | 39/39 | BLOCKED 0 |

`npm run verify` on the live-config variant: 13/13 at M1, 23/23 at M2a (17 URLs in its sitemap),
25/25 at M2b (24 URLs). The M3 row was measured before M2b; `QA.md` carries the current run.

**M3 is not closed.** The QA pass is in [`QA.md`](QA.md): 17 of 18 acceptance tests pass
and the eighteenth is a human step. The gate still needs M2 complete, a review of the
exact commit by someone other than the author, and Owner UAT.

**M2 is not finished.** Spec figures are done: all seven are shown under approved
records. What is left needs material from ACS: prices need a dated price list; stock
needs dated stock data; product pages need images; DS3600 needs its model list. See
"Still missing".

## Non-negotiables, and where each one lives

| Rule | File |
|---|---|
| One place says live / demo / not connected | `src/config/status.ts` |
| Every write is refused until a backend passes its gate | `src/data/store.ts` |
| A spec figure renders only under an active evidence record | `src/rules/evidence.ts`, `src/rules/figures.ts` |
| Evidence goes draft → active only if the source quotes every figure, a source is named, and approver ≠ author; decisions are append-only | `src/rules/evidence.ts` |
| Nothing personal in URLs, storage, cookies or logs | `src/client/main.ts` (state in memory), checked by E21–E23 |
| A build that is not live is closed to crawlers | `isIndexable()` in `src/config/status.ts` |
| One address per page; every other spelling is a 301 | `src/build/address.ts` |
| The sitemap lists exactly the pages whose own HTML is indexable | `src/build/site.ts` |
| Structured data never carries a price, offer, availability, rating or review | `src/render/structured.ts` |
| A page's `lastmod` moves only when its content does; a changed page cannot keep its old date | `src/build/versions.ts`, `src/data/page-versions.json` |
| Catalogue data is a verbatim snapshot, never edited to fit | `src/data/catalog.source.json` |
| A line shown differently from the snapshot needs a recorded Owner decision, and may only say less | `src/data/catalog.overrides.json`, `src/rules/overrides.ts` |
| A category page states only what the catalogue states | `categoryPage` in `src/render/pages.ts`, `tests/unit/category.test.ts` |
| The company copy is the governed draft, character for character | `src/content/about.json`, `tests/unit/about.test.ts` |
| Every claim the company page makes has a CLEARED evidence record | `scripts/claims.ts` |
| A moved address redirects in one hop and never shadows a real page | `src/build/redirects.ts`, `src/build/address.ts` |
| A record becomes active only through a recorded approval by someone other than its author | `applyApprovals` in `src/rules/evidence.ts`, `src/data/evidence-approvals.json` |

## Status rules

`system` is `demo`. A feature moves to `live` only when its acceptance test passes **and**
the material behind it is named. Three features cannot move until ACS supplies something:
prices (a dated price list), stock (dated stock data) and product images (the files).

Spec figures moved to `live` on 2026-11-13, when the Owner approved the seven evidence
records.

The company page moved to `live` on 2026-11-13: the Owner approved the copy and chose its
address (D-11). `live` here means the content is real and approved. The system as a whole
is still `demo`, so the page is still closed to crawlers and nothing is deployed.

## How the live rules are proven while the build stays demo

The shipped build is demo: every page is `noindex`, there is no sitemap, and `robots.txt`
closes the site. Canonicals and the sitemap only exist on a live system, so they are
proven on a **live-config variant rendered in memory** (`renderSite` in
`src/build/site.ts`), never written to `dist/`. `npm run verify` and
`tests/unit/site.test.ts` both do this. Nothing flips the shipped config.

On a live system 24 pages are indexable: home, catalogue, 6 categories, 14 products, the
enquiry page and the about page. The basket, the status page and the error page never
are. The about page and the category pages drop out if their feature is not `live`.

## Owner decisions built in M2b

Recorded in `../acs-seo/data/clusters.json` (`decisions_made`) and
`../acs-seo/09_OWNER_DECISIONS_2026-11-13.md`.

| Decision | What was built |
|---|---|
| D-09: six category pages | `/categories/<id>/`, generated from the catalogue. Not under `/products/`, because two entries are named `labels` and `rfid` like their categories. |
| D-10: the ribbon category owns "ริบบอน" | `/categories/ribbons/` sets the three kinds side by side, using the catalogue's own words. The three ribbon pages stay. |
| D-12: the M510 label width in inches only | The snapshot says "1.5 นิ้ว (38.1 มม.)"; Brady's page states 1.5 in and no millimetre value. The site shows "1.5 นิ้ว". The snapshot file is unchanged; the change lives in `src/data/catalog.overrides.json`. |
| D-11: the company page is `/about/` | The approved copy, verbatim. `/why-acs` and `/company` answer 301 to it in every spelling. |

## Evidence: how a figure gets shown

1. A draft goes in `src/data/evidence.ts` with the source's own words and its address.
2. A named person at ACS, not the draft's author, approves it: one line in
   `src/data/evidence-approvals.json` — `{"recordId": "EV-1950G-01", "approvedBy": "<name and role>", "approvedOn": "<date>"}`.
3. The build runs the gate. If the quote covers every figure and the approver is not the
   author, the figure appears on the product page. If not, it stays hidden and
   `dist/build-report.json` records the refusal.

Seven records exist, one for every figure line in the catalogue. On 2026-11-13 the Owner
(Arithach Chartariyapong, CEO) approved all seven, so all seven are active and shown:

| Draft | Product | Figure | The manufacturer's words |
|---|---|---|---|
| `EV-1950G-01` | Xenon XP 1950g | IP52 | "IP Rating : IP52" |
| `EV-1950G-02` | Xenon XP 1950g | 0–50 °C | "Operating Temperature : 0 - 50 °C\|32 - 122 °F" |
| `EV-1960G-01` | Xenon Ultra 1960g | IP52 | "IP Rating : IP52" |
| `EV-ZD421-01` | ZD421 | 203 or 300 dpi | "Print Resolution 203 dpi (8 dot/mm)\|300 dpi (12 dot/mm)" |
| `EV-DS2208-01` | DS2208 | 640 × 480 pixels | "IMAGE SENSOR: 640X480 PIXELS" |

| `EV-M510-01` | Brady M510 | 300 dpi | "Print Resolution: 300 dpi" |

| `EV-M510-02` | Brady M510 | 1.5 in label width | "Maximum Label/Tape Width: 1.5 in" |

`EV-M510-02` covers the line as the Owner decided to show it (D-12). Against the
snapshot's own wording, which adds "(38.1 มม.)", the same draft is still refused: the
source does not state that value and the gate does not convert units. A test keeps that
true.

**What "the source states the figure" means** (`quoteCovers` in `src/rules/figures.ts`):
the same number with the same unit. A unit may be spelled in Thai or English (พิกเซล =
pixels, นิ้ว = in, มม. = mm); units are never converted. A list such as "203 หรือ 300 dpi"
needs every alternative. A range needs both ends as a range. "300 dpi" is not covered by
"1300 dpi".

## Limits right now

- **The one-address rule is proven on the preview server only.** `scripts/serve.ts`
  applies `src/build/address.ts`, and e2e checks all 20 pages against it. Whichever host
  serves the site must apply the same rule; a static host that also answers
  `/x/index.html` with 200 would give every page a second address. The canonical tag
  still names the right one, but the redirect is a hosting requirement, not something
  this build can enforce on its own.
- **Structured data is valid schema.org but not rich-result eligible.** Google's product
  rich results need an offer, a review or a rating. ACS has none in evidence, so none is
  emitted. The five supplies and solution entries carry no Product markup at all, since
  they are not products; whether they become category pages is decision D-09.
- **`lastmod` tracks the page's `<main>` only.** A change to the header, the footer or
  the structured data alone does not move a date.
- **Model numbers are recognised from the catalogue only.** `1950g` is no longer read as
  "1950 g" because it is a known model token. A model number that is not in the catalogue
  and ends in a unit letter would still read as a figure and be held back.
- **DS3600 does not list its models.** The catalogue names the family but not which
  models ACS sells, so the page says it is a family and lists none rather than guessing.

- **Demo mode.** The enquiry form validates and then refuses to submit; nothing is stored
  or sent anywhere. The basket keeps product ids in `sessionStorage` and nothing else.
- **Seven figures are shown, on the Owner's approval.** Remove a line from
  `evidence-approvals.json` and that figure is hidden again on the next build. `dist/build-report.json` lists each.
- **One person approved all seven records, and no one has checked the quotes against the
  pages independently.** The gate checks that the approver is not the author; it cannot
  check that the author transcribed the source correctly.
- **The ZD421 line covers both resolutions** ("203 หรือ 300 dpi ตามรุ่นย่อย"). On 2026-11-14
  the Owner confirmed ACS sells both; the answer is recorded on the approval. The page
  wording is unchanged and does not itself say which ACS stocks.
- **The records cite a web page, not a signed datasheet.** The source is the
  manufacturer's own product page as served on 2026-11-13. It carries no revision number.
  The approver also confirms that the model ACS sells is the one the page describes.
- **Redirects are a hosting requirement.** `/why-acs` and `/company` redirect on the
  preview server. The eventual host has to apply the list in `dist/build-report.json`.
- **Three categories hold one entry each** (labels, RFID, mobile). The category page and
  its single entry sit close together; the category owns the head term, the entry its own
  name. Worth watching once real search data exists.
- **The audit log is rebuilt on every build** from `evidence-approvals.json`, and written
  to `dist/build-report.json`. Git history of that file is the durable record.
- **No product images.** The live assets were not available to this build; pages show a
  labelled placeholder.

## Not yet tested

- Core Web Vitals in the field. A lab run passes (`QA.md`), on a local server with no
  real images or web fonts; it says nothing about a deployed site.
- Structured data against an external validator. It is parsed and checked against this
  project's own rules; it has not been run through Google's Rich Results Test or the
  schema.org validator, neither of which is reachable from the build container.
- Screen readers. axe-core passes at 360 px and 1280 px, but no manual pass with a real
  screen reader has been done, and axe does not catch everything.
- Browsers other than Chromium.
- Real fonts. Google Fonts are blocked in the build container, so screenshots in
  `test-results/screens/` use fallback fonts and are not typographically final.
- Touch-target check covers standalone controls only; links inside running text are
  exempt, as WCAG allows.

## Still missing (planned, not built)

- A dated ACS price list, dated stock data, product images, the DS3600 model list.
- A redirect plan for the 81 dead URLs of the old site — needs Search Console data.
  Only `/why-acs` is redirected so far, because the Owner named its new home.
- A backend for enquiries, with its own gate.

## Known scanner note

`npm run claims` reports 90 `EVIDENCE_REQUIRED` and 2 `OWNER_REQUIRED` findings, and no
`BLOCKED`. Almost all are CR-06 on a manufacturer's name used as a product brand
(Honeywell, TSC, Zebra, Brady): the rule working as written, since a vendor name needs a
human to confirm it is a spec reference and not a partnership claim.

The about page is different: it does make claims about ACS — the founding year (CR-10)
and the partner programme (CR-06). `npm run claims` therefore checks that every claim row
raised on that page has a `CLEARED` evidence record in
`../acs-seo/packages/about-acs/publish/`, and fails if one does not.

## Review

**This milestone has not been reviewed by anyone but its author.** Until another reviewer
checks it against the exact commit SHA, it counts as NOT RECEIVED, whatever the test
counts say.
