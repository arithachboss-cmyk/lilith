# ACS Online Business ERP — internal mock prototype

**MOCK DATA · INTERNAL PROTOTYPE — NOT FOR PRODUCTION USE**

An owner-only ERP prototype over deterministic synthetic fixtures. It runs
locally and does nothing else: no deploy, no publish, no DNS or CDN change, no
analytics, no provider connection, no credential, no external API call, no
email, no lead, no payment, and no real ACS data of any kind.

## What is here

| Module | Route |
|---|---|
| Product & Evidence Registry | `/admin/erp-mock/product_evidence_registry` |
| Purchasing & Supplier | `/admin/erp-mock/purchasing_supplier` |
| Inventory | `/admin/erp-mock/inventory` |
| Pricing | `/admin/erp-mock/pricing` |
| Sales & CRM | `/admin/erp-mock/sales_crm` |
| Finance Documents | `/admin/erp-mock/finance_documents` |
| Fulfillment & Technical Review | `/admin/erp-mock/fulfillment_technical_review` |
| Executive Dashboard | `/admin/erp-mock/executive_dashboard` |

Plus `/admin/erp-mock/permissions` (the enforced matrix), `/admin/erp-mock/workflow`
(the required synthetic workflow, executed live) and `/admin/erp-mock/audit`.

## Run it

```bash
node acs-erp/tests/run.mjs          # 298 assertions
node acs-erp/tools/run-workflow.mjs # the workflow, in the terminal
node acs-erp/src/server/server.mjs  # local console on 127.0.0.1:4180
```

No dependency is installed and no lockfile changes: the prototype is plain ESM
on the Node standard library. It sits outside the `apps/*` and `packages/*`
workspace globs, so the LILITH build, typecheck, lint and boundary tests are
untouched.

Sign in with a fixture token:

```bash
curl -s -H 'Authorization: Bearer mock-token-manager' \
  http://127.0.0.1:4180/admin/erp-mock
```

| Role | Actor | Token |
|---|---|---|
| Chairman | `ACTOR-0001` | `mock-token-chairman` |
| Manager | `ACTOR-0002` | `mock-token-manager` |
| Account | `ACTOR-0003` | `mock-token-account` |
| Stock | `ACTOR-0004` | `mock-token-stock` |
| Sales | `ACTOR-0005` | `mock-token-sales` |
| Technic | `ACTOR-0006` | `mock-token-technic` |
| *(no console access)* | `ACTOR-0007` | `mock-token-no-console` |

These are fixture strings in a local prototype, not secrets and not credentials.

## Access control

The session is resolved server-side before any ERP work happens. An
unauthenticated request, or one carrying an unknown token, is answered `404`
with a bare body — no module name, no fixture value, nothing that says an ERP
exists here. A known actor without console access gets `403`. Only `GET` and
`HEAD` are served; there is no mutating endpoint, no form target, no public API.

Every response carries `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet`
and every document repeats it for both `robots` and `googlebot`. The route is in
no sitemap, and a test asserts that across the whole repository.

Hiding a control in the UI is never the enforcement point: every procedure calls
the permission guard itself, and the tests call the procedures directly with the
wrong role to prove it.

## Permission matrix

| Role | view | create | edit | approve | export | technical review |
|---|---|---|---|---|---|---|
| Chairman | ✅ | ❌ | ❌ | ⏸ | ⏸ | ❌ |
| Manager | ✅ | ✅ | ✅ | ⏸ | ⏸ | ❌ |
| Account | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Stock | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Sales | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Technic | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |

⏸ is `OWNER_DECISION_PENDING`, and it is deliberately not the same as ❌. The
owner has not supplied an approval policy, so the approval **actor**, **limit**
and **sequence** are unknown and every approval-required transition stops rather
than defaulting either way. ❌ is a standing denial: no role acquires commercial
approval or export by implication. `technical_review` exists only on the module
that owns it.

## Evidence-first gates

Every SKU tracks five states independently:

`claim_source_status` · `sale_authorization_status` · `price_status` ·
`stock_status` · `warranty_status`

An evidence record closes **exactly one** of them. A technical datasheet proves
a specification and nothing else — it is not evidence that ACS may sell the
item, holds stock, has a price, offers a warranty, can deliver, or is an
authorised partner. Delivery availability and partner authorisation are not
tracked fields at all: they are standalone assertions that need their own record,
and the fixtures never supply one, so they answer `BLOCKED_EVIDENCE_MISSING`
even for a SKU whose five tracks are all closed.

Where evidence is absent the answer is `BLOCKED_EVIDENCE_MISSING`. Nothing is
invented to fill the hole, and the inventory and pricing views withhold the
number rather than printing a zero.

## Providers

`LOCAL_MOCK` only. The other entries are interface declarations for future
platforms: disabled, unapproved, no SDK, no token, no browser automation. A
request for one returns `BLOCKED_SOURCE_UNAVAILABLE` with `external_calls: 0`
and `fallback_attempted: false` — a blocked source stays blocked rather than
silently reaching for another. A test stubs `globalThis.fetch` to throw and
asserts it is never reached.

## The required workflow

```
add mock product → attach synthetic evidence placeholder → Technic checks
specification → Stock checks mock quantity → Account checks mock cost → Sales
drafts quotation → Manager/Chairman approval path → create mock order → mock
fulfillment → dashboard update and append-only audit record
```

Under the runtime policy the run **halts at the approval path** with
`OWNER_DECISION_PENDING`, both approving roles are attempted and recorded, and
the later steps are marked `NOT_ATTEMPTED`. That halt is the expected result.

To prove the downstream steps are implemented rather than merely declared, the
test suite injects `tests/fixture-policy.mjs`, which is labelled
`FIXTURE_ONLY_NOT_AN_OWNER_POLICY` and is **not** an owner decision. It lives
under `tests/` and a test asserts that nothing under `src/` imports it, so the
server can never load it. See `docs/adr/ADR-0014`.

## Audit

Append-only and hash-chained. Refusals are recorded as well as successes, the
returned list is a copy, entries are frozen, and `verifyChain()` reports the
sequence number of the first broken link. The clock is deterministic, so two
identical runs produce the same audit head — which a test asserts.

## What this prototype does not decide

- who may approve, up to what limit, in what sequence — `OWNER_DECISION_PENDING`
- whether any of these modules becomes a LILITH `apps/*` workspace
- anything about the public ACS site, which is not in this repository
