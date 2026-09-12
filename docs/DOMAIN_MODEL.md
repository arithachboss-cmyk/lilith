# Domain model

All platform tables are namespaced `mp_`; Drizzle schema is in `db/platform-schema.ts`. Monetary columns use canonical decimal strings. The API accepts only THB for this slice.

| Entity | Relationship / purpose | Batch status |
| --- | --- | --- |
| User, Profile, Role | Stable Sites identity; one persisted role; display profile | Implemented onboarding |
| Organization | Optional organization reference | Schema only |
| Property | Owner supply, transaction, price, district, bedrooms, facilities | Create/read/publish |
| PropertyMedia, PropertyDocument | Private object keys attached to property | Schema only; no public URL |
| Requirement | Creator-owned demand; explicit representation consent | Create/read |
| RequirementPreference | Extension for additional named preferences | Schema only; core preferences on Requirement |
| Match | Unique property/requirement pair | Persisted deterministic generation |
| MatchScore | Immutable score, confidence, policy weights, engine version | Implemented |
| MatchReason | Per-constraint explanation | Implemented |
| Interest | Unique match/side and match/actor; current decision | Implemented with history in audit |
| DealRoom | Unique match room, workflow state, CAS version | Implemented through viewing |
| DealParticipant | Ownership-derived SUPPLY/DEMAND users | Implemented |
| Message | Participant-authored message; retry-safe request ID | Implemented |
| Viewing | Appointment, requester, notes, status and retry key | Request/confirm/complete rules |
| Offer, Negotiation, Agreement | Money and terms, acceptance/signature artifacts | Schema only |
| Deal | Closed agreement/transaction record | Schema only |
| FeePolicy | Configured success rate and basis | Default 0.001 migration |
| Fee | Snapshot of basis/rate/amount/status | Schema and pure fee engine only |
| Payment | Provider reference and settlement record | Schema only |
| Notification | User-scoped room/viewing notifications | Persist/read/mark-read |
| VerificationRecord | Reviewer/evidence/status | Schema only |
| AuditLog | Actor-attributed critical actions | Implemented append-only application writes |
| AIRun | Model/prompt/latency/outcome/usage metadata | Schema only |
| Event | DOMAIN/ANALYTICS envelope, dedup key | Implemented for delivered actions |

Database uniqueness constrains match pairs, interest sides/actors, rooms per match, participants, request IDs, event dedup keys and payment references. Foreign keys prevent orphan entities. Role, state, interest-side, currency and score checks provide additional database constraints.

Future records are schema foundations, not working features. No endpoints fabricate payments, agreement signatures, verification or AI results.
