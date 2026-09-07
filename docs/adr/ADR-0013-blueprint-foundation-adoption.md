# ADR-0013 — Adopt Blueprint v1.0 in an isolated monorepo

Status: accepted for ARCH-001 implementation; review pending.
Date: 2026-09-08

## Context

The supplied Architecture Blueprint v1.0 supersedes earlier implementation assumptions. The published repository base, `54b7ca1`, contains a static operating prototype. The original local checkout also contains unpublished vinext/Cloudflare D1 work and unrelated user edits. Neither represents the specified production architecture.

## Decision

Build the specified pnpm/Turborepo layout on branch `feat/ARCH-001-monorepo-scaffold` in an isolated worktree based on the published default branch, `codex/lilith-prototype`. Preserve the root static assets and original local checkout. The new Next application lives in `apps/web`; it does not import or deploy the static prototype.

Use Next.js 15.5.25, a patched 15.x release, to follow Blueprint §19. Moving to another major version requires a separate compatibility review before production. Use Node 24 and pin the package manager and dependencies in the lockfile. Do not reuse the earlier D1 schema or matching/fee implementation. PostgreSQL, Prisma, authentication, domain contracts and UI functionality remain assigned to their specified tasks.

The ZIP documents are imported without content changes. Its root README is named `BLUEPRINT_README.md` to preserve the repository README. `docs/blueprint-source-manifest.json` records the source paths and hashes.

## Boundary interpretations

- Enforce API restrictions on both `apps/web/src/app/api/**` (actual layout) and the shorter `apps/web/app/api/**` spelling in §19.
- Only `packages/db` may import Prisma. Core repository adapters may consume the DB package; routes and core services must go through the appropriate domain/repository layer.
- Disallow bare framework imports as well as subpaths in core. AI may consume `core/shared`, but may not consume the core barrel or other domains.
- §10.1's AI HTTP surface refines §7's generic route-to-core guidance: authenticated API adapters/server composition may call AI after resolving authorization and resource projection through core. AI may use the DB wrapper for its runs, prompts, budgets and aliases (AI-001/003/005). Core does not import AI, avoiding a package cycle; web/worker composition connects the services. Client entrypoints cannot import core services or AI/server composition at runtime. Full transitive client/server bundle protection belongs to AI implementation and security gates.
- Check static imports, re-exports, type imports, dynamic imports, CommonJS require and relative workspace paths. An unresolved computed module import in governed code is rejected because its boundary cannot be checked.
- Score modules use a closed set of pure matching/shared modules and type-only contracts. Additional pure helpers live under `matching/pure/`, where the same restrictions apply. This extends a direct-import check to helper dependencies. Static lint is a guardrail, not a mathematical proof of runtime purity; deterministic behavior tests remain required by MATCH tasks.

## Consequences

ARCH-001 supplies executable build tooling and boundary tests, not a completed platform. Its small foundation CI job does not satisfy ARCH-005's integration, migration, environment and bundle gates. No deployment is configured. The worker fails explicitly until its database/queue task is implemented.

Do not start ARCH-002 before ARCH-001 merges. A task cannot be marked Done before its acceptance tests pass in CI. Fee basis/payer, legal approval for live invoices, and the public Lovable prototype disposition remain owner decisions at their documented gates.
