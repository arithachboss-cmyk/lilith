# Implementation status

Updated: 2026-09-24. Current task: **AMI-001 — AMI role registry and data contract**.

## Done

- Repository audit and supplied Blueprint reconciliation completed; all nine source files retain their original hashes.
- Isolated task branch/worktree based on published default branch `54b7ca1`; original local work and static prototype preserved.
- ARCH-001 implementation: two apps, seven packages, pnpm/Turborepo, strict TypeScript and enforced imports.
- Local build, typecheck and lint passed across all 9 workspaces; **84 boundary tests passed**. Forbidden Prisma/Next CLI probes correctly failed lint.
- Packaged standalone web/6 static assets returned HTTP 200; unconfigured compiled worker exited 78 with an explicit diagnostic.
- Hosted [foundation CI passed](https://github.com/arithachboss-cmyk/lilith/actions/runs/34160514958) on implementation commit `0957eb1`. Full evidence: [execution report](ARCH-001_REPORT.md).
- ARCH-001 merged as `762affe` (PR #2).
- AMI prototype merged as `514abf8` (PR #7): six post-login screens under `hr-screens/` plus the machine-readable handoff set in `hr-screens/codex/` (contract JSON, task cards, working agreement, acceptance criteria, recorded decisions D-AMI-01..04).
- AMI-001: `packages/contracts/src/ami/` — role registry, enums, panel payload types. `roles.ts` is generated from `hr-screens/codex/contract/role-registry.json` by `hr-screens/codex/build-contract.mjs`; the checker fails if the generated file is hand-edited.

## In Progress

- AMI-001 PR open against `codex/lilith-prototype`, awaiting review.
- PR #5 (ACS SEO governance) and PR #6 (Lili prototype and Brady brief) remain open; both green, no conflicts.

## Blocked

- Nothing blocks AMI-002 (bilingual UI strings) or AMI-003..007; D-AMI-01 and D-AMI-02 removed the login/auth dependency by scoping AMI to post-login screens only.
- The complete ARCH-005 pipeline remains unimplemented; the current `foundation` workflow is the ARCH-001 check only.

## Next

1. Merge AMI-001, then start AMI-002 (bilingual strings) and AMI-003..007 (screen implementation) against the merged contract.
2. Continue ARCH-002 → ARCH-003 → ARCH-004 → ARCH-005 in the specified order.
3. Implement data constraints before feature endpoints; demonstrate invalid writes failing directly in PostgreSQL.

## Open risks

- R-AMI-01: internal system names (THE KEEPER, MATCHMAKER-1, AMI Core, GROK-xx) appear in user-facing copy. Recorded, not blocking; owner may still rule on it.
- R-AMI-02: D-AMI-01..04 were recorded under the owner's instruction to proceed, not as four separate owner answers. Three of the four are marked reversible; the one that is not (the Keeper's position) follows the structure already in `docs/03`. Both risks are recorded in `hr-screens/codex/contract/decisions.json`.

## Deferred owner decisions

- Before DB-008: fee basis and payer.
- Before first live invoice: legal review of fee agreement and platform positioning.
- Before launch: retain, label as demo, or retire the public Lovable prototype.

**Platform production-ready: false.** No migrations, product authentication, matching, deal workflows, invoices or 38-screen E2E release gate are delivered by these tasks. `hr-screens/` is a prototype and is outside the pnpm workspace globs.
