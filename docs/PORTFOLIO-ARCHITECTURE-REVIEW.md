# FINAL PORTFOLIO ARCHITECTURE REVIEW

Reviewer role: Independent Architecture / Security / Privacy / Governance Reviewer.
Director: ChatGPT / เจริญ. Owner: ACS Owner (Yacht).
Review date: 2026-09-25. Pipeline: Gemini RESEARCH COMPLETE → **Claude REVIEW COMPLETE** → Lovable HOLD.

Nothing was modified, enabled, deployed, published, or sent to any customer in the
course of this review. Every finding below is read from the live projects at the
commits named in **Evidence base**, not from the research pack.

---

## Evidence base

| Item | Value | Verified how |
|---|---|---|
| Lilith Connect project | `8f4f3787-b797-461d-b381-b333d4d03f5a` | `get_project` |
| Lilith Connect commit | `62fe036a62e0a30441e008a36a23664bfe334565` | `latest_commit_sha` |
| Lilith Connect published | **true**, `publish_audience: public` | `get_project` |
| Lilith Connect database | **enabled**, stack `supabase` | `get_database_status` |
| Property Pulse project | `5df077b2-ceaa-469f-882e-d6bbe32f6a11` | `get_project` |
| Property Pulse commit | `66eb9ab86530005bafcd868d11df1658f6b9706b` | `latest_commit_sha` |
| Property Pulse published | **true**, `publish_audience: public` | `get_project` |
| Property Pulse database | **disabled** | `get_database_status` |
| Projects in workspace `tdS8Lp6vpWRpM7xQxIc9` | **exactly 2** | `list_projects` |

`prototype_only: true` was **not** assumed and is **false** for Lilith Connect.
Both projects are published to a **public** audience, not workspace-internal.

---

## Section 1 — Verdicts

### 1.1 LILITH CONNECT — **REVISE**

Not BLOCKED: the security posture is materially better than a typical Lovable
app. Authorisation is real (`has_role()` + RLS, service-role loaded only after
bearer verification, user id always taken from the verified token and never from
client input). The PDPA tooling is genuine, not decorative — `deleteMyAccount`
actually deletes the auth user.

It is REVISE because three defects reach real people:

1. **Consent and business submission are the same event.** `concierge_requests`
   carries `pdpa_consent boolean NOT NULL DEFAULT false` as a column of the
   request row, and `submitConciergeRequest` validates `pdpa_consent: z.literal(true)`
   then inserts consent and request in one statement. There is no consent record
   that can outlive, precede, or be withdrawn independently of the request. This
   is the exact conflation the Owner flagged, confirmed in code.
2. **The DSAR path does not reach `concierge_requests`.** `exportMyData` says so
   in its own payload: *"Enquiries submitted without signing in are not linked to
   this account and are not included."* `deleteMyAccount` never touches the table.
   An anonymous concierge requester has, today, **no route to access or erasure**.
3. **Dual write on the accept path** — see §1.8.

### 1.2 PROPERTY PULSE — **PASS (as a specification), BLOCKED (as a system)**

As a governance specification this is the strongest artefact in the portfolio and
should not be weakened. `src/lib/content-os.ts` gets three hard things right:

- Six mutually exclusive lifecycle states with written definitions, where
  `SIMULATED` is explicitly *"never a metric"*.
- A seven-stage revenue funnel where every stage carries `countsAsRevenue: false`
  except `R6_CLOSED`, and each stage carries a rendered `distinctFromNext`
  assertion (*"A submission is not a Qualified Lead"*). This kills the single most
  common way property businesses lie to themselves.
- Every quantitative field resolves to `NO_VERIFIED_DATA`. The dashboard withholds
  rather than estimates.

It is BLOCKED as a system for one reason: **every record is `mock_data: true`**
and there is no database, so it currently cannot receive a real handoff.

### 1.3 BOUNDED CONTEXT — **REVISE**

The research pack treats Lilith Connect and Property Pulse as two bounded
contexts. **The code does not agree.** Lilith Connect already contains the
operator side: `/{locale}/panel/concierge`, `/panel/inbox`, `/panel/admin`,
`/panel/agent`, `/panel/owner`, plus `listConciergeRequests` and
`setConciergeStatus` with an admin/agent RLS gate.

So the true boundary today is **not** Lilith=customer / Pulse=operator. It is:

| Context | Owns | Lives in |
|---|---|---|
| **Intake** | request, consent, contact, attachments | Lilith Connect (real DB) |
| **Operations** | triage, status, staff note, handoff | Lilith Connect (real DB) |
| **Governance reporting** | lifecycle, evidence, funnel, register | Property Pulse (no DB) |

Property Pulse is not a second operations system — it is a **read model over
governance state**. Designing it as a write-capable peer would duplicate the
operations context that already exists and works. This is the single most
consequential correction in this review.

### 1.4 38 / 8 ARCHITECTURE — **BLOCKED**

The acceptance criteria as stated (`route_count = 38`, `template_count = 8`,
`unmapped_routes = 0`, `duplicate_route_ids = 0`) **cannot be accepted**, because
they are satisfiable while the product does not exist.

`docs/UI_SCREEN_MATRIX.md` is the real register. Counting its own status column:

| Status | Screens | Count |
|---|---|---|
| BUILT (route + backend) | 01, 02, 07, 14 | **4** |
| PARTIAL | 03, 08–12, 15–17, 19, 22–24, 26, 36, 38 | **16** |
| MISSING | 04, 05, 06, 13, 18, 20, 21, 25, 27–32, 33–35, 37 | **18** |
| **Total** | | **38** |

`route_count = 38` passes on the register having 38 rows. **18 of those 38 screens
do not exist.** A criterion that a register can satisfy by listing things is not a
criterion — it is the checker-blindness failure: the metric is computed from the
same document it is meant to validate.

Worse, there are **two different 38s** in this codebase and they are not the same
set. The `$locale/preview/*` subtree contains exactly **38 routes** — but those are
the mock-data prototype, not the 38-screen register. `route_count = 38` is
satisfiable by the wrong 38.

`template_count = 8` is unverifiable: **no template register exists in the repo.**
The screen matrix has seven groups (A–G), not eight templates.

### 1.5 LILI — **REVISE**

Lili is implemented and the category list is exact. The DB CHECK constraint
`category IN ('condo','hotel','car-with-driver','airport-transfer','private-driver','bespoke')`
matches the six specified categories with no drift, and the Zod enum matches the
CHECK — a genuine two-layer guarantee.

The flow maps to real routes: `concierge/index → categories → category/$slug →
intake → review → handoff → received`, with `concierge/privacy` alongside.

REVISE because the **Pending Review → Human/Operations Handoff** step is not what
the flow claims. `requestConciergeHandoff` sets `handoff_requested = true` and is:

- **unauthenticated** — it takes only `{ ref }` and has no `requireSupabaseAuth`;
- **not rate-limited** — unlike `submitConciergeRequest`, it never calls
  `enforceLeadRateLimit`;
- **requester-driven** — it records *the customer asking for a person*, which the
  UI and the status vocabulary then treat as the handoff itself.

There is **no `handoff_authorized` state anywhere in the system.** The status CHECK
allows only `pending_review | assigned | contacted | closed`. Nobody authorises a
handoff; it is requested and then someone changes a status.

### 1.6 PRIVACY — **REVISE**

Correct, and worth preserving:

- Consent is **never backfilled**. `ConsentGate` blocks legacy accounts until the
  person accepts themselves. The comment says so and the code does it.
- `PRIVACY_POLICY_VERSION` is stored with each consent (`pdpa_policy_version`),
  so consent is bound to what was actually shown.
- Marketing consent is withdrawable **independently** of PDPA consent
  (`setMarketingConsent`) — the correct separation of legal basis from preference.
- **IP is not stored.** `rate-limit.server.ts` hashes `ip + user-agent` with a salt
  and the comment is accurate: the ledger holds no raw IP. The Owner's instruction
  that IP must not be forced into consent evidence is **already honoured** — the
  throttle hash is never joined to the request row.

Defects:

- **Erasure is incomplete in substance.** `deleteMyAccount` nulls
  `deal_messages.sender_user_id` but never touches `deal_messages` **content**. A
  message body containing a name or phone number survives erasure with the pointer
  removed. Nulling the author of a message is not erasing the person in it.
- **`concierge_requests` is outside every data-subject right** (§1.1.2).
- **No retention anywhere.** `concierge_requests`, `lead_rate_limits`, and
  `attachment_names` have no TTL and no deletion job. A rate-limit hash from a
  visitor who never submitted anything persists forever.
- **`sample_data boolean` on a real table.** Synthetic and real customer rows share
  one table, distinguished by a default-`false` flag that every query must
  remember to filter. A demo row and a real person are one forgotten `WHERE` apart.

On the Owner's challenge — *"hash PII แล้วถือว่าลบ ไม่ถูกต้องเสมอ"* — **the Owner
is right, and the code already agrees with the Owner.** Lilith Connect does not
hash-and-call-it-deleted; it nulls identifiers and hard-deletes rows. The only
hashing is the throttle ledger, which is a pseudonymous identifier used for
throttling and never linked to content. Keep it that way; do not let any future
change join `client_hash` to a request.

### 1.7 SECURITY — **REVISE**

Strong: no service-role bypass on the staff read path (`listConciergeRequests`
deliberately uses the caller's RLS-scoped client, with a comment saying so);
`concierge_requests` has **no INSERT grant and no INSERT policy** for
`authenticated`, forcing all public writes through a validated server function.
That is correct design and should be preserved.

Defects, in severity order:

1. **`enforceLeadRateLimit` fails open.** `if (error) return;` — a ledger outage
   removes throttling entirely on an anonymous, public, unauthenticated write path
   that also triggers an outbound LINE push per call. Ledger down = unbounded row
   insertion **and** unbounded staff notification. The comment calls this
   deliberate ("never blocks a real enquiry"); the trade is wrong at this position.
2. **`requestConciergeHandoff` is unauthenticated and unthrottled** (§1.5).
3. **The rate-limit salt is `SUPABASE_SERVICE_ROLE_KEY`.** Using a live
   privileged secret as a hash salt means rotating the key silently resets every
   throttle window, and it spreads the secret into a code path that has no
   business holding it. Use a dedicated `RATE_LIMIT_SALT`.
4. **Contact PII is one unstructured 200-char column.** `contact text` holds phone,
   LINE ID, or email with no type, no normalisation, no field-level handling.
5. **Full request content is pushed to a LINE group.** `summarizeRequest` sends up
   to ten detail fields **plus the contact string** into a staff chat — an
   uncontrolled export of customer PII into a third-party system with its own
   retention, its own member list, and no audit trail.

### 1.8 EVENT / HANDOFF ARCHITECTURE — **BLOCKED**

The hard requirement is: *the architecture MUST NOT lose an accepted customer
request because Property Pulse is temporarily unavailable.*

**That requirement is already violated today, with LINE in the role of the
downstream system.** In `submitConciergeRequest`:

```
insert into concierge_requests ...   // commits
await notifyStaffLine(...)           // separate network call; on failure: console.error only
```

This is a textbook dual write. If the LINE push fails, the row exists and **no
human is ever told**. The function returns success to the customer either way.
There is no outbox, no retry, no dead-letter, no reconciliation, and no operator
alarm. A request accepted by the system can already be lost to operations.

Adding Property Pulse as a second downstream over the same pattern would multiply
this defect, not introduce it.

**Architecture option assessment**

| Option | Verdict | Reason |
|---|---|---|
| **A — Shared database** | **REJECT** | Destroys the bounded context and couples availability. A reporting surface must never be able to lock or bloat the intake system's tables. |
| **B — Pure event-driven** | **REJECT as stated** | Publishing an event after committing the row *is* the dual write. Events do not create durability; they relocate the loss. |
| **C — BFF / API gateway** | **REJECT as the answer** | A read-path concern. Does nothing about durability. May be added later for query fan-out. |
| **D — Transactional outbox + event bridge** | **ADOPT** | The only option where the accept decision and the obligation to notify commit **atomically**. |

The decisive argument: durability is a property of the **transaction boundary**,
not of the transport. Only the outbox writes "request accepted" and "downstream
must be told" in one commit in Lilith Connect's own database. Everything after
that — LINE, Property Pulse, email — becomes a retryable consumer whose outage
delays delivery but cannot destroy it.

---

## Section 2 — TARGET STATE MACHINE

The Owner proposed `consent_recorded / request_submitted / review_pending /
handoff_authorized`. The separation instinct is correct. The refinement is that
**these are not four states of one machine** — they are two machines and one
authorisation event.

### 2.1 Consent is a ledger, not a state

Consent has no "pending" and is never updated. It is append-only.

```
CONSENT_GRANTED  ──┐
                   ├─→ (immutable rows; current state = latest row per subject+purpose)
CONSENT_WITHDRAWN ─┘
```

Rules:
- A withdrawal is a **new row**, never an UPDATE of the grant.
- Every row binds `policy_version` and `purpose`. Consent to be contacted about
  one request is not consent to marketing and not consent forever.
- Consent rows are **never deleted by erasure** — the record that consent was
  given and withdrawn is the evidence that processing was lawful. Erasure clears
  the *subject link*, not the ledger.

### 2.2 Request lifecycle

```
                    ┌──────────────► WITHDRAWN (by requester, any time before CLOSED)
                    │
SUBMITTED ──► UNDER_REVIEW ──► HANDOFF_AUTHORIZED ──► HANDED_OFF ──► CLOSED
                    │
                    └──────────────► REJECTED
```

| State | Meaning | Who moves it | Precondition |
|---|---|---|---|
| `SUBMITTED` | Received. Identity unverified. Not a lead. | system | a valid `CONSENT_GRANTED` row exists for this purpose |
| `UNDER_REVIEW` | A human has it. | operator | — |
| `HANDOFF_AUTHORIZED` | A named operator decided a person will take this. | **operator, explicitly** | consent still current (not withdrawn) |
| `HANDED_OFF` | Delivered to the operating team. | system, on downstream ack | `HANDOFF_AUTHORIZED` |
| `CLOSED` / `REJECTED` / `WITHDRAWN` | Terminal. | operator / requester | — |

### 2.3 The three invariants

1. **Consent never triggers operations.** `CONSENT_GRANTED` creates no request and
   advances no state. It is a *precondition edge*, never a transition.
2. **A request is never self-authorising.** `HANDOFF_AUTHORIZED` requires an
   `actor_id` of a real operator. The requester may *ask* — that is a flag on the
   request (`handoff_requested_at`), never a state.
3. **Withdrawal is blocking, not advisory.** A `CONSENT_WITHDRAWN` row prevents
   entry to `HANDOFF_AUTHORIZED` and must surface on the operator screen.

`requester asks for a person` ≠ `operations authorised to contact this person`.
Today's `handoff_requested boolean` collapses the two; it must become a timestamp
on the request plus a separate authorised transition.

---

## Section 3 — TARGET EVENT CONTRACT

Schema is normative. Field names are the contract; Lovable and Codex must not
rename them.

### 3.1 Envelope (every event)

```json
{
  "event_id":       "uuid",
  "event_type":     "string",
  "event_version":  1,
  "occurred_at":    "timestamptz",
  "producer":       "lilith-connect",
  "idempotency_key":"string",
  "subject_ref":    "string",
  "payload":        {}
}
```

`idempotency_key` is mandatory and unique. Consumers MUST be safe to replay: the
outbox guarantees at-least-once, never exactly-once.

### 3.2 Events

```
consent.granted.v1
  { subject_ref, purpose, policy_version, locale, granted_at }

consent.withdrawn.v1
  { subject_ref, purpose, withdrawn_at }

request.submitted.v1
  { request_ref, category, locale, submitted_at, has_contact: boolean,
    attachment_count: integer }

request.review_started.v1
  { request_ref, actor_id, started_at }

request.handoff_authorized.v1
  { request_ref, actor_id, authorized_at, consent_current: true }

request.handed_off.v1
  { request_ref, delivered_to, delivered_at }

request.closed.v1
  { request_ref, outcome: "closed"|"rejected"|"withdrawn", closed_at }
```

### 3.3 The PII rule — normative

**No event payload may contain personal data.** Not `contact`, not `details`, not
`attachment_names`. Events carry `request_ref` and **counts**, never content.

Rationale, and it is not theoretical: Property Pulse's whole value is that it
publishes only verified, non-identifying governance state. The moment an event
carries a phone number, every downstream consumer — Property Pulse, LINE, any
future dashboard — becomes a PDPA data store with its own erasure obligation.
Keeping payloads identifier-free means erasure has exactly **one** place to run.

`has_contact: boolean` and `attachment_count: integer` give operations everything
they need to triage without exporting the person.

### 3.4 Outbox

```sql
create table public.event_outbox (
  id               bigserial primary key,
  event_id         uuid not null unique,
  event_type       text not null,
  event_version    int  not null default 1,
  idempotency_key  text not null unique,
  payload          jsonb not null,
  occurred_at      timestamptz not null default now(),
  published_at     timestamptz,
  attempts         int not null default 0,
  last_error       text,
  next_attempt_at  timestamptz not null default now()
);
create index event_outbox_unpublished_idx
  on public.event_outbox (next_attempt_at) where published_at is null;
```

Rules:
- The row that changes request state and the outbox row are written in **one
  transaction**. No exceptions.
- A relay publishes with exponential backoff.
- `attempts >= 8` → dead-letter, and an **operator-visible alarm**. Silent
  dead-lettering reintroduces the loss this design exists to prevent.
- A reconciliation job compares terminal request states against published events
  daily and reports divergence.

---

## Section 4 — LOVABLE CHANGE CONTRACT

Lovable may do, on Lilith Connect only, and only after Owner approval per change:

| # | Change | Constraint |
|---|---|---|
| L1 | Split consent into an append-only `consent_ledger` table | Migration must **backfill nothing**. Existing `pdpa_consent = true` rows migrate as `policy_version: 'unknown-pre-migration'`, never as a current valid consent. |
| L2 | Replace `handoff_requested boolean` with `handoff_requested_at timestamptz` + new status value `handoff_authorized` + `handoff_authorized_by uuid` | Status CHECK must be extended, not replaced. |
| L3 | Add `requireSupabaseAuth` + rate limit to `requestConciergeHandoff` | — |
| L4 | Change `enforceLeadRateLimit` to **fail closed** with a 503 and a human contact route | Must not silently drop the enquiry. |
| L5 | Introduce `RATE_LIMIT_SALT` env var, stop using the service-role key as salt | — |
| L6 | Add `event_outbox` + relay; move the LINE push behind it | LINE payload must stop carrying `contact` (§3.3). |
| L7 | Extend DSAR to `concierge_requests` via `request_ref` lookup | Erasure must clear `contact`, `details`, `attachment_names`; keep `ref`, `category`, timestamps. |
| L8 | Add retention jobs for `concierge_requests`, `lead_rate_limits` | Retention period is an **Owner decision**, not Lovable's. |
| L9 | Move `sample_data` rows to a separate table or schema | — |

Lovable must NOT: weaken any RLS policy; grant INSERT on `concierge_requests`;
add PII to any event payload; touch Property Pulse; publish; change DNS or
billing.

---

## Section 5 — CODEX CHANGE CONTRACT

Codex works in this monorepo (`arithachboss-cmyk/lilith`), never in Lovable.

| # | Change |
|---|---|
| C1 | Author `packages/contracts` types for §3.2 events as the single source of truth |
| C2 | Build the **route/template register as a generated artefact** with a drift checker, replacing the hand-maintained `UI_SCREEN_MATRIX.md` counting |
| C3 | Redefine the 38/8 acceptance criteria per §7 |
| C4 | Negative tests: an event payload containing a PII-shaped field must fail the build |
| C5 | Reconciliation + dead-letter alarm specification |

Codex must NOT: implement Lovable app code; run migrations; touch `acs-seo/`.

---

## Section 6 — DO_NOT_TOUCH

1. `has_role()` and every RLS policy on `concierge_requests`. No INSERT grant, ever.
2. The absence of a service-role bypass in `listConciergeRequests`.
3. `ConsentGate`'s refusal to backfill consent.
4. `PRIVACY_POLICY_VERSION` binding on every consent record.
5. The independence of `marketing_consent` from `pdpa_consent`.
6. Raw IP must never be stored; `client_hash` must never be joined to a request.
7. `content-os.ts`: `NO_VERIFIED_DATA`, `countsAsRevenue`, `distinctFromNext`, and
   `SIMULATED` as "never a metric".
8. The category CHECK constraint / Zod enum pair.
9. The root static prototype in this repo.

---

## Section 7 — Replacement acceptance criteria for 38/8

The stated criteria are rejected (§1.4). Replace with:

```
built_screens        = count(status = BUILT)          # currently 4
partial_screens      = count(status = PARTIAL)        # currently 16
missing_screens      = count(status = MISSING)        # currently 18
register_total       = built + partial + missing = 38
route_register_drift = 0   # every BUILT/PARTIAL row resolves to a real route file
orphan_routes        = 0   # every non-preview route file appears in the register
template_register    exists, and every BUILT/PARTIAL row names a template
duplicate_route_ids  = 0
prototype_routes_excluded = true   # $locale/preview/* never counts toward the register
```

The register must be **generated from the route tree** and diffed, so it cannot
certify itself. `route_count = 38` is deleted as a criterion: 38 is the size of
the ambition, not a measure of delivery.

---

## Section 8 — LEGACY EXTRACTION MATRIX — **BLOCKED**

The four named legacy projects — Lilith Homes Connect, Remix of Lilith Homes
Connect, Middle Property Views, Roomie Finder — **are not present in workspace
`tdS8Lp6vpWRpM7xQxIc9`**. `list_projects` returns exactly two projects: Lilith
Connect and Property Pulse.

I will not classify KEEP / EXTRACT / ISOLATE / ARCHIVE_CANDIDATE for systems I
cannot read. Assigning a disposition from a name would be exactly the invented
claim this whole governance structure exists to prevent.

No destructive action taken or proposed. Nothing was archived or deleted.

**To unblock:** the workspace ID or project IDs for those four, or confirmation
that they were deleted.

---

## Section 9 — MUST FIX

| # | Finding | Where |
|---|---|---|
| M1 | Dual write: request commits, LINE notify may fail silently → accepted request lost to operations | `requests.functions.ts` |
| M2 | Consent is a column of the submission; no independent, withdrawable consent record | `0002_create_concierge_requests.sql` |
| M3 | `concierge_requests` outside all data-subject rights (access + erasure) | `pdpa.functions.ts` |
| M4 | `requestConciergeHandoff` unauthenticated and unthrottled | `requests.functions.ts` |
| M5 | No `handoff_authorized` state; requester's ask is treated as the handoff | status CHECK |
| M6 | Rate limiter fails open on a public anonymous write path | `rate-limit.server.ts` |
| M7 | Full request content + contact PII pushed to a LINE group | `summarizeRequest` |
| M8 | Erasure nulls message authorship but not message content | `deleteMyAccount` |

## Section 10 — SHOULD FIX

| # | Finding |
|---|---|
| S1 | Service-role key used as rate-limit salt |
| S2 | No retention/TTL on `concierge_requests`, `lead_rate_limits` |
| S3 | `sample_data` flag mixes synthetic and real rows in one table |
| S4 | `contact` is one unstructured 200-char column |
| S5 | Both projects published to a **public** audience; confirm this is intended for an operator dashboard |
| S6 | `attachment_names` may itself carry PII (e.g. passport filenames) |
| S7 | No template register exists |

## Section 11 — EVIDENCE REQUIRED

| # | Needed | Blocks |
|---|---|---|
| E1 | Workspace/project IDs for the four legacy projects | §8 entirely |
| E2 | Retention periods for requests, attachments, throttle ledger | L8 |
| E3 | Who is in the staff LINE group, and its retention | M7 |
| E4 | Is `publish_audience: public` intended for Property Pulse? | S5 |
| E5 | Fee basis and payer — still unanswered, still blocking screens 33–35 | §1.4 |

---

## Section 12 — OWNER_APPROVAL_REQUIRED

The Owner granted database enablement on 2026-09-25. Recorded, and **deliberately
not yet executed**, for one architectural reason:

> Enabling Property Pulse's database before §1.3 is accepted would create a second
> write-capable operations store next to the one that already exists in Lilith
> Connect. The correct shape — Property Pulse as a **read model** fed by §3 events
> — may need no database of its own at all, or only a projection store.

Enabling first and deciding later is how a shared-database architecture gets
adopted by accident. The authorisation stands and will be executed the moment the
Owner confirms §1.3.

Still requiring explicit Owner approval:
- Publishing any ACS SEO package to `www.asiancoding.com`
- Merging PRs #5, #6, #8
- Any migration on Lilith Connect's live database
- Retention periods (E2)

---

## FINAL VERDICT

**REVISE — do not proceed to Lovable implementation as specified.**

The portfolio is not a prototype and must stop being reviewed as one. Lilith
Connect is published, public, database-enabled, and has carried production data
operations. Its security engineering is above average for its class; its **privacy
lifecycle and its delivery guarantee are not.**

Three corrections must land before any Lovable change:

1. **§1.3** — Property Pulse is a read model over governance state, not a second
   operations system. Accepting this changes what gets built and may remove the
   need for its database entirely.
2. **§1.8 / Option D** — adopt the transactional outbox. The requirement that no
   accepted request may be lost is **already being violated today** via LINE; this
   is a live defect, not a future risk.
3. **§2** — consent becomes an append-only ledger, and `handoff_authorized`
   becomes an explicit operator decision with a named actor. Consent must never
   trigger operations.

The 38/8 contract is rejected in its current form: it can pass while 18 of 38
screens do not exist (§1.4, §7).

The legacy extraction matrix is BLOCKED for lack of evidence, not deferred (§8).

Gemini's research was directionally right on consent separation and on IP
evidence. It was **wrong to treat the durability requirement as a future design
question** — the loss path exists in production code today. It also missed that
the operations context already lives in Lilith Connect, which changes the target
architecture.

Nothing in this portfolio was modified, enabled, deployed, published, or sent to a
customer during this review.
