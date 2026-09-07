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
pnpm dev
```

Open http://127.0.0.1:3100 for the clearly labelled foundation page. `pnpm --filter @lilith/web start` serves the production build locally. No credentials or environment file are needed by this scaffold; the full validated environment contract is a later task.

`apps/web` is the Next.js app. `apps/worker` builds independently, but starting it exits with code 78 because its PostgreSQL/pg-boss setup has not been implemented. It never pretends to process jobs. Shared packages: contracts, core, db, ai, ui, i18n and config. [Architecture and import rules](docs/ARCHITECTURE.md).

`pnpm test` runs the current workspace tests. The ARCH-001 CI workflow checks the scaffold and boundary suite; database integration, E2E, migration and other release gates belong to later tasks. No deployment is configured by this task.

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
