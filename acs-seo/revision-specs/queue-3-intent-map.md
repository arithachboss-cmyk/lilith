# Queue #3 — Intent Map for cluster C-1

**Owner decision (binding):** HOLD จนกว่าจะ map intent เสร็จ — **ก่อน 24 ก.ย. 2026**
**Claim row:** CLM-O-004
**This file is the deliverable the HOLD names.** It does not lift the HOLD; one Owner
decision in §5 does that.

---

## 1. Evidence, and its limits

| Evidence | Status |
|---|---|
| The 10 live URLs in C-1 | **FACT** — sitemap of www.asiancoding.com, 20 Sep 2026 |
| Each page's `<title>`, verbatim | **FACT** — fetched 22 Sep 2026 with a non-JS crawler |
| Each page's sitemap `priority` | **FACT** — ACS's own declared priority |
| Which URL currently ranks, and for what | **NOT AVAILABLE** — Ahrefs returned "Insufficient plan", OpenRush "Insufficient credits". No ranking or traffic data was obtained, and none is estimated here. |

The recommendation below rests on declared intent, not on measured performance. §6 names
exactly what would overturn it.

## 2. The finding that changes the problem

C-1 was recorded as "ten URLs competing for one intent". The titles say otherwise.

**Seven of the ten carry a real differentiator in their own title** — brand, environment,
connectivity, use case, symbology, range. Those are legitimate modifier pages. They are not
the problem.

**Three carry no differentiator at all**, and those three are the actual collision:

| URL | Title as served | Priority |
|---|---|---|
| `/barcode-scanners` | `Barcode Scanner Categories \| เครื่องส…` | 0.9 |
| `/barcode-scanner-thailand` | `Barcode Scanner \| เครื่องสแกนบา…` | 0.9 |
| `/เครื่องสแกนบาร์โค้ด` | `เครื่องสแกนบาร์โค้ด \| …` | 0.9 |

So the decision is not "pick one of ten". It is **"pick one of three, and confirm the other
seven stay on their modifier"** — a far smaller decision, and one that can be made by 24 Sep.

## 3. The defect inside the three

`/barcode-scanner-thailand` has the URL of a geo page and the title of a generic one:
the title is **"Barcode Scanner"**, with no Thailand, no geo modifier, nothing. Its URL
promises a market-specific page and its title claims the head term outright. Of the three,
this is the one actively taking the head term while pretending to be something narrower.

The other two are not really rivals — they are the same intent in two languages:
`/barcode-scanners` in English, `/เครื่องสแกนบาร์โค้ด` in Thai. **No hreflang pairing exists
between them** (the sitemap carries none). Two language versions without hreflang are read
as duplicates instead of alternates, which is the mechanism turning a reasonable structure
into a collision.

## 4. Proposed map

| URL | Proposed role | Canonical intent it owns |
|---|---|---|
| `/เครื่องสแกนบาร์โค้ด` | **Head term, Thai** | เครื่องสแกนบาร์โค้ด — generic, Thai market |
| `/barcode-scanners` | **Head term, English** | barcode scanner — generic, English |
| `/barcode-scanner-thailand` | **Thailand buying page** (D-08) | sourcing, support and delivery in Thailand — not the generic head term |
| `/industrial-barcode-scanner` | Modifier — environment | industrial / โรงงาน |
| `/wireless-barcode-scanner` | Modifier — connectivity | wireless / ไร้สาย |
| `/2d-barcode-scanner` | Modifier — symbology | 2D / QR / DataMatrix |
| `/long-range-barcode-scanner` | Modifier — range | long range |
| `/warehouse-barcode-scanner` | Modifier — use case | warehouse / คลังสินค้า |
| `/retail-barcode-scanner` | Modifier — use case | retail / ร้านค้า |
| `/honeywell-barcode-scanner` | Modifier — brand reference | Honeywell (see CLM-O-003: partner claim risk) |

The two head-term pages become **hreflang alternates of each other, not competitors.**
Each modifier page links up to the head term in its own language, and none of them targets
the bare head term in its title or H1.

## 5. The one Owner decision — DECIDED 23 Sep 2026

> **D-08 — the Owner chose Option B**, superseding D-07 (Option A) the same day.
> `/barcode-scanner-thailand` is **kept** and re-scoped into a genuine Thailand buying
> page: it stops targeting the bare head term, self-canonicals, and links up. **No
> redirect.** D-07 was never executed, so nothing had to be rolled back.
>
> Canonical owners are unchanged: `/เครื่องสแกนบาร์โค้ด` (th) and `/barcode-scanners` (en).
> Execution sequence: `queue-3-execution-runbook.md`. **Not executed.**
>
> **B resolves the collision on delivery, not on deploy.** A retitled page with no distinct
> content is still a duplicate. The runbook §6 sets the test and requires a review date.

The options as they were put:

**What happens to `/barcode-scanner-thailand`?** Three options, and only ACS can choose:

| Option | Do this | Cost | When it is right |
|---|---|---|---|
| **A — Redirect (recommended)** | 301 to `/เครื่องสแกนบาร์โค้ด` | Loses the URL; consolidates the signal | Its content duplicates the Thai head-term page |
| **B — Re-scope to geo** | Keep it, rewrite title/H1 as a genuine Thailand buying page (availability, local support, lead times) and canonical the generic intent to the head-term page | Needs real local content | ACS has something market-specific to say |
| **C — Retire** | 410 or remove | Simplest, loses any existing equity | It is thin and duplicative |

**Recommendation was A**, unless ACS could commit to B's content. **The Owner chose B**, so
that commitment is now the critical path — see `queue-3-execution-runbook.md` §4 and §6 for what
that content requires and how to tell whether it arrived. Reason: its title already
concedes it is not a geo page, and two generic pages plus a third undeclared one is the
configuration that produces the collision. Redirecting resolves it today; B resolves it only
if the content is actually written.

**This recommendation is made without ranking data.** If `/barcode-scanner-thailand` turns
out to be the page that actually ranks, A becomes wrong and B becomes right — see §6.

## 6. What would overturn this

Before executing, pull for all three URLs: organic traffic, ranking keywords, and best
position. Then:

- If `/barcode-scanner-thailand` carries materially more traffic than the other two → **B**, and canonical the other way.
- If `/เครื่องสแกนบาร์โค้ด` and `/barcode-scanners` split the same Thai queries → hreflang first, before any redirect.
- If none of the three ranks at all → the rendering gate is the real cause and this whole decision is premature; fix SSR first.

**That last one is live.** Two C-1 pages were fetched without JavaScript and returned only
their `<title>` — no body. A page that serves no content to a crawler cannot rank for
anything, which means today's collision may be theoretical and tomorrow's, once SSR ships,
will be real. Deciding the map now is still correct; executing redirects before SSR is not.

## 7. After the decision — done

1. ~~Record the choice~~ → **D-08** (Option B), superseding D-07, recorded in `data/cannibalization_clusters.json` and `package_status.json`, 23 Sep 2026.
2. ~~Add the canonical owner~~ → `canonical_owner` set for C-1; the other seven clusters remain null by design.
3. ~~New packages run the gate~~ → C-1 intents now return `PROCEED_WITH_CANONICAL` instead of `HOLD`.
4. ~~Queue #3 moves to REVISE~~ → done. It re-enters the normal flow.

Remaining, in order:
- **Retitle the geo page** — needs no new source, resolves the title-level collision today.
- **Write the process-not-state copy** — `queue-3-execution-runbook.md` §5, passes the scanner clean.
- **Set the §6 review date.** Without it B has no failure signal.
- hreflang and sitemap `lastmod` wait on the rendering gate. The two steps above do not.

---

*ที่มา: ยกมาจาก PR #1 (`claude/acs-brady-prototype-brief-fqwxe7`) แล้วปรับ path และรหัส claim/source ให้ตรงกับทะเบียนกลางของแพ็กนี้ เนื้อหาการวิเคราะห์และคำแนะนำไม่ถูกแก้*
