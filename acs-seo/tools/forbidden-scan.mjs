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

export const SITE_ORIGIN = 'https://www.asiancoding.com';

/*
 * ทำไมต้องยกเว้น "ที่อยู่" ออกจากการสแกนถ้อยคำ
 *
 * URL ของเว็บเราเองสิบเส้นมีสตริงที่ตรงกฎอยู่ข้างใน — /knowledge/implementation-best-practices
 * ชน \bbest\b (severity BLOCK) · /esg-solutions ชน esg · /brady/* กับ /honeywell-* กับ /tsc-*
 * ชนชื่อผู้ผลิต ผลคือเนื้อบทความลิงก์ไปสิบหน้านี้ของเราเองไม่ได้เลย และแก้ด้วยการเขียนใหม่ไม่ได้
 * เพราะสิ่งที่ผิดไม่ใช่ข้อความ แต่เป็นที่อยู่ของหน้า
 *
 * ขอบเขตการยกเว้นแคบโดยตั้งใจ — ยกเว้นเฉพาะเมื่อเป็น **ที่อยู่** จริง ๆ สองแบบ
 *   1. URL เต็มที่ขึ้นต้นด้วย origin ของเรา — ที่ไหนก็ได้ รวมทั้งใน JSON ของ schema
 *   2. path ล้วน (เช่น /brady) — เฉพาะเมื่ออยู่ในตำแหน่งเป้าหมายของลิงก์เท่านั้น
 *
 * ข้อ 2 ต้องแคบแบบนี้เพราะ /brady, /honeywell-barcode-scanner, /tsc-barcode-printer
 * **คือชื่อผู้ผลิตที่มีสแลชนำหน้า** ถ้ายกเว้นทุกที่ที่สตริงนี้โผล่ ประโยคอย่าง
 * "เครื่องพิมพ์ /brady รุ่นนี้เหมาะกับงานคลัง" จะรอด ซึ่งเป็นการเอ่ยชื่อผู้ผลิตโดยไม่มีหลักฐาน
 * — ตรงกับสิ่งที่ FW-E-009 มีไว้กันพอดี
 */

/** ตัด fragment กับ query ออก แล้วทำให้เป็น URL เต็ม เพื่อเทียบกับ page inventory ได้ */
export function canonicalizeTarget(raw) {
  let u = String(raw ?? '').trim().replace(/^<|>$/g, '');
  u = u.split('#')[0].split('?')[0];
  if (!u) return null;
  if (u.startsWith(SITE_ORIGIN)) u = u.slice(SITE_ORIGIN.length) || '/';
  else if (!u.startsWith('/')) return null; // ลิงก์นอกเว็บ · mailto: · anchor ล้วน — ไม่ใช่เรื่องของเรา
  try { u = decodeURI(u); } catch { /* slug ที่ encode มาผิดรูป ปล่อยไว้ตามเดิม */ }
  if (u.length > 1 && u.endsWith('/')) u = u.slice(0, -1);
  return SITE_ORIGIN + u;
}

const mergeSpans = (spans) => {
  const out = [];
  for (const [s, e] of [...spans].sort((a, b) => a[0] - b[0] || a[1] - b[1])) {
    const last = out[out.length - 1];
    if (last && s <= last[1]) last[1] = Math.max(last[1], e);
    else out.push([s, e]);
  }
  return out;
};

/**
 * หาที่อยู่ทั้งหมดในข้อความ
 *
 *   spans   — ช่วงที่เป็น "ที่อยู่" ไม่ใช่ถ้อยคำ (รวมรูปภาพและลิงก์ออกนอกเว็บ)
 *   targets — เฉพาะ **ลิงก์** ที่ชี้เข้าเว็บเรา (ไม่รวมรูปภาพ) สำหรับเอาไปตรวจว่าประกาศไว้ไหม
 */
export function findLinks(text) {
  const spans = [];
  const targets = [];
  const add = (start, raw, { isLink }) => {
    spans.push([start, start + raw.length]);
    if (!isLink) return;
    const url = canonicalizeTarget(raw);
    if (url) targets.push({ url, raw, start });
  };

  // [ข้อความ](url) · [ข้อความ](url "ชื่อ") · ![alt](url) — รูปภาพยกเว้นการสแกน แต่ไม่นับเป็นลิงก์
  for (const m of text.matchAll(/(!?)\[[^\]\n]*\]\(\s*(<[^>\n]*>|[^\s)\n]+)/g)) {
    add(m.index + m[0].length - m[2].length, m[2], { isLink: m[1] !== '!' });
  }
  // [id]: url   (reference-style)
  for (const m of text.matchAll(/^[ \t]*\[[^\]\n]+\]:[ \t]*(\S+)/gm)) {
    add(m.index + m[0].length - m[1].length, m[1], { isLink: true });
  }
  // href="..." / src="..."
  for (const m of text.matchAll(/\b(href|src)\s*=\s*["']([^"'\n]*)["']/gi)) {
    add(m.index + m[0].indexOf(m[2]), m[2], { isLink: m[1].toLowerCase() === 'href' });
  }
  // <https://...>  autolink
  for (const m of text.matchAll(/<(https?:\/\/[^>\s]+)>/g)) {
    add(m.index + 1, m[1], { isLink: true });
  }
  /* URL เต็มที่โผล่ลอย ๆ (เช่นใน JSON ของ schema หรือใน meta.canonical) — เป็นที่อยู่เสมอ
     จึงยกเว้นการสแกน แต่ไม่นับเป็นลิงก์ เพราะไม่ควรบังคับให้ URL ใน schema ไปอยู่ใน internal_links */
  for (const m of text.matchAll(/https?:\/\/[^\s"'<>)\]]+/g)) {
    add(m.index, m[0], { isLink: false });
  }
  return { spans: mergeSpans(spans), targets };
}

/**
 * ช่วงที่ได้รับการยกเว้นจากการสแกน = ที่อยู่ที่ "ชี้ไปหน้าที่มีอยู่จริง" เท่านั้น
 *
 * การผูกกับ inventory ทำให้ slug ที่แต่งขึ้นเอง เช่น `](/brady-best-printers)` ไม่ถูกยกเว้น
 * จึงยังตกกฎที่คำว่า best เหมือนเดิม
 */
export function exemptSpans(text, knownUrls) {
  const { spans } = findLinks(text);
  return spans.filter(([s, e]) => {
    const url = canonicalizeTarget(text.slice(s, e));
    return url !== null && knownUrls.has(url);
  });
}

/*
 * แทนช่วงที่ยกเว้นด้วย NUL ที่ยาวเท่าเดิม ไม่ใช่ตัดข้อความเป็นท่อน
 *
 * สองเหตุผล — ตำแหน่งของ match ยังตรงกับข้อความต้นฉบับทุกไบต์ ทำให้ --fix เขียนทับได้ถูกที่
 * และกฎที่มีตัวคั่น [^\n.·]{0,24} (เช่น FW-B-005) ยังจับข้ามช่วง URL ได้เหมือนเดิม
 * เพราะ NUL ยังนับเป็นอักขระที่ตัวคั่นยอมรับ ถ้าตัดเป็นท่อนจะเสียการจับข้ามช่วงไปเงียบ ๆ
 */
export const maskSpans = (text, spans) =>
  spans.reduce((acc, [s, e]) => acc.slice(0, s) + '\0'.repeat(e - s) + acc.slice(e), text);

/**
 * สแกนข้อความหนึ่งก้อนด้วยกฎทั้งชุด
 *
 * คืน hit ต่อกฎที่จับได้ พร้อม matches ที่ตัดซ้ำแล้ว **ไม่ตัดจำนวน** — ผู้เรียกตัดสินเองว่าจะแสดงกี่รายการ
 * (validate ตัดที่ 8 เพื่อไม่ให้ข้อความ finding ยาวเกิน) และ `spans` ของทุก match ไว้ให้ --fix ใช้
 *
 * ข้อความที่รายงานถูกตัดมาจาก **ต้นฉบับ** ไม่ใช่จากฉบับที่ถูก mask เพื่อไม่ให้ NUL โผล่ในรายงาน
 */
export function scanForbidden(text, rules, skip = []) {
  const masked = skip.length ? maskSpans(text, skip) : text;
  const hits = [];
  for (const rule of rules) {
    const found = [...masked.matchAll(rule.re)];
    if (found.length === 0) continue;
    const spans = found.map((m) => [m.index, m.index + m[0].length]);
    hits.push({
      rule_id: rule.id,
      severity: rule.severity,
      claim_ref: rule.claim_ref,
      message: rule.message,
      matches: [...new Set(spans.map(([s, e]) => text.slice(s, e)))],
      spans,
    });
  }
  return hits;
}
