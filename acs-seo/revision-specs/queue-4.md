# Queue #4 — Revision Spec: material and environment wording

**Owner decision (binding):** REVISE wording เรื่องวัสดุและสภาพแวดล้อม — **ห้ามฟันธงถ้าไม่มี datasheet สินค้าจริง**
**Claim rows:** CLM-E-004 (EVIDENCE_REQUIRED), CLM-E-001 (vendor specification)
**State:** `REVISE`, and it **cannot reach PASS in this session.** Unlike #17 and #21, this
package's blocker is a source that does not exist yet: SRC-VEN-001, the vendor datasheets.
Everything that does not depend on them is done below.

---

## 1. Why this one is different

#21 is a deletion and #17 is a rewrite — both are finishable by a writer alone. #4 is
neither. The sentences are not wrong because of *how* they are phrased; they are
unverified because nobody has checked them against the datasheet of a product ACS
actually sells. Rewriting them without that check produces wording that *sounds* careful
and is still unevidenced.

So this spec does two things: it makes the unevidenced sentences **conditional now**, and
it makes the evidence **mechanically checkable** when the datasheets arrive.

## 2. Find them

```sh
node acs-seo/tools/redact.mjs <draft-dir> --strict
```

Rules `material-certainty`, `environment-certainty` and `absolute-scope` flag every
definitive assertion in Thai and English. `--strict` makes them fail the run; the default
gate lets them through because elsewhere they are a review item, not a hard block.

**Nothing here is auto-fixed.** A material claim is not repaired by deleting a word — it
is repaired by narrowing it to what a source states, or by replacing it with the mechanism.

## 3. The rewrite rule

Every flagged sentence takes one of three forms. There is no fourth.

| Form | When | Shape |
|---|---|---|
| **A — Mechanism** | No datasheet, and the point is general | State how the physics works, not how this product performs. Always publishable. |
| **B — Conditional, sourced** | Datasheet exists for a product ACS sells | State the value **with the conditions it was measured under**, and cite the document. |
| **C — Deleted** | No datasheet, and the sentence's only content was the assertion | Remove it. |

### Banned → approved

| Banned (ฟันธง) | Approved — Form A (no datasheet) | Approved — Form B (with datasheet) |
|---|---|---|
| "ฉลากรุ่นนี้ทนความร้อนได้" | "ความทนความร้อนของฉลากขึ้นกับวัสดุหน้าฉลาก กาว และริบบอนที่ใช้ร่วมกัน ค่าที่ใช้งานได้จริงระบุไว้ในดาต้าชีตของรุ่นนั้น" | "บนพื้นผิวอะลูมิเนียมเรียบ ผู้ผลิตระบุอุณหภูมิใช้งานต่อเนื่อง X องศา ทดสอบแบบความร้อนแห้ง Y ชั่วโมง (ดาต้าชีต … Rev …)" |
| "กันน้ำ / waterproof" | "การกันน้ำขึ้นกับทั้งวัสดุและกาว รวมถึงว่าติดบนพื้นผิวแบบใด" | "ผู้ผลิตระบุการทดสอบการแช่น้ำที่ … เป็นเวลา … บนพื้นผิว … (ดาต้าชีต …)" |
| "ใช้กลางแจ้งได้" | "งานกลางแจ้งต้องพิจารณาทั้งแสงยูวี อุณหภูมิที่เปลี่ยนไปมา และน้ำฝน ซึ่งเป็นคนละเงื่อนไขกัน" | "ผู้ผลิตระบุอายุใช้งานกลางแจ้ง … ปี ภายใต้เงื่อนไขการทดสอบ … (ดาต้าชีต …)" |
| "ไม่ซีด ไม่หลุดลอก" | "การซีดและการหลุดลอกเป็นคนละกลไกกัน: การซีดมาจากยูวีและสารเคมี ส่วนการหลุดลอกมาจากกาวกับพื้นผิว" | — quote only what the source measured, never both at once unless it measured both |
| "เหมาะสำหรับทุกสภาพแวดล้อม" | **ไม่มีรูปแบบที่อนุญาต** — ขอบเขตนี้กว้างเกินกว่าดาต้าชีตใดจะรองรับ ต้องแคบลงเป็นเงื่อนไขที่ระบุได้ | — |

## 4. The condition trap — the actual failure mode

A datasheet value is true **under the conditions it was measured**. Quoting the number and
dropping the conditions turns evidence into a false claim, and it passes a naive review
because there *is* a source.

- 150 °C measured under **dry heat** does not license a claim about **steam**.
- A value on **flat anodised aluminium** does not license **textured painted steel**.
- "500 h" is not "ตลอดอายุการใช้งาน".

`templates/package/datasheet_evidence.json` therefore makes `measured_conditions` mandatory, and
`tools/evidence-check.mjs` fails any record that quotes a figure without them.

## 5. Evidence intake — do this when the datasheets arrive

1. Copy `templates/package/datasheet_evidence.json` to `packages/queue-4/<claim>-evidence.json`, one per flagged sentence.
2. Fill `product` from the **ACS product list (SRC-ACS-001)**. A datasheet for a product ACS does not sell evidences nothing.
3. Fill `source` and `measured_conditions` from the datasheet, verbatim.
4. Write `approved_wording_th` / `approved_wording_en` in Form B, carrying the conditions.
5. Verify: `node acs-seo/tools/evidence-check.mjs packages/queue-4` must exit 0.
6. Mirror each row into the package's `claim_register.md` and `audit.json`.

## 6. Done when

- [ ] `node acs-seo/tools/redact.mjs <draft>` exits 0 และ `node acs-seo/tools/evidence-check.mjs <package-dir>` exits 0
- [ ] Every flagged sentence is Form A, Form B, or deleted — none left definitive-and-unsourced
- [ ] `evidence-check.mjs packages/queue-4` exits 0
- [ ] Every Form B sentence carries its measured conditions in the visible copy, not only in the audit file
- [ ] Tier 0 mechanical check passes; Tier 2B CLAIM QA run on every CLM-E-004 and CLM-E-001 sentence
- [ ] `package_status.json` still `DRAFT_PENDING_REVIEW`; rendering gate still uncleared

## 7. Blocked on — the one remaining input

**SRC-VEN-001, vendor datasheets** (Brady / Honeywell / TSC), paired with **SRC-ACS-001, the ACS
product list** so each datasheet maps to something ACS actually sells. Without both, every
flagged sentence must take Form A or be deleted. That is a publishable outcome — it is not
a reason to wait.

---

*ที่มา: spec นี้ยกมาจาก PR #1 (`claude/acs-brady-prototype-brief-fqwxe7`) แล้วปรับ path และรหัส claim/source ให้ตรงกับทะเบียนกลางของแพ็กนี้ เนื้อหาคำแนะนำไม่ถูกแก้*
