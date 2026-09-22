# Shared Revision Spec — price claims (Queue #16 and #18)

**Owner decision (binding):** ห้ามใส่ราคาเฉพาะเจาะจงถ้าไม่มีราคา ACS **พร้อมวันที่**
**Claim row:** CLM-O-001 (OWNER_REQUIRED)
**Applies to:** Queue #16 and Queue #18 — the board records #18 as the same decision as
#16, and no draft for either reached this session, so no difference between them is
assumed or invented. One spec, two `package_status.json` files.
**State:** both `REVISE`. Neither can reach PASS here: the blocker is SRC-ACS-002, the ACS
price list. Everything not depending on it is done below.

---

## 1. Read the decision precisely

It is **not** "never publish a price". It is: no price **without an ACS price and a date**.

That second half is the part that gets lost. A price published with no expiry does not
stay correct — it rots on a live page while still looking sourced, and a reader who
quotes it back is right to be annoyed. The live site already carries
`/barcode-scanner-price-guide`, which is exactly where this fails quietly.

So the rule has three parts, and all three are enforced mechanically:

1. The figure comes from an ACS document, not a vendor page.
2. It carries an **effective date**, visible to the reader.
3. It carries a **valid_until**, and something fails when that date passes.

## 2. Find them

```sh
node acs-seo/tools/redact.mjs <draft-dir>
```

Six rules report CLM-O-001. They cover more than a currency figure, because a price claim
does not need a number:

| Rule | Catches | Example |
|---|---|---|
| `price` | explicit amounts | `฿12,900`, `ราคาเริ่มต้นที่ 18,500`, `Prices from ฿9,900` |
| `price-range` | ranges | `15,000–25,000 บาท` |
| `price-in-words` | amounts spelled out | `สามหมื่นบาท` |
| `price-relative` | comparative price claims | `ราคาถูกกว่าคู่แข่ง`, `คุ้มค่ากว่า`, `affordable`, `pricing is competitive` |
| `price-promo` | discounts, offers, financing | `ราคาพิเศษ`, `ส่วนลด`, `ผ่อน 0% นาน 10 เดือน`, `special offer` |
| `price-scope` | VAT / installation / shipping scope | `รวม VAT`, `excl. VAT` |

**A comparative price claim is a price claim.** "ถูกกว่าคู่แข่ง" needs both sides priced
and dated, which is harder to evidence than a plain figure, not easier. If ACS cannot
produce both, the sentence is deleted — softening it to "คุ้มค่า" is the same claim.

## 3. The three permitted forms

| Form | When | Shape |
|---|---|---|
| **A — No price** | Default. No SRC-ACS-002 entry for this item | Describe what drives cost, never a figure: "ต้นทุนรวมขึ้นกับจำนวนจุดสแกน อุปกรณ์ที่เลือก และงานติดตั้ง — ขอใบเสนอราคาตามขอบเขตงานจริงได้" |
| **B — Priced, dated, scoped** | SRC-ACS-002 entry exists | "ราคา 18,500 บาทต่อเครื่อง ยังไม่รวม VAT (ราคา ณ วันที่ 2026-09-01)" |
| **C — Deleted** | The sentence's only content was the price claim | Remove it |

Form A is publishable **today**, with no price list at all. It is also the better page:
a quote request converts, a stale figure does not.

### Scope is part of the price

`18,500` means nothing until it says per what. Every Form B sentence states unit, VAT
treatment, and any minimum quantity. A figure without them is not a cheaper version of a
price — it is an ambiguous one, and the reader resolves the ambiguity in their favour.

## 4. Evidence intake

1. Copy `templates/package/price_evidence.json` to `packages/queue-16/<item>-price-evidence.json` (or `queue-18/`), one per published figure.
2. Fill `price` — amount, currency, **unit**, `includes_vat`, minimum quantity.
3. Fill `validity` — `effective_date` **and** `valid_until`. Both mandatory.
4. Fill `source` — the ACS price list document and `issued_by`. A vendor page is not an ACS price.
5. Write `approved_wording_th` / `approved_wording_en` **carrying the effective date in the visible text**.
6. Verify: `node acs-seo/tools/evidence-check.mjs acs-seo/packages/queue-16` exits 0.

## 5. The expiry mechanism

`evidence-check.mjs` treats a price record's validity window as a hard gate:

- `valid_until` missing → **fail**
- `valid_until` in the past → **fail**, with how many days it has been stale
- `valid_until` within 30 days → **warning**, so the re-check is scheduled before it bites
- `effective_date` in the future, or after `valid_until` → **fail**
- effective date absent from the approved wording → **fail** (the date has to reach the reader, not sit in a JSON file)

Run it on a schedule, not only at authoring time — that is the whole point. A price that
was correct in September fails the September check and the January one differently, and
only the scheduled run catches the second.

```sh
node acs-seo/tools/evidence-check.mjs acs-seo/packages --as-of 2027-01-15
```

## 6. Done when

- [ ] `node acs-seo/tools/redact.mjs <draft>` ไม่เหลือ CLM-O-001 ที่ไม่มี price_evidence.json รองรับ
- [ ] Every remaining price sentence is Form A, Form B, or deleted
- [ ] `evidence-check.mjs packages/queue-16 packages/queue-18` exits 0
- [ ] Every Form B sentence shows its effective date in the visible copy
- [ ] A recurring expiry check is scheduled — otherwise the gate only ever runs once
- [ ] Both `package_status.json` still `DRAFT_PENDING_REVIEW`; rendering gate still uncleared

## 7. Blocked on

**SRC-ACS-002, the ACS price list with effective dates.** Without it every flagged sentence
takes Form A or is deleted — which is publishable now. Waiting is a choice.

There is a second decision hiding here that belongs to the Owner, not to QA: whether
`/barcode-scanner-price-guide` should carry figures at all, or become a quote-request
page. A price guide is the highest-maintenance page type on a site, and this one is
currently unevidenced.

---

*ที่มา: spec นี้ยกมาจาก PR #1 (`claude/acs-brady-prototype-brief-fqwxe7`) แล้วปรับ path และรหัส claim/source ให้ตรงกับทะเบียนกลางของแพ็กนี้ เนื้อหาคำแนะนำไม่ถูกแก้*
