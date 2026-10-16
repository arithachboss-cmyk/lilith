# Implementation status

Updated: 2026-10-16. Current task: none in flight. The AMI office merged as PR #9; the next step is the owner's review of ADR-0014.

## Done

- Repository audit and supplied Blueprint reconciliation completed; all nine source files retain their original hashes.
- Isolated task branch/worktree based on published default branch `54b7ca1`; original local work and static prototype preserved.
- ARCH-001 implementation: two apps, seven packages, pnpm/Turborepo, strict TypeScript and enforced imports.
- Local build, typecheck and lint passed across all 9 workspaces; **84 boundary tests passed**. Forbidden Prisma/Next CLI probes correctly failed lint.
- Packaged standalone web/6 static assets returned HTTP 200; unconfigured compiled worker exited 78 with an explicit diagnostic.
- Hosted [foundation CI passed](https://github.com/arithachboss-cmyk/lilith/actions/runs/34160514958) on implementation commit `0957eb1`. Full evidence: [execution report](ARCH-001_REPORT.md).
- ARCH-001 merged as `762affe` (PR #2).
- AMI prototype merged as `514abf8` (PR #7): six post-login screens under `hr-screens/` plus the machine-readable handoff set in `hr-screens/codex/` (contract JSON, task cards, working agreement, acceptance criteria, recorded decisions D-AMI-01..04).
- AMI-001: `packages/contracts/src/ami/` — role registry, enums, panel payload types. `roles.ts` is generated from `hr-screens/codex/contract/role-registry.json` by `hr-screens/codex/build-contract.mjs`; the checker fails if the generated file is hand-edited. Merged as `6c09765` (PR #8).
- AMI office (prototype + contract), merged as `49c3786` (PR #9); [foundation CI passed](https://github.com/arithachboss-cmyk/lilith/actions/runs/38912603147) on head `ea86810`: `hr-screens/office-data.js` defines 100 agents in 10 teams — the ten existing Groks as team leads plus `AGT-001`..`AGT-090` — each with a duty (th/en), a team, a responsible role from the existing six and a handoff route that ends at a person through a team lead. `office.html` renders it. `agent-roster.json` is generated and checked in CI: count, uniqueness, lead/steward table, recomputed routes, no runtime fields, no connected agent, fee work blocked on the owner decision. Configuration only: 0 agents provisioned, no added running cost. Interpretation recorded in [ADR-0014](adr/ADR-0014-ami-agent-office-roster.md).
- AMI office manual chat mode: one generated prompt per agent in `hr-screens/codex/prompts/agents/` (100 files + index), built by `hr-screens/office-prompt.js` and copyable from `office.html`. Agents pass work between chats with a `=== HANDOFF ===` block a person copies, so routes still end at the responsible role and nothing is connected. The checker verifies all 100 prompts against the roster.
- AMI office 3D build prompt: `hr-screens/codex/prompts/office-3d-build-prompt.md` is a paste-ready prompt for an AI app builder to make an isometric view of the same roster. It requires honest state: 0 connected, and no running counts, task metrics, tool connections, costs or agent chat.

## In Progress

- Nothing in flight. ADR-0014 remains **proposed**: merging PR #9 approved the change, not the ADR's interpretations (R-AMI-03).

## Blocked

- Nothing blocks AMI-002 (bilingual UI strings) or AMI-003..007; D-AMI-01 and D-AMI-02 removed the login/auth dependency by scoping AMI to post-login screens only.
- The complete ARCH-005 pipeline remains unimplemented; the current `foundation` workflow is the ARCH-001 check only.

## Next

1. Owner review of ADR-0014 (shared-team stewards, team split, English drafts), then AMI-002 (bilingual strings) and AMI-003..007 against the merged contract. AMI-008 brings the roster into `packages/contracts` after AMI-003.
2. Run one starter route from `hr-screens/codex/prompts/agents/README.md` in real chats and adjust `hr-screens/office-prompt.js` from the results; no route has been tried in a live chat yet.
3. Continue ARCH-002 → ARCH-003 → ARCH-004 → ARCH-005 in the specified order.
4. Implement data constraints before feature endpoints; demonstrate invalid writes failing directly in PostgreSQL.

## Open risks

- R-AMI-01: internal system names (THE KEEPER, MATCHMAKER-1, AMI Core, GROK-xx) appear in user-facing copy. Recorded, not blocking; owner may still rule on it.
- R-AMI-02: D-AMI-01..04 were recorded under the owner's instruction to proceed, not as four separate owner answers. Three of the four are marked reversible; the one that is not (the Keeper's position) follows the structure already in `docs/03`. Both risks are recorded in `hr-screens/codex/contract/decisions.json`.
- R-AMI-03: the four shared-pool team stewards and the placement of marketing agents under the Matchmaker are interpretations (ADR-0014), not owner answers. English agent titles, duties and `office.*` UI strings are drafts pending review.
- R-AMI-04: in manual chat mode, client data typed into third-party chats sits outside the Keeper and RLS. Prompts and the index forbid contact details and ID numbers, but enforcement is the person's discipline, not code.

## Deferred owner decisions

- Before DB-008: fee basis and payer.
- Before first live invoice: legal review of fee agreement and platform positioning.
- Before launch: retain, label as demo, or retire the public Lovable prototype.

**Platform production-ready: false.** No migrations, product authentication, matching, deal workflows, invoices or 38-screen E2E release gate are delivered by these tasks. `hr-screens/` is a prototype and is outside the pnpm workspace globs.
