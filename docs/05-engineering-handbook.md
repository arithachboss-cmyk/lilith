# LILITH by THE MIDDLE — Architecture Blueprint
## Part 5 — Engineering Handbook (Sections 19–24)

---

# 19. Repository Structure

Monorepo, pnpm workspaces + Turborepo. One deployable app in MVP, but the package boundaries are already the future service boundaries.

```
middle-property/
├── apps/
│   ├── web/                          # Next.js 15 App Router — the product
│   │   ├── src/app/                  # routes (see §6.2)
│   │   ├── src/components/
│   │   ├── src/lib/
│   │   ├── public/
│   │   ├── e2e/                      # Playwright specs
│   │   └── next.config.ts
│   └── worker/                       # background jobs (pgboss) — separate process
│       ├── src/jobs/                 # match.generate, ai.property_review, fee.generate, …
│       ├── src/cron.ts
│       └── src/index.ts
│
├── packages/
│   ├── contracts/                    # ← the source of truth for all shapes
│   │   ├── src/dto/                  # zod schemas → inferred TS types
│   │   ├── src/events.ts             # event registry (compile-time enforced)
│   │   ├── src/errors.ts             # canonical error codes
│   │   └── src/openapi.ts            # generator
│   ├── core/                         # domain layer — NO framework imports
│   │   ├── identity/  verification/  organization/
│   │   ├── property/  geo/  requirement/
│   │   ├── matching/                 # score.ts is PURE (no I/O) — heavily tested
│   │   │   ├── score.ts  dimensions.ts  rules.ts  candidates.sql  repository.ts
│   │   ├── interest/  deal/          # deal/state-machine.ts owns TRANSITIONS
│   │   ├── messaging/ viewing/ negotiation/
│   │   ├── billing/                  # fee-engine.ts is PURE
│   │   ├── notification/ analytics/ audit/ trust/ admin/
│   │   ├── authz/                    # policies.ts, matrix.ts
│   │   └── shared/                   # Result, Money, ActorContext, ids, clock
│   ├── db/
│   │   ├── prisma/schema.prisma
│   │   ├── migrations/               # SQL migrations incl. RLS, triggers, indexes
│   │   ├── seed/                     # locations, BTS/MRT stations, amenities, weight profile, fee rule
│   │   └── client.ts                 # connection wrapper that sets app.user_id for RLS
│   ├── ai/                           # Lilith (see §10.1)
│   │   ├── client.ts providers/ tasks/ guard/ runs.ts evals/
│   ├── ui/                           # design system
│   │   ├── tokens.css  primitives/  brand/lilith/  icons/
│   ├── i18n/                         # th (default) + en dictionaries, ICU messages
│   └── config/                       # eslint, tsconfig, tailwind preset, vitest preset
│
├── docs/
│   ├── 01-product-and-system-architecture.md
│   ├── 02-matching-ai-deal-fee.md
│   ├── 03-security-events-admin.md
│   ├── 04-api-contracts.md
│   ├── 05-engineering-handbook.md
│   ├── 06-roadmap-and-adrs.md
│   ├── 07-codex-handoff.md
│   ├── adr/ADR-0001-*.md …
│   └── runbooks/
├── IMPLEMENTATION_ORDER.md
├── AGENTS.md                          # agent operating rules (Codex/Claude/Manus)
├── .env.example
├── turbo.json  pnpm-workspace.yaml  package.json
└── .github/workflows/ci.yml
```

**Boundary rules enforced by ESLint (`no-restricted-imports`), CI-blocking:**

| Rule | Reason |
|---|---|
| `apps/web/app/api/**` may not import `@prisma/client` | route handlers must go through `packages/core` |
| `packages/core/**` may not import `next/*` or `react` | domain must stay framework-free and testable |
| `packages/ai/**` may not import `packages/core/*` (except `shared`) | AI must be replaceable and never own business rules |
| `packages/core/matching/score.ts` may not import anything with I/O | purity guarantees determinism |
| only `packages/db/**` may import Prisma | one place to change persistence |

---

# 20. Environment Variables

`.env.example` is committed with every key and no value. CI fails if a key is used in code but missing from the example (`pnpm env:check`).

```bash
# ── Core ────────────────────────────────────────────────
NODE_ENV=development|test|production
APP_ENV=local|dev|staging|production
APP_URL=https://app.middleproperty.com
APP_VERSION=                          # injected from git sha at build

# ── Database ────────────────────────────────────────────
DATABASE_URL=postgresql://…?sslmode=require&connection_limit=10
DATABASE_DIRECT_URL=                  # non-pooled, for migrations
DATABASE_READ_REPLICA_URL=            # optional; analytics reads

# ── Auth / crypto ───────────────────────────────────────
AUTH_SECRET=                          # 32-byte base64, session signing
ENCRYPTION_KEY=                       # 32-byte base64, column encryption (AES-256-GCM)
ENCRYPTION_KEY_PREVIOUS=              # for key rotation window
BLIND_INDEX_KEY=                      # HMAC key for searchable encrypted phone
SESSION_TTL_DAYS=30
SESSION_ABSOLUTE_TTL_DAYS=180

# ── OTP / messaging ─────────────────────────────────────
SMS_PROVIDER=thaibulksms|twilio|mock
SMS_API_KEY=
SMS_SENDER_ID=MIDDLE
OTP_TTL_SECONDS=300
OTP_MAX_ATTEMPTS=5
RESEND_API_KEY=
EMAIL_FROM="LILITH by THE MIDDLE <no-reply@middleproperty.com>"

# ── Storage ─────────────────────────────────────────────
S3_ENDPOINT=https://<account>.r2.cloudflarestorage.com
S3_REGION=auto
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_BUCKET_MEDIA=mp-media
S3_BUCKET_DOCUMENTS=mp-documents      # private, never public
SIGNED_URL_TTL_SECONDS_MEDIA=3600
SIGNED_URL_TTL_SECONDS_DOCUMENT=900

# ── AI (Lilith) ─────────────────────────────────────────
AI_ENABLED=true                       # false ⇒ full deterministic fallback (release criterion)
AI_PROVIDER=openai|mock
OPENAI_API_KEY=
AI_MODEL_EXTRACT=gpt-4.1-mini
AI_MODEL_EXPLAIN=gpt-4.1-mini
AI_MODEL_SUMMARY=gpt-4.1
AI_EMBEDDING_MODEL=text-embedding-3-small
AI_TIMEOUT_MS_INTERACTIVE=8000
AI_TIMEOUT_MS_BATCH=30000
AI_DAILY_BUDGET_MICRO_USD_PER_USER=200000
AI_MONTHLY_BUDGET_MICRO_USD_PER_ORG=50000000

# ── Geo ─────────────────────────────────────────────────
GOOGLE_MAPS_API_KEY=                  # geocoding + places (server-side only)
GEOCODE_CACHE_TTL_DAYS=90

# ── Payments (V1) ───────────────────────────────────────
PAYMENT_PROVIDER=manual|omise
OMISE_PUBLIC_KEY=
OMISE_SECRET_KEY=
OMISE_WEBHOOK_SECRET=
PROMPTPAY_MERCHANT_ID=

# ── Realtime / jobs ─────────────────────────────────────
REALTIME_MODE=sse|managed
PGBOSS_SCHEMA=pgboss
WORKER_CONCURRENCY=5

# ── Observability ───────────────────────────────────────
SENTRY_DSN=
SENTRY_TRACES_SAMPLE_RATE=0.1
AXIOM_TOKEN=
AXIOM_DATASET=middle-property
LOG_LEVEL=info

# ── Feature flags (env-level; runtime flags live in DB) ──
FLAG_SUPER_MATCH=true
FLAG_RENT_TO_OWN=true
FLAG_INSIGHTS=false
FLAG_ADMIN_IMPERSONATION=false

# ── Limits ──────────────────────────────────────────────
RATE_LIMIT_ENABLED=true
SUPER_MATCH_WEEKLY_QUOTA=3
MAX_ACTIVE_REQUIREMENTS_PER_CLIENT=5
MAX_PROPERTIES_PER_OWNER_UNVERIFIED=2
```

Secret handling: production values live only in Vercel/Doppler; no `.env` file is ever committed; `ENCRYPTION_KEY` rotation uses the `_PREVIOUS` slot with a re-encrypt job.

---

# 21. Development / Staging / Production Strategy

## 21.1 Environments

| | **local** | **dev** | **staging** | **production** |
|---|---|---|---|---|
| Purpose | individual dev | integration of merged `main` | pre-release verification, demos | live |
| Data | seeded synthetic | seeded + synthetic | **anonymised** copy of prod (nightly) | real |
| Database | Docker Postgres+PostGIS | Neon branch `dev` | Neon branch `staging` | Neon primary + PITR |
| AI | `AI_PROVIDER=mock` by default | mock, real behind flag | real, budget-capped | real |
| SMS | `mock` (code printed to log) | mock | real to allow-listed numbers | real |
| Payments | manual | manual | provider test mode | live |
| Auth | OTP bypass code `000000` for seeded users | bypass off | off | off |
| Deploy | `pnpm dev` | auto on merge to `main` | auto on tag `staging-*` | manual promote of a staging build |

**Rule: production data never leaves production un-anonymised.** The staging refresh job pseudonymises names, phones, emails, documents (replaced with placeholder files) and scrambles exact addresses.

## 21.2 Branching & release

```
main            protected, always deployable, squash merges only
feat/<TASK-ID>-slug     one Codex task per branch
fix/…  chore/…  docs/…
```

- Every PR title starts with the task ID (`MATCH-004: implement dimension scoring`).
- PR template requires: what changed, acceptance criteria checklist, tests added, migration notes, screenshots for UI, and a rollback note.
- Required checks: typecheck · lint (incl. boundary rules) · unit · integration · e2e smoke · migration dry-run · bundle budget · `pnpm env:check` · `pnpm contracts:check`.
- Two-approval rule for anything touching `packages/core/{deal,billing,authz}`.

## 21.3 Migrations

- Prisma migrate for schema; raw SQL files for RLS policies, triggers, partial indexes, partitions.
- **Expand → migrate → contract** for every breaking change; never a destructive migration in a single release.
- Every migration must be reversible or ship with a documented forward fix; `down` is tested in CI against a seeded database.
- Long index builds use `CREATE INDEX CONCURRENTLY` in a separate, non-transactional migration.
- Data backfills run as jobs, not migrations, and are idempotent and resumable.

## 21.4 Feature flags

Two tiers: env flags (build-time, in §20) and DB flags (`feature_flags` table: `key`, `enabled`, `rollout_pct`, `allow_user_ids[]`, `scope`). Every risky feature ships behind a DB flag: super match quota, insights, AI tasks, contact-masking policy, new weight profile.

---

# 22. Testing Architecture

## 22.1 Pyramid and ownership

| Layer | Tool | Scope | Target | Owner |
|---|---|---|---|---|
| Unit (pure) | Vitest | `matching/score.ts`, `billing/fee-engine.ts`, `deal/state-machine.ts`, DTO serialisers | **≥95% branch** on these three files, 80% overall on `packages/core` | Codex |
| Property-based | fast-check | scoring monotonicity, fee rounding, money arithmetic | invariants below | Codex |
| Integration | Vitest + Testcontainers (real Postgres) | repositories, RLS policies, transactions, outbox | every module | Codex |
| Contract | Vitest + zod | every route's request/response against `packages/contracts` | 100% of routes | Codex |
| E2E | Playwright | the 7 critical journeys | green before release | Codex + Manus |
| Load | k6 | match feed, deal room SSE | p95 targets in §23 | Manus |
| Security | ZAP baseline + custom authz suite | authz matrix, IDOR probes | zero highs | Manus |
| AI eval | custom harness | golden sets per task | no F1 regression >2pts | Codex |

## 22.2 Invariants that must have tests (non-negotiable)

**Matching**
1. Determinism: `score(a,b,p)` called 1,000 times returns one value; `inputs_hash` stable.
2. Monotonicity: raising rent while holding everything else never *increases* the budget dimension score.
3. Bounds: `0 ≤ score ≤ 100`, `0 ≤ confidence ≤ 1` for all generated inputs.
4. Missing-data neutrality: a null dimension redistributes weight and lowers confidence; it never scores 0.
5. Hard constraints: no match row ever exists for a pair violating H1–H8.
6. Weight change: publishing a new profile changes scores but never mutates historical `match_scores` rows.

**Deal FSM**
7. Every transition in `TRANSITIONS` has a test asserting allowed-from, forbidden-from, actor permission, and payload validation.
8. `deals.status` cannot change without a `deal_transitions` row (trigger test).
9. Replaying the same `Idempotency-Key` produces one transition, not two.
10. Concurrent transitions on the same deal: one succeeds, one gets `409`.
11. `DEAL_CLOSED` is terminal — every outbound transition rejected.

**Money**
12. `fee_amount == round_half_up(basis * rate_bp / 10000)` across 10,000 random values (property-based).
13. Splits always sum exactly to `fee_amount`.
14. A closed deal always produces exactly one non-void fee.
15. Changing `fee_rules` never alters an existing `fees` row.
16. Invoice numbers are gapless and unique under concurrent issuance.

**Authorization**
17. The full permission matrix is a table-driven test: every `(role, tier, operation, resource-ownership)` combination asserted.
18. IDOR suite: user A cannot read/write any resource of user B — enumerated across every `/api/*/:id` route automatically.
19. `PropertyPublicDTO` never contains `address_line`, `unit_number`, exact coordinates, contact fields, or documents (snapshot test on the serialiser).
20. Deal Room endpoints reject non-participants, including admins without `ADMIN_SUPPORT` participation.

**AI**
21. With `AI_ENABLED=false`, every one of the 38 screens still renders and every flow completes.
22. Malformed model output → `REJECTED_SCHEMA` + fallback, never a 500.
23. `redact()` removes phone/email/ID patterns — fuzzed with Thai and international formats.
24. Every AI response includes complete `meta` provenance.

## 22.3 E2E critical journeys

```
J1 Owner: signup → verify → create property (8→13) → publish
J2 Client: signup → requirement (15→18) → discover → interested
J3 Mutual match → deal room opens → contact disclosed → message exchange
J4 Viewing: request → confirm → complete
J5 Offer → counter → accept → agreement signed
J6 Close (dual confirm) → fee generated → invoice → payment recorded → receipt
J7 Admin: verification approve → duplicate flag → force unpublish → audit trail visible
```

Each runs on Chromium mobile viewport (390×844) in `th-TH` and `en-US`. J6 is the revenue path — it gates every release.

## 22.4 Test data

`packages/db/seed` produces a deterministic world: 3 areas (Thong Lo, Ari, On Nut), 24 BTS/MRT stations, 60 properties across price bands, 20 requirements engineered to produce known scores. Golden score fixtures (`matching/__fixtures__/expected-scores.json`) are regenerated only through a reviewed PR — an unexplained diff there means the engine changed behaviour.

---

# 23. Observability

## 23.1 Logging

Structured JSON, one line per request, always carrying:

```jsonc
{ "level":"info","ts":"…","request_id":"req_01J…","trace_id":"…",
  "route":"POST /api/deals/:id/transitions","status":200,"duration_ms":142,
  "user_id":"usr_…","role":"AGENT","org_id":null,
  "subject_type":"DEAL","subject_id":"del_…","app_version":"a1b2c3d" }
```

Never logged: OTP codes, session tokens, document contents, raw AI prompts containing PII, full phone numbers (last 4 only), payment references beyond a hash.

## 23.2 Metrics (RED + business)

| Category | Metrics |
|---|---|
| Request | rate, error rate, p50/p95/p99 latency per route |
| Database | connection pool saturation, slow query count (>200ms), lock waits, replication lag |
| Jobs | queue depth per job, processing latency, failure rate, dead-letter count |
| Realtime | active SSE connections, reconnect rate, notify→deliver latency |
| Matching | matches generated/hour, candidate-set size distribution, scoring duration p95, feed serve p95 |
| AI | calls/hour by task, error/timeout rate, schema-rejection rate, p95 latency, cost per day, override rate |
| Business | mutual matches/day, rooms opened/day, viewings confirmed/day, deals closed/week, fees issued vs paid |
| Reconciliation | nightly drift value (must be 0) |

## 23.3 Performance budgets (SLO)

| Endpoint / flow | p95 target |
|---|---|
| `GET /api/matches/feed` | 400 ms |
| `GET /api/properties/:id` | 250 ms |
| `POST /api/matches/:id/interest` | 300 ms |
| `POST /api/deals/:id/transitions` | 400 ms |
| `POST /api/deals/:id/messages` → delivered via SSE | 800 ms end-to-end |
| Match generation for one requirement (500 candidates) | 3 s (async job) |
| AI interactive task | 8 s hard timeout, 3 s p50 |
| Screen 19 LCP on 4G mid-tier Android | 2.5 s |

Availability SLO: 99.5% monthly for the app, 99.9% for auth. Error budget burn >50% in a week freezes feature work.

## 23.4 Alerting (paging vs. ticket)

**Page (immediate):** app 5xx rate >2% for 5 min · auth failure rate >20% · database unavailable · queue depth >1,000 for 10 min · reconciliation drift ≠ 0 · payment webhook failures · security alert (privilege escalation attempt, mass IDOR 403s from one actor).

**Ticket (next business day):** AI error rate >10% · schema rejection >15% · match feed p95 >800 ms · verification queue over SLA · duplicate queue backlog >50 · bundle budget exceeded.

## 23.5 Tracing & correlation

OpenTelemetry: one trace spans `route → core service → repository → external call`, and the same `trace_id` is stamped into `audit_logs.request_id`, `ai_runs`, and the outbox payload. Support can therefore go from a user's screenshot (`request_id` on the error screen) to the exact database writes and AI calls that request made.

---

# 24. Deployment Architecture

## 24.1 MVP topology

```
                     ┌──────────────────────────┐
   Users (mobile) ──►│  Cloudflare (DNS/CDN/WAF)│
                     └────────────┬─────────────┘
                                  │
                     ┌────────────▼─────────────┐
                     │   Vercel — Next.js app   │  (SIN/HKG region)
                     │   edge middleware: auth  │
                     │   node runtime: API      │
                     └───┬──────────────┬───────┘
                         │              │
        ┌────────────────▼──┐      ┌────▼─────────────────┐
        │ Neon Postgres 16  │◄─────┤ Worker (Railway/Fly) │
        │ +PostGIS +pgvector│      │ pgboss + cron        │
        │ PITR 7d, branches │      └────┬─────────────────┘
        └───────┬───────────┘           │
                │                  ┌────▼──────┐   ┌──────────┐
        ┌───────▼────────┐         │  OpenAI   │   │ SMS/Email│
        │ Cloudflare R2  │         └───────────┘   └──────────┘
        │ media + docs   │
        └────────────────┘
```

Region choice: Singapore (lowest Bangkok latency among available regions). Database and app must be in the same region — a cross-region hop costs more than every optimisation in this document.

## 24.2 Why the worker is a separate process from day one

Match generation, AI batch tasks and rescoring are long-running and bursty. Running them inside serverless functions means timeouts, cold starts and duplicated work. One small always-on worker container removes an entire category of production pain and costs ~$5/month. **This is the one piece of "extra" infrastructure the MVP takes on, and it is justified.**

## 24.3 Release process

1. Merge to `main` → CI → auto-deploy to **dev**.
2. Tag `staging-YYYYMMDD-N` → deploy to **staging** → run E2E suite J1–J7 + smoke.
3. Manual promote to **production** (same build artifact — never rebuilt).
4. Post-deploy: automatic smoke test (health, login, feed, deal read); failure triggers instant rollback to the previous Vercel deployment.
5. Migrations run **before** the app deploy, are always backward-compatible with the previous version (expand/contract), so rollback never requires a database rollback.

## 24.4 Backup & disaster recovery

| | Target |
|---|---|
| RPO | 5 minutes (Neon PITR) |
| RTO | 1 hour |
| DB backup | continuous WAL + daily logical dump to R2, 30-day retention, encrypted |
| Object storage | R2 versioning on the documents bucket + weekly cross-account copy |
| Restore drill | quarterly, documented in `docs/runbooks/db-restore.md`, timed and recorded |
| Audit log | separate daily export to write-once storage |

## 24.5 Scaling path (with the trigger that justifies each step)

| Stage | Trigger | Change |
|---|---|---|
| 0 → MVP | — | single app + Postgres + worker |
| Read scaling | read p95 >400ms or CPU >60% sustained | add a read replica; route feed and insights reads to it |
| Match scaling | match generation backlog >5 min | shard the job by area; move scoring to a dedicated worker pool |
| Realtime scaling | >5k concurrent SSE connections | move to managed WS (Ably/Pusher); the client `sse.ts` abstraction already isolates this |
| Search scaling | >500k properties or complex facets | add OpenSearch as a **derived** index, Postgres stays the source of truth |
| Event scaling | outbox lag >1 min | replace the outbox poller with a real bus (Kafka/Redpanda); domain code unchanged |
| Media scaling | image bandwidth cost material | Cloudflare Images / Imgix transformations |
| Region | Thai data-residency requirement | move Postgres to a Thai-region provider; the app is stateless |
| Service split | a team owns matching or billing separately | extract `packages/core/matching` or `/billing` into its own service — the module boundary and the `Result` interface already make this mechanical |

**Explicitly deferred, with reasons:** Kubernetes (no operational need), microservices (one team), Redis (Postgres handles rate limits and queues at this scale), GraphQL (REST + typed contracts is simpler here), a separate BFF (Next.js server components already are one), Kafka (outbox suffices below ~1k events/s).
