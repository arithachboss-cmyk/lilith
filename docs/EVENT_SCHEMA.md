# Events and audit

The registry is `src/domain/platform/events.ts`. `src/services/platform/database.ts` creates event and audit statements that join the same D1 batch as critical domain mutations.

Event envelope: `id`, `kind` (DOMAIN or ANALYTICS), `name`, `actor_id`, `resource_id`, JSON `payload`, unique `dedup_key`, ISO `created_at`.

Audit envelope: `id`, `actor_id`, `action`, `resource_id`, JSON `details`, ISO `created_at`. No client-provided actor IDs, credential values or raw message bodies are included in these audit details.

Implemented domain events: signup_started/signup_completed, property_created/property_published, requirement_created, match_generated, interest_expressed, mutual_match, deal_room_opened, viewing_requested/viewing_confirmed/viewing_completed, message_sent and deal_cancelled.

`signup_started` records the accepted onboarding submission in the same transaction as signup completion. It is not an abandoned-signup funnel metric.

Implemented analytics event: match_viewed, on opening the match reasons, actor-scoped and deduplicated by request ID. Analytics events do not drive state transitions. Counterparties cannot read analytics/audit tables through the timeline API; it returns only domain events for the authorized room.

Reserved, not emitted yet: offer_submitted, offer_accepted, agreement_signed, deal_closed, fee_generated, fee_paid, property_viewed. Registering a name does not mean its workflow is delivered.

Interest retries only emit if the decision changes. Room/mutual events are one per match; viewings and transitions are guarded by operation ID. PASS is an audited decision rather than a positive-interest event. Notifications are persisted transactionally for mutual rooms and viewing requests.

This is a durable local outbox, with no external delivery daemon yet. Future consumers must be idempotent and track delivery attempts separately.
