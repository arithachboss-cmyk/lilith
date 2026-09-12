# Execution batch 1 — LILITH by THE MIDDLE

Date: 2026-09-08. Scope: first end-to-end matching/viewing slice and its supporting domain foundation.

READY_FOR_REVIEW: true (this batch only).
PRODUCTION_READY: false.

## FILES_CHANGED

76 authored/updated files:

- .env.example
- .github/workflows/quality.yml
- .gitignore
- README.md
- app/api/analytics/route.ts
- app/api/deals/[id]/messages/route.ts
- app/api/deals/[id]/route.ts
- app/api/deals/[id]/timeline/route.ts
- app/api/deals/[id]/transitions/route.ts
- app/api/deals/[id]/viewings/route.ts
- app/api/deals/route.ts
- app/api/discover/route.ts
- app/api/leads/auth.ts
- app/api/matches/[id]/interests/route.ts
- app/api/matches/[id]/view/route.ts
- app/api/matches/generate/route.ts
- app/api/matches/route.ts
- app/api/notifications/route.ts
- app/api/profile/route.ts
- app/api/properties/[id]/route.ts
- app/api/properties/route.ts
- app/api/requirements/[id]/route.ts
- app/api/requirements/route.ts
- app/globals.css
- app/middle/[[...segments]]/page.tsx
- app/page.tsx
- db/platform-schema.ts
- db/schema.ts
- docs/AI_LILITH.md
- docs/API.md
- docs/ARCHITECTURE.md
- docs/BATCH_1_REPORT.md
- docs/DEAL_STATE_MACHINE.md
- docs/DOMAIN_MODEL.md
- docs/EVENT_SCHEMA.md
- docs/IMPLEMENTATION_STATUS.md
- docs/MATCHING_ENGINE.md
- docs/SECURITY.md
- drizzle/0007_lame_microbe.sql
- drizzle/meta/0007_snapshot.json
- drizzle/meta/_journal.json
- env.d.ts
- package.json
- playwright.config.ts
- pnpm-lock.yaml
- src/components/middle/api.ts
- src/components/middle/deal-room.tsx
- src/components/middle/forms.tsx
- src/components/middle/primitives.tsx
- src/components/middle/property-card.tsx
- src/components/middle/views.tsx
- src/components/middle/workspace.tsx
- src/domain/deals/state-machine.ts
- src/domain/fees/engine.ts
- src/domain/matching/constraints.ts
- src/domain/matching/engine.ts
- src/domain/matching/types.ts
- src/domain/matching/weights.ts
- src/domain/platform/contracts.ts
- src/domain/platform/events.ts
- src/domain/platform/screens.ts
- src/domain/shared/money.ts
- src/services/platform/auth.ts
- src/services/platform/database.ts
- src/services/platform/deals.ts
- src/services/platform/http.ts
- src/services/platform/inventory.ts
- src/services/platform/matching.ts
- src/services/platform/records.ts
- tests/e2e/server.mjs
- tests/e2e/vertical-slice.spec.ts
- tests/helpers/worker.mjs
- tests/platform.test.mjs
- tests/unit/domain.test.ts
- tests/unit/property-card.test.tsx
- vitest.config.ts

Pre-existing changes in PARTNER_PIPELINE.csv, research documents and deliverables were not modified. Build output and screenshots are ignored artifacts.

## MIGRATIONS

- Generated `drizzle/0007_lame_microbe.sql`, snapshot and journal entry: 29 additive matching-domain tables; existing tables remain intact.
- Seeds only five role names and fee policy rate `0.001`, basis TRANSACTION_VALUE, currency THB. No user/property/deal seed records.
- Applied to local D1 in `.wrangler/state`. Verified five roles, rate 0.001, zero users, and an authenticated local profile read returning null.
- CLI requires `--persist-to .wrangler/state` to share the dev server database and avoid disposable `dist/` storage.
- No remote migration/deployment. Drizzle regeneration reports no schema drift.

## FEATURES_IMPLEMENTED

- Persisted role onboarding; server-side role, ownership and participant authorization.
- Owner property publish/read; Agent/Client requirement create/read with representation consent and strict Zod inputs.
- Deterministic matching, exact monetary comparisons, configurable weights and immutable score/reason snapshots.
- Discover, Pass/Interested/Super Match, visible counterparty interest, atomic mutual consent and one private room per match.
- Stored chat, property context, domain-event timeline, viewing requests, counterparty confirmation, completion timing rules and cancellation.
- Audit/events, optimistic concurrency, retry-safe messages/viewings and transactional notifications.
- Real own-account metrics and notifications; shared mobile design system and 38-screen capability map.
- Full named state graph and exact policy-driven fee engine foundation. Future schema-only entities are explicitly documented.
- Legacy lead/import operator hardening, architecture/API/security/event docs, tests and CI workflow.

## TESTS_ADDED

- Vitest: requested matching scenarios, weight validation, deterministic normalization, exact monetary boundaries, fee rounding, terminal transitions, role escalation and input validation.
- React Testing Library: PropertyCard action callbacks, pending-click protection and truthful missing-photo/verification labels.
- Actual compiled Worker + real SQLite: first slice, ownership denials, duplicate generation, concurrent mutual consent, forced transaction rollback, same-room retries, cross-room idempotency conflict, viewing authorization, terminal states, audit/event uniqueness and legacy lead isolation.
- Playwright: two independent browser identities through the full first-slice UI plus owner viewing confirmation, reload persistence, mobile overflow and anonymous sign-in/API checks.

## COMMANDS_RUN

Key commands, repeated after relevant fixes:

```sh
pnpm add zod
pnpm add -D vitest @playwright/test
pnpm add -D @testing-library/react @testing-library/jest-dom jsdom
pnpm add -D prettier
pnpm db:generate
pnpm typecheck
pnpm lint
pnpm test:unit
pnpm build
pnpm test:integration
pnpm test
pnpm exec playwright install chromium
PLAYWRIGHT_CHANNEL=chrome pnpm test:e2e
pnpm dev
pnpm exec wrangler d1 execute DB --local --persist-to .wrangler/state --config dist/server/wrangler.json --file drizzle/0007_lame_microbe.sql
git diff --check
```

Repository inspection, formatting, local HTTP/schema checks and screenshot inspection were also performed. No commit, push, external message or production mutation.

## TEST_RESULTS

| Check | Result |
| --- | --- |
| TypeScript strict | PASS |
| ESLint | PASS: 0 errors; 2 existing warnings in generated worker-env.d.ts |
| Vitest + React Testing Library | 19 passed |
| Production Worker build | PASS |
| Worker/regression integration | 11 passed |
| Playwright using installed Chrome | 2 passed |
| Desktop 1440×1000 / mobile 390×844 visual inspection | PASS; no horizontal overflow or browser page errors |
| Local D1 migration and profile read | PASS |
| Drizzle regeneration | No drift |
| Git diff whitespace check | PASS |

Earlier browser runs caught accessible labels containing helper text and incoming interest hidden before one's own decision. Both were fixed before the final pass. Fault-injection integration tests intentionally log generic failures to verify rollback.

Playwright's bundled Chromium installer does not support this machine's macOS 13; installed Chrome successfully ran the tests. CI uses Chromium on Ubuntu. The CI workflow was authored but has not run on GitHub.

Screenshots contain isolated test fixtures: `output/playwright/deal-room-desktop.png` and `output/playwright/matches-mobile.png`.

## KNOWN_LIMITATIONS

- No separate Claude Blueprint was found; the prompt is the provisional specification. ADRs explain retaining vinext/Drizzle/D1/R2.
- The first slice is complete, not all 38 screens. Organization/client delegation, role management and full dashboards remain incomplete.
- Inventory editing, media upload, signed document delivery and verification remain future work; asset placeholders are labelled.
- Offers, negotiation, signed agreements, closed deals, fee creation/collection and receipts are schema/domain foundations only.
- Lilith provider calls and AIRun operational logging are not implemented. No fake AI responses or image-generation API integration.
- Scores remain immutable when weights change. Location matching uses normalized district labels. Business assumptions are documented.
- No anti-abuse limits, external event delivery, live session-expiry tests, production ingress certification or production rollout. Browser identities are injected only into the loopback test ingress, never a product login bypass.
- Plain local development cannot complete dispatcher-owned ChatGPT sign-in. The sign-in-link test checks its destination, not a live OAuth/session exchange. Hosted staging is required for that validation; the development server was stopped after verification.
- Legacy lead APIs retain their existing error envelopes; the new envelope applies to matching APIs.

## NEXT_TASKS

1. Review this batch and reconcile the missing Blueprint.
2. Versioned inventory updates, media and participant-authorized signed document storage.
3. Offers, negotiation, agreement evidence, closing and transactional fee generation from stored policy.
4. Lilith structured AI provider, observability, timeouts and visible fallback.
5. Organization/client grants, audited admin/verification, complete funnels and operational hardening.
6. Extend E2E through offer → agreement → close → fee, then validate hosted staging/auth before a reviewed release.
