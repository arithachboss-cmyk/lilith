# Queue #3 — Execution Runbook: Option B

**Decision D-08 · 23 September 2026 · supersedes D-07 (Option A)**
Keep `/barcode-scanner-thailand` and re-scope it into a genuine Thailand buying page.
It stops targeting the bare head term, self-canonicals, and links up to the head-term page.
**No redirect.**

**D-07 was never executed, so nothing had to be rolled back.** That is the payoff from the
precondition in the previous runbook: had the 301 shipped on the 23rd, changing to B would
now mean restoring a retired URL and undoing a consolidation.

---

## 0. What changes, and what does not

| | Option A (superseded) | **Option B (chosen)** |
|---|---|---|
| `/barcode-scanner-thailand` | retired by 301 | **kept**, re-scoped |
| Pages surviving in C-1 | 9 | **10** |
| Work required | one redirect + link repointing | **new content that does not exist yet** |
| Resolves the collision | on deploy | **only when the content is written** |

The head-term owners are unchanged: `/เครื่องสแกนบาร์โค้ด` (th) and `/barcode-scanners` (en),
paired by hreflang. The seven modifier pages are unchanged.

## 1. A correction to how B was written

The option said "canonical the generic intent to the head-term page". A canonical tag
points at a **URL**, not an intent. If `/barcode-scanner-thailand` canonicals to the
head-term page, the whole page leaves the index — which is Option A with extra steps, and
throws away the content B exists to create.

**What B actually requires:**

- `/barcode-scanner-thailand` **self-canonicals**. Its content is unique, so it is its own canonical.
- It **stops competing** through its `<title>`, `<h1>` and body copy — not through a tag.
- It **links up** to the head-term page in its language.

If its content ends up substantially duplicating the head-term page anyway, then it has no
independent reason to exist and the correct answer was A. **That is the test in §6.**

## 2. hreflang — the geo page is not an alternate

Only the two head-term pages are alternates of each other. Unchanged from D-07:

| Page | Declares |
|---|---|
| `/เครื่องสแกนบาร์โค้ด` | `th` self · `en` → `/barcode-scanners` · `x-default` → itself |
| `/barcode-scanners` | `en` self · `th` → `/เครื่องสแกนบาร์โค้ด` · `x-default` → `/เครื่องสแกนบาร์โค้ด` |

`/barcode-scanner-thailand` is **not** in that set. An hreflang alternate is the same
content for a different audience; a buying page with availability and lead times is
different content. Adding it as an `en-TH` alternate would reassert the duplication that B
is meant to end.

Absolute URLs, reciprocal, server-rendered — same three rules as before.

## 3. The title and H1 rewrite — the one change that resolves the collision today

Current title, fetched live: **`Barcode Scanner | เครื่องสแกนบา…`** — the URL promises a
geo page, the title claims the bare head term.

| | Banned | Required |
|---|---|---|
| `<title>` | `Barcode Scanner`, `เครื่องสแกนบาร์โค้ด` alone | must carry the buying angle — sourcing, support, delivery in Thailand |
| `<h1>` | any bare head term | same |
| First paragraph | restating what a barcode scanner is | why buying **here** differs |

This step needs **no new source** and resolves the title-level collision on its own. Do it
first, even if §4 takes weeks.

## 4. The content B requires — and what currently blocks it

B's value is "availability, local support, lead times". Every one of those is a claim the
register gates:

| Claim | Row | Blocked by |
|---|---|---|
| Stock / "พร้อมส่ง" / in stock | **CLM-O-009** | ACS stock data, with the date it was true |
| Lead time / "ส่งภายใน X วัน" | **CLM-O-009** | ACS lead-time data, dated |
| "ทีมงานในไทย", nationwide service, on-site response | **CLM-O-010** | ACS confirmation of what support exists and where |
| Any price | CLM-O-001 | SRC-ACS-002 price list |
| Which products | CLM-E-001 / SRC-ACS-001 | ACS product list |

Detect them: `node acs-seo/tools/redact.mjs <draft>` — rules `availability`,
`lead-time`, `local-support`, plus the six price rules.

**An availability claim expires faster than a price.** "มีสต็อก" is true only while the
stock lasts. A published stock state is wrong by default unless it is wired to live data.

## 5. What B can publish today, with zero new sources

This is the point people miss: B is not blocked, it is *narrowed*. Publishable now —
**process, not state**:

| Instead of (blocked) | Publish (safe) |
|---|---|
| "มีสต็อกพร้อมส่ง" | "ความพร้อมของแต่ละรุ่นเปลี่ยนตลอดเวลา เราตรวจสอบสต็อกจริงก่อนยืนยันทุกครั้ง" |
| "ส่งได้ภายใน 3 วัน" | "ระยะเวลาส่งมอบขึ้นกับรุ่นและจำนวน — แจ้งกำหนดจริงพร้อมการยืนยันคำสั่งซื้อ" |
| "ช่างถึงหน้างานภายใน 24 ชม." | "ขอบเขตการเข้าหน้างานขึ้นกับพื้นที่และข้อตกลงบริการ — ระบุได้ตอนกำหนดขอบเขตงาน" |
| "ราคาเริ่มต้นที่ X บาท" | "ต้นทุนรวมขึ้นกับรุ่น จำนวนจุดใช้งาน และงานติดตั้ง — ขอใบเสนอราคาตามขอบเขตจริงได้" |

The last fixture paragraph in `tools/fixtures/geo-page-draft.md` is written this way and
returns **zero findings**. A page built entirely from that column plus §3's retitle is a
real Thailand buying page, publishable without one new document.

## 6. The test B has to pass — set a date now

**B only resolves the collision when the content is written.** A retitled page with no
distinct content is still a duplicate; it just has a better title. Option A resolved on
deploy; B resolves on delivery.

**วันที่ตั้งไว้แล้ว (Owner สั่ง "เร็วที่สุด" เมื่อ 2026-09-23):**

| วัน | คำถาม | ทำไมวันนี้ |
|---|---|---|
| **2026-09-26** | เปลี่ยน title/H1 ให้เลิกอ้าง head term เปล่า ๆ และเขียนเนื้อหาแบบกระบวนการแล้วหรือยัง | งานสองอย่างนี้ไม่ต้องใช้ source ใหม่เลย จึงเป็นวันที่เร็วที่สุดที่ตอบได้จริง |
| **2026-10-23** | **หน้านี้พูดอะไรที่หน้าหลักไม่พูดหรือเปล่า** | เร็วกว่านี้ไม่ได้ เพราะเนื้อหาที่ทำให้ต่างทั้งหมดรอข้อมูล ACS ที่ยังไม่มีกำหนดส่ง — ถ้าข้อมูลมาก่อน เลื่อนขึ้นได้ทันที |

At that date, one question: **does this page say anything the head-term
page does not?**

- Yes → B worked. Keep it.
- No → B did not happen. Revert to A and redirect.

Without that date the default outcome is silence: the page stays generic, the collision
persists, and nobody notices because a decision was recorded.

## 7. Sequencing against the rendering gate

Less blocking than under A. The gate matters for what search engines see, not for whether
the work is sound.

| Step | Wait for SSR? |
|---|---|
| §3 retitle | **No.** Do it now. |
| §5 safe content | **No.** Do it now. |
| §2 hreflang | **Yes** — tags that appear only after hydration are not read. |
| Sitemap `lastmod` | **Yes** |
| §4 gated content | No — blocked by sources, not by rendering |

## 8. Verification

| Check | Pass condition |
|---|---|
| `<title>` and `<h1>` | carry the buying angle; no bare head term |
| Canonical | self-canonical, **not** pointing at the head-term page |
| hreflang | only the two head-term pages pair; the geo page is absent from that set |
| Link up | geo page links to the head-term page in its language |
| `redact.mjs <draft>` | zero CLM-O-009 / CLM-O-010 / CLM-O-001 findings without an evidence record |
| `validate.mjs "เครื่องสแกนบาร์โค้ด"` | `PROCEED_WITH_CANONICAL` |
| §6 distinctness test | the page says something the head-term page does not |

Then set `decision.executed = true` in `data/cannibalization_clusters.json`.

## 9. Out of scope

Unchanged from D-07: the other seven clusters have no canonical owner and hold by default;
C-2, C-3 and C-5 are next in severity. `/honeywell-barcode-scanner` still sits under CLM-O-003
and keeps the word *Reference* in its title until vendor authorisation exists.

---

*ที่มา: ยกมาจาก PR #1 (`claude/acs-brady-prototype-brief-fqwxe7`) แล้วปรับ path และรหัส claim/source ให้ตรงกับทะเบียนกลางของแพ็กนี้ เนื้อหาการวิเคราะห์และคำแนะนำไม่ถูกแก้*
