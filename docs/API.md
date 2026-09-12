# Matching platform API

All routes require trusted Sites identity, except the browser welcome/sign-in page. `GET /api/profile` can return `profile: null` for a signed-in visitor. Other APIs require a persisted profile. Missing identity is 401; missing role/profile is 403. UUID route IDs and all consumed parameters are validated.

Success: `{ "data": ... }`. Error: `{ "error": { "code": "...", "message": "...", "requestId": "...", "fields": [{ "path": "...", "message": "..." }] } }`. `fields` is present only for validation errors. No raw database details are returned.

Every mutation requires same-origin `Origin`, `Content-Type: application/json`, strict schema fields and a body up to 32 KiB. Production identity headers are injected by Sites, not by the browser.

| Method and route | Input / result |
| --- | --- |
| GET /api/profile | Own saved profile, or null |
| POST /api/profile | `displayName`, role OWNER/AGENT/CLIENT; once per identity |
| POST /api/properties | Owner only; contract below |
| GET /api/properties?cursor=0 | Own properties, 20 per page |
| GET /api/properties/:id | Published listing or owner's listing |
| POST /api/requirements | AGENT/CLIENT only; contract below |
| GET /api/requirements?cursor=0 | Own requirements, 20 per page |
| GET /api/requirements/:id | Creator only |
| POST /api/matches/generate | `{kind: "property"|"requirement", id, cursor?:0}`; owned resource; eight candidates per page; returns nextCursor |
| GET /api/discover?cursor=0&requirementId=UUID | Undecided eligible matches; optional owned requirement filter; ten per page |
| GET /api/matches?cursor=0 | All own pairs/decisions/reasons/room IDs; ten per page |
| POST /api/matches/:id/interests | `{decision: "PASS"|"INTERESTED"|"SUPER_MATCH"}`; returns `{mutual,roomId}` |
| POST /api/matches/:id/view | `{requestId: UUID}`; authorized analytics view |
| GET /api/deals?cursor=0 | Participant rooms; 20 per page |
| POST /api/deals | `{matchId: UUID}`; return existing mutual room; 409 before mutual consent |
| GET /api/deals/:id | Participant-only property, participants, last 100 messages/events, viewings and permitted actions |
| POST /api/deals/:id/messages | `{body,requestId: UUID}`; retry safe |
| POST /api/deals/:id/viewings | `{scheduledAt: ISO with offset, notes, requestId: UUID}` |
| POST /api/deals/:id/transitions | `{to: "VIEWING_CONFIRMED"|"VIEWING_COMPLETED"|"CANCELLED",reason}` |
| GET /api/deals/:id/timeline?cursor=0 | Participant-only domain events, 50 per page |
| GET /api/analytics | Own persisted properties/requirements/matches/deals/viewings counts |
| GET /api/notifications?cursor=0 | Own notifications, 20 per page |
| PATCH /api/notifications | `{id}`; only updates own notification |

Property input:

```json
{
  "name": "Your property name",
  "description": "Accurate property details",
  "transactionType": "RENT",
  "propertyType": "CONDO",
  "price": "45000.00",
  "currency": "THB",
  "location": "Sukhumvit",
  "bedrooms": 2,
  "areaSqm": 80,
  "facilities": ["pool", "gym"]
}
```

Requirement input:

```json
{
  "title": "Two-bedroom Sukhumvit brief",
  "description": "Private additional requirement details",
  "transactionType": "RENT",
  "propertyType": "CONDO",
  "budgetMax": "50000.00",
  "currency": "THB",
  "locations": ["Sukhumvit"],
  "minBedrooms": 2,
  "facilities": ["pool", "gym"],
  "hardBudget": true,
  "hardLocation": true,
  "clientConsent": true
}
```

These are input examples, not seeded or active listings. Names and private client data should not be embedded in shared titles.

Monetary JSON fields must be decimal **strings**, positive, at most two decimal places, up to 999999999999.99. No floating-point monetary workflow is used. Property types: CONDO, HOUSE, HOTEL, LAND, COMMERCIAL. RENT means monthly THB; SALE means total THB.

Key errors: VALIDATION_ERROR 422, INVALID_ORIGIN 403, NOT_FOUND 404, INVALID_TRANSITION / STALE_DEAL / IDEMPOTENCY_CONFLICT / MUTUAL_MATCH_REQUIRED 409. No arbitrary deal state updates, offer/closing/payment/AI/document endpoints are implemented yet. The legacy lead/import APIs retain their own existing error envelopes; migration to the new envelope is out of this additive batch.
