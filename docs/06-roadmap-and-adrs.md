# LILITH by THE MIDDLE — Architecture Blueprint
## Part 6 — Scope, Risks, Decisions (Sections 25–29)

---

# 25. MVP Scope

**MVP goal (one sentence):** *prove that a deterministic match can produce a real, closed, fee-generating deal on the BTS corridor.*

**Success criteria — the MVP is judged on these, not on feature count:**

| Metric | Target within 8 weeks of launch |
|---|---|
| Published, verified properties | 150 |
| Active requirements | 100 |
| Mutual matches | 60 |
| Viewings completed | 20 |
| **Deals closed with a fee issued** | **3** |
| Interest rate in score band 85+ vs 55–69 | ≥2× (proves the score means something) |
| AI field-acceptance rate | ≥70% |

## 25.1 In scope

| Area | MVP content |
|---|---|
| Roles | OWNER, CLIENT, AGENT, ADMIN — all four, because the marketplace does not work with fewer |
| Screens | All 38, but several in a reduced form (below) |
| Transaction types | `RENT` and `SALE`. `RENT_TO_OWN` data model present, UI behind `FLAG_RENT_TO_OWN` |
| Geography | Bangkok BTS/MRT corridor only — On Nut → Ari, hard-limited in seed data |
| Property types | CONDO, APARTMENT only |
| Matching | Full deterministic engine, `default_rent_v1` + `default_sale_v1`, admin weight editor with shadow scoring |
| AI | `extract_property`, `extract_requirement`, `normalize`, `explain_match`, `detect_duplicate` (deterministic pre-filter + AI adjudication). `deal_summary` behind a flag |
| Deal | Full 14-state machine, Deal Room, messaging, viewings, offers, agreement upload, dual-confirm close |
| Fee | Full engine, invoice PDF, **manual** payment confirmation with slip upload |
| Verification | T0–T4, manual admin review |
| Notifications | In-app + push + email; SMS for OTP and viewing reminders only |
| Insights (36) | Reduced: demand pressure, days-to-first-interest, unmet attributes. No agreed-price panel until sample ≥10 |
| Admin | Verification, listing moderation, duplicate review, deal support, fee/reconciliation, audit search, weight profiles |
| i18n | Thai (default) + English, complete |

## 25.2 Reduced forms in MVP

| Screen | MVP reduction |
|---|---|
| 24 Super Match | quota 3/week, no paid top-up |
| 28 Lilith Deal Assistant | template summary + open items; AI paragraph behind a flag |
| 31 Offer / Negotiation | structured amount + terms; no document generation, no e-signature (upload signed PDF) |
| 34/35 Fee & Receipt | PromptPay QR + bank transfer + slip upload; no card payment |
| 36 Insights | 4 panels, weekly refresh, k≥10 suppression |
| 37 Opportunities | notification list only; no personalised opportunity engine |

## 25.3 Explicitly out of MVP

Multi-unit projects at scale (`property_units` exists but the UI handles one unit per listing) · developer/project accounts · co-agency commission splits · e-signature integration · card/online payment · mortgage or loan tooling · non-Bangkok geography · house/land/commercial types · public SEO listing pages beyond a single shareable property page · native apps · agent CRM import · Chinese-language UI · referral partner portal.

## 25.4 MVP definition of done

- All seven E2E journeys green in staging.
- Every invariant test in §22.2 passing.
- `AI_ENABLED=false` run passes all 38 screens.
- Security suite: zero high findings; IDOR suite green.
- One real deal closed end-to-end on staging with a real (test) invoice and receipt.
- Runbooks written for the five most likely incidents.
- Privacy policy, terms of service, and the fee agreement published and consented at signup.

---

# 26. V1 Scope (after MVP validation, ~3 months)

Gate: MVP success criteria met, especially the score-band calibration.

| Theme | V1 additions |
|---|---|
| Payments | Omise/2C2P integration — card + PromptPay with webhook confirmation; automatic invoice settlement; payment reminders |
| Agreements | E-signature integration; templated lease/reservation generation from deal terms |
| Matching | Second-generation weights informed by real interest data; learned per-user preference weights (bounded ±10% adjustment on top of the profile, fully logged and explainable); saved searches with alerts |
| Supply | Multi-unit projects, bulk import for agencies (CSV + validation report), agent mandate documents with expiry reminders |
| Demand | Requirement sharing between agent and client with consent flow; client portal view |
| Deal | Co-agency: two agents in one room with defined commission split records; document checklist per transaction type |
| Intelligence | Agreed-price panels once sample allows; project-level pages; monthly market report generation (Lilith-drafted, human-approved) |
| Trust | Public agent profiles with verified stats (closed deals, response time), review system tied to completed deals only |
| Notifications | Digest engine, opportunity alerts ("3 new requirements match your listing this week") |
| Ops | SLA dashboards, queue auto-assignment, dispute workflow with evidence bundle |
| Platform | Managed realtime if SSE limits are hit; read replica; OpenSearch if facet complexity demands it |

---

# 27. V2 Roadmap (6–12 months, direction not commitment)

1. **Property Intelligence as a product** — subscription analytics for agencies and developers: absorption, pricing power, demand heatmaps by station. This is where the data moat pays.
2. **Geographic expansion** — full Bangkok, then Chiang Mai / Phuket / Pattaya; the `locations` hierarchy and transit model already support it.
3. **Asset types** — houses, townhouses, land, office, retail; each needs its own dimension set and weight profile (the engine is already profile-scoped).
4. **Rent-to-own product** — full lifecycle: option agreement, credit accrual ledger, exercise workflow, partner lender integration. This is a differentiator worth building properly, not a listing tag.
5. **International demand** — Chinese and Japanese buyer/tenant flows, multi-currency display, partner-agency referral portal with attribution and split fees.
6. **Lilith as a working assistant** — proactive pipeline nudges, drafted follow-ups (human-approved), viewing-feedback synthesis, and portfolio advice for owners. Still never authoritative on price or law.
7. **Open supply API** — inbound listing feeds from agency CRMs, outbound syndication with attribution, webhooks for partners.
8. **Native apps** — only when push reliability or camera/document workflows demand it.
9. **Model independence** — evaluate a Thai-capable open model for extraction/normalisation to cut cost and remove cross-border transfer from the privacy story.

---

# 28. Risks & Tradeoffs

## 28.1 Product & market risks

| # | Risk | Likelihood | Impact | Mitigation | Early-warning signal |
|---|---|---|---|---|---|
| P1 | **Cold start** — no supply means no demand and vice versa | High | Fatal | Seed with Middle Property's own BTS-corridor inventory before launch; recruit 20 agents by hand; demand-first marketing in a single area so density beats breadth | <50 published properties at week 4 |
| P2 | **Disintermediation** — parties meet and transact off-platform to dodge the 0.1% | High | Severe | Contact masking pre-viewing; make the Deal Room genuinely more useful than LINE (documents, timeline, reminders); fee is small enough to accept; ToS obligation; offline-deal detection survey | Mutual→close rate collapsing while viewing rate stays high |
| P3 | **0.1% may not cover CAC** | Medium | Severe | Fee engine is configurable by design — the rate is one row. Model unit economics from the first 10 deals before scaling spend | CAC per closed deal > fee revenue after 20 deals |
| P4 | Agents perceive the platform as competing with them | Medium | High | Agents are first-class users with pipeline tools, not disintermediated; mandates respected; never show an owner's contact to a client behind an agent's back | Agent churn after first deal |
| P5 | Match quality perceived as poor | Medium | High | Explainability is the antidote — a user who sees *why* forgives an imperfect match; weekly calibration report | 85+ band interest rate not materially above 55–69 band |
| P6 | Listing quality / stale inventory | High | Medium | `last_verified_at` freshness decay in the score; monthly "still available?" prompts; auto-pause after 60 days unverified | Rising "no longer available" reports |

## 28.2 Technical risks

| # | Risk | Mitigation | Tradeoff accepted |
|---|---|---|---|
| T1 | Match generation cost grows O(requirements × properties) | Two-phase filtering, indexed candidate SQL, incremental generation on change, nightly batch off-peak | Matches are eventually consistent (seconds to minutes), not instant on every edit |
| T2 | LLM latency/outage blocks core flows | Every AI task has a deterministic fallback; `AI_ENABLED=false` must pass all E2E | Extraction quality degrades; the product does not stop |
| T3 | AI extraction errors reach published listings | Human confirmation required in the wizard; `human_decision` tracked; never auto-publish AI-only data | Slower listing creation |
| T4 | Postgres as queue + rate limiter + search + vector store hits a wall | Documented scaling triggers (§24.5), each with a prepared migration path | Accepting a future migration in exchange for radical MVP simplicity |
| T5 | SSE connection limits on serverless | Heartbeat + reconnect + polling fallback; managed WS swap isolated behind `sse.ts` | Slightly higher latency on fallback |
| T6 | Money bugs | BigInt satang, pure fee engine, property-based tests, nightly reconciliation, dual control on overrides | More ceremony around fee changes |
| T7 | Weight change silently degrades matching | Shadow scoring + diff report + versioned profiles + instant rollback + preserved `match_scores` history | An extra approval step before publishing weights |
| T8 | Data breach of identity documents | Private bucket, column encryption, signed short-TTL URLs, every read audited, admin MFA, minimal retention | Slower admin document review |
| T9 | Vendor lock-in (Vercel/Neon/OpenAI) | Standard Next.js (portable), standard Postgres (portable), provider-agnostic `LilithClient` | Some managed-service convenience lost by avoiding proprietary features |
| T10 | Prompt injection via property descriptions | Delimited untrusted input, schema-constrained output, no tool access from AI tasks | Slightly more rigid prompt design |

## 28.3 Legal / regulatory risks

| # | Risk | Mitigation |
|---|---|---|
| L1 | PDPA non-compliance (consent, access, erasure, cross-border) | Consent records per purpose, export/erasure endpoints, redaction before LLM egress, documented retention, breach runbook |
| L2 | Real-estate brokerage licensing / agent regulation in Thailand | Position clearly as a technology intermediary charging a platform success fee, not as a brokerage; Lilith gives no professional advice; **get Thai counsel to review the fee agreement and ToS before the first live deal** — this is an Owner decision, flagged here as a blocker for revenue, not for build |
| L3 | Fee enforceability when parties transact offline | Written fee agreement accepted at signup and re-confirmed at Deal Room opening, with a logged consent record |
| L4 | Tax invoice / VAT correctness | Snapshot tax details at issue, gapless numbering, 7% VAT configurable, accountant review before first invoice |
| L5 | AI persona misrepresentation | Lilith always labelled as an AI assistant; never presented as a licensed agent or a real person; disclaimers on any valuation-adjacent output |
| L6 | AML/KYC on high-value sale transactions | T4 verification and document retention align with AMLA expectations; escalation path for unusual transactions |

## 28.4 Deliberate tradeoffs (what we are choosing *not* to do, and why)

1. **Deterministic scoring over ML ranking.** We lose potential accuracy; we gain explainability, debuggability, instant tunability and legal defensibility. Revisit only when there are ≥10,000 labelled interest events.
2. **Monolith over microservices.** One team, one deploy. Module boundaries preserve the option.
3. **Postgres for everything.** Fewer moving parts beats theoretical fit. Triggers documented in §24.5.
4. **Messaging only inside a Deal Room.** Loses a "browse and chat" social feel; removes harassment surface, spam, and disintermediation before viewing.
5. **No password auth.** Loses some familiarity; removes credential-stuffing risk entirely.
6. **Manual payment in MVP.** Loses automation; ships revenue three weeks earlier and validates the fee model before integration cost.
7. **Manual verification review.** Doesn't scale past ~50/day; guarantees quality when trust is the entire product. Automate only when the queue actually hurts.

---

# 29. Architecture Decision Records

Format: Context → Decision → Consequences → Status. One file per ADR in `docs/adr/`.

### ADR-0001 — Deterministic matching engine; LLM excluded from scoring
**Context.** Match quality is the product. Users must be able to ask "why?" and get a stable, honest answer. LLM scoring is non-reproducible, unauditable, expensive per request, and impossible to tune predictably.
**Decision.** `score` is a pure function of `(requirement, property, weight_profile)`. LLMs contribute normalised inputs, embeddings for one dimension, and the prose summary only.
**Consequences.** (+) Reproducible, testable, cheap, explainable, tunable without deploy, defensible in a dispute. (−) Requires hand-designed dimension functions; semantic subtleties are captured only through the embedding dimension and preferences. Revisit at ≥10k labelled interest events, and then only as a re-ranker behind an A/B test.
**Status.** Accepted.

### ADR-0002 — Weights and rules as versioned database configuration
**Context.** Weights will change weekly in early operation.
**Decision.** `match_weight_profiles` + `match_rules` rows, versioned, with shadow scoring and a diff report before publishing. Rules use a constrained JSON expression DSL, never evaluated JavaScript.
**Consequences.** (+) No deploy to tune; full history; instant rollback; scores are always attributable to a profile version. (−) A small DSL and evaluator to build and secure; an admin UI to maintain.
**Status.** Accepted.

### ADR-0003 — Single guarded transition function owns deal state
**Context.** Deal state drives money, notifications and trust. Scattered `UPDATE deals SET status` calls are how marketplaces end up with unexplainable deals.
**Decision.** One `transition()` function; a static transition table; permissions from `deal_participants`; state, transition record, outbox event and audit row written in one transaction; a database trigger rejects any status change without a matching transition row.
**Consequences.** (+) Every deal's history is complete and provable; the UI can render buttons from `allowed_transitions`. (−) More ceremony for simple changes; the transition table must stay in sync with the FSM diagram (a test asserts it does).
**Status.** Accepted.

### ADR-0004 — Money in satang as BigInt; fee rules versioned with immutable snapshots
**Context.** 0.1% of ฿12.5M must be exact and reproducible years later; the pricing model will change.
**Decision.** All amounts `BIGINT` minor units; fee engine pure; `fees` stores the full `fee_rule_snapshot`; rate expressed in basis points.
**Consequences.** (+) No float error; historic invoices re-derivable; pricing changes are data. (−) Every display path must format minor units; developers must never do arithmetic in JS numbers (lint rule + code review).
**Status.** Accepted.

### ADR-0005 — Postgres as the only datastore in MVP (queue, rate limit, search, vectors)
**Context.** Adding Redis, Elasticsearch and a message bus triples operational surface for a pre-revenue product.
**Decision.** pgboss for jobs, a table for rate limits, GIN/GIST/trigram/full-text for search, pgvector for embeddings, transactional outbox for events.
**Consequences.** (+) One backup, one failure domain, transactional consistency between business writes and events. (−) Ceilings exist; §24.5 names the trigger and migration path for each.
**Status.** Accepted.

### ADR-0006 — Phone OTP as the primary authentication factor, no passwords
**Context.** Thai users are phone-first; property enquiries require a reachable phone anyway; passwords create breach liability.
**Decision.** SMS OTP primary, email magic link secondary, opaque server-side sessions, TOTP mandatory for admins.
**Consequences.** (+) No password breach surface; phone verified as a side effect; low friction. (−) SMS cost per login and dependence on a Thai SMS provider (mitigated by an email fallback and a provider abstraction); number-change flow needs care.
**Status.** Accepted.

### ADR-0007 — Contact details disclosed only after the Deal Room opens
**Context.** Contact data is the platform's leverage and the user's privacy risk; premature disclosure destroys both the business model and trust.
**Decision.** Public DTOs physically exclude contact fields; disclosure happens at `DEAL_ROOM_OPENED` to `deal_participants` only; contact strings in messages are masked before `VIEWING_CONFIRMED`.
**Consequences.** (+) Privacy by construction; fee model protected; leaks become type errors rather than runtime bugs. (−) Some users will find masking annoying — the copy must explain it, and the policy is a configurable flag so it can be relaxed with evidence.
**Status.** Accepted.

### ADR-0008 — Three separate event streams (analytics / domain / audit)
**Context.** One "events" table forces the weakest guarantee onto the strongest need.
**Decision.** `events` (sampled, 24 months), `outbox` (transactional, drives side effects), `audit_logs` (append-only, 7 years, trigger-protected).
**Consequences.** (+) Analytics can be cheap and lossy; audit can be strict; side effects can never fire for uncommitted work. (−) A single user action writes to three places; helper functions must make that a one-liner in domain services.
**Status.** Accepted.

### ADR-0009 — Next.js monolith with enforced module boundaries
**Context.** A 3–5 person team building a marketplace; microservices would consume the entire budget in plumbing.
**Decision.** One Next.js app plus one worker process; domain logic in framework-free packages; ESLint import boundaries enforced in CI.
**Consequences.** (+) Fast iteration, one deploy, transactional simplicity, extractable later. (−) Discipline required — the lint rules are what actually prevent the mud; a heavy route can affect neighbours until split.
**Status.** Accepted.

### ADR-0010 — AI provenance and a mandatory kill switch
**Context.** AI output that silently becomes business data is unauditable and, in a property transaction, dangerous.
**Decision.** Every AI-derived value carries `source`, `confidence`, `model`, `prompt_version`, `ai_run_id`; every AI-populated field is human-confirmable and human-overridable; `AI_ENABLED=false` must leave the product fully functional, verified by the E2E suite.
**Consequences.** (+) Debuggable, replaceable, defensible; provider swaps are configuration. (−) More schema and UI surface; a slightly slower listing wizard; fallback code paths must be maintained and tested.
**Status.** Accepted.

### ADR-0011 — Row Level Security as defence in depth
**Context.** Deal Room leakage would be catastrophic to trust; application-layer checks are one bug away from failing.
**Decision.** RLS enabled on deal-scoped and document tables, keyed on a per-request `app.user_id`; a separate admin role bypasses it.
**Consequences.** (+) A second, independent barrier against IDOR and injection. (−) Connection wrapper complexity; care needed with connection pooling (`SET LOCAL` inside the transaction); job/admin connections need explicit roles.
**Status.** Accepted.

### ADR-0012 — Build fresh on Next.js/Prisma rather than extending the existing Lovable prototype
**Context.** A Lovable prototype (`lilith-leads-thailand`) already exists with swipe discovery and role dashboards. The temptation is to extend it.
**Decision.** Treat the prototype as a **design and demand-validation artifact**, not as the production codebase. Build the platform per this blueprint. Reuse: visual direction, copy, screen flow learnings, and any seeded property data (after cleaning).
**Consequences.** (+) The deal state machine, fee engine, audit trail and RLS requirements are not retrofittable onto a generated CRUD app without effectively rewriting it; starting clean avoids an architectural dead end in the exact places where money and trust live. (−) Visible progress restarts; the prototype must be kept alive (and clearly labelled as a demo) or retired deliberately.
**Status.** Accepted — Owner decision required on whether the public prototype stays live during the rebuild.
