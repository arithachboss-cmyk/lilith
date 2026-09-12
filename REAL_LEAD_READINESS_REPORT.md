# REAL LEAD READINESS REPORT — Middle Property

Date: 2026-09-13 · Owner: Arithach · LINE OA: `@middleproperty` · Approved business phone: `0933888594`

## Executive Summary

**NO-GO FOR REAL LEADS.** This leadership round removes unsigned-header authorization across all five identity readers and adds an atomic, retry-safe mock withdrawal/deletion lifecycle. The exact source passed **26 unit + 36 integration + 19 browser tests = 81** locally and in CI, including existing image-race regressions and new identity, expiry, erasure and stale-event cases. Manus independently returned **PASS for this exact source in mock scope**, with real release still BLOCKED.

The source intentionally has **no production identity adapter, real intake mode or external notification transport**. The existing public Site was inspected read-only and was not changed. The Owner has now approved email notifications to **themiddleproperty@gmail.com**; this records the destination only. Operations account identities/roles, approved real-data lifecycle policy, verified hosted controls/delivery, current Claude review and final pilot approval are still required.

## Repository and Evidence Identity

| Item | Evidence |
|---|---|
| Repository | https://github.com/arithachboss-cmyk/lilith |
| Branch | `codex/real-lead-readiness-20260913` |
| **Exact tested source SHA** | `e49c7a9eaaf7c2f3109421e101d7595a0bc25fcd` |
| Draft PR | https://github.com/arithachboss-cmyk/lilith/pull/4 |
| Review fork | `the-middle-th/lilith`; the same branch is also pushed to origin |
| Implementation commits | `f3cbd7443a6b6676df3a963c2ae8f6be6c1f399e` plus JSX-copy correction `cd259153af8053ce2ad1351699e4a2335c1c715d`, contact repair `e4d643538a8a2b61c2ba52c4cf0eed524ad1449b`, and final stale-feedback repair `e49c7a9eaaf7c2f3109421e101d7595a0bc25fcd`; [commit inventory](evidence/real-lead-readiness/e49c7a9eaaf7c2f3109421e101d7595a0bc25fcd/implementation-commits.txt) |
| CI controller | `8428fdb3f74ea6769fa43b8155456d6b8e4d1b7a`, explicitly checks out/asserts `e49c7a9eaaf7c2f3109421e101d7595a0bc25fcd` |
| CI | **PASS** — [run 34723511082](https://github.com/arithachboss-cmyk/lilith/actions/runs/34723511082) |
| Exact build identity | [Captured `/api/pilot/build`](evidence/real-lead-readiness/e49c7a9eaaf7c2f3109421e101d7595a0bc25fcd/build-identity.json): mock-only, real leads/paid traffic/Google Ads false |
| Local evidence | [Manifest](evidence/real-lead-readiness/e49c7a9eaaf7c2f3109421e101d7595a0bc25fcd/manifest.json), six command logs and fourteen screenshots; hashes independently recomputed after copying |
| Baseline | Original base `2ff8ce7f933217a4b8ee92054cdd0f42bd83b12a`; inherited application snapshot `1fdae501966b32c17171b5092681ebed1f46f713`, [inventory](docs/READINESS_BASELINE.json) |

The dedicated worktree is `/Users/arithachbossabc/Documents/lilith-readiness`. The original dirty workspace was preserved. The PR includes the substantial inherited application snapshot. CI-controller and later evidence/report commits do not constitute a different tested product source. Local verification uses Node 24, the compiled Worker, temporary file-backed SQLite and Chrome mobile/desktop emulation; it is not hosted D1 or physical iOS/Safari certification.

## P0 Gate Matrix

PASS is limited to the cited mock acceptance checks. A release gate remains blocked where real operational or hosted evidence is missing.

| Gate | Owner | Status | Evidence | Blocker |
|---|---|---|---|---|
| Lead Persistence | Codex | PASS — local/CI mock | [Integration](evidence/real-lead-readiness/e49c7a9eaaf7c2f3109421e101d7595a0bc25fcd/integration.log), [browser](evidence/real-lead-readiness/e49c7a9eaaf7c2f3109421e101d7595a0bc25fcd/browser.log) | Hosted persistence/session verification required before real activation. |
| Consent | Lovable / Codex | PASS — local/CI mock | [Mobile consent](evidence/real-lead-readiness/e49c7a9eaaf7c2f3109421e101d7595a0bc25fcd/mobile-consent.png), [desktop withdrawal](evidence/real-lead-readiness/e49c7a9eaaf7c2f3109421e101d7595a0bc25fcd/withdrawal-1440.png), [mobile withdrawal](evidence/real-lead-readiness/e49c7a9eaaf7c2f3109421e101d7595a0bc25fcd/withdrawal-390.png) | Real-data policy and governance approval pending. |
| Image Persistence | Codex / Lovable | PASS — local/CI mock | [Held save/reopen](evidence/real-lead-readiness/e49c7a9eaaf7c2f3109421e101d7595a0bc25fcd/reopen-race-fixed.png), [200% immediate double-click](evidence/real-lead-readiness/e49c7a9eaaf7c2f3109421e101d7595a0bc25fcd/mobile-200-double-click.png), integration/browser logs | Four synthetic non-interlaced 8-bit PNGs, ≤128 KiB each; hosted production media controls unverified. |
| Operations Inbox | Codex / Director | **BLOCKED — OWNER AUTHORIZATION REQUIRED** | [Mock inbox](evidence/real-lead-readiness/e49c7a9eaaf7c2f3109421e101d7595a0bc25fcd/desktop-operations.png), [decision record](docs/READINESS_OWNER_AUTHORIZATION.json), [decision packet](OWNER_DECISION_PACKET.md) | Email destination approved: themiddleproperty@gmail.com. Operations accounts/roles and verified delivery remain pending. |
| Canonical CTA | Codex | PASS — reviewed mock surfaces | [Landing](evidence/real-lead-readiness/e49c7a9eaaf7c2f3109421e101d7595a0bc25fcd/landing.png), browser log | Existing production surfaces were not redeployed or certified. |
| Attribution | Codex | PASS — local/CI debug/test | Integration/browser logs include erased attribution and stale-event regression | No real analytics/ad platform activated; UTM allowlists do not guarantee absence of PII. |
| Security | Manus / Claude | **BLOCKED — real-release controls/review incomplete** | [Identity/lifecycle tests](evidence/real-lead-readiness/e49c7a9eaaf7c2f3109421e101d7595a0bc25fcd/integration.log), [scoped pattern scan](evidence/real-lead-readiness/e49c7a9eaaf7c2f3109421e101d7595a0bc25fcd/security-pattern-scan.json) | Production authentication disabled; hosted ingress/storage/abuse protections and current Claude review remain incomplete. |

## Verified Facts

- Landing → language/requirements → consent → unique Lead ID → persisted images → correlated mock outbox → Operations → viewing-ready remains covered. Real contact clicks are simulated; canonical links retain Middle Property, `@middleproperty` and `0933888594`.
- Database uniqueness and normalized payload hashes deduplicate double-clicks/retries. A single transaction creates lead, notification and submit event; failure rolls back. Refresh and database reopen preserve the same records and bytes.
- **Five identity readers are closed to unsigned headers:** pilot Operations, matching platform, legacy lead authorization, agent/photo authorization, and SSR. All share the verified identity path. The test adapter requires an ephemeral server-only HMAC key, mock mode, loopback HTTP URL, signature, matching method/URL and a valid lifespan of at most 60 seconds. No hosted identity path is enabled.
- SSR uses AsyncLocalStorage populated by verification at Worker ingress. Concurrent signed/anonymous requests are tested for isolation. API negative tests exercise forged approved IDs/manager emails, altered/expired/missing signatures, non-loopback origins, a signed outsider with forged raw headers, and forbidden writes without database changes.
- Consent is affirmative, not prechecked; missing/false/wrong-version consent blocks session creation. Consent version/time are persisted server-side. Decline clears an unsaved form; the new withdrawal action works after session creation and saving.
- **Withdrawal/deletion is atomic:** create a terminal receipt, delete the lead first, then cascade draft/images/events/outbox in the same transaction. The ordering preserves existing finalized-image restrictions. Failed erasure rolls back both receipt and content. Lost-response retries return the same receipt; unrelated leads remain untouched.
- Terminal receipts block original and mixed old-token/new-ID or old-ID/new-token session replays. SQL triggers reject image/event writes paused after authorization when erasure wins before execution. Concurrent save/upload/progress tests leave no erased content behind.
- Mock content access ends at the 24-hour draft deadline, including operator inbox/image/progression. The authorized mock sweep erases up to 100 due drafts per batch; the loopback test server runs it at startup and every 60 seconds. **No hosted scheduler is configured.**
- The receipt retains only draft UUID, capability hash, reason, time and mock flag until isolated test-database teardown. It contains no contact/form/image/attribution content; it is retained metadata, not a claim of anonymization. Production retention and backup/receipt handling are still undecided.
- The UI clears browser content only after acknowledged erasure. It preserves the capability on failure and excludes stale analytics completions from the next request. Mobile/desktop lost-response withdrawal and delayed-contact/new-request regressions pass.
- Lead IDs alone do not grant access. Four-image limits, ownership checks, retry IDs and the previous D1 image-race repair remain covered. Viewing-ready records a mock follow-up window, not an actual booked appointment or guaranteed property availability.
- Legacy import documentation GET now requires verified operator authorization; legacy writes remain closed. Image GET validates UUID shape before database access.
- [Pattern scan](evidence/real-lead-readiness/e49c7a9eaaf7c2f3109421e101d7595a0bc25fcd/security-scan.mjs) found zero matching credential candidates across **141** UTF-8 source/client-build files. Its JSON records patterns, command, scanner and input hashes. This is a heuristic scan, not a complete secrets/PII/hosted security audit.

## Test Commands and Results

On committed source `e49c7a9eaaf7c2f3109421e101d7595a0bc25fcd`: `PLAYWRIGHT_CHANNEL=chrome node scripts/verify-readiness.mjs`.

| Command | Result | Evidence |
|---|---|---|
| `pnpm typecheck` | PASS, exit 0 | [Log](evidence/real-lead-readiness/e49c7a9eaaf7c2f3109421e101d7595a0bc25fcd/typecheck.log) |
| `pnpm lint` | PASS, exit 0; two inherited generated-file warnings | [Log](evidence/real-lead-readiness/e49c7a9eaaf7c2f3109421e101d7595a0bc25fcd/lint.log) |
| `pnpm test:unit` | PASS, 26 | [Log](evidence/real-lead-readiness/e49c7a9eaaf7c2f3109421e101d7595a0bc25fcd/unit.log) |
| `MIDDLE_BUILD_SHA=<exact SHA> pnpm build` | PASS | [Log](evidence/real-lead-readiness/e49c7a9eaaf7c2f3109421e101d7595a0bc25fcd/build.log) |
| `pnpm test:integration` | PASS, 36 | [Log](evidence/real-lead-readiness/e49c7a9eaaf7c2f3109421e101d7595a0bc25fcd/integration.log) |
| `PLAYWRIGHT_CHANNEL=chrome pnpm test:e2e` | PASS, 19 | [Log](evidence/real-lead-readiness/e49c7a9eaaf7c2f3109421e101d7595a0bc25fcd/browser.log) |

CI independently repeated all six commands on Ubuntu/Chromium; its [manifest](evidence/real-lead-readiness/e49c7a9eaaf7c2f3109421e101d7595a0bc25fcd/ci/manifest.json), six logs and fourteen screenshots were checksum-verified after download. The [run metadata](evidence/real-lead-readiness/e49c7a9eaaf7c2f3109421e101d7595a0bc25fcd/github-ci-run.json) identifies the controller and successful steps.

The verifier now rejects tracked changes and untracked files outside `output/`. Git-ignored environment/output content is not an exhaustive input attestation; CI's fresh checkout and recorded runtime remain additional controls. `tests/connect/explorer.test.tsx` is outside the selected suites and is not counted. The SQLite harness executes each queued batch synchronously between BEGIN/COMMIT, preventing standalone operations from interleaving inside a transaction.

An initial exact-source check at `f3cbd744...` stopped at a JSX lint error. The copy was corrected in `cd259153af8053ce2ad1351699e4a2335c1c715d`; only the successful fresh run above is current PASS. Earlier local exploratory browser execution without an installed default Chromium channel was an environment failure; the recorded complete local run uses installed Chrome. The failed lint evidence is retained under `f3cbd744...`. Source `cd259153...` passed 79 local tests but [CI34722951902](https://github.com/arithachboss-cmyk/lilith/actions/runs/34722951902) reproduced a suppressed contact click during image restoration; [historical failure evidence](evidence/real-lead-readiness/cd259153af8053ce2ad1351699e4a2335c1c715d/EVIDENCE_STATUS.md) is preserved. Source `e4d6435...` repaired that and passed 80 local tests, then an additional [deterministic reproduction](evidence/real-lead-readiness/e4d643538a8a2b61c2ba52c4cf0eed524ad1449b/stale-notice-reproduction/execution.log) found stale restoration errors replacing confirmed withdrawal. Both were fixed in the final source; [current screenshot](evidence/real-lead-readiness/e49c7a9eaaf7c2f3109421e101d7595a0bc25fcd/withdrawal-restoration.png) retains the correct confirmation. No content resurrection occurred in that second defect.

## Files Changed

[Changed paths since previous repaired source](evidence/real-lead-readiness/e49c7a9eaaf7c2f3109421e101d7595a0bc25fcd/files-changed.txt) and [commit details](evidence/real-lead-readiness/e49c7a9eaaf7c2f3109421e101d7595a0bc25fcd/implementation-commits.txt). Main changes: shared identity/verifier and request context; five identity readers and route awaits; mock closure migration, session DELETE and maintenance endpoint; expiry-aware reads/writes; withdrawal UI; test-only signer and atomic harness; identity/lifecycle/browser tests; verifier input checks; architecture, hosting observation and Owner decision packet. No hosting access or deployment configuration was changed.

## Remaining Blockers

1. Confirm exact Operations account identities/roles. The Owner has specified email delivery to themiddleproperty@gmail.com; sender integration, delivery and matching authorized record access remain unverified.
2. Implement and verify the production identity boundary with legitimate login, membership/role enforcement and spoof/direct-ingress rejection. Current source intentionally denies hosted operator access.
3. Approve the real-data retention/withdrawal/deletion policy and implement its hosted schedule, receipt/backup/log handling and recovery path. Mock erasure evidence does not approve a real policy.
4. Obtain the current Claude architecture/governance review. Manus has passed the exact final source in mock scope; hosted changes will require new exact-source testing and review.
5. Implement reviewed real intake/notification delivery, hosted D1/upload controls and abuse protection within the approved scope. Current source accepts synthetic data only and has no external transport.
6. Obtain explicit Owner approval for 5–10 Organic/Direct/Owner-controlled real leads after every required gate passes.

## Risks

The old public Site is a separate deployment; [read-only snapshot](docs/READINESS_HOSTING_SNAPSHOT.json) reports version 14/public access and an auth client, but does not prove its source or header integrity. It was not modified or probed with real lead data. The signed local harness is trusted simulation and must never be exposed publicly. Mock mode is not authentication. Losing a tab capability limits self-service access; real identity recovery remains undecided. This report does not certify the inherited application or existing production for real customer data.

## Independent QA — Manus

Actual task: https://manus.im/app/jQo0f4UnRbBdC0hiaFEczB.

**Current source: PASS — mock-only; real release BLOCKED / NO-GO.** The [actual final response](evidence/real-lead-readiness/e49c7a9eaaf7c2f3109421e101d7595a0bc25fcd/manus-review-final.txt) identifies a detached, clean checkout of `e49c7a9eaaf7c2f3109421e101d7595a0bc25fcd`, Node 24.21.0, pnpm 11.24.0 and Chromium. Manus reports all six verifier commands passing (26 unit + 36 integration + 19 browser), **13/13 independent API scenarios**, **5/5 independent browser scenarios**, and both additional held-restoration/delayed-event reproductions passing. These independent scenarios are reported separately from the 81-suite total.

Manus found no remaining reproducible product defect in the isolated mock environment. `TEST-operations` remains a fixture, not an Owner-authorized account. Its [QA report](https://manus.im/app/jQo0f4UnRbBdC0hiaFEczB?previewEventId=MkHs6MuRGsrfjM1LfhbofL&previewSandboxPath=%2Fhome%2Fubuntu%2Fqa-artifacts%2Fe49c7a9eaaf7c2f3109421e101d7595a0bc25fcd%2FINDEPENDENT_QA_REPORT.md) and [evidence bundle with checksums](https://manus.im/app/jQo0f4UnRbBdC0hiaFEczB?previewEventId=MkHs6MuRGsrfjM1LfhbofL&previewSandboxPath=%2Fhome%2Fubuntu%2Fqa-artifacts%2Fe49c7a9eaaf7c2f3109421e101d7595a0bc25fcd-qa-bundle.zip) are linked from the actual response. Artifact downloads require access to that Manus task. Manus confirmed the loopback test server was stopped after QA. Its recipient-authorization blocker predates the Owner's email reply above; verified delivery, operator identities and hosted authorization remain open.

Historical source `8bd0e3d7...`: Manus REVISE / D1 for real image loss after an immediate mobile double-click. The second click landed on Reopen after layout shift; zero image PUTs and an empty persisted gallery accompanied a successful lead save. Codex independently reproduced both omitted uploads and stale UI restoration. Historical repaired `bee6a6e9...`: Manus PASS in mock scope after the repair. Both evidence directories remain intact; neither approval covers this new source automatically.

Lovable has supplied no separate result. Codex performed the shared UX changes. Internal read-only Codex audits informed fixes and are not substituted for Manus or Claude.

## Claude Review

Actual task: https://claude.ai/chat/6b239ce1-13aa-4895-9877-16cc24bb7789.

**BLOCKED — reviewer unavailable for the current source.** [Observed status](evidence/real-lead-readiness/e49c7a9eaaf7c2f3109421e101d7595a0bc25fcd/claude-current-status.json) records the usage-limit UI. [A 23-file exact-SHA review pack](evidence/real-lead-readiness/e49c7a9eaaf7c2f3109421e101d7595a0bc25fcd/CLAUDE_READINESS_ADDENDUM.md) and [input hashes](evidence/real-lead-readiness/e49c7a9eaaf7c2f3109421e101d7595a0bc25fcd/review-inputs.json) are prepared locally, not yet submitted. No credit purchase/reset was made.

Claude's historical code APPROVE / real-release BLOCK covered only `8bd0e3d7...`. Its earlier approval did not identify the subsequently reproduced image race. The following are implementation dispositions, **not new Claude closure decisions**:

| Prior finding | Current disposition |
|---|---|
| F1 Critical raw-header trust without verified ingress | Unsigned access removed across five readers; signed mock adapter only. Hosted production identity remains blocked pending implementation/evidence. |
| F2 No durable retention/erasure | Atomic mock lifecycle and local sweep implemented/tested. Real policy, hosted scheduling and receipt/backup scope remain open. |
| F3 Import GET metadata disclosure | Requires verified operator authorization in this source. |
| F4 Missing review-pack files | Historical closure preserved; new source has its own 23-file pack. |
| F5 Test counts | Current logged selection is 26+36+19=81; Connect test remains outside scope. |
| F6 Image UUID / legacy import-token comparison | Image UUID prevalidation added. Legacy token comparison remains inherited; its mutation path stays closed. |

## Owner Decisions Required

[OWNER_DECISION_PACKET.md](OWNER_DECISION_PACKET.md) records the approved phone and email notification destination. Next specify authorized Operations people/roles and the real-data lifecycle policy. Pilot approval is a later, separate decision supported by the complete evidence and independent reviews.

## Final Recommendation

**NO-GO FOR REAL LEADS.** The mock journey and this security/lifecycle iteration are reviewable with exact-source evidence. Do not offer CONDITIONAL GO until the required operational, hosted, independent-review and Owner-approval gates all pass.

`REAL_LEADS:false` · `PAID_TRAFFIC:false` · `GOOGLE_ADS:false` · `MASS_CAMPAIGN:false` · `PRODUCTION_PUBLISHED:false` · `OWNER_PILOT_APPROVAL:false`
