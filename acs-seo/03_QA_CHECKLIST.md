# ACS SEO — Reusable QA Checklist

**Purpose:** stop re-running full QA on every package. Full review is spent only where a
package can actually cause harm; everything else gets a mechanical pass.

---

## Tier 0 — Mechanical check (EVERY package, no exceptions, automatable)

Fail any item → return to writer. Do not proceed to Tier 1.

| ID | Check | Pass condition |
|---|---|---|
| M-1 | Files present | `article.md`, `meta.json`, `schema.jsonld`, `audit.json`, `claim_register.md`, `brief.md`, `package_status.json` all exist |
| M-2 | Metadata | title ≤ 60 chars, meta description 120–160, exactly one `<h1>`, canonical set and absolute |
| M-3 | Internal links | every internal link resolves to a URL in the 82-URL live inventory, or is marked `NEW` in `brief.md`. No orphan package: at least one inbound link named |
| M-4 | Sitemap | target URL exists in the sitemap, or `brief.md` states it is a NEW URL to be added |
| M-5 | Forbidden words | zero hits from the forbidden list in `01_CLAIM_REGISTER.md` §4 |
| M-6 | Numbers | every number, %, range and currency amount in `article.md` maps to a CR row in the package's `claim_register.md` |
| M-7 | Schema | `schema.jsonld` parses, `@type` matches page class, no field asserting a claim that has no CR row |
| M-8 | Status | `package_status.json` = `DRAFT_PENDING_REVIEW` and no publish flag set |

## Tier 1 — Routing: how deep does this package go?

Answer in order. The first `YES` decides the tier.

| # | Question | If YES |
|---|---|---|
| R-1 | Does it contain a price, ROI, performance figure, accuracy, read range, speed, or any customer/case claim? | **FULL QA** |
| R-2 | Is it a P0 page, or a brand-new URL? | **FULL QA** |
| R-3 | Does it name a vendor (Brady, Honeywell, TSC, GS1) in a way that asserts partnership, authorisation, or a product specification? | **CLAIM QA** |
| R-4 | Does it target an intent inside cannibalisation clusters C-1 … C-8? | **CANNIBALISATION GATE first**, then re-route |
| R-5 | None of the above — general-principle article with no flagged claim | **WORDING_QA_OK** |

## Tier 2A — WORDING_QA_OK (the cheap path)

For general-principle content only. Read for: factual accuracy of the principle, no smuggled
comparative, no implied ACS capability, Thai/English consistency. **Result `WORDING_QA_OK`
is not permission to publish** — it still waits on the rendering gate and Owner sign-off.

## Tier 2B — CLAIM QA (flagged claims only)

Review **only the flagged sentences**, not the whole article. For each:

1. Which CR row does it map to?
2. Is the source attached in `audit.json` — URI, document revision, date checked, reviewer?
3. Does the wording stay inside what the source actually says? (A datasheet giving a value at
   23 °C does not license a claim about a freezer.)
4. EVIDENCE_REQUIRED with no evidence → `REVISE`. BLOCKED → delete the sentence, do not soften it.

## Tier 2C — FULL QA

Tier 2B on every claim, plus: intent match against the keyword queue, cannibalisation
re-check against the live inventory, internal link graph, schema fidelity, and a read of the
whole article for claims the writer did not flag.

## Tier 3 — Cannibalisation Gate (before writing, not after)

Run against the 82-URL live inventory in `00_SOURCE_PACK_INDEX.md`.

- No collision → proceed.
- Collision → choose one and record it in `brief.md`: **ENRICH** the existing URL ·
  **NEW** URL with a written canonical-intent statement saying what it owns and what the
  existing page keeps · **HOLD** for Owner.
- Cluster C-1 (10 live URLs on one head term) is **HOLD by default** until the Owner names a
  canonical owner. Due 24 Sep 2026.

## Tier 4 — Rendering Gate (site-wide, not per package)

The site is client-side rendered. Until Manus decides and implements SSR/prerender:

- No package may be marked SEO-ready, regardless of QA state.
- Do not add `lastmod`, submit sitemaps, or request indexing.
- A package that clears every tier above stops at `READY_PENDING_RENDER`.

## Re-QA rule — what stops the loop

Re-run **only** what the change touched:

| Change | Re-run |
|---|---|
| Wording of a non-flagged sentence | Tier 0 only |
| Any number, price, spec, customer or brand claim | Tier 0 + Tier 2B on that claim |
| Target URL or intent | Tier 0 + Tier 3 |
| New evidence attached | Tier 2B on that claim only |
| Site rendering changed | Tier 4 once, site-wide — not per package |

A package is never re-QA'd in full because a different package changed.
