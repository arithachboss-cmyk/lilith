# LILITH by THE MIDDLE

Property matching infrastructure. The production implementation follows [Architecture Blueprint v1.0](BLUEPRINT_README.md) and [IMPLEMENTATION_ORDER.md](IMPLEMENTATION_ORDER.md).

Current task: **ARCH-001 — Monorepo scaffold**. This is an engineering foundation, not an operational marketplace. No active listings, customer data, authentication, database, matching, viewing or billing flows are provided yet. See [implementation status](docs/IMPLEMENTATION_STATUS.md).

## Foundation development

Requires Node.js 24 and pnpm 11.19.0 (pinned in `packageManager`).

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm typecheck
pnpm lint
pnpm test:boundaries
pnpm test:core
pnpm test:contracts
pnpm contracts:check
pnpm dev
```

Open http://127.0.0.1:3100 for the clearly labelled foundation page. It shows the live system status, read from the database on every request; http://127.0.0.1:3100/api/health gives the same answer as JSON. `pnpm --filter @lilith/web start` serves the production build locally. No credentials or environment file are needed by this scaffold: `.env.example` lists the keys the code reads, and the full validated environment contract is a later task.

`apps/web` is the Next.js app. `apps/worker` builds independently, but starting it exits with code 78 because its PostgreSQL/pg-boss setup has not been implemented. It never pretends to process jobs. Shared packages: contracts, core, db, ai, ui, i18n and config. [Architecture and import rules](docs/ARCHITECTURE.md).

The local database is PostgreSQL 16 with PostGIS and pgvector in Docker. It needs no environment file:

```bash
pnpm db:up          # build and start the database on 127.0.0.1:54329
pnpm db:migrate     # apply the migrations in packages/db/migrations
pnpm test:db        # database tests; each run uses its own throwaway database
pnpm test:skeleton  # /api/health through every layer, against the database
pnpm db:down        # stop it (the data volume is kept)
```

`pnpm contracts:openapi` regenerates `packages/contracts/openapi.json` from the zod schemas; the file is never edited by hand, and `pnpm contracts:check` fails when it is out of date.

`pnpm test` runs the current workspace tests and needs no database. The ARCH-001 CI workflow checks the scaffold and boundary suite; database integration, E2E, migration and other release gates belong to later tasks. No deployment is configured by this task.

## Preserved operating prototype

The existing root static files are retained as historical prototype material, separate from `apps/web`. They are not the production product. The earlier prototype instructions follow unchanged.

---

# Lilith Operating Prototype

Static prototype for Project Lilith's control room.

## Open Locally

```sh
python3 -m http.server 4173
```

Then open:

```text
http://127.0.0.1:4173/
```

## Current Scope

- Lilith operating dashboard
- Google Drive spec reference slot
- Extracted goals, workflow, and open items
- Marketing and service plan section
- Responsive desktop and mobile layout
