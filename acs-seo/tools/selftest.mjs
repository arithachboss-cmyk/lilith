#!/usr/bin/env node
/**
 * ตรวจว่า validator ยังจับสิ่งที่ Owner สั่งห้ามได้จริง
 * รัน: node acs-seo/tools/selftest.mjs
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, cpSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const VALIDATE = join(ROOT, 'tools/validate.mjs');
const failures = [];
const check = (name, cond, detail = '') => {
  console.log(`${cond ? 'ok  ' : 'FAIL'}  ${name}${cond || !detail ? '' : ` — ${detail}`}`);
  if (!cond) failures.push(name);
};

function run(extra) {
  try {
    const out = execFileSync(process.execPath, [VALIDATE, '--fixtures', '--json', ...extra], { encoding: 'utf8' });
    return JSON.parse(out);
  } catch (err) {
    // exit 1 เมื่อมี FAIL เป็นพฤติกรรมที่ถูกต้อง — ยังต้องอ่าน stdout ได้
    return JSON.parse(err.stdout);
  }
}
const find = (res, needle) => res.results.find((r) => r.package.includes(needle));
const codes = (r) => new Set(r.findings.map((f) => f.code));

/* ---------- 1. สถานะจริง: source ยังไม่มา ต้องไม่ PASS ---------- */
const tmp = mkdtempSync(join(tmpdir(), 'acs-qa-'));
const liveCache = join(tmp, 'live-cache.json');
{
  const res = run([`--cache=${liveCache}`]);
  const clean = find(res, '__fixture-clean__');
  const bad = find(res, '__fixture-violations__');

  check('rendering gate ยังเป็น FAIL', res.rendering_gate === 'FAIL', res.rendering_gate);
  check('บทความสะอาดไม่ถูกนับเป็น PASS ขณะที่ source ยังไม่มา', clean.status === 'BLOCKED_ON_SOURCE', clean.status);
  check('บทความสะอาดได้ tier WORDING_QA_OK', clean.tier === 'WORDING_QA_OK', clean.tier);
  check('รายงานว่า sitemap ตรวจไม่ได้', codes(clean).has('SITEMAP_UNAVAILABLE'));
  check('รายงานว่า page inventory ตรวจไม่ได้', codes(clean).has('INVENTORY_UNAVAILABLE'));

  const c = codes(bad);
  check('แพ็กเกจละเมิดถูกตัดสิน FAIL', bad.status === 'FAIL', bad.status);
  check('แพ็กเกจละเมิดถูกบังคับเป็น T2_FULL', bad.tier === 'T2_FULL', bad.tier);
  const expected = {
    'Queue #17 — จับการจัดอันดับ/ซูเปอร์ลาทีฟ': 'FORBIDDEN_BLOCK',
    'Queue #21 — จับตัวเลขที่ไม่มี datasheet': 'EVIDENCE_MISSING',
    'Queue #16/#18 — จับราคาที่ไม่มีหลักฐาน': 'OWNER_CONFIRM_MISSING',
    'จับ schema เชิงพาณิชย์ที่ไม่มีหลักฐาน': 'SCHEMA_UNBACKED_COMMERCIAL',
    'จับการหลุดจาก DRAFT_PENDING_REVIEW': 'STATUS_ESCAPED_DRAFT',
    'จับ publish_allowed ที่ยังผ่าน gate ไม่ครบ': 'PUBLISH_NOT_ALLOWED',
    'จับ robots ที่เปิด index ทั้งที่ rendering gate ยังไม่ผ่าน': 'ROBOTS_TOO_OPEN',
    'จับ claim ID ที่ไม่มีในทะเบียนกลาง': 'CLAIM_UNKNOWN',
    'จับ source ID ที่ไม่มีใน Source Pack': 'SOURCE_UNKNOWN',
    'จับการใช้ claim ที่เป็น BLOCKED': 'CLAIM_BLOCKED_USED',
    'จับ canonical/target_url ที่ไม่ใช่โดเมน ACS': 'META_URL_ORIGIN',
  };
  for (const [name, code] of Object.entries(expected)) check(name, c.has(code), `ไม่พบรหัส ${code}`);
}

/* ---------- 2. จำลองว่า source มาครบแล้ว: ต้อง PASS ได้ และ --changed-only ต้องข้ามได้ ---------- */
{
  const dataDir = join(tmp, 'data');
  cpSync(join(ROOT, 'data'), dataDir, { recursive: true });
  const CLEAN_URL = 'https://www.asiancoding.com/knowledge/label-material-selection';
  const LINKED_URL = 'https://www.asiancoding.com/knowledge/barcode-basics';
  const patch = (file, fn) => {
    const j = JSON.parse(readFileSync(join(dataDir, file), 'utf8'));
    fn(j);
    writeFileSync(join(dataDir, file), JSON.stringify(j, null, 2));
  };
  patch('sitemap_urls.json', (j) => { j.status = 'SUPPLIED'; j.urls = [CLEAN_URL, LINKED_URL]; });
  patch('page_inventory.json', (j) => {
    j.status = 'SUPPLIED';
    j.pages = [CLEAN_URL, LINKED_URL].map((url) => ({ url, page_type: 'KNOWLEDGE', primary_intent: 'selftest', title: 'selftest', indexable: false, last_seen_in_sitemap: '2026-09-20' }));
  });

  const cache = join(tmp, 'sim-cache.json');
  const first = run([`--data-dir=${dataDir}`, `--cache=${cache}`]);
  const clean = find(first, '__fixture-clean__');
  check('เมื่อ source ครบ บทความสะอาดได้ PASS', clean.status === 'PASS', `${clean.status}: ${clean.findings.map((f) => f.code).join(',')}`);
  check('แพ็กเกจละเมิดยัง FAIL แม้ source ครบ', find(first, '__fixture-violations__').status === 'FAIL');

  const second = run([`--data-dir=${dataDir}`, `--cache=${cache}`, '--changed-only']);
  check('--changed-only ข้ามแพ็กเกจที่ PASS และไม่เปลี่ยน', find(second, '__fixture-clean__').status === 'SKIPPED_UNCHANGED');
  check('--changed-only ยังตรวจแพ็กเกจที่ FAIL ซ้ำเสมอ', find(second, '__fixture-violations__').status === 'FAIL');
}

rmSync(tmp, { recursive: true, force: true });
console.log(`\n${failures.length ? `FAILED ${failures.length} ข้อ: ${failures.join(' | ')}` : 'selftest ผ่านทั้งหมด'}`);
process.exit(failures.length ? 1 : 0);
