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
  const c1 = clusters.clusters.find((c) => c.cluster_id === 'C-1');
  check('C-1 มีข้อมูล role ของทุกหน้าครบ', (c1.pages ?? []).length === c1.count);
  check('C-1 แยก generic ออกจาก modifier ได้ 3 ต่อ 7',
    c1.generic_urls.length === 3 && c1.pages.filter((p) => p.role === 'MODIFIER').length === 7);
  check('ทุกหน้าใน C-1 ที่เป็น GENERIC อยู่ใน generic_urls',
    c1.pages.filter((p) => p.role === 'GENERIC').every((p) => c1.generic_urls.includes(p.url)));
  check('C-1 ชี้ไปยังเอกสารตัดสินใจและกำหนดเวลา',
    c1.decision_document === 'revision-specs/queue-3-intent-map.md' && c1.decision_due === '2026-09-24');
  check('C-1 มีหน้าหลักแยกตามภาษาแล้ว (คำตัดสิน D-08)',
    c1.canonical_owner?.th === '/เครื่องสแกนบาร์โค้ด' && c1.canonical_owner?.en === '/barcode-scanners');
  check('C-1 บันทึกว่าใครตัดสินและเมื่อไร',
    c1.decided_by === 'ACS Owner' && c1.decided_on === '2026-09-23' && c1.decision_id === 'D-08');
  check('C-1 มีวันนัดตรวจแล้ว ไม่ปล่อยให้ค่าโดยปริยายเป็นความเงียบ',
    typeof c1.review_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(c1.review_date), String(c1.review_date));
  check('C-1 มี checkpoint กลางทางสำหรับงานที่ไม่ติดอะไรเลย',
    c1.interim_checkpoint?.date === '2026-09-26' && c1.interim_checkpoint?.blocks_nothing === true);
  check('checkpoint มาก่อนวันตรวจจริง',
    Date.parse(c1.interim_checkpoint.date) < Date.parse(c1.review_date));
  check('C-1 ยังไม่ถูกลงมือทำ และมี runbook กำกับ',
    c1.executed === false && typeof c1.execution_runbook === 'string');
  check('cluster ที่เหลือยังไม่มีหน้าหลัก ซึ่งเป็นค่าตั้งต้นที่ถูกต้อง',
    clusters.clusters.filter((c) => !c.canonical_owner).length === clusters.clusters.length - 1);
  const c9 = clusters.clusters.find((c) => c.cluster_id === 'C-9');
  check('C-9 หมวดหน้าองค์กรถูกเพิ่มแล้ว และยังกั้นอยู่',
    c9?.competing_urls.includes('/why-acs') && c9.canonical_owner === null);
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

  const resolved = find('__fixture-cluster-resolved__');
  check('cluster ที่มีหน้าหลักแล้วไม่ถูกกั้นอีก', resolved.status === 'PASS',
    resolved.findings.map((f) => f.code).join(','));

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

/* ── 5a2. หน้าที่ไม่เผยแพร่สาธารณะ ───────────────────────────────
   การจำกัดผู้เข้าถึงยกเว้นได้เฉพาะ gate ที่เป็นเรื่อง SEO ล้วน ๆ
   ไม่ได้ทำให้ข้อความที่ไม่มีหลักฐานกลายเป็นข้อความที่มีหลักฐาน */
{
  const cache = join(tmp, 'c-priv.json');
  const res = run(VALIDATE, ['--fixtures', '--json', `--cache=${cache}`]);
  const find = (n) => res.results.find((r) => r.package.includes(n));
  const codes = (r) => new Set(r.findings.map((f) => f.code));

  const priv = find('__fixture-private__');
  check('หน้า PRIVATE ที่สะอาดผ่านได้ โดยข้าม gate ที่เป็นเรื่อง SEO', priv.status === 'PASS',
    priv.findings.map((f) => f.code).join(','));
  check('— และบันทึกไว้ว่าข้ามอะไรไปบ้าง', codes(priv).has('PRIVATE_SEO_CHECKS_SKIPPED'));

  const pc = find('__fixture-private-claims__');
  const c = codes(pc);
  check('หน้า PRIVATE ที่มี claim ต้องห้าม ยังถูก FAIL', pc.status === 'FAIL');
  check('— ซูเปอร์ลาทีฟยังถูกจับ', c.has('FORBIDDEN_BLOCK'));
  check('— ชื่อลูกค้ายังถูกจับ แม้หน้าจะไม่เผยแพร่สาธารณะ', c.has('OWNER_CONFIRM_MISSING'));
  check('— ชื่อผู้ผลิตยังถูกจับ', c.has('EVIDENCE_MISSING'));
  check('— และยังข้าม gate ที่เป็นเรื่อง SEO เหมือนกัน', c.has('PRIVATE_SEO_CHECKS_SKIPPED'));
}

/* ── 5b. แพ็กเกจ about-acs: สองดราฟต์ต้องให้ผลต่างกัน ────────────
   v1 พูดเรื่องเดียวกันในเชิงเจตนาโดยไม่มี claim ที่ถูก gate
   v2 มีสิ่งที่ Owner ขอครบ และติด claim ที่ ACS ปิดเองไม่ได้ทั้งหมด */
{
  const P = join(ROOT, 'content-packages/PKG-ABOUT-ACS');
  const runRedact = (file) => {
    try { return { out: execFileSync(process.execPath, [REDACT, join(P, file), '--json'], { encoding: 'utf8' }), code: 0 }; }
    catch (err) { return { out: String(err.stdout ?? ''), code: err.status }; }
  };
  const v1 = JSON.parse(runRedact('draft-v1-publishable.md').out);
  check('ดราฟต์ที่เผยแพร่ได้ไม่มี claim ที่ถูก gate เลย', v1.results.length === 0 && v1.blocked === 0,
    JSON.stringify(v1.results.flatMap((r) => r.findings.map((f) => f.rule_id))));

  const v2 = JSON.parse(runRedact('draft-v2-full.md').out);
  const rules = new Set(v2.results.flatMap((r) => r.findings.map((f) => f.rule_id)));
  check('ดราฟต์ตามที่ Owner ขอ ถูกจับซูเปอร์ลาทีฟ', rules.has('FW-B-001'));
  check('— จับการอ้างความเป็นพาร์ทเนอร์', rules.has('FW-O-003'));
  check('— จับอายุบริษัท 30 ปี', rules.has('FW-O-004'));
  check('— จับชื่อลูกค้า', rules.has('FW-O-016'));
  check('— จับการอ้างว่าดูแลลูกค้า แม้ไม่เอ่ยชื่อ', rules.has('FW-O-017'));
  check('— จับชื่อผู้ผลิต', rules.has('FW-E-009'));
}

/* ── 5c. ไฟล์ HTML ต้องถูกสแกนเท่ากับ markdown ───────────────────
   ไฟล์ .html คือไฟล์ที่ขึ้นเว็บจริง ถ้า scanner ไม่อ่านนามสกุลนี้
   ไฟล์ที่สำคัญที่สุดจะเป็นไฟล์เดียวที่ไม่มีใครตรวจ */
{
  const html = join(ROOT, 'tests/fixtures-redact/page.html');
  let out = '', code = 0;
  try { out = execFileSync(process.execPath, [REDACT, html, '--json'], { encoding: 'utf8' }); }
  catch (err) { out = String(err.stdout ?? ''); code = err.status; }
  const res = JSON.parse(out);
  const rules = new Set(res.results.flatMap((r) => r.findings.map((f) => f.rule_id)));
  check('scanner อ่านไฟล์ .html และรายงานสิ่งที่พบ', res.results.length > 0 && code === 1);
  check('— จับซูเปอร์ลาทีฟใน HTML', rules.has('FW-B-001'));
  check('— จับราคาใน HTML', rules.has('FW-O-001'));
  check('— จับชื่อลูกค้าใน HTML', rules.has('FW-O-016'));
  const { rules: ruleDefs } = readJson('data/forbidden_terms.json');
  void ruleDefs;
  check('วันที่แบบ ISO ไม่ถูกอ่านเป็นราคา',
    !readJson('data/forbidden_terms.json').rules
      .filter((r) => r.claim_ref.includes('CLM-O-001'))
      .some((r) => new RegExp(r.pattern, 'giu').test('สร้างเมื่อ 2026-09-23')));
}

/* ── 5d. คำบอกเล่าของ Owner ไม่ใช่หลักฐาน ─────────────────────────
   Owner ยืนยันด้วยวาจาว่า claim หลายข้อเป็นความจริง ซึ่งบันทึกไว้แล้ว
   แต่การบันทึกนั้นต้องไม่ทำให้ validator ปล่อยผ่าน */
{
  const os = readJson('data/owner_statements.json');
  const claims = readJson('data/claims.json');
  const sources = readJson('data/source_pack.json');
  const claimIds = new Set(claims.claims.map((c) => c.id));

  check('ทุก owner statement อ้าง claim ที่มีอยู่จริง',
    os.statements.every((st) => st.claim_ref.every((c) => claimIds.has(c))));
  check('ทุก owner statement ระบุว่าใครเป็นคนปิด',
    os.statements.every((st) => typeof st.closure_owner === 'string' && st.closure_owner.length > 0));
  check('การบันทึกคำบอกเล่าไม่ได้เปลี่ยน source ใดให้เป็น SUPPLIED',
    sources.sources.filter((x) => x.status === 'SUPPLIED').every((x) => x.id === 'SRC-WEB-001'));
  check('claim ที่ Owner ยืนยันด้วยวาจา ยังคงสถานะเดิมในทะเบียนกลาง',
    os.statements.flatMap((st) => st.claim_ref).every((id) => {
      const c = claims.claims.find((x) => x.id === id);
      return c.class === 'OWNER_REQUIRED' || c.class === 'BLOCKED';
    }));
  const declined = os.statements.filter((st) => st.status === 'DECLINED_BY_SYSTEM');
  check('ข้อที่ปฏิเสธไว้ระบุว่าไม่มีอะไรปิดได้ และเสนอทางเลือกที่เผยแพร่ได้',
    declined.length > 0 && declined.every((st) => st.closure_owner === 'ไม่มี' && st.publishable_alternative));
}

/* ── 6. หลักฐานครบจริงไหม และราคาหมดอายุหรือยัง ──────────────────
   ราคาที่ไม่มีวันหมดอายุจะค้างบนหน้าเว็บโดยยังดูเหมือนมีแหล่งอ้างอิง
   ซึ่งเป็นความเสียหายที่คำตัดสิน Queue #16/#18 ต้องการกันไว้ */
{
  const EV = join(ROOT, 'tools/evidence-check.mjs');
  const F = (name) => join(ROOT, 'tests/fixtures-evidence', name);
  const runEv = (args) => {
    try { return { out: execFileSync(process.execPath, [EV, ...args], { encoding: 'utf8' }), code: 0 }; }
    catch (err) { return { out: String(err.stdout ?? ''), code: err.status }; }
  };

  const good = runEv([F('price-good')]);
  check('ราคาที่มีวันที่ครบและยังไม่หมดอายุ ผ่าน', good.code === 0, good.out.trim());

  const stale = runEv([F('price-stale')]);
  check('ราคาที่หมดอายุแล้วถูก FAIL', stale.code === 1);
  check('และบอกว่าหมดอายุมากี่วัน', /หมดอายุแล้ว/.test(stale.out));

  const future = runEv([F('price-good'), '--as-of', '2027-01-15']);
  check('ราคาเดิมกลายเป็น FAIL เมื่อประเมินหลังวันหมดอายุ', future.code === 1);

  const soon = runEv([F('price-good'), '--as-of', '2026-12-10']);
  check('เตือนล่วงหน้าเมื่อใกล้หมดอายุภายใน 30 วัน โดยยังไม่ FAIL',
    soon.code === 0 && /จะหมดอายุในอีก/.test(soon.out));

  const noCond = runEv([F('datasheet-no-conditions')]);
  check('ตัวเลขจาก datasheet ที่ไม่มีเงื่อนไขการวัดถูก FAIL', noCond.code === 1);
  check('และอธิบายว่าทำไมถึงอันตราย', /เงื่อนไขที่วัดมา/.test(noCond.out));

  // --as-of ต้องไม่กลืน argument ที่เป็นเป้าหมาย (บั๊กที่ PR #1 เจอจาก regression suite ของตัวเอง)
  const argOrder = runEv([F('price-good'), '--as-of', '2026-10-01']);
  check('ส่ง --as-of แล้วยังตรวจ target ที่ระบุจริง ไม่ถูกตัดทิ้ง',
    argOrder.code === 0 && /ตรวจ 1 รายการ/.test(argOrder.out), argOrder.out.trim());
  const noFlag = runEv([F('price-good')]);
  check('ไม่ส่ง --as-of ก็ยังตรวจ target ตัวแรกได้', /ตรวจ 1 รายการ/.test(noFlag.out));
}

rmSync(tmp, { recursive: true, force: true });
console.log(`\n${failures.length ? `FAILED ${failures.length} ข้อ: ${failures.join(' | ')}` : 'selftest ผ่านทั้งหมด'}`);
process.exit(failures.length ? 1 : 0);
