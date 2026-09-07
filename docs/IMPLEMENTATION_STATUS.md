# Implementation status

Updated: 2026-09-08. Current task: **ARCH-002 — Shared kernel**.

## Done

- ARCH-001 is merged: [PR #2](https://github.com/arithachboss-cmyk/lilith/pull/2), squash commit `762affefba84209a9a96263ef7f834ddc8e7fd7c`. Review was pinned to `9334a4e`; its [foundation CI passed](https://github.com/arithachboss-cmyk/lilith/actions/runs/34160754692).
- Two apps, seven packages, strict TypeScript and architectural import rules. Original dirty checkout and root prototype preserved.
- All nine supplied Blueprint sources remain unmodified; explicit amendments are recorded in ADRs.

## In Progress

- ARCH-002 kernel implemented in an isolated branch: Result, DomainError, ActorContext, Money, UUID generation and injectable Clock.
- ADR-0014 and review follow-ups recorded; core/worker i18n imports, real core subpath exports and test typechecking implemented.
- Kernel unit/property tests passed locally: 78 tests, including 10,000 generated signed-int64 round-trips. Full monorepo validation passed locally: build/typecheck/lint, 88 boundary tests, three real-file lint probes and source/compiled export checks. Hosted CI is pending; task acceptance is not yet marked Done.
- Foundation CI remains separate from the unimplemented ARCH-005 pipeline.

## Blocked

- ARCH-003 must wait for ARCH-002 review/merge per handoff §30.0; it has not been started.
- No remaining owner business decision blocks ARCH-002.

## Next

1. Complete ARCH-002 validation and submit its own reviewable PR with evidence.
2. After merge, implement ARCH-003 → ARCH-004 → ARCH-005 in the specified order.
3. Implement database constraints and demonstrate invalid writes failing directly in PostgreSQL before product flows.

## Deferred owner decisions

- Before DB-008: fee basis and payer.
- Before first live invoice: legal review of fee agreement and platform positioning.
- Before launch: retain, label as demo, or retire the public Lovable prototype. No external handoff or prototype change was performed in this task.

**READY_FOR_REVIEW: false** (ARCH-002 validation in progress). **Platform production-ready: false.** No migrations, production authentication, matching, deals, fee workflow or full 38-screen E2E gate are delivered by this task.
