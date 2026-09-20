#!/usr/bin/env node
/**
 * สร้างเอกสาร governance ที่เป็น "กระจก" ของไฟล์ข้อมูลใน data/
 * แก้ข้อมูลที่ data/*.json แล้วรัน `node tools/render-docs.mjs` — ห้ามแก้ไฟล์ที่ generate ด้วยมือ
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const BANNER = (src) => `<!-- GENERATED โดย tools/render-docs.mjs จาก ${src} — ห้ามแก้ไฟล์นี้ด้วยมือ -->\n`;
const cell = (v) => (v === null || v === undefined || v === '' ? '—' : String(v).replace(/\|/g, '\\|'));

const sources = readJson('data/source_pack.json');
const claims = readJson('data/claims.json');
const board = readJson('data/packages.json');
const gates = readJson('data/gates.json');
const queue = readJson('data/keyword_queue.json');

/* ---------- 00 Source Pack Index ---------- */
{
  const bySupplied = (s) => s.status === 'SUPPLIED';
  const lines = [
    BANNER('data/source_pack.json'),
    '# ACS SEO Source Pack Index',
    '',
    `ณ วันที่ **${sources.as_of}** — แหล่งข้อมูลกลางที่ทุก claim ต้อง map กลับมาได้`,
    '',
    `> ${sources.rule}`,
    '',
    `**สถานะรวม:** SUPPLIED ${sources.sources.filter(bySupplied).length} / PARTIAL ${sources.sources.filter((s) => s.status === 'PARTIAL').length} / NOT_SUPPLIED ${sources.sources.filter((s) => s.status === 'NOT_SUPPLIED').length} จากทั้งหมด ${sources.sources.length}`,
    '',
    '| ID | แหล่ง | ระดับความน่าเชื่อถือ | สถานะ | ผู้รับผิดชอบ | ปลดล็อก claim | หมายเหตุ |',
    '|---|---|---|---|---|---|---|',
    ...sources.sources.map((s) => `| \`${s.id}\` | ${cell(s.title)} | ${cell(s.authority)} | **${s.status}** | ${cell(s.owner)} | ${s.required_for.length ? s.required_for.map((c) => `\`${c}\``).join(', ') : '—'} | ${cell(s.note)} |`),
    '',
    '## แหล่งที่ยอมรับเป็นหลักฐานได้',
    '',
    sources.authority_whitelist.map((a) => `- \`${a}\``).join('\n'),
    '',
    'blog, ร้านค้าออนไลน์, marketplace, บทความ third-party, และผลลัพธ์จากการค้นหาทั่วไป **ไม่นับเป็นหลักฐาน**',
    '',
    '## Keyword queue (SRC-KW-001)',
    '',
    `สถานะ: **${queue.status}** — ${queue.completeness_note}`,
    '',
    '| Queue | Keyword | Intent | Target URL | Action | คำตัดสินของ Owner |',
    '|---|---|---|---|---|---|',
    ...queue.items.map((q) => `| #${q.queue_id} | ${cell(q.keyword)} | ${cell(q.intent)} | ${cell(q.target_url)} | ${cell(q.action)} | ${cell(q.owner_decision)} |`),
    '',
    'ช่องที่เป็น — คือ **ยังไม่ได้รับข้อมูล** ไม่ใช่ "ไม่มี" — ห้ามเติมด้วยการเดา',
    '',
  ];
  writeFileSync(join(ROOT, 'governance/00-SOURCE-PACK-INDEX.md'), lines.join('\n'));
}

/* ---------- 01 Claim Register ---------- */
{
  const order = ['SAFE_WORDING', 'EVIDENCE_REQUIRED', 'OWNER_REQUIRED', 'BLOCKED'];
  const lines = [
    BANNER('data/claims.json'),
    '# Claim Register กลาง',
    '',
    `ณ วันที่ **${claims.as_of}** — ทุกข้อความในแพ็กเกจที่ไม่ใช่ SAFE_WORDING ต้องอ้าง claim ID จากตารางนี้`,
    '',
    '| ประเภท | ความหมาย | จำนวน |',
    '|---|---|---|',
    ...order.map((k) => `| \`${k}\` | ${claims.classes[k]} | ${claims.claims.filter((c) => c.class === k).length} |`),
    '',
  ];
  for (const klass of order) {
    const rows = claims.claims.filter((c) => c.class === klass);
    lines.push(`## ${klass}`, '', `${claims.classes[klass]}`, '',
      '| ID | ข้อความ | หลักฐานที่ต้องมี | ข้อจำกัด | คำตัดสิน Owner |',
      '|---|---|---|---|---|',
      ...rows.map((c) => `| \`${c.id}\` | ${cell(c.statement)} | ${c.evidence.length ? c.evidence.map((e) => `\`${e}\``).join(', ') : '—'} | ${cell(c.constraint)} | ${cell(c.owner_decision)} |`),
      '');
  }
  lines.push('## กติกาการใช้',
    '',
    '1. ข้อความที่เข้าข่าย EVIDENCE_REQUIRED ใช้ได้เมื่อ `audit.json` อ้าง source ที่ `authority` เป็น OFFICIAL_VENDOR หรือ STANDARDS_BODY และ `status = SUPPLIED` และ `verified = true`',
    '2. ข้อความที่เข้าข่าย OWNER_REQUIRED ต้องเพิ่ม `owner_confirmed = true` ด้วย',
    '3. ข้อความที่เข้าข่าย BLOCKED ต้องถูกลบออกจากดราฟต์ และบันทึกการลบไว้ใน `claim_register.md` ของแพ็กเกจ',
    '4. ห้ามสร้าง claim ID ใหม่ในแพ็กเกจโดยไม่ขึ้นทะเบียนที่ `data/claims.json` ก่อน — validator จะ FAIL ด้วยรหัส `CLAIM_UNKNOWN`',
    '');
  writeFileSync(join(ROOT, 'governance/01-CLAIM-REGISTER.md'), lines.join('\n'));
}

/* ---------- 02 Package Status Board ---------- */
{
  const tally = {};
  for (const p of board.packages) tally[p.board_status] = (tally[p.board_status] ?? 0) + 1;
  const lines = [
    BANNER('data/packages.json'),
    '# Package Status Board',
    '',
    `ณ วันที่ **${board.as_of}** — ${board.packages.length} รายการ (Owner แจ้งไว้ ${board.total_packages_declared_by_owner})`,
    '',
    `> ${board.global_rule}`,
    '',
    `**สรุป:** ${board.board_status_enum.map((s) => `${s} = ${tally[s] ?? 0}`).join(' · ')}`,
    '',
    `**PASS = 0** — ยังไม่มีแพ็กเกจใดผ่านได้ เพราะ rendering gate อยู่ที่ \`${gates.gates['GATE-RENDER'].status}\` และ Source Pack ยังไม่ครบ`,
    '',
    '| Package | Queue | Board | Package status | QA tier | Flagged claims | ติดที่ source | เหตุผล |',
    '|---|---|---|---|---|---|---|---|',
    ...board.packages.map((p) => `| \`${p.package_id}\` | ${p.queue_id ? '#' + p.queue_id : '—'} | **${p.board_status}** | ${p.package_status} | ${p.qa_tier} | ${p.flagged_claims.length ? p.flagged_claims.map((c) => `\`${c}\``).join(', ') : '—'} | ${p.blocked_on_sources.length ? p.blocked_on_sources.map((s) => `\`${s}\``).join(', ') : '—'} | ${cell(p.board_reason)} |`),
    '',
    '## คำตัดสินของ Owner ที่บันทึกไว้',
    '',
    '| Package | คำตัดสิน |',
    '|---|---|',
    ...board.packages.filter((p) => p.owner_decision).map((p) => `| \`${p.package_id}\` | ${cell(p.owner_decision)} |`),
    '',
    '## คำถามค้าง',
    '',
    `- ${board.open_question}`,
    '',
    '## สถานะ gate ส่วนกลาง',
    '',
    '| Gate | สถานะ | ผู้รับผิดชอบ | หลักฐานที่ต้องมี |',
    '|---|---|---|---|',
    ...Object.entries(gates.gates).map(([id, g]) => `| \`${id}\` ${g.name} | **${g.status}** | ${cell(g.owner)} | ${g.evidence_source ? `\`${g.evidence_source}\`` : '—'} |`),
    '',
    '## เงื่อนไขก่อน publish (ต้องครบทุกข้อ)',
    '',
    ...gates.publish_preconditions.map((p) => `- [ ] \`${p}\``),
    '',
  ];
  writeFileSync(join(ROOT, 'governance/02-PACKAGE-STATUS-BOARD.md'), lines.join('\n'));
}

console.log('rendered: governance/00-SOURCE-PACK-INDEX.md, 01-CLAIM-REGISTER.md, 02-PACKAGE-STATUS-BOARD.md');
