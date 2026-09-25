#!/usr/bin/env node
/**
 * ปิดตัวเลข/ข้อความที่ Claim Register จัดเป็น BLOCK ในดราฟต์ โดยทิ้ง marker ไว้ให้เห็น
 *
 * ทำไมต้องทิ้ง marker แทนการลบเงียบ ๆ: ถ้าลบตัวเลขออกเฉย ๆ ประโยคจะยังอ่านเหมือนมีตัวเลข
 * อยู่ตรงนั้น แล้วไม่มีใครเห็นรูโหว่ คนเขียนต้องกลับมาเรียบเรียงประโยคใหม่เองเสมอ
 *
 *   node tools/redact.mjs <file|dir> [...]          รายงานอย่างเดียว exit 1 ถ้าพบ BLOCK
 *   node tools/redact.mjs <path> --fix              แทนที่ข้อความ BLOCK ในไฟล์จริง
 *   node tools/redact.mjs <path> --json             ผลลัพธ์เป็น JSON
 *
 * กฎมาจาก data/forbidden_terms.json ชุดเดียวกับ validate.mjs — ไม่มีกฎซ้อนในไฟล์นี้
 * severity OWNER และ EVIDENCE จะถูก "รายงาน" เท่านั้น ไม่แก้อัตโนมัติ: ราคากับการจัดอันดับ
 * ไม่ได้แก้ด้วยการลบตัวเลข
 */
import { readFileSync, writeFileSync, statSync, readdirSync } from 'node:fs';
import { loadRules, scanForbidden, exemptSpans } from './forbidden-scan.mjs';
import { join, extname, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const targets = args.filter((a) => !a.startsWith('--'));
// .html และ .htm อยู่ในนี้เพราะเป็นไฟล์ที่ขึ้นเว็บจริง — ถ้าไม่สแกน ไฟล์ที่สำคัญที่สุดจะเป็นไฟล์เดียวที่ไม่มีใครตรวจ
const SCANNABLE = ['.md', '.markdown', '.txt', '.json', '.jsonld', '.html', '.htm'];

if (targets.length === 0) {
  console.error('ใช้: node tools/redact.mjs <file|dir> [...] [--fix] [--json]');
  process.exit(2);
}

const rules = loadRules(join(ROOT, 'data/forbidden_terms.json'));
const marker = (claimRef) => `⟦ลบ ${claimRef[0]} — รอหลักฐาน⟧`;
const MARKER_RE = /⟦ลบ [^⟧]*⟧/g;

/* หน้าที่มีอยู่จริงบนเว็บ — ใช้ตัดสินว่าที่อยู่ไหนเป็นที่อยู่จริง จึงยกเว้นจากการสแกนถ้อยคำได้
   ถ้าไฟล์ยังไม่มีหรืออ่านไม่ได้ ให้ถือว่าไม่รู้จัก URL ใดเลย ซึ่งเข้มกว่า ไม่ใช่หลวมกว่า */
const knownUrls = (() => {
  try {
    const inv = JSON.parse(readFileSync(join(ROOT, 'data/page_inventory.json'), 'utf8'));
    return new Set((inv.pages ?? []).map((p) => p.url));
  } catch { return new Set(); }
})();

/** ช่วงที่ห้ามแตะ = ที่อยู่ของหน้าจริง + marker ที่เคยใส่ไว้แล้ว (เพื่อให้ --fix รันซ้ำได้ผลเท่าเดิม) */
const protectedSpans = (text) => [
  ...exemptSpans(text, knownUrls),
  ...[...text.matchAll(MARKER_RE)].map((m) => [m.index, m.index + m[0].length]),
];

function collect(target, out = []) {
  const st = statSync(target);
  if (st.isDirectory()) for (const e of readdirSync(target)) collect(join(target, e), out);
  else if (SCANNABLE.includes(extname(target))) out.push(target);
  return out;
}

const results = [];
let blockedTotal = 0, redactedTotal = 0;

for (const target of targets) {
  for (const file of collect(target)) {
    const original = readFileSync(file, 'utf8');
    let text = original;
    const findings = [];

    /* รายงานกับการแก้ต้องใช้ผลสแกนชุดเดียวกัน ถ้ายกเว้นเฉพาะตอน --fix แต่ยังนับตอนรายงาน
       blockedTotal จะค้างเป็นบวกตลอดไป แล้ว redact ธรรมดาจะ exit 1 ไม่มีวันจบ */
    const hits = scanForbidden(text, rules, protectedSpans(text));
    for (const hit of hits) {
      findings.push(hit);
      if (hit.severity === 'BLOCK') blockedTotal += hit.matches.length;
    }

    if (flags.has('--fix')) {
      /* เขียนทับจากท้ายไปหน้า เพื่อให้ตำแหน่งที่ยังไม่ถึงไม่ขยับ
         วิธีนี้แทนการ split/rejoin เดิม ซึ่งพึ่งพาว่าจำนวน marker ตรงกับจำนวนท่อนพอดี */
      const edits = hits
        .filter((h) => h.severity === 'BLOCK')
        .flatMap((h) => h.spans.map(([s, e]) => ({ s, e, claim_ref: h.claim_ref })))
        .sort((a, b) => b.s - a.s);
      for (const ed of edits) {
        text = text.slice(0, ed.s) + marker(ed.claim_ref) + text.slice(ed.e);
        redactedTotal++;
      }
      if (text !== original) writeFileSync(file, text);
    }

    if (findings.length) results.push({ file: file.replace(ROOT + '/', ''), findings, changed: text !== original });
  }
}

if (flags.has('--json')) {
  console.log(JSON.stringify({ blocked: blockedTotal, redacted: redactedTotal, fix: flags.has('--fix'), results }, null, 2));
} else {
  for (const r of results) {
    console.log(`\n${r.file}${r.changed ? '  (แก้ไขแล้ว)' : ''}`);
    for (const f of r.findings) {
      const action = f.severity === 'BLOCK' ? (flags.has('--fix') ? 'ปิดแล้ว' : 'ต้องลบ') : 'รายงานให้คนตัดสิน';
      console.log(`   ${f.severity.padEnd(9)} ${f.rule_id.padEnd(10)} ${action.padEnd(18)} [${f.matches.join(' | ')}]`);
      console.log(`   ${' '.repeat(9)} ${' '.repeat(10)} ${f.message}`);
    }
  }
  if (results.length === 0) console.log('ไม่พบข้อความที่ต้องจัดการ');
  else console.log(`\nBLOCK ที่พบ ${blockedTotal} รายการ${flags.has('--fix') ? ` · ปิดไปแล้ว ${redactedTotal}` : ''}`);
  if (!flags.has('--fix') && blockedTotal) console.log('รัน --fix เพื่อปิดข้อความ BLOCK แล้วให้คนเขียนเรียบเรียงประโยคที่มี marker ใหม่');
}

process.exit(blockedTotal > 0 && !flags.has('--fix') ? 1 : 0);
