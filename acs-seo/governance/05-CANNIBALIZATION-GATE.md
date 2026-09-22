# Cannibalization Gate

ต้องผ่าน gate นี้ **ก่อนเขียน** ทุกแพ็กเกจ ไม่ใช่ตรวจตอนจบ

สถานะปัจจุบัน: **OPEN_WITH_FINDINGS** — page inventory จริง 82 หน้าพร้อมแล้ว และพบ **8 cluster ที่หน้าเดิมชนกันเอง รวม 45 URL** ยังไม่มี cluster ใดมีหน้าหลัก

ตารางเต็มอยู่ใน [`07-SITE-INVENTORY.md`](07-SITE-INVENTORY.md) · ข้อมูลดิบอยู่ใน `data/cannibalization_clusters.json`

## ขั้นตอน

1. ระบุ **canonical intent** ของแพ็กเกจเป็นหนึ่งประโยค: หน้านี้ตอบอะไร และจงใจ **ไม่** ตอบอะไร
2. เช็กว่า `target_url` ตกอยู่ใน cluster ใดหรือไม่ — `node tools/validate.mjs` ทำให้อัตโนมัติ และจะ FAIL ถ้าตกอยู่ใน cluster ที่ยังไม่มี `canonical_owner`
3. ถ้าไม่อยู่ใน cluster ใด และไม่มีหน้าเดิมที่ intent ใกล้เคียง → ผ่าน gate
4. ถ้าอยู่ใน cluster ให้ Owner ตัดสินก่อน แล้วบันทึกลง `data/cannibalization_clusters.json`:

| ทางเลือก | ใช้เมื่อ | ผลที่ต้องทำ |
|---|---|---|
| **ENRICH_CANONICAL** | intent เดียวกัน หน้าเดิมมีสิทธิ์จัดอันดับอยู่แล้ว | `action = ENRICH`, `target_url` = หน้าหลักของ cluster, ห้ามสร้าง URL ใหม่ |
| **NEW_WITH_DISTINCT_INTENT** | intent แยกกันได้จริงและอธิบายเป็นประโยคได้ | ตั้ง `canonical_owner` ของ cluster ก่อน แล้วเขียน canonical intent ของทั้งสองหน้าใหม่ให้ไม่ทับกัน |
| **REDIRECT** | หน้าสองหน้าพูดเรื่องเดียวกันจริง ๆ | redirect หน้ารองไปหน้าหลัก แล้วอัปเดต sitemap |
| **HOLD** | แยก intent ไม่ออก หรือต้องให้ Owner ตัดสิน | `action = HOLD`, `board_status = HOLD`, หยุดเขียนทันที |

5. บันทึกผู้ตัดสินและวันที่ใน `brief.md` และใน `cannibalization_clusters.json` ทุกครั้ง

## สิ่งที่พบบนเว็บปัจจุบัน

| Cluster | เรื่อง | URL ที่ชนกัน |
|---|---|---|
| C-1 | Barcode scanner (คำค้นเชิงพาณิชย์ทั่วไป) | **10** |
| C-3 | RFID | 7 |
| C-2 | Barcode printer | 6 |
| C-5 | Warehouse / logistics | 6 |
| C-4 | Manufacturing | 5 |
| C-7 | การเลือก / เปรียบเทียบเครื่องอ่าน | 5 |
| C-6 | Retail | 4 |
| C-8 | Partner ecosystem | 2 |

- **C-1 หนักที่สุด** — 10 URL ยิง head term เดียวกัน Queue #3 ที่ Owner สั่ง HOLD อยู่ใน cluster นี้
- **C-8 ถูกที่สุด** — 2 URL ที่ดูจะพูดเรื่องเดียวกัน แก้ด้วย redirect เส้นเดียว

## กติกาที่ห้ามละเมิด

- ห้ามเริ่มเขียนแพ็กเกจที่ `action = HOLD`
- ห้ามสร้างหน้าใหม่ใน cluster ที่ยังไม่มี `canonical_owner` — validator จะ FAIL ด้วยรหัส `CANNIBAL_UNRESOLVED`
- ห้ามสร้าง URL ใหม่เพื่อเลี่ยงการตัดสินใจ ENRICH
- ห้ามตั้ง canonical ชี้ข้ามหน้าโดยไม่บันทึกเหตุผล
