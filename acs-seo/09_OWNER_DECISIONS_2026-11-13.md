# Owner decisions — 13 November 2026

Six decisions the Owner made on 13 Nov 2026. They close items B, C and D of
`07_OWNER_DECISION_REPORT.md`. Item A (the dead-link patch on the live site) is unchanged:
authorised on 23 Oct, still not applied, because the live site's source is not reachable
from here.

| # | Question | Decision |
|---|---|---|
| D-09 | Which page owns a category head term? | Six category pages, one per category. |
| D-10 | Three ribbon products compete for "ริบบอน". | The ribbon category page owns the term and compares the three kinds. The three product pages stay, each for its own kind. |
| D-11 | Where does the company copy live? | `/about/`. `/why-acs` and `/company` redirect to it. |
| — | Is `packages/about-acs/draft-v3-evidenced.md` approved for that page? | Yes. Approved as shown, unchanged. |
| D-12 | The catalogue gives the Brady M510's label width as "1.5 นิ้ว (38.1 มม.)". Brady's page states 1.5 in and no millimetre value. What does the site show? | Only "1.5 นิ้ว", as Brady states it. |

| — | Seven evidence records for spec figures (CR-07), drafted from the manufacturers' product pages. Who approves them? | The Owner approved all seven himself. |

| — | Which ZD421 resolution does ACS supply? (asked by record `EV-ZD421-01`) | Both, 203 dpi and 300 dpi. Stated on 14 Nov 2026. |
| — | Should the ZD421 page say so? | Yes. The page carries the note "ACS จำหน่ายทั้งรุ่น 203 dpi และ 300 dpi" (14 Nov 2026). It says nothing about stock. |

## What changed because of them

- `data/clusters.json`: every cluster R-1…R-7 now has a canonical owner, each traced to
  its decision in `decisions_made`. `decisions_needed` is empty.
- `tools/cannibalisation-check.mjs`: a head-term intent now returns
  `PROCEED_WITH_CANONICAL` instead of `HOLD`. The owner URLs themselves hold, like any
  claimed URL. Regression: 44 checks.
- `packages/about-acs/package_status.json`: `APPROVED_NOT_PUBLISHED`, with the approval
  recorded under `owner_qa`.
- `../acs-site/`: the pages are built (README there, "Owner decisions built in M2b").

- D-12 is recorded in `../acs-site/src/data/catalog.overrides.json`. The catalogue
  snapshot is not edited. The live site still shows the line with "(38.1 มม.)"; changing
  that is a separate edit to the live site, which is not reachable from here.

- The seven approvals are in `../acs-site/src/data/evidence-approvals.json`. The seven
  figures now appear on five product pages of the rebuild, each naming its source.
  Removing an approval hides its figure again.

## What did not change

- **Nothing is published.** Every owner URL is `PLANNED`: built in `acs-site/`, not
  deployed. On the live site `/categories/…` and `/about/` do not exist. A package may be
  written against an owner, but nothing on the live site may link to one yet.
- The other packages stay `DRAFT_PENDING_REVIEW`. Approving the company copy approved
  that one draft for that one page.
- CR-08 is still open. The approved copy names no customer.
- Queue #4, #16, #17, #18, #21 are unblocked at the cannibalisation gate only. Their own
  blockers stand: datasheets, a dated price list, and no ranking of brands.

## One thing to watch

Three categories hold a single entry (labels, RFID, mobile computers). There the category
page and its one entry are close in intent. The category page owns the head term and the
entry owns its own name; if search data later shows the two competing, the fix is to fold
the entry into the category page, which is a new decision for the Owner, not a default.
