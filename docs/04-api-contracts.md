# LILITH by THE MIDDLE — Architecture Blueprint
## Part 4 — API Contracts (Section 18)

> These contracts are normative. `packages/contracts` holds the zod schemas; the OpenAPI file is **generated** from them (`pnpm contracts:openapi`), never hand-written. Client and server both import the same schemas, so a contract change breaks the build on both sides — which is the point.

---

# 18. API Contracts

## 18.0 Conventions

- Base path `/api`. Admin under `/admin/api`. All JSON, UTF-8.
- Auth via `__Host-mp_session` cookie. Server-to-server (jobs) via `Authorization: Bearer <service token>`.
- Money in **satang** as a string-safe integer (`"amount": 1250000000` = ฿12,500,000.00) + `"currency": "THB"`. Never floats.
- Dates: RFC3339 UTC. Dates without time: `YYYY-MM-DD`.
- Pagination: cursor-based — `?limit=20&cursor=<opaque>` → `{ "data": [...], "next_cursor": "…"|null }`.
- Mutating requests accept `Idempotency-Key: <uuid>` (required for offers, transitions, payments).
- Concurrency: entities with `version` require `If-Match: "<version>"` on update; mismatch → `409`.
- Every response carries `X-Request-Id`; clients surface it on error screens.

### Error envelope (every non-2xx)

```jsonc
{
  "error": {
    "code": "DEAL_TRANSITION_NOT_ALLOWED",
    "message_en": "This deal cannot move from VIEWING_REQUESTED to DEAL_CLOSED.",
    "message_th": "ดีลนี้ไม่สามารถเปลี่ยนสถานะจาก VIEWING_REQUESTED เป็น DEAL_CLOSED ได้",
    "field_errors": { "amount": "must be greater than 0" },
    "request_id": "req_01J…",
    "retryable": false
  }
}
```

Canonical codes: `UNAUTHENTICATED` 401 · `FORBIDDEN` 403 · `TIER_INSUFFICIENT` 403 · `NOT_FOUND` 404 · `VALIDATION_FAILED` 422 · `CONFLICT_VERSION` 409 · `DEAL_TRANSITION_NOT_ALLOWED` 409 · `IDEMPOTENT_REPLAY` 200 (returns original) · `RATE_LIMITED` 429 · `AI_BUDGET_EXCEEDED` 429 · `AI_UNAVAILABLE` 503 (client must degrade, not block) · `INTERNAL` 500.

---

## 18.1 Auth & identity

```http
POST /api/auth/otp/request
{ "channel":"SMS", "destination":"+66812345678", "purpose":"LOGIN", "captcha_token":"…?" }
→ 200 { "challenge_id":"ch_…", "expires_at":"…", "resend_after_seconds":60 }
```

```http
POST /api/auth/otp/verify
{ "challenge_id":"ch_…", "code":"482913" }
→ 200 { "user": UserDTO, "next_step":"SELECT_ROLE|PROFILE|VERIFY_IDENTITY|HOME" }
→ 422 { code:"OTP_INVALID" }  |  429 { code:"RATE_LIMITED" }
```

```http
POST /api/auth/logout                      → 204
GET  /api/me                               → 200 { user, roles[], tier, active_role, flags{} }
PATCH/api/me/profile { display_name, avatar_media_id?, locale?, preferred_contact? } → 200 ProfileDTO
POST /api/me/roles   { "role":"OWNER" }    → 200 { roles[] }        // additive only; removal is admin-side
GET  /api/me/trust                         → 200 { tier, verifications[], trust_score, response_stats }
GET  /api/me/sessions                      → 200 { sessions[] }
DELETE /api/me/sessions/:id                → 204
POST /api/me/export                        → 202 { job_id }
POST /api/me/delete { reason? }            → 202 { deletion_request_id, effective_at }
```

**UserDTO**
```jsonc
{ "id":"usr_…", "display_name":"Ari", "avatar_url":null, "locale":"th-TH",
  "verification_tier":"T2", "roles":["OWNER","CLIENT"], "created_at":"…" }
```

---

## 18.2 Verification

```http
POST /api/verifications
{ "subject_type":"USER", "subject_id":"usr_…", "kind":"NATIONAL_ID", "document_id":"doc_…" }
→ 201 { verification_id, status:"PENDING" }

GET  /api/verifications?subject_type=USER&subject_id=usr_…   → 200 { data:[VerificationDTO] }
```

Admin decisions: `POST /admin/api/verifications/:id/decide { "decision":"APPROVED|REJECTED", "reason":"…" }` → recomputes `users.verification_tier`, emits `profile_verified`.

---

## 18.3 Uploads & documents

```http
POST /api/uploads/sign
{ "purpose":"PROPERTY_PHOTO|PROPERTY_DOCUMENT|MESSAGE_ATTACHMENT|VERIFICATION|AVATAR",
  "filename":"unit.jpg", "mime":"image/jpeg", "bytes":2394112, "sha256":"…" }
→ 200 { "document_id":"doc_…", "upload_url":"https://…", "method":"PUT",
         "headers":{...}, "expires_at":"…", "max_bytes":10485760 }

POST /api/uploads/:documentId/complete     → 200 { document: DocumentDTO, processing:true }
GET  /api/documents/:id/url                → 200 { url, expires_at }   // authorized + audited
```

Server-side after `complete`: magic-byte MIME check → EXIF strip / re-encode → blurhash → virus scan → `documents.virus_scanned_at`. A document is not readable until scanned.

---

## 18.4 Properties

```http
POST  /api/properties
{ "transaction_types":["RENT"], "property_type":"CONDO" }
→ 201 { property: PropertyPrivateDTO }        // status DRAFT, completion_score computed

PATCH /api/properties/:id          If-Match: "3"
{ /* any subset of wizard fields */ }
→ 200 { property, completion_score, missing_for_publish:["media","available_from"] }

POST  /api/properties/:id/media
{ "items":[{ "document_id":"doc_…","kind":"PHOTO","sort_order":0,"is_cover":true }] }
→ 200 { media:[PropertyMediaDTO] }

DELETE /api/properties/:id/media/:mediaId  → 204

POST  /api/properties/:id/publish
{ "acknowledge_ai_review": true, "ai_run_id":"air_…" }
→ 200 { property, status:"PUBLISHED"|"PENDING_REVIEW" }
→ 422 { code:"PROPERTY_INCOMPLETE", field_errors:{...} }
→ 403 { code:"TIER_INSUFFICIENT", message:"Sale listings require verified ownership (T4)" }

POST  /api/properties/:id/pause      { reason? }        → 200
POST  /api/properties/:id/archive    { reason }         → 200
GET   /api/properties/:id                                → 200 Public or Private DTO by authorization
GET   /api/properties?owner=me&status=PUBLISHED&limit=20 → 200 { data:[PropertySummaryDTO], next_cursor }
```

**PropertyPublicDTO** (what any authenticated T2 user may see — note what is *absent*)
```jsonc
{
  "id":"prp_…", "reference_code":"MP-2026-000123",
  "property_type":"CONDO", "transaction_types":["RENT"],
  "project_name":"The Line Sukhumvit 71", "area":{ "id":"loc_…","name_th":"พระโขนง","name_en":"Phra Khanong" },
  "geo_approx":{ "lat":13.7145,"lng":100.5960,"jitter_m":150 },
  "price":{ "rent_monthly_amount":4500000, "currency":"THB", "negotiable":true },
  "size_sqm":45.5, "bedrooms":1, "bathrooms":1, "floor":18,
  "furnishing":"FULLY", "pet_policy":"NEGOTIABLE", "available_from":"2026-10-01",
  "amenities":["AMENITY_GYM","AMENITY_POOL","AMENITY_COWORK"],
  "transit":[{ "system":"BTS","station":"Phra Khanong","walk_minutes":4 }],
  "media":[{ "url":"…signed…","blurhash":"L6P…","kind":"PHOTO","is_cover":true }],
  "badges":["OWNERSHIP_VERIFIED","FAST_RESPONDER","FRESH_7D"],
  "listed_by":{ "type":"AGENT","display_name":"K. Ploy","org":"Middle Property","verified":true },
  "published_at":"…", "last_verified_at":"…"
}
```
Absent by construction: `address_line`, `unit_number`, exact `geo_point`, owner identity/contact, documents.

**PropertyPrivateDTO** = public + `address_line`, `unit_number`, exact `geo_point`, `documents[]`, `owner`, `mandate`, `quality_flags`, `completion_score`, `version`.

---

## 18.5 Requirements

```http
POST  /api/requirements { "transaction_type":"RENT" }        → 201 RequirementDTO (DRAFT)
PATCH /api/requirements/:id   If-Match: "2"                  → 200 { requirement, completion_score }
POST  /api/requirements/:id/activate                         → 200 { requirement, status:"ACTIVE", matching_job_id }
POST  /api/requirements/:id/pause { reason? }                → 200
GET   /api/requirements?scope=me|client:<id>&status=ACTIVE   → 200 { data, next_cursor }
GET   /api/requirements/:id                                  → 200 RequirementDTO
```

**RequirementDTO** (excerpt)
```jsonc
{ "id":"req_…","status":"ACTIVE","transaction_type":"RENT",
  "property_types":["CONDO","APARTMENT"],
  "budget":{ "min_amount":3500000,"max_amount":4500000,"flex_pct":10,"currency":"THB" },
  "locations":[{ "id":"loc_…","name_en":"Thong Lo" }],
  "bedrooms":{ "min":1,"max":2 }, "size_sqm":{ "min":35,"max":60 },
  "move_in":{ "from":"2026-10-01","to":"2026-11-15" }, "lease_months":12,
  "furnishing_pref":"FULLY", "pet_requirement":"SMALL_PET",
  "max_walk_minutes_to_transit":7,
  "preferences":[{ "key":"AMENITY_POOL","importance":"NICE" },
                 { "key":"HIGH_FLOOR","importance":"BONUS" }],
  "special_requirements_text":"ต้องการห้องมุม เงียบ ไม่ติดถนนใหญ่",
  "extracted_attributes":{ "corner_unit":true,"low_noise":true,
      "_meta":{ "ai_run_id":"air_…","confidence":0.78,"prompt_version":"extract_requirement@4" } },
  "urgency":"WITHIN_1M","version":2 }
```

---

## 18.6 Matching

```http
GET /api/matches/feed?requirement_id=req_…&limit=20&cursor=…
→ 200 {
  "data":[ {
     "match_id":"mch_…","score":87,"confidence":0.82,"band":"EXCEPTIONAL",
     "property": PropertyPublicDTO,
     "top_reasons":[ { "code":"WALK_UNDER_TARGET","text_th":"เดิน 4 นาทีถึง BTS ทองหล่อ","text_en":"…" },
                     { "code":"IN_TARGET_AREA","text_th":"…","text_en":"…" },
                     { "code":"OVER_BUDGET_WITHIN_FLEX","kind":"TRADEOFF","text_th":"…","text_en":"…" } ],
     "expires_at":"…" } ],
  "next_cursor":"…",
  "meta":{ "weight_profile":"default_rent_v1@1","generated_at":"…","total_candidates":142 }
}
```

```http
GET /api/matches/:id/explanation
→ 200 {
  "score":87,"confidence":0.82,"weight_profile":"default_rent_v1@1",
  "dimension_scores":{ "location":1.0,"budget":0.72,"bedrooms":1.0,"transport":1.0,"furnishing":0.2, "...":0 },
  "matched_constraints":[…], "tradeoffs":[…], "unmatched_constraints":[…],
  "match_explanation":{ "text_th":"…","text_en":"…","source":"AI","model":"gpt-4.1-mini",
                        "prompt_version":"explain_match@3","confidence":0.9,
                        "generated_at":"…","ai_run_id":"air_…" }
}
```

```http
POST /api/matches/:id/interest   Idempotency-Key: …
{ "super": false, "note": "สนใจครับ ขอเข้าชมสัปดาห์หน้า" }
→ 200 { "match": { "status":"INTERESTED_BY_DEMAND"|"MUTUAL" },
        "mutual": true, "deal_room_id":"drm_…"|null }
→ 429 { code:"SUPER_MATCH_QUOTA_EXCEEDED", "resets_at":"…" }

POST /api/matches/:id/pass { "reason_code":"TOO_EXPENSIVE|LOCATION|SIZE|PHOTOS|OTHER" } → 200
GET  /api/matches?status=MUTUAL|INTERESTED&role=demand|supply&limit=20 → 200 { data, next_cursor }
GET  /api/matches/:id → 200 { match, property, requirement_summary, deal_room_id? }
```

Pass reasons are not cosmetic — they feed weight-profile calibration.

---

## 18.7 Deals

```http
GET  /api/deals?status=&limit=20                → 200 { data:[DealSummaryDTO], next_cursor }
GET  /api/deals/:id                             → 200 DealDTO
GET  /api/deals/:id/timeline?limit=50           → 200 { data:[TimelineItem] }   // transitions+messages+viewings+offers merged
GET  /api/deals/:id/stream                      → text/event-stream (SSE)
```

**The single transition endpoint** — every state change goes through it:

```http
POST /api/deals/:id/transitions      Idempotency-Key: …   If-Match: "7"
{ "to":"VIEWING_CONFIRMED",
  "payload":{ "selected_slot_id":"slt_…","location_note":"Lobby ชั้น G" },
  "reason": null }
→ 200 { "deal": DealDTO, "transition": { "from":"VIEWING_REQUESTED","to":"VIEWING_CONFIRMED","occurred_at":"…" },
        "events_emitted":["viewing.confirmed"] }
→ 409 { code:"DEAL_TRANSITION_NOT_ALLOWED", "allowed_from_here":["VIEWING_COMPLETED","CANCELLED"] }
→ 403 { code:"FORBIDDEN", message:"Only the counterparty can confirm a viewing" }
```

Convenience endpoints exist for ergonomics but **delegate to the same function**:

```http
POST /api/deals/:id/messages { "body":"…","attachments":["doc_…"] }        → 201 MessageDTO
GET  /api/deals/:id/messages?limit=50&before_seq=…                         → 200 { data, next_cursor }
POST /api/deals/:id/messages/read { "up_to_seq": 812 }                     → 204

POST /api/deals/:id/viewings
{ "slots":[{"starts_at":"…","ends_at":"…"},…], "attendees":[{"name":"…","role":"CLIENT"}], "note":"" }
→ 201 ViewingDTO (deal → VIEWING_REQUESTED)
POST /api/deals/:id/viewings/:vid/confirm  { "selected_slot_id":"…","location_note":"" } → 200
POST /api/deals/:id/viewings/:vid/reschedule { "reason":"…","slots":[…] }                → 200
POST /api/deals/:id/viewings/:vid/complete { "outcome":"POSITIVE|NEUTRAL|NEGATIVE","feedback":{…} } → 200
POST /api/deals/:id/viewings/:vid/cancel   { "reason_code":"…","reason_text":"" }        → 200

POST /api/deals/:id/offers
{ "amount":4200000, "currency":"THB",
  "terms":{ "lease_months":12,"deposit_months":2,"advance_months":1,
            "furniture_included":true,"move_in_date":"2026-10-15" },
  "expires_at":"2026-09-12T17:00:00Z" }
→ 201 OfferDTO (deal → OFFER_SUBMITTED)
POST /api/deals/:id/offers/:oid/counter  { "amount":4350000,"terms":{…},"expires_at":"…" } → 201
POST /api/deals/:id/offers/:oid/accept                                                     → 200 { deal, agreement_required:true }
POST /api/deals/:id/offers/:oid/reject   { "reason_code":"…" }                             → 200
POST /api/deals/:id/offers/:oid/withdraw                                                   → 200

POST /api/deals/:id/agreement
{ "document_id":"doc_…","type":"LEASE","signers":[{ "user_id":"usr_…","method":"UPLOAD_SIGNED" }] }
→ 201 AgreementDTO (deal → AGREEMENT_PENDING)
POST /api/deals/:id/agreement/sign { "evidence_document_id":"doc_…" }  → 200 (→ AGREEMENT_SIGNED when all signed)

POST /api/deals/:id/close
{ "transaction_value_amount":125000000000, "currency":"THB",
  "closed_at":"2026-09-30","evidence_document_id":"doc_…" }
→ 200 { "deal":{ "status":"AGREEMENT_SIGNED","close_confirmations":[{ "user_id":"…","at":"…" }] },
        "awaiting_confirmation_from":["usr_…"] }
   // when the second party confirms with a matching value → status DEAL_CLOSED + fee.generate enqueued
→ 409 { code:"CLOSE_VALUE_MISMATCH", "message_en":"The other party entered a different transaction value.",
        "escalated_to_support":true }

POST /api/deals/:id/cancel { "reason_code":"PRICE|TIMING|PROPERTY_UNAVAILABLE|CLIENT_WITHDREW|OTHER","reason_text":"" } → 200
```

**DealDTO**
```jsonc
{ "id":"del_…","reference_code":"MP-DEAL-2026-000042","status":"VIEWING_CONFIRMED","version":7,
  "property": PropertySummaryDTO, "requirement": RequirementSummaryDTO,
  "participants":[{ "user_id":"…","display_name":"K. Ploy","role":"LISTING_AGENT",
                    "can_negotiate":true,"can_close":true,"contact":{ "phone":"+66…","line_id":"…" } }],
  "current_viewing": ViewingDTO|null,
  "current_offer": OfferDTO|null,
  "allowed_transitions":["VIEWING_COMPLETED","VIEWING_REQUESTED","CANCELLED"],
  "unread_messages": 3,
  "opened_at":"…","updated_at":"…" }
```

`allowed_transitions` is computed server-side from the FSM **and the caller's permissions** — the client renders buttons from this array and nothing else. This is how the UI can never offer an action the server will refuse.

`participants[].contact` is present only when `status >= DEAL_ROOM_OPENED` and the caller is a participant.

**SSE event frames** on `/api/deals/:id/stream`:
```
event: message.created      data: { message: MessageDTO }
event: deal.transitioned    data: { from, to, deal: DealDTO }
event: viewing.updated      data: { viewing: ViewingDTO }
event: offer.updated        data: { offer: OfferDTO }
event: participant.typing   data: { user_id, at }
event: heartbeat            data: { at }        (every 25s)
```

---

## 18.8 Fees, invoices, payments

```http
GET  /api/deals/:id/fee
→ 200 { "fee":{ "id":"fee_…","status":"ISSUED",
        "transaction_value_amount":125000000000,
        "fee_basis":"TRANSACTION_VALUE","fee_basis_amount":125000000000,
        "fee_rate_bp":10,"fee_amount":125000000,"vat_amount":8750000,"total_amount":133750000,
        "currency":"THB","payer":{ "user_id":"…","display_name":"…" },
        "rule":{ "code":"middle_success_fee","version":1 },
        "computed_at":"…" },
      "invoice":{ "id":"inv_…","invoice_number":"MP-INV-2026-000042","status":"ISSUED",
        "due_at":"…","pdf_url":"…signed…" },
      "payments":[…], "receipt":null }

GET  /api/invoices/:id                      → 200 InvoiceDTO
GET  /api/invoices/:id/pdf                  → 302 signed URL
POST /api/invoices/:id/payments
{ "method":"BANK_TRANSFER","amount":133750000,"paid_at":"…","reference":"…","evidence_document_id":"doc_…" }
→ 201 { payment:{ status:"PENDING" } }      // operator confirms; V1 replaces with provider webhook
GET  /api/receipts/:id/pdf                  → 302 signed URL
```

Admin-only: `POST /admin/api/payments/:id/confirm`, `POST /admin/api/fees/:id/waive { reason }` (dual control), `POST /admin/api/invoices/:id/void { reason }`.

---

## 18.9 Lilith AI endpoints

All return the `{ data, meta }` envelope of §10.2.

```http
POST /api/ai/extract-property
{ "property_id":"prp_…"?, "text":"คอนโด 1 ห้องนอน 45 ตร.ม. ชั้น 18 …", "language":"th" }
→ 200 { "data":{ "fields":{ "bedrooms":{ "value":1,"confidence":0.95 },
                            "size_sqm":{ "value":45.5,"confidence":0.9 }, … },
                 "amenity_codes":["AMENITY_GYM"], "red_flags":[] },
        "meta":{ … } }

POST /api/ai/extract-requirement { "requirement_id":"req_…"?, "text":"…","language":"th" }
→ 200 { "data":{ "fields":{…}, "preferences":[…], "ambiguities":["ต้องการกี่ห้องน้ำ?"] }, "meta":{…} }

POST /api/ai/normalize { "kind":"PROJECT_NAME|AMENITY|LOCATION","values":["ฟิตเนส","the line 71"] }
→ 200 { "data":{ "normalized":[{ "input":"ฟิตเนส","code":"AMENITY_GYM","confidence":1.0,"source":"DICTIONARY" }] }, "meta":{…} }

POST /api/ai/explain-match { "match_id":"mch_…" }        → 200 { data:{ text_th, text_en }, meta }
POST /api/ai/deal-summary  { "deal_id":"del_…" }
→ 200 { "data":{ "summary_th":"…","summary_en":"…",
                 "open_items":[{ "code":"AWAITING_COUNTER","text_th":"…" }],
                 "suggested_actions":[{ "action":"SEND_COUNTER","label_th":"ยื่นข้อเสนอกลับ" }],
                 "risks":[{ "code":"OFFER_EXPIRES_SOON","severity":"HIGH" }] }, "meta":{…} }

POST /api/ai/detect-duplicate { "property_id":"prp_…" }
→ 200 { "data":{ "candidates":[{ "property_id":"prp_…","similarity":0.94,"is_duplicate":true,
                                 "evidence":["same unit number","cover photo pHash distance 3"] }] }, "meta":{…} }

POST /api/ai/property-review { "property_id":"prp_…" }    // composite, used by screen 13
→ 200 { "data":{ "quality_score":78, "missing":["floorplan"],
                 "suggestions":[{ "field":"description","reason":"…","proposed_th":"…" }],
                 "duplicate_candidates":[…], "policy_flags":[] }, "meta":{…} }

POST /api/ai/runs/:id/feedback { "rating":"UP|DOWN","comment":"" } → 204
POST /api/ai/runs/:id/override { "field":"bedrooms","value":2 }    → 200  // records human_decision
```

`503 AI_UNAVAILABLE` is a **normal, designed response**: screens 13, 18, 21 and 28 must all render a working non-AI variant.

---

## 18.10 Insights, notifications, misc

```http
GET /api/insights/overview?scope=owner|agent|client&area_id=&period=90d
→ 200 { "panels":[
   { "code":"DEMAND_PRESSURE","area":"Thong Lo","value":2.4,"unit":"requirements_per_listing","trend":"+12%" },
   { "code":"ASKING_VS_AGREED","median_gap_pct":-6.2,"sample_size":31 },
   { "code":"DAYS_TO_FIRST_INTEREST","median":4,"sample_size":58 },
   { "code":"UNMET_DEMAND_ATTRIBUTES","items":[{ "attribute":"PET_FRIENDLY","demand_share":0.31,"supply_share":0.11 }] } ],
   "suppressed_panels":["AGREED_PRICE_BY_PROJECT"], "suppression_reason":"sample_below_k10" }

GET  /api/notifications?unread=true&limit=20   → 200 { data, unread_count, next_cursor }
POST /api/notifications/:id/read               → 204
POST /api/notifications/read-all               → 204
GET  /api/notifications/preferences            → 200 { prefs[] }
PUT  /api/notifications/preferences            → 200
POST /api/push/subscribe { subscription }      → 204

GET  /api/geo/search?q=ทองหล่อ&level=AREA      → 200 { data:[LocationDTO] }
GET  /api/geo/stations?near=13.72,100.58&radius=1500 → 200 { data:[StationDTO] }
GET  /api/amenities                            → 200 { data:[AmenityDTO] }   // cached 24h
GET  /api/health                               → 200 { status, db, queue, ai, version }
```

---

## 18.11 Admin API (excerpt)

```http
GET  /admin/api/queues/:queue?status=PENDING            → 200 { data:[QueueItemDTO] }
POST /admin/api/queues/items/:id/decide { "decision":"APPROVE|REJECT|ESCALATE","reason":"…" } → 200
GET  /admin/api/users/:id/timeline                       → 200 { data:[TimelineItem] }
POST /admin/api/users/:id/suspend { "reason":"…","until":"…" } → 200
POST /admin/api/properties/:id/force-unpublish { "reason":"…" } → 200
POST /admin/api/deals/:id/force-transition { "to":"…","reason":"…" } → 200
GET  /admin/api/weight-profiles                          → 200
POST /admin/api/weight-profiles/:id/shadow-score { "sample":2000 } → 202 { report_job_id }
GET  /admin/api/weight-profiles/:id/shadow-report        → 200 { score_delta_histogram, rank_changes, top10_churn_pct }
POST /admin/api/weight-profiles/:id/publish { "reason":"…" } → 200   // enqueues rescore
POST /admin/api/fee-rules { … }                          → 201
POST /admin/api/fee-rules/:id/publish                    → 200 (dual control)
POST /admin/api/prompt-versions/:id/activate             → 200 (requires passing eval report)
GET  /admin/api/audit?actor=&subject_type=&subject_id=&from=&to= → 200 { data, next_cursor }
GET  /admin/api/reconciliation/daily?date=               → 200 { fees_issued, invoices_issued, payments_confirmed, drift }
```

---

## 18.12 Screen → endpoint coverage check

| Screen | Primary endpoints |
|---|---|
| 01 Splash | `GET /api/me` |
| 02 Welcome | — (static) |
| 03 Sign Up / Login | `POST /api/auth/otp/request` |
| 04 OTP | `POST /api/auth/otp/verify` |
| 05 Select Role | `POST /api/me/roles` |
| 06 Profile Setup | `PATCH /api/me/profile`, `POST /api/uploads/sign` |
| 07 Owner Dashboard | `GET /api/properties?owner=me`, `GET /api/matches?role=supply`, `GET /api/deals` |
| 08–11 Property wizard | `POST /api/properties`, `PATCH /api/properties/:id`, `GET /api/geo/search`, `GET /api/amenities` |
| 12 Media/Docs | `POST /api/uploads/sign`, `POST /api/properties/:id/media` |
| 13 Lilith Property Review | `POST /api/ai/property-review`, `POST /api/properties/:id/publish` |
| 14 Agent Dashboard | `GET /api/requirements?scope=me`, `GET /api/deals`, `GET /api/insights/overview?scope=agent` |
| 15–17 Requirement wizard | `POST /api/requirements`, `PATCH …`, `POST /api/ai/extract-requirement` |
| 18 Requirement Summary | `POST /api/ai/requirement-summary`, `POST /api/requirements/:id/activate` |
| 19 Discover | `GET /api/matches/feed` |
| 20 Property Detail | `GET /api/properties/:id` |
| 21 Why This Match | `GET /api/matches/:id/explanation` |
| 22 Pass | `POST /api/matches/:id/pass` |
| 23 Interested | `POST /api/matches/:id/interest` |
| 24 Super Match | `POST /api/matches/:id/interest {super:true}` |
| 25 It's a Match | SSE + `GET /api/matches/:id` |
| 26 Match Inbox | `GET /api/matches?status=` |
| 27 Deal Room | `GET /api/deals/:id`, `/messages`, `/stream` |
| 28 Lilith Deal Assistant | `POST /api/ai/deal-summary` |
| 29 Schedule Viewing | `POST /api/deals/:id/viewings` |
| 30 Viewing Confirmed | `POST …/viewings/:vid/confirm` |
| 31 Offer / Negotiation | `POST …/offers`, `/counter`, `/accept` |
| 32 Deal Timeline | `GET /api/deals/:id/timeline` |
| 33 Deal Successful | `POST /api/deals/:id/close` |
| 34 Success Fee | `GET /api/deals/:id/fee` |
| 35 Receipt | `GET /api/invoices/:id/pdf`, `GET /api/receipts/:id/pdf` |
| 36 Lilith Analytics | `GET /api/insights/overview` |
| 37 Notifications | `GET /api/notifications` |
| 38 Profile / Trust | `GET /api/me`, `GET /api/me/trust`, `GET /api/me/sessions` |

All 38 screens are covered. No screen requires an endpoint that does not exist in this contract.
