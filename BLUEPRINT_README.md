# LILITH by THE MIDDLE — Architecture Blueprint v1.0

Middle Property Matching Platform — Property Matching Infrastructure + Deal Collaboration Platform + Property Intelligence System.

**Status:** architecture baseline, ready for implementation.
**Rule:** if the code and this blueprint disagree, fix the blueprint first, then the code.

---

## Documents

| File | Sections | Contents |
|---|---|---|
| [`docs/01-product-and-system-architecture.md`](docs/01-product-and-system-architecture.md) | 1–8 | Executive summary · system context · actors · modules · **38-screen IA** · design system · frontend · backend · **full ER model** |
| [`docs/02-matching-ai-deal-fee.md`](docs/02-matching-ai-deal-fee.md) | 9–13 | **Matching engine** (dimensions, weights, confidence, reasons) · **Lilith AI** (tasks, guardrails, evals) · **deal state machine** (17 transitions) · messaging & notifications · **success fee engine** |
| [`docs/03-security-events-admin.md`](docs/03-security-events-admin.md) | 14–17 | Auth (phone OTP, sessions) · authorization (RBAC + ownership + tier + RLS) · privacy/PDPA · security controls · fraud · **event taxonomy** · admin backoffice |
| [`docs/04-api-contracts.md`](docs/04-api-contracts.md) | 18 | Every endpoint with request/response shapes, error envelope, DTOs, SSE frames, and a screen→endpoint coverage table |
| [`docs/05-engineering-handbook.md`](docs/05-engineering-handbook.md) | 19–24 | Repository structure · environment variables · dev/staging/prod · **testing invariants** · observability & SLOs · deployment & scaling triggers |
| [`docs/06-roadmap-and-adrs.md`](docs/06-roadmap-and-adrs.md) | 25–29 | MVP / V1 / V2 scope · risks & tradeoffs · **12 ADRs** |
| [`docs/07-codex-handoff.md`](docs/07-codex-handoff.md) | 30 | **91 implementation tasks** with goal, files, dependencies, acceptance criteria and tests |
| [`IMPLEMENTATION_ORDER.md`](IMPLEMENTATION_ORDER.md) | — | Build sequence, parallelisation map, critical path, Owner decision checkpoints |

---

## The ten commitments this architecture is built on

1. Match score is **deterministic** — an LLM never produces the number.
2. Weights and rules are **versioned database rows**, not code.
3. Every deal change is a **guarded state transition** with an event and an audit record.
4. Authorization is **server-side and resource-scoped**, with RLS as a second barrier.
5. Every AI output carries **provenance** and a human override path.
6. Contact details and documents are **withheld until the Deal Room opens**, by DTO construction.
7. Money is `BIGINT` **satang**, and the fee rule is snapshotted onto every fee.
8. **Three event streams** — analytics, domain, audit — with different guarantees.
9. **Soft delete + versioning** on everything a deal touched.
10. The MVP runs on one Next.js app + one Postgres + one worker, with **no architectural dead ends**.

---

## Reading order

- **Owner / product:** README → §1 → §5 (38 screens) → §25–27 (scope) → §28 (risks) → the three decision checkpoints at the end of `IMPLEMENTATION_ORDER.md`.
- **Codex / implementer:** `IMPLEMENTATION_ORDER.md` → `docs/07-codex-handoff.md` → the section referenced by the task you are on.
- **Reviewer (Claude) / QA (Manus):** §8 (schema constraints) → §9 (matching) → §11 (state machine) → §13 (fees) → §22 (invariants) — these are where correctness is decided.

---

## Immediate blockers requiring an Owner decision

1. **Fee model precision** — 0.1% of exactly what, and who pays? Needed before `DB-008`.
2. **Legal review** — Thai counsel on the fee agreement, terms, and platform-vs-brokerage positioning. Needed before the first live invoice (`FEE-003`).
3. **Existing Lovable prototype** — stays live, becomes a labelled demo, or is retired? Needed before launch (ADR-0012).
