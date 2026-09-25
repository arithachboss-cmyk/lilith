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
import { mkdtempSync, mkdirSync, readdirSync, writeFileSync, readFileSync, copyFileSync, rmSync } from 'node:fs';
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
  // หน้าหลักที่ตัดสินแล้วถูกระบุเป็นรายชื่อโดยเจตนา ไม่ใช่นับจาก totals ในไฟล์เดียวกัน
  // เพราะการนับจากข้อมูลที่กำลังตรวจ ทำให้เทสต์รับรองตัวเองและมองไม่เห็นความเปลี่ยนแปลง
  const OWNED = ['C-1', 'C-3', 'C-5', 'C-6', 'C-7', 'C-9'];
  check('เฉพาะ cluster ที่ตัดสินแล้วเท่านั้นที่มีหน้าหลัก',
    clusters.clusters.filter((c) => c.canonical_owner).map((c) => c.cluster_id).join(',') === OWNED.join(','));
  check('cluster ที่ยังไม่ตัดสินยังกั้นอยู่ ซึ่งเป็นค่าตั้งต้นที่ถูกต้อง',
    clusters.clusters.filter((c) => !c.canonical_owner).map((c) => c.cluster_id).join(',') === 'C-2,C-4,C-8,C-10');
  const c9 = clusters.clusters.find((c) => c.cluster_id === 'C-9');
  check('C-9 หมวดหน้าองค์กรมีหน้าหลักแล้ว คือ /why-acs',
    c9?.competing_urls.includes('/why-acs') && c9.canonical_owner?.en === '/why-acs');
  check('ทุก cluster ที่มีหน้าหลัก บันทึกว่าใครตัดสินและเมื่อไร',
    clusters.clusters.filter((c) => c.canonical_owner).every((c) => c.decided_by && c.decided_on && c.decision_id));
  check('หน้าหลักทุกอันเป็น URL ที่อยู่ในกลุ่มนั้นจริง',
    clusters.clusters.filter((c) => c.canonical_owner).every((c) =>
      Object.values(c.canonical_owner).every((u) => c.competing_urls.includes(u))));
  // C-7: คำตัดสิน Queue #17 ห้ามจัดอันดับยี่ห้อ หน้าหลักของกลุ่มจึงต้องไม่ใช่หน้าที่ถือ flag RANKING
  const RANKING_PAGES = ['/barcode-scanner-comparison', '/knowledge/product-comparisons'];
  const c7 = clusters.clusters.find((c) => c.cluster_id === 'C-7');
  check('หน้าหลักของ C-7 ไม่ใช่หน้าที่ถือ flag RANKING',
    Object.values(c7.canonical_owner).every((u) => !RANKING_PAGES.includes(u)));
  // URL เดียวอยู่ได้กลุ่มเดียว มิฉะนั้นผลของด่านขึ้นกับว่าอ่านกลุ่มไหนก่อน
  const allClusterUrls = clusters.clusters.flatMap((c) => c.competing_urls);
  check('ไม่มี URL ใดอยู่มากกว่าหนึ่ง cluster',
    new Set(allClusterUrls).size === allClusterUrls.length,
    allClusterUrls.filter((u, i) => allClusterUrls.indexOf(u) !== i).join(','));
  check('totals ตรงกับข้อมูลจริงในไฟล์',
    clusters.totals.clusters === clusters.clusters.length &&
    clusters.totals.urls_in_clusters === allClusterUrls.length &&
    clusters.totals.unique_urls_in_clusters === new Set(allClusterUrls).size &&
    clusters.totals.clusters_with_canonical_owner === OWNED.length);
  // page_inventory เก็บ URL เต็ม แต่ cluster เก็บ path — ต้องเทียบบนรูปเดียวกัน
  const toPath = (u) => u.replace(/^https?:\/\/[^/]+/, '');
  const clusterPaths = new Set(allClusterUrls.map(toPath));
  const cannibalPaths = inv.pages
    .filter((p) => p.risk_flags.includes('CANNIBAL'))
    .map((p) => toPath(p.url));
  const unseen = cannibalPaths.filter((u) => !clusterPaths.has(u));
  // สามหน้า /knowledge/* ที่เคยอยู่นอกทุก cluster ถูกเก็บเข้า C-10 แล้ว
  check('สามหน้า knowledge ที่เคยอยู่นอกทุก cluster ถูกด่านมองเห็นแล้ว',
    ['/knowledge/barcode-equipment', '/knowledge/industry-applications', '/knowledge/regional-solutions']
      .every((u) => clusterPaths.has(u)));
  // หลังตั้ง C-10 ไม่มีหน้า CANNIBAL หน้าใดอยู่นอก cluster อีก
  // นี่คือคุณสมบัติที่ต้องคงไว้ ไม่ใช่ตัวเลขที่บังเอิญเป็นศูนย์วันนี้:
  // หน้าที่ถือ flag นี้แต่ไม่อยู่ในกลุ่มใด คือหน้าที่ด่านมองไม่เห็นและปล่อยผ่านเงียบ ๆ
  check('ไม่มีหน้า CANNIBAL หน้าใดอยู่นอกทุก cluster — ด่านมองเห็นครบทุกหน้า',
    unseen.length === 0, `มองไม่เห็น ${unseen.length} หน้า — ${unseen.join(',')}`);
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

  // action = NEW แปลว่าหน้ายังไม่มี ถ้า URL อยู่ใน sitemap แล้วแปลว่าเป็นการปรับปรุงหน้าเดิม
  // ข้อตรวจเดิมบังคับให้ทุก target อยู่ใน sitemap ซึ่งทำให้หน้าใหม่ผ่านไม่ได้เลย
  // และไม่เคยตรวจด้านกลับว่าแพ็กเกจที่อ้างว่าสร้างหน้าใหม่ กำลังทับหน้าที่มีอยู่แล้วหรือไม่
  check('หน้าใหม่ที่ URL มีอยู่ใน sitemap แล้ว ถูกจับว่าควรเป็น ENRICH',
    codes(can).has('NEW_PAGE_EXISTS'), [...codes(can)].join(','));
  check('หน้าใหม่ไม่ถูกจับด้วย SITEMAP_MISS เพราะหน้าใหม่ย่อมยังไม่อยู่ใน sitemap',
    !codes(can).has('SITEMAP_MISS'));

  const resolved = find('__fixture-cluster-resolved__');
  check('cluster ที่มีหน้าหลักแล้วไม่ถูกกั้นอีก', resolved.status === 'PASS',
    resolved.findings.map((f) => f.code).join(','));

  /*
   * URL ที่อยู่หลายกลุ่มพร้อมกันต้องถูกกั้นเสมอ ไม่ว่าไฟล์จะเรียงกลุ่มอย่างไร
   *
   * เดิม validator เก็บ path -> cluster เป็นค่าเดียว กลุ่มที่เขียนทีหลังจึงทับกลุ่มก่อนหน้า
   * ทดสอบด้วยการคัดลอก data/ แล้วสลับให้กลุ่มที่ "มีหน้าหลัก" ไปอยู่ท้ายไฟล์ ซึ่งเป็นลำดับ
   * ที่ทำให้บั๊กเดิมปล่อยผ่าน · เนื้อหาข้อมูลไม่เปลี่ยน เปลี่ยนแค่ลำดับ ผลจึงต้องเหมือนเดิม
   */
  /*
   * URL ที่อยู่หลายกลุ่มพร้อมกันต้องถูกกั้นเสมอ ไม่ว่าไฟล์จะเรียงกลุ่มอย่างไร
   *
   * เดิม validator เก็บ path -> cluster เป็นค่าเดียว กลุ่มที่เขียนทีหลังจึงทับกลุ่มก่อนหน้า
   * เทสต์นี้สร้างข้อมูลของตัวเอง ไม่พึ่งพาว่าข้อมูลจริงยังมี URL ที่อยู่สองกลุ่มอยู่หรือไม่
   * เพราะความบกพร่องในข้อมูลจริงถูกแก้ไปแล้ว (D-14) และเทสต์ที่พึ่งพาความบกพร่องจะตายไปพร้อมกับมัน
   */
  {
    const mkData = (shuffle) => {
      const dir = join(tmp, shuffle ? 'data-multi-shuffled' : 'data-multi');
      mkdirSync(dir, { recursive: true });
      for (const f of readdirSync(join(ROOT, 'data'))) {
        copyFileSync(join(ROOT, 'data', f), join(dir, f));
      }
      const cPath = join(dir, 'cannibalization_clusters.json');
      const doc = JSON.parse(readFileSync(cPath, 'utf8'));
      // ใส่ /retail-barcode-scanner กลับเข้า C-6 (ยังไม่มีหน้าหลักในสถานการณ์นี้)
      // ให้ URL เดียวอยู่ทั้ง C-1 ที่มีหน้าหลัก และ C-6 ที่ไม่มี
      const c6 = doc.clusters.find((c) => c.cluster_id === 'C-6');
      c6.canonical_owner = null;
      if (!c6.competing_urls.includes('/retail-barcode-scanner')) {
        c6.competing_urls.push('/retail-barcode-scanner');
        c6.count = c6.competing_urls.length;
      }
      if (shuffle) {
        const owned = doc.clusters.filter((c) => c.canonical_owner);
        doc.clusters = [...doc.clusters.filter((c) => !c.canonical_owner), ...owned];
      }
      writeFileSync(cPath, JSON.stringify(doc, null, 2));
      return dir;
    };

    const runOn = (dir, tag) => {
      const out = run(VALIDATE, ['--fixtures', '--json',
        `--data-dir=${dir}`, `--cache=${join(tmp, `c-${tag}.json`)}`]);
      return out.results.find((r) => r.package.includes('__fixture-multi-cluster__'));
    };

    const multi = runOn(mkData(false), 'multi');
    check('URL ที่อยู่สองกลุ่มและมีกลุ่มหนึ่งยังไม่มีหน้าหลัก ถูกกั้น', multi.status === 'FAIL',
      multi.findings.map((f) => f.code).join(','));
    check('และข้อความบอกว่าอยู่กี่กลุ่ม ไม่ได้รายงานแค่กลุ่มเดียว',
      multi.findings.some((f) => f.code.startsWith('CANNIBAL') && f.detail.includes('C-1') && f.detail.includes('C-6')),
      multi.findings.filter((f) => f.code.startsWith('CANNIBAL')).map((f) => f.detail).join(' | '));

    const multiShuffled = runOn(mkData(true), 'multi-shuffled');
    check('สลับลำดับกลุ่มในไฟล์แล้วผลของ gate ไม่เปลี่ยน', multiShuffled.status === 'FAIL',
      `ลำดับเปลี่ยนแล้วได้ ${multiShuffled.status} — ผลของ gate ห้ามขึ้นกับลำดับบรรทัดใน JSON`);
  }

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

/* ── เอกสาร governance ที่ generate ต้องสะท้อนข้อมูลจริง ─────────────
 *
 * 07-SITE-INVENTORY.md คือเอกสารที่คนเปิดดูว่าหน้าไหนเป็นหน้าหลักของ cluster ก่อนลงมือเขียน
 * มันเคยพิมพ์ "[object Object]" ในช่อง canonical owner ทุกกลุ่มที่ตัดสินแล้ว เพราะ canonical_owner
 * เป็น object ที่ key คือภาษา และ renderer ส่งเข้า String() ตรง ๆ · บรรทัดนับก็ถูก hardcode เป็น 0
 *
 * ทั้งสองข้อไม่ทำให้ tool ใดพัง จึงไม่มีอะไรจับได้เลยจนกว่าจะมีคนอ่านไฟล์
 * ข้อตรวจชุดนี้จับทั้งการถดถอยของ renderer และการลืมสั่ง render ใหม่หลังแก้ข้อมูล
 */
{
  const clusters = readJson('data/cannibalization_clusters.json');
  const doc = readFileSync(join(ROOT, 'governance/07-SITE-INVENTORY.md'), 'utf8');
  const owned = clusters.clusters.filter((c) => c.canonical_owner);

  check('เอกสารที่ generate ไม่มี [object Object] หลงเหลือ', !doc.includes('[object Object]'));
  check('บรรทัดนับหน้าหลักในเอกสารตรงกับข้อมูลจริง ไม่ใช่เลขที่ hardcode ไว้',
    doc.includes(`มี canonical owner แล้ว ${owned.length}`),
    `คาดว่า ${owned.length}`);
  /* ต้องอ่านจากช่อง canonical owner ของแถวนั้นจริง ๆ ไม่ใช่แค่ "มีคำนี้อยู่ที่ไหนสักแห่งในไฟล์"
     เพราะ URL ของหน้าหลักอยู่ในช่อง competing_urls ของแถวเดียวกันอยู่แล้วเสมอ
     ข้อตรวจที่หา URL ทั้งไฟล์จึงผ่านตลอดและจับอะไรไม่ได้เลย */
  const rowOf = (id) => doc.split('\n').find((l) => l.startsWith(`| \`${id}\``));
  const ownerColOf = (id) => (rowOf(id) ?? '').split('|')[4] ?? '';
  const wrongCol = owned.filter((c) =>
    !Object.values(c.canonical_owner).every((u) => ownerColOf(c.cluster_id).includes(`\`${u}\``)));
  check('ช่อง canonical owner ของทุกแถวแสดง URL จริง (จับ [object Object] และการลืม render ใหม่)',
    wrongCol.length === 0, wrongCol.map((c) => `${c.cluster_id}:${ownerColOf(c.cluster_id).trim()}`).join(' | '));
  const unownedCol = clusters.clusters.filter((c) => !c.canonical_owner)
    .filter((c) => ownerColOf(c.cluster_id).trim() !== '—');
  check('cluster ที่ยังไม่มีหน้าหลักต้องแสดงขีด ไม่ใช่ค่าว่างที่อ่านเป็นอย่างอื่นได้',
    unownedCol.length === 0, unownedCol.map((c) => c.cluster_id).join(','));
  check('ทุก cluster มีแถวของตัวเองในเอกสาร',
    clusters.clusters.every((c) => rowOf(c.cluster_id) !== undefined));
}

rmSync(tmp, { recursive: true, force: true });
console.log(`\n${failures.length ? `FAILED ${failures.length} ข้อ: ${failures.join(' | ')}` : 'selftest ผ่านทั้งหมด'}`);
process.exit(failures.length ? 1 : 0);
