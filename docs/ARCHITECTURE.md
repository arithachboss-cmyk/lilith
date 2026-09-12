# LILITH by THE MIDDLE — architecture

## Specification and repository audit

2026-09-08: the repository contains an existing vinext App Router / React application, strict TypeScript, Drizzle migrations, Cloudflare D1, private R2 photos, and Sites dispatcher authentication. Existing lead and tiered agent workflows have integration tests. No independent Claude Architecture Blueprint, matching architecture, Prisma schema, or CI workflow was found. The user-provided requirements are the provisional specification; the missing Blueprint must be reconciled before commercial release.

The first execution batch delivers the explicitly requested first vertical slice. It does not represent completion of all 38 screens or all later deal stages.

## Layers

```text
App Router screens / reusable React components
  → validated API routes (Zod + consistent errors)
  → application services (identity, ownership, orchestration)
  → pure domain (matching, money, deal transition rules)
  → D1 transactional persistence + audit + event outbox
```

- `src/domain/`: framework-independent rules. Monetary amounts are decimal strings externally and BigInt minor units internally.
- `src/services/platform/`: server-only D1 binding, identity, authorization, inventory, matching and deal use cases. Never import service implementations into client components; type-only record imports are erased.
- `app/api/`: HTTP validation and typed service invocation. Browser mutations require the exact same Origin and bounded JSON bodies.
- `src/components/middle/`: reusable form fields, PropertyCard, role selection, inventory form, matching surfaces, and DealRoom.
- `app/middle/[[...segments]]/page.tsx`: shared screen routing, signed-in shell and real Sites sign-in entry point.
- `db/platform-schema.ts`: additive `mp_*` domain tables. Existing leads and `agent_*` tables remain separate.

## ADR-001 — Retain the deployed storage and framework

**Decision:** retain vinext/React App Router, Drizzle, D1 and R2 instead of replacing the repository with Next.js/PostgreSQL/Prisma. The requested default stack applies only when a repository has not locked its stack.

**Reason:** the deployed Worker and existing data depend on these bindings. Replacing them in a matching feature batch would introduce migration and hosting risk. This is a repository-preserving implementation decision, not a change to matching or fee business rules.

**Consequence:** D1 batches provide transactions; SQL compare-and-swap replaces interactive ORM transactions. A future PostgreSQL repository adapter can retain the pure domain and service contracts. Do not claim current vinext beta is production-hardened merely because builds pass.

## ADR-002 — Reuse trusted Sites sign-in

Use dispatcher-owned ChatGPT sign-in, session management and validated identity headers. Persist roles by stable Sites user ID. Public signup can select OWNER, AGENT, or CLIENT once; ADMIN and OPERATOR are reserved. Do not expose the Worker through an ingress that allows clients to forge identity headers.

Existing lead management was previously open to every signed-in identity. It now requires the configured `LILITH_ADMIN_EMAIL`; token-based import retains its existing contract. This is necessary when onboarding new matching users.

OTP, passwords, public identity providers, role switching and organization permissions are not implemented. They are not emulated.

## ADR-003 — Atomic mutual consent on D1

One interest batch writes the current side's decision, conditional state changes, a unique room, exactly two ownership-derived participants, audit records, domain events, and notifications. Conditional room insertion joins the actual distinct property and requirement owners with positive interests and passing hard constraints. Repeated requests cannot create additional rooms.

Viewing/transition commands use `state + version` compare-and-swap and a new operation ID. All dependent writes select the same successful operation ID. A failed CAS produces no child records and returns 409. Viewing and message retries use actor-scoped request IDs; changed payloads conflict.

[Cloudflare documents transactional D1 batches](https://developers.cloudflare.com/d1/worker-api/d1-database/#batch): a failing statement rolls back the whole batch. Tests inject failures midway to verify that contract.

## ADR-004 — Conservative business assumptions

- RENT prices/budgets mean monthly THB; SALE means total THB. No currency conversion is inferred.
- Property type, transaction type and currency are hard constraints. Budget and location can be hard; bedrooms and facilities are weighted preferences.
- Locations are normalized exact district labels, not geospatial radii.
- Super Match is a stronger interest signal; it changes neither consent nor score and has no charge.
- A positive interest from both parties creates the room immediately. After mutual consent, PASS is rejected; cancellation is a recorded terminal transition.
- First-batch properties publish on explicit form submission without a verification claim. Inventory is immutable through these APIs. Editing/archiving requires versioning and score/snapshot rules in a later batch.
- Scores and weights are immutable snapshots. New weight configuration affects new pairs only; explicit rescoring/versioning is future work.
- Requirement titles are intentionally non-identifying. Free-text client details are never returned to the property owner; agents access only requirements they created. No automatic access to other agents' clients is implied.
- The full state graph is modeled, but only implemented workflows are exposed by APIs. Offer/signing/closing cannot be forced through an arbitrary transition endpoint.

## Boundaries and scaling

Generation processes at most eight candidate pairs per call and returns a continuation cursor. UI lists are paginated. Candidate SQL filters transaction/type before scoring. Cursor pagination uses offsets; concurrent inventory changes may require a rescan. No background worker or external queue is claimed. Domain events are durable local outbox records; external event delivery is not implemented.

Source tests use the compiled Worker with actual SQLite and transaction semantics. Browser tests inject test identities into a loopback-only ingress; they do not exercise production Sites login/session revocation. Test data is clearly labelled and isolated in temporary databases. No demo data is seeded into the application.
