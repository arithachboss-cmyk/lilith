# Agent M1 operations

Route: `/agents`, linked from `/dashboard`.

The signed-in email matching `LILITH_ADMIN_EMAIL` is the sole M1 manager. There is no first-visitor administrator claim. Other visitors must be added by M1 with their sign-in email. Missing configuration denies access. Authentication uses the existing Sites trusted identity headers; do not expose the Worker directly behind an untrusted header-forwarding proxy.

- M1 adds and edits members, team letters A–Z, access tiers 1–5, reviewed scores 0–100 and required evaluation notes.
- Tier 1 is highest. A member of tier N can read properties requiring tier N or a numerically larger tier, across teams. Team letters are competition groupings, not separate access boundaries.
- Only a listing's creator (while still eligible) or M1 can update it. M1 selects access tiers based on property value; there is no invented rent threshold or automatic promotion.
- Team ranking uses average manager-reviewed score. Reviews are persisted with reviewer and timestamp. M1's score is a fixed zero and is not a sales result.
- Inventory includes condo, area, monthly THB rent, bedrooms, area in square metres, fixed 12-month lease, status, owner and access tier.
- Upload 1–6 JPEG/PNG/WebP photos, maximum 5 MB each. Replacing photos replaces the whole set. Photos are stored in private R2; protected reads recheck current tier. Old blobs remain stored and are not publicly accessible. No delete action or garbage collection is included.
- New tables are migration-owned, appended in Drizzle 0005 and 0006. Existing lead data is unchanged by those migrations.

Validation: build, TypeScript, existing regression tests and an integration test with a real SQLite database plus an in-memory R2 adapter. Tests cover authorization, upload, persistence, duplicate emails, restricted reads, owner checks and immediate revocation of photo visibility after tier restriction. No real properties or customer data were seeded.

Local configuration: `.env` contains `LILITH_ADMIN_EMAIL`; `.env.example` declares the empty key. Hosted configuration uses the Sites secret of the same name. R2 binding: `AGENT_PHOTOS`.

## Published homepage preservation

Remote source was four commits ahead of the local checkout. Its seven-language UI and data-flow changes were merged with local validation fixes. The latest static homepage is preserved byte-for-byte as `public/current-home.html`, with its existing assets. The Worker serves it at `/` and `/index.html`; the seven-language lead form is available at `/lead-form`. `/agents` and `/dashboard` remain sign-in gated. This converts hosting from static-only to a D1/R2-enabled Worker without replacing the public homepage.
