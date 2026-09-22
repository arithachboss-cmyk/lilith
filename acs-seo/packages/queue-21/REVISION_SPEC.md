# Queue #21 — Revision Spec: delete unevidenced performance figures

**Owner decision (binding):** ลบตัวเลขระยะอ่าน / ความเร็ว / ความแม่นยำ **65–70% → 95%+** จนกว่าจะมีหลักฐาน
**Claim rows:** CR-02 (BLOCKED), CR-09 (ROI figures, BLOCKED)
**State:** `REVISE` — **the draft article was not supplied to this session.** This spec plus
`../../tools/claim-scan.mjs` apply the decision to it mechanically. Nothing here invents
ACS content.

---

## 1. Apply it

```sh
node acs-seo/tools/claim-scan.mjs <draft-dir> --fix
```

Every BLOCKED figure is replaced in place with `⟦ลบตัวเลข CR-02 — รอหลักฐาน⟧`. The marker
is deliberate: a silent deletion leaves a sentence that reads as though a number belonged
there, and nobody notices the hole. A writer then rewrites each marked sentence per §3.

Re-running is safe — a redacted line is skipped, so the pass is idempotent.

## 2. What gets deleted

| Kind | Example from the decision | Rule id |
|---|---|---|
| Before→after improvement | `65–70% เป็น 95%+` | `pct-range-improvement` |
| Any bare percentage | `40%`, `99%` | `pct-any` |
| Read range | `ระยะอ่านได้ไกลถึง 12 เมตร`, `read range up to 15 m` | `read-range` |
| Print / scan speed | `8 ips`, `200 มม./วินาที` | `speed` |
| Accuracy | `ความแม่นยำ 95%`, `accuracy improves to 99%` | `accuracy` |
| Time or cost saving | `ลดเวลาการตรวจนับ 40%` | `time-saving` |

Prices (CR-03) and brand rankings (CR-04) are **reported, not auto-deleted** — a price
needs the Owner's price list with an effective date, and a ranking needs the rewrite in
`../queue-17/REVISION_SPEC.md`. Neither is fixed by removing a number.

## 3. What replaces a deleted figure

A number is replaced by the **mechanism**, not by a vaguer number. "ดีขึ้นมาก" is the same
claim with the evidence filed off, and is not an improvement.

| Deleted | Banned replacement | Approved replacement |
|---|---|---|
| "เพิ่มความแม่นยำจาก 65–70% เป็น 95%+" | "เพิ่มความแม่นยำอย่างมาก" | "การสแกนที่จุดรับและจุดหยิบแทนการคีย์ซ้ำ ตัดขั้นตอนที่ข้อมูลคลาดเคลื่อนได้บ่อยที่สุดออกไป ส่วนผลลัพธ์เชิงตัวเลขขึ้นกับหน้างานและต้องวัดจากไซต์จริง" |
| "ระยะอ่านได้ไกลถึง 12 เมตร" | "อ่านได้ไกล" | "ระยะอ่านต่างกันตามชนิดหัวอ่านและสภาพฉลาก ให้อ้างอิงสเปกของรุ่นนั้นจากดาต้าชีตผู้ผลิต" |
| "พิมพ์เร็ว 8 ips" | "พิมพ์เร็ว" | "ความเร็วพิมพ์ระบุไว้ในดาต้าชีตของแต่ละรุ่น และเปลี่ยนตามความละเอียดและวัสดุที่ใช้" |
| "ลดเวลาตรวจนับ 40%" | "ลดเวลาได้เยอะ" | "เวลาที่ใช้ตรวจนับลดลงได้เมื่อจำนวนครั้งที่ต้องคีย์ข้อมูลซ้ำลดลง ปริมาณที่ลดได้ต้องวัดจากกระบวนการจริงของแต่ละไซต์" |

Rule of thumb: if the sentence still tells the reader something true about **how the
technology behaves**, it survives. If its only content was the number, delete the sentence.

## 4. When the figures may come back

A CR-02 figure returns only when `audit.json` carries, for that exact figure:
the source URI, the document and revision, the date checked, and the reviewer —
and the wording stays inside what the source states. A datasheet value measured
at 23 °C does not license a claim about a freezer.

Rewording is not a route back. `65–70% → 95%+` phrased as "เกือบสองเท่า" is the same
blocked claim.

## 5. Done when

- [ ] `node acs-seo/tools/claim-scan.mjs <draft> ` exits 0 (zero BLOCKED findings)
- [ ] No `⟦ลบตัวเลข⟧` marker remains — every marked sentence has been rewritten per §3
- [ ] Every surviving number has a CLEARED row in the package's `claim_register.md`
- [ ] Tier 0 mechanical check passes
- [ ] `package_status.json` still `DRAFT_PENDING_REVIEW`; rendering gate still uncleared
