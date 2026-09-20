# ACS SEO Package Factory — Governance Scope

ระบบกำกับการผลิต SEO content package ของ ACS ให้ตรวจย้อนกลับได้ ลด QA ซ้ำ และกัน claim ที่ไม่มีหลักฐานออกไปตั้งแต่ต้นทาง

> **กติกาสูงสุด:** ทุกแพ็กเกจอยู่ในสถานะ `DRAFT_PENDING_REVIEW` จนกว่า Owner QA จะอนุมัติ
> ห้าม publish, deploy, เปลี่ยน DNS, เปิด traffic หรือใช้ real claims โดยไม่มีหลักฐาน

ขอบเขตของงานชุดนี้คือ **กติกา เครื่องมือ และเทมเพลต** ไม่ใช่การผลิตเนื้อหา
ข้อมูลจริงของ ACS (สินค้า ราคา sitemap keyword datasheet) **ยังไม่ถูกส่งมา** — ทุกช่องที่ยังไม่มีข้อมูลถูกทำเครื่องหมาย `NOT_SUPPLIED` ไม่ได้ถูกเติมด้วยการเดา

## เริ่มที่ไหน

| อ่านก่อน | ไฟล์ |
|---|---|
| Owner — ขอการตัดสินใจ 5 ข้อ | [`governance/04-OWNER-BRIEF.md`](governance/04-OWNER-BRIEF.md) |
| สถานะ 19 แพ็กเกจ | [`governance/02-PACKAGE-STATUS-BOARD.md`](governance/02-PACKAGE-STATUS-BOARD.md) |
| แหล่งข้อมูลที่ต้องมี | [`governance/00-SOURCE-PACK-INDEX.md`](governance/00-SOURCE-PACK-INDEX.md) |
| ทะเบียน claim กลาง | [`governance/01-CLAIM-REGISTER.md`](governance/01-CLAIM-REGISTER.md) |
| คนเขียน/คน QA | [`governance/03-QA-CHECKLIST.md`](governance/03-QA-CHECKLIST.md) |
| ก่อนเขียนทุกแพ็กเกจ | [`governance/05-CANNIBALIZATION-GATE.md`](governance/05-CANNIBALIZATION-GATE.md) |
| ก่อนคาดหวัง index | [`governance/06-RENDERING-GATE.md`](governance/06-RENDERING-GATE.md) |

## คำสั่ง

```sh
node acs-seo/tools/validate.mjs                  # mechanical check ทุกแพ็กเกจ
node acs-seo/tools/validate.mjs --changed-only   # ข้ามแพ็กเกจที่ไม่เปลี่ยนและเคย PASS
node acs-seo/tools/validate.mjs --fixtures       # รวม fixture ทดสอบ (ต้องได้ FAIL 1, BLOCKED 1)
node acs-seo/tools/validate.mjs --board          # พิมพ์ status board
node acs-seo/tools/selftest.mjs                  # ตรวจว่า validator ยังจับกติกาได้ครบ (22 ข้อ)
node acs-seo/tools/render-docs.mjs               # สร้างเอกสาร 00/01/02 ใหม่จาก data/
```

exit code: `0` = ไม่มี FAIL, `1` = มี FAIL

## โครงสร้าง

```
acs-seo/
├── governance/        เอกสารกติกา (00-02 generate จาก data/ ห้ามแก้มือ)
├── data/              แหล่งความจริงเดียวของระบบ
│   ├── source_pack.json      ทะเบียนแหล่งข้อมูล + สถานะ SUPPLIED/NOT_SUPPLIED
│   ├── claims.json           ทะเบียน claim กลาง 4 ประเภท
│   ├── forbidden_terms.json  กฎคำต้องห้าม 14 ข้อ ผูกกับคำตัดสินของ Owner
│   ├── packages.json         status board 19 แพ็กเกจ
│   ├── keyword_queue.json    keyword queue (PARTIAL)
│   ├── page_inventory.json   inventory หน้าเว็บเดิม (ว่าง รอข้อมูล)
│   ├── sitemap_urls.json     sitemap ปัจจุบัน (ว่าง รอข้อมูล)
│   └── gates.json            สถานะ gate ส่วนกลาง
├── templates/package/ เทมเพลต 7 ไฟล์มาตรฐานของหนึ่งแพ็กเกจ
├── content-packages/  แพ็กเกจจริง (ยังว่าง)
├── tests/fixtures/    fixture ทดสอบ validator (ไม่ใช่เนื้อหาเผยแพร่)
└── tools/             validate.mjs, render-docs.mjs
```

## วิธีสร้างแพ็กเกจใหม่

```sh
cp -r acs-seo/templates/package acs-seo/content-packages/PKG-Q04
# 1. ผ่าน cannibalization gate ก่อน แล้วบันทึกผลใน brief.md
# 2. เขียน article.md โดยอ้าง claim ID จาก data/claims.json เท่านั้น
# 3. ลงหลักฐานทุก claim ที่ไม่ใช่ SAFE_WORDING ใน audit.json
node acs-seo/tools/validate.mjs
```

## ระบบนี้กันอะไรได้บ้าง

`tools/validate.mjs` จะ FAIL อัตโนมัติเมื่อเจอ:

- ตัวเลขเปอร์เซ็นต์/ระยะอ่าน/ความเร็ว ที่ไม่มี datasheet รองรับ — *Owner decision Queue #21*
- คำฟันธงเรื่องวัสดุและสภาพแวดล้อม เช่น "ทนทุกสภาพแวดล้อม" "กันน้ำ 100%" — *Queue #4*
- ราคาเฉพาะเจาะจงที่ไม่มีราคา ACS พร้อมวันที่ — *Queue #16/#18*
- การจัดอันดับว่ายี่ห้อไหนดีที่สุด — *Queue #17*
- การอ้างเคสลูกค้า สถานะตัวแทนจำหน่าย SLA หรืออายุธุรกิจ ที่ไม่มีเอกสาร ACS
- `robots` ที่เปิด index ทั้งที่ rendering gate ยังไม่ผ่าน
- `publish_allowed: true` หรือสถานะที่หลุดจาก `DRAFT_PENDING_REVIEW` โดยไม่มีลายเซ็น Owner
- claim ID หรือ source ID ที่ไม่มีอยู่จริงในทะเบียนกลาง

สิ่งที่ตรวจไม่ได้เพราะยังไม่มีข้อมูล จะถูกรายงานเป็น `BLOCKED_ON_SOURCE` — **ไม่ใช่ PASS**

## ความสัมพันธ์กับ repo นี้

ไดเรกทอรีนี้เป็นเอกสารและเครื่องมือปฏิบัติงาน แยกจาก LILITH monorepo (`apps/`, `packages/`)
ไม่มีการแก้ไขโค้ด build หรือ CI ของ LILITH
