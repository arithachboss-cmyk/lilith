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

Hosted header integrity, direct-Worker ingress exclusion, actual operator IDs and the approved notification destination remain unverified. Those are release blockers. Raw header injection in the loopback test harness is not hosted authentication evidence.

Operators move requests from pending review to qualified to viewing-ready, supplying a viewing window. Compare-and-set updates plus a database trigger prevent stale concurrent downgrade. Milestone events persist the operator identity and lead correlation. Viewing-ready means a mock request is prepared for follow-up; no property availability, appointment or real booking is guaranteed.

## Attribution and privacy

Allowlisted events: page_view, form_start, form_submit, line_click, call_click, qualified_lead, viewing_request. They are alternative/branching user actions, not a claim that every customer must click both LINE and Call. Events preserve source, medium, campaign, landing locale, first touch and last touch. They store no arbitrary event metadata or raw URL/query. Client contact clicks cannot forge server-generated qualification/viewing milestones. Repeated event IDs deduplicate; a single serialized browser flush prevents queue loss.

Capability access expires in 24 hours. Same-tab refresh/reopen is supported; closing the browser/tab removes the session capability. Authorized Operations can reopen the persisted record separately. Local verification uses temporary SQLite files removed when the test server exits, including staged test images. Durable production retention, withdrawal/deletion workflow, rate limits, abuse protection and hosted storage controls require a separate approved release implementation.

## Reproduce

Use Node 24 and the committed pnpm lockfile. On a clean checkout run `pnpm install --frozen-lockfile`, then `node scripts/verify-readiness.mjs`. Install Playwright Chromium first; on this Mac `PLAYWRIGHT_CHANNEL=chrome` selects installed Chrome. The script builds with the exact commit SHA and writes logs, screenshots and checksums under `output/readiness/<SHA>/`.

`GET /api/pilot/build` exposes the baked source SHA and closed real-lead/traffic flags. Local preview: after building, run `node tests/e2e/server.mjs` and open `http://127.0.0.1:4199/pilot`; stop the server to delete the test database. It is bound to loopback only and is not an externally reachable preview. Never forward this test ingress to the internet because its synthetic identity injection is intentionally test-only.

Manus must independently reproduce the exact SHA and report PASS/REVISE/BLOCKED with artifacts. Claude must return APPROVE/REVISE/BLOCK with source references. Internal Codex reviews do not count as either reviewer.
