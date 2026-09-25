# Rendering Gate

สถานะปัจจุบัน: **FAIL**

www.asiancoding.com ยังเป็น client-side rendered ตามที่ Owner แจ้ง จึง **ห้ามนับว่าแพ็กเกจใด "พร้อม SEO"** และห้ามคาดหวังว่าเนื้อหาจะถูก index จริง จนกว่า gate นี้จะผ่าน

## ผู้รับผิดชอบ

**Manus** เป็นผู้ตัดสินแนวทาง SSR / prerender — งาน content ไม่ตัดสินแทน

## หลักฐานที่ต้องมีก่อนเปลี่ยนสถานะเป็น PASS

- [ ] `SRC-WEB-003` — รายงาน rendering mode ปัจจุบัน ระบุว่าหน้าใดเป็น CSR / SSR / prerender
- [ ] แนวทางที่เลือก (SSR, prerender, hybrid) พร้อมเหตุผล
- [ ] หลักฐานว่า HTML ที่ส่งกลับจาก server มีเนื้อหาและ metadata ครบก่อน JavaScript ทำงาน
- [ ] หลักฐานว่า canonical, title, meta description, schema อยู่ใน HTML ชุดแรก
- [ ] Owner รับทราบและอนุมัติ

## ผลกระทบระหว่างที่ยัง FAIL

- ทุกแพ็กเกจคง `robots: noindex,nofollow` — validator จะ FAIL ถ้ามีใครเปลี่ยนเป็น index
- `publish_allowed` ต้องเป็น `false` เสมอ
- แพ็กเกจที่ผ่านภาษาแล้วได้แค่สถานะ `WORDING_QA_OK` ไม่ใช่ "พร้อมขึ้น"
- ห้าม deploy, ห้ามเปลี่ยน DNS, ห้ามเปิด traffic

## วิธีเปลี่ยนสถานะ

แก้ `data/gates.json` → `GATE-RENDER.status` แล้วรัน `node tools/render-docs.mjs`
การเปลี่ยนสถานะต้องมีหลักฐานครบตามรายการด้านบนเท่านั้น
