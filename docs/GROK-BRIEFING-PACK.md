# BRIEFING PACK — for Grok

**Prepared by:** Claude · **Date:** 2026-09-25 · **Owner:** ACS Owner (Yacht)
**Subject:** four "credit" workstreams
**Status:** briefing only. Nothing here authorises code, migrations, deployment or publication.

---

## 0 · Read this page before anything else

> **Note on the checker and this file** — this pack quotes forbidden wording verbatim in order to
> forbid it, and cites both the 0.1% and the 6.36% figures in order to put the contradiction in
> front of the reader. `node acs-seo/tools/redact.mjs docs/GROK-BRIEFING-PACK.md` therefore reports
> findings, including two BLOCK hits on "best" and "guaranteed" that appear inside rule 3 below.
> Every one is a **reference made in order to prohibit**, not a claim. Left as is deliberately: a
> briefing that cannot spell out what must not be said does not do its job. `validate.mjs` scans
> only files destined for the live site; this file is not one and never will be.

### 0.1 Why this pack exists

We have direct evidence of what happens when a task is handed to an AI without the facts pinned
down first. A blueprint produced elsewhere stated a success fee of ฿17,800,000 on a
฿280,000,000 asset — **6.36%** — while the only fee rate recorded anywhere in this portfolio is
**0.1%**. That is **63.6× too high**, and it was written as a worked example an implementer would
have copied. The same document claimed the system "enforces the mandate 100%", which no software
can do.

Neither figure was malicious. Both are what happens when a gap gets filled instead of flagged.

**So this pack is not background reading. It is a contract about what may and may not be said.**

### 0.2 The single most important fact

> **There is no implemented money code in the `lilith` repository. None.**

- `packages/db`, `packages/core`, `packages/contracts` are empty stubs (`export {}`)
- No `.sql` files, no migration directory, no ORM schema
- `apps/worker` exits with *"Worker scaffold only. PostgreSQL and pg-boss are not configured"*
- `docs/IMPLEMENTATION_STATUS.md` states: *"**Platform production-ready: false.** No migrations,
  product authentication, matching, deal workflows, invoices or 38-screen E2E release gate are
  delivered by this task."*

Every table named in this pack is **prose in a specification document**, not a thing that exists.
Do not write code that imports from these packages or queries these tables. They are not there.

### 0.3 Two different systems — do not merge them in your head

| | `lilith` git repository | Lovable project `8f4f3787` |
|---|---|---|
| Contains | specs, governance tooling, ACS SEO packages | a running TanStack Start + Supabase app |
| Money code | **none** | none, but `deals` / `offers` / `viewings` / `deal_messages` tables exist |
| Verified how | read directly | read directly from Lovable at commit `62fe036a` |
| Is its code in this repo? | — | **No.** Described only. |

When you cite something, say which of the two it came from.

### 0.4 Rules that apply to every topic below

1. **Money is `BIGINT` satang. Rates are `INT` basis points.** Never float, never a decimal rate.
   0.1% is `10`, not `0.001`. An eight-figure THB commission multiplied by a decimal rate loses
   precision in binary floating point, and that is the exact product this business sells.
2. **Every number needs a source.** If you cannot cite a file path, write `UNSOURCED` next to it.
   Do not estimate, do not benchmark from memory, do not fill in a plausible figure.
3. **No superlatives, no guaranteed outcomes.** Not "the best", not "100% enforceable", not
   "guaranteed return". These are refused by an existing rule set, not by taste.
4. **When a section says UNDECIDED, ask. Do not choose.** Picking a default and moving on is the
   failure mode this pack exists to prevent.
5. **Distinguish SPEC from IMPLEMENTED in every claim you make.** Most of what follows is SPEC.

---

## 1 · Success Fee Ledger

### FACT — all SPEC unless marked

**`docs/01-product-and-system-architecture.md` §8.2.7** specifies five money tables in prose:

| Table | Key columns |
|---|---|
| `fee_rules` | `code`, `version`, `status ENUM(DRAFT,ACTIVE,RETIRED)`, `applies_to JSONB`, `basis ENUM(TRANSACTION_VALUE,ANNUAL_RENT,MONTHLY_RENT,FIXED)`, `rate_bp INT`, `fixed_amount BIGINT`, `min_amount`, `max_amount`, `payer ENUM(OWNER,AGENT,CLIENT,SPLIT)`, `payer_split JSONB`, `vat_rate_bp INT default 700`, `effective_from/to`, `UNIQUE(code, version)` |
| `fees` | `deal_id`, `fee_rule_id`, **`fee_rule_snapshot JSONB NOT NULL`**, `transaction_value_amount BIGINT`, `fee_basis`, `fee_basis_amount`, `fee_rate_bp`, `fee_amount`, `vat_amount`, `total_amount`, `payer_user_id`, `status ENUM(DRAFT,ISSUED,WAIVED,VOID)`, `override_reason`, `overridden_by` |
| `invoices` | `fee_id`, `invoice_number UNIQUE`, `issued_to JSONB` (name, tax id, address snapshot), `issued_at`, `due_at`, `status ENUM(ISSUED,PARTIALLY_PAID,PAID,OVERDUE,CANCELLED)`, `total_amount` |
| `payments` | `invoice_id`, `method ENUM(BANK_TRANSFER,PROMPTPAY,CARD,OTHER)`, `amount`, `paid_at`, `reference`, `evidence_document_id`, `status ENUM(PENDING,CONFIRMED,FAILED,REFUNDED)`, `confirmed_by` |
| `receipts` | `payment_id UNIQUE`, `receipt_number UNIQUE`, `document_id`, `issued_at` |

**`docs/02-matching-ai-deal-fee.md` §13** contains the fee engine design and — importantly — a
complete seed rule:

```json
{ "code": "middle_success_fee", "version": 1, "status": "ACTIVE",
  "applies_to": { "transaction_type": ["SALE","RENT","RENT_TO_OWN","INVEST"] },
  "basis": "TRANSACTION_VALUE",
  "rate_bp": 10,              // 10 basis points = 0.1%
  "min_amount": 0, "max_amount": null,
  "payer": "OWNER",
  "vat_rate_bp": 700,         // 7% Thai VAT
  "effective_from": "2026-01-01" }
```

Worked example from the same section: a sale closing at ฿12,500,000 = `1,250,000,000` satang →
`fee_amount = 1,250,000,000 × 10 / 10,000 = 1,250,000` satang = **฿12,500**; VAT 7% = **฿875**;
total **฿13,375**. *(Arithmetic verified. The source document's digit grouping in this passage is
malformed; the values are correct.)*

Also specified there:
- Payment flow for MVP is **manual and off-platform**: PromptPay QR + bank transfer, the payer
  uploads slip evidence, an operator confirms.
- Waiver rule: *"never edits an issued invoice — it voids and reissues with a linked credit note."*
- Numbering: `MP-INV-{YYYY}-{000001}` and `MP-RCP-{YYYY}-{000001}`.
- Versioning: changing pricing later inserts `version: 2`; existing `fees` rows are untouched
  because they carry `fee_rule_snapshot`. *"Historic invoices can always be re-derived and defended."*

**`docs/04-api-contracts.md` §18.8** — HTTP contracts exist, handlers do not:
`GET /api/deals/:id/fee`, `GET /api/invoices/:id[/pdf]`, `POST /api/invoices/:id/payments`,
`GET /api/receipts/:id/pdf`, `POST /admin/api/payments/:id/confirm`,
`POST /admin/api/fees/:id/waive`, `POST /admin/api/invoices/:id/void`,
`GET /admin/api/reconciliation/daily`.

**`docs/03-security-events-admin.md`** — events `fee.computed`, `fee.overridden`, `fee.waived`,
`invoice.issued`, `invoice.voided`, `payment.confirmed`; admin role `FINANCE`; **dual control
required for waive and void**.

**`docs/CAPITAL-CAPTURE-MASTERPLAN.md` §1** — a later, more detailed design (illustrative DDL,
never applied) for `fee_agreement`, `closing_event`, `fee_calculation`, `fee_allocation`, plus a
trigger `assert_allocation_exact()` that rejects any allocation set not summing to exactly
`10000` bp and to the gross satang.

**IMPLEMENTED (Lovable `5df077b2`)** — `src/lib/content-os.ts` encodes revenue recognition:
every funnel stage carries `countsAsRevenue: false` except `R6_CLOSED`, and each stage renders an
explicit assertion that it is not the next one (*"A submission is not a Qualified Lead"*).

### UNDECIDED — ask, do not choose

**D1 is narrower than it has been described.** A complete rule already exists in spec, marked
`status: "ACTIVE"`, with `basis: TRANSACTION_VALUE`, `payer: OWNER`, `rate_bp: 10`.

So the open question is **not** "what should the fee be". It is:

> **Does the `middle_success_fee` seed rule stand as written, or does something supersede it?**

What makes it unsettled:
- it has never been implemented — no `fee_rules` table exists to hold it;
- the Owner has not confirmed it in the current round of work;
- a later document (the Transparent Bridge blueprint) implies ~6.36%, which contradicts it 63.6×.

Also undecided: the **withholding tax** rate and treatment. VAT is set at 700 bp; WHT appears in
`CAPITAL-CAPTURE-MASTERPLAN.md` §1 as `wht_rate_bp` with no value.

### FORBIDDEN

- Computing any amount in floating point.
- Creating a `fee_calculation` without a `closing_event` carrying evidence.
- Designing the platform to **hold or route client funds**. `CAPITAL-CAPTURE-MASTERPLAN.md` §1.4
  excludes custody deliberately: holding third-party money implicates payment-services and escrow
  regulation. The platform calculates, evidences and invoices; a licensed third party executes.
- Displaying an estimated or pipeline fee figure beside recognised revenue.
- Editing an issued invoice. Void and reissue with a credit note.

### ASK

1. A fee calculation function that is **reproducible to the satang**: given stored inputs and a
   recorded calculator version, any party re-running it eighteen months later gets the identical
   number. Specify what the input digest covers.
2. A rounding rule such that `fee_allocation` rows always sum exactly to the gross, with the
   remainder assigned deterministically. Say where rounding happens — once, at a named step.

---

## 2 · Credit and token spend

### FACT — observed in this session, not estimated

- Lovable `send_message` times out at the MCP client after **60 seconds**, but the Lovable agent
  keeps running and keeps consuming workspace credits. Re-sending duplicates the spend. Poll
  `get_project` and read `agentFinished` instead.
- Lovable `list_messages` returned **~335,000 characters** in one call, overflowing context.
  Query the saved result with `jq` rather than reading it.
- A Lovable agent asked for a tightly scoped change **exceeded that scope**: a request to disable
  one booking flow also produced routing changes across seven files, a new npm dependency, and a
  disabled language switcher. Read the diff before publishing, every time.
- This session's network blocks `lovable.app`, so a deployed page cannot be verified from here.
  Verification of live output has to be done by a person.
- Reading an 800-line translation file to check whether one variable still exists is not worth the
  tokens when a person can answer it by clicking once.

### UNDECIDED

- Monthly Lovable credit budget the Owner accepts.
- Which classes of work justify an agent versus doing it by hand.

### ASK

A reusable decision rule — not a case-by-case judgement — for when to spend agent credits. It
should account for: how reversible the change is, how verifiable the output is, and whether the
project is one the business is still investing in.

---

## 3 · Customer credit and payment terms

### FACT — more exists than expected, all SPEC except the last item

- **`offers.terms JSONB`** (`docs/01` §8.2.6) — described as *"(deposit, lease months, furniture,
  move-in, RTO option fee)"*. Example instance in `docs/04-api-contracts.md`:
  `{ "lease_months":12, "deposit_months":2, "advance_months":1, "furniture_included":true, "move_in_date":"2026-10-15" }`
- **`properties.rto_terms JSONB`** (`docs/01` line 651) — *"rent-to-own: option fee, credit %,
  term months, strike price"*. **This is the closest thing to a customer credit product anywhere
  in the specification**, and the seed fee rule already lists `RENT_TO_OWN` among its
  `transaction_type` values.
- `invoices.status` includes `PARTIALLY_PAID` and `OVERDUE` — partial payment is anticipated.
- `payments.status` includes `REFUNDED`.
- `docs/07-codex-handoff.md` **FEE-004** — *"Payments & receipts (manual flow)"*, *"partial
  payments supported"*. Not started.
- `docs/06-roadmap-and-adrs.md` — card and PromptPay gateway integration is explicitly deferred
  past V1.

**IMPLEMENTED — and it is a prohibition, not a feature.** `acs-seo/data/forbidden_terms.json`
carries a live lint rule blocking public text matching
`ผ่อนชำระ | ผ่อนได้ | แบ่งจ่าย | installment | เช่าซื้อ | ลีสซิ่ง | leasing`, with the message that
instalment and hire-purchase terms are financial offers requiring ACS to confirm the conditions and
the period. It is enforced by `acs-seo/tools/selftest.mjs`. **Any public-facing copy about payment
terms will be rejected by this rule until someone with authority supplies the terms.**

### UNDECIDED

- Whether a rent-to-own product is actually going to exist. `credit %`, `option fee`, `term months`
  and `strike price` are named fields with no values and no validation anywhere.
- Refund policy and cancellation consequences. `CANCELLED` is a deal state with a `reason_code`
  enum carrying **no money consequence**, beyond a note that cancelling after `AGREEMENT_SIGNED`
  needs an admin acknowledgement because a fee may already exist.
- Standard deposit terms. `deposit_months` appears exactly once, inside an example JSON body.
  There is no schema, no enum, no validation.

### FORBIDDEN

- **Designing credit limits, credit scoring, or any assessment of a customer's creditworthiness.**
  Nothing of the kind exists, and offering credit is a regulated financial activity. If the work
  drifts toward it, stop and say so.
- Designing escrow or a deposit the platform holds. Excluded deliberately in two places.
- Writing any public-facing copy that advertises instalment or hire-purchase terms. The lint rule
  above will reject it, and correctly.

### ASK

If rent-to-own is to become real: what has to be decided, in what order, and which of those
decisions need a Thai lawyer before any schema is written? Treat `rto_terms` as the anchor and say
what each of its four fields commits the business to.

---

## 4 · Project funding and funder matching

### FACT — the honest answer is that almost nothing exists

Searched across the repository. **Not found:** funder or investor entity · capital stack ·
fundraising · project finance · proof of funds · due diligence · NDA model · LOI model · funder
matching · data room.

Things that exist and are **routinely mistaken** for the above:

| Exists | What it actually is |
|---|---|
| `client_profiles.client_type ENUM(BUYER,TENANT,INVESTOR)` | `INVESTOR` is a **property buyer**, not a provider of capital |
| `mandates` (`EXCLUSIVE\|OPEN\|CO_AGENCY`, `commission_pct`) | an **agent's right to list a property**, not a funding mandate |
| `deal_rooms` / `deal_participants` | a **buyer↔seller** negotiation space with contact masking, not a funder-facing document room |
| `CAPITAL-CAPTURE-MASTERPLAN.md` §2–3 (`asset`, `evidence_requirement`, `asset_evidence`, `introduction`, `liquidity_bp`) | **design only, never built** |
| `REVIEW-TRANSPARENT-BRIDGE-BLUEPRINT.md` funder / data-room passages | **commentary on somebody else's proposal**, not a description of anything we have |

### UNDECIDED — all of it

Whether this line of business happens at all · who a Funder is and how they differ from the
existing `INVESTOR` client type · what licences arranging finance would require in Thailand.

### FORBIDDEN

- Writing as though a funder system exists or is partly built.
- Designing capital-raising mechanics without naming which parts touch securities or lending
  regulation. Arranging finance is not the same risk class as brokering a sale.
- Repeating the claim that an audit log makes a mandate "100% enforceable". An audit log is
  **evidence**; enforcement is a court weighing it. That claim was already rejected in review.

### ASK

Before a line of code: what legal questions must be answered, and what is the smallest version of
this that is worth testing? Note that `CAPITAL-CAPTURE-MASTERPLAN.md` §3.3 identifies two revenue
lines needing no closing event — an evidence-readiness engagement and a mandate retainer — which
may make a lighter starting point than a funding platform.

---

## 5 · How to tell whether this pack worked

Ask Grok one question whose answer is already known: **"What percentage is the success fee?"**

- ✅ **Correct:** it names the seed rule's 10 bp, states that no `fee_rules` table exists to hold
  it, flags that a later document implies ~6.36%, and **asks which stands**.
- ❌ **Failed:** it answers "0.1%" or "6.36%" as settled fact.

If the answer is the second kind, the UNDECIDED sections are not written strongly enough and this
pack should be revised before real work is handed over.

---

## 6 · Scope of this pack

It does not decide D1 · does not authorise code, schema or migrations · does not enable any
database · does not approve publication. It is handed to the Owner, who forwards it.

Source of every claim above is either a path in the `lilith` repository or a named Lovable project
and commit. Anything without such a source is not in this document.
