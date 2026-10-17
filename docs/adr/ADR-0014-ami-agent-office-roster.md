# ADR-0014 — AMI agent office: 100 configured agents under the ten Grok leads

Status: proposed; owner review pending.
Date: 2026-10-16

## Context

The owner asked for the AMI organisation to be filled out to 100 agents, each with a duty, a team, a responsible person and a handoff route, without switching 100 agents on or adding running cost just to reach the number.

The AMI brief fixes six human roles (`HR-01`..`HR-06`) and ten Grok agents (`GROK-01`..`GROK-10`): six assigned to a role and four in a shared specialist pool. It also says no new positions are created. Neither the brief nor Blueprint v1.0 defines anything beyond those ten agents, so the shape of the other ninety is an interpretation and is recorded here.

## Decision

1. **Ten teams, one per Grok.** Each existing Grok leads exactly one team. No new Grok IDs are added. The 90 members use `AGT-001`..`AGT-090`. Team sizes vary with the work (8 to 16); the total is 100.
2. **No new human positions.** Every team has one responsible person drawn from the six existing roles. Teams led by a role's own Grok belong to that role. The four shared-pool teams still need someone accountable, so each has a steward:

   | Team | Lead | Steward | Why |
   |---|---|---|---|
   | T07 Listings and Verification | `GROK-03` VERIFIER | `HR-04` Intelligence | Same fact / hypothesis / evidence discipline |
   | T08 Deals and Closing | `GROK-05` NEGOTIATION | `HR-05` Matchmaker | Carries the relationship from match to close |
   | T09 Risk and Compliance | `GROK-06` RISK | `HR-01` Director | Risk acceptance sits with the top of the line of authority |
   | T10 Governance and Approvals | `GROK-09` GOVERNANCE | `HR-01` Director | Approvals and decision records sit with the Director |

   Any role can still request a shared-pool agent through AMI, as the brief requires. The steward reviews that team's output; stewardship grants no extra data access.
3. **Handoff routes end at a person, through a lead.** A member hands its draft to another agent, named by call sign. Only team leads hand off to a person: their team's responsible role. Every route therefore reaches a human, passes a team lead on the way, has no loop and is at most ten hops long. Members escalate to their own team lead; leads escalate to their responsible role.
4. **Configuration, not activation.** `hr-screens/office-data.js` holds configuration only: identity, team, duty and route. It has no model, endpoint, key, schedule, instance count or budget. Every agent stays `DEFINED_NOT_CONNECTED`, `provisioned_agents` is 0 and added running cost is `NONE`. The 100 entries are 100 configurations, not 100 processes or 100 connections. When the AI layer exists (AI-001 onward), an agent becomes a prompt-and-scope row run on demand by the existing worker, not a standing service.
5. **Activation is one agent at a time.** An activation request (`AGT-053` ACTIVATION-REQUEST) must carry eval results, an estimated cost and the owner's approval, and depends on AMI-003..005 (server-side permission and Keeper) being in place. Nothing in this change activates anything.
6. **Owner decisions are not invented.** Agents whose work touches fees (`AGT-008` REVENUE-OUTLOOK, `AGT-073` FEE-INVOICE) are marked `OWNER_DECISION_FEE_MODEL`. Agents that touch legal matters only flag and queue for Thai counsel; none gives an opinion or counts anything as approved.
7. **Boundaries carried over.** No call sign may contain `KEEPER` or `MATCHMAKER`, so nothing can be mistaken for the Confidentiality Gate. A duty that mentions the match score must say the score is read-only and never changed.

## Manual chat mode (added 2026-10-16)

The owner's operating idea is one chat per agent, with the agents working together by passing work between chats. Each agent therefore has a generated prompt (`hr-screens/codex/prompts/agents/<id>-<call sign>.md`, also copyable from `office.html`) built by `hr-screens/office-prompt.js` from the same roster data.

- Every prompt carries the same office rules: drafts only, no invented numbers, no self-scored matches, no personal contact data in handoffs, no fee calculation, no legal opinion.
- Each answer ends with one `=== HANDOFF ===` block whose `to:` is the agent's handoff target from the roster. A person copies it into the next chat, so a person sees every step and the last hop always reaches the responsible role.
- This is people using chat apps by hand, not a system connection: no API, no key, no service is wired up, and the roster stays `DEFINED_NOT_CONNECTED`. The index tells the owner to open one route's chats at a time, not all 100, because each chat uses the account's quota.
- Wording that depends on an unanswered question is never written into a draft as a stand-in. Agents keep the source wording or leave `[รอ Qn]`, and keep any conditional wording proposal outside the draft. In the third live run, two stand-in wordings each failed the next round; the owner approved this rule on 2026-10-17.
- Personal data is the real risk in this mode: chats sit outside the platform's Keeper and RLS. The prompts tell agents to use reference codes and refuse to repeat contact details, and the index tells the person to strip them before pasting.

## Enforcement

`hr-screens/codex/build-contract.mjs` generates `hr-screens/codex/contract/agent-roster.json` from `office-data.js`. `hr-screens/codex/check-contract.mjs` runs in CI and checks the roster against an expectation table it holds itself, not one read from the source: 100 agents, ten teams, `AGT-001`..`AGT-090` with no gaps, unique IDs, call signs, titles and duties, both languages present, the lead and steward table above, routes recomputed from `handoff_to`, no runtime fields in either the source or the JSON, no external URLs, and fee-touching duties carrying the blocker. It also checks the 100 prompt files: exactly one per agent plus the index, byte-identical to the generator, each naming its own ID, its roster handoff target in `to:`, its owner, both duty languages and every office rule, with no personal-data patterns, URLs or credential words. Mutation tests during development confirmed each of these fails when broken.

## Consequences

- The owner can reassign any steward by changing one line in `office-data.js` and the matching row in the checker; the decision is reversible.
- English titles and duties are drafts (`en_status: DRAFT_NEEDS_REVIEW`) and need review before they are shown to users. D-AMI-04 covered the six-screen strings only.
- The roster lives in the prototype contract set. Bringing it into `packages/contracts` (typed agent IDs, a read-only registry endpoint) is a separate task, AMI-008, and is not part of this change.
- Marketing has no dedicated human role; its agents sit in T05 under the Matchmaker. If the owner hires a marketing lead, that is a new position and needs its own decision first.
