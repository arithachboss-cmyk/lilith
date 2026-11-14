# ADR-0018 — Walking skeleton: one thin path through every layer (SKEL-001)

Status: proposed; owner review pending.
Date: 2026-11-14

## Context

ARCH-001 to ARCH-004 built the layers one by one: the workspace and its import rules, the shared kernel, the contracts and the database package. Nothing yet ran through all of them at once.

On 2026-11-14 the owner asked for a "skeleton". Asked what that meant, the owner chose "ต่อชิ้นส่วนให้ทะลุทั้งระบบ" (connect the pieces all the way through), and then approved the plan with "อนุมัติ merge แล้วเริ่ม (แนะนำ)". Blueprint v1.0 has no such task, so its scope and its readings are recorded here.

## Decision

### 1. Scope

- The task is `SKEL-001`. It is not in `docs/07-codex-handoff.md`.
- It builds one path and nothing else: `GET /api/health`, which Blueprint §18.10 already defines. The path needs no table and no login, so it can exist before the data model.
- The path runs through every layer the way a real feature will:
  - `apps/web/src/app/api/health/route.ts` — the route adapter;
  - `packages/core/system/health.ts` — the service that decides the answer;
  - `packages/core/system/repository.ts` — the only file of that folder allowed to import the database package;
  - `packages/db/client.ts` — `probe()`, which asks PostgreSQL;
  - `packages/contracts` — the `HealthResponse` schema that the answer must match.
- The foundation page shows the same answer in Thai and English, read on every request.
- Not in scope: login, tables, any business feature, the job queue, the AI service, storage and deployment.

### 2. Overlap with OPS-003

- OPS-003 owns the full health endpoint: database, queue, storage and AI, plus the post-deploy smoke test.
- SKEL-001 checks the database only. The queue and the AI service do not exist yet and are reported as `not_configured`; they do not count against the overall status.
- OPS-003 extends this path. It adds the missing checks and decides whether a part that is not configured should count.

### 3. What the answer says

§18.10 names the members of the response (`status`, `db`, `queue`, `ai`, `version`) and not their values. ARCH-003 left them as free text; this task fixes them in the contract.

- A dependency is `ok`, `not_migrated`, `unreachable` or `not_configured`.
  - The database is `ok` when it answers and the five extensions of migration 0001 are installed.
  - It is `not_migrated` when it answers without them.
  - It is `unreachable` when it does not answer within 2 seconds.
- `status` is `ok` when the database is `ok`, otherwise `degraded`.
- `version` is `APP_VERSION`, or `dev` when none was injected.
- The route always answers 200, also when degraded. §18.10 shows only `→ 200`, and §18.0 makes every non-2xx response the error envelope, which could not carry the health body. A monitor reads `status`.
- The answer never carries the cause of a failure: no host, port, credential or driver message.
- The page says "ส่วนที่สร้างแล้วทำงานปกติ / Everything built so far is working" when the status is `ok`. It does not say the platform is ready, because the product is not open.

### 4. The API edge

Two things every later route needs were first built here, in `apps/web/src/lib/server/http.ts`.

- Every response carries `X-Request-Id`. The id is made by the server for each request and is never taken from the caller.
- A failure inside the adapter is a 500 in the error envelope of §18.0, with code `INTERNAL` and the same id in the body and the header.
- API answers are sent with `Cache-Control: no-store`.
- `packages/i18n` holds the Thai and English text of an error code. Only `INTERNAL` is there so far; each route adds the codes it uses.

### 5. Database access without an actor

- `probe()` reads the system catalogue only. It touches no table, so it needs no actor and no Row Level Security.
- `getDatabaseClient()` gives the one client of the process, created on first use. Core repositories use it; tests pass their own client.
- This is not a general way to query without an actor. Jobs and admin routes still need their own database roles (ADR-0011, ADR-0017).

### 6. Where the service lives in core

- The blueprint's list of core domains has no place for the state of the system itself. The service is in a new folder, `packages/core/system`.
- The service takes no `ActorContext`. The route is public and has no actor; ADR-0015 already notes that a context for calls without a user is not defined.
- A dependency that is down is an answer, not a failure, so the service returns a plain value and never a `DomainError`.

## Enforcement

- Tests at each layer, and one that runs the real route with nothing replaced.
  - Core: the service against a fake database port, for every state.
  - Database package: `probe()` against a migrated database, an empty one, a closed port, a wrong password and a busy connection.
  - Web: the handler against the contract, including the 500 envelope; then the real route against a migrated database, and again with `DATABASE_URL` pointing at a port where nothing listens.
- `pnpm test:skeleton` runs the tests that need the database, and the foundation workflow runs it after `pnpm test:db`.
- A browser check, run by hand and not part of CI: the page and the route with the database up, stopped and started again.

## Consequences

- The health route exists before OPS-003 and is weaker than OPS-003 requires. Until then it must not be used as a deployment gate.
- The foundation page is now rendered on every request and opens a database connection. It still loads when the database is down.
- The health route is public and has no rate limit yet; the rate limits of §7.6 come with their own task.
- `HealthResponse` is narrower than ARCH-003 left it, so the generated OpenAPI document changes.
