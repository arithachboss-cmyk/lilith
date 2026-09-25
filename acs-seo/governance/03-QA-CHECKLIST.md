# QA Checklist ที่ใช้ซ้ำได้ (QA แบบประหยัด)

หลักการ: **ตรวจด้วยเครื่องทุกแพ็กเกจ ตรวจด้วยคนเฉพาะจุดที่เครื่องชี้**
ไม่ต้อง full QA ซ้ำทุกแพ็กเกจ — ใช้ระดับ QA ตามที่ validator คำนวณให้

```sh
node acs-seo/tools/validate.mjs                 # ตรวจทุกแพ็กเกจใน content-packages/
node acs-seo/tools/validate.mjs --changed-only  # ข้ามแพ็กเกจที่ไม่เปลี่ยนและเคย PASS
node acs-seo/tools/validate.mjs --json          # ให้เครื่องอื่นอ่านต่อ
node acs-seo/tools/validate.mjs --board         # ดู status board
node acs-seo/tools/redact.mjs <ดราฟต์>          # รายงานข้อความที่ Claim Register ห้าม
node acs-seo/tools/redact.mjs <ดราฟต์> --fix    # ปิดข้อความ BLOCK โดยทิ้ง marker ไว้ให้เห็น
node acs-seo/tools/evidence-check.mjs <แพ็กเกจ>  # หลักฐานครบไหม ราคาหมดอายุหรือยัง
node acs-seo/tools/selftest.mjs                 # ตรวจว่าระบบยังทำงานจริง (120 ข้อ)
```

---

## T0 — Mechanical check (ทุกแพ็กเกจ ไม่มีข้อยกเว้น, อัตโนมัติ)

ทำโดย `tools/validate.mjs` ไม่ต้องใช้คน

- [ ] ครบ 7 ไฟล์: `article.md` `meta.json` `schema.jsonld` `audit.json` `claim_register.md` `brief.md` `package_status.json`
- [ ] ไม่มี `{{placeholder}}` ค้าง
- [ ] **Metadata** — title 30–60 ตัวอักษร, meta_description 70–160 ตัวอักษร, มี canonical / target_url / page_type / canonical_intent / primary_keyword / intent / action, URL ขึ้นต้นด้วย `https://www.asiancoding.com`
- [ ] **Internal links** — ทุกลิงก์ต้องมีอยู่จริงใน page inventory
- [ ] **Sitemap** — `target_url` ต้องอยู่ใน sitemap ปัจจุบัน (82 URL ที่ดึงจริงแล้ว)
- [ ] **Cannibalization** — `target_url` ต้องไม่ตกอยู่ใน cluster ที่ยังไม่มี `canonical_owner`
- [ ] **Schema** — JSON ถูกต้อง, มี `@context`/`@type`, `name` และ `url` ตรงกับ `meta.json`, ไม่มี `offers`/`price`/`aggregateRating`/`review` ถ้าไม่มีหลักฐาน ACS
- [ ] **Forbidden words** — ไม่มีคำ BLOCK, คำ EVIDENCE/OWNER ต้องมีหลักฐานรองรับใน `audit.json`
- [ ] **ความสอดคล้องสถานะ** — `package_status = DRAFT_PENDING_REVIEW`, `publish_allowed = false`, `robots` มี `noindex` ตราบที่ rendering gate ยังไม่ผ่าน
- [ ] **claim ID** — ทุก ID ที่อ้างถึงมีอยู่จริงใน `data/claims.json`
- [ ] **หลักฐานครบ** — ทุก claim ที่เป็น EVIDENCE_REQUIRED / OWNER_REQUIRED ต้องมี `source_locator` และ source ที่ `SUPPLIED`
- [ ] **ราคายังไม่หมดอายุ** — `price_evidence.json` ทุกรายการต้องมี `valid_until` ที่ยังไม่ผ่าน และข้อความที่ผู้อ่านเห็นต้องพา `effective_date` ไปด้วย

ถ้า source ที่ใช้ตรวจยังไม่มา validator จะรายงาน `BLOCKED_ON_SOURCE` — **ห้ามตีความว่าผ่าน**

### ต้องรันตามกำหนดเวลา ไม่ใช่แค่ตอนแก้ไฟล์

`evidence-check.mjs` ต้องรันเป็นรอบ (เช่นสัปดาห์ละครั้ง) แม้ไม่มีใครแตะไฟล์เลย
เพราะราคาหมดอายุด้วยตัวมันเองตามเวลา ไม่ได้หมดอายุเพราะมีคนแก้ไฟล์
ระบบจะเตือนล่วงหน้า 30 วันก่อนถึงวันหมดอายุ

---

## หน้าที่ไม่เผยแพร่สาธารณะ (`visibility: PRIVATE`)

ตั้ง `meta.visibility = "PRIVATE"` พร้อม `access_control` และ `audience` แล้วระบบจะ **ข้าม gate ที่เป็นเรื่อง SEO ล้วน ๆ** ให้อัตโนมัติ

| ข้าม | ยังบังคับ |
|---|---|
| sitemap · internal links · cannibalization · rendering gate | **การตรวจ claim ทุกข้อ** |

**เหตุผลที่ข้ามได้:** หน้าที่ไม่ถูก index ไม่มีปัญหาการชนกันของ intent ไม่ต้องอยู่ใน sitemap และไม่ต้องรอ SSR

**เหตุผลที่ไม่ข้าม claim:** การจำกัดผู้เข้าถึงไม่ได้ทำให้ข้อความที่ไม่มีหลักฐานกลายเป็นข้อความที่มีหลักฐาน และในเอกสารที่ใช้ประกอบการตัดสินใจซื้อ ข้อความที่ผิดมีน้ำหนักมากกว่าบนหน้าเว็บทั่วไป ไม่ใช่น้อยกว่า
- **ชื่อลูกค้า** — ข้อห้ามอ้างอิงชื่อคู่สัญญาครอบคลุมการเปิดเผยต่อบุคคลที่สาม ไม่ได้ยกเว้นเพราะกลุ่มผู้รับเล็กลง และการบอกชื่อลูกค้ากับผู้ซื้อรายอื่นในอุตสาหกรรมเดียวกัน คือบริบทที่ลูกค้ามีแนวโน้มคัดค้านมากที่สุด
- **สถานะพาร์ทเนอร์** — กลายเป็นข้อมูลที่ผู้ซื้อใช้ตัดสินใจจ่ายเงิน
- **ซูเปอร์ลาทีฟ** — ผู้ซื้อรายใหญ่คือคนที่มีเหตุให้ร้องเรียนมากที่สุดหากพบภายหลังว่าไม่จริง

`PRIVATE` ต้องคง `noindex` เสมอ — ถ้า index ได้ก็ไม่ใช่หน้าส่วนตัวอีกต่อไป และ `access_control` ต้องบังคับที่ระดับ server ไม่ใช่การซ่อนลิงก์

---

## T1 — Claim QA (เฉพาะ claim ที่ถูก flag)

ทำโดยคน เฉพาะบรรทัดที่ validator ชี้ ไม่ต้องอ่านบทความทั้งหน้า

- [ ] ทุก `EVIDENCE_MISSING` มี source จริงแล้วหรือยัง — ถ้ามี ให้ลง `audit.json` พร้อม `source_locator` ระบุหน้า/หัวข้อ
- [ ] ทุก `OWNER_CONFIRM_MISSING` ได้รับการยืนยันจาก ACS แล้วหรือยัง — ต้อง `owner_confirmed: true`
- [ ] ทุก `FORBIDDEN_BLOCK` ถูกลบหรือลดระดับคำแล้ว และบันทึกการลบใน `claim_register.md`
      — ใช้ `tools/redact.mjs --fix` ปิดให้ก่อน แล้วคนเขียนเรียบเรียงประโยคที่มี marker `⟦ลบ …⟧` ใหม่
      — ห้ามแทนตัวเลขด้วยคำคลุมเครือ ("ดีขึ้นมาก" คือ claim เดิมที่ลบหลักฐานทิ้ง) ให้แทนด้วย **กลไก** ตาม `revision-specs/`
- [ ] ข้อความที่เหลือไม่ได้ "เลี่ยงคำ" แต่ยังสื่อความหมายเดิม (เช่น เปลี่ยนจาก "ทนทุกสภาพแวดล้อม" เป็น "ทนได้ตามเงื่อนไขที่ระบุในเอกสารผู้ผลิต")

---

## T2 — Full QA (เฉพาะกรณีที่เข้าเงื่อนไข)

ทำ full QA เมื่อเข้าข้อใดข้อหนึ่ง — validator ตั้ง `tier = T2_FULL` ให้อัตโนมัติ

- หน้า **P0** (`p0: true` ใน `package_status.json`)
- **หน้าใหม่** (`action = NEW`)
- มี **ตัวเลข / ราคา / performance / customer claim** ในเนื้อหา (มี EVIDENCE หรือ OWNER flag ≥ 1)
- **หน้าปลายทางถือ risk flag** อย่างใดอย่างหนึ่งใน page inventory: `SPEC` `NUMBERS` `PRICE` `CUSTOMER` `RANKING` `PARTNER` `OWNER` `EVIDENCE`
  — ข้อนี้ทำให้หน้าเดิมที่มีความเสี่ยงอยู่แล้วถูกยกระดับ QA อัตโนมัติ โดยไม่ต้องรอให้คนสังเกตเอง

รายการตรวจ:
- [ ] ผ่าน T0 และ T1 ครบ
- [ ] `brief.md` ระบุ canonical intent ชัด และผ่าน cannibalization gate แล้ว
- [ ] อ่านบทความทั้งหน้า ตรวจว่าไม่มี claim ที่ไม่ได้ขึ้นทะเบียนแฝงอยู่
- [ ] schema สะท้อนสิ่งที่อยู่บนหน้าเว็บจริง ไม่มี property ที่หน้าเว็บไม่มี
- [ ] internal link ไปหาหน้าที่ intent ต่างกันจริง ไม่ดึง traffic ทับกันเอง
- [ ] Owner เห็นและลงชื่อใน `package_status.json`

---

## WORDING_QA_OK

ใช้ได้เมื่อ **ทั้งสองข้อเป็นจริง**: เป็นบทความหลักการทั่วไป และ **ไม่มี flagged claim เลย**

- สถานะนี้แปลว่า "ภาษาผ่าน" เท่านั้น
- **ยังไม่ publish** จนกว่า technical rendering gate จะผ่าน
- `package_status` ยังคงเป็น `DRAFT_PENDING_REVIEW`

---

## เงื่อนไขก่อน publish (ต้องครบทุกข้อ ไม่มีข้อยกเว้น)

- [ ] `gates.mechanical = PASS`
- [ ] `gates.claim_qa = PASS`
- [ ] `gates.cannibalization = PASS`
- [ ] `GATE-RENDER = PASS` (ดู `06-RENDERING-GATE.md`)
- [ ] `gates.owner_approval = GRANTED`

ห้าม publish, deploy, เปลี่ยน DNS, เปิด traffic หรือใช้ real claims ก่อนครบทุกข้อ
