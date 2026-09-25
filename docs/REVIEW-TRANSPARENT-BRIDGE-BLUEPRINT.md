# REVIEW — Transparent Bridge Enterprise Architecture Blueprint

**Reviewer:** Claude — Portfolio Architecture / Security / Privacy / Governance
**Date:** 2026-09-25 · **Subject:** Private-Deal Infrastructure blueprint supplied by Owner
**Verdict:** **REVISE** — direction correct, six items must change before implementation

Nothing was modified, enabled, deployed or published in the course of this review.

---

## 1 · What this blueprint gets right — keep all of it

| § | Item | Why it is correct |
|---|---|---|
| 7 | *"จุดที่สร้างเงินคือ Mandate Enforcement และ Success Fee Ledger อย่าเพิ่งทำ AI Matching ใน Day 1"* | Exactly right, and it is the hardest thing to get right. AI matching is the most attractive feature and the least revenue-producing. |
| 8 | Audit log from the first moment a buyer sees the asset, as the instrument against fee evasion | This is the strongest idea in the document. In Thai commercial property, "who introduced whom first" is what commission disputes are actually about. |
| 8 | Per-funder watermarking with name + timestamp | Correct control, cheap, and it changes behaviour rather than merely recording it. |
| 4 | *"ความโปร่งใสไม่ได้แปลว่าทุกคนเห็นทุกอย่าง แต่หมายถึงผู้มีสิทธิ์เห็นข้อมูลที่ถูกต้องเสมอ"* | The correct definition. One record, scoped projections — not separate truths per party. |
| 8 | Over-engineering control: anything that does not speed closing or protect the fee is deferred | Keep this rule and apply it to §1 of this same document (see 2.1). |
| 6 | Explainable matching rationale, not a bare name | Right shape: AI states reasons a human can check. |
| 5 | Matte Black `#121212` + Gold `#D4AF37` | **Contrast measured: 8.91:1.** Passes WCAG AAA for body text. The palette is technically sound — no objection. |

---

## 2 · Six items that must change

### 2.1 — **CRITICAL** · The tech stack discards a working production system

The blueprint proposes React/Next.js + Python FastAPI + standalone PostgreSQL + Redis + AWS S3.
The live systems are **TanStack Start + TypeScript + Supabase (PostgreSQL) + Supabase Storage**,
published, with production data.

Adopting this blueprint means running, on day one, with one operator and ฿0 revenue:

| Layer | Exists and works today | Blueprint adds |
|---|---|---|
| Framework | TanStack Start | **+ Next.js** |
| Language | TypeScript | **+ Python** |
| Database | Supabase PostgreSQL, with RLS live | **+ standalone PostgreSQL** |
| Cache | none needed at this load | **+ Redis** |
| Storage | Supabase Storage | **+ S3/GCS** |
| Auth | Supabase Auth + `has_role()` + RLS policies | **rebuild** |

**What gets thrown away:** the `deals`, `offers`, `viewings`, `deal_messages`, `matches`,
`properties` tables; eight Drizzle migrations; the RLS policy set; the PDPA export/erasure
tooling; `requireSupabaseAuth`, which is the construct making `userId` come from a verified token
and never from client input; and the `fee_rules` specification that already has the right shape.

This is not a framework preference. **It is the difference between first cash in weeks and first
cash in quarters.** The blueprint's own §8 rule — defer anything that does not speed closing —
rules against the blueprint's own §1.

**Required change:** build Deal Room, Mandate and Ledger **inside Lilith Connect**, on the
existing stack, reusing auth and RLS. Add Python only if a specific computation demands it, and
add Redis only when a measured load demands it. Neither condition exists today.

### 2.2 — **CRITICAL** · The worked example asserts a fee rate 63.6× the recorded one

> **RESOLVED 2026-09-25.** The Owner ratified the `middle_success_fee` seed rule as written —
> 10 bp, payer OWNER (`docs/adr/ADR-0014-success-fee-rule-ratified.md`). **The 6.36% figure in
> the blueprint is superseded and must not be used.** The finding below stands as written: the
> example was unsourced when written, and that is why it had to be challenged rather than
> adopted.

The example states a ฿17,800,000 success fee on a ฿280,000,000 asset.

```
17,800,000 / 280,000,000        = 6.3571 %
0.1 % (10 bp) of 280,000,000    =    280,000 THB
ratio                           = 63.6 ×
```

The only fee rate recorded anywhere in this portfolio is **0.1 % (10 bp)**, in
`docs/01-product-and-system-architecture.md`. This document silently assumes ~6.36 %.

One of three things is true, and **nobody currently knows which**:
1. 0.1 % is wrong and the real rate is ~6 %;
2. ฿17.8M is a blended figure across several lines and is not a rate at all;
3. the number is illustrative and unsourced.

At the time of review, `fee_rules.basis` and `fee_rules.payer` were **undecided**. A worked example
embedding a rate 63.6× the recorded one, before that decision was made, would have been read by an
implementer as the specification.

**Now resolved (ADR-0014): the rate is 10 bp and the payer is OWNER.** The requirement stands in a
sharper form — every figure in §2 of the blueprint must be **replaced with the ratified rate**, not
merely marked as illustration.

The same applies to ฿70,000,000 for 7 units (= ฿10,000,000 per unit) — unsourced.

### 2.3 — **BLOCKED** · "บังคับใช้สัญญา Mandate ได้ 100%"

An audit log is **evidence**. It is not **enforcement**. Enforcement is a court or an arbitrator
weighing that evidence against a contract. No software achieves 100% enforceability, and no
vendor can promise it.

Under this portfolio's own claim register this is a `BLOCKED` claim: a superlative with no
verifiable source, in the same class as *"รายใหญ่ที่สุดในประเทศ"*, which was already refused.

**Required wording:** *"produces a timestamped, hashed, non-repudiable record of access and offer
history, intended to be admissible evidence in a mandate dispute."* That is both true and, to a
counterparty, more persuasive — because it is checkable.

### 2.4 — **HIGH** · Automatic WHT and VAT computation creates liability for the payer

> *"ระบบจะหักภาษี ณ ที่จ่าย (Withholding Tax) และ VAT ตามฐานข้อมูลนิติบุคคล"*

The withholding rate depends on the payee's tax status, the character of the service, whether the
payee is domestic or foreign, any applicable treaty, and who the withholding agent is. VAT
depends on registration status and threshold.

When a system computes this automatically and gets it wrong, the exposure lands on **the payer**,
not on the software.

**Required change:** the ledger computes a **proposed** tax treatment, flags the inputs it used,
and requires confirmation by a named accountant before the invoice leaves `DRAFT`. Store the
confirmation with `actor_id`. Rates are configuration data with effective dates, never constants
in code.

### 2.5 — **HIGH** · `/ledger/{invoice_id}/reconcile` implies custody

*"อัปเดตสถานะเมื่อตรวจพบกระแสเงินเข้าสู่ระบบ"* — "funds entering the system" means the platform
receives money. Holding or routing third-party funds in Thailand implicates payment-services and
escrow regulation: a multi-quarter licensing project, not a 90-day one.

**Required change:** reconcile against a **bank statement line supplied by the principal**, with
the statement reference and document hash stored. The platform's product is the instruction and
the proof, not the custody. This is also faster to launch and lets a counterparty accept the
platform without underwriting its solvency. Confirm scope with Thai counsel.

### 2.6 — **HIGH** · AI document parsing writing financial fields is an injection surface

> *"ใช้ AI สกัดตัวเลขเงื่อนไขจากไฟล์ PDF … แปลงลง Database เพื่อลด Human Error"*

A PDF from a counterparty is attacker-controlled input. If its parsed output populates amounts,
dates or party names in the ledger, the counterparty is writing to your financial records through
a model. AI parsing does not only reduce an error class — **it introduces a new one**, and that
new one is adversarial rather than accidental.

**Required change:** parsed values land in a `proposed_terms` staging table, rendered beside the
source page image, and a human promotes each field. No parsed value may reach `fee_agreement`,
`closing_event` or any amount column without an `actor_id` on the promotion.

The structural rule from `PORTFOLIO-ARCHITECTURE-REVIEW.md` §10 applies unchanged: **the AI path
holds no credential that can write state.** A prompt instructing a model not to write is not a
control; an absent write capability is.

---

## 3 · Missing from the blueprint

| # | Gap | Consequence |
|---|---|---|
| G1 | **Money type is unspecified** | An 8-figure THB commission × a decimal rate loses precision in floating point. Amounts must be `BIGINT` satang; rates must be `INT` basis points. This is the one defect that silently corrupts the product the platform sells. |
| G2 | **No reproducibility requirement** | Store the calculation inputs and the calculator version so any party can re-run and match to the satang. Without it, "transparent" means "we say so". |
| G3 | **Allocation exactness is not enforced** | The 60/20/20 split must be held by a database constraint summing to exactly 10000 bp and to the gross satang — not by convention. Splits that drift are how disputes start. |
| G4 | **No transactional outbox** | The current codebase already loses events silently on a commit-then-notify path (review §4). A ledger built on the same pattern will lose settlement notifications. |
| G5 | **No consent / PDPA layer** | The intake side of this portfolio is PDPA-governed. A blueprint that adds Funders and Brokers as data subjects without a consent model inherits an open obligation. |
| G6 | **No retention policy** | Data rooms accumulate counterparty financial documents indefinitely by default. |
| G7 | **Idempotency absent** | `POST /ledger/calculate-splits` retried once produces a second calculation. Every write endpoint needs an idempotency key. |

---

## 4 · One dashboard element must be refused

> §5: *"ตัวเลขประมาณการ Success Fee ที่รอรับรู้รายได้"* and §5: *"Deal Probability Scoring"*

`Property Pulse / src/lib/content-os.ts` already encodes the correct discipline: every funnel
stage carries `countsAsRevenue: false` except `R6_CLOSED`, and each stage renders an explicit
assertion that it is **not** the next one. Unverified quantities resolve to `NO_VERIFIED_DATA`.

Placing an estimated fee figure beside recognised revenue is how a business starts reporting its
pipeline as income. A probability score shown to an Owner about their own deal is a claim: when
the 70 % deal dies, the number was the promise.

**Required change:** pipeline value and recognised revenue are rendered in **visually distinct
zones with different labels**, never summed and never adjacent. Probability is shown as the
**named stage plus days-in-stage** — both facts — not as a percentage. This costs nothing and is
the difference between a dashboard an Owner trusts and one they learn to discount.

---

## 5 · Revised 90-day sequence

Phase order is right. Substrate and scope are not.

| Phase | Blueprint | Revised |
|---|---|---|
| **1** (1–30) | New stack, Asset Intake, NDA Data Room | **Days 1–10 on the existing stack.** Mandate + Asset + evidence checklist + watermarked data room inside Lilith Connect. **Day 1: decide `basis` + `payer`.** |
| **2** (31–60) | Ledger + Revenue Split + LOI tracking | **Days 11–40.** Same scope, plus G1–G3 and G7: satang, basis points, reproducibility, allocation constraint, idempotency. Outbox before any external notification. |
| **3** (61–90) | Matte Black UI + Gemini matching | **Days 41–90.** UI theme yes — palette is sound. AI matching **only after** §2.6 staging exists. |

The twenty days freed by not rebuilding the stack are the entire margin between first cash this
quarter and first cash next quarter.

---

## 6 · Verdict

**REVISE.** The commercial instinct is correct and two ideas in it — audit-log-as-evidence and
per-funder watermarking — are worth more than the rest of the document combined.

Three items must change before an implementer touches it:

1. **§2.1** — build on the existing stack. Rebuilding discards working auth, RLS, migrations and
   PDPA tooling for no named benefit, and costs the quarter.
2. **§2.2** — the ฿17.8M example asserts a rate 63.6× the only recorded one, while the fee basis
   is still undecided. Mark it unsourced or decide the rate first.
3. **§2.3** — "100% enforceable" is a blocked claim. An audit log is evidence, not enforcement.

Then §2.4–2.6 and G1–G7 before the ledger holds a real number.

No system was modified, no database enabled, no deployment made, no customer contacted.
