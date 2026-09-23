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

const forbidden = JSON.parse(readFileSync(join(ROOT, 'data/forbidden_terms.json'), 'utf8'));
const rules = forbidden.rules.map((r) => ({ ...r, re: new RegExp(r.pattern, 'giu') }));
const marker = (rule) => `⟦ลบ ${rule.claim_ref[0]} — รอหลักฐาน⟧`;
const MARKER_RE = /⟦ลบ [^⟧]*⟧/g;

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

    for (const rule of rules) {
      rule.re.lastIndex = 0;
      const hits = [...text.matchAll(rule.re)].map((m) => m[0]);
      if (hits.length === 0) continue;
      const unique = [...new Set(hits)];
      findings.push({ rule_id: rule.id, severity: rule.severity, claim_ref: rule.claim_ref, message: rule.message, matches: unique });
      if (rule.severity === 'BLOCK') blockedTotal += unique.length;
    }

    if (flags.has('--fix')) {
      // ข้ามข้อความที่ถูก redact ไปแล้ว เพื่อให้รันซ้ำได้โดยผลไม่เปลี่ยน
      const guarded = text.split(MARKER_RE);
      const markers = text.match(MARKER_RE) ?? [];
      const fixedParts = guarded.map((part) => {
        let p = part;
        for (const rule of rules) {
          if (rule.severity !== 'BLOCK') continue;
          rule.re.lastIndex = 0;
          p = p.replace(rule.re, () => { redactedTotal++; return marker(rule); });
        }
        return p;
      });
      text = fixedParts.reduce((acc, part, i) => acc + part + (markers[i] ?? ''), '');
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
