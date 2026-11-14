# ADR-0017 — Database package and local stack: how ARCH-004 reads the blueprint

Status: proposed; owner review pending.
Date: 2026-11-14

## Context

ARCH-004 asks for PostgreSQL 16 with PostGIS and pgvector in Docker, Prisma configured, and a client wrapper that makes Row Level Security possible. The blueprint fixes the outcome: `docker compose up` then `pnpm db:migrate` succeeds, five extensions are installed, and `withActor(userId, fn)` sets `app.user_id` with `SET LOCAL` inside a transaction. It leaves the means open. The choices below are recorded here.

## Decision

### 1. The local database image

- No official image carries both PostGIS and pgvector, so `packages/db/docker/Dockerfile` builds one from two official images:
  - the base is `postgis/postgis:16-3.6`;
  - the pgvector extension files are copied from `pgvector/pgvector:0.8.7-pg16-trixie`.
- Both images are PostgreSQL 16 on Debian trixie and are pinned by digest. The build downloads no packages, so it gives the same result every time. The result is PostgreSQL 16.15, PostGIS 3.6.4 and pgvector 0.8.7.
- The Dockerfile is not in the task's file list; `docker-compose.yml` needs it.
- The container listens on `127.0.0.1:54329` only, so other machines cannot reach it and it does not collide with a PostgreSQL already on port 5432. Its user, password and database are all `lilith`; they exist for this local container only.
- The PostGIS image installs PostGIS into its default database by itself. The migration does not rely on that: the tests migrate a database that starts with no extension.

### 2. Migrations

- `pnpm db:migrate` runs `prisma migrate deploy`, following §21.3 ("Prisma migrate for schema"). It applies pending migrations in order, records them, and a second run changes nothing.
- Each migration is hand-written SQL in a numbered folder: `packages/db/migrations/0001_extensions/migration.sql`. The task card writes `migrations/0001_extensions.sql`; Prisma needs one folder per migration. Later tasks follow the same pattern (`0002_identity/migration.sql`).
- `prisma migrate dev` is not part of the workflow. It writes SQL from the Prisma schema and offers to reset a database that differs, and the constraints, triggers, policies and partitions of §8 cannot be written in a Prisma schema.
- Prisma has no down migrations. §21.3 accepts "reversible or a documented forward fix"; `0001_extensions` documents its forward fix. How the `down` test of §21.3 is met is left to ARCH-005.

### 3. Prisma

- Prisma is 7.10.1, the current stable line. The registry's `latest` tag points at an 8.0 release candidate, which is not used.
- Prisma 7 reads the connection from `packages/db/prisma.config.ts`, not from the schema file.
- The client is generated into `packages/db/generated/prisma` by `prisma generate`, which runs when the package is installed. Generated code is not committed, and lint and formatting skip it.
- The client connects through the `pg` driver with `@prisma/adapter-pg`.
- pnpm is allowed to run the install scripts of `prisma` and `@prisma/engines`; they fetch the engine that `prisma migrate` uses.
- The Prisma CLI's update check is switched off in CI (`CHECKPOINT_DISABLE`), like the telemetry of the other tools there.
- `schema.prisma` has no models yet. Tables arrive with DB-001.

### 4. Where the database is

- The application reads `DATABASE_URL` and migrations read `DATABASE_DIRECT_URL`, falling back to `DATABASE_URL` (§20).
- With `APP_ENV` unset or `local`, both fall back to the local Docker database, so `docker compose up` and `pnpm db:migrate` work on a clean machine with no setup. With any other `APP_ENV`, a missing URL is an error.
- `.env.example` now exists with the three keys the code reads: `APP_ENV`, `DATABASE_URL` and `DATABASE_DIRECT_URL`.

### 5. `withActor`

- `createDatabaseClient()` returns `{ withActor, close }`. `withActor(userId, fn)` runs `fn` in one Prisma transaction and hands it the transaction's client.
- The setting is written with `set_config('app.user_id', $1, true)`. This is the function form of `SET LOCAL`: the value lasts until the transaction ends. It is used because the `SET` statement cannot take the value as a bound parameter.
- `userId` must be a UUID. Anything else is refused before a transaction opens, and the id is stored in lower case.
- After the transaction the setting is gone, whether it committed or rolled back, so a pooled connection never carries one request's actor into the next.
- PostgreSQL reports a cleared custom setting as NULL on a connection that never used it and as an empty string afterwards. The policies of DB-010 must therefore read it as `NULLIF(current_setting('app.user_id', true), '')::uuid`.
- No way to query without an actor is exposed. Jobs and admin routes need their own database roles (ADR-0011), and those come with the tasks that need them.
- Row Level Security itself is not enabled here. The local user is a superuser, which bypasses policies, so DB-010 also has to add an application role.

### 6. Tests and CI

- Integration tests run against the Docker database and never touch its data. Each test file creates an empty database from `template0`, migrates it with the command `pnpm db:migrate` runs, and drops it afterwards.
- `pnpm test` needs no database: the integration tests are a separate script, and `pnpm test:db` runs both kinds.
- The foundation workflow builds and starts the Docker database, then runs `pnpm db:migrate` and `pnpm test:db`. Testcontainers come with ARCH-005, as its card says.

### 7. Package layout

- The package's files sit at its root (`client.ts`, `env.ts`, `index.ts`), where the blueprint and the boundary tests name `packages/db/client.ts`. The `src/` placeholder of ARCH-001 is removed.

## Enforcement

- 27 tests: 6 need no database and 21 run against PostgreSQL.
  - The migration installs all five extensions into an empty database, and each is exercised: a distance in metres, a vector distance, a UUID, a trigram similarity and a case-insensitive comparison, plus GiST, HNSW and trigram indexes.
  - `app.user_id` is correct inside `withActor` and cleared outside. "Outside" is checked on the very connection used inside, by giving the client a pool of one.
  - 40 concurrent transactions on a pool of four each see only their own actor.
  - The local URL is compared with `docker-compose.yml`, so the two cannot drift apart.
- 24 of 24 hand-made faults in the package, the migration and the compose file are caught. An image built without the pgvector library makes the migration fail.

## Consequences

- An install without development dependencies has no Prisma CLI to generate the client. How the application is packaged for deployment is decided with the deployment tasks.
- The local versions of PostGIS and pgvector are pinned; a hosted PostgreSQL may run others. The tasks that first depend on them (DB-003 for geography, AI-008 for embeddings) should check.
- The foundation CI now pulls two images and starts a database on every run.
