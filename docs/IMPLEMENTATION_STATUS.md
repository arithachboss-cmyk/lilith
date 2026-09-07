# Implementation status

Updated: 2026-09-08. Current task: **ARCH-002 — Shared kernel**.

## Done

- ARCH-001 is merged: [PR #2](https://github.com/arithachboss-cmyk/lilith/pull/2), squash commit `762affefba84209a9a96263ef7f834ddc8e7fd7c`. Review was pinned to `9334a4e`; its [foundation CI passed](https://github.com/arithachboss-cmyk/lilith/actions/runs/34160754692).
- Two apps, seven packages, strict TypeScript and architectural import rules. Original dirty checkout and root prototype preserved.
- All nine supplied Blueprint sources remain unmodified; explicit amendments are recorded in ADRs.

- ARCH-002 acceptance passed locally and in [hosted CI](https://github.com/arithachboss-cmyk/lilith/actions/runs/34163931133) on implementation commit `32f81c1`: build/typecheck/lint across nine workspaces, 78 kernel tests (including 10,000 generated monetary round-trips), 88 boundary tests, three actual workspace lint probes and native source/compiled export checks. Measured runtime kernel coverage is 100%.
- ADR-0014 records localization/hash decisions and review follow-ups. Shared exports resolve, and tests participate in strict typecheck. [Full report](ARCH-002_REPORT.md).

## In Progress

- [Draft PR #3](https://github.com/arithachboss-cmyk/lilith/pull/3) awaits independent review/merge. Latest-head checks appear on the PR; documentation-only updates receive the same CI checks.
- Foundation CI remains separate from the unimplemented ARCH-005 pipeline.

## Blocked

- ARCH-003 must wait for ARCH-002 review/merge per handoff §30.0; it has not been started.
- No remaining owner business decision blocks ARCH-002.

## Next

1. Review and merge ARCH-002 PR #3 after its latest checks pass.
2. After merge, implement ARCH-003 → ARCH-004 → ARCH-005 in the specified order.
3. Implement database constraints and demonstrate invalid writes failing directly in PostgreSQL before product flows.

## Deferred owner decisions

- Before DB-008: fee basis and payer.
- Before first live invoice: legal review of fee agreement and platform positioning.
- Before launch: retain, label as demo, or retire the public Lovable prototype. No external handoff or prototype change was performed in this task.

**READY_FOR_REVIEW: true** (ARCH-002). **Platform production-ready: false.** No migrations, production authentication, matching, deals, fee workflow or full 38-screen E2E gate are delivered by this task.
