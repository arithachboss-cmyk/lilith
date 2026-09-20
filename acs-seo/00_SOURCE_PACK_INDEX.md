# ACS SEO — Source Pack Index

**Project:** ACS SEO Package Factory — Governance Scope
**Compiled:** 20 September 2026
**Status:** PARTIAL — the live site inventory is real; five of six source streams are still missing.

Every row below is labelled **FACT** (observed from a primary source, with the source named),
**RECOMMENDATION** (authored here, needs Owner confirmation), or **MISSING** (not supplied).
Nothing in this pack is invented.

---

## S-1. Source stream status

| ID | Source stream | Status | Note |
|---|---|---|---|
| SRC-01 | Live sitemap of `www.asiancoding.com` | **FACT** | Retrieved 20 Sep 2026. 82 URLs. See S-2. |
| SRC-02 | ACS product / service list (what ACS actually sells) | **MISSING** | Blocks every OWNER_REQUIRED claim. Highest-value gap. |
| SRC-03 | Vendor datasheets (Brady, Honeywell, TSC, GS1) | **MISSING** | Blocks every EVIDENCE_REQUIRED spec claim, incl. Queue #4 and #21. |
| SRC-04 | Page inventory with Product/Service/Knowledge/Landing class | **RECOMMENDATION** | Derived from SRC-01 URL structure. Classes need Owner confirmation. |
| SRC-05 | Keyword queue (intent, target URL, NEW/ENRICH/HOLD) | **MISSING** | Only 6 of 19 queue items are known, via Owner decisions. |
| SRC-06 | ACS price list with effective date | **MISSING** | Blocks Queue #16 / #18 and `/barcode-scanner-price-guide`. |

**Acquisition rule.** A package may not leave DRAFT_PENDING_REVIEW while it depends on a
MISSING stream. It goes to BLOCKED and names the stream it waits on.

## S-2. Live page inventory — FACT (82 URLs, sitemap of 20 Sep 2026)

Class is a RECOMMENDATION derived from URL structure; risk flags drive QA depth (see `03_QA_CHECKLIST.md`).

Flags: `CANNIBAL` overlapping intent · `PARTNER` brand/authorisation claim · `SPEC` product specification ·
`CUSTOMER` customer or case claim · `NUMBERS` ROI/performance figure · `PRICE` pricing · `RANKING` brand ranking ·
`OWNER` company fact only ACS can confirm · `EVIDENCE` needs third-party documentation.

| # | Path | Class | Type | Risk flags |
|---|---|---|---|---|
| 1 | `/` | Landing | Home | — |
| 2 | `/solutions` | Service | Hub | — |
| 3 | `/contact` | Landing | Conversion | — |
| 4 | `/select-solution` | Landing | Tool | — |
| 5 | `/brady` | Product | Brand hub | PARTNER |
| 6 | `/brady/printers/m510` | Product | Model page | PARTNER, SPEC |
| 7 | `/brady/labels` | Product | Category | PARTNER, SPEC |
| 8 | `/brady/scanners-rfid` | Product | Category | PARTNER, SPEC |
| 9 | `/brady/software` | Product | Category | PARTNER |
| 10 | `/brady/solutions/manufacturing` | Service | Solution | PARTNER, CANNIBAL |
| 11 | `/brady/solutions/warehouse-logistics` | Service | Solution | PARTNER, CANNIBAL |
| 12 | `/pos-barcode-system` | Service | Solution | — |
| 13 | `/warehouse-data-capture` | Service | Solution | CANNIBAL |
| 14 | `/rfid-workflow-context` | Knowledge | Explainer | CANNIBAL |
| 15 | `/why-acs` | Landing | Company | — |
| 16 | `/why-acs/30-years` | Landing | Company | OWNER |
| 17 | `/why-acs/service-capability` | Service | Company | OWNER |
| 18 | `/why-acs/partner-ecosystem` | Landing | Company | PARTNER, CANNIBAL |
| 19 | `/esg-solutions` | Service | Solution | EVIDENCE |
| 20 | `/retail` | Service | Industry | CANNIBAL |
| 21 | `/logistics` | Service | Industry | CANNIBAL |
| 22 | `/manufacturing` | Service | Industry | CANNIBAL |
| 23 | `/industry/manufacturing` | Service | Industry | CANNIBAL |
| 24 | `/industry/healthcare` | Service | Industry | — |
| 25 | `/ai-consultant` | Service | Tool | EVIDENCE |
| 26 | `/roi-calculator` | Landing | Tool | NUMBERS |
| 27 | `/roi-calculator/retail` | Landing | Tool | NUMBERS |
| 28 | `/roi-calculator/warehouse` | Landing | Tool | NUMBERS |
| 29 | `/roi-calculator/manufacturing` | Landing | Tool | NUMBERS |
| 30 | `/roi-calculator/mobility` | Landing | Tool | NUMBERS |
| 31 | `/case-studies` | Landing | Hub | CUSTOMER |
| 32 | `/case-study/retail` | Landing | Case | CUSTOMER |
| 33 | `/case-study/warehouse` | Landing | Case | CUSTOMER |
| 34 | `/case-study/manufacturing` | Landing | Case | CUSTOMER |
| 35 | `/case-study/logistics` | Landing | Case | CUSTOMER |
| 36 | `/case-study/healthcare` | Landing | Case | CUSTOMER |
| 37 | `/insights` | Knowledge | Hub | — |
| 38 | `/revenue-articles` | Knowledge | Hub | — |
| 39 | `/leadership` | Landing | Company | OWNER |
| 40 | `/partner-ecosystem-hub` | Landing | Company | PARTNER, CANNIBAL |
| 41 | `/barcode-scanner-thailand` | Product | Commercial | CANNIBAL |
| 42 | `/barcode-printer-thailand` | Product | Commercial | CANNIBAL |
| 43 | `/honeywell-barcode-scanner` | Product | Brand | PARTNER, SPEC |
| 44 | `/tsc-barcode-printer` | Product | Brand | PARTNER, SPEC |
| 45 | `/rfid-warehouse-system` | Product | Commercial | CANNIBAL |
| 46 | `/เครื่องสแกนบาร์โค้ด` | Product | Commercial TH | CANNIBAL |
| 47 | `/barcode-label-printer` | Product | Commercial | CANNIBAL |
| 48 | `/wireless-barcode-scanner` | Product | Commercial | CANNIBAL |
| 49 | `/industrial-barcode-scanner` | Product | Commercial | CANNIBAL |
| 50 | `/rfid-reader` | Product | Commercial | CANNIBAL |
| 51 | `/barcode-printers` | Product | Category | CANNIBAL |
| 52 | `/rfid-systems` | Product | Category | CANNIBAL |
| 53 | `/barcode-scanner-price-guide` | Knowledge | Commercial | PRICE |
| 54 | `/barcode-scanners` | Product | Category | CANNIBAL |
| 55 | `/barcode-ribbons` | Product | Category | SPEC |
| 56 | `/warehouse-barcode-scanner` | Product | Commercial | CANNIBAL |
| 57 | `/retail-barcode-scanner` | Product | Commercial | CANNIBAL |
| 58 | `/2d-barcode-scanner` | Product | Commercial | CANNIBAL |
| 59 | `/long-range-barcode-scanner` | Product | Commercial | CANNIBAL, SPEC |
| 60 | `/barcode-scanner-comparison` | Knowledge | Comparison | RANKING |
| 61 | `/barcode-printer-buying-guide` | Knowledge | Guide | CANNIBAL |
| 62 | `/knowledge` | Knowledge | Hub | — |
| 63 | `/knowledge/barcode-technology` | Knowledge | Cluster hub | — |
| 64 | `/knowledge/barcode-equipment` | Knowledge | Cluster hub | CANNIBAL |
| 65 | `/knowledge/rfid-technology` | Knowledge | Cluster hub | — |
| 66 | `/knowledge/industry-applications` | Knowledge | Cluster hub | CANNIBAL |
| 67 | `/knowledge/implementation-best-practices` | Knowledge | Cluster hub | — |
| 68 | `/knowledge/regional-solutions` | Knowledge | Cluster hub | CANNIBAL |
| 69 | `/knowledge/product-comparisons` | Knowledge | Cluster hub | RANKING, CANNIBAL |
| 70 | `/knowledge/emerging-trends` | Knowledge | Cluster hub | — |
| 71 | `/knowledge/1d-vs-2d-barcode` | Knowledge | Article | — |
| 72 | `/knowledge/how-to-choose-barcode-scanner` | Knowledge | Article | CANNIBAL |
| 73 | `/knowledge/wired-vs-wireless-barcode-scanner` | Knowledge | Article | CANNIBAL |
| 74 | `/knowledge/barcode-printer-types` | Knowledge | Article | CANNIBAL |
| 75 | `/knowledge/rfid-vs-barcode` | Knowledge | Article | — |
| 76 | `/knowledge/rfid-warehouse-implementation` | Knowledge | Article | CANNIBAL |
| 77 | `/knowledge/barcode-inventory-management` | Knowledge | Article | — |
| 78 | `/knowledge/barcode-system-implementation` | Knowledge | Article | — |
| 79 | `/knowledge/barcode-scanner-troubleshooting` | Knowledge | Article | — |
| 80 | `/knowledge/barcode-printer-calibration` | Knowledge | Article | — |
| 81 | `/knowledge/barcode-label-materials` | Knowledge | Article | SPEC |
| 82 | `/knowledge/barcode-wms-integration` | Knowledge | Article | — |

**Totals — FACT.** 82 URLs: Knowledge 27, Product 23, Landing 19, Service 13.
**61 of 82 pages (74%) carry at least one risk flag.** CANNIBAL 34, PARTNER 11, SPEC 8,
CUSTOMER 6, NUMBERS 5, OWNER 3, RANKING 2, EVIDENCE 2, PRICE 1.

**Observation — FACT.** The sitemap carries `changefreq` and `priority` but **no `lastmod`**
on any of the 82 URLs. Search engines largely ignore the first two and use the third; the
sitemap therefore gives crawlers no freshness signal at all. Fix this when the rendering
gate is addressed, not before — it is worthless while the pages do not render server-side.

## S-3. Cannibalisation clusters — FACT (derived from SRC-01)

These are existing live URLs competing for one intent. **No new package may target one of
these intents until its cluster has a named canonical owner.**

| Cluster | Competing live URLs | Count |
|---|---|---|
| C-1 Barcode scanner (generic commercial) | `/barcode-scanners`, `/barcode-scanner-thailand`, `/เครื่องสแกนบาร์โค้ด`, `/industrial-barcode-scanner`, `/wireless-barcode-scanner`, `/2d-barcode-scanner`, `/long-range-barcode-scanner`, `/warehouse-barcode-scanner`, `/retail-barcode-scanner`, `/honeywell-barcode-scanner` | 10 |
| C-2 Barcode printer | `/barcode-printers`, `/barcode-printer-thailand`, `/barcode-label-printer`, `/tsc-barcode-printer`, `/barcode-printer-buying-guide`, `/knowledge/barcode-printer-types` | 6 |
| C-3 RFID | `/rfid-systems`, `/rfid-reader`, `/rfid-warehouse-system`, `/rfid-workflow-context`, `/brady/scanners-rfid`, `/knowledge/rfid-warehouse-implementation`, `/knowledge/rfid-technology` | 7 |
| C-4 Manufacturing | `/manufacturing`, `/industry/manufacturing`, `/brady/solutions/manufacturing`, `/case-study/manufacturing`, `/roi-calculator/manufacturing` | 5 |
| C-5 Warehouse / logistics | `/logistics`, `/warehouse-data-capture`, `/brady/solutions/warehouse-logistics`, `/case-study/logistics`, `/case-study/warehouse`, `/roi-calculator/warehouse` | 6 |
| C-6 Retail | `/retail`, `/retail-barcode-scanner`, `/case-study/retail`, `/roi-calculator/retail` | 4 |
| C-7 Scanner selection / comparison | `/barcode-scanner-comparison`, `/knowledge/product-comparisons`, `/knowledge/how-to-choose-barcode-scanner`, `/knowledge/wired-vs-wireless-barcode-scanner`, `/select-solution` | 5 |
| C-8 Partner ecosystem | `/partner-ecosystem-hub`, `/why-acs/partner-ecosystem` | 2 |

**C-1 is the most severe: ten live URLs on one commercial head term.** Queue #3's HOLD
(Owner decision) sits here. C-8 is two URLs that appear to say the same thing and is the
cheapest fix on the board — one redirect.

## S-4. What this pack does NOT contain

- No ACS product list, price list, stock, or delivery data.
- No vendor datasheet values. No read range, print speed, accuracy or durability figure.
- No customer name, case study outcome, or review.
- No keyword volume, difficulty, or ranking data — not fetched, not estimated.
- No judgement that any page is "ready for SEO" — the rendering gate is unresolved.
