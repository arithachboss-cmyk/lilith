# ADR-0014 — Ratify `middle_success_fee` as the active fee rule

Status: accepted
Date: 2026-09-25
Decided by: ACS Owner
Supersedes: nothing. Resolves the open question recorded as **D1**.

## Context

`docs/02-matching-ai-deal-fee.md` §13.2 has carried a complete fee rule since the Blueprint was
imported, written with `"status": "ACTIVE"`:

```json
{ "code": "middle_success_fee", "version": 1, "status": "ACTIVE",
  "applies_to": { "transaction_type": ["SALE","RENT","RENT_TO_OWN","INVEST"] },
  "basis": "TRANSACTION_VALUE",
  "rate_bp": 10,
  "min_amount": 0, "max_amount": null,
  "payer": "OWNER",
  "vat_rate_bp": 700,
  "effective_from": "2026-01-01" }
```

Three things left it unsettled in practice:

1. It has never been implemented. No `fee_rules` table exists anywhere; the domain packages are
   empty stubs and there are no migrations (`docs/IMPLEMENTATION_STATUS.md`).
2. The Owner had not confirmed it in the current round of work, so `docs/CAPITAL-CAPTURE-MASTERPLAN.md`
   §0 recorded `basis` and `payer` as an open decision blocking the revenue system.
3. A later document, the externally supplied Transparent Bridge blueprint, used a worked example of
   ฿17,800,000 on ฿280,000,000 — **6.36%**, or 63.6× this rule — which an implementer could
   reasonably have read as the specification
   (`docs/REVIEW-TRANSPARENT-BRIDGE-BLUEPRINT.md` §2.2).

The question put to the Owner was deliberately narrow: does this rule stand as written, or does
something supersede it?

## Decision

**The `middle_success_fee` seed rule stands as written.**

- `basis` = `TRANSACTION_VALUE`
- `payer` = `OWNER`
- `rate_bp` = `10` (0.1%)
- `vat_rate_bp` = `700` (7%)
- `min_amount` = 0, `max_amount` = null
- `applies_to.transaction_type` = `SALE`, `RENT`, `RENT_TO_OWN`, `INVEST`
- `effective_from` = `2026-01-01`

**The 6.36% figure in the Transparent Bridge blueprint is superseded and must not be used.** It was
never sourced. Any document repeating it is to be corrected, not reconciled.

## Consequences

### What this unblocks

The fee engine can be specified and built end to end. `fee_rules` now has a definite first row to
hold, `fees` has a definite snapshot to store, and the calculation in `docs/02` §13.3 is the
reference implementation. `docs/07-codex-handoff.md` DB-008 and FEE-003/004 are no longer blocked
on a decision.

### What this does not do

It does not create revenue, and it does not build anything. There is still no table, no migration
and no handler. Ratifying the rule removes a decision, not the work.

### A gap this decision exposes — raised, not resolved here

`basis: TRANSACTION_VALUE` applies to all four transaction types, including `RENT`. On a rental the
arithmetic is:

| Deal | Basis amount | Fee at 10 bp |
|---|---|---|
| Sale at ฿12,500,000 | ฿12,500,000 | **฿12,500** |
| Rental at ฿35,000/month | ฿420,000 annualised | **฿420** |

฿420 for placing a tenant is very unlikely to cover the cost of the work. The enum already contains
`ANNUAL_RENT` and `MONTHLY_RENT` as separate bases, which suggests rentals were expected to price
differently — most rental agency practice in this market charges a multiple of monthly rent rather
than a percentage of it.

This is **not** a reason to delay the decision above, and the rule is recorded as ratified. It is a
separate question for the Owner: whether to add a `version: 2` rule (or a second rule code) whose
`applies_to` covers `RENT` on an `ANNUAL_RENT` or `MONTHLY_RENT` basis. Under the versioning
approach already specified in `docs/02` §13.2, adding one does not disturb this rule or any fee
already computed under it, because `fees` carries `fee_rule_snapshot`.

Until that question is answered, the honest position is: **the fee model is settled for sales and
under-priced for rentals.**

### Unchanged by this decision

Withholding tax treatment remains unspecified (`wht_rate_bp` has no value). The platform still does
not hold or route client funds (`docs/CAPITAL-CAPTURE-MASTERPLAN.md` §1.4). Revenue is still
recognised only at `R6_CLOSED`.
