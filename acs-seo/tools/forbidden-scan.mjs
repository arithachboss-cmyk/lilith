/**
 * ตัวสแกนคำต้องห้ามที่ validate.mjs กับ redact.mjs ใช้ร่วมกัน
 *
 * ก่อนหน้านี้ทั้งสองไฟล์ต่างคนต่างสร้าง RegExp จาก data/forbidden_terms.json ด้วยโค้ดชุดเดียวกัน
 * คนละก๊อป การแก้พฤติกรรมการสแกนจึงต้องแก้สองที่ให้ตรงกัน ซึ่งเป็นจุดที่จะเพี้ยนกันในอนาคต
 *
 * เรื่อง lastIndex — RegExp ที่มีธง g เก็บสถานะ lastIndex ไว้ในตัวมันเอง ถ้าเอา object เดียว
 * ไปใช้ข้ามข้อความหลายก้อนด้วย .test() ผลจะสลับถูกสลับผิดตามรอบที่เรียก โมดูลนี้จึงใช้เฉพาะ
 * matchAll() ซึ่งสร้างสำเนาของ RegExp ขึ้นใหม่ตามสเปก และ **ห้ามใช้ .test() กับกฎเหล่านี้**
 */
import { readFileSync } from 'node:fs';

/** อ่านไฟล์กฎแล้วคอมไพล์ regex ครั้งเดียว */
export function loadRules(forbiddenPath) {
  const doc = JSON.parse(readFileSync(forbiddenPath, 'utf8'));
  return doc.rules.map((r) => ({ ...r, re: new RegExp(r.pattern, 'giu') }));
}

/**
 * สแกนข้อความหนึ่งก้อนด้วยกฎทั้งชุด
 *
 * คืนรายการ hit ต่อกฎที่จับได้ พร้อม matches ที่ตัดซ้ำแล้ว **ไม่ตัดจำนวน** —
 * ผู้เรียกเป็นคนตัดสินเองว่าจะแสดงกี่รายการ (validate ตัดที่ 8 เพื่อไม่ให้ข้อความ finding ยาวเกิน)
 */
export function scanForbidden(text, rules) {
  const hits = [];
  for (const rule of rules) {
    const found = [...text.matchAll(rule.re)].map((m) => m[0]);
    if (found.length === 0) continue;
    hits.push({
      rule_id: rule.id,
      severity: rule.severity,
      claim_ref: rule.claim_ref,
      message: rule.message,
      matches: [...new Set(found)],
    });
  }
  return hits;
}
