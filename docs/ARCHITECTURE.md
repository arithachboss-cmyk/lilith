# Architecture entrypoint

The authoritative specification is [Blueprint v1.0](../BLUEPRINT_README.md), with source hashes in `blueprint-source-manifest.json`. Work order and acceptance criteria are in [IMPLEMENTATION_ORDER](../IMPLEMENTATION_ORDER.md) and [Codex handoff](07-codex-handoff.md).

The target is Next.js App Router → core services/repositories → PostgreSQL 16 through the DB package, with a separate pg-boss worker. Shared contracts precede domain implementation. AI cannot own numerical matching or business rules. Fee rates come from versioned database rules; money is BIGINT satang. Status transitions, audit integrity and sensitive access have database enforcement as well as application checks.

ARCH-001 creates the buildable workspace and enforces imports. ARCH-002 adds the [shared kernel](SHARED_KERNEL.md), native source/subpath loading, emitted JavaScript verification, and typechecked tests. It does not implement those domain or database guarantees yet. See [implementation status](IMPLEMENTATION_STATUS.md).

| Workspace          | Responsibility                           | Permitted internal runtime dependencies                      |
| ------------------ | ---------------------------------------- | ------------------------------------------------------------ |
| apps/web           | Next app and route adapters              | contracts, core, ui, i18n; ai only in API/server composition |
| apps/worker        | Job process                              | contracts, core, db, ai, i18n                                |
| packages/contracts | Validated transport shapes               | none                                                         |
| packages/core      | Framework-free business domains          | contracts, i18n; db only from repository adapters            |
| packages/db        | Prisma, SQL, actor-aware database access | contracts                                                    |
| packages/ai        | Provider adapters and guarded AI tasks   | contracts, core/shared, db wrapper for AI persistence        |
| packages/ui        | Reusable product components              | contracts, i18n                                              |
| packages/i18n      | Thai/English messages                    | none                                                         |
| packages/config    | Shared engineering tooling               | tooling dependencies                                         |

Imports cannot reach the legacy root prototype. `no-restricted-imports` plus the local architecture rule check static imports, re-exports, type imports, literal dynamic imports, require and relative paths. Computed module paths fail lint. Pure matching/helper modules have a closed dependency set; deterministic runtime tests are still required in MATCH tasks.

See [ADR-0013](adr/ADR-0013-blueprint-foundation-adoption.md) for reconciliation decisions. Read [ADR-0014](adr/ADR-0014-shared-kernel-boundaries-and-determinism.md) as an explicit overlay on the original hash/freshness and role descriptions. All nine imported source files remain unchanged. Review follow-ups are tracked in [REVIEW_FOLLOWUPS](REVIEW_FOLLOWUPS.md).
