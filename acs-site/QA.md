# QA report — ACS website rebuild (M3, author's part)

**Commit tested:** `f335044` (M2c; earlier runs of this report were on `1c6841c` and `74d1468`) · **Date:** 2026-11-13 · **System status:** demo

**M3 gate: CLOSED.** The automated tests are green, but M3 closes only when all three of
these have happened, and none has:

1. M2 is complete — the decisions are made and built, but it still waits on material from
   ACS (see "Open items").
2. Someone other than the author has reviewed this exact commit. Until then every result
   below counts as **NOT RECEIVED**.
3. The Owner has done UAT (checklist at the end).

Everything in this report was produced by `npm run qa` and `node tests/qa/offline.mjs`.
The matrix is generated from the evidence files by `scripts/qa-summary.ts`; a test whose
evidence file is missing is reported NOT RUN, never assumed.

## Acceptance matrix (PRD T1–T18)

| # | What it proves | Result | Evidence in `test-results/` |
|---|---|---|---|
| T1 | Every rule and parser behaves, including on Thai input | PASS · 176/176 unit tests | `unit.json` |
| T2 | A clean checkout builds and tests with no network access | PASS · 9/9 steps on `f335044`, network blocked | `offline.json` |
| T3 | 14 product routes return 200 with distinct headings | PASS · E01, E02, E31 | `e2e.json` |
| T4 | Self-referencing canonical on every indexable page; no page answers at two addresses | PASS · 7/7 + E28, E29, E36 | `canonical.json`, `links.json` |
| T5 | Product text is present with JavaScript disabled | PASS · E07, E08, E33, E37 | `norender.json` |
| T6 | No internal link resolves to a 404 | PASS · E05, E06 | `links.json` |
| T7 | The sitemap lists every indexable URL and only those; robots.txt names it | PASS · 10/10 | `sitemap.json` |
| T8 | The claim scanner reports zero BLOCKED over the built HTML | PASS · BLOCKED 0, EVIDENCE_REQUIRED 94; both about-page claim rows CLEARED | `claims.json` |
| T9 | No serious or critical accessibility violation at 360 and 1280 px | PASS · E26 at both widths | `axe.json` |
| T10 | No horizontal page scroll at 360 or 1280 px | PASS · E25 at both widths | `overflow.json` |
| T11 | The enquiry form refuses an empty required field and announces each error | PASS · E15, E16, E24 | `e2e.json` |
| T12 | Submitting returns not-connected and no success message appears | PASS · E19, E20 + 4 unit tests | `e2e.json`, `unit.json` |
| T13 | Consent boxes start unticked; service consent required; marketing consent not | PASS · E13, E17, E18 | `e2e.json` |
| T14 | After a filled form, storage and URLs hold nothing personal | PASS · E21, E22, E23 | `pii.json` |
| T15 | A figure with no active evidence record is not shown, and the build names it | PASS · 7 figures held back, 0 active records | `claims.json`, `norender.json` |
| T16 | An evidence record cannot go active when its approver is its author | PASS · 9 unit tests | `unit.json` |
| T17 | Product structured data validates and carries no price or availability | PASS · 8/8 + E32 | `schema.json` |
| T18 | Screenshots of every page type at 360 and 1280 px, reviewed by eye | **HUMAN STEP** · 22 captured, seen by the author only | `screens/*.png` |

**PASS 17 · FAIL 0 · NOT RUN 0 · HUMAN STEP 1.** End-to-end: 41/41 checks.
`../acs-seo/tools/regression.sh`: 44 checks pass.

What these results do **not** say: T4 and T7 are proven on a live-config variant rendered
in memory, because the shipped build is demo and has no canonical or sitemap at all. T2
installs dependencies with the network on and then runs with it off; Playwright and
Chromium come from the build container, not from `npm ci`. T17 is checked against this
project's own rules, not against Google's validator.

## Defects found during this pass

Q-01 and Q-03 were found by looking, not by the tests that existed at the time. Q-01 and
Q-02 now have a test that fails against the old code.

| # | Defect | Found by | Fix | Guard |
|---|---|---|---|---|
| Q-01 | Elements marked `hidden` were displayed wherever CSS set `display`. An empty basket offered "continue to enquiry"; with JavaScript off the catalogue showed a search box that did nothing. | Screenshot review of `basket-360.png` | One rule: `[hidden] { display: none !important; }` | E33, E34, E35 — 4 checks fail on the old stylesheet |
| Q-03 | The acceptance matrix accepted an offline run (T2) made on older code and showed PASS. | Reading the M2b summary | T2 is NOT RUN when code changed since the commit the offline run used | Seen to report NOT RUN before the re-run on `74d1468` |
| Q-02 | A model number ending in a unit letter (`1950g`) was read as a spec figure, "1950 g". It failed safe (a line would be omitted, not wrongly shown) and needed an exemption in `verify.ts`. | Listed as a known limit at M2a | Catalogue model tokens are excluded by exact match | 2 unit tests; the exemption is removed |

Q-01 is the reason T18 matters: 35/35 automated checks passed while the defect was on
screen.

## Core Web Vitals — lab only

Chromium, 360×800, CPU slowed 4×, slow-4G network shape, local preview server.

| Page | LCP | CLS | Slowest interaction |
|---|---|---|---|
| `/` | 640 ms | 0 | none measured |
| `/products/` | 696 ms | 0 | 24 ms |
| `/products/te200/` | 612 ms | 0 | 32 ms |
| `/products/1950g/` | 640 ms | 0 | 32 ms |
| `/enquiry/` | 572 ms | 0 | 32 ms |

The six category pages and `/about/` were not measured.

Targets: LCP ≤ 2500 ms, CLS ≤ 0.1, interaction ≤ 200 ms. All five pages are inside them.

**This is not field data and should not be quoted as the site's speed.** There is no
host, no real network path, no web fonts (blocked in the build container) and no product
images (placeholders). Real images will raise LCP. The figures show the pages are not
slow by construction; nothing more. The interaction figure is the slowest single event
seen for one interaction per page, an approximation of INP.

## Not tested, and why

| Not tested | Why |
|---|---|
| Field Core Web Vitals | The site is not deployed. Deploying needs the Owner's approval. |
| Google Rich Results Test / schema.org validator | Neither is reachable from the build container. |
| A real screen reader | axe-core finds only what a machine can; nobody has listened to the pages. |
| Firefox, Safari, real phones | Only Chromium is installed in the container. |
| Final typography | Google Fonts are blocked here; all screenshots use fallback fonts. |
| The one-address rule on a real host | It is proven on the preview server. The eventual host must apply the same redirects. |
| Load, abuse and rate limiting | There is no backend to load. |
| Enquiry delivery | Nothing is sent anywhere; the store refuses every write by design. |

## What M2b added, and how it was checked

| Added | Checked by |
|---|---|
| Six category pages (D-09) | `tests/unit/category.test.ts` (13), E01, E37, verify |
| Ribbon category owns the choice (D-10); its table repeats only catalogue text | `category.test.ts`, screenshot |
| `/about/` with the approved copy, verbatim (D-11) | `tests/unit/about.test.ts` (8), claims check |
| `/why-acs` and `/company` → 301 `/about/` | `site.test.ts`, verify, E36 |
| Evidence drafts and the recorded-approval path | `tests/unit/evidence-drafts.test.ts` (9) |
| M2c: five drafts; the quote check compares number and unit | `tests/unit/figures.test.ts` (7 new, incl. refusals) |

## Open items that keep M2 (and so M3) open

Only ACS can supply these. Nothing below was guessed or filled in.

- **An approver for five drafts.** `EV-1950G-01`, `EV-1950G-02`, `EV-1960G-01`,
  `EV-ZD421-01`, `EV-DS2208-01` each quote the manufacturer's product page, and each
  page agrees with the catalogue. A named person at ACS, not the drafting assistant, has
  to approve each and confirm the model ACS sells is the one the page describes. README,
  "Evidence".
- **A source for the two M510 figures** (300 dpi; 1.5 in / 38.1 mm). bradyid.com timed
  out on three attempts. No source was read; the figures are neither confirmed nor
  contradicted.
- An ACS price list with an effective date → prices.
- Stock and lead-time data with dates → stock.
- Which DS3600 models ACS sells.
- Product images.
- A backend for enquiries, with its own gate.

Decisions D-09, D-10 and D-11 are no longer open: the Owner made them on 2026-11-13.

## For the reviewer

Review commit `f335044` (code) — the commit after it adds only this report and evidence.

```sh
cd acs-site && npm ci
npm run qa                                   # everything except T2
node tests/qa/offline.mjs /tmp/acs-offline   # T2; needs Linux, root, unshare
```

Worth an independent look, because the author is the least able to see them:

- Open every file in `test-results/screens/` at full size. Q-01 was visible there.
- Read `dist/products/1950g/index.html` and confirm no number with a unit appears.
- Try to make `submitEnquiry` succeed, and to activate an evidence record you authored.
- Check that E33–E35 really fail when the `[hidden]` rule is removed from `site.css`.
- Compare `/about/` with `../acs-seo/packages/about-acs/draft-v3-evidenced.md` by eye.
- Read the five evidence drafts against the manufacturer pages they cite. The author
  transcribed the quotes; nobody has checked the transcription.
- Try to approve a draft as its own author in `src/data/evidence-approvals.json`.

## UAT สำหรับเจ้าของ (ยังไม่ได้ทำ)

รัน `npm run preview` แล้วเปิด http://127.0.0.1:4173 บนมือถือและคอมพิวเตอร์
ติ๊กแต่ละข้อเมื่อเห็นด้วยตาตัวเอง ถ้าข้อใดไม่ตรง ให้จดว่าเห็นอะไร

- [ ] ทุกหน้ามีป้าย "ระบบ: โหมดสาธิต" และหน้า "สถานะระบบ" บอกตรงกับความจริงว่าอะไรยังไม่เชื่อมต่อ
- [ ] หน้าสินค้ามีครบ 14 รายการ ชื่อ ยี่ห้อ และหมวดถูกต้องตามที่ ACS ขายจริง
- [ ] หน้าหมวดทั้ง 6 หน้าแสดงสินค้าถูกหมวด และหน้าหมวดริบบอนเทียบ 3 ชนิดด้วยถ้อยคำที่ ACS ยอมรับ
- [ ] หน้า "เกี่ยวกับ ACS" (/about/) ตรงกับข้อความที่อนุมัติ และ /why-acs พามาที่หน้านี้
- [ ] ไม่มีราคา สต็อก ระยะเวลาส่งมอบ หรือตัวเลขสเปกใดปรากฏ (ทุกจุดต้องเขียนว่า "รอเจ้าของกำหนด")
- [ ] หน้าตระกูลสินค้า (เช่น TC22 / TC27, DS3600) บอกชัดว่าเป็นตระกูล ไม่ใช่รุ่นเดียว
- [ ] ค้นหาและกรองหมวดในหน้าสินค้าได้ผลตามที่คาด
- [ ] เพิ่มสินค้าในรายการขอราคา ลบออก และตะกร้าว่างแสดงข้อความว่าง ไม่มีปุ่มไปต่อ
- [ ] แบบฟอร์มขอราคา: เว้นช่องบังคับแล้วระบบแจ้งข้อผิดพลาดเป็นภาษาไทยที่เข้าใจได้
- [ ] ช่องยินยอมทั้งสองช่องไม่ถูกติ๊กไว้ล่วงหน้า และไม่ติ๊กช่องการตลาดก็ส่งต่อได้
- [ ] กดส่งแล้วระบบบอกว่า "ยังไม่เชื่อมต่อ" ไม่มีข้อความว่าส่งสำเร็จ
- [ ] เบอร์โทร 02-203-0232 และอีเมล sales@asiancoding.com ถูกต้อง
- [ ] ถ้อยคำภาษาไทยทั้งเว็บเป็นน้ำเสียงที่ ACS ใช้กับลูกค้าจริง

ผล UAT: ______ วันที่: ______ ผู้ตรวจ: ______
