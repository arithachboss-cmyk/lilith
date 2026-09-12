# REAL LEAD READINESS REPORT — Middle Property

Date: 2026-09-13 · Owner: Arithach · LINE OA: `@middleproperty` · Owner-approved business telephone: `0933888594`

## Executive Summary

**Decision: NO-GO FOR REAL LEADS.** The mock journey now covers Landing → language/requirements → consent → unique Lead ID → persisted images → correlated mock notification → Operations Inbox → viewing-ready. Exact-SHA local and GitHub CI verification of the repaired source passed **26 unit, 25 integration and 14 browser tests**. Manus independently returned **PASS for fixed mock readiness**, including the formerly failing no-delay race; it retained **NO-GO / BLOCKED for real leads**.

Independent QA found a real defect after the original tests passed: a second click could land on an enabled Reopen control during save and discard four staged images. Codex reproduced both persisted image loss and stale UI replacement, fixed the shared cause, and added deterministic regression tests. Earlier green tests and Claude's earlier source approval did not prove this defect absent.

Actual notification destination/operator authorization, trusted hosted identity boundaries, durable data lifecycle, Claude review of the repaired SHA and explicit Owner pilot approval remain prerequisites. This build has no real-intake mode or external notification delivery. No real lead, production deployment, external test contact, DNS/email change, or paid traffic was created by this execution.

## Repository and Evidence Identity

| Item | Verified value |
|---|---|
| Repository | https://github.com/arithachboss-cmyk/lilith |
| Branch | `codex/real-lead-readiness-20260913` |
| **Exact repaired implementation SHA** | `bee6a6e93a88820bba0d709c8356092c65cfae75` |
| Draft PR | https://github.com/arithachboss-cmyk/lilith/pull/4 |
| PR head repository | `the-middle-th/lilith` review fork; source branch also pushed to origin |
| Original committed base | `2ff8ce7f933217a4b8ee92054cdd0f42bd83b12a` |
| Inherited application snapshot | `1fdae501966b32c17171b5092681ebed1f46f713`; [baseline inventory](docs/READINESS_BASELINE.json) |
| Earlier defective source | `8bd0e3d7a223db392e55c5f2533451bff716a464`; historical evidence retained separately |
| Local verification | Node 24, compiled Worker + temporary file-backed SQLite, Chrome desktop and mobile/touch emulation |
| CI for repaired source | **PASS** — [origin run 34721355860](https://github.com/arithachboss-cmyk/lilith/actions/runs/34721355860); [metadata](evidence/real-lead-readiness/bee6a6e93a88820bba0d709c8356092c65cfae75/github-ci-run.json), [CI manifest](evidence/real-lead-readiness/bee6a6e93a88820bba0d709c8356092c65cfae75/ci/manifest.json). Controller `6d9b70531f480ad59e0b5f350b332819f5459414` explicitly checked out/asserted repaired source `bee6a6e93a88820bba0d709c8356092c65cfae75`. |
| Preview | Isolated loopback only. `/api/pilot/build` bakes the source SHA and reports closed real-lead/traffic flags. [Captured build identity](evidence/real-lead-readiness/bee6a6e93a88820bba0d709c8356092c65cfae75/build-identity.json). The temporary local server was stopped and its database removed; no hosted production preview was published. |

The original workspace contained extensive uncommitted application work. It was preserved as a named inherited snapshot in a separate worktree at `/Users/arithachbossabc/Documents/lilith-readiness`; the original workspace was not edited. The PR includes that substantial baseline, not just the readiness delta. Later evidence and CI-controller commits are not new tested product SHAs.

## P0 Gate Matrix

PASS here is limited to the named mock checks. It does not waive independent review, hosted evidence or Owner approval.

| Gate | Owner | Status | Evidence | Blocker |
|---|---|---|---|---|
| P0-01 Lead Persistence | Codex | PASS — local/CI + Manus mock | [Integration](evidence/real-lead-readiness/bee6a6e93a88820bba0d709c8356092c65cfae75/integration.log), [browser](evidence/real-lead-readiness/bee6a6e93a88820bba0d709c8356092c65cfae75/browser.log) | Hosted D1/session behavior remains unverified for real activation. |
| P0-02 Consent | Lovable / Codex | PASS — Codex + Manus mock UX | [Desktop](evidence/real-lead-readiness/bee6a6e93a88820bba0d709c8356092c65cfae75/desktop-consent.png), [mobile](evidence/real-lead-readiness/bee6a6e93a88820bba0d709c8356092c65cfae75/mobile-consent.png), [200% text](evidence/real-lead-readiness/bee6a6e93a88820bba0d709c8356092c65cfae75/mobile-200-percent.png) | Mobile evidence uses Chrome emulation; no physical iOS/Safari certification. |
| P0-03 Image Persistence | Codex / Lovable | PASS — repaired local/CI + Manus mock | [Save/reopen exclusion regression](evidence/real-lead-readiness/bee6a6e93a88820bba0d709c8356092c65cfae75/reopen-race-fixed.png), [200% double-click](evidence/real-lead-readiness/bee6a6e93a88820bba0d709c8356092c65cfae75/mobile-200-double-click.png), browser log | [Manus independently closed D1](evidence/real-lead-readiness/bee6a6e93a88820bba0d709c8356092c65cfae75/manus-review-fixed.txt). Old source remains historical REVISE. Only validated non-interlaced 8-bit PNG, ≤128 KiB each, maximum 4, is supported. |
| P0-04 Operations Inbox | Codex / Director | **BLOCKED — OWNER AUTHORIZATION REQUIRED** | [Mock inbox](evidence/real-lead-readiness/bee6a6e93a88820bba0d709c8356092c65cfae75/desktop-operations.png), integration log | Real endpoint and operator account IDs/roles remain unconfirmed. Phone/OA do not authorize recipients. |
| P0-05 Canonical CTA | Codex | PASS — reviewed mock Landing/pilot surfaces | [Landing](evidence/real-lead-readiness/bee6a6e93a88820bba0d709c8356092c65cfae75/landing.png), browser log | Production surfaces were not deployed/certified; calls/LINE clicks are simulated. |
| P0-06 Attribution | Codex | PASS — local debug events | Integration/browser logs | No real analytics/ad platform activated. Allowlisted UTM strings are not guaranteed PII-free. |
| P0-07 Security | Manus / Claude | **BLOCKED — Critical hosted identity risk unresolved** | [Reproducible pattern scan](evidence/real-lead-readiness/bee6a6e93a88820bba0d709c8356092c65cfae75/security-pattern-scan.json), authorization/cross-lead tests, Claude F1 | Raw identity headers require verified trusted ingress or cryptographic identity validation. Automatic NO-GO. Durable retention/deletion and hosted access rules remain incomplete. |

## Verified Facts

- A random capability binds each draft to a unique Lead ID. Unique constraints and payload hashing deduplicate concurrent submissions/retries; changed-payload retry conflicts. A single database batch commits Lead, outbox and submit event; injected failure rolls back all three.
- Lead IDs alone grant no reads. Same unexpired capability or authorized mock operator is required. File-backed database reopen preserved records and image bytes in testing.
- Consent is affirmative and not prechecked. Missing/false/wrong-version consent cannot create a session, image or Lead; consent time/version are recorded by the server. Decline clears an unsaved form.
- A database trigger enforces four images even under concurrent uploads. Image bytes and references share the same private database record. Upload IDs support retries; ownership checks prevent cross-draft reads/writes; post-submit changes are denied.
- **The repair locks Reopen/New during save, image processing and restoration**, with handler guards as well as disabled controls. Controls retain their layout during save. Restoration displays a loading state until records and image bodies are ready.
- Mock notification IDs correlate with the Lead ID. Authorized fixture operations can qualify and mark viewing-ready; compare-and-set/trigger protection prevents stale downgrade and milestone events retain actor identity.
- Canonical contacts are Middle Property, `@middleproperty`, and `0933888594`. Landing → pilot retains UTM. No real call/message occurs from preview contacts.
- Debug events preserve source/medium/campaign, landing locale, first and last touch. Raw URLs/query strings and arbitrary extra event fields are rejected; allowed UTM values remain untrusted. Qualification/viewing milestones are generated server-side.
- [Pattern scanner](evidence/real-lead-readiness/bee6a6e93a88820bba0d709c8356092c65cfae75/security-scan.mjs) found zero credential candidates in 138 UTF-8 source/client-build files. JSON records command, rule patterns, scanner/input hashes and scope. This is not a complete secret or hosted security audit.

## Test Commands and Results

Exact-SHA command: `PLAYWRIGHT_CHANNEL=chrome node scripts/verify-readiness.mjs` on clean committed source `bee6a6e93a88820bba0d709c8356092c65cfae75`.

| Command | Result | Evidence |
|---|---|---|
| `pnpm typecheck` | PASS, exit 0 | [Log](evidence/real-lead-readiness/bee6a6e93a88820bba0d709c8356092c65cfae75/typecheck.log) |
| `pnpm lint` | PASS, exit 0; two inherited generated-file warnings | [Log](evidence/real-lead-readiness/bee6a6e93a88820bba0d709c8356092c65cfae75/lint.log) |
| `pnpm test:unit` | PASS, 26 | [Log](evidence/real-lead-readiness/bee6a6e93a88820bba0d709c8356092c65cfae75/unit.log) |
| `MIDDLE_BUILD_SHA=<exact SHA> pnpm build` | PASS | [Log](evidence/real-lead-readiness/bee6a6e93a88820bba0d709c8356092c65cfae75/build.log) |
| `pnpm test:integration` | PASS, 25 (14 pilot cases) | [Log](evidence/real-lead-readiness/bee6a6e93a88820bba0d709c8356092c65cfae75/integration.log) |
| `PLAYWRIGHT_CHANNEL=chrome pnpm test:e2e` | PASS, 14 (12 readiness + 2 inherited) | [Log](evidence/real-lead-readiness/bee6a6e93a88820bba0d709c8356092c65cfae75/browser.log) |

[Manifest](evidence/real-lead-readiness/bee6a6e93a88820bba0d709c8356092c65cfae75/manifest.json) records source SHA, command exit codes and SHA-256 for 6 logs and 11 screenshots. Checksums were recomputed after copying evidence. GitHub CI independently repeated all six commands with 26 unit, 25 integration and 14 browser tests on Ubuntu/Chromium; its 6 logs and 11 screenshots also passed checksum verification. The local verifier rejects tracked modifications but ignores untracked files; fresh immutable CI checkout provides an additional source assurance boundary. `tests/connect/explorer.test.tsx` is outside the current unit/integration/browser command selection and is not included in these passing totals.

## Files Changed

[Readiness file inventory from inherited baseline](evidence/real-lead-readiness/bee6a6e93a88820bba0d709c8356092c65cfae75/files-changed.txt) and [repair commit file summary](evidence/real-lead-readiness/bee6a6e93a88820bba0d709c8356092c65cfae75/fix-files-changed.txt). The repair commit itself changes three files: journey UI, browser regression tests and [architecture contract](docs/READINESS_ARCHITECTURE.md). The comparison from old source `8bd0e3d7` to repaired `bee6a6e9` additionally includes a CI-controller workflow introduced between them; this is four changed paths, not three.

## Remaining Blockers

1. Owner-approved actual notification endpoint and Operations account IDs/roles.
2. Claude review of repaired SHA. The prior review covers `8bd0e3d7`, and the account reached its usage limit after the addendum; no new approval is inferred.
3. Critical F1: prove trusted ingress/header integrity and exclusion of direct untrusted Worker access across pilot and inherited auth helpers; or implement shared verified identity.
4. F2: define and implement durable retention, withdrawal/deletion and abuse controls before real data. Current temporary test database disposal is not that production lifecycle.
5. A reviewed real-intake/notification activation implementation after authorization. This source accepts only mock input and has no real transport.
6. Explicit Owner approval for 5–10 real leads through Organic/Direct/Owner-controlled traffic after the full gate passes.
## Risks

Local SQLite is not hosted D1 certification. The harness injects synthetic identity headers on loopback and must never be exposed publicly. Mock mode is a data-mode guard, not authentication. Tab capability expiry is 24 hours; closing the tab loses its capability, although authorized Operations can reopen the stored record. Viewing-ready records a mock follow-up window, not actual property availability or a booked appointment. No statement here certifies the substantial inherited application for production.

## Independent QA — Manus

Actual [Manus task](https://manus.im/app/jQo0f4UnRbBdC0hiaFEczB). [Original independent REVISE report with artifact links](evidence/real-lead-readiness/8bd0e3d7a223db392e55c5f2533451bff716a464/manus-review-original.txt) identifies D1 at exact `8bd0e3d7a223db392e55c5f2533451bff716a464`.

D1 reproduction: mobile 390×844 + 200% text, four visible synthetic previews, consent, immediate Save double-click. Pointer telemetry showed first click on Save and second click on enabled Reopen after layout reflow. No image PUT occurred; Lead POST returned 201 and stored images were empty. Manus classified it P0 / release-blocking.

Codex independently reproduced both actual image omission and stale UI replacement by delaying requests; [structured reproduction](evidence/real-lead-readiness/8bd0e3d7a223db392e55c5f2533451bff716a464/reopen-race/reproduction.json), [execution log](evidence/real-lead-readiness/8bd0e3d7a223db392e55c5f2533451bff716a464/reopen-race/execution.log). These findings override any earlier claim that only the test driver was at fault.

**Fixed-SHA Manus result: PASS for mock readiness; real release remains NO-GO / BLOCKED.** [Completed report with direct artifact links](evidence/real-lead-readiness/bee6a6e93a88820bba0d709c8356092c65cfae75/manus-review-fixed.txt) records a fresh detached clean checkout, exact baked SHA, four PUTs/four persisted and reopened images in the no-delay case, held-save/held-restore guards, independent API/browser regression passes and 14/14 standard browser tests. Manus verified checksums/bundle integrity and stopped its test server. Its environment used Node 24.21.0 and pnpm 11.24.0 with frozen dependencies; local/CI used the separately recorded runtime versions. The consolidated gate numbering follows the Director order; Manus grouped contact/attribution together and labeled notification separately.

Lovable has supplied no separate result; Codex completed shared UX implementation in this branch.

## Claude Review

Actual [Claude review and addendum](https://claude.ai/chat/6b239ce1-13aa-4895-9877-16cc24bb7789) cover the **older source only**. [Original text](evidence/real-lead-readiness/8bd0e3d7a223db392e55c5f2533451bff716a464/claude-review-original.txt), [addendum](evidence/real-lead-readiness/8bd0e3d7a223db392e55c5f2533451bff716a464/claude-review-addendum.txt), [supplied pack hashes](evidence/real-lead-readiness/8bd0e3d7a223db392e55c5f2533451bff716a464/review-inputs.json) are preserved.

Old-source code verdict: APPROVE; real-release verdict: BLOCK / NO-GO. Subsequent independent D1 discovery demonstrates the limit of that approval. Repaired source review is BLOCKED pending reviewer availability.

| Finding | Severity | Disposition |
|---|---|---|
| F1 Raw identity header trust without verified ingress | Critical for release | OPEN — shared pilot/platform/legacy auth boundary; automatic NO-GO. |
| F2 No durable retention/erasure workflow | Medium, real-data blocker | OPEN. |
| F3 Legacy import documentation GET exposes mapping metadata | Low, inherited | Recorded for remediation; mutations remain closed. |
| F4 Initial source-pack omissions | Low evidence gap | Claude CLOSED after exact-SHA supplemental files. |
| F5 Test-count reconciliation | Informational | Claude CLOSED count question: old 26+25+12=63; separately noted unselected Connect test. Current repair has 65 tests. |
| F6 Image-read UUID-shape prevalidation; legacy import token comparison hygiene | Informational / low | Recorded; no demonstrated SQL injection or active import write path. |

Claude retracted overstatements that mock mode authenticates callers and that UTM validation guarantees absence of PII; it corrected its 13-file count to 15 and acknowledged the verifier's tracked-file-only check. Its supplied-log review is not an independent fetch of GitHub. File inventories and actual log outputs control where prose counts differ.

## Owner Decisions Required

- Confirm the actual notification destination and operator identities/roles; the approved business phone is already recorded and does not need to be repeated.
- Resolve hosted identity and data lifecycle requirements, then review the complete fresh-SHA evidence before an activation decision.
- Approve or decline a maximum 5–10 real leads only after the required technical, independent and governance gates pass.

## Final Recommendation

**NO-GO FOR REAL LEADS.** The image race is repaired and independently verified by Manus, but the complete gate is not passed. Do not propose CONDITIONAL GO or accept real customer information from local test completion alone.

`REAL_LEADS:false` · `PAID_TRAFFIC:false` · `GOOGLE_ADS:false` · `MASS_CAMPAIGN:false` · `PRODUCTION_PUBLISHED:false` · `OWNER_PILOT_APPROVAL:false`
