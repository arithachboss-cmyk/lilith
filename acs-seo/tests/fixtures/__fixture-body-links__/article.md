<!-- __fixture-body-links__ — ข้อมูลทดสอบ ไม่ใช่เนื้อหาเผยแพร่ -->

# หลักการเลือกระหว่างบาร์โค้ด 1D และ 2D ให้เหมาะกับงาน

บาร์โค้ด 1D และ 2D ต่างกันที่รูปแบบการเก็บข้อมูลและความจุข้อมูลที่รองรับ <!-- claim: CLM-S-003 -->

## ลิงก์ที่ประกาศไว้แล้ว — ต้องผ่าน

อ่านพื้นฐานที่ [เทคโนโลยีบาร์โค้ด](https://www.asiancoding.com/knowledge/barcode-technology)

## ลิงก์ที่มีอยู่จริงแต่ไม่ได้ประกาศใน meta — ต้อง FAIL ด้วย BODY_LINK_UNDECLARED

ดูเพิ่มที่ [เครื่องพิมพ์](https://www.asiancoding.com/barcode-printers)

## ลิงก์ที่ไม่มีอยู่ในเว็บเลย — ต้อง FAIL ด้วย BODY_LINK_UNKNOWN

ดูเพิ่มที่ [หน้าที่ไม่มีจริง](https://www.asiancoding.com/knowledge/does-not-exist)

## ลิงก์ไปหน้าที่ถือ flag เสี่ยง — ประกาศไว้แล้ว ต้องไม่ FAIL แต่ต้องดัน tier เป็น T2_FULL

ดูเพิ่มที่ [ริบบอน](https://www.asiancoding.com/barcode-ribbons)

## URL ของหน้าที่มีอยู่จริงต้องไม่ถูกอ่านเป็นถ้อยคำ — ต้องไม่เกิด FORBIDDEN_BLOCK

URL ของหน้านี้มีคำที่กฎ FW-B-001 จับอยู่ข้างใน [แนวทาง](https://www.asiancoding.com/knowledge/implementation-best-practices)

## รูปภาพต้องไม่ถูกนับเป็นลิงก์

![แผนภาพ](https://www.asiancoding.com/knowledge/regional-solutions)

<!-- CTA: ปรึกษาทีมงานเพื่อประเมินหน้างาน -->
