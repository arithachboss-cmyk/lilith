# ACS x Brady — Approved Design Brief (Prototype Only)

**Status:** APPROVED FOR LOVABLE PROTOTYPE ONLY — READY WITH CONDITIONS
**Owner:** อริย์ธัช (ACS)
**Prepared for:** Lovable build agent
**Window:** 8 September 2026 – 7 October 2026
**Scope:** 5 solution pages, prototype build only. No production publishing.

---

## 0. Provenance and Honesty Notice — READ FIRST

This file is the **build-facing** version of the brief, assembled in the Claude Code session
for the branch `claude/acs-brady-prototype-brief-fqwxe7`.

| Item | Status |
|---|---|
| Approval decision, gates, page list, 30-day window | **FACT** — supplied by the owner |
| Page structure (Segment / Pain / Solution / CTA / KPI) | **FACT** — required by the owner |
| Page copy, KPI target values, workflow detail below | **RECOMMENDATION** — authored here for the prototype, not owner-verified |
| 20-item sales opportunity register + Source IDs | **NOT SUPPLIED to this session** — see §7. Must NOT be rendered in the prototype |
| Claude Strategic Assessment, Compliance Matrix, ACS commercial-rights documents | **MISSING** — the reason production is blocked |

Rule for the build agent: **any number, logo, partner claim, product photo, price, or stock
figure that is not explicitly marked FACT in this file must not appear as if it were real.**
Use the `sample_data: true` pattern (§6.5).

---

## 1. Executive Summary

**FACT.** ACS (Asian Coding Systems Co., Ltd.) is approved to prototype a 5-page solution
site aimed at industrial identification, data-capture and traceability buyers. The approval
covers design and prototype only.

**FACT.** Production publishing is **not** approved. Blocked until the Claude Strategic
Assessment, the Compliance Matrix, and ACS's commercial-rights documentation are complete.

**ASSUMPTION.** The buying motion is consultative and assessment-led: the visitor is not
ready to buy a part number, they are ready to have their current process looked at. Every
page therefore converts to an **assessment / audit / workshop / pilot booking**, never to a
cart, quote-with-price, or stock check.

**RECOMMENDATION.** Ship the prototype as a private, `noindex` Lovable preview with a real
persisting lead form and full tracking scaffolding, so that the day the compliance documents
clear, the only remaining change is flipping the publish and indexing gates — not rebuilding
the funnel.

---

## 2. Approved Pages (exactly five — do not add more)

| # | Page | Route | Primary conversion |
|---|---|---|---|
| 1 | Warehouse Data Capture Workflow Assessment | `/solutions/warehouse-data-capture-assessment` | Book workflow assessment |
| 2 | Industrial Label Printing Assessment | `/solutions/industrial-label-printing-assessment` | Book print/label assessment |
| 3 | RFID Asset and Inventory Pilot | `/solutions/rfid-asset-inventory-pilot` | Request scoped pilot |
| 4 | Manufacturing Traceability Workshop | `/solutions/manufacturing-traceability-workshop` | Book workshop |
| 5 | Data Center Identification Audit | `/solutions/data-center-identification-audit` | Request audit |

Plus supporting routes: `/` (index of the five, prototype only), `/thank-you`, `/privacy`.
No pricing page. No product catalogue. No stock page. No partner/brand page.

### 2.1 Page 1 — Warehouse Data Capture Workflow Assessment
- **Customer segment:** Warehouse / DC operations manager, 3PL site manager, inventory control lead.
- **Pain point:** Picking, receiving and put-away still run on paper, memory or re-keyed spreadsheets; error and rework are visible but not measured.
- **Solution:** A structured on-site assessment of the existing capture workflow — scan points, device fit, label read rates, exception handling — ending in a written findings note.
- **CTA:** "ขอประเมิน Workflow หน้างาน / Book a workflow assessment"
- **KPI:** Assessment bookings; % of bookings that reach a scheduled site visit.

### 2.2 Page 2 — Industrial Label Printing Assessment
- **Customer segment:** Production supervisor, maintenance/EHS lead, packaging engineer.
- **Pain point:** Labels fail in the environment they live in — heat, solvent, abrasion, outdoor UV — and the failure is discovered downstream, not at print time.
- **Solution:** Assessment of substrate, ribbon, printer and application method against the actual environment and durability requirement, with a documented recommendation.
- **CTA:** "ขอประเมินงานพิมพ์ฉลากอุตสาหกรรม / Book a label printing assessment"
- **KPI:** Assessment bookings; number of qualified environment/durability requirements captured in the form.

### 2.3 Page 3 — RFID Asset and Inventory Pilot
- **Customer segment:** Asset manager, plant engineering, inventory/finance controller running annual counts.
- **Pain point:** Asset registers drift from reality; physical counts take days and still disagree with the book.
- **Solution:** A scoped, time-boxed RFID pilot on one asset class or one zone, with a defined read-rate and count-accuracy success criterion agreed before the pilot starts.
- **CTA:** "ขอขอบเขต Pilot RFID / Request a scoped RFID pilot"
- **KPI:** Pilot scoping requests; % that define a measurable success criterion.

### 2.4 Page 4 — Manufacturing Traceability Workshop
- **Customer segment:** Quality manager, manufacturing engineering, regulatory/compliance lead.
- **Pain point:** Traceability exists per-station but breaks across the line; a recall question cannot be answered end-to-end within a working day.
- **Solution:** A facilitated workshop mapping the unit-of-traceability, marking points, data model and gaps across the process.
- **CTA:** "จองเวิร์กช็อป Traceability / Book a traceability workshop"
- **KPI:** Workshop bookings; number of attending roles per booking (quality + engineering + IT = higher quality lead).

### 2.5 Page 5 — Data Center Identification Audit
- **Customer segment:** Data center facility manager, network/infrastructure operations, colo provider.
- **Pain point:** Cable, port, rack and asset labelling is inconsistent between build phases and vendors; MAC/patching work is slow and error-prone.
- **Solution:** An audit of the current identification standard against rack/cable/port/asset reality, producing a labelling standard and remediation list.
- **CTA:** "ขอ Audit ระบบ Identification / Request an identification audit"
- **KPI:** Audit requests; % specifying site count and rack count in the form.

---

## 3. Approval Gates — HARD BLOCKS for this build

The build agent must **not** implement, and must not stub in a way that could ship, any of:

1. **Production publishing / custom domain.** Prototype stays private in Lovable.
2. **Prices, price ranges, discounts, "starting from" figures.** Any of these = failure state.
3. **Stock, availability, lead time, delivery promise.**
4. **Partner, distributor, authorised-reseller, certification or accreditation claims.**
5. **Manufacturer imagery, product photography, brand logos or brand-owned copy** — including Brady's. Use neutral illustration, iconography, or clearly-labelled empty media slots.
6. **Search indexing** — `noindex, nofollow` on every route, `robots.txt` disallow all, no sitemap submission.
7. **Paid traffic** — no ad pixels firing, no conversion tags live, no campaign landing parameters treated as real.
8. **Testimonials, customer names, case studies, logos of customers, review scores.**

Reason on record: Claude Strategic Assessment, Compliance Matrix, and ACS commercial-rights
documentation are incomplete. These gates lift only by owner decision recorded in §8.

---

## 4. UX Controls

- Mobile-first. Thai primary, English secondary, both hand-written — no machine-guessed long copy.
- One primary CTA per page. Secondary contact (call / LINE) allowed, visually subordinate.
- Sticky CTA on mobile.
- No dead buttons. Every control resolves to a real destination or an explicit
  "ยังไม่เปิดใช้งาน / not enabled in prototype" state.
- Page skeleton, in order: problem framing → what the assessment actually covers →
  what the customer receives → what happens next (timeline) → form.
- Neutral, technical, non-hyped tone. No superlatives. No "leading", "best", "#1".
- Accessible: visible focus states, labelled inputs, contrast ≥ 4.5:1, no colour-only meaning.

## 5. Lead Form Controls

Single shared form component across all five pages, with a `page_context` field.

Fields: name, company, role, work email, phone, site province/city, page context,
free-text description of the current situation, preferred contact channel.
Per-page qualifier (one only): #1 lines/shifts, #2 environment + durability need,
#3 asset class + estimated asset count, #4 attending roles, #5 site count + rack count.

- **Persistence is mandatory.** Every submission must persist server-side and return a
  visible Lead ID. A toast with no persistence is a failure state, not an MVP shortcut.
- PDPA consent checkbox, unticked by default, with a link to `/privacy`. No pre-consent.
- No marketing opt-in bundled into the consent checkbox — separate, optional.
- Validation inline, Thai + English error copy.
- `/thank-you` states the real next step and the expected response window as a
  `sample_data: true` placeholder until the owner confirms the real SLA.

## 6. Tracking, SEO and Content Controls

**6.1 Tracking.** Instrument the event layer but keep it inert: `page_view`,
`cta_click`, `form_start`, `form_field_error`, `form_submit`, `lead_created`,
`thankyou_view`. Events go to a local/dev sink only. **No GA4, GTM, Meta, LinkedIn or
TikTok tag may be loaded in the prototype.** Leave a single documented insertion point.

**6.2 SEO — build it, do not activate it.** Per-route title, meta description, canonical,
Open Graph, and TH/EN `hreflang` + `x-default` must all be authored. `robots` meta stays
`noindex, nofollow`, `robots.txt` disallows all, and no sitemap is submitted. Gate all of it
behind one config flag (e.g. `PUBLIC_INDEXING_ENABLED = false`) so activation is one change.

**6.3 Content.** Every claim on the page must be attributable to the assessment ACS actually
performs. No performance percentages, no ROI figures, no "up to X% fewer errors".

**6.4 Locale.** Locale in the URL (`/th/...`, `/en/...`), never localStorage-only. Core copy
and H1 must render without client-side JS.

**6.5 Sample-data pattern.** Any placeholder value renders with a visible "sample data" tag
and carries `sample_data: true` bound to a named real field. Never a bare hardcoded number.

---

## 7. Sales Opportunity Register — NOT AVAILABLE TO THIS BUILD

The approved brief carries 20 opportunities scored P0/P1/P2/Hold with Source IDs.
**That register was not supplied to this session and has not been reconstructed here** —
inventing it would violate §0.

Build instruction: the prototype must contain **no** opportunity list, no P0/P1/P2 badges,
no Source ID display, and no dashboard of opportunities. Leave `docs/opportunity-register.md`
absent rather than populated with invented rows. When the owner supplies the real register,
it enters the repo as its own file and the prototype is re-scoped separately.

---

## 8. 30-Day Plan — 8 September to 7 October 2026

| Phase | Dates | Deliverable | Owner | Reviewer | Dependency |
|---|---|---|---|---|---|
| A. Prototype build | 8–14 Sep | 5 pages live in Lovable preview, `noindex`, neutral media slots | Lovable agent | ACS owner | This brief |
| B. Lead form + persistence | 15–19 Sep | Form persists, Lead ID returned, PDPA consent, `/thank-you` | Lovable agent | ACS owner | Phase A |
| C. Tracking + SEO scaffolding | 20–24 Sep | Inert event layer, per-route meta, indexing flag off | Lovable agent | ACS owner | Phase B |
| D. Copy review (TH/EN) | 25–29 Sep | Owner-approved copy on all 5 pages; no unverified claims | ACS owner | ACS technical lead | Phase A |
| E. Compliance package | 25 Sep–3 Oct | Strategic Assessment, Compliance Matrix, commercial-rights docs | ACS owner | External/legal | **BLOCKER for production** |
| F. Gate review | 6–7 Oct | Go / no-go on production, indexing, paid traffic | ACS owner | ACS owner | Phases A–E |

Phase E is the critical path. Phases A–D can complete without it; **nothing in Phase F may
proceed without it.**

## 9. Decision Log

| ID | Date | Decision | Basis | Status |
|---|---|---|---|---|
| D-01 | 7 Sep 2026 | Approve Lovable prototype for 5 pages only | Owner | APPROVED |
| D-02 | 7 Sep 2026 | Block production publishing, pricing, stock, partner claims, manufacturer imagery, indexing, paid traffic | Compliance package incomplete | BLOCKED |
| D-03 | 7 Sep 2026 | Assessment-led CTA on all five pages, no transactional CTA | Owner-approved page structure | APPROVED |
| D-04 | 7 Sep 2026 | Opportunity register excluded from prototype; not reconstructed | Source material not supplied to build session | EXCLUDED |
| D-05 | pending | Lift indexing gate | Requires D-02 cleared | OPEN |
| D-06 | pending | Confirm real response-time SLA on `/thank-you` | Owner input required | OPEN |

## 10. Owner Approval List

- [x] 5-page scope — approved
- [x] Prototype-only status — approved
- [x] Hard gates in §3 — approved
- [ ] TH/EN page copy — pending owner review (Phase D)
- [ ] Response-time SLA on `/thank-you` — pending owner input (D-06)
- [ ] Strategic Assessment — pending
- [ ] Compliance Matrix — pending
- [ ] ACS commercial-rights documentation — pending
- [ ] Production publish / indexing / paid traffic — **not approved**
