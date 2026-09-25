# HIGH-STAKES FINANCIAL ARCHITECTURE MEMO
## Monetization & Capital Capture Masterplan — The Middle / LILITH

**To:** ACS Owner · **From:** Architecture & Revenue Engineering
**Date:** 2026-09-25 · **Classification:** Internal — Financial Architecture
**Status:** DESIGN. No funds moved. No system modified. No customer contacted.

---

## 0 · The finding that governs this entire memo

The revenue engine is **already specified and already correct**. `docs/01-product-and-system-architecture.md`
defines `fee_rules` with the right primitives:

```
basis  ENUM(TRANSACTION_VALUE, ANNUAL_RENT, MONTHLY_RENT, FIXED)
rate_bp INT              -- basis points; 0.1% = 10 bp
payer  ENUM(OWNER, AGENT, CLIENT, SPLIT)
payer_split JSONB
amounts BIGINT           -- satang, minor units
status ENUM(DRAFT, ACTIVE, RETIRED)
effective_from / effective_to
```

Money in integer satang, basis points not percentages, an immutable snapshot of the rule that
produced each amount, and versioned rules with effective dating. That is institutional-grade
design. It is not the problem.

**The problem is that no row in `fee_rules` can reach `status = ACTIVE`,** because `basis` and
`payer` are a single undecided Owner decision. `0.1%` is recorded. *Of what, paid by whom* is not.

> **A commission engine with no active fee rule produces ฿0 with perfect precision.**

Every section below assumes that decision is made. It is the only true blocker in this memo, and
it costs one sentence to resolve, not one sprint. §5 puts it on Day 1 for that reason.

---

## 1 · The Dealmaking Engine

### 1.1 The governing principle

> **A success fee is not a number. It is a claim on a future event.**

A stored fee amount is an assertion. A *derived* fee amount is evidence. The engine must never
persist a commission that a human typed; it must persist the **inputs** and the **rule version**,
and compute the amount as a pure function that any party can re-run and reproduce byte-for-byte
eighteen months later in front of a lawyer.

### 1.2 Financial reconciliation schema

```sql
-- The agreement. Immutable once countersigned. Versioned, never updated in place.
create table fee_agreement (
  id                uuid primary key,
  deal_id           uuid not null references deal(id),
  fee_rule_id       uuid not null references fee_rules(id),
  fee_rule_snapshot jsonb not null,      -- the rule AS IT WAS, frozen
  basis             text not null,        -- TRANSACTION_VALUE | ANNUAL_RENT | ...
  rate_bp           int  not null,        -- 10 = 0.1%
  payer             text not null,
  currency          char(3) not null default 'THB',
  signed_by         jsonb not null,       -- [{party_id, signed_at, doc_hash}]
  agreement_hash    text not null,        -- sha256 of the rendered agreement text
  created_at        timestamptz not null default now(),
  superseded_by     uuid references fee_agreement(id)
);

-- The event that makes the fee payable. Requires evidence, never a checkbox.
create table closing_event (
  id              uuid primary key,
  deal_id         uuid not null references deal(id),
  closed_at       timestamptz not null,
  basis_amount    bigint not null,        -- SATANG. never float. never numeric-from-string.
  basis_kind      text not null,          -- must equal fee_agreement.basis
  evidence        jsonb not null,         -- [{kind, doc_hash, issued_by, issued_at}]
  evidence_state  text not null,          -- NONE|STAGED|PENDING_QA|PROVENANCE_OK|MISSING
  attested_by     uuid not null,          -- a named human. never a service account.
  constraint closing_requires_evidence
    check (evidence_state = 'PROVENANCE_OK')
);

-- Derived. Reproducible. Never hand-entered.
create table fee_calculation (
  id                uuid primary key,
  deal_id           uuid not null,
  fee_agreement_id  uuid not null references fee_agreement(id),
  closing_event_id  uuid not null references closing_event(id),
  calculator_version text not null,       -- the code version that produced this
  input_digest      text not null,        -- sha256 of the canonical input tuple
  gross_fee_satang  bigint not null,
  vat_rate_bp       int    not null,
  vat_satang        bigint not null,
  wht_rate_bp       int    not null,      -- withholding tax
  wht_satang        bigint not null,
  net_payable_satang bigint not null,
  computed_at       timestamptz not null default now(),
  unique (closing_event_id, calculator_version)
);

-- Splits. Must sum exactly. Enforced, not trusted.
create table fee_allocation (
  id                 uuid primary key,
  fee_calculation_id uuid not null references fee_calculation(id),
  party_id           uuid not null,
  role               text not null,       -- INTRODUCER | CO_BROKER | PLATFORM | REFERRER
  share_bp           int  not null,       -- basis points of the gross fee
  amount_satang      bigint not null,
  unique (fee_calculation_id, party_id, role)
);

-- The gate: allocations must be exact. No rounding drift, ever.
create or replace function assert_allocation_exact() returns trigger as $$
declare s_bp int; s_amt bigint; gross bigint;
begin
  select sum(share_bp), sum(amount_satang) into s_bp, s_amt
    from fee_allocation where fee_calculation_id = new.fee_calculation_id;
  select gross_fee_satang into gross
    from fee_calculation where id = new.fee_calculation_id;
  if s_bp <> 10000 then
    raise exception 'allocation shares must total 10000 bp, got %', s_bp;
  end if;
  if s_amt <> gross then
    raise exception 'allocation satang must total % , got %', gross, s_amt;
  end if;
  return new;
end $$ language plpgsql;
```

### 1.3 Five non-negotiable financial rules

| # | Rule | Why it is not optional |
|---|---|---|
| F1 | **All money is `BIGINT` satang.** No float, no double, no JS `number` for amounts. | An 8-figure THB commission exceeds `Number.MAX_SAFE_INTEGER` precision once you multiply by basis points. A rounding error at that scale is a lawsuit. |
| F2 | **Rates are basis points (`INT`), never decimals.** 0.1% = `10`. | `0.001` is not representable in binary floating point. `10` is exact. |
| F3 | **Rounding is declared once, applied once, at a named step.** Round half-up at the gross-fee line; allocations take the remainder to the largest share. | Undeclared rounding is how splits stop summing. |
| F4 | **The fee rule is snapshotted into the agreement.** Changing `fee_rules` later must not change a signed deal. | Retroactive repricing destroys the trust the whole platform sells. |
| F5 | **No fee row exists without a `closing_event` carrying `PROVENANCE_OK`.** | A fee claimed without evidence is a receivable you cannot collect and a claim you cannot defend. |

### 1.4 Fund routing — the regulatory line

> **Phase 1: the platform calculates, evidences, and invoices. It never holds or moves client funds.**

Holding or routing third-party money in Thailand implicates payment-services regulation and,
for transaction escrow, the escrow regime. Obtaining that permission is a multi-quarter legal
project, not a 90-day one. **Confirm scope with Thai counsel before any design that touches funds.**

The architecture that is both defensible and faster to launch:

```
closing_event (evidenced)
      │
      ▼
fee_calculation ──► fee_allocation ──► settlement_instruction (a DOCUMENT)
                                              │
                                              ▼
                              executed by a licensed third party
                              (bank transfer between principals,
                               law-firm client account, or licensed escrow)
                                              │
                                              ▼
                              settlement_record (bank ref + doc_hash)
                                              │
                                              ▼
                              reconciliation: instruction vs record
```

The platform's product is the **instruction and the proof**, not the custody. That is a feature:
it is what lets a counterparty accept the platform without underwriting its solvency.

### 1.5 Stakeholder transparency — one record, many lenses

Not separate databases per party. **One deal record, scoped projections.**

| Party | Sees terms | Sees counterparty PII | Sees fee calculation | Sees other allocations |
|---|---|---|---|---|
| Owner (seller) | ✅ | staged by deal state | ✅ if payer | own share only |
| Client (buyer) | ✅ | staged by deal state | ✅ if payer | own share only |
| Co-broker | ✅ | ❌ | ✅ gross + own share | own share only |
| Platform ops | ✅ | ✅ | ✅ | ✅ |
| Auditor role | ✅ | pseudonymised | ✅ | ✅ |

Every term change is an **append-only event** carrying `actor_id`, `occurred_at`, `prev_hash`.
Each party can export their own chain and verify it independently. A record that only the
platform can read is not transparency; it is a promise.

---

## 2 · Enterprise Asset Liquidity

### 2.1 The governing principle

> **An asset's liquidity is a function of its evidence completeness, not its price.**

A ฿200M building with a clean title, a current valuation and a signed mandate transacts.
The same building with a missing chanote copy does not transact at any price. The system must
therefore score **evidence**, and the score must be **arithmetic, not an AI opinion.**

### 2.2 Asset schema — one table, many classes

```sql
create table asset (
  id             uuid primary key,
  asset_class    text not null,   -- COMMERCIAL_RE | RESIDENTIAL_RE | LAND | VEHICLE_FLEET | EQUIPMENT
  title          text not null,
  owner_party_id uuid not null,
  mandate_id     uuid,            -- null = we have no right to market this
  asking_satang  bigint,
  currency       char(3) not null default 'THB',
  status         text not null,   -- DRAFT|MANDATED|LISTED|UNDER_OFFER|CLOSED|WITHDRAWN
  jurisdiction   text not null,
  created_at     timestamptz not null default now()
);

-- What evidence each class REQUIRES. Data, not code. Changing policy ≠ redeploying.
create table evidence_requirement (
  asset_class  text not null,
  kind         text not null,      -- TITLE_DEED | VALUATION | MANDATE | TAX_STATUS | INSURANCE
  weight_bp    int  not null,      -- contribution to liquidity score, sums to 10000 per class
  mandatory    boolean not null,
  primary key (asset_class, kind)
);

create table asset_evidence (
  id          uuid primary key,
  asset_id    uuid not null references asset(id),
  kind        text not null,
  doc_hash    text not null,
  issued_by   text not null,
  issued_at   date not null,
  expires_at  date,                -- a valuation has a shelf life
  state       text not null,       -- STAGED|PENDING_QA|PROVENANCE_OK|EXPIRED|MISSING
  verified_by uuid,
  unique (asset_id, kind)
);
```

### 2.3 Liquidity score — deterministic, not inferred

```
liquidity_bp(asset) =
    Σ over evidence_requirement(asset.asset_class):
        weight_bp  if  matching asset_evidence.state = 'PROVENANCE_OK'
                   and (expires_at is null or expires_at >= today)
        else 0

MARKETABLE   iff  every mandatory requirement is PROVENANCE_OK and unexpired
LISTABLE     iff  MARKETABLE and mandate_id is not null
```

| Tier | `liquidity_bp` | Meaning | Commercial action |
|---|---|---|---|
| **A** | 9000–10000 | Transactable today | Full marketing; premium fee defensible |
| **B** | 7000–8999 | One gap from ready | Named gap + owner deadline |
| **C** | 4000–6999 | Evidence project | Chargeable readiness engagement |
| **D** | < 4000 | Not marketable | **Do not list.** Listing it burns the bridge's credibility |

Tier D is the discipline that makes tier A worth paying for. A bridge that lists everything is
a portal; a bridge that refuses is an underwriter.

### 2.4 Where AI is allowed, and where it is not

| Operation | Engine | Rule |
|---|---|---|
| Requirement → asset matching | **AI proposes** | Ranked candidates with stated reasons; a human accepts |
| Buyer-intent extraction from free text | **AI proposes** | Original text retained verbatim beside the extraction |
| Comparable-asset retrieval | **AI proposes** | Every comparable cites a source record |
| Draft marketing copy | **AI proposes** | Enters the existing DRAFT_PENDING_REVIEW gate |
| Ops summary for the dashboard | **AI proposes** | Labelled machine-produced; links to source rows |
| **Liquidity score** | **Deterministic** | Arithmetic over evidence. AI may never move it. |
| **Fee calculation** | **Deterministic** | Pure function, reproducible, versioned |
| **State transitions** | **Deterministic** | `actor_id` required on every one |
| **Evidence verification** | **Human** | A person attests; the system records who |
| **Availability / confirmation** | **Deterministic + human** | Never inferred. See §4 Day 0. |

**Structural enforcement, not instructional:** the AI path holds no credential that can write
state. A prompt instructing a model not to write is not a control; an absent write capability is.

---

## 3 · The Transparent Bridge — monetizing trust

### 3.1 What "algorithmic truth" can and cannot mean

An algorithm cannot make a claim true by asserting it. What it can do is make a claim
**independently checkable**. That is the product, and it rests on exactly three properties:

| Property | Definition | Test that proves it |
|---|---|---|
| **Determinism** | Same inputs → identical output, always | Any party re-runs the calculator on the published inputs and gets the same satang |
| **Provenance** | Every input traces to a document with a hash and an issuer | Click any number; reach the document it came from |
| **Non-repudiation** | Neither side — including the platform — can alter what was agreed | Both parties hold the signed hash; the chain is append-only |

If a party cannot independently reproduce the number, it is not truth. It is our word.

### 3.2 The asset that actually earns the premium

Introductions, listings and dashboards are commodities. **The non-repudiable introduction record
is not.**

```sql
create table introduction (
  id             uuid primary key,
  introducer_id  uuid not null,
  counterparty_id uuid not null,
  asset_id       uuid,
  occurred_at    timestamptz not null default now(),
  channel        text not null,
  evidence_hash  text not null,   -- hash of the introduction artefact
  prev_hash      text,            -- chains to the previous introduction record
  expires_at     date not null    -- introduction priority is not perpetual
);
```

In Thai commercial property, deals die from four causes: unclear title, undisclosed co-brokers,
commission disputes, and **"who introduced whom first."** The evidence schema addresses the
first; the allocation schema with its exactness constraint addresses the second and third; this
table addresses the fourth. A timestamped, hashed, chained introduction record is the single
artefact the market has no good substitute for — and it is the reason a principal will accept a
higher fee from this bridge than from an unstructured broker.

### 3.3 Revenue model — **parametric structure, not a forecast**

> The rates and volumes below are **input slots**, not market research. I have no verified
> Thai market data and will not invent any. Populate them from the Owner's own signed mandates
> and closed comparables; until then, treat every figure as a placeholder.

| Line | Basis | Trigger | Recognises revenue? | Status |
|---|---|---|---|---|
| **Success fee** | `TRANSACTION_VALUE × rate_bp` | `closing_event` PROVENANCE_OK | **Yes — the only line that does** | `rate_bp` and `payer` **UNDECIDED** |
| **Rental placement fee** | `ANNUAL_RENT` or `MONTHLY_RENT × n` | Lease executed | Yes | Undecided |
| **Evidence readiness engagement** | `FIXED` | Signed engagement, paid in advance | Yes | Designable today — needs no closing |
| **Mandate retainer** | `FIXED` per period | Exclusive mandate signed | Yes | Designable today |
| **Co-broker platform share** | `share_bp` of gross fee | Same closing event | Yes | Depends on success fee |
| Introduction priority registration | `FIXED` | Registration | Yes | Optional; low value alone |

**Note the two lines that need no closing.** Evidence-readiness and mandate retainer generate
cash before any transaction completes. For a business at ฿0 revenue on day 35, these are the
fastest legitimate cash lines available, and they are chargeable for work already being done.

### 3.4 The recognition discipline already in the codebase

`Property Pulse / src/lib/content-os.ts` already encodes the correct model:

```
R0_CHANNEL_CLICK   countsAsRevenue: false   "A channel click is not a Qualified Lead"
R1_SUBMISSION      countsAsRevenue: false   "A submission is not a Qualified Lead"
R2_QUALIFIED_LEAD  countsAsRevenue: false   "A Qualified Lead is not a Viewing Request"
R3_VIEWING_REQUEST countsAsRevenue: false   "A Viewing Request is not a Confirmed Viewing"
R4_CONFIRMED_VIEW  countsAsRevenue: false   "A Confirmed Viewing is not an Offer"
R5_OFFER           countsAsRevenue: false   "An Offer is not recognised revenue"
R6_CLOSED          countsAsRevenue: TRUE    the only revenue-recognising stage
```

**Do not weaken this to make a dashboard look better.** It is the single most valuable financial
control already built, and it is what will stop this business from reporting a pipeline as income.

---

## 4 · 90-Day Capital Velocity Roadmap

### The constraint, stated plainly

Thirty-five days elapsed. ฿0 revenue. Zero published pages. Three PRs green and unmerged. The
bottleneck is **not engineering capacity** — it is that no deal has been attempted end to end.

> **The fastest path to first revenue is not more software. It is one closed deal with the
> system as the system of record.** Software's job is to make deal #2 through #50 cheaper.
> It cannot make deal #1 happen.

### Phase 0 — Days 0–7 · Stop the leak, unblock the engine

| Day | Action | Owner | Exit test |
|---|---|---|---|
| 0 | **Middle Property Views**: disable the booking button, or unpublish. It currently displays a booking confirmation while the form data is discarded. | Owner decision | No public surface claims a confirmation it cannot honour |
| 1 | **Decide `basis` + `payer`.** One sentence. Insert the first `fee_rules` row and set `status = ACTIVE`. | Owner | `select count(*) from fee_rules where status='ACTIVE'` returns ≥ 1 |
| 2 | Merge PR #5 / #6 / #8 | Owner | main carries the governance and contract work |
| 3 | Confirm fund-routing scope with Thai counsel: calculate-and-invoice only, no custody | Owner + counsel | Written scope note on file |
| 5 | Draft the one-page fee agreement that `agreement_hash` will hash | Owner + counsel | Template exists and is signable |
| 7 | Close `SRC-WEB-003` (15-minute rendering check) | Anyone with a terminal | Nine finished SEO packages stop being blocked |

**Phase 0 delivers no code and is the highest-value week in this memo.**

### Phase 1 — Days 8–30 · One deal, manually, with the system as the record

Deliberately manual. The purpose is to **observe** the real transaction so automation targets
reality rather than assumption.

| Milestone | Deliverable | Cash effect |
|---|---|---|
| D8–12 | Identify 3 mandate candidates from existing relationships | — |
| D12–18 | Sign **one exclusive mandate**; run the evidence checklist by hand | **Retainer invoiceable** |
| D18–25 | Score the asset by hand using §2.3; close gaps to Tier A/B | **Readiness engagement invoiceable** |
| D25–30 | First introduction recorded with hash and timestamp — by hand if necessary | Introduction priority established |

**Exit test:** one signed mandate, one asset at Tier A or B, one recorded introduction, and
**the first invoice issued.** Not a closed sale — an invoice.

### Phase 2 — Days 31–60 · Automate exactly what was observed

| Build | Scope | Why now and not earlier |
|---|---|---|
| `fee_agreement` + `fee_calculation` + `fee_allocation` + the exactness trigger | Codex | The fee rule is now decided and one real agreement exists to model |
| `asset` + `evidence_requirement` + `asset_evidence` + liquidity scoring | Codex | The checklist was run by hand in Phase 1; now encode it |
| `event_outbox` + relay + dead-letter (per `PORTFOLIO-ARCHITECTURE-REVIEW.md` §4) | Codex | Nothing durable can be built on the current dual-write path |
| Consent ledger + `handoff_authorized` (review §5) | Codex + Lovable | Prerequisite for any real lead volume |
| Deal-room UI, party-scoped projections | Lovable | Contract exists to render |

**Exit test:** a fee calculation reproduced from stored inputs matches the Phase 1 hand
calculation to the satang.

### Phase 3 — Days 61–90 · Prove the unit economics

| Metric | Definition | Target shape |
|---|---|---|
| **Capital velocity** | Days from first contact → invoice issued | Deal 2 < Deal 1 |
| **Cost to close** | Operator hours × rate, per closed deal | Deal 3 < Deal 2 |
| **Evidence lead time** | Days from mandate → Tier A | Falling |
| **Reconciliation exceptions** | Instructions with no matching settlement record | **Zero.** Any non-zero is a stop-work item |
| **Recognised revenue** | Sum at `R6_CLOSED` only | The only number reported as income |

**Exit test at Day 90:** deals 2 and 3 run on the system at lower marginal cost than deal 1, and
every satang of recognised revenue traces to a `closing_event` with `PROVENANCE_OK`.

---

## 5 · Decisions required from the Owner

| # | Decision | Blocks | Cost to decide |
|---|---|---|---|
| **D1** | **`fee_rules.basis` and `fee_rules.payer`** | **The entire revenue system** | One sentence |
| D2 | Middle Property Views: disable button, fix copy, or unpublish | A live false confirmation | One word |
| D3 | Confirm no-custody scope with counsel | Every settlement design | One consultation |
| D4 | Retainer and readiness-engagement pricing | The two pre-closing cash lines | One afternoon |
| D5 | Accept review §3 (Property Pulse as read model) | Whether to enable its database | One line |

**D1 is the memo.** Everything else is execution.

---

## 6 · What this memo does not claim

- **No market data.** No commission benchmark, deal volume, asset value or conversion rate here
  is verified. Every figure in §3.3 is a parameter slot awaiting the Owner's own comparables.
- **No legal opinion.** The regulatory statements in §1.4 are flags for counsel, not advice.
- **No forecast.** This is an architecture for capturing revenue, not a projection of revenue.
- **Nothing executed.** No funds moved, no system modified, no database enabled, no deployment,
  no publication, no customer contacted.
