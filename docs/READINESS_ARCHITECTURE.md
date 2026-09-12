# Middle Property — readiness implementation contract

Owner: Arithach. Brand: Middle Property. LINE OA: `@middleproperty`. Business telephone `0933888594` was supplied by the Owner in this execution session. Neither the telephone nor OA handle authorizes a notification recipient or an operator identity.

## Scope and inherited baseline

The dedicated branch snapshots the existing uncommitted application as baseline commit `1fdae50`; `READINESS_BASELINE.json` identifies inherited files. Readiness changes are a separate subsequent commit. The original workspace and production were not modified. The inherited matching application continues to have regression coverage.

The existing Landing is `public/current-home.html`, served by the Worker at `/`. Its contact paths now use canonical contacts and preserve UTM into `/pilot`. `/lead-form` redirects to the mock requirement journey. `/pilot/inbox` is its Operations surface. This is a separate, reviewable `pilot_*` data namespace, not a certification of the legacy lead/import or agent-photo implementation.

## No real data or delivery path

- Pilot APIs return 503 unless the server binding is exactly `MIDDLE_READINESS_MODE=mock`.
- Requests require literal `mock_data:true`, synthetic `TEST ` names and `@example.test` email addresses. There is no mode that enables real lead intake in this build.
- All legacy lead writes/imports are closed both at Worker ingress and inside route handlers; alternate URL spellings are covered.
- LINE/call clicks in this preview are simulated. Canonical hrefs are inspectable, but click handlers do not contact the number or OA.
- No notification network client exists. Outbox destination is database-constrained to `mock://middle-property-operations`. `sent:false` is explicit. Owner authorization remains false.
- No publishing, DNS, domain, email, billing or paid-traffic operation belongs to this change.

## Persistence and idempotency

Migration `drizzle/0008_readiness.sql` is an additive, manually authored SQL migration registered in the ordered migration journal. Its SQL constraints and triggers are authoritative; the existing Drizzle ORM schema/snapshot does not model these new raw-SQL tables. Do not regenerate or replace the migration without reviewing this distinction.

`pilot_drafts` binds one UUID to a SHA-256 hash of a random 256-bit browser capability, versioned affirmative consent, consent time, expiry and `mock_data=1`. The capability is stored only in same-tab sessionStorage, never in a URL or log. Before consent, form values and image previews remain in memory; analytics events also remain in memory.

`pilot_leads` has a unique draft foreign key and a separate random `MP-UUID` Lead ID. A strict, normalized payload hash detects changed-payload retries. One D1 batch commits the lead, its one unique outbox item and the server-side submit event. Lost responses return the original Lead ID; rollback leaves no partial lead/outbox. The public capability can reopen only its own draft. Lead IDs alone grant no access.

`pilot_images` stores private image bytes and metadata in the same database, capped at 4 rows per draft by a database trigger. Bytes and references cannot become separated across external storage writes. Upload IDs are stable across retries; different content cannot reuse an ID. Images are immutable after lead creation; order and removal before finalization are transactional. Images are limited to 128 KiB each in this mock preview. Only non-interlaced 8-bit PNG is supported in this test cycle. Browser decoding plus server PNG CRC and bounded zlib scanline validation reject malformed inputs, invalid filters and decompression-size overflow. JPEG, WebP, SVG and HTML are rejected. Production media storage/scanning is not certified by this implementation.

## Authorization and operations

The mock harness supplies the synthetic `TEST-operations` identity and allowlist. Product code contains no default allowed identity. The inbox requires a nonempty server-side `MIDDLE_OPERATIONS_USER_IDS` allowlist and trusted authenticated ingress. Mutations additionally require same-origin requests. No Owner account is inferred from a phone, OA, GitHub login or self-selected platform role.

Hosted header integrity, direct-Worker ingress exclusion, actual operator IDs and the approved notification destination remain unverified. Those are release blockers. This leadership round removes raw-header trust from all five readers: pilot Operations, matching platform identity, legacy lead authorization, agent/photo authorization and SSR. `src/services/identity.ts` accepts only a request-bound HMAC assertion in mock mode on an HTTP loopback URL with a runtime ephemeral key. The test helper signs these assertions; raw `dispatch()` never signs. The browser test adapter deliberately signs synthetic header identities and is not hosted authentication evidence. `src/services/request-identity.ts` provides AsyncLocalStorage context verified at Worker ingress; SSR never derives authorization from request headers. No production identity adapter is enabled. Even legitimate Sites users remain unauthorized by this source until the separate adapter is implemented and verified.

Sites authentication documentation describes dispatcher-provided identity headers but supplies no verifiable assertion format in this environment. A hostname or trust flag alone is insufficient. `READINESS_HOSTING_SNAPSHOT.json` records a read-only observation of the existing public Site at version 14. It does not associate that deployment with this readiness source or prove ingress integrity. Existing Site access and deployment were not changed.

Operators move requests from pending review to qualified to viewing-ready, supplying a viewing window. Compare-and-set updates plus a database trigger prevent stale concurrent downgrade. Milestone events persist the operator identity and lead correlation. Viewing-ready means a mock request is prepared for follow-up; no property availability, appointment or real booking is guaranteed.

## Attribution and privacy

Allowlisted events: page_view, form_start, form_submit, line_click, call_click, qualified_lead, viewing_request. They are alternative/branching user actions, not a claim that every customer must click both LINE and Call. Events preserve source, medium, campaign, landing locale, first touch and last touch. They store no arbitrary event metadata or raw URL/query. Client contact clicks cannot forge server-generated qualification/viewing milestones. Repeated event IDs deduplicate; a single serialized browser flush prevents queue loss.

Capability and mock-content access expire in 24 hours. `0009_pilot_lifecycle.sql` adds terminal receipts and database triggers preventing writes against expired or erased drafts. The capability-scoped DELETE session endpoint records withdrawal/deletion and erases lead, outbox, events and images atomically. It deletes the lead before the draft to preserve the finalized-image immutability rules. A minimal receipt retains the draft UUID, capability hash, reason and time until isolated test-namespace teardown; it contains no form, image, contact or attribution content. It prevents retries from recreating the erased request, including old-token/new-ID and old-ID/new-token variants. Receipts are metadata, not anonymous data, and their production retention remains undecided.

The authorized mock maintenance endpoint processes up to 100 expired drafts per batch. The loopback test server invokes it on startup and every 60 seconds; the entire temporary database is removed on shutdown. Operator inbox/image/progression queries hide expired content immediately. No hosted retention scheduler is configured or claimed. UI withdrawal retains the capability after failure so a lost-response retry can retrieve the existing receipt, then clears browser content after confirmed erasure.

Same-tab refresh/reopen is supported; closing the browser/tab removes the session capability. Authorized Operations can reopen the persisted record separately. Local verification uses temporary SQLite files removed when the test server exits, including staged test images. The mock lifecycle implementation does not approve real-data retention periods, receipt retention, identity recovery, backup erasure, rate limits, abuse protection or hosted storage controls; these remain release requirements.

Saving, image processing and record restoration exclude competing Reopen/New actions with both immediate handler guards and disabled controls. Consent/image controls keep their layout during submission so a rapid second click cannot land on an action shifted into the Save button's position. Restoration has an explicit loading state until all image bodies and record fields are ready. This closes two independently reproduced races in source `8bd0e3d7`: a concurrent empty draft reopen could replace staged images before upload, or a delayed reopen response could hide images after a successful save. Previous evidence for that source remains historical; the fixed source requires its own exact-SHA verification.

## Reproduce

Use Node 24 and the committed pnpm lockfile. On a clean checkout run `pnpm install --frozen-lockfile`, then `node scripts/verify-readiness.mjs`. Install Playwright Chromium first; on this Mac `PLAYWRIGHT_CHANNEL=chrome` selects installed Chrome. The script builds with the exact commit SHA and writes logs, screenshots and checksums under `output/readiness/<SHA>/`.

`GET /api/pilot/build` exposes the baked source SHA and closed real-lead/traffic flags. Local preview: after building, run `node tests/e2e/server.mjs` and open `http://127.0.0.1:4199/pilot`; stop the server to delete the test database. It is bound to loopback only and is not an externally reachable preview. Never forward this test ingress to the internet because its synthetic identity signing is intentionally test-only.

Manus must independently reproduce the exact SHA and report PASS/REVISE/BLOCKED with artifacts. Claude must return APPROVE/REVISE/BLOCK with source references. Internal Codex reviews do not count as either reviewer.
