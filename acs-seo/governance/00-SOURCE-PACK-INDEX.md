<!-- GENERATED โดย tools/render-docs.mjs จาก data/source_pack.json — ห้ามแก้ไฟล์นี้ด้วยมือ -->

# ACS SEO Source Pack Index

ณ วันที่ **2026-09-20** — แหล่งข้อมูลกลางที่ทุก claim ต้อง map กลับมาได้

> ทุก claim ที่ไม่ใช่ SAFE_WORDING ต้อง map กับ source_id ที่มีสถานะ SUPPLIED เท่านั้น ห้ามใช้ source ที่ยัง NOT_SUPPLIED เป็นหลักฐาน

**สถานะรวม:** SUPPLIED 0 / PARTIAL 1 / NOT_SUPPLIED 11 จากทั้งหมด 12

| ID | แหล่ง | ระดับความน่าเชื่อถือ | สถานะ | ผู้รับผิดชอบ | ปลดล็อก claim | หมายเหตุ |
|---|---|---|---|---|---|---|
| `SRC-ACS-001` | ACS product/service list จริง (SKU / รุ่น / บริการที่ขายจริง) | ACS_INTERNAL | **NOT_SUPPLIED** | ACS Owner | `CLM-O-002`, `CLM-O-003` | ไม่มีไฟล์นี้ = ห้ามระบุชื่อรุ่น/สินค้าเฉพาะเจาะจงในทุกแพ็กเกจ |
| `SRC-ACS-002` | ACS price list พร้อม effective date | ACS_INTERNAL | **NOT_SUPPLIED** | ACS Owner | `CLM-O-001`, `CLM-B-003` | Owner decision Queue #16/#18: ห้ามใส่ราคาเฉพาะเจาะจงถ้าไม่มีราคา ACS พร้อมวันที่ |
| `SRC-ACS-003` | เอกสารเคสลูกค้า ACS + หนังสือยินยอมเผยแพร่ | ACS_INTERNAL | **NOT_SUPPLIED** | ACS Owner | `CLM-O-004` | ต้องมีทั้งเอกสารและ consent จึงจะอ้างเคสได้ |
| `SRC-ACS-004` | ACS company profile (ปีที่ก่อตั้ง, พื้นที่ให้บริการ, ทีมบริการ, SLA) | ACS_INTERNAL | **NOT_SUPPLIED** | ACS Owner | `CLM-O-005`, `CLM-O-006`, `CLM-O-007` | — |
| `SRC-WEB-001` | sitemap.xml ปัจจุบันของ www.asiancoding.com | OWN_SITE | **NOT_SUPPLIED** | ACS Owner / Web | `GATE-MECH-SITEMAP` | ต้อง export เป็นไฟล์เข้ามาใน data/ เพื่อให้ validator เช็ก target_url ได้จริง |
| `SRC-WEB-002` | Page inventory ของหน้าเว็บเดิม + ประเภท Product / Service / Knowledge / Landing | OWN_SITE | **NOT_SUPPLIED** | SEO Lead | `GATE-CANNIBAL`, `GATE-MECH-INTERNAL-LINKS` | ไฟล์ schema ถูกเตรียมไว้แล้วแต่ยังไม่มีข้อมูลจริง (pages: []) |
| `SRC-WEB-003` | รายงาน rendering mode ปัจจุบัน (CSR/SSR/prerender) โดย Manus | OWN_SITE | **NOT_SUPPLIED** | Manus | `GATE-RENDER` | เว็บยัง client-side rendered — ห้ามนับว่า 'พร้อม SEO' จนกว่า gate นี้ผ่าน |
| `SRC-KW-001` | Keyword queue ทั้งหมด (keyword, intent, target URL, NEW/ENRICH/HOLD) | ACS_INTERNAL | **PARTIAL** | SEO Lead | `GATE-CANNIBAL` | มีเฉพาะ 6 queue ที่ Owner ตัดสินแล้ว (#3,#4,#16,#17,#18,#21) ที่เหลือยังไม่ถูกส่งมา |
| `SRC-VEN-001` | Brady material / label datasheets (ทางการเท่านั้น) | OFFICIAL_VENDOR | **NOT_SUPPLIED** | Content Lead | `CLM-E-004`, `CLM-E-005` | Owner decision Queue #4: ห้ามฟันธงเรื่องวัสดุ/สภาพแวดล้อมถ้าไม่มี datasheet สินค้าจริง |
| `SRC-VEN-002` | Honeywell hardware datasheets (scanner / mobile computer / printer) | OFFICIAL_VENDOR | **NOT_SUPPLIED** | Content Lead | `CLM-E-001`, `CLM-E-002`, `CLM-E-003`, `CLM-E-007`, `CLM-E-008` | Owner decision Queue #21: ลบตัวเลขระยะอ่าน/ความเร็ว/ความแม่นยำ จนกว่าจะมี datasheet |
| `SRC-VEN-003` | GS1 official specification (GTIN, GS1-128, Application Identifier, DataMatrix) | STANDARDS_BODY | **NOT_SUPPLIED** | Content Lead | `CLM-E-006` | — |
| `SRC-VEN-004` | แหล่งทางการอื่นของผู้ผลิตที่ ACS เป็นตัวแทน (ต้องขึ้นทะเบียนก่อนใช้) | OFFICIAL_VENDOR | **NOT_SUPPLIED** | Content Lead | — | blog/ร้านค้า/marketplace/บทความ third-party ไม่นับเป็นหลักฐาน |

## แหล่งที่ยอมรับเป็นหลักฐานได้

- `STANDARDS_BODY`
- `OFFICIAL_VENDOR`
- `ACS_INTERNAL`
- `OWN_SITE`

blog, ร้านค้าออนไลน์, marketplace, บทความ third-party, และผลลัพธ์จากการค้นหาทั่วไป **ไม่นับเป็นหลักฐาน**

## Keyword queue (SRC-KW-001)

สถานะ: **PARTIAL** — ยังไม่ได้รับ keyword queue ฉบับเต็มจาก Owner/SEO Lead — ที่บันทึกไว้คือ queue ที่ Owner ตัดสินใจแล้วเท่านั้น ช่องที่เป็น null คือ 'ยังไม่ได้รับข้อมูล' ไม่ใช่ 'ไม่มี'

| Queue | Keyword | Intent | Target URL | Action | คำตัดสินของ Owner |
|---|---|---|---|---|---|
| #3 | — | UNMAPPED | — | HOLD | HOLD เพราะ cannibalization — ต้อง map intent ให้เสร็จก่อนกำหนด 24 ก.ย. |
| #4 | — | UNMAPPED | — | — | REVISE wording เรื่องวัสดุและสภาพแวดล้อม ห้ามฟันธงถ้าไม่มี datasheet สินค้าจริง |
| #16 | — | UNMAPPED | — | — | ห้ามใส่ราคาเฉพาะเจาะจงถ้าไม่มีราคา ACS พร้อมวันที่ |
| #17 | — | UNMAPPED | — | — | ใช้เกณฑ์ตัดสินใจ ห้ามจัดอันดับว่ายี่ห้อไหนดีที่สุด |
| #18 | — | UNMAPPED | — | — | ห้ามใส่ราคาเฉพาะเจาะจงถ้าไม่มีราคา ACS พร้อมวันที่ |
| #21 | — | UNMAPPED | — | — | ลบตัวเลขระยะอ่าน/ความเร็ว/ความแม่นยำ 65-70% → 95%+ จนกว่าจะมีหลักฐาน |

ช่องที่เป็น — คือ **ยังไม่ได้รับข้อมูล** ไม่ใช่ "ไม่มี" — ห้ามเติมด้วยการเดา
