# ADR-0014 — ACS Online Business ERP mock prototype boundaries

Status: accepted for the mock prototype only; owner review pending.
Date: 2026-09-24

## Context

The owner asked for an internal, local mock MVP of an ACS Online Business ERP covering eight modules, built with deterministic synthetic fixtures and no deployment, provider connection, credential, external call or real ACS data. The brief also asked that the public ACS site, canonical `https://www.asiancoding.com`, Cookie Consent, public lead forms, Brady pages, proposal controls, Privacy/PDPA work, SEO routes, sitemap and current staging work all be preserved.

This repository is `arithachboss-cmyk/lilith` (`middle-property`), a property-leasing platform prototype. None of those ACS web assets exist here: there is no ACS application, no Cookie Consent, no lead form, no sitemap, no Brady page and no canonical to `www.asiancoding.com`. The only ACS material in the repository is `acs-seo/`, a governance and QA document set with no web code, carried on a separate unmerged branch. The preservation list is therefore recorded as inapplicable rather than satisfied, and nothing was reset, force-pushed or discarded to make room for this work.

The base is `codex/lilith-prototype` at `762affe`. The branch is `codex/acs-online-business-erp-mock`. There is no TASK-ID in `IMPLEMENTATION_ORDER.md` or `docs/07-codex-handoff.md` that covers this work, so none was invented and `docs/IMPLEMENTATION_STATUS.md` is untouched, following the precedent set by the `acs-seo/` work.

## Decision

Build the prototype as a self-contained `acs-erp/` directory in plain ESM on the Node standard library, with no dependency and therefore no lockfile change. It sits outside the `apps/*` and `packages/*` workspace globs, matching the `acs-seo/` and `lili/` precedents, so `pnpm build`, `typecheck`, `lint` and `test:boundaries` are unaffected. Whether any of it later becomes a workspace application is not decided here.

The domain layer is framework-free and performs no I/O; the HTTP server is a thin adapter over it, consistent with the repository rule that routes sit behind core.

## Interpretations recorded

**The approval policy and the executable workflow.** The brief requires the approval actor, limit and sequence to be modelled as `OWNER_DECISION_PENDING` with approval-required transitions stopped, and separately requires the full workflow — including create mock order and mock fulfillment, which sit downstream of approval — to be implemented and tested. These reconcile only one way. The runtime can construct exactly one policy, `OWNER_DECISION_PENDING`, under which the workflow halts at the approval path with both approving roles attempted and recorded, and every later step marked `NOT_ATTEMPTED`. The test suite injects a second policy from `acs-erp/tests/fixture-policy.mjs`, named `FIXTURE_ONLY_NOT_AN_OWNER_POLICY`, purely to exercise the downstream steps. It is not an owner decision and is not evidence that one exists. It lives under `tests/` and a test asserts that no file under `src/` imports it, so the server cannot load it.

**`OWNER_DECISION_PENDING` is not a denial.** Approve and export for Chairman and Manager resolve to a third verdict, distinct from both allow and deny, because the owner reserved those actions for a future policy rather than refusing them. For Account, Stock, Sales and Technic the same actions are a standing `DENY`: the brief says those roles hold no implicit commercial approval or export, which is a decision already made. Encoding both as the same value would lose the difference between a decision not yet made and a decision already made.

**Chairman is view-only.** The role table grants Chairman view, and approve/export only under a future policy. It does not grant create or edit, so the matrix denies both. This is narrower than an executive role might be assumed to need; it follows the table as written rather than the assumption.

**A datasheet closes one track.** Each evidence kind closes exactly one of the five tracked statuses, enforced by a fixed map. Delivery availability and partner authorisation are modelled as standalone assertions rather than tracked fields, because they are not derivable from any combination of the five and must never appear to be. With no record of their own they answer `BLOCKED_EVIDENCE_MISSING` even for a fully evidenced SKU.

**An unauthenticated request is answered as absence.** The route returns a bare `404` naming no module and carrying no fixture value, rather than a `403` that confirms an ERP console exists at that path. A known actor without console access gets `403`. Only `GET` and `HEAD` are served: there is no mutating endpoint, so the console cannot be the thing that creates a lead, a payment, a send or a publish.

**`robots.txt` is served by the mock server only.** It is part of the local prototype's own surface and is not a change to any public site's robots policy, because no public site exists in this repository.

## Consequences

The prototype demonstrates the eight modules, the permission matrix, the evidence gates and the workflow, and it stops where the owner has not decided. It is not a production system: there is no database, no migration, no authentication beyond fixture tokens, no persistence across a restart, and no provider integration.

Three things remain the owner's to supply, and none of them can be inferred: the approval policy (actor, limit, sequence), whether Chairman should hold create or edit after all, and whether any adapter beyond `LOCAL_MOCK` should ever be approved. Until the first arrives, no approval-required transition in this prototype can complete.
