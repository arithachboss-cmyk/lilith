# FINAL PORTFOLIO ARCHITECTURE REVIEW

**Role:** Claude — Portfolio Architecture / Security / Privacy / Governance Reviewer
**Director:** ChatGPT / เจริญ · **Owner:** ACS Owner (Yacht)
**Input:** Gemini Research Pack + verified Lovable exact-state evidence
**Date:** 2026-09-25 · supersedes the 2026-09-25 morning edition in full

Nothing was modified, enabled, deployed, published, or sent to any customer.
Every finding is read from the live projects at the commits named below.

---

## 0 · Evidence base

| Project | ID | Published | Audience | Database |
|---|---|---|---|---|
| **Lilith Connect** | `8f4f3787-b797-461d-b381-b333d4d03f5a` @ `62fe036a` | **true** | **public** | **enabled** (supabase) |
| **Property Pulse** | `5df077b2-ceaa-469f-882e-d6bbe32f6a11` @ `66eb9ab8` | **true** | **public** | disabled |
| **Middle Property Views** | `f47ea3b8-adad-474c-b074-af5b9314cc4f` | **true** | **public** | **enabled** |
| **Remix of Lilith Homes Connect** | `08476b61-2ae8-47ba-a826-450182a34686` | false | — | **enabled** |
| **ACS Prototype** | `b1d14add-5021-46fd-9486-1a36f56c1f97` | false | — | **enabled** |
| Ajungma Retail OS *(out of scope, noted)* | `9764f12d-…` | true | public | not checked |

Workspaces: `tdS8Lp6vpWRpM7xQxIc9` (Ari's) and `5oBvHCj9ONUbmfOUD91Y` (อริย์ธัช's).

> **Correction to the previous edition.** It reported the legacy projects as absent
> and marked the extraction matrix BLOCKED. That was wrong: I had listed one
> workspace and concluded from it. They are in the second workspace, and §9 is now
> answered from evidence.

**`prototype_only: true` is false** for Lilith Connect, Middle Property Views and
Ajungma Retail OS. **Four Supabase databases are enabled across this portfolio,
three of them unattended.**

**"Lilith Homes Connect"** as a separate project does not exist. Lilith Connect was
created `2026-09-07T14:34`; "Remix of Lilith Homes Connect" was created from it at
`14:42`. The original was renamed. **"Roomie Finder" is not present in either
workspace** — see §9.

---

## 1 · Verdicts

| Area | Verdict |
|---|---|
| **LILITH CONNECT** | **REVISE** |
| **PROPERTY PULSE** | **REVISE** (PASS as specification; its target shape changes — §2.3) |
| **BOUNDED CONTEXT** | **REVISE** |
| **38 / 8 ARCHITECTURE** | **REVISE** (proposal accepted, acceptance criteria rejected) |
| **LILI** | **REVISE** |
| **PRIVACY** | **REVISE** |
| **SECURITY** | **BLOCKED** |
| **EVENT / HANDOFF ARCHITECTURE** | **BLOCKED** |

SECURITY and EVENT/HANDOFF are BLOCKED on live defects, not on design disagreement.

---

## 2 · The five Gemini recommendations

### 2.1 Next.js / React migration — **REJECT. Keep TanStack Start.**

No architectural benefit was demonstrated, and the migration cost is not neutral —
it is concentrated exactly where the system is currently strongest.

Lilith Connect's authorization boundary *is* a TanStack Start primitive.
`createServerFn(...).middleware([requireSupabaseAuth])` is the construct that makes
`context.userId` come from a verified bearer token, and the code comments state the
rule explicitly: *"the user id is taken from the verified bearer token
(context.userId), never from client input."* Every server function in
`pdpa.functions.ts`, `leads.functions.ts`, `roles.functions.ts`, `owner.functions.ts`
and `concierge/requests.functions.ts` inherits that.

Migrating re-implements each of those boundaries in a different primitive. Every
re-implementation is an opportunity to reintroduce the single most common
authorization bug in this class of application — reading the user id from the
request body. The current code avoids it by construction; a rewrite would have to
avoid it by discipline, repeated dozens of times.

Against that: no stated benefit. Not performance, not capability, not hiring.

**A framework migration is the largest possible change to a published,
database-enabled system carrying production data, and it is being proposed for no
named gain.** Reject.

*Revisit only if:* a required capability is shown to be unavailable in TanStack
Start, with the specific feature named.

### 2.2 `consent_granted → webhook → Property Pulse` — **REJECT as designed.**

Two defects, one legal and one architectural.

**Legal.** Consent is a lawful-basis record. It is not an instruction to do
business. A person may consent and then not submit; may submit and later withdraw;
may consent for one purpose and not another. Firing an operational webhook on
`consent_granted` collapses "this person permitted processing" into "this person
asked us to act", and those are different facts with different consequences.

**Architectural.** A bare webhook is not a delivery guarantee — §4.

The Owner's proposed names are correct in spirit. The refinement: they are **not
four states of one machine.** See §5.

### 2.3 IP address as consent evidence — **REJECT as mandatory.**

An IP address is a network fact about a device at a moment. It is not evidence of
a person's agreement. In a consent dispute the questions are: *who consented, what
were they shown, when, for what purpose, and how.* IP answers none of them.

Against that it adds a new personal-data category with its own retention, its own
breach exposure, and its own subject-access obligation.

**The existing code already gets this right and must not be changed.**
`rate-limit.server.ts` hashes `ip + user-agent` with a salt for throttling only,
never stores the raw IP, and never joins the hash to a request row.

**Minimum defensible consent evidence:**

| Field | Why it is necessary |
|---|---|
| `subject_ref` | who |
| `purpose` | what they consented *to* — consent is never global |
| `policy_version` | which notice was in force |
| `policy_text_hash` | **what the notice actually said** |
| `granted_at` | when |
| `method` | how (checkbox, signature, verbal-recorded) |
| `locale` | which language they read it in |

`policy_text_hash` is the addition that matters most. A version string alone proves
nothing if the text behind that version is ever edited in place. Hashing the exact
rendered text makes the record self-verifying, and it is not personal data.

IP may be added **only** if a specific dispute pattern requires it, stored in a
separate table with a short fixed retention, never inside the consent record.

### 2.4 Hashing PII during deletion — **REJECT. Hashing is not deletion.**

Hashing produces **pseudonymised** data, not **anonymous** data, whenever the input
space is enumerable. Thai mobile numbers are roughly 10⁸ possibilities; an email at
a known domain is worse. Anyone holding the hash can recover the input by
enumeration in seconds. A hashed phone number is therefore still personal data, and
still carries every obligation the original carried — including erasure. "Hash it
and keep it" converts a deletion duty into an undisclosed retention.

**What Lilith Connect already does is correct and should be the pattern.**
`deleteMyAccount` nulls the identifying columns on shared rows, hard-deletes rows
the caller solely owns, and deletes the auth user. The comment states the principle:
*"Shared with a counterparty: anonymise, never delete. The other party is entitled
to keep the transaction record."* That is the right balance between erasure and the
counterparty's legitimate interest.

Three gaps remain:

1. **Content is not covered.** `deal_messages.sender_user_id` is nulled; the message
   **body** is untouched. A message containing a name or phone number survives
   erasure with only the authorship pointer removed. Nulling the author of a message
   is not erasing the person inside it.
2. **`concierge_requests` is outside erasure entirely** — §7.
3. **No retention policy exists.** "Keep for audit" without a stated period is
   indefinite retention by default, which is the thing a retention policy exists to
   prevent.

### 2.5 Enable Property Pulse database — **NOT AUTHORIZED. Schema designed, not applied.**

Beyond the Owner's own standing instruction, the evidence gives a second reason:
**four Supabase databases are already enabled in this portfolio and three are
unattended** (§0, §9). Provisioning a fifth before the existing four are accounted
for adds surface to a portfolio that cannot currently describe its own data
footprint.

And per §3, Property Pulse's correct shape may require **no database of its own** —
only a projection store, or none.

---

## 3 · Bounded contexts — the pack's model does not match the code

The pack treats Lilith = customer and Pulse = operations. **The code disagrees.**
Lilith Connect already contains the operator side: `/{locale}/panel/concierge`,
`/panel/inbox`, `/panel/admin`, `/panel/agent`, `/panel/owner`, plus
`listConciergeRequests` and `setConciergeStatus` behind an admin/agent RLS gate.

| Context | Owns | Lives in | Store |
|---|---|---|---|
| **Intake** | request, consent, contact, attachments | Lilith Connect | real DB |
| **Operations** | triage, status, staff note, handoff authorization | Lilith Connect | real DB |
| **Governance reporting** | lifecycle, evidence, funnel, register | Property Pulse | **none today** |

**Property Pulse is a read model over governance state, not a second operations
system.** Building it write-capable duplicates an operations context that already
exists and works, and creates two places where a request's status can disagree.

This is the most consequential correction in this review: it changes what gets
built, and it may remove the need for §2.5 entirely.

---

## 4 · Event / handoff architecture — **BLOCKED**

### 4.1 The requirement is already violated in production

> *"The architecture MUST NOT lose an accepted customer request because Property
> Pulse is temporarily unavailable."*

**This is violated today, with LINE in the role of the downstream system.**
In `submitConciergeRequest`:

```
insert into concierge_requests …   // commits
await notifyStaffLine(…)           // separate network call
                                   // on failure: console.error only
```

The row commits, then a second system is contacted. If that call fails, the row
exists and **no human is ever told.** The function returns success to the customer
either way. No outbox, no retry, no dead-letter, no reconciliation, no alarm.

A request accepted by the system can already be lost to operations. This is not a
future design question.

### 4.2 Is a simple webhook sufficient? **No — and the proof is in the repository.**

`notifyStaffLine` **is** a simple webhook. It is the exact pattern proposed, already
implemented, already losing events silently. Adding Property Pulse as a second
consumer of the same pattern multiplies the defect.

A webhook is a **transport**. Durability is a property of the **transaction
boundary**. No transport can make a dual write atomic.

### 4.3 Option comparison

| Option | Verdict | Reason |
|---|---|---|
| **A — Shared database** | **REJECT** | Destroys the bounded context and couples availability. A reporting surface must never be able to lock, bloat or migrate the intake system's tables. |
| **B — Pure event-driven** | **REJECT as stated** | "Commit, then publish" *is* the dual write. Events relocate the loss; they do not remove it. |
| **C — BFF / API gateway** | **REJECT as the answer** | A read-path and fan-out concern. Contributes nothing to durability. May be added later. |
| **D — Transactional outbox + event bridge** | **ADOPT** | The only option where the accept decision and the obligation to notify commit **atomically**, in Lilith Connect's own database. |

Under D, LINE, Property Pulse, email and any future consumer become retryable
consumers whose outage delays delivery but cannot destroy it.

---

## 5 · Target state machine

The Owner proposed `consent_recorded / request_submitted / review_pending /
handoff_authorized`. The separation instinct is right. The refinement: **these are
two machines and one authorization event, not four states of one machine.**

### 5.1 Consent — an append-only ledger, not a state

```
CONSENT_GRANTED   ──┐
                    ├──►  immutable rows; current state = latest row per (subject, purpose)
CONSENT_WITHDRAWN ──┘
```

- Consent has **no pending state**. It is given or it is not.
- A withdrawal is a **new row**, never an UPDATE of the grant.
- Every row binds `purpose` **and** `policy_text_hash` (§2.3).
- Erasure clears the **subject link**, never the ledger: the record that consent was
  given and withdrawn is the evidence that processing was lawful.

### 5.2 Request lifecycle

```
                     ┌────────────────────────► WITHDRAWN   (requester, any time before CLOSED)
                     │
SUBMITTED ──► UNDER_REVIEW ──► HANDOFF_AUTHORIZED ──► HANDED_OFF ──► CLOSED
                     │
                     └────────────────────────► REJECTED
```

| State | Meaning | Actor | Precondition |
|---|---|---|---|
| `SUBMITTED` | Received. Identity unverified. **Not a lead.** | system | a current `CONSENT_GRANTED` exists for this purpose |
| `UNDER_REVIEW` | A named human has it | operator | — |
| `HANDOFF_AUTHORIZED` | A named operator decided a person will take this | **operator, explicitly** | consent still current |
| `HANDED_OFF` | Delivered to the operating team | system, on consumer ack | `HANDOFF_AUTHORIZED` |
| `CLOSED` / `REJECTED` / `WITHDRAWN` | Terminal | operator / requester | — |

### 5.3 Three invariants

1. **Consent never triggers operations.** `CONSENT_GRANTED` creates no request and
   advances no state. It is a *precondition edge*, never a transition.
2. **A request is never self-authorising.** `HANDOFF_AUTHORIZED` requires
   `actor_id` of a real operator. The requester may *ask* — that is
   `handoff_requested_at`, a timestamp on the request, **never a state**.
3. **Withdrawal blocks.** A `CONSENT_WITHDRAWN` row prevents entry to
   `HANDOFF_AUTHORIZED` and must surface on the operator screen.

Today `handoff_requested boolean` collapses invariant 2, and the status CHECK
(`pending_review | assigned | contacted | closed`) contains **no authorization state
at all**.

---

## 6 · Target event contract

### 6.1 Envelope — every event

```json
{
  "event_id":          "uuid",
  "event_type":        "string",
  "event_version":     1,
  "occurred_at":       "timestamptz",
  "producer":          "lilith-connect",
  "idempotency_key":   "string (unique)",
  "correlation_id":    "uuid — one customer journey, all events",
  "causation_id":      "uuid — the event_id that caused this one, null at origin",
  "source_request_id": "string — the request_ref this concerns",
  "schema_uri":        "string — versioned contract location",
  "payload":           {}
}
```

Consumers **must** be replay-safe: the outbox guarantees at-least-once, never
exactly-once. `correlation_id` makes a journey traceable across systems without
joining on anything personal; `causation_id` makes ordering reconstructible without
depending on delivery order.

### 6.2 Events

```
consent.granted.v1        { subject_ref, purpose, policy_version, policy_text_hash, locale, granted_at }
consent.withdrawn.v1      { subject_ref, purpose, withdrawn_at }
request.submitted.v1      { request_ref, category, locale, submitted_at,
                            has_contact: boolean, attachment_count: integer }
request.review_started.v1 { request_ref, actor_id, started_at }
request.handoff_authorized.v1 { request_ref, actor_id, authorized_at, consent_current: true }
request.handed_off.v1     { request_ref, delivered_to, delivered_at }
request.closed.v1         { request_ref, outcome: closed|rejected|withdrawn, closed_at }
```

### 6.3 The PII rule — normative

**No event payload may contain personal data.** Not `contact`, not `details`, not
`attachment_names`. Events carry references and **counts**.

This is not caution for its own sake. The moment an event carries a phone number,
every consumer — Property Pulse, LINE, any future dashboard — becomes a personal
data store with its own erasure obligation. Keeping payloads identifier-free means
erasure has exactly **one** place to run. `has_contact` and `attachment_count` give
operations everything triage needs without exporting the person.

### 6.4 Outbox

```sql
create table public.event_outbox (
  id               bigserial primary key,
  event_id         uuid not null unique,
  event_type       text not null,
  event_version    int  not null default 1,
  idempotency_key  text not null unique,
  correlation_id   uuid not null,
  causation_id     uuid,
  source_request_id text,
  payload          jsonb not null,
  occurred_at      timestamptz not null default now(),
  published_at     timestamptz,
  attempts         int  not null default 0,
  last_error       text,
  next_attempt_at  timestamptz not null default now()
);
create index event_outbox_unpublished_idx
  on public.event_outbox (next_attempt_at) where published_at is null;
```

Rules:
- The state change and the outbox row are written **in one transaction**. No exceptions.
- Relay publishes with exponential backoff.
- `attempts >= 8` → dead-letter **and an operator-visible alarm**. Silent
  dead-lettering reintroduces the loss this design exists to prevent.
- Daily reconciliation compares terminal request states against published events and
  reports divergence.

### 6.5 Delivery security

| Control | Requirement |
|---|---|
| Authentication | HMAC signature over the raw body with a per-consumer secret |
| Replay defence | `event_id` + `occurred_at`; reject events older than a fixed skew; consumer stores seen `event_id` |
| Spoofing | Consumer verifies `producer` **and** signature; never trusts `producer` alone |
| Ordering | Consumers must not assume order — use `causation_id` and state checks, never arrival sequence |
| Versioning | `event_version` + `schema_uri`; consumers reject unknown major versions rather than guessing |
| Secrets | Per-consumer secret, rotatable without redeploying the producer |

---

## 7 · Privacy — **REVISE**

**Correct, and must not be weakened:** consent is never backfilled (`ConsentGate`
blocks legacy accounts until the person accepts themselves); `PRIVACY_POLICY_VERSION`
is bound to each consent; marketing consent is withdrawable independently of PDPA
consent; **raw IP is never stored**.

**Defects:**

| # | Finding |
|---|---|
| P1 | Consent is a **column of the submission**: `pdpa_consent boolean` on `concierge_requests`, written in the same INSERT. No consent record can precede, outlive, or be withdrawn independently of the request. |
| P2 | **`concierge_requests` is outside every data-subject right.** `exportMyData` says so itself: *"Enquiries submitted without signing in are not linked to this account and are not included."* `deleteMyAccount` never touches the table. An anonymous requester has no route to access or erasure. |
| P3 | Erasure does not reach message **content** (§2.4). |
| P4 | **No retention anywhere** — `concierge_requests`, `lead_rate_limits`, `attachment_names`. A throttle hash from a visitor who never submitted persists forever. |
| P5 | `sample_data boolean` puts synthetic and real customer rows in **one table**, separated by a default-`false` flag every query must remember. A demo row and a real person are one forgotten `WHERE` apart. |
| P6 | Full request content **plus contact** is pushed into a staff LINE group — an uncontrolled PII export into a third-party system with its own retention and membership. |

---

## 8 · Security — **BLOCKED**

### 8.1 Trust boundaries

| # | Zone | Trust | Crossing control |
|---|---|---|---|
| 1 | **Customer** | untrusted | schema validation; rate limit; no client-supplied identity |
| 2 | **Lili (frontend)** | untrusted — runs on the customer's device | nothing it sends is authoritative |
| 3 | **Lilith Runtime** (server functions) | **trusted — the only writer of production state** | bearer verified; `context.userId` never from input |
| 4 | **Bridge / outbox relay** | trusted, least-privileged | may read outbox and mark published; may not read PII tables |
| 5 | **Property Pulse** | **semi-trusted, read-only** | consumes signed events; holds no PII; cannot write back |
| 6 | **Human Operator** | trusted, authenticated, **attributed** | RLS by role; every state change records `actor_id` |
| 7 | **AI Agents** | **untrusted producers of proposals** | may never write state — §10 |
| 8 | **Database** | trusted store, hostile to callers | RLS on; service role only inside verified server functions |
| 9 | **External services** (LINE, email) | untrusted sinks | receive references, never PII; failures are retryable, never silent |

The rule that makes the table work: **trust flows in one direction only, toward
zone 3.** Nothing in zones 1, 2, 5, 7 or 9 may be a source of authority.

### 8.2 Findings

| # | Finding | Severity |
|---|---|---|
| S1 | **`enforceLeadRateLimit` fails open** (`if (error) return;`) on an anonymous public write path that also triggers an outbound LINE push per call. Ledger outage = unbounded inserts **and** unbounded staff notification. | HIGH |
| S2 | **`requestConciergeHandoff` is unauthenticated and unthrottled** — takes only `{ ref }`, no `requireSupabaseAuth`, no rate limit, mutates state. | HIGH |
| S3 | **Rate-limit salt is `SUPABASE_SERVICE_ROLE_KEY`.** Rotating the key silently resets every throttle window, and spreads a privileged secret into a path with no need for it. | MEDIUM |
| S4 | **Prompt-injection surface.** `details` is attacker-controlled free text (≤2000 chars/field) that flows to operators. Any AI summarisation of it is a direct injection vector — §10. | HIGH (on introduction of AI) |
| S5 | Contact PII in one unstructured 200-char column — no type, no normalisation, no field-level handling. | MEDIUM |
| S6 | **Both primary projects are published to a `public` audience**, including the operator dashboard. | MEDIUM — confirm intent |
| S7 | PII exported to LINE (P6). | HIGH |
| S8 | **Middle Property Views** — see §8.3. | **CRITICAL** |

**Correct and to be preserved:** no service-role bypass on the staff read path
(`listConciergeRequests` deliberately uses the caller's RLS-scoped client);
`concierge_requests` has **no INSERT grant and no INSERT policy** for `authenticated`,
forcing all public writes through a validated server function.

### 8.3 CRITICAL — Middle Property Views is telling real people their viewing is confirmed

`f47ea3b8-adad-474c-b074-af5b9314cc4f` is **published to a public audience with a
Supabase database enabled**. In `src/components/BookViewingDialog.tsx`:

1. It collects **name, phone, email and free-text notes** — with **no PDPA consent
   control anywhere in the flow.**
2. **The collected data is never submitted.** The confirm handler calls
   `save(property.id)` (a localStorage shortlist) and `setStep(3)`. The `form` state
   is discarded.
3. It then displays a checkmark and **`book.confirmed`** — it tells the person their
   viewing is **confirmed**, when nothing was recorded and no human will ever know.
4. Viewing slots show **`slotsLeft` / `full` scarcity** driven by static values in
   `src/data/properties.ts`.

Three of the four things the Owner's own AI boundary forbids — *claim availability*,
*mark bookings confirmed*, *contact real customers under false pretences* — are being
done **live, today, by deterministic code, on a public URL.**

The severity is not the lost lead. It is that a real person can be told a viewing is
confirmed, arrange their day around it, and arrive to nothing.

**This is the single most urgent item in the portfolio and it was in nobody's scope.**

---

## 9 · Legacy extraction matrix

| Project | Verdict | Reasoning | Assets worth extracting |
|---|---|---|---|
| **Middle Property Views** `f47ea3b8` | **ISOLATE — immediate** | Published public, DB enabled, collects PII with no consent, discards it, and displays a false confirmation (§8.3). | **Unpublish first, extract after.** BTS demand map, property card, i18n scaffold, shortlist hook, `SampleTag` pattern |
| **Remix of Lilith Homes Connect** `08476b61` | **ARCHIVE_CANDIDATE** | Not published. Created 8 minutes after Lilith Connect and edited for 2 minutes — an abandoned fork, not a line of work. DB enabled with no app using it. | Nothing unique; confirm the DB is empty, then **de-provision the database** |
| **ACS Prototype** `b1d14add` | **EXTRACT** | Not published, low risk. Contains **mandatory PDPA consent fields** on a lead form and a Thai/English bilingual interface. | **The consent-field pattern feeds §5.1 directly.** Bilingual copy; neutral illustration set for ACS SEO |
| **"Lilith Homes Connect"** | **KEEP — it is not legacy** | Does not exist as a separate project. Lilith Connect (`8f4f3787`, created `14:34`) is it, renamed; the Remix was forked from it at `14:42`. | — it is Primary A |
| **"Roomie Finder"** | **EVIDENCE REQUIRED** | **Not present in either workspace.** Not classified — assigning a disposition to a system I cannot read would be an invented claim. | — |
| *Ajungma Retail OS* `9764f12d` | *out of scope — flagged* | Published public, **edited 2026-09-25**. Not in the legacy list but active in the portfolio and unreviewed. | — |

**No destructive action taken or proposed.** ISOLATE means unpublish and stop
collection; it does not mean delete. Every database above stays as it is until the
Owner decides.

---

## 10 · Deterministic vs AI boundary

### 10.1 The rule

> **AI may produce proposals. Deterministic code decides.**
> Every AI output crosses into the system only through a gate that would reject it
> just the same if a stranger had written it.

This holds because of S4: `details` is attacker-controlled text. Any AI that reads it
is reading text that may contain instructions. If that AI can also act, the customer
writes the instructions.

### 10.2 Classification

**DETERMINISTIC CODE — no AI in the path, ever**

routing · consent enforcement · request creation · Lead/Request ID issuance · state
transition · idempotency · authorization · RLS · handoff · retry · audit ·
retention/deletion enforcement

**AI — permitted, always as a proposal**

| Operation | Constraint |
|---|---|
| Intent assistance | suggests a category; **the customer confirms**; never auto-selects |
| Bespoke summarisation | summary stored beside the original, never replacing it |
| Translation assistance | source text retained; translation marked as machine-produced |
| Suggested tags | proposals in a separate field until a human accepts |
| Content drafting | draft status only — the ACS SEO gates already enforce this |
| Operations summary | read-only, labelled, with links to the underlying records |

**AI must NEVER** create production state · approve requests · change consent ·
change RLS · change database schema · publish · deploy · contact customers · mark
bookings confirmed · claim availability.

### 10.3 Three enforcement requirements

1. **Structural, not instructional.** The AI path must hold **no credential** capable
   of writing state. A prompt telling a model not to write is not a control; an
   absent write capability is.
2. **Every AI output is labelled at rest**, with `model`, `produced_at` and the
   source text it derived from. An operator must never see a machine guess rendered
   identically to a customer's words.
3. **Untrusted retrieved content is data, never instruction.** Customer `details`,
   uploaded file contents and anything fetched from outside are inputs to be
   summarised, never directives to be followed.

---

## 11 · 38 routes / 8 templates — **REVISE**

### 11.1 Configuration-over-Code: **ACCEPT the manifest, REJECT dynamic collapse**

Collapsing to `/[category]/[step]` is the wrong trade. It optimises for writing the
code once and destroys the property the Owner actually named: **logical route
identity must remain observable and testable.** A dynamic segment has no identity to
assert on — you cannot say "route 17 requires consent" when route 17 is a runtime
string.

A manifest of 38 route identities rendered by 8 templates keeps identity explicit
*and* avoids duplicated rendering. That is the correct shape — for the identity
reason, not the DRY reason.

### 11.2 Manifest fields — normative

```ts
interface RouteEntry {
  route_id:            string   // stable, never reused, never renumbered
  route_key:           string   // human-readable symbolic name
  route_path:          string   // the URL pattern
  template_id:         string   // one of the 8
  locale:              Locale[] // which locales this route exists in
  analytics_id:        string   // stable across path changes
  requires_consent:    boolean
  requires_handoff:    boolean
  step_index:          number | null
  category:            Category | null
}
```

`route_id` must survive a path change. The moment analytics keys off the path, a URL
edit silently breaks the funnel history.

### 11.3 The stated acceptance criteria are **rejected**

`route_count = 38`, `template_count = 8`, `unmapped_routes = 0`,
`duplicate_route_ids = 0` are **satisfiable while the product does not exist.**

`docs/UI_SCREEN_MATRIX.md` is the real register. By its own status column:

| Status | Count |
|---|---|
| BUILT (route + backend) | **4** |
| PARTIAL | **16** |
| MISSING | **18** |
| **Total** | **38** |

`route_count = 38` passes on the register having 38 rows while **18 of those screens
do not exist.** A criterion a register satisfies by listing things is not a
criterion — it is the checker-blindness failure: the metric is computed from the same
document it is meant to validate.

Worse, **there are two different 38s.** The `$locale/preview/*` subtree contains
exactly **38 routes** — the mock-data prototype, not the register. `route_count = 38`
is satisfiable by the wrong 38.

`template_count = 8` is unverifiable: **no template register exists.** The matrix has
seven groups (A–G), not eight templates.

### 11.4 Replacement criteria

```
manifest_entries          = 38
template_ids_distinct     = 8
every manifest entry resolves to a real route file      (drift = 0)
every non-preview route file appears in the manifest    (orphans = 0)
duplicate_route_ids       = 0
duplicate_analytics_ids   = 0
prototype_routes_excluded = true      # $locale/preview/* never counts
built_screens / partial_screens / missing_screens reported separately, always
```

The manifest must be **generated from the route tree and diffed**, so it cannot
certify itself. `route_count = 38` is deleted as a criterion: 38 is the size of the
ambition, not a measure of delivery.

---

## 12 · Lili — **REVISE**

Implemented, and the category list is exact. The DB CHECK
(`condo, hotel, car-with-driver, airport-transfer, private-driver, bespoke`) matches
the six specified categories with no drift, and the Zod enum matches the CHECK — a
genuine two-layer guarantee. Routes map: `concierge/index → categories →
category/$slug → intake → review → handoff → received`, with `concierge/privacy`.

REVISE because the **Pending Review → Human/Operations Handoff** step is not what the
flow claims: `requestConciergeHandoff` is unauthenticated, unthrottled, and records
*the customer asking*, which the status vocabulary then treats as the handoff itself.
**No `handoff_authorized` state exists anywhere** (§5.3).

The **No-guarantee Notice** step is present in the flow and must stay. It is the one
thing standing between this product and §8.3.

---

## 13 · Lovable change contract — frontend / UX only

Permitted on **Lilith Connect only**, one Owner approval per item:

| # | Change |
|---|---|
| L1 | Add the `handoff_authorized` operator control to `/panel/concierge` (UI only; the transition is C-side) |
| L2 | Surface consent status and withdrawal state on the operator request view |
| L3 | Render the route manifest (§11.2) as the source of navigation; no dynamic collapse |
| L4 | Add a visible retention/erasure notice and a request-reference lookup to the concierge flow |
| L5 | Mark every AI-produced string in the UI as machine-produced (§10.3) |
| L6 | Separate `sample_data` rows visually wherever they can appear beside real ones |

**Lovable must NOT:** weaken any RLS policy · grant INSERT on `concierge_requests` ·
add PII to any event payload · write backend state transitions · touch Property Pulse
· migrate frameworks · publish · change DNS or billing · enable any database.

## 14 · Codex change contract — backend / schema / API / security

| # | Change |
|---|---|
| C1 | `consent_ledger` (append-only) + migration that **backfills nothing** — existing `pdpa_consent = true` migrates as `policy_version: 'unknown-pre-migration'`, never as current valid consent |
| C2 | Replace `handoff_requested boolean` with `handoff_requested_at timestamptz`; extend the status CHECK with `handoff_authorized`; add `handoff_authorized_by uuid` |
| C3 | `requireSupabaseAuth` + rate limit on `requestConciergeHandoff` |
| C4 | `enforceLeadRateLimit` → **fail closed** with 503 and a human contact route |
| C5 | `RATE_LIMIT_SALT` env var; stop using the service-role key as a salt |
| C6 | `event_outbox` + relay + dead-letter alarm + daily reconciliation (§6.4) |
| C7 | Move the LINE push behind the outbox and **strip `contact` and `details` from its payload** |
| C8 | Extend DSAR to `concierge_requests` by `request_ref`; erasure clears `contact`, `details`, `attachment_names`, keeps `ref`, `category`, timestamps |
| C9 | Erasure must handle message **content**, not only authorship (§2.4) |
| C10 | Retention jobs for `concierge_requests`, `lead_rate_limits` — **periods are an Owner decision** |
| C11 | Move `sample_data` rows to a separate table or schema |
| C12 | `packages/contracts` types for §6.2 as the single source of truth |
| C13 | Route manifest generated from the route tree + drift checker (§11.4) |
| C14 | Negative test: an event payload containing a PII-shaped field must **fail the build** |

**Codex must NOT:** implement Lovable app code · run migrations without approval ·
touch `acs-seo/`.

## 15 · DO_NOT_TOUCH

1. `has_role()` and every RLS policy on `concierge_requests`. **No INSERT grant, ever.**
2. The absence of a service-role bypass in `listConciergeRequests`.
3. `ConsentGate`'s refusal to backfill consent.
4. Policy-version binding on every consent record.
5. Independence of `marketing_consent` from `pdpa_consent`.
6. **Raw IP must never be stored; `client_hash` must never be joined to a request.**
7. `content-os.ts`: `NO_VERIFIED_DATA`, `countsAsRevenue`, `distinctFromNext`, and
   `SIMULATED` as *"never a metric"*.
8. The category CHECK / Zod enum pair.
9. The **No-guarantee Notice** step in the Lili flow.
10. TanStack Start as the framework (§2.1).
11. The root static prototype in this repository.

## 16 · OWNER_APPROVAL_REQUIRED

- **Unpublishing Middle Property Views** (§8.3) — recommended immediately
- Enabling any database, including Property Pulse
- De-provisioning the Remix project's unused database
- Any migration on Lilith Connect's live database
- Retention periods (§7 P4)
- Publishing any ACS SEO package to `www.asiancoding.com`
- Merging PRs #5, #6, #8
- Changing either project's publish audience from `public`

---

## 17 · MUST FIX

| # | Finding | Where |
|---|---|---|
| M0 | **Public site collects PII with no consent, discards it, and displays a false booking confirmation** | Middle Property Views `BookViewingDialog.tsx` |
| M1 | Dual write: request commits, LINE notify may fail silently → accepted request lost | `requests.functions.ts` |
| M2 | Consent is a column of the submission; no independent withdrawable record | `0002_create_concierge_requests.sql` |
| M3 | `concierge_requests` outside all data-subject rights | `pdpa.functions.ts` |
| M4 | `requestConciergeHandoff` unauthenticated and unthrottled | `requests.functions.ts` |
| M5 | No `handoff_authorized` state; the requester's ask is treated as the handoff | status CHECK |
| M6 | Rate limiter fails open on a public anonymous write path | `rate-limit.server.ts` |
| M7 | Full request content + contact PII pushed to a LINE group | `summarizeRequest` |
| M8 | Erasure nulls message authorship but not message content | `deleteMyAccount` |

## 18 · SHOULD FIX

S1 service-role key as rate-limit salt · S2 no retention/TTL anywhere ·
S3 `sample_data` mixed with real rows · S4 `contact` unstructured ·
S5 both projects published `public` — confirm intent · S6 `attachment_names` may
carry PII · S7 no template register · S8 Ajungma Retail OS is live and unreviewed

## 19 · EVIDENCE REQUIRED

| # | Needed | Blocks |
|---|---|---|
| E1 | **Roomie Finder** — workspace/project ID, or confirmation it was deleted | §9 row |
| E2 | Retention periods for requests, attachments, throttle ledger | C10 |
| E3 | Staff LINE group membership and its retention | M7 |
| E4 | Is `publish_audience: public` intended for the operator dashboard? | S5 |
| E5 | **Did Middle Property Views ever receive real submissions?** Its DB contents decide whether this is a near miss or an incident | M0 |
| E6 | Fee basis and payer — still unanswered, still blocking screens 33–35 | §11.3 |

---

## FINAL VERDICT

# REVISE

Not BLOCKED — the design direction is sound and most of it is already correct in
code. Not APPROVE_FOR_IMPLEMENTATION — one item must be handled before any
implementation work begins, and it is not in the implementation plan at all.

**Before anything else: §8.3.** A published, public page is collecting personal data
without consent, discarding it, and telling real people their viewing is confirmed.
Every other item here is about a system behaving worse than intended; this one is
about a person being told something untrue and acting on it. It needs the Owner's
decision to unpublish today, and E5 to determine whether it is a near miss or an
incident already.

**Then three corrections before Lovable is given work:**

1. **§3** — Property Pulse is a read model over governance state, not a second
   operations system. Operations already lives in Lilith Connect. Accepting this
   changes what gets built and may remove the need to enable its database at all.
2. **§4 / Option D** — adopt the transactional outbox. The requirement that no
   accepted request may be lost is **already violated in production** via the LINE
   path. A simple webhook is not sufficient, and the repository contains the proof.
3. **§5** — consent becomes an append-only ledger; `handoff_authorized` becomes an
   explicit operator decision with a named actor. Consent must never trigger
   operations.

**On Gemini:** right about separating consent from submission. Wrong to propose a
framework migration with no named benefit against a production system; wrong to
treat IP as consent evidence; wrong that hashing is deletion; and wrong to treat
durability as a future design question when the loss path is live code. It also
missed that the operations context already exists inside Lilith Connect, which
changes the target architecture.

**The 38/8 contract** is accepted as a manifest and rejected as stated acceptance
criteria: it can pass while 18 of 38 screens do not exist.

### NEXT HANDOFF — on Owner approval of this review

| # | Owner | Scope |
|---|---|---|
| 0 | **Owner** | Decide §8.3 (unpublish) and answer E5 — **before** 1–5 |
| 1 | **Codex** | §14 C1–C14: backend, data, API contract, security |
| 2 | **Lovable** | §13 L1–L6 only, after C1/C2 land |
| 3 | **Manus** | Independent QA against §11.4 and §6 |
| 4 | **Claude** | Final evidence review |
| 5 | **ChatGPT / เจริญ** | Director gate |

Nothing in this portfolio was modified, enabled, deployed, published, or sent to a
customer during this review.
