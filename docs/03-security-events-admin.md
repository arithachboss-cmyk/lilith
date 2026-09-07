# LILITH by THE MIDDLE — Architecture Blueprint
## Part 3 — Auth, Security, Events, Admin (Sections 14–17)

---

# 14. Authentication + Authorization

## 14.1 Authentication

**Primary factor: phone OTP (Thai market reality).** Secondary: email magic link. No passwords in V1 — nothing to leak, nothing to reuse.

```
POST /api/auth/otp/request { channel:'SMS', destination:'+66812345678', purpose:'LOGIN' }
   → rate limit (3 / 15 min per destination, 20 / h per IP)
   → generate 6-digit code, store bcrypt hash, ttl 5 min, attempts=0
   → dispatch via SMS provider, log delivery id (never log the code)
   → 200 { challenge_id, expires_at, resend_after }   // same response whether or not the number exists

POST /api/auth/otp/verify { challenge_id, code }
   → constant-time compare against hash, attempts++ (max 5, then invalidate)
   → on success: consume code, upsert user, create session
   → set cookie: __Host-mp_session · HttpOnly · Secure · SameSite=Lax · Path=/ · 30d rolling
   → 200 { user, nextStep: 'SELECT_ROLE' | 'PROFILE' | 'VERIFY_IDENTITY' | 'HOME' }
```

Session handling
- Opaque random 32-byte token; only `sha256(token)` is stored in `sessions`. No JWT — revocation must be instant.
- Rolling expiry: 30 days idle, absolute 180 days.
- Rotation on privilege change (role added, tier upgraded) and on suspicious IP/UA change.
- `GET /api/me` returns identity + roles + tier; the client caches it but never derives permission from it.
- Device list + "sign out everywhere" on screen 38.
- Admin accounts additionally require TOTP (mandatory, enrolled at grant time) and are limited to an allow-listed IP range in production if the operator team is fixed.

## 14.2 Authorization model

Three layers, all evaluated **server-side, per request**:

```
L1 ROLE       — does the actor hold the role required by this operation?
L2 OWNERSHIP  — is the actor the owner / participant of this specific resource?
L3 TIER       — does the actor's verification tier permit this operation?
```

Implementation:

```ts
// packages/core/authz/policies.ts
export const policies = {
  'property.publish': async (ctx, prop) =>
      ctx.hasRole('OWNER','AGENT')
   && (prop.owner_user_id === ctx.userId || await hasActiveMandate(ctx.userId, prop.id))
   && ctx.tier >= 'T2'
   && (prop.transaction_types.includes('SALE') ? ctx.tier >= 'T4' || prop.ownership_verified : true),

  'deal.read': async (ctx, deal) => isParticipant(ctx.userId, deal.deal_room_id),
  'deal.transition:DEAL_CLOSED': async (ctx, deal) =>
      isParticipant(ctx.userId, deal.deal_room_id) && participantCan(ctx.userId, deal, 'can_close'),
  'document.read': async (ctx, doc) => documentVisibilityAllows(ctx, doc),
  'admin.*': async (ctx) => ctx.hasRole('ADMIN') && ctx.mfaVerified,
} as const;
```

Every route handler calls `await authorize(ctx, 'deal.read', deal)` — there is no other path. A CI test enumerates all route handlers and fails the build if any mutating handler lacks an `authorize()` call (AST check).

**Defence in depth — Postgres Row Level Security.** RLS is enabled on `deal_rooms`, `messages`, `deals`, `offers`, `viewings`, `property_documents`, `documents` with policies keyed on `current_setting('app.user_id')`, which the connection wrapper sets per request. Even a SQL-injection or a careless query cannot cross a deal boundary. The admin connection uses a separate role that bypasses RLS and is only reachable from admin routes.

## 14.3 Permission matrix (excerpt — full matrix in `packages/core/authz/matrix.ts`, and it is the test fixture)

| Operation | OWNER (self) | AGENT (mandate) | AGENT (no mandate) | CLIENT | ADMIN |
|---|---|---|---|---|---|
| `property.create` | T2 | T3 | T3 | ✕ | ✅ audited |
| `property.publish` | T2 (+T4 for SALE) | T3 + active mandate | ✕ | ✕ | ✅ |
| `property.read.private` | ✅ own | ✅ mandated | ✕ | deal participant only | ✅ |
| `requirement.create` | T2 | T3 (for managed client) | T3 | T2 | ✅ audited |
| `match.interest` | T2 | T3 | ✕ | T2 | ✕ |
| `deal.message.send` | participant | participant | ✕ | participant | support participant |
| `offer.submit` | participant + can_negotiate | participant + can_negotiate | ✕ | participant | ✕ |
| `deal.close` | participant + can_close | participant + can_close | ✕ | participant + can_close | ✅ + reason |
| `fee.waive` | ✕ | ✕ | ✕ | ✕ | ✅ + reason + dual control |
| `document.read(TITLE_DEED)` | ✅ own | ✕ (unless deal + owner consent) | ✕ | ✕ | ✅ |

## 14.4 Agent-on-behalf-of

When an agent acts for a managed client, the request carries `X-On-Behalf-Of: <client_user_id>`. The server verifies `client_profiles.managed_by_agent_id = agent.user_id` **and** an active consent record, then sets `ctx.onBehalfOf`. Every write records both identities. The client can revoke management at any time from screen 38, which immediately invalidates the delegation.

---

# 15. Privacy + Security

## 15.1 PDPA alignment (Thailand)

| Requirement | Implementation |
|---|---|
| Lawful basis | Consent for marketing; contract necessity for deal data; legal obligation for tax/AML records. Basis recorded per `consents` row. |
| Consent records | `consents (user_id, purpose, version, granted_at, revoked_at, ip, evidence)` — purposes: `TOS`, `PRIVACY`, `MARKETING_EMAIL`, `CONTACT_SHARING`, `AI_PROCESSING` |
| Data subject access | `GET /api/me/export` → job builds a JSON+PDF bundle, delivered via signed URL, completed within 30 days (target: 24h) |
| Right to erasure | `POST /api/me/delete` → pseudonymisation flow (§8.3), with statutory retention exceptions disclosed |
| Purpose limitation | property/requirement data is not used for anything outside matching and intelligence aggregates; aggregates are published only at k≥10 anonymity |
| Cross-border transfer | LLM provider processes redacted text only; disclosed in the privacy notice; a Thailand-region or self-hosted model is the V2 exit path |
| DPO / breach | Breach runbook: detect → contain → assess → notify Office of the PDPC within 72h → notify affected users |

## 15.2 Encryption and secrets

| Layer | Control |
|---|---|
| In transit | TLS 1.3 everywhere; HSTS preload; no mixed content |
| At rest (DB) | Provider-level disk encryption + **column-level encryption** (`pgcrypto`, AES-256-GCM, key from KMS/env) for `national_id`, `tax_id`, `licence_no`, `line_id`, `payout_method`, `phone_e164` (searchable via a separate blind index HMAC) |
| At rest (objects) | R2 SSE; documents bucket private; object keys are random UUIDs, never guessable paths |
| Secrets | Vercel env + a `.env.example` that lists every key with no values; secrets never in the repo, rotated quarterly; CI uses a scoped deploy token |
| Signed URLs | 15 min TTL for documents, 60 min for property photos; single-use tokens for title deeds; every issuance logged with `document.read` audit |
| Password/OTP | bcrypt(cost 12) for OTP hashes; no password store in V1 |

## 15.3 Application security controls

- **Input:** every route validates with zod at the boundary; unknown keys stripped; string lengths bounded.
- **Output:** DTO serialisers, not raw entities. `PropertyPublicDTO` omits `address_line`, `unit_number`, exact `geo_point` (jittered ±150m), documents and owner contact — it is impossible to leak them through the public endpoint because the field is absent from the type.
- **CSRF:** SameSite=Lax cookies + origin check on all mutating requests + double-submit token for the admin shell.
- **XSS:** React escaping; no `dangerouslySetInnerHTML` except a sanitised markdown renderer (`rehype-sanitize`) for AI summaries; CSP with nonces, `frame-ancestors 'none'`.
- **File uploads:** presigned PUT; server validates MIME by magic bytes after upload; images re-encoded (strips EXIF **including GPS**); size caps (photo 10MB, document 25MB); ClamAV scan job before a document becomes readable.
- **SSRF:** no user-supplied URL fetching. Geocoding calls use a fixed provider host.
- **SQL:** Prisma parameterised; raw SQL only in reviewed files under `packages/core/**/sql/` with `$1` binding.
- **Rate limiting:** §7.6, plus adaptive lockout on OTP abuse and a CAPTCHA (Turnstile) on the third OTP request per hour.
- **Dependency hygiene:** `pnpm audit` + Dependabot in CI; build fails on `high` severity with no accepted exception.
- **Headers:** CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` minimal.

## 15.4 Fraud & abuse controls

| Vector | Control |
|---|---|
| Fake listings | T2 required to publish; T4 ownership check for sale listings; duplicate detection; photo reverse-hash against known stock/scraped sets; new-account listings held for review above a price threshold |
| Duplicate spam | pHash + trigram + embedding pipeline (§10.3 T6); a user with 3 confirmed duplicates is auto-restricted pending review |
| Price manipulation | price outliers (>3σ vs project median) flagged into `moderation_queue` before publish |
| Fee circumvention | contact masking pre-viewing; "deal went offline" detection (mutual match → viewing completed → sudden silence → both parties inactive) triggers a follow-up survey rather than an accusation; ToS defines the fee obligation |
| Account takeover | OTP rate limits, session rotation, new-device notification, sensitive actions (payout method, phone change) require a fresh OTP |
| Harassment | in-room reporting, message pattern flags, one-click block that disqualifies future matches (D1) |
| Scraping | public property endpoint returns jittered geo, no contact, rate-limited by IP+fingerprint, bot detection on the discover feed |

## 15.5 Audit log discipline

Everything in this list writes `audit_logs`, always with `actor`, `subject`, `before/after`, `reason` where applicable:

```
auth.login, auth.logout, auth.otp_failed, session.revoked
role.granted, role.revoked, tier.changed
verification.submitted, verification.approved, verification.rejected
property.published, property.unpublished, property.force_unpublished, property.deleted
document.read, document.download, document.deleted
deal.transition (every one), deal.force_transition
message.redacted
offer.submitted, offer.accepted
fee.computed, fee.overridden, fee.waived, invoice.issued, invoice.voided, payment.confirmed
admin.impersonate_start / _end   (impersonation is read-only and time-boxed to 30 min)
export.requested, export.delivered, account.deletion_requested
ai.output_overridden
weight_profile.published, fee_rule.published, prompt_version.activated
```

`audit_logs` is append-only at the database level (trigger blocks UPDATE/DELETE), backed up separately, and retained 7 years.

---

# 16. Analytics / Event Architecture

## 16.1 Three streams, deliberately separated

| Stream | Table | Purpose | Guarantee | Retention | Consumer |
|---|---|---|---|---|---|
| **Product analytics** | `events` | funnel, activation, retention, experiments | best-effort, may sample | 24 mo raw | product, growth |
| **Domain events** | `outbox` | drive side effects (notifications, jobs, rescoring) | exactly-committed, at-least-once delivery | 30 d after processing | system |
| **Audit events** | `audit_logs` | who did what to which resource, legally defensible | must never be lost, append-only | 7 y | compliance, support |

A single user action commonly writes all three. They are never merged: analytics can be sampled and dropped; audit can never.

## 16.2 Event naming convention

`<object>_<past_tense_verb>` in `snake_case`, object first so the namespace sorts usefully.
Every event carries the envelope:

```jsonc
{
  "event_name": "interest_expressed",
  "occurred_at": "2026-09-07T10:22:31.412Z",
  "user_id": "…", "anonymous_id": "…", "session_id": "…",
  "role": "CLIENT", "source": "WEB", "schema_version": 1,
  "subject_type": "MATCH", "subject_id": "…",
  "props": { "side": "DEMAND", "action": "INTERESTED", "score": 87, "position_in_deck": 3 }
}
```

## 16.3 Event taxonomy (V1 registry — `packages/contracts/events.ts` is the single source; unregistered names are rejected at compile time)

**Acquisition & identity**
```
app_opened, welcome_viewed
signup_started, otp_requested, otp_submitted, otp_verified, signup_completed
role_selected, profile_completed
verification_submitted, profile_verified, verification_rejected
login_succeeded, login_failed
```

**Supply**
```
property_draft_created, property_step_completed{step}, media_uploaded{kind,count}
ai_property_review_requested, ai_property_review_accepted{fields_edited}
property_published, property_paused, property_archived, property_rejected{reason}
```

**Demand**
```
requirement_draft_created, requirement_step_completed{step}
ai_requirement_extracted{fields_filled, ambiguities}
requirement_activated, requirement_paused, requirement_fulfilled
```

**Matching**
```
match_generated{score,confidence,profile}          (server)
match_feed_served{count, avg_score}                (server)
match_viewed{position_in_deck, dwell_ms}
match_explanation_viewed
interest_expressed{side, action}
match_passed{side, reason?}
super_match_used
match_mutual
```

**Deal**
```
deal_room_opened, contact_disclosed
message_sent{length_bucket, has_attachment}, message_read
viewing_requested{slots_offered}, viewing_confirmed{lead_time_hours}
viewing_completed{outcome}, viewing_no_show, viewing_cancelled
offer_submitted{amount_bucket, round}, offer_countered, offer_accepted, offer_rejected, offer_expired
agreement_sent, agreement_signed
deal_closed{transaction_value_bucket, days_from_match}
deal_cancelled{stage, reason_code}
```

**Money**
```
fee_generated{amount_bucket}, invoice_issued, invoice_viewed
payment_recorded, fee_paid, fee_waived{reason_code}, receipt_downloaded
```

**Intelligence & system**
```
insights_viewed{panel}, notification_sent{type,channel}, notification_opened{type}
ai_run_completed{task, status, latency_ms, cost_micro_usd}   (server)
ai_output_overridden{task, field}
error_shown{code, route}
```

Privacy rules for events: never put raw price, exact address, phone, email or free text in `props`. Money is bucketed (`"45k-60k"`), text is length-bucketed. This makes the analytics store safe to query broadly without a PII review each time.

## 16.4 North-star and funnel model

**North star:** *closed deals per month*, with *time from mutual match to deal closed* as the health metric.

```
Funnel A — Supply activation
  signup_completed → profile_verified → property_draft_created → property_published
Funnel B — Demand activation
  signup_completed → requirement_activated → match_viewed(≥10) → interest_expressed
Funnel C — The core loop
  match_viewed → interest_expressed → match_mutual → deal_room_opened
  → viewing_confirmed → viewing_completed → offer_submitted → deal_closed
Funnel D — Revenue
  deal_closed → fee_generated → invoice_issued → fee_paid
```

Metrics defined once, in `packages/analytics/metrics.sql`, materialised nightly into `daily_rollups`:

| Metric | Definition |
|---|---|
| Match precision | interests / matches shown, by score band — validates the weight profile |
| Mutual rate | mutual matches / interests expressed |
| Room→viewing rate | viewings confirmed / rooms opened |
| Viewing→offer rate | offers / viewings completed |
| Close rate | deals closed / rooms opened |
| Median cycle time | `deal_closed.occurred_at − deal_room.opened_at` |
| Supply liquidity | published properties with ≥1 mutual in 30 days ÷ all published |
| Demand liquidity | active requirements with ≥1 mutual in 30 days ÷ all active |
| Response health | median first response minutes, per role |
| AI trust | % of AI-extracted fields accepted unedited |
| Fee realisation | fees paid ÷ fees issued |

**Score-band calibration is the single most important feedback loop:** if the 85+ band does not produce a materially higher interest rate than the 70–84 band, the weight profile is wrong. This is a weekly automated report, not an ad-hoc query.

## 16.5 Property Intelligence (screen 36)

Derived, never raw: per area / project / bedroom-count, from the platform's own supply + demand,

- asking price distribution vs. **agreed** price distribution (the number no listing site has),
- demand pressure index = active requirements matching that segment ÷ published supply,
- median days to first interest, to viewing, to close,
- top unmet requirement attributes in that area (what demand wants and supply doesn't have),
- absorption trend, 8-week rolling.

Guardrails: any cell with fewer than 10 underlying deals or 10 distinct properties is suppressed (k-anonymity); owner-specific figures are visible only to that owner; agents see aggregates, never a competitor's individual performance.

---

# 17. Admin / Operations

## 17.1 Backoffice scope (`/admin`, desktop-first, separate shell)

| Console | Function | SLA |
|---|---|---|
| **Verification queue** | review identity/licence/ownership documents, approve/reject with reason, set tier | 4 business hours |
| **Listing moderation** | new listing review, quality flags, price outliers, force unpublish | 8 hours |
| **Duplicate review** | side-by-side comparison, merge or dismiss, mark canonical | 24 hours |
| **Fraud & reports** | user reports, pattern alerts, restrict/suspend accounts | 2 hours for fraud |
| **Deal support** | read-only deal view, join a room as `ADMIN_SUPPORT` (announced in the room), force transition with reason | 4 hours |
| **Disputes** | structured dispute record, evidence collection, resolution note | 3 business days |
| **Fee & reconciliation** | issue/void invoices, confirm payments, waive with dual control, nightly reconciliation report | daily |
| **Weight profiles** | edit draft, shadow-score, diff report, publish, rollback | on demand |
| **Fee rules** | version editor, effective dating, preview against historic deals | on demand |
| **Prompt versions** | edit, eval report, activate, rollback | on demand |
| **Audit search** | query by actor/subject/action/time; export CSV | on demand |
| **Analytics** | funnels, cohort retention, score-band calibration, revenue | daily |

## 17.2 Operational safety rules

- **Impersonation is read-only** and time-boxed to 30 minutes, banner-visible to the admin, logged at start and end. There is no "act as user" write path. Support actions are performed as `ADMIN_SUPPORT` under the admin's own identity.
- **Dual control** for: fee waiver, invoice void, account deletion, force-close of a deal with a fee, and publishing a fee rule. Implemented as a `pending_admin_actions` row requiring a second admin's approval.
- **Reason text is mandatory** on every destructive or overriding action; the UI cannot submit without it.
- **Admin privilege separation:** `SUPPORT` (read + queues), `OPERATOR` (moderation + deals), `FINANCE` (fees, invoices, payments), `SUPER_ADMIN` (roles, rules, prompts). No single non-super role can both close a deal and waive its fee.
- **Runbooks** live in `/docs/runbooks/`: OTP provider outage, LLM provider outage, payment mismatch, data breach, mass-spam listing wave, DB failover, rescore rollback.

## 17.3 Support tooling built into the product

- Every screen error shows a `request_id`; support can paste it into audit search and see the exact request chain.
- `GET /admin/api/users/:id/timeline` merges audit + domain events + deals into one chronological view — the single most useful support view, build it early.
- Health page `/admin/health`: queue depths, job failures, AI error rate, SSE connections, reconciliation status.
