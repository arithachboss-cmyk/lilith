# ACS Prototype — Gate Audit

**Project:** Lovable `ACS Prototype` (`b1d14add-5021-46fd-9486-1a36f56c1f97`)
**Commit audited:** `f6588e2c80188327d58b7c92f4729af6004b5d1f` — "Added design system & pages"
**Audited:** 7 September 2026
**Verdict:** all 8 hard gates PASS. Five defects found, none of them a gate breach.

---

## 1. Hard gates

| # | Gate | Result | Evidence |
|---|---|---|---|
| 1 | Not published, no custom domain | PASS | `is_published: false`, `visibility: private` |
| 2 | No price / discount / "starting from" | PASS | `src/lib/solutions.ts` — no monetary value in any of the 5 pages |
| 3 | No stock / availability / lead time / delivery promise | PASS | same; only assessment steps, no supply language |
| 4 | No partner / distributor / certification claim; "Brady" absent from UI | PASS | project name is "ACS Prototype"; `site-config.ts` `SITE_NAME` carries no codename, with the comment "Internal project codename is never rendered in the UI"; the string does not appear in any route, meta, or copy file |
| 5 | No manufacturer imagery or brand logo | PASS | `src/components/site/Icons.tsx` is inline SVG only; `seo.ts` deliberately sets no `og:image` |
| 6 | Indexing off | PASS | `PUBLIC_INDEXING_ENABLED = false`; `noindex, nofollow` in `__root.tsx` and per-route in `seo.ts`; `public/robots.txt` = `Disallow: /`; no sitemap |
| 7 | No third-party tracking tag | PASS | `src/lib/analytics.ts` is an in-memory sink; the tag-manager insertion point is present and empty; no GA4/GTM/Meta/LinkedIn/TikTok anywhere |
| 8 | No testimonials / customer logos / review scores | PASS | absent from all copy |

## 2. Scope

Exactly five solution routes plus `/`, `/thank-you`, `/privacy`. No pricing page, no
catalogue, no stock page, no partner page. **No opportunity/pipeline list of any kind** —
the excluded register (D-04) was not invented. `/` redirects to `/th`.

## 3. Lead form — persistence VERIFIED

Verification was done at database level. The Lovable preview host is blocked by this
environment's egress policy (`CONNECT tunnel failed, 403`), so **no browser end-to-end
submission was performed** — this is a DB + code verification, not a UI test.

| Check | Result |
|---|---|
| `public.leads` table exists | YES — 17 columns |
| Insert as `anon` with consent | **row persisted**, `lead_ref` auto-generated (`ACS-XXXXXXXX` format), Thai text stored intact |
| Insert as `anon` without consent | **rejected** — `42501 new row violates row-level security policy` |
| `SELECT` as `anon` | **0 rows** — leads are not publicly readable |
| RLS enabled | YES, one policy: INSERT only, `TO anon, authenticated`, `WITH CHECK (pdpa_consent = true)` |
| Test rows | deleted; table back to 0 rows |

Code path: `LeadForm.tsx` → `createLead` server function (`src/lib/leads.functions.ts`) →
`supabaseAdmin.insert(...).select("lead_ref")` → redirect to `/thank-you?ref=…`, which
renders the returned Lead ID. **This is real persistence, not a toast.**

Consent is enforced at three layers: client (`consent` state, unticked by default),
server (`z.literal(true)`), and database (RLS `WITH CHECK`). Marketing opt-in is a
separate optional checkbox, also unticked.

## 4. Defects found — fix before the indexing gate lifts

| ID | Severity | Finding |
|---|---|---|
| F-01 | Medium | `__root.tsx` hardcodes `<html lang="en">` on a Thai-primary site. Wrong language is announced to screen readers and to search engines on every `/th` route. Must be per-locale. |
| F-02 | Medium | `seo.ts` emits **relative** `canonical`, `og:url` and `hreflang` hrefs (`/th/...`). Open Graph and hreflang require absolute URLs; these are inert while indexing is off but wrong the moment it is switched on. |
| F-03 | Low | 404 and error pages are English-only hardcoded strings, breaking the TH/EN rule. |
| F-04 | Low | `__root.tsx` loads Google Fonts from `fonts.googleapis.com` / `fonts.gstatic.com`. Not a tracking tag, so gate 7 stands, but it does disclose every visitor's IP to a third party — worth self-hosting before production under PDPA. |
| F-05 | Info | The `anon` INSERT policy has no companion SELECT policy, so `INSERT ... RETURNING` fails for `anon`. Harmless today because the server function uses the service role and bypasses RLS, but a future switch to a client-side insert would break. |

None of these five block the prototype. F-01 and F-02 must be fixed before
`PUBLIC_INDEXING_ENABLED` is ever set to `true`.

## 5. Still not approved

Production publish, indexing, paid traffic, pricing, stock, partner claims and
manufacturer imagery remain blocked pending the Claude Strategic Assessment, the
Compliance Matrix, and ACS commercial-rights documentation.
