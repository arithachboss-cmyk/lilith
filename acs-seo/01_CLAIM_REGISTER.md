# ACS SEO — Central Claim Register

**Compiled:** 20 September 2026
**Rule:** every sentence in every package that asserts something about the world maps to one
row here. A claim with no row is not publishable — it is an un-reviewed claim, not a safe one.

---

## 1. The four classes

| Class | Meaning | Who clears it | Can it go in a DRAFT? |
|---|---|---|---|
| **SAFE_WORDING** | General principle. No figure, no ACS performance, no brand ranking, no customer. | Nobody — write it | Yes, publishable wording |
| **EVIDENCE_REQUIRED** | Needs a datasheet, vendor page, GS1 or ISO document, or an ACS document | Whoever attaches the source | Yes, but flagged, and the source must be cited in `audit.json` |
| **OWNER_REQUIRED** | Only ACS can confirm: price, what ACS actually sells, customers, company history, capability | ACS Owner | Yes, but the sentence must be removed or neutralised before QA passes |
| **BLOCKED** | Forbidden until evidence exists. Writing it is the failure, not publishing it. | — | **No** |

**Test for SAFE_WORDING** — all four must hold:
1. no number, percentage, range or currency;
2. no comparative or superlative about a brand or about ACS ("best", "fastest", "leading", "#1");
3. no statement about what ACS has done, sells, or stocks;
4. true of the technology in general, not of one product.

Fail any one → it is at least EVIDENCE_REQUIRED.

## 2. Standing claim rows — from Owner decisions (binding)

| ID | Claim surface | Class | Owner decision | Where it bites |
|---|---|---|---|---|
| CR-01 | Material / environment suitability stated as certainty ("ทนความร้อนได้", "ใช้กลางแจ้งได้") | **EVIDENCE_REQUIRED** | Queue #4: REVISE. No definitive wording without a datasheet for the actual product. | `/knowledge/barcode-label-materials`, `/barcode-ribbons`, `/brady/labels` |
| CR-02 | Read range, scan speed, accuracy figures — specifically "65–70% → 95%+" | **BLOCKED** | Queue #21: delete the figures until evidence exists. | `/roi-calculator/*`, `/long-range-barcode-scanner`, `/industrial-barcode-scanner` |
| CR-03 | Specific prices | **OWNER_REQUIRED** | Queue #16 / #18: no specific price without an ACS price and an effective date. | `/barcode-scanner-price-guide` |
| CR-04 | "Which brand is best" ranking | **BLOCKED** as a ranking; **SAFE_WORDING** as decision criteria | Queue #17: give criteria, never a winner. | `/barcode-scanner-comparison`, `/knowledge/product-comparisons` |
| CR-05 | Target intent overlapping an existing live URL | **BLOCKED** until cluster canonical is named | Queue #3: HOLD pending intent mapping, due 24 Sep 2026. | Cluster C-1 (10 URLs) |

## 3. Site-derived claim rows — from the live inventory (FACT: 82-URL sitemap)

| ID | Claim surface | Class | What clears it | Affected pages |
|---|---|---|---|---|
| CR-06 | Brady / Honeywell / TSC named as partner, distributor or authorised reseller | **EVIDENCE_REQUIRED** | Written authorisation from the vendor, with dates | 11 PARTNER-flagged pages |
| CR-07 | Vendor product specifications (model, capability, compatibility) | **EVIDENCE_REQUIRED** | Vendor datasheet, cited by URL + revision in `audit.json` | 8 SPEC-flagged pages |
| CR-08 | Customer outcomes, case studies, named clients | **OWNER_REQUIRED** | ACS written customer consent + the real figures | 6 CUSTOMER-flagged pages |
| CR-09 | ROI, savings, payback or efficiency figures produced by the calculators | **BLOCKED** until the model's inputs are sourced | A documented calculation basis, or the output is labelled an illustrative estimate with its assumptions on screen | 5 NUMBERS-flagged pages |
| CR-10 | "30 years", leadership bios, service capability | **OWNER_REQUIRED** | ACS company registration / HR confirmation | `/why-acs/30-years`, `/leadership`, `/why-acs/service-capability` |
| CR-11 | ESG claims | **EVIDENCE_REQUIRED** | Certification or a documented programme; otherwise remove | `/esg-solutions` |
| CR-12 | "AI consultant" capability | **EVIDENCE_REQUIRED** | A description of what the tool actually does, from ACS | `/ai-consultant` |
| CR-13 | Barcode symbology / GS1 standards statements | **SAFE_WORDING** if stated as the standard; **EVIDENCE_REQUIRED** if a specific clause or number is cited | GS1 General Specifications, cited by section and release | `/knowledge/1d-vs-2d-barcode`, `/knowledge/barcode-wms-integration` |
| CR-14 | How a technology works in general (thermal transfer vs direct thermal, 1D vs 2D, RFID vs barcode trade-offs) | **SAFE_WORDING** | — | most `/knowledge/*` articles |

## 4. Forbidden-words list (mechanical check, `03_QA_CHECKLIST.md` step M-5)

Any package containing these fails mechanically, regardless of context, and is returned:

```
ดีที่สุด, อันดับ 1, เบอร์หนึ่ง, ชั้นนำ, ถูกที่สุด, รับประกันผล, 100%,
best, #1, number one, leading, cheapest, guaranteed, fastest, most accurate
```

Plus, as a regex: any bare percentage, any currency amount, and any "X–Y%" range that is not
tied to a CR row with an attached source.

## 4b. Mechanical enforcement

| Rows | Tool | Command |
|---|---|---|
| CR-02, CR-09 figures; CR-04 ranking | `tools/claim-scan.mjs` | `node tools/claim-scan.mjs <pkg>` |
| CR-03 prices, ranges, comparatives, promos, VAT scope | same, six rules | `node tools/claim-scan.mjs <pkg>` |
| CR-01 material / environment certainty | same, with `--strict` | `node tools/claim-scan.mjs <pkg> --strict` |
| Evidence actually attached for CR-01 / CR-07 | `tools/evidence-check.mjs` | `node tools/evidence-check.mjs <pkg>` |
| CR-03 price still in date | same, on a schedule | `node tools/evidence-check.mjs <pkg> --as-of <date>` |

A row added here without a rule there is unenforced; a rule there without a row here is a
bug. Keep them in step.

**The price-expiry rule.** A CR-03 claim needs an ACS price, an effective date visible in
the reader's copy, and a `valid_until`. A price with no expiry rots on a live page while
still looking sourced, so the check fails an expired record and warns 30 days ahead. It has
to run on a schedule: a price that passes at authoring time fails months later, and only a
recurring run catches that.

**A comparative price claim is a price claim.** "ถูกกว่าคู่แข่ง" needs both sides priced and
dated. Softening it to "คุ้มค่า" does not make it evidenced.

**The measured-condition rule.** A CR-01 or CR-07 claim quoting a figure must carry the
conditions the figure was measured under, in the visible copy — not only in the audit file.
A value measured under dry heat does not license a claim about steam, and a value on flat
anodised aluminium does not license one about textured painted steel. `evidence-check.mjs`
fails any record that quotes a figure with no conditions recorded.

## 5. Register hygiene

- A claim row is **closed** only when `audit.json` carries the source URI/document, the date
  checked, and the reviewer.
- An EVIDENCE_REQUIRED row whose evidence arrives becomes SAFE_WORDING **for the exact
  wording reviewed** — not for the topic. Rewording reopens it.
- A BLOCKED row never becomes safe by rewording. It becomes safe only by evidence, or the
  claim is dropped.
