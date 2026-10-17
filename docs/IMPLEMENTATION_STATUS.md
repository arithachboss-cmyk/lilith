# Implementation status

Updated: 2026-10-17. Current task: none in flight. The AMI office merged as PR #9 and the prompt fixes from its first live runs as PR #11. The content route has now run four rounds in live chats and waits on owner answers; ADR-0014 still waits on owner review.

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
- Live runs of the content starter route (`W-20261016-01`: SEO-WRITER → CLAIM-REGISTER → FACT-CHECK → BRAND-VOICE → PUBLISH-GATE → GOVERNANCE → HR-01). Each agent ran in its own AI session with only its generated prompt and the pasted message; a relay standing in for the person copied each HANDOFF block and checked it for the right `to:`, a non-empty `work:`, verbatim `sources:` and personal-data patterns.
  - Rounds 1–2 found prompt gaps; the fixes merged as `096a792` (PR #11): a `work:` field for the deliverable, a shorter HANDOFF, verbatim `sources:`, BRAND-VOICE on the route, and failed checks recorded and passed on with approval left to the person at the end.
  - Round 3 (6 chats, about 44 minutes) ran on the merged prompts. Every hop passed the work on without escalating, including FACT-CHECK, which had escalated in rounds 1 and 2. Sources stayed verbatim across all six hops; no personal data, prices or fees appeared; PUBLISH-GATE ruled the draft not ready; 0 approvals; nothing was published or sent.
  - The remaining failures all wait on owner answers: wording written ahead of an answer failed in the next round, and open questions grew from 24 to 31. HANDOFF blocks ran 14k–24k characters per hop.
  - The owner then answered eight questions and approved one prompt rule: wording that depends on an unanswered question is never written into a draft as a stand-in (kept as source wording or `[รอ Qn]`). The rule is in all 100 prompts and pinned by the checker (4,758 checks; 19 of 19 mutations caught).
  - Round 4 (6 chats, about 47 minutes) used those answers. Promise-like wording fell from 3 failures to 0. FACT-CHECK's failed or not-yet-passed items fell from 9 to 2 failures plus 2 parts left blank pending answers (Q11, Q17); round 4 grades general advice separately, so the scales are not identical. Both remaining failures are word choices that differ from the source and wait on the owner (Q3, Q32). PUBLISH-GATE: not ready; 0 approvals; nothing published or sent.
  - Run transcripts are kept outside this public repository: they quote the owner's internal sales handbook, and whether that may be published is itself an open owner question (Q10).

## In Progress

- Nothing in flight. ADR-0014 remains **proposed**: merging PR #9 approved the change, not the ADR's interpretations (R-AMI-03).
- `W-20261016-01` is paused at HR-01 after round 4. It waits on owner answers to five short questions (Q3, Q11, Q17, Q32, Q34), a check that the LINE OA account is the company's (Q22), and Thai counsel on L1–L3 (Q30).

## Blocked

- Nothing blocks AMI-002 (bilingual UI strings) or AMI-003..007; D-AMI-01 and D-AMI-02 removed the login/auth dependency by scoping AMI to post-login screens only.
- The complete ARCH-005 pipeline remains unimplemented; the current `foundation` workflow is the ARCH-001 check only.

## Next

1. Owner review of ADR-0014 (shared-team stewards, team split, English drafts), then AMI-002 (bilingual strings) and AMI-003..007 against the merged contract. AMI-008 brings the roster into `packages/contracts` after AMI-003.
2. `W-20261016-01`: get the remaining owner answers, then a short fix round. GOVERNANCE proposed that only the changed points be re-checked (GV4-02). Of the three prompt changes proposed after round 3, the owner approved the first: no stand-in wording. The other two still await approval:
   - use one verdict scale across agents. In round 4, CLAIM-REGISTER and FACT-CHECK still graded the same claims differently;
   - attach owner-confirmed standing office facts and preferred terms to every job. This would close wording questions such as Q3, Q32 and Q34 once for every job.
3. Continue ARCH-002 → ARCH-003 → ARCH-004 → ARCH-005 in the specified order.
4. Implement data constraints before feature endpoints; demonstrate invalid writes failing directly in PostgreSQL.

## Open risks

- R-AMI-01: internal system names (THE KEEPER, MATCHMAKER-1, AMI Core, GROK-xx) appear in user-facing copy. Recorded, not blocking; owner may still rule on it.
- R-AMI-02: D-AMI-01..04 were recorded under the owner's instruction to proceed, not as four separate owner answers. Three of the four are marked reversible; the one that is not (the Keeper's position) follows the structure already in `docs/03`. Both risks are recorded in `hr-screens/codex/contract/decisions.json`.
- R-AMI-03: the four shared-pool team stewards and the placement of marketing agents under the Matchmaker are interpretations (ADR-0014), not owner answers. English agent titles, duties and `office.*` UI strings are drafts pending review.
- R-AMI-04: in manual chat mode, client data typed into third-party chats sits outside the Keeper and RLS. Prompts and the index forbid contact details and ID numbers, but enforcement is the person's discipline, not code.
- R-AMI-05: manual chat mode is slow to relay. One content round is six chats, about 44 minutes, and HANDOFF blocks of up to 24k characters, which is heavy to copy by hand on a phone. A note a person adds is only traceable when it is the owner's words, pasted verbatim into `sources:`.

## Deferred owner decisions

- Before DB-008: fee basis and payer.
- Before first live invoice: legal review of fee agreement and platform positioning.
- Before launch: retain, label as demo, or retire the public Lovable prototype.
- Before publishing the first article from the content route:
  - the owner's permission to describe internal process (Q10);
  - Thai counsel on recording calls, filming common areas and consumer-facing wording (L1–L3);
  - a check that the LINE OA account in the call to action belongs to the company.

**Platform production-ready: false.** No migrations, product authentication, matching, deal workflows, invoices or 38-screen E2E release gate are delivered by these tasks. `hr-screens/` is a prototype and is outside the pnpm workspace globs.
