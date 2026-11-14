# ADR-0016 — Contracts package: how ARCH-003 reads the blueprint

Status: proposed; owner review pending.
Date: 2026-11-14

## Context

ARCH-003 asks for zod DTO schemas, the canonical error codes, the event registry and an OpenAPI generator in `packages/contracts`. Blueprint §18 is normative, and it is uneven: it writes some shapes out in full, names others without showing them, and leaves a few out. Later tasks list no contract files of their own, and the UI track builds against these contracts from week 0, so this task covers all of §18. The readings below go beyond the text and are recorded here.

## Decision

### 1. Three kinds of shape

Every endpoint of §18 is in the route table: 104 routes. Each shape falls into one of three groups, and the code says which.

- **As shown.** The shape is copied from the blueprint: the error envelope, `UserDTO`, the OTP and upload bodies, `PropertyPublicDTO`, `RequirementDTO`, the match feed and explanation, `DealDTO`, the offer, close and cancel bodies, the fee response, the AI envelope and its task results, and the insights response.
- **Derived.** §18 names the DTO and does not show it. It is built from the §8 table of the same entity, taking a cautious subset of columns and leaving out storage paths, hashes, encrypted values and internal ids.
  - Identity and documents: `ProfileDTO`, `SessionDTO`, `VerificationDTO`, `DocumentDTO`.
  - Listings and demand: `PropertySummaryDTO`, `PropertyMediaDTO`, `RequirementSummaryDTO`, `MatchDTO` and the match list item.
  - Deals and money: `ViewingDTO`, `OfferDTO`, `AgreementDTO`, `MessageDTO`, `DealSummaryDTO`, `PaymentDTO`, `ReceiptDTO`.
  - Lookups and operations: `LocationDTO`, `StationDTO`, `AmenityDTO`, `NotificationDTO`, the notification preferences and `QueueItemDTO`.
- **Left open.** The blueprint gives a name and neither a shape nor a table to derive one from. These stay "any JSON object" or untyped until the task that owns them:
  - the `PATCH` bodies of listings and requirements ("any subset of wizard fields");
  - `payload` of the transition endpoint, whose content depends on the pair of states (§11.2) and belongs to the state machine;
  - `TimelineItem`, `response_stats`, the members of an insight panel beyond `code`, and the values of the health response;
  - the shadow report, the reconciliation members, audit rows and the fee-rule body;
  - `POST /api/ai/requirement-summary`, which screen 18 uses (§18.12) and §18.9 does not define.

Where §18 writes a bare `→ 200`, the route has no response schema: 28 routes.

The task that implements an endpoint confirms or changes its derived and open shapes. Client and server import the same schema, so such a change breaks the build on both sides, as the blueprint intends.

### 2. Wire conventions

- **Ids** are opaque strings with a type prefix. §18 shows 13 prefixes (`usr`, `prp`, `req`, `mch`, `drm`, `del`, `doc`, `fee`, `inv`, `air`, `ch`, `slt`, `loc`). The contract accepts the prefix, an underscore and 1–64 URL-safe characters. How that part encodes the database UUID is not decided here. An id with no prefix in the blueprint is a bounded opaque string.
  - §18 uses `req_` both for requirement ids and for request ids, so `request_id` is a plain bounded string.
- **Money** is a JSON integer of satang, zero or more, with `currency` fixed to `THB`. "String-safe integer" is read as "an integer every JSON client reads exactly", so amounts stop at 2^53 − 1 satang, about ฿90 trillion. `toWireAmount` and `fromWireAmount` convert to and from core's `bigint`; a float is rejected everywhere.
- **Time** is RFC 3339 in UTC ending in `Z`; a date without time is `YYYY-MM-DD`.
- **Verification tier** on the wire is `T0`–`T4`, as §8 and §18.1 write it. Core uses the names of §3.3 (ADR-0015). The two map one to one, and the mapping belongs where the actor context is resolved (AUTH-002).
- **Pagination**: `limit` is 1–100 and `cursor` is opaque. The upper bound is the contract's own.
- **Unknown members** are stripped by the schemas on both sides (§15.3), and the OpenAPI document is rendered to say the same. Offer terms and insight panels keep unknown members, because their content varies by case.
- **Text bounds** on input are 120, 500 and 5,000 characters. §15.3 requires bounds and gives no numbers; these are the contract's own.
- **Nullable members**: where a draft or an optional column can leave a value out, the member is nullable. A public listing still requires its area, approximate position and publication date.
- **Optional members**: a few members are optional although an example shows them.
  - `ai_run_id` on publish: with AI switched off there is no run to cite.
  - `evidence_document_id` on close and `note` on a viewing request: §11.2 marks both optional.
  - `payload` and `reason` on a transition, `attachments` on a message and `comment` on AI feedback: their examples show them empty or null.
- Three names are inferred. `sale_amount` follows the pattern of `rent_monthly_amount`. The bands `STRONG`, `FAIR` and `COMPROMISE` follow the labels of §9.6; only `EXCEPTIONAL` appears in §18. The source of a match explanation uses `RULE` or `AI` from §8, with `RULE` for the template fallback.

### 3. Errors

- The 12 canonical codes carry the statuses of §18.0. Four more codes that §18 uses on single endpoints are in the catalogue: `OTP_INVALID` 422, `PROPERTY_INCOMPLETE` 422, `SUPER_MATCH_QUOTA_EXCEEDED` 429 and `CLOSE_VALUE_MISMATCH` 409.
- Members that §18 shows for one code sit inside `error`, beside `code`: `allowed_from_here`, `resets_at` and `escalated_to_support`.
- The package fixes the shape and the status of each code. It holds no message text and no default for `retryable`; the caller supplies both.
- `IDEMPOTENT_REPLAY` (200) is in the catalogue and is not an error response. The blueprint does not say how a replay is signalled.
- The codes a route can return follow from rules:
  - every route: `RATE_LIMITED` and `INTERNAL`;
  - a route that needs a session: `UNAUTHENTICATED`, `FORBIDDEN` and `TIER_INSUFFICIENT`;
  - a path with an id: `NOT_FOUND`;
  - a body or a query: `VALIDATION_FAILED`;
  - `If-Match`: `CONFLICT_VERSION`;
  - plus the codes §18 names for that endpoint.

### 4. Events

- The registry is the taxonomy of §16.3 (68 names) and nine more. The screen register (§5.2) gives these nine as a screen's primary event, and §16.3 does not list them: `dashboard_viewed`, `ai_review_viewed`, `ai_extraction_used`, `property_detail_viewed`, `match_inbox_viewed`, `ai_deal_summary_viewed`, `deal_timeline_viewed`, `fee_viewed` and `trust_center_viewed`.
- The blueprint names each event's props. Their types are this contract's reading.
  - A props object is strict: a prop that is not registered is rejected.
  - A string prop is a code, a key or a bucket label, never free text.
  - A bucket is one bound or one range of short numbers, such as `45k-60k`, so a raw amount or a phone number does not fit.
  - `interest_expressed` also accepts `score` and `position_in_deck`, which the example in §16.2 carries.
- `trackEvent(name, props)` builds a validated event. An unregistered name, a missing prop and an unknown prop are TypeScript errors. The sink that sends or stores the event comes with the analytics work.

### 5. Routes and the OpenAPI document

- `src/routes.ts` is not in the task's file list. The generator needs a route table, and contract tests will read the same table.
- `Idempotency-Key` is required on 19 routes. "Offers, transitions and payments" (§18.0) is read to include every endpoint that moves the deal state machine: interest, viewings, agreement, close, cancel and the admin force-transition. Other mutating routes accept the header.
- Three routes need no session: the two OTP routes and the health check. Everything else needs the session cookie, and `/admin/api` needs an admin role.
- The document is OpenAPI 3.1, built with zod's own JSON Schema output, and is committed as `packages/contracts/openapi.json`. Only schemas that a route reaches are in it.
- `pnpm contracts:openapi` writes the file. §21.2 names `pnpm contracts:check` without defining it; here it fails when the committed file is out of date or when `redocly lint` finds a problem under the strict rule set.
  - Two findings are excused by name: the invoice and receipt PDF routes answer `302` and so have no 2xx response (§18.8).
  - The `info-license` rule is off: the repository declares no licence, and the generator does not choose one.

## Enforcement

- 143 tests run in `pnpm test:contracts`, and tests are type-checked.
  - Each example payload of the blueprint must parse and come back with every member, so a member the schema forgot fails the comparison.
  - The route table is compared with every `METHOD /path` in the text of `docs/04-api-contracts.md`.
  - The error catalogue and the event registry are compared with lists written out in the tests.
  - Parsing a private listing with the public schema must remove every private value.
  - The committed OpenAPI file must equal the generator's output and pass the linter.
- 71 of 71 hand-made faults in the package are caught by these tests or by the type-checker.
- The foundation workflow gains `pnpm test:contracts` and `pnpm contracts:check`.

## Consequences

- `packages/contracts` now has one runtime dependency, zod. Importing the package root loads every schema; the sub-paths `/dto`, `/errors`, `/events`, `/routes` and `/openapi` allow narrower imports.
- Core's `DomainError` codes are not narrowed to the catalogue yet, and `Role` and the tier keep two vocabularies until AUTH-002. ADR-0015 left both to this task; they are left as they are so that ARCH-003 does not change the merged kernel.
- Nothing here defines a fee rule, rate, basis or payer. `FeeDTO` only carries what the fee engine will compute from a published rule.
