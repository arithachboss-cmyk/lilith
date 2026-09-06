# Lilith Homes User Simulation QA

วันที่ทดสอบ: 2026-09-03 (Asia/Bangkok)

## Scope

จำลองผู้ใช้ 10 เคสบนหน้า public lead form ของ Lilith Homes ที่ `http://localhost:3000/` โดยโฟกัสลูกค้าต่างประเทศและพาร์ตเนอร์ส่ง lead:

- ลูกค้าจีนที่ใช้ WeChat
- ผู้เช่าต่างชาติ 12 เดือน
- ลูกค้าซื้อคอนโด
- เจ้าของฝากขาย
- relocation partner ส่งลูกค้าองค์กร
- เคสเสียที่ควรถูกกันก่อนส่ง

## Findings Before Fix

ผลรอบแรกหลังจำลอง: ผ่าน 2/10

- 8 เคสที่ควรบันทึกเป็น lead ถูกปฏิเสธ เพราะ API ล้มเป็น `500`
- สาเหตุหลักคือ D1 local table เป็น schema เก่า และโค้ดสร้าง index `external_id` ก่อนเพิ่มคอลัมน์ `external_id`
- ฟอร์มยังบังคับช่อง `โทร / Email / LINE` ทั้งที่ลูกค้าต่างชาติบางรายมีแค่ WeChat หรือพาร์ตเนอร์มีช่องทางติดต่อของตัวเอง

## Fixes Applied

- ปรับ public form เป็น `noValidate` เพื่อให้แสดง validation message ที่ควบคุมเองและเข้าใจง่ายกว่า browser default
- เอา `required` ออกจากช่อง `publicContact`
- เพิ่ม validation ฝั่งหน้าเว็บให้รับช่องทางติดต่ออย่างน้อยหนึ่งช่องจาก `contact`, `wechat`, หรือ `partnerContact`
- เพิ่ม validation หน้าเว็บเรื่องงบและสัญญา 12 เดือนให้ตรงกับ API
- แก้ลำดับ `ensureLeadSchema()` ให้เพิ่มคอลัมน์ optional ก่อนสร้าง index `external_id`
- เพิ่ม regression test กันปัญหานี้กลับมาอีก

## Results After Fix

ผลรอบ UI simulation ล่าสุด: ผ่าน 10/10

| # | User Simulation | Expected | Result |
|---|---|---:|---:|
| 1 | China renter via WeChat only | Success | Pass |
| 2 | US executive renter | Success | Pass |
| 3 | Russian family renter | Success | Pass |
| 4 | Chinese condo buyer | Success | Pass |
| 5 | Thai owner listing property | Success | Pass |
| 6 | Relocation partner sends corporate tenant | Success | Pass |
| 7 | Luxury villa inquiry | Success | Pass |
| 8 | Pattaya townhouse renter | Success | Pass |
| 9 | Bad lead with no contact method | Validation block | Pass |
| 10 | Bad rental term mismatch | Validation block | Pass |

Browser console errors after the successful run: 0

Additional API checks:

- WeChat-only lead: HTTP 201
- Contact-only lead: HTTP 201
- Partner-contact-only lead: HTTP 201

## Evaluation

ระบบพร้อมรับ lead จากต่างประเทศดีขึ้น เพราะไม่บังคับช่องทางติดต่อแบบไทยช่องเดียวแล้ว และรองรับ flow ที่สำคัญต่อ growth:

- ลูกค้าจีนหรือ agent จีนส่ง WeChat ได้
- relocation partner ส่ง lead ได้แม้ไม่มีเบอร์ลูกค้าโดยตรง
- ลูกค้าเช่า 12 เดือนถูกคัดตามงบและสัญญา
- เคสไม่มีช่องทางติดต่อหรือข้อมูลเช่าผิดถูกกันก่อนบันทึก

ข้อจำกัดจาก automation: เครื่องมือ browser automation ไม่สามารถกรอกบางช่องที่ชื่อเหมือนข้อมูลติดต่อได้ครบทุกครั้ง จึงใช้ WeChat field สำหรับ UI run และยืนยัน `contact` กับ `partnerContact` เพิ่มผ่าน API โดยตรง.
