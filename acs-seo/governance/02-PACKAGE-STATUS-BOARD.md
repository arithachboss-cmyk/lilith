<!-- GENERATED โดย tools/render-docs.mjs จาก data/packages.json — ห้ามแก้ไฟล์นี้ด้วยมือ -->

# Package Status Board

ณ วันที่ **2026-09-25** — 41 รายการ (Owner แจ้งไว้ 19)

> ทุกแพ็กเกจอยู่ใน DRAFT_PENDING_REVIEW จนกว่า Owner QA อนุมัติ ห้าม publish / deploy / เปลี่ยน DNS / เปิด traffic

**สรุป:** PASS = 0 · REVISE = 19 · HOLD = 1 · BLOCKED = 21

**PASS = 0** — ยังไม่มีแพ็กเกจใดผ่านได้ เพราะ rendering gate อยู่ที่ `FAIL` และ Source Pack ยังไม่ครบ

| Package | Queue | Board | Package status | QA tier | Flagged claims | ติดที่ source | เหตุผล |
|---|---|---|---|---|---|---|---|
| `PKG-Q03` | #3 | **REVISE** | DRAFT_PENDING_REVIEW | T1_CLAIM | `CLM-O-001`, `CLM-O-002`, `CLM-O-007`, `CLM-O-009`, `CLM-O-010`, `CLM-E-011` | `SRC-ACS-001`, `SRC-ACS-002`, `SRC-ACS-004`, `SRC-VEN-002` | ดราฟต์ตาม runbook §3 และ §5 ส่งแล้ว — title/H1 เลิกอ้าง head term เปล่า ๆ และเนื้อหาเขียนแบบกระบวนการ mechanical QA ผ่าน (PASS, tier T1_CLAIM) และ redact.mjs ได้ศูนย์ finding · ยังเป็น REVISE ไม่ใช่ PASS เพราะ rendering gate ยัง FAIL และหัวข้อที่ทำให้หน้านี้ต่างจริง (สต็อก กำหนดส่ง บริการพื้นที่ ราคา รุ่นสินค้า) ยังรอข้อมูล ACS · ตรวจว่าหน้าต่างจากหน้าหลักจริงไหม 2026-10-23 |
| `PKG-Q04` | #4 | **REVISE** | DRAFT_PENDING_REVIEW | T2_FULL | `CLM-E-001`, `CLM-E-004`, `CLM-E-005`, `CLM-O-002` | `SRC-VEN-001`, `SRC-ACS-001` | ดราฟต์ Form A ส่งแล้ว ทุกประโยคเป็นกลไก ไม่มีค่าความทนทานของวัสดุใดเลย · spec §7 ระบุเองว่า ถ้าไม่มี SRC-VEN-001 คู่กับ SRC-ACS-001 ทุกประโยคต้องเป็น Form A หรือถูกลบ และนั่นคือผลลัพธ์ที่เผยแพร่ได้ ไม่ใช่เหตุผลที่ต้องรอ · mechanical QA ผ่าน (PASS, tier T2_FULL ตาม risk flag SPEC ของหน้าปลายทาง ไม่ใช่เพราะดราฟต์มีตัวเลข) ยังเป็น REVISE เพราะ rendering gate ยัง FAIL และประโยค Form B ที่จะให้ค่าจริงยังรอดาต้าชีต |
| `PKG-Q16` | #16 | **REVISE** | DRAFT_PENDING_REVIEW | T2_FULL | `CLM-O-001`, `CLM-O-002`, `CLM-O-005` | `SRC-ACS-002`, `SRC-ACS-001` | ดราฟต์ Form A ส่งแล้ว ไม่มีตัวเลขเงินแม้แต่ตัวเดียว · spec §7 ระบุเองว่าถ้าไม่มี SRC-ACS-002 ทุกประโยคต้องเป็น Form A หรือถูกลบ ซึ่งเผยแพร่ได้ทันที และ §3 ว่า Form A เป็นหน้าที่ดีกว่าในเชิงธุรกิจด้วย · mechanical QA ผ่าน (PASS, tier T2_FULL ตาม risk flag PRICE ของหน้าปลายทาง ไม่ใช่เพราะดราฟต์มีราคา) · ยังเป็น REVISE เพราะ rendering gate ยัง FAIL และคำถามของ Owner ว่าหน้านี้ควรมีตัวเลขหรือควรเป็นหน้าขอใบเสนอราคาถาวร ยังไม่ได้ตอบ |
| `PKG-Q17` | #17 | **REVISE** | DRAFT_PENDING_REVIEW | WORDING_QA_OK | — | `SRC-VEN-002`, `SRC-ACS-004` | ปลดแล้วด้วยคำตัดสิน D-12 (2026-09-25) ที่ตั้ง /knowledge/how-to-choose-barcode-scanner เป็นหน้าหลักของ C-7 · เนื้อหาไม่เคยติด source ใด สิ่งที่ติดคือไม่รู้ว่าจะลงหน้าไหน · ดราฟต์ส่งแล้วตาม revision-specs/queue-17.md ครบทุกข้อ mechanical QA ผ่าน (PASS) และ redact.mjs ได้ศูนย์ finding · ยังเป็น REVISE เพราะ rendering gate ยัง FAIL ทั้งระบบ |
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
| `PKG-RFID-VS-BARCODE` | — | **REVISE** | DRAFT_PENDING_REVIEW | WORDING_QA_OK | — | `SRC-VEN-002`, `SRC-KW-001` | แพ็กเกจนอกคิวหมายเลข ทำตามหัวข้อที่ Owner กำหนดให้เน้น (RFID) · เป็นหน้า RFID เพียงหน้าเดียวจากแปดหน้าที่ไม่อยู่ใน C-3 ซึ่งยังไม่มี canonical owner จึงเป็นหน้า RFID หน้าเดียวที่เขียนได้ตอนนี้ · mechanical QA ผ่าน (PASS, tier WORDING_QA_OK) · ยังเป็น REVISE เพราะ rendering gate ยัง FAIL และยังไม่ยืนยันว่าซ้ำกับหนึ่งใน 13 รายการ PKG-UNMAPPED หรือไม่ |
| `PKG-WMS-INTEGRATION` | — | **REVISE** | DRAFT_PENDING_REVIEW | WORDING_QA_OK | — | `SRC-ACS-001`, `SRC-KW-001` | แพ็กเกจนอกคิวหมายเลข ทำตามหัวข้อที่ Owner กำหนดให้เน้น (Warehouse Automation) · หน้าคลังสินค้าที่เกี่ยวข้องมีเก้าหน้า เจ็ดหน้าอยู่ใน C-5 หรือ C-3 ซึ่งยังไม่มี canonical owner เหลือสองหน้าที่เขียนได้ · mechanical QA ผ่าน (PASS, tier WORDING_QA_OK) · ยังเป็น REVISE เพราะ rendering gate ยัง FAIL และยังไม่ยืนยันว่าซ้ำกับหนึ่งใน 13 รายการ PKG-UNMAPPED หรือไม่ |
| `PKG-POS-RETAIL` | — | **REVISE** | DRAFT_PENDING_REVIEW | WORDING_QA_OK | — | `SRC-ACS-004`, `SRC-KW-001` | แพ็กเกจนอกคิวหมายเลข ทำตามหัวข้อที่ Owner กำหนดให้เน้น (Retail Automation) · เป็นหน้า Retail หน้าเดียวจากห้าหน้าที่เขียนได้ตอนนี้ ที่เหลืออยู่ใน C-6 ซึ่งยังไม่มี canonical owner · mechanical QA ผ่าน (PASS, tier WORDING_QA_OK) · ยังเป็น REVISE เพราะ rendering gate ยัง FAIL และหน้านี้เป็น SERVICE ที่ยังประกาศขอบเขตบริการไม่ได้จนกว่า SRC-ACS-004 จะมา |
| `PKG-INVENTORY-COUNT` | — | **REVISE** | DRAFT_PENDING_REVIEW | WORDING_QA_OK | — | `SRC-ACS-001`, `SRC-KW-001` | แพ็กเกจนอกคิวหมายเลข ทำตามหัวข้อที่ Owner กำหนดให้เน้น (Warehouse Automation) · เป็นหน้าสุดท้ายที่เขียนได้โดยไม่ต้องรอคำตัดสินเรื่อง cluster หรือเอกสารจาก ACS หรือผู้ผลิต · mechanical QA ผ่าน (PASS, tier WORDING_QA_OK) · ยังเป็น REVISE เพราะ rendering gate ยัง FAIL |
| `PKG-IMC` | — | **REVISE** | DRAFT_PENDING_REVIEW | T2_FULL | — | `SRC-ACS-001`, `SRC-ACS-004`, `SRC-KW-001` | แพ็กเกจนอกคิว ทำตามคำตอบของคำถามข้อ 7 (2026-09-25) ที่ตัดสินว่า Industrial Mobile Computing ควรมีหน้าเนื้อหาของตัวเอง · เป็นหัวข้อเดียวในหกหัวข้อที่ Owner กำหนดให้เน้น ที่เว็บไม่มีหน้าเนื้อหาเลย มีเพียง /roi-calculator/mobility ซึ่งเป็นหน้าคำนวณ · เป็นหน้าใหม่ที่ไม่อยู่ใน cluster ใด จึงไม่ติดกติกา cannibalization และเขียนได้ทันทีโดยไม่ต้องรอคำตัดสินใด · mechanical QA ผ่าน (PASS) และ redact.mjs ได้ศูนย์ finding · ยังเป็น REVISE เพราะ rendering gate ยัง FAIL และหน้ายังไม่ถูกสร้างขึ้นจริง |
| `PKG-RFID-SYSTEMS` | — | **REVISE** | DRAFT_PENDING_REVIEW | WORDING_QA_OK | — | `SRC-ACS-001`, `SRC-ACS-004`, `SRC-VEN-002` | เสริมหน้าหลักของ C-3 โดยตรงตามที่คำตัดสิน D-09 สั่ง (ENRICH_CANONICAL) · ดราฟต์ไม่มีตัวเลข ไม่มีชื่อผู้ผลิต และไม่อ้างขอบเขตบริการของ ACS · ยังเป็น REVISE ไม่ใช่ PASS เพราะ rendering gate ยัง FAIL ทั้งระบบ และแพ็กเกจนี้ยังไม่ถูกรับเข้าคิวโดย Owner |
| `PKG-RFID-READER` | — | **REVISE** | DRAFT_PENDING_REVIEW | WORDING_QA_OK | — | `SRC-ACS-001`, `SRC-VEN-002` | หน้ารองใน C-3 — แพ็กเกจบีบขอบเขต intent ให้ไม่ทับหน้าหลักและลิงก์ขึ้นหาหน้าหลัก ตามการตีความ ENRICH_CANONICAL ทาง B · ยังเป็น REVISE เพราะ rendering gate ยัง FAIL ทั้งระบบ แพ็กเกจยังไม่ถูกรับเข้าคิว และวิธีจัดการหน้ารอง (รวมหน้า vs บีบขอบเขต) ยังรอ Owner ยืนยัน |
| `PKG-RFID-WAREHOUSE` | — | **REVISE** | DRAFT_PENDING_REVIEW | WORDING_QA_OK | — | `SRC-ACS-001`, `SRC-ACS-004` | หน้ารองใน C-3 — แพ็กเกจบีบขอบเขต intent ให้ไม่ทับหน้าหลักและลิงก์ขึ้นหาหน้าหลัก ตามการตีความ ENRICH_CANONICAL ทาง B · ยังเป็น REVISE เพราะ rendering gate ยัง FAIL ทั้งระบบ แพ็กเกจยังไม่ถูกรับเข้าคิว และวิธีจัดการหน้ารอง (รวมหน้า vs บีบขอบเขต) ยังรอ Owner ยืนยัน |
| `PKG-RFID-WORKFLOW` | — | **REVISE** | DRAFT_PENDING_REVIEW | WORDING_QA_OK | — | `SRC-ACS-003` | หน้ารองใน C-3 — แพ็กเกจบีบขอบเขต intent ให้ไม่ทับหน้าหลักและลิงก์ขึ้นหาหน้าหลัก ตามการตีความ ENRICH_CANONICAL ทาง B · ยังเป็น REVISE เพราะ rendering gate ยัง FAIL ทั้งระบบ แพ็กเกจยังไม่ถูกรับเข้าคิว และวิธีจัดการหน้ารอง (รวมหน้า vs บีบขอบเขต) ยังรอ Owner ยืนยัน |
| `PKG-RFID-IMPLEMENTATION` | — | **REVISE** | DRAFT_PENDING_REVIEW | WORDING_QA_OK | — | `SRC-ACS-004`, `SRC-VEN-001` | หน้ารองใน C-3 — แพ็กเกจบีบขอบเขต intent ให้ไม่ทับหน้าหลักและลิงก์ขึ้นหาหน้าหลัก ตามการตีความ ENRICH_CANONICAL ทาง B · ยังเป็น REVISE เพราะ rendering gate ยัง FAIL ทั้งระบบ แพ็กเกจยังไม่ถูกรับเข้าคิว และวิธีจัดการหน้ารอง (รวมหน้า vs บีบขอบเขต) ยังรอ Owner ยืนยัน |
| `PKG-RFID-TECHNOLOGY` | — | **REVISE** | DRAFT_PENDING_REVIEW | WORDING_QA_OK | — | `SRC-VEN-002`, `SRC-VEN-003` | หน้ารองใน C-3 — แพ็กเกจบีบขอบเขต intent ให้ไม่ทับหน้าหลักและลิงก์ขึ้นหาหน้าหลัก ตามการตีความ ENRICH_CANONICAL ทาง B · ยังเป็น REVISE เพราะ rendering gate ยัง FAIL ทั้งระบบ แพ็กเกจยังไม่ถูกรับเข้าคิว และวิธีจัดการหน้ารอง (รวมหน้า vs บีบขอบเขต) ยังรอ Owner ยืนยัน |
| `PKG-WAREHOUSE-CAPTURE` | — | **REVISE** | DRAFT_PENDING_REVIEW | WORDING_QA_OK | — | `SRC-ACS-001`, `SRC-ACS-003`, `SRC-ACS-004` | เสริมหน้าหลักของ C-5 โดยตรงตามที่คำตัดสิน D-10 สั่ง (ENRICH_CANONICAL) · ดราฟต์ไม่มีตัวเลข ไม่มีชื่อผู้ผลิต และไม่อ้างขอบเขตบริการของ ACS · ยังเป็น REVISE ไม่ใช่ PASS เพราะ rendering gate ยัง FAIL ทั้งระบบ และแพ็กเกจนี้ยังไม่ถูกรับเข้าคิวโดย Owner |
| `PKG-LOGISTICS` | — | **REVISE** | DRAFT_PENDING_REVIEW | WORDING_QA_OK | — | `SRC-ACS-003`, `SRC-ACS-004` | หน้ารองใน C-5 — แพ็กเกจบีบขอบเขต intent ให้ไม่ทับหน้าหลักและลิงก์ขึ้นหาหน้าหลัก ตามการตีความ ENRICH_CANONICAL ทาง B · ยังเป็น REVISE เพราะ rendering gate ยัง FAIL ทั้งระบบ แพ็กเกจยังไม่ถูกรับเข้าคิว และวิธีจัดการหน้ารอง (รวมหน้า vs บีบขอบเขต) ยังรอ Owner ยืนยัน |
| `PKG-RETAIL` | — | **REVISE** | DRAFT_PENDING_REVIEW | WORDING_QA_OK | — | `SRC-ACS-001`, `SRC-ACS-003`, `SRC-ACS-004` | เสริมหน้าหลักของ C-6 โดยตรงตามที่คำตัดสิน D-11 สั่ง (ENRICH_CANONICAL) · ดราฟต์ไม่มีตัวเลข ไม่มีชื่อผู้ผลิต และไม่อ้างขอบเขตบริการของ ACS · ยังเป็น REVISE ไม่ใช่ PASS เพราะ rendering gate ยัง FAIL ทั้งระบบ และแพ็กเกจนี้ยังไม่ถูกรับเข้าคิวโดย Owner |
| `PKG-CASE-LOGISTICS` | — | **BLOCKED** | DRAFT_PENDING_REVIEW | T2_FULL | `CLM-O-004` | `SRC-ACS-003` | หน้าเคสลูกค้า — เขียนไม่ได้เพราะ CLM-O-004 ระบุว่าความยินยอมเป็นของลูกค้า ไม่ใช่ของ ACS · การปิดชื่อลูกค้าไม่ได้ทำให้เล่าได้ เพราะสิ่งที่ต้องได้รับอนุญาตคือเรื่องราว ไม่ใช่ชื่อ · ปลดด้วย SRC-ACS-003 ซึ่งต้องมีทั้งเอกสารเคสและหนังสือยินยอม · cluster C-5 ปลดแล้ว แต่ cluster ไม่ใช่สิ่งที่กั้นหน้านี้ — สิ่งที่กั้นคือชั้น claim ของตัวหน้าเอง |
| `PKG-CASE-WAREHOUSE` | — | **BLOCKED** | DRAFT_PENDING_REVIEW | T2_FULL | `CLM-O-004` | `SRC-ACS-003` | หน้าเคสลูกค้า — เขียนไม่ได้เพราะ CLM-O-004 ระบุว่าความยินยอมเป็นของลูกค้า ไม่ใช่ของ ACS · การปิดชื่อลูกค้าไม่ได้ทำให้เล่าได้ เพราะสิ่งที่ต้องได้รับอนุญาตคือเรื่องราว ไม่ใช่ชื่อ · ปลดด้วย SRC-ACS-003 ซึ่งต้องมีทั้งเอกสารเคสและหนังสือยินยอม · cluster C-5 ปลดแล้ว แต่ cluster ไม่ใช่สิ่งที่กั้นหน้านี้ — สิ่งที่กั้นคือชั้น claim ของตัวหน้าเอง |
| `PKG-CASE-RETAIL` | — | **BLOCKED** | DRAFT_PENDING_REVIEW | T2_FULL | `CLM-O-004` | `SRC-ACS-003` | หน้าเคสลูกค้า — เขียนไม่ได้เพราะ CLM-O-004 ระบุว่าความยินยอมเป็นของลูกค้า ไม่ใช่ของ ACS · การปิดชื่อลูกค้าไม่ได้ทำให้เล่าได้ เพราะสิ่งที่ต้องได้รับอนุญาตคือเรื่องราว ไม่ใช่ชื่อ · ปลดด้วย SRC-ACS-003 ซึ่งต้องมีทั้งเอกสารเคสและหนังสือยินยอม · cluster C-6 ปลดแล้ว แต่ cluster ไม่ใช่สิ่งที่กั้นหน้านี้ — สิ่งที่กั้นคือชั้น claim ของตัวหน้าเอง |
| `PKG-ROI-WAREHOUSE` | — | **BLOCKED** | DRAFT_PENDING_REVIEW | T2_FULL | `CLM-B-006`, `CLM-O-004` | `SRC-ACS-003` | หน้าเครื่องคำนวณผลตอบแทน — เขียนไม่ได้เพราะ CLM-B-006 ห้ามรับประกันผลลัพธ์เป็นตัวเลข และตัวเลขตั้งต้นของเครื่องคำนวณคือการรับประกันผลในทางปฏิบัติ ไม่ว่าจะมีข้อความปฏิเสธความรับผิดกำกับหรือไม่ · ปลดได้ต่อเมื่อมีเคสจริงที่ยืนยันได้ (SRC-ACS-003) แล้ว Owner อนุมัติอีกชั้น · cluster C-5 ปลดแล้ว แต่ cluster ไม่ใช่สิ่งที่กั้นหน้านี้ — สิ่งที่กั้นคือชั้น claim ของตัวหน้าเอง |
| `PKG-ROI-RETAIL` | — | **BLOCKED** | DRAFT_PENDING_REVIEW | T2_FULL | `CLM-B-006`, `CLM-O-004` | `SRC-ACS-003` | หน้าเครื่องคำนวณผลตอบแทน — เขียนไม่ได้เพราะ CLM-B-006 ห้ามรับประกันผลลัพธ์เป็นตัวเลข และตัวเลขตั้งต้นของเครื่องคำนวณคือการรับประกันผลในทางปฏิบัติ ไม่ว่าจะมีข้อความปฏิเสธความรับผิดกำกับหรือไม่ · ปลดได้ต่อเมื่อมีเคสจริงที่ยืนยันได้ (SRC-ACS-003) แล้ว Owner อนุมัติอีกชั้น · cluster C-6 ปลดแล้ว แต่ cluster ไม่ใช่สิ่งที่กั้นหน้านี้ — สิ่งที่กั้นคือชั้น claim ของตัวหน้าเอง |
| `PKG-BRADY-SCANNERS-RFID` | — | **BLOCKED** | DRAFT_PENDING_REVIEW | T2_FULL | `CLM-O-003`, `CLM-E-011` | `SRC-ACS-001`, `SRC-ACS-004`, `SRC-VEN-001` | หน้าในโฟลเดอร์ผู้ผลิต — เขียนไม่ได้เพราะ CLM-O-003 ระบุว่าสถานะตัวแทน/ผู้แทนจำหน่ายต้องมีหนังสือรับรองจากแบรนด์พร้อมวันที่ · ผู้ปิด claim นี้คือแบรนด์ ไม่ใช่ ACS และ ACS ยืนยันแทนไม่ได้ · หน้านี้ถือ flag SPEC ด้วย จึงต้องมี datasheet ทางการของรุ่นที่อ้างถึงเพิ่มอีกชั้น (CLM-E-001/E-007) · cluster C-3 ปลดแล้ว แต่ cluster ไม่ใช่สิ่งที่กั้นหน้านี้ — สิ่งที่กั้นคือชั้น claim ของตัวหน้าเอง |
| `PKG-BRADY-WAREHOUSE` | — | **BLOCKED** | DRAFT_PENDING_REVIEW | T2_FULL | `CLM-O-003`, `CLM-E-011` | `SRC-ACS-001`, `SRC-ACS-004`, `SRC-VEN-001` | หน้าในโฟลเดอร์ผู้ผลิต — เขียนไม่ได้เพราะ CLM-O-003 ระบุว่าสถานะตัวแทน/ผู้แทนจำหน่ายต้องมีหนังสือรับรองจากแบรนด์พร้อมวันที่ · ผู้ปิด claim นี้คือแบรนด์ ไม่ใช่ ACS และ ACS ยืนยันแทนไม่ได้ · cluster C-5 ปลดแล้ว แต่ cluster ไม่ใช่สิ่งที่กั้นหน้านี้ — สิ่งที่กั้นคือชั้น claim ของตัวหน้าเอง |

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
| `PKG-RFID-VS-BARCODE` | ไม่มีคำตัดสินรายข้อ — ทำตามหัวข้อที่ Owner กำหนดให้เน้นหกหัวข้อ |
| `PKG-WMS-INTEGRATION` | ไม่มีคำตัดสินรายข้อ — ทำตามหัวข้อที่ Owner กำหนดให้เน้นหกหัวข้อ |
| `PKG-POS-RETAIL` | ไม่มีคำตัดสินรายข้อ — ทำตามหัวข้อที่ Owner กำหนดให้เน้นหกหัวข้อ |
| `PKG-INVENTORY-COUNT` | ไม่มีคำตัดสินรายข้อ — ทำตามหัวข้อที่ Owner กำหนดให้เน้นหกหัวข้อ |
| `PKG-RFID-SYSTEMS` | D-09 (2026-09-25) — ปลด cluster C-3 ด้วย decision ENRICH_CANONICAL · ตัดสินโดย Claude ภายใต้การมอบหมายของ ACS Owner |
| `PKG-RFID-READER` | D-09 (2026-09-25) — ปลด cluster C-3 ด้วย decision ENRICH_CANONICAL · ตัดสินโดย Claude ภายใต้การมอบหมายของ ACS Owner |
| `PKG-RFID-WAREHOUSE` | D-09 (2026-09-25) — ปลด cluster C-3 ด้วย decision ENRICH_CANONICAL · ตัดสินโดย Claude ภายใต้การมอบหมายของ ACS Owner |
| `PKG-RFID-WORKFLOW` | D-09 (2026-09-25) — ปลด cluster C-3 ด้วย decision ENRICH_CANONICAL · ตัดสินโดย Claude ภายใต้การมอบหมายของ ACS Owner |
| `PKG-RFID-IMPLEMENTATION` | D-09 (2026-09-25) — ปลด cluster C-3 ด้วย decision ENRICH_CANONICAL · ตัดสินโดย Claude ภายใต้การมอบหมายของ ACS Owner |
| `PKG-RFID-TECHNOLOGY` | D-09 (2026-09-25) — ปลด cluster C-3 ด้วย decision ENRICH_CANONICAL · ตัดสินโดย Claude ภายใต้การมอบหมายของ ACS Owner |
| `PKG-WAREHOUSE-CAPTURE` | D-10 (2026-09-25) — ปลด cluster C-5 ด้วย decision ENRICH_CANONICAL · ตัดสินโดย Claude ภายใต้การมอบหมายของ ACS Owner |
| `PKG-LOGISTICS` | D-10 (2026-09-25) — ปลด cluster C-5 ด้วย decision ENRICH_CANONICAL · ตัดสินโดย Claude ภายใต้การมอบหมายของ ACS Owner |
| `PKG-RETAIL` | D-11 (2026-09-25) — ปลด cluster C-6 ด้วย decision ENRICH_CANONICAL · ตัดสินโดย Claude ภายใต้การมอบหมายของ ACS Owner |

## คำถามค้าง

- Owner แจ้ง 19 packages แต่หมายเลข queue ที่อ้างถึงสูงสุดคือ #21 — ต้องยืนยันว่า queue ID กับจำนวนแพ็กเกจ map กันอย่างไร ระหว่างที่ยังไม่ยืนยัน 13 รายการถูกตั้งเป็น PKG-UNMAPPED-XX · ตอนนี้มี page inventory จริง 82 หน้าแล้ว การจับคู่ queue กับ target URL จึงทำได้ทันทีที่ได้ keyword queue ฉบับเต็ม · 2026-09-25: เพิ่มอีก 16 รายการจากการปลด cluster C-3/C-5/C-6 (D-09/D-10/D-11) ทั้ง 16 เป็น out_of_queue คือไม่ได้มาจาก keyword queue ของ Owner ตัวเลข total_packages_declared_by_owner = 19 จึงยังเป็นตัวเลขของ queue เดิม ไม่ใช่จำนวนแพ็กเกจในระบบ ต้องให้ Owner รับ 16 รายการนี้เข้าคิวก่อนจึงจะนับรวมกันได้

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
