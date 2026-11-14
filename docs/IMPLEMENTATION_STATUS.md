# Implementation status

Updated: 2026-11-14. Current task: DB-003 (geo tables and the station seed) is implemented on the session's branch and has no PR yet. It is the first half of the vertical slice the owner asked for, searching locations and transit stations; the second half, SLICE-001, starts after DB-003 is merged. SKEL-001 (walking skeleton) merged as PR #19, ARCH-004 (database package and local stack) as PR #18, ARCH-003 (contracts package) as PR #17 and ARCH-002 (shared kernel) as PR #16. The AMI office merged as PR #9; prompt fixes from its live runs merged as PR #11 and PR #14; office facts OF-07 and OF-08 and the record of rounds 5–7 merged as PR #15. The content route has run seven rounds in live chats; the wording is settled and waits on Thai counsel, whom the owner has not yet found, and the pre-publication steps; ADR-0014 still waits on owner review.

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
  - On 2026-10-22 the owner answered by picking options in a question form, and the run record keeps each question and option verbatim. Q18 and Q21, shown with no recommendation, came back as before, so the draft does not change (Q46 closed). The owner adopted GP7 for later questions (Q47 ก); the relay applies it, and the prompts are unchanged. The owner also chose a second comparison against the live page text before publishing (Q45 ข).
  - The owner confirmed the L3 scope and GOVERNANCE's three fixes, and asked counsel to read the meta description and first paragraph too (LQ-16 ก). LEGAL-QUEUE and GOVERNANCE (2 chats) wrote that question as LQ-18; the owner kept it to viewing in person only, against both agents' recommendation (LQ-20 ข). The counsel brief now has eight topics, and the relay checked its 25 quoted lines against the round-7 draft. The owner has no Thai lawyer yet (Q30), so nothing can be sent.
  - Run transcripts are kept outside this public repository: they quote the owner's internal sales handbook, and whether that may be published is itself an open owner question (Q10).
  - Merged as `59cc36e` (PR #15) on 2026-11-14, at the owner's request, with `foundation` green on head `48dff63`. ADR-0014 also records that office facts are Thai prompt content and sit outside the `th`/`en` rule for UI strings; that reading is the ADR's, not an owner decision.

- ARCH-002 (shared kernel): `packages/core/shared/{result,errors,actor,money,ids,clock}.ts`, exported from `@lilith/core` and `@lilith/core/shared`. Interpretations are in ADR-0015.
  - Local verification (Node 22): 113 unit and property tests pass, including `fromBaht(format(x)) === x` and `fromBaht(formatBaht(x)) === x` over 10,000 random values each across the whole `BIGINT` range; 22 of 22 hand-made mutations of the kernel are caught; build, typecheck, lint and the 84 boundary tests pass.
  - CI (Node 24): hosted [foundation CI passed](https://github.com/arithachboss-cmyk/lilith/actions/runs/43532519111) on implementation commit `65314e6`, including the new `pnpm test:core` step with 113 of 113 tests.
  - The work is on the session's branch, not `feat/ARCH-002-shared-kernel`, because this session may push only to that branch.
  - Merged as `860a756` (PR #16) on 2026-11-14, at the owner's request, with `foundation` green on head `5612a20`.

- ARCH-003 (contracts package): `packages/contracts/src/{dto/*,errors.ts,events.ts,routes.ts,openapi.ts}` and the generated `packages/contracts/openapi.json`. Interpretations are in [ADR-0016](adr/ADR-0016-contracts-package.md).
  - What it holds: 228 named zod schemas; the route table of all 104 endpoints of §18; the 12 canonical error codes of §18.0 plus the 4 endpoint codes §18 uses; the event registry with 77 names; an OpenAPI 3.1 document with 104 operations.
  - Acceptance criteria:
    - `pnpm contracts:openapi` emits an OpenAPI 3.1 document, and `redocly lint` accepts it under its strict rule set, with two excused findings (the two `302` PDF routes of §18.8).
    - Every error code of §18.0 exists with its status.
    - `trackEvent('not_registered')` is a TypeScript error, checked by `@ts-expect-error` lines that `pnpm typecheck` compiles.
  - Local verification (Node 22): 143 tests pass.
    - 47 example payloads parse and come back with every member; those the blueprint shows are copied from it, and the rest are examples of the derived shapes.
    - The route table equals the list of every `METHOD /path` read from `docs/04-api-contracts.md`.
    - Parsing a private listing with the public schema removes every private value.
    - Satang converts to and from `bigint` without loss over 10,000 random values.
    - 71 of 71 hand-made faults in the package are caught.
    - `pnpm install --frozen-lockfile`, build, typecheck, lint, the 84 boundary tests, the 113 core tests, `pnpm contracts:check` and the AMI checker (5,901 checks) pass.
  - CI (Node 24): hosted [foundation CI passed](https://github.com/arithachboss-cmyk/lilith/actions/runs/43578806832) on head `ae47cd3`, including the two new steps: `pnpm test:contracts` with 143 of 143 tests, and `pnpm contracts:check`.
  - Not covered, by design: shapes the blueprint names without defining stay open, and 28 routes have no response schema because §18 gives none (ADR-0016 lists both). The work is on the session's branch, not `feat/ARCH-003-contracts`, because this session may push only to that branch.
  - Merged as `1f37e29` (PR #17) on 2026-11-14, at the owner's request, with `foundation` green on head `3fa6a62`.

- ARCH-004 (database package and local stack). Interpretations are in [ADR-0017](adr/ADR-0017-database-package.md).
  - What it holds:
    - `docker-compose.yml` and `packages/db/docker/Dockerfile`: PostgreSQL 16.15 with PostGIS 3.6.4 and pgvector 0.8.7, built from two official images pinned by digest, listening on `127.0.0.1:54329` only.
    - `packages/db/prisma/schema.prisma` and `prisma.config.ts`: Prisma 7.10.1 configured; no tables yet.
    - `packages/db/migrations/0001_extensions/migration.sql`: `postgis`, `vector`, `pgcrypto`, `pg_trgm` and `citext`.
    - `packages/db/client.ts`: `createDatabaseClient().withActor(userId, fn)`.
  - Acceptance criteria:
    - `docker compose up` then `pnpm db:migrate` succeeds, with no environment file.
    - `withActor` sets `app.user_id` for the length of one transaction, using the function form of `SET LOCAL`.
    - The five extensions are installed by the migration, into a database that starts with none.
  - Local verification (Node 22, Docker 29):
    - 27 tests pass: 6 need no database and 21 run against PostgreSQL. `app.user_id` is correct inside `withActor` and cleared outside, checked on the same connection; 40 concurrent transactions each see only their own actor.
    - 24 of 24 hand-made faults are caught, and an image built without the pgvector library makes the migration fail.
    - From a clean state (no image, no volume, no generated client): `pnpm install --frozen-lockfile`, build, typecheck, lint, the 84 boundary tests, the 113 core tests, the 143 contract tests, `pnpm contracts:check`, `pnpm db:up`, `pnpm db:migrate`, `pnpm test:db` and the AMI checker (5,901 checks) pass.
  - CI (Node 24): hosted [foundation CI passed](https://github.com/arithachboss-cmyk/lilith/actions/runs/43583593796) on head `e79882f`. Its log shows the image built from the Dockerfile, the container healthy, `pnpm db:migrate` applying `0001_extensions`, and `pnpm test:db` passing 6 and 21 tests.
  - Not covered, by design: no tables, no Row Level Security policies and no application database role yet (DB-001 onward, DB-010). The work is on the session's branch, not `feat/ARCH-004-database`, because this session may push only to that branch.
  - Merged as `b13ecbd` (PR #18) on 2026-11-14, at the owner's request, with `foundation` green on head `39ea7ac`.

- SKEL-001 (walking skeleton). The owner asked for it on 2026-11-14; it is not a Blueprint task. Scope and readings are in [ADR-0018](adr/ADR-0018-walking-skeleton.md).
  - What it holds: one path through every layer, `GET /api/health` of §18.10.
    - `apps/web/src/app/api/health/route.ts` and `apps/web/src/lib/server/`: the route adapter, with `X-Request-Id` on every response and the error envelope on failure.
    - `packages/core/system/`: the service that decides the answer, and its repository.
    - `packages/db/client.ts`: `probe()`, which reads the system catalogue only, and `getDatabaseClient()`.
    - `packages/contracts`: `HealthResponse` now names its values, so `openapi.json` changed.
    - The foundation page shows the same answer in Thai and English on every request.
  - What it shows: with the database up the route answers `status: ok`, `db: ok`; with it stopped, `status: degraded`, `db: unreachable`, still as a 200 and with no connection detail; after a restart it is `ok` again without restarting the web server. The job queue and the AI service are reported as `not_configured`.
  - Local verification (Node 22, Docker 29):
    - Tests: 16 new in core and 4 more against the database; 8 new in the database package; 15 in the web app, 5 of them through the real route; 3 new in contracts.
    - The real route is tested twice: against a migrated database, and with `DATABASE_URL` pointing at a port where nothing listens.
    - 31 of 31 hand-made faults are caught. The first run exposed one timing-dependent test of the new probe; it was rewritten to be deterministic, and each suite then passed 10 to 20 runs in a row.
    - Browser check on the production build: 19 of 19 checks pass, at 360 to 1440 px, with no console error and no request leaving the local server.
    - The full foundation validation passes, including `pnpm test:skeleton`.
  - CI (Node 24): hosted [foundation CI passed](https://github.com/arithachboss-cmyk/lilith/actions/runs/43589378998) on head `75ace4d`. Its log shows the new `pnpm test:skeleton` step passing 4 core tests against the database and 9 and 6 web tests.
  - Not covered, by design: login, tables, business features, the job queue, the AI service and storage. OPS-003 still owns the full health endpoint; until then this route must not gate a deployment.
  - Merged as `4ec30b9` (PR #19) on 2026-11-14, at the owner's request, with `foundation` green on head `0ca9521`.

## In Progress

- DB-003 (geo tables and the station seed) is implemented and pushed; it has no PR, so CI has not run on it. The owner's answers and this task's readings are in [ADR-0019](adr/ADR-0019-geo-tables-and-station-seed.md).
  - What it holds:
    - `packages/db/migrations/0004_geo/migration.sql`: `locations` and `transit_stations` of §8.2.2, with their indexes, constraints and the `updated_at` trigger; `schema.prisma` describes both.
    - `packages/db/seed/`: the 24 stations of the launch corridor and the 3 areas under Bangkok and Thailand, with fixed ids; `pnpm db:seed` writes them and is safe to repeat.
    - `packages/db/geo.ts`: `client.geo.nearestStations(origin, radiusMeters)`, a straight-line distance in whole metres.
  - Where the positions come from: the Department of Rail Transport's open dataset on the Ministry of Transport's catalogue, which the owner chose on 2026-11-14 after Wikidata proved precise for only 15 of the 24 stations. The seed rows were copied from the download by script.
  - Acceptance criteria:
    - BTS and MRT stations from On Nut to Ari are seeded with real coordinates: 15 BTS Sukhumvit line stations and 9 MRT Blue line stations.
    - The GiST indexes on `centroid`, `boundary` and `point` exist.
    - `nearestStations(point, 1500)` returns the right stations in the right order, compared from six origins with a calculation that shares no code with PostGIS.
    - Known distances from Thong Lo station to six fixed points hold to half a metre; the card asks for 50 metres.
  - Local verification (Node 22, Docker 29):
    - 154 tests pass in `packages/db`, 119 of them new: 28 need no database and 91 run against PostgreSQL.
    - Every seed station is within 50 metres of Wikidata's position at the 13 precisely placed elevated stations, and within 150 metres at the others.
    - Seeding twice changes no row; a renamed or moved row is put back; a blocked run writes nothing.
    - `prisma migrate diff` between the migrated database and `schema.prisma` is empty.
    - Hand-made faults: the first 40 of 131 have been run, the 39 in the migration and 1 in the query, and all 40 are caught. The other 91 have not been run yet.
    - The full foundation validation passes, including `pnpm db:migrate`, `pnpm db:seed` run twice, `pnpm test:db` (36 and 118 tests) and `pnpm test:skeleton`.
  - CI: not run. The foundation workflow runs on pull requests, and the new `pnpm db:seed` step is in it.
  - Not covered, by design: `property_transit`, which needs the `properties` table of DB-004; districts, subdistricts and area boundaries; the search service, routes and page of SLICE-001. The work is on the session's branch, not `feat/DB-003-geo`, because this session may push only to that branch.
- ADR-0015, ADR-0016, ADR-0017, ADR-0018 and ADR-0019 are **proposed**; their interpretations wait on owner review.
- ADR-0014 remains **proposed**: merging PR #9 approved the change, not the ADR's interpretations (R-AMI-03).
- `W-20261016-01` is paused at HR-01 after round 7 and the LQ-18 queue, with no failed checks and no wording waiting on an answer. It waits on the owner finding a Thai lawyer and sending the brief (Q30), counsel's answers, the pre-publication checks (Q44, Q45) and the owner's approval.

## Blocked

- Nothing blocks AMI-002 (bilingual UI strings) or AMI-003..007; D-AMI-01 and D-AMI-02 removed the login/auth dependency by scoping AMI to post-login screens only.
- The complete ARCH-005 pipeline remains unimplemented; the current `foundation` workflow runs only the checks that ARCH-001 to ARCH-004, SKEL-001 and DB-003 added.
- SLICE-001 waits on DB-003 being merged (one task, one PR; no task starts before its dependencies are merged).

## Next

1. Owner review of ADR-0014 (shared-team stewards, team split, English drafts), then AMI-002 (bilingual strings) and AMI-003..007 against the merged contract. AMI-008 brings the roster into `packages/contracts` after AMI-003.
2. `W-20261016-01`: the owner finds a Thai lawyer and sends the eight-topic brief (Q30); counsel's answers go back through the route; then PUBLISH-GATE compares the tag-free copy (Q44) and the live page text (Q45), the web person tests the button, and the owner approves.
3. DB-003: open a PR when the owner asks, and merge it on the owner's word once CI is green. Then SLICE-001: the search service in core, `GET /api/geo/search` and `GET /api/geo/stations` without login, and a search section on the foundation page that shows a straight-line distance in metres. ARCH-005 (the CI pipeline) remains the next Blueprint task.
4. Implement data constraints before feature endpoints; demonstrate invalid writes failing directly in PostgreSQL.

## Open risks

- R-AMI-01: internal system names (THE KEEPER, MATCHMAKER-1, AMI Core, GROK-xx) appear in user-facing copy. Recorded, not blocking; owner may still rule on it.
- R-AMI-02: D-AMI-01..04 were recorded under the owner's instruction to proceed, not as four separate owner answers. Three of the four are marked reversible; the one that is not (the Keeper's position) follows the structure already in `docs/03`. Both risks are recorded in `hr-screens/codex/contract/decisions.json`.
- R-AMI-03: the four shared-pool team stewards and the placement of marketing agents under the Matchmaker are interpretations (ADR-0014), not owner answers. So is applying the article-scoped answers behind OF-02..OF-05 to every job, and the "record both verdicts" tie rule. The owner's 2026-10-18 reply "ใช้ตามที่แนะนำ" named no letters; matching it to options, and checking advice across the whole article under OF-07, are the relay's readings, recorded with both messages verbatim in the run record. English agent titles, duties and `office.*` UI strings are drafts pending review.
- R-AMI-04: in manual chat mode, client data typed into third-party chats sits outside the Keeper and RLS. Prompts and the index forbid contact details and ID numbers, but enforcement is the person's discipline, not code.
- R-AMI-05: manual chat mode is slow to relay. One content round is six chats, 42–53 minutes, and HANDOFF blocks now reach 30k characters, which is heavy to copy by hand on a phone. A note a person adds is only traceable when it is the owner's words, pasted verbatim into `sources:`.

- R-GEO-01: the terms of use of the station data are not spelled out. The catalogue labels the dataset "Open Data Common", classes it as public data and states no access condition, and it links no licence text. Nobody has confirmed that this covers a commercial product (ADR-0019).
- R-GEO-02: a station is one point. At the two underground stations with a precise second source, the two sources are 82 and 144 metres apart. A distance to a station is good to about 100 metres and is never a walking distance.
- R-GEO-03: Thai name search depends on the database's locale; under the `C` locale it finds nothing. The local database is tested; a hosted one is not chosen yet.

## Deferred owner decisions

- Before DB-008: fee basis and payer.
- Before first live invoice: legal review of fee agreement and platform positioning.
- Before launch: retain, label as demo, or retire the public Lovable prototype.
- Before station distances are shown to the public: confirm the terms of use of the Department of Rail Transport dataset (R-GEO-01).
- Before publishing the first article from the content route:
  - the owner's permission to describe internal process (Q10);
  - Thai counsel on recording calls, filming common areas and consumer-facing wording (L1–L3);
  - a check that the LINE OA account in the call to action belongs to the company (the owner confirmed it on 2026-10-17).

**Platform production-ready: false.** Two reference tables exist and nothing else of the data model. No product authentication, matching, deal workflows, invoices or 38-screen E2E release gate are delivered by these tasks. `hr-screens/` is a prototype and is outside the pnpm workspace globs.
