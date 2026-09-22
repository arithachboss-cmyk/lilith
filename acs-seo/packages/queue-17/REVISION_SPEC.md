# Queue #17 — Revision Spec: ranking → decision criteria

**Owner decision (binding):** ใช้เกณฑ์ตัดสินใจ ห้ามจัดอันดับว่ายี่ห้อไหนดีสุด
**Claim rows:** CR-04 (ranking = BLOCKED; criteria = SAFE_WORDING)
**State:** `REVISE` — spec ready, **the draft article was not supplied to this session**, so this
spec is written to be applied to it. Nothing below invents ACS content.

---

## 1. What must be removed

Delete any sentence that does any of these, in Thai or English:

| Pattern | Example of the banned form |
|---|---|
| Names a winner | "ยี่ห้อ X ดีที่สุด", "X is the best scanner" |
| Orders brands | "อันดับ 1 … อันดับ 2 …", "Top 5 brands ranked" |
| Implied winner | "แนะนำ X มากที่สุด", "our top pick", "ตัวเลือกที่คุ้มที่สุด" |
| Brand-vs-brand verdict | "X ดีกว่า Y", "X outperforms Y" |
| Star / score table | any per-brand rating, score, or ★ column |

A "winner" softened to "น่าจะเหมาะที่สุด" is still a winner. Soften-and-keep is not a fix.

## 2. What replaces it — the criteria frame (SAFE_WORDING)

Replace the ranking with a decision framework: **the reader ranks, not ACS.** Each criterion
is stated as a question the buyer answers about their own site, with no brand attached.

| # | Criterion | The question the buyer answers | Why it decides |
|---|---|---|---|
| 1 | Symbology | อ่าน 1D อย่างเดียว หรือต้องอ่าน 2D / QR / DataMatrix ด้วย | 1D laser cannot read 2D at all — this rules options in or out before anything else |
| 2 | Reading surface | อ่านจากฉลากกระดาษ หรือจากหน้าจอมือถือ / ชิ้นงานโลหะ | screen and direct-part marks need an imager, not a laser |
| 3 | Read distance | ระยะอ่านปกติกี่เซนติเมตรหรือกี่เมตร | decides between a standard-range and an extended-range engine |
| 4 | Environment | ฝุ่น น้ำ อุณหภูมิ การตกกระแทก ความสูงที่ตกได้ | maps to an IP rating and a drop spec — both are vendor-published numbers, quote them from the datasheet only |
| 5 | Duty cycle | สแกนกี่ครั้งต่อกะ ต่อเนื่องหรือเป็นช่วง | decides ergonomics, trigger type, and battery sizing |
| 6 | Connectivity | มีสาย หรือไร้สาย และต้องเดินไกลจากฐานแค่ไหน | cable is simpler and cheaper; wireless buys range and costs charging discipline |
| 7 | System fit | ต่อกับ WMS / ERP / POS ตัวไหน ต้องการ SDK หรือ keyboard-wedge | a scanner that cannot talk to the system of record is the wrong scanner regardless of spec |
| 8 | Service | อะไหล่ การซ่อม และระยะเวลาที่ต้องใช้งานอุปกรณ์นี้ | a three-year deployment and a one-year support horizon do not match |

**Output shape:** a decision table whose rows are the criteria above and whose columns are
*capability classes* ("2D imager", "extended-range", "rugged") — **never brand names**.

## 3. Allowed vs banned wording

| Banned | Allowed replacement |
|---|---|
| "ยี่ห้อ X ดีที่สุดสำหรับคลังสินค้า" | "งานคลังสินค้าที่ต้องอ่านระยะไกลและกันตกได้ ควรเลือกเครื่องกลุ่ม extended-range ที่มีสเปกกันตกระบุไว้" |
| "X ดีกว่า Y" | "เกณฑ์ที่ทำให้สองรุ่นนี้ต่างกันคือระยะอ่านและระดับกันฝุ่นกันน้ำ — ให้เทียบจากสเปกของผู้ผลิตแต่ละราย" |
| "คุ้มค่าที่สุด" | "ต้นทุนรวมควรนับรวมอะไหล่ แบตเตอรี่ และระยะเวลาที่ต้องใช้งาน ไม่ใช่ราคาเครื่องอย่างเดียว" |
| any per-brand score | the criteria table, with the buyer filling in their own answers |

## 4. Brand names — when they may still appear

A brand may be named **only** as a factual pointer, never as a judgement:
- allowed: "ผู้ผลิตแต่ละรายเผยแพร่สเปกระยะอ่านและระดับ IP ไว้ในดาต้าชีตของรุ่นนั้น"
- allowed: linking to a vendor's own datasheet as a source
- banned: any adjective of quality attached to a brand
- any specification quoted from a vendor is **CR-07 EVIDENCE_REQUIRED** — cite the datasheet
  URI and revision in `audit.json`, or do not quote it

## 5. Done when

- [ ] Zero sentences matching §1
- [ ] Criteria table present, columns are capability classes not brands
- [ ] Every remaining number traces to a cited vendor datasheet (CR-07) or is deleted
- [ ] Tier 0 mechanical check passes, incl. forbidden-words list
- [ ] Tier 2B CLAIM QA on every sentence naming a brand
- [ ] `package_status.json` still `DRAFT_PENDING_REVIEW`; rendering gate still uncleared
