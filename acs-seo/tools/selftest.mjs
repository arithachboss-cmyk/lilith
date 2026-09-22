#!/usr/bin/env node
/**
 * ตรวจว่าระบบ governance ยังทำงานจริง ไม่ใช่แค่มีไฟล์อยู่
 * รัน: node acs-seo/tools/selftest.mjs
 *
 * ชุดที่สำคัญที่สุดคือ "กฎทุกข้อยังมีชีวิต" — กฎที่ regex ตายเงียบ ๆ คือ gate ที่ไร้ค่า
 * และเคยเกิดขึ้นจริงมาแล้ว: \b ใน JavaScript เป็น ASCII ล้วน ทำให้กฎที่ลงท้ายด้วยหน่วยไทย
 * ไม่เคย match อะไรเลยทั้งที่ดูเหมือนถูกต้อง
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, copyFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const VALIDATE = join(ROOT, 'tools/validate.mjs');
const REDACT = join(ROOT, 'tools/redact.mjs');
const readJson = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));

const failures = [];
const check = (name, cond, detail = '') => {
  console.log(`${cond ? 'ok  ' : 'FAIL'}  ${name}${cond || !detail ? '' : ` — ${detail}`}`);
  if (!cond) failures.push(name);
};
function run(bin, extra) {
  try { return JSON.parse(execFileSync(process.execPath, [bin, ...extra], { encoding: 'utf8' })); }
  catch (err) { return JSON.parse(err.stdout); }  // exit 1 เมื่อพบปัญหาเป็นพฤติกรรมที่ถูกต้อง
}
const tmp = mkdtempSync(join(tmpdir(), 'acs-qa-'));

/* ── 1. กฎทุกข้อยังมีชีวิต ───────────────────────────────────────── */
{
  const { rules } = readJson('data/forbidden_terms.json');
  const dead = [];
  let samples = 0;
  for (const r of rules) {
    check(`${r.id} มีตัวอย่าง must_match`, Array.isArray(r.must_match) && r.must_match.length > 0);
    for (const s of r.must_match ?? []) {
      samples++;
      const re = new RegExp(r.pattern, 'giu');
      if (!re.test(s)) dead.push(`${r.id} ไม่จับ ${JSON.stringify(s)}`);
    }
  }
  check(`กฎทั้ง ${rules.length} ข้อจับตัวอย่างของตัวเองได้ครบ ${samples} ตัวอย่าง`, dead.length === 0, dead.join(' · '));
  const thaiUnit = rules.find((r) => r.id === 'FW-E-002');
  check('กฎหน่วยไทยจับ "ระยะอ่าน 3 เมตร" ได้ (บั๊ก \\b ที่เคยทำให้กฎตาย)',
    new RegExp(thaiUnit.pattern, 'giu').test('ระยะอ่าน 3 เมตร'));
  const asciiB = rules.filter((r) => /[฀-๿]\\b/.test(r.pattern));
  check('ไม่มีกฎไหนใส่ \\b ต่อท้ายตัวอักษรไทย', asciiB.length === 0, asciiB.map((r) => r.id).join(', '));
}

/* ── 1b. กฎราคาต้องครอบคลุมทุกรูปแบบที่เขียนกันจริง ───────────────
   Owner decision Queue #16/#18 จะมีผลก็ต่อเมื่อกฎจับได้ทุกวิธีเขียนราคา
   ไม่ใช่เฉพาะตัวเลขตรง ๆ — เคยจับได้แค่ 6 จาก 12 แบบ */
{
  const { rules } = readJson('data/forbidden_terms.json');
  const priceRules = rules.filter((r) => r.severity === 'OWNER' && r.claim_ref.includes('CLM-O-001'));
  const probes = [
    ['ตัวเลขตรง', 'ราคา 12,000 บาท'],
    ['ราคาเริ่มต้น', 'ราคาเริ่มต้น 8,900 บาท'],
    ['สัญลักษณ์บาท', '฿15,000'],
    ['ช่วงราคา', 'ราคา 10,000-15,000 บาท'],
    ['สะกดเป็นตัวหนังสือ', 'ราคาหนึ่งหมื่นสองพันบาท'],
    ['เปรียบเทียบราคา', 'ถูกกว่าคู่แข่งถึง 20%'],
    ['โปรโมชัน', 'ลดราคาพิเศษเฉพาะเดือนนี้'],
    ['ผ่อนชำระ', 'ผ่อน 0% นาน 10 เดือน'],
    ['ขอบเขต VAT', 'ราคานี้ยังไม่รวม VAT'],
    ['ภาษาอังกฤษ', 'starting from 12,000 THB'],
    ['ลงท้าย .-', 'ราคาพิเศษ 9,900.-'],
    ['งบประมาณ', 'งบประมาณราว 50,000 บาทต่อชุด'],
  ];
  const missed = probes.filter(([, text]) => !priceRules.some((r) => new RegExp(r.pattern, 'giu').test(text)));
  check(`กฎราคาจับได้ครบทั้ง ${probes.length} รูปแบบที่เขียนกันจริง`, missed.length === 0,
    missed.map(([label]) => label).join(', '));
}

/* ── 2. ความสอดคล้องของข้อมูลเว็บจริง ────────────────────────────── */
{
  const sitemap = readJson('data/sitemap_urls.json');
  const inv = readJson('data/page_inventory.json');
  const clusters = readJson('data/cannibalization_clusters.json');
  const smSet = new Set(sitemap.urls);
  const invSet = new Set(inv.pages.map((p) => p.url));
  const invPaths = new Set(inv.pages.map((p) => p.path));

  check('sitemap มี 82 URL', sitemap.count === 82 && sitemap.urls.length === 82, String(sitemap.urls.length));
  check('page inventory ครอบคลุม sitemap ครบทุก URL', [...smSet].every((u) => invSet.has(u)));
  check('page inventory ไม่มี URL ที่ไม่มีใน sitemap', [...invSet].every((u) => smSet.has(u)));
  const orphan = clusters.clusters.flatMap((c) => c.competing_urls).filter((p) => !invPaths.has(p));
  check('ทุก URL ใน cannibalization cluster มีอยู่จริงในเว็บ', orphan.length === 0, orphan.join(', '));
  check('นับ cluster ได้ตรงกับที่ประกาศไว้',
    clusters.clusters.every((c) => c.competing_urls.length === c.count));
  check('page_type ของทุกหน้าอยู่ใน enum',
    inv.pages.every((p) => inv.page_type_enum.includes(p.page_type)));
  check('risk flag ของทุกหน้าอยู่ใน enum',
    inv.pages.every((p) => p.risk_flags.every((f) => inv.risk_flag_enum.includes(f))));
  check('inventory ยังไม่ถูกนับว่า Owner ยืนยันแล้ว', inv.owner_confirmed === false && inv.status === 'PARTIAL');
}

/* ── 3. claim และ source ที่อ้างถึงกันต้องมีอยู่จริง ───────────────── */
{
  const claims = readJson('data/claims.json');
  const sources = readJson('data/source_pack.json');
  const { rules } = readJson('data/forbidden_terms.json');
  const claimIds = new Set(claims.claims.map((c) => c.id));
  const srcIds = new Set(sources.sources.map((s) => s.id));
  const badRule = rules.flatMap((r) => r.claim_ref.filter((c) => !claimIds.has(c)).map((c) => `${r.id}→${c}`));
  check('ทุกกฎอ้าง claim ที่มีอยู่จริง', badRule.length === 0, badRule.join(', '));
  const badClaim = claims.claims.flatMap((c) => c.evidence.filter((e) => !srcIds.has(e)).map((e) => `${c.id}→${e}`));
  check('ทุก claim อ้าง source ที่มีอยู่จริง', badClaim.length === 0, badClaim.join(', '));
  const badSrc = sources.sources.flatMap((s) => s.required_for.filter((c) => c.startsWith('CLM-') && !claimIds.has(c)).map((c) => `${s.id}→${c}`));
  check('ทุก source อ้าง claim ที่มีอยู่จริง', badSrc.length === 0, badSrc.join(', '));
}

/* ── 4. validator ตัดสินแพ็กเกจได้ถูก ─────────────────────────────── */
{
  const cache = join(tmp, 'c1.json');
  const res = run(VALIDATE, ['--fixtures', '--json', `--cache=${cache}`]);
  const find = (n) => res.results.find((r) => r.package.includes(n));
  const clean = find('__fixture-clean__'), bad = find('__fixture-violations__'), can = find('__fixture-cannibal__');
  const codes = (r) => new Set(r.findings.map((f) => f.code));

  check('rendering gate ยังเป็น FAIL', res.rendering_gate === 'FAIL', res.rendering_gate);
  check('บทความหลักการทั่วไปบนหน้าที่ไม่มี risk flag ได้ PASS', clean.status === 'PASS',
    clean.findings.map((f) => f.code).join(','));
  check('และได้ระดับ WORDING_QA_OK', clean.tier === 'WORDING_QA_OK', clean.tier);

  check('หน้าใหม่ที่ยิง intent ของ cluster ที่ยังไม่มีเจ้าของถูก FAIL', can.status === 'FAIL');
  check('และระบุว่าเป็น cluster ไหน', codes(can).has('CANNIBAL_UNRESOLVED'));
  check('หน้าที่อยู่ใน cluster ถูกยกเป็น T2_FULL อัตโนมัติ', can.tier === 'T2_FULL', can.tier);

  const c = codes(bad);
  check('แพ็กเกจละเมิดถูกตัดสิน FAIL', bad.status === 'FAIL');
  const expected = {
    'Queue #17 — จับการจัดอันดับ': 'FORBIDDEN_BLOCK',
    'Queue #21 — จับตัวเลขที่ไม่มี datasheet': 'EVIDENCE_MISSING',
    'Queue #16/#18 — จับราคาที่ไม่มีหลักฐาน': 'OWNER_CONFIRM_MISSING',
    'จับ schema เชิงพาณิชย์ที่ไม่มีหลักฐาน': 'SCHEMA_UNBACKED_COMMERCIAL',
    'จับการหลุดจาก DRAFT_PENDING_REVIEW': 'STATUS_ESCAPED_DRAFT',
    'จับ publish_allowed ที่ยังผ่าน gate ไม่ครบ': 'PUBLISH_NOT_ALLOWED',
    'จับ robots ที่เปิด index ขณะ rendering gate ยังไม่ผ่าน': 'ROBOTS_TOO_OPEN',
    'จับ claim ID ที่ไม่มีในทะเบียนกลาง': 'CLAIM_UNKNOWN',
    'จับ source ID ที่ไม่มีใน Source Pack': 'SOURCE_UNKNOWN',
    'จับการใช้ claim ที่เป็น BLOCKED': 'CLAIM_BLOCKED_USED',
    'จับ URL ที่ไม่ใช่โดเมน ACS': 'META_URL_ORIGIN',
    'จับ target_url ที่ไม่มีใน sitemap จริง': 'SITEMAP_MISS',
  };
  for (const [name, code] of Object.entries(expected)) check(name, c.has(code), `ไม่พบรหัส ${code}`);

  const second = run(VALIDATE, ['--fixtures', '--json', `--cache=${cache}`, '--changed-only']);
  check('--changed-only ข้ามแพ็กเกจที่ PASS และไม่เปลี่ยน',
    second.results.find((r) => r.package.includes('__fixture-clean__')).status === 'SKIPPED_UNCHANGED');
  check('--changed-only ยังตรวจแพ็กเกจที่ FAIL ซ้ำเสมอ',
    second.results.find((r) => r.package.includes('__fixture-violations__')).status === 'FAIL');
}

/* ── 5. เครื่องมือปิดข้อความ BLOCK ────────────────────────────────── */
{
  const draft = join(tmp, 'draft.md');
  copyFileSync(join(ROOT, 'tests/fixtures-redact/draft.md'), draft);
  const before = run(REDACT, [draft, '--json']);
  check('รายงานพบข้อความ BLOCK ในดราฟต์ทดสอบ', before.blocked > 0, String(before.blocked));
  const sev = new Set(before.results.flatMap((r) => r.findings.map((f) => f.severity)));
  check('รายงาน EVIDENCE และ OWNER ไว้ให้คนตัดสิน ไม่ใช่แก้เอง', sev.has('EVIDENCE') && sev.has('OWNER'));

  run(REDACT, [draft, '--fix', '--json']);
  const fixed = readFileSync(draft, 'utf8');
  check('--fix ทิ้ง marker ไว้ให้เห็น ไม่ลบเงียบ ๆ', fixed.includes('⟦ลบ '));
  check('--fix ลบตัวเลขก่อน→หลังที่ Owner สั่งห้ามออกจริง', !fixed.includes('65-70% เป็น 95%+'));
  check('--fix ไม่ไปแก้ราคา (ต้องให้คนตัดสิน)', fixed.includes('12,000 บาท'));
  const snapshot = fixed;
  run(REDACT, [draft, '--fix', '--json']);
  check('รัน --fix ซ้ำแล้วผลไม่เปลี่ยน (idempotent)', readFileSync(draft, 'utf8') === snapshot);
  const after = run(REDACT, [draft, '--json']);
  check('หลัง --fix ไม่เหลือข้อความ BLOCK', after.blocked === 0, String(after.blocked));
}

rmSync(tmp, { recursive: true, force: true });
console.log(`\n${failures.length ? `FAILED ${failures.length} ข้อ: ${failures.join(' | ')}` : 'selftest ผ่านทั้งหมด'}`);
process.exit(failures.length ? 1 : 0);
