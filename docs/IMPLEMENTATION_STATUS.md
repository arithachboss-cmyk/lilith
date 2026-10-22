# Implementation status

Updated: 2026-10-18. Current task: none in flight. The AMI office merged as PR #9; prompt fixes from its live runs merged as PR #11 and PR #14. The content route has run seven rounds in live chats; the wording is settled and waits on Thai counsel, one owner re-confirmation and the pre-publication steps; ADR-0014 still waits on owner review.

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
  - After round 4 the owner answered seven more questions, confirmed the LINE OA account is the company's, and approved the other two prompt changes:
    - one four-level verdict scale for every check; when steps disagree, both verdicts are recorded and the person decides;
    - owner-confirmed standing facts and preferred terms in `hr-screens/office-facts.js` (OF-01..OF-06 at the time; OF-07..OF-08 added after round 5), attached to every prompt. Each fact carries the owner's answer and date, and the checker pins the expected ids.
    - With all three rules: 5,691 checks pass; 23 of 23 mutations are caught; the office page's copied prompt matches the generated file. Merged as `4cd379f` (PR #14).
  - Round 5 (6 chats, about 53 minutes) ran on those prompts. **No step recorded a failure.** Office facts closed the wording questions, and where two steps disagreed, both verdicts were recorded for the person to decide. PUBLISH-GATE: not ready, with 9 items waiting on owner answers; 0 approvals; nothing published or sent.
  - A parallel legal route (LEGAL-QUEUE → GOVERNANCE, 2 chats) prepared the L1–L2 questions for Thai counsel, quoting the draft's wording verbatim. The relay checked that the quoted wording matches the round-5 draft. Nothing has been sent to counsel.
  - Lessons: a standing fact applied everywhere can still shift meaning in one place. Changing every "ลูกค้า" to "คุณ" turned "only clients ready to decide" into "when you are ready", which the checks caught (Q36). And a criterion that lives only in one round's HANDOFF is lost to later steps (Q16), so rules that apply to every job belong in office facts.
  - After round 5 the owner accepted the eleven recommended options with "ใช้ตามที่แนะนำ" and answered Q41 directly. Two of the answers apply to every job and became office facts: OF-07, FACT-CHECK's criterion for general advice, and OF-08, the house tone. The checker now runs 5,901 checks; 23 of 23 mutations are still caught (commit `b8f8e6a`, not yet in a PR).
  - Round 6 (6 chats, about 51 minutes) applied all twelve answers. **No step recorded a failure for the second round running.** The advice sections pass against OF-07 and the tone passes against OF-08. The relay confirmed by script that the draft changed only where the answers said. Still open: Q18 and Q43 (wording), Q21, Q22 and Q44 (pre-publication steps), and 12 items that wait on Thai counsel. PUBLISH-GATE: not ready; 0 approvals; nothing published or sent.
  - The L1–L2 questions for counsel now include section 3 (Q40). The relay checked that all 12 quoted lines match the round-6 draft. L3 (title, service section, call to action) waits on Q18 and Q43 so it can go as one set.
  - Round 7 (6 chats, about 42 minutes) changed only tags and notes after the owner's next answers; the 38 reader-facing lines are identical to round 6, checked by script. **No failures for the third round running, and no wording waits on an answer.** In parallel, LEGAL-QUEUE and GOVERNANCE queued the L3 questions (LQ-08..LQ-14); GOVERNANCE sent back three explanatory phrases that went beyond the sources and proposed fixes. The relay merged L1–L3 into one counsel brief and checked its 23 quoted lines against the round-7 draft.
  - Before publication a script strips the trace tags (Q44). It counts nested brackets and refuses output that still holds a bracket, "@" or a tag code; PUBLISH-GATE set five output criteria for the stripped copy, and the relay's dry run meets them. PUBLISH-GATE's own comparison comes after counsel answers.
  - Lesson: GOVERNANCE noticed that the owner's last reply matched the example line in the relay's question character for character, including two answers only the owner can give (Q18, Q21), so it asked the owner to type them again (Q46). It proposed that examples never pre-fill owner-only answers and that questions to the owner be in Thai (GP7, Q47).
  - Run transcripts are kept outside this public repository: they quote the owner's internal sales handbook, and whether that may be published is itself an open owner question (Q10).

## In Progress

- Nothing in flight. ADR-0014 remains **proposed**: merging PR #9 approved the change, not the ADR's interpretations (R-AMI-03).
- `W-20261016-01` is paused at HR-01 after round 7, with no failed checks and no wording waiting on an answer. It waits on the owner re-typing Q18 and Q21 (Q46), the owner sending the L1–L3 brief to Thai counsel (Q30, LQ-16, GVL3-Q2), the pre-publication checks (Q44, Q45) and the owner's approval.

## Blocked

- Nothing blocks AMI-002 (bilingual UI strings) or AMI-003..007; D-AMI-01 and D-AMI-02 removed the login/auth dependency by scoping AMI to post-login screens only.
- The complete ARCH-005 pipeline remains unimplemented; the current `foundation` workflow is the ARCH-001 check only.

## Next

1. Owner review of ADR-0014 (shared-team stewards, team split, English drafts), then AMI-002 (bilingual strings) and AMI-003..007 against the merged contract. AMI-008 brings the roster into `packages/contracts` after AMI-003.
2. `W-20261016-01`: the owner confirms Q18 and Q21 (Q46) and sends the L1–L3 brief to Thai counsel; counsel's answers go back through the route; then PUBLISH-GATE compares the tag-free copy (Q44), the web person tests the button, and the owner approves.
3. Continue ARCH-002 → ARCH-003 → ARCH-004 → ARCH-005 in the specified order.
4. Implement data constraints before feature endpoints; demonstrate invalid writes failing directly in PostgreSQL.

## Open risks

- R-AMI-01: internal system names (THE KEEPER, MATCHMAKER-1, AMI Core, GROK-xx) appear in user-facing copy. Recorded, not blocking; owner may still rule on it.
- R-AMI-02: D-AMI-01..04 were recorded under the owner's instruction to proceed, not as four separate owner answers. Three of the four are marked reversible; the one that is not (the Keeper's position) follows the structure already in `docs/03`. Both risks are recorded in `hr-screens/codex/contract/decisions.json`.
- R-AMI-03: the four shared-pool team stewards and the placement of marketing agents under the Matchmaker are interpretations (ADR-0014), not owner answers. So is applying the article-scoped answers behind OF-02..OF-05 to every job, and the "record both verdicts" tie rule. The owner's 2026-10-18 reply "ใช้ตามที่แนะนำ" named no letters; matching it to options, and checking advice across the whole article under OF-07, are the relay's readings, recorded with both messages verbatim in the run record. English agent titles, duties and `office.*` UI strings are drafts pending review.
- R-AMI-04: in manual chat mode, client data typed into third-party chats sits outside the Keeper and RLS. Prompts and the index forbid contact details and ID numbers, but enforcement is the person's discipline, not code.
- R-AMI-05: manual chat mode is slow to relay. One content round is six chats, 42–53 minutes, and HANDOFF blocks now reach 30k characters, which is heavy to copy by hand on a phone. A note a person adds is only traceable when it is the owner's words, pasted verbatim into `sources:`.

## Deferred owner decisions

- Before DB-008: fee basis and payer.
- Before first live invoice: legal review of fee agreement and platform positioning.
- Before launch: retain, label as demo, or retire the public Lovable prototype.
- Before publishing the first article from the content route:
  - the owner's permission to describe internal process (Q10);
  - Thai counsel on recording calls, filming common areas and consumer-facing wording (L1–L3);
  - a check that the LINE OA account in the call to action belongs to the company (the owner confirmed it on 2026-10-17).

**Platform production-ready: false.** No migrations, product authentication, matching, deal workflows, invoices or 38-screen E2E release gate are delivered by these tasks. `hr-screens/` is a prototype and is outside the pnpm workspace globs.
