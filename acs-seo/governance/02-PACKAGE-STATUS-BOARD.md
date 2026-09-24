<!-- GENERATED โดย tools/render-docs.mjs จาก data/packages.json — ห้ามแก้ไฟล์นี้ด้วยมือ -->

# Package Status Board

ณ วันที่ **2026-09-24** — 20 รายการ (Owner แจ้งไว้ 19)

> ทุกแพ็กเกจอยู่ใน DRAFT_PENDING_REVIEW จนกว่า Owner QA อนุมัติ ห้าม publish / deploy / เปลี่ยน DNS / เปิด traffic

**สรุป:** PASS = 0 · REVISE = 4 · HOLD = 1 · BLOCKED = 15

**PASS = 0** — ยังไม่มีแพ็กเกจใดผ่านได้ เพราะ rendering gate อยู่ที่ `FAIL` และ Source Pack ยังไม่ครบ

| Package | Queue | Board | Package status | QA tier | Flagged claims | ติดที่ source | เหตุผล |
|---|---|---|---|---|---|---|---|
| `PKG-Q03` | #3 | **REVISE** | DRAFT_PENDING_REVIEW | T1_CLAIM | `CLM-O-001`, `CLM-O-002`, `CLM-O-007`, `CLM-O-009`, `CLM-O-010`, `CLM-E-011` | `SRC-ACS-001`, `SRC-ACS-002`, `SRC-ACS-004`, `SRC-VEN-002` | ดราฟต์ตาม runbook §3 และ §5 ส่งแล้ว — title/H1 เลิกอ้าง head term เปล่า ๆ และเนื้อหาเขียนแบบกระบวนการ mechanical QA ผ่าน (PASS, tier T1_CLAIM) และ redact.mjs ได้ศูนย์ finding · ยังเป็น REVISE ไม่ใช่ PASS เพราะ rendering gate ยัง FAIL และหัวข้อที่ทำให้หน้านี้ต่างจริง (สต็อก กำหนดส่ง บริการพื้นที่ ราคา รุ่นสินค้า) ยังรอข้อมูล ACS · ตรวจว่าหน้าต่างจากหน้าหลักจริงไหม 2026-10-23 |
| `PKG-Q04` | #4 | **REVISE** | DRAFT_PENDING_REVIEW | T2_FULL | `CLM-E-001`, `CLM-E-004`, `CLM-E-005`, `CLM-O-002` | `SRC-VEN-001`, `SRC-ACS-001` | ดราฟต์ Form A ส่งแล้ว ทุกประโยคเป็นกลไก ไม่มีค่าความทนทานของวัสดุใดเลย · spec §7 ระบุเองว่า ถ้าไม่มี SRC-VEN-001 คู่กับ SRC-ACS-001 ทุกประโยคต้องเป็น Form A หรือถูกลบ และนั่นคือผลลัพธ์ที่เผยแพร่ได้ ไม่ใช่เหตุผลที่ต้องรอ · mechanical QA ผ่าน (PASS, tier T2_FULL ตาม risk flag SPEC ของหน้าปลายทาง ไม่ใช่เพราะดราฟต์มีตัวเลข) ยังเป็น REVISE เพราะ rendering gate ยัง FAIL และประโยค Form B ที่จะให้ค่าจริงยังรอดาต้าชีต |
| `PKG-Q16` | #16 | **REVISE** | DRAFT_PENDING_REVIEW | T2_FULL | `CLM-O-001`, `CLM-O-002`, `CLM-O-005` | `SRC-ACS-002`, `SRC-ACS-001` | ดราฟต์ Form A ส่งแล้ว ไม่มีตัวเลขเงินแม้แต่ตัวเดียว · spec §7 ระบุเองว่าถ้าไม่มี SRC-ACS-002 ทุกประโยคต้องเป็น Form A หรือถูกลบ ซึ่งเผยแพร่ได้ทันที และ §3 ว่า Form A เป็นหน้าที่ดีกว่าในเชิงธุรกิจด้วย · mechanical QA ผ่าน (PASS, tier T2_FULL ตาม risk flag PRICE ของหน้าปลายทาง ไม่ใช่เพราะดราฟต์มีราคา) · ยังเป็น REVISE เพราะ rendering gate ยัง FAIL และคำถามของ Owner ว่าหน้านี้ควรมีตัวเลขหรือควรเป็นหน้าขอใบเสนอราคาถาวร ยังไม่ได้ตอบ |
| `PKG-Q17` | #17 | **BLOCKED** | DRAFT_PENDING_REVIEW | T2_FULL | `CLM-B-004`, `CLM-S-006` | `SRC-WEB-002`, `SRC-WEB-004` | เนื้อหาเขียนได้ทันที (revision spec พร้อม ไม่ติด source) แต่ยังเลือก target URL ไม่ได้ สามหน้าที่เข้าข่ายเป็นบ้านของเนื้อหานี้ถือ flag CANNIBAL แต่ไม่ปรากฏใน cluster ใดเลย cannibalization gate จึงไม่ครอบคลุม การเขียนลงไปโดยไม่รู้ว่าชนกับอะไร คือการทำซ้ำรูปแบบเดียวกับ C-1 เปลี่ยนจาก REVISE เป็น BLOCKED เพราะอุปสรรคจริงถูกระบุแล้วและเป็นคำถามที่ตอบได้ ไม่ใช่เพราะงานถอยหลัง |
| `PKG-Q18` | #18 | **BLOCKED** | DRAFT_PENDING_REVIEW | T2_FULL | `CLM-O-001`, `CLM-B-003` | `SRC-ACS-002`, `SRC-KW-001` | ใช้คำตัดสินเดียวกับ #16 และ spec เดียวกัน แต่ยังไม่รู้ว่าหมายถึงหน้าใด page inventory มีหน้าที่ถือ flag PRICE เพียงหน้าเดียวคือ /barcode-scanner-price-guide ซึ่ง PKG-Q16 ใช้ไปแล้ว spec เองก็ระบุว่าไม่มีดราฟต์ของทั้งสองคิวมาถึง จึงไม่สมมติความต่าง · เปลี่ยนจาก REVISE เป็น BLOCKED เพราะอุปสรรคจริงถูกระบุแล้วและเป็นคำถามที่ตอบได้ ไม่ใช่เพราะงานถอยหลัง |
| `PKG-Q21` | #21 | **REVISE** | DRAFT_PENDING_REVIEW | T2_FULL | `CLM-B-001`, `CLM-B-006`, `CLM-E-001`, `CLM-E-002`, `CLM-E-003` | `SRC-VEN-002`, `SRC-ACS-003` | ดราฟต์ส่งแล้ว ไม่มีตัวเลขผลลัพธ์ใด และไม่แทนด้วยคำคลุมเครืออย่าง "ดีขึ้นมาก" ซึ่ง spec §3 ระบุว่า เป็น claim เดิมที่ถอดหลักฐานออก · mechanical QA ผ่าน (PASS, tier T2_FULL ตาม risk flag NUMBERS ของหน้าปลายทาง) · ยังเป็น REVISE เพราะ rendering gate ยัง FAIL และคิวนี้ยังไม่จบ ตัวเลขระยะอ่านบน /long-range-barcode-scanner กับความเร็วพิมพ์บน /tsc-barcode-printer เป็นการใช้คำตัดสินเดียวกันคนละจุด ยังไม่ได้ทำ |
| `PKG-UNMAPPED-01` | — | **BLOCKED** | DRAFT_PENDING_REVIEW | UNDETERMINED | — | `SRC-KW-001` | ยังไม่ได้รับไฟล์แพ็กเกจและ queue ID mapping — ตรวจอะไรไม่ได้เลย |
| `PKG-UNMAPPED-02` | — | **BLOCKED** | DRAFT_PENDING_REVIEW | UNDETERMINED | — | `SRC-KW-001` | ยังไม่ได้รับไฟล์แพ็กเกจและ queue ID mapping — ตรวจอะไรไม่ได้เลย |
| `PKG-UNMAPPED-03` | — | **BLOCKED** | DRAFT_PENDING_REVIEW | UNDETERMINED | — | `SRC-KW-001` | ยังไม่ได้รับไฟล์แพ็กเกจและ queue ID mapping — ตรวจอะไรไม่ได้เลย |
| `PKG-UNMAPPED-04` | — | **BLOCKED** | DRAFT_PENDING_REVIEW | UNDETERMINED | — | `SRC-KW-001` | ยังไม่ได้รับไฟล์แพ็กเกจและ queue ID mapping — ตรวจอะไรไม่ได้เลย |
| `PKG-UNMAPPED-05` | — | **BLOCKED** | DRAFT_PENDING_REVIEW | UNDETERMINED | — | `SRC-KW-001` | ยังไม่ได้รับไฟล์แพ็กเกจและ queue ID mapping — ตรวจอะไรไม่ได้เลย |
| `PKG-UNMAPPED-06` | — | **BLOCKED** | DRAFT_PENDING_REVIEW | UNDETERMINED | — | `SRC-KW-001` | ยังไม่ได้รับไฟล์แพ็กเกจและ queue ID mapping — ตรวจอะไรไม่ได้เลย |
| `PKG-UNMAPPED-07` | — | **BLOCKED** | DRAFT_PENDING_REVIEW | UNDETERMINED | — | `SRC-KW-001` | ยังไม่ได้รับไฟล์แพ็กเกจและ queue ID mapping — ตรวจอะไรไม่ได้เลย |
| `PKG-UNMAPPED-08` | — | **BLOCKED** | DRAFT_PENDING_REVIEW | UNDETERMINED | — | `SRC-KW-001` | ยังไม่ได้รับไฟล์แพ็กเกจและ queue ID mapping — ตรวจอะไรไม่ได้เลย |
| `PKG-UNMAPPED-09` | — | **BLOCKED** | DRAFT_PENDING_REVIEW | UNDETERMINED | — | `SRC-KW-001` | ยังไม่ได้รับไฟล์แพ็กเกจและ queue ID mapping — ตรวจอะไรไม่ได้เลย |
| `PKG-UNMAPPED-10` | — | **BLOCKED** | DRAFT_PENDING_REVIEW | UNDETERMINED | — | `SRC-KW-001` | ยังไม่ได้รับไฟล์แพ็กเกจและ queue ID mapping — ตรวจอะไรไม่ได้เลย |
| `PKG-UNMAPPED-11` | — | **BLOCKED** | DRAFT_PENDING_REVIEW | UNDETERMINED | — | `SRC-KW-001` | ยังไม่ได้รับไฟล์แพ็กเกจและ queue ID mapping — ตรวจอะไรไม่ได้เลย |
| `PKG-UNMAPPED-12` | — | **BLOCKED** | DRAFT_PENDING_REVIEW | UNDETERMINED | — | `SRC-KW-001` | ยังไม่ได้รับไฟล์แพ็กเกจและ queue ID mapping — ตรวจอะไรไม่ได้เลย |
| `PKG-UNMAPPED-13` | — | **BLOCKED** | DRAFT_PENDING_REVIEW | UNDETERMINED | — | `SRC-KW-001` | ยังไม่ได้รับไฟล์แพ็กเกจและ queue ID mapping — ตรวจอะไรไม่ได้เลย |
| `PKG-ABOUT-ACS` | — | **HOLD** | DRAFT_PENDING_REVIEW | T1_CLAIM | `CLM-B-004`, `CLM-O-003`, `CLM-O-004`, `CLM-O-006`, `CLM-E-011` | `SRC-ACS-003`, `SRC-ACS-004`, `SRC-WEB-004` | ติด C-9 — /why-acs อยู่ในกลุ่มหน้าองค์กร 4 หน้าที่ยังไม่มีหน้าหลัก การเพิ่มหน้าแนะนำองค์กรโดยไม่ตัดสินกลุ่มนี้ก่อน จะทำซ้ำรูปแบบเดียวกับที่ C-1 เพิ่งตัดสินให้แก้ · ดราฟต์ v1 พร้อมอยู่แล้ว ไม่มี claim ที่ถูก gate รอแค่คำตัดสินว่าหน้าไหนคือหน้าหลักของกลุ่ม |

## คำตัดสินของ Owner ที่บันทึกไว้

| Package | คำตัดสิน |
|---|---|
| `PKG-Q03` | D-08 (ทับ D-07) — option B ตัดสินโดย ACS Owner 2026-09-23 ทันกำหนด 2026-09-24 |
| `PKG-Q04` | REVISE wording ห้ามฟันธงถ้าไม่มี datasheet สินค้าจริง |
| `PKG-Q16` | ห้ามใส่ราคาเฉพาะเจาะจงถ้าไม่มีราคา ACS พร้อมวันที่ |
| `PKG-Q17` | ใช้เกณฑ์ตัดสินใจ ห้ามจัดอันดับว่ายี่ห้อไหนดีที่สุด |
| `PKG-Q18` | ห้ามใส่ราคาเฉพาะเจาะจงถ้าไม่มีราคา ACS พร้อมวันที่ |
| `PKG-Q21` | ลบตัวเลข 65-70% → 95%+ จนกว่าจะมีหลักฐาน |
| `PKG-ABOUT-ACS` | Owner ขอเมื่อ 2026-09-23: ชมเชย ACS, เอ่ย Honeywell, 7-Eleven, 30 ปี, และคำมั่นว่าจะซื่อสัตย์และมั่นคงต่อไป |

## คำถามค้าง

- Owner แจ้ง 19 packages แต่หมายเลข queue ที่อ้างถึงสูงสุดคือ #21 — ต้องยืนยันว่า queue ID กับจำนวนแพ็กเกจ map กันอย่างไร ระหว่างที่ยังไม่ยืนยัน 13 รายการถูกตั้งเป็น PKG-UNMAPPED-XX · ตอนนี้มี page inventory จริง 82 หน้าแล้ว การจับคู่ queue กับ target URL จึงทำได้ทันทีที่ได้ keyword queue ฉบับเต็ม

## สถานะ gate ส่วนกลาง

| Gate | สถานะ | ผู้รับผิดชอบ | หลักฐานที่ต้องมี |
|---|---|---|---|
| `GATE-RENDER` Rendering Gate (SSR / prerender) | **FAIL** | Manus | `SRC-WEB-003` |
| `GATE-CANNIBAL` Cannibalization Gate | **OPEN_WITH_FINDINGS** | SEO Lead | `SRC-WEB-004` |
| `GATE-OWNER-APPROVAL` Owner QA Approval | **NOT_GRANTED** | ACS Owner | — |

## เงื่อนไขก่อน publish (ต้องครบทุกข้อ)

- [ ] `gates.mechanical = PASS`
- [ ] `gates.claim_qa = PASS`
- [ ] `gates.cannibalization = PASS`
- [ ] `GATE-RENDER = PASS`
- [ ] `gates.owner_approval = GRANTED`
