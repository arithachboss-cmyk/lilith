# Security model and release limits

## Implemented

- Trusted Sites dispatcher identity headers are mapped to a persisted user ID and role. API requests without identity return 401; identity without a profile returns 403.
- Self-service roles are OWNER, AGENT and CLIENT. No client can select ADMIN/OPERATOR or rewrite a role through profile signup.
- Only OWNER creates supply. AGENT/CLIENT creates creator-owned demand. Ownership/participant IDs never come from input.
- Private requirement descriptions are creator-only. Counterparties see neutral brief title and representative display name, not creator email or private description.
- Matches and interests require one of their actual owners. Rooms, messages, appointments and timelines require membership.
- Every new API body uses strict Zod validation, a 32 KiB streaming body limit, JSON content type, and same-origin CSRF checks. Error envelopes have stable codes and request IDs, without SQL/stack traces.
- D1 batches persist critical actions with audit/event records. Uniqueness and optimistic concurrency prevent duplicate consent rooms and orphan viewings.
- Sensitive API responses use private/no-store caching. Unknown failures log only a request ID and error class.
- Legacy lead management and cookie-authenticated import now require configured `LILITH_ADMIN_EMAIL`. Public lead submission and explicit import tokens retain existing behavior.
- No production customer data or demo deals are seeded. Browser fixtures live in temporary SQLite databases and are labelled TEST ONLY.

## Deployment boundary

Never expose a Worker that trusts `oai-authenticated-*` through an untrusted ingress. Sites must strip caller-supplied identity headers and inject authenticated identity. Local browser tests simulate only this trusted edge; they do not certify production login, logout, session expiration or dispatcher configuration.

The existing auth is platform-owned, not a newly implemented password/OTP flow. Additional identity providers require a documented architecture change.

## Not yet production-ready

- Anti-abuse rate limits, organization/agent-client grants, identity/property verification, role management and account recovery remain unimplemented.
- Media/document tables exist but there is no new matching upload/download endpoint. All document access stays unavailable until an authorized signed-URL storage service is implemented. Existing legacy R2 photos retain their tier checks.
- No offer acceptance, legally meaningful signatures, verified payment webhooks or commercial fee collection.
- No external event delivery/retry worker, retention policy enforcement, monitoring alerts or disaster-recovery rehearsal.
- Inventory editing/archival must implement match revalidation and participant-authorized property snapshots before release.
- Database checks are defense in depth; application validation is required for all monetary and future entity writes. Future schema-only entities must not be exposed without services and tests.

CI performs local build/tests; a hosted staging validation and confirmation of production ingress remain release gates. Passing the first-slice checks is readiness for code review, not production launch.
