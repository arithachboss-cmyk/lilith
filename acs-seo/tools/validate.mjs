#!/usr/bin/env node
/**
 * ACS SEO Package Factory — mechanical QA runner.
 *
 * ใช้แทน QA ด้วยมือซ้ำ ๆ: ตรวจ metadata, internal links, sitemap, schema, forbidden words
 * และคำนวณว่าแพ็กเกจต้อง QA ระดับไหน (T0/T1/T2/WORDING_QA_OK)
 *
 *   node tools/validate.mjs                 ตรวจแพ็กเกจจริงใน content-packages/
 *   node tools/validate.mjs --fixtures      ตรวจ fixture ใน tests/fixtures/ ด้วย
 *   node tools/validate.mjs --changed-only  ข้ามแพ็กเกจที่ไม่เปลี่ยนและเคย PASS
 *   node tools/validate.mjs --json          ผลลัพธ์เป็น JSON
 *   node tools/validate.mjs --board         พิมพ์ package status board
 *
 * exit 0 = ไม่มี FAIL, exit 1 = มี FAIL, exit 2 = ใช้งานผิด
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { checkPackageEvidence } from './evidence-check.mjs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const rawArgs = process.argv.slice(2);
const argv = new Set(rawArgs.filter((a) => !a.includes('=')));
const opt = (name, fallback) => {
  const hit = rawArgs.find((a) => a.startsWith(`--${name}=`));
  return hit ? resolve(hit.slice(name.length + 3)) : fallback;
};
const opt2 = (name) => {
  const hit = rawArgs.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
};
/** --data-dir= และ --cache= ใช้สำหรับ selftest เท่านั้น การใช้งานปกติไม่ต้องส่ง */
const DATA_DIR = opt('data-dir', join(ROOT, 'data'));

const REQUIRED_FILES = [
  'article.md',
  'meta.json',
  'schema.jsonld',
  'audit.json',
  'claim_register.md',
  'brief.md',
  'package_status.json',
];

const TITLE_MIN = 30, TITLE_MAX = 60;
const DESC_MIN = 70, DESC_MAX = 160;
const SITE_ORIGIN = 'https://www.asiancoding.com';
const EVIDENCE_AUTHORITIES = new Set(['OFFICIAL_VENDOR', 'STANDARDS_BODY']);
const OWNER_AUTHORITIES = new Set(['ACS_INTERNAL']);
const SCHEMA_COMMERCIAL_KEYS = ['offers', 'price', 'priceSpecification', 'aggregateRating', 'review'];
/** risk flag ของหน้าที่บังคับให้ต้อง QA เต็ม — ตรงกับกติกา "หน้าที่มีตัวเลข/ราคา/performance/customer claim" */
const FULL_QA_FLAGS = new Set(['SPEC', 'NUMBERS', 'PRICE', 'CUSTOMER', 'RANKING', 'PARTNER', 'OWNER', 'EVIDENCE']);

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));

const sources = readJson(join(DATA_DIR, 'source_pack.json'));
const claimsDoc = readJson(join(DATA_DIR, 'claims.json'));
const forbidden = readJson(join(DATA_DIR, 'forbidden_terms.json'));
const inventory = readJson(join(DATA_DIR, 'page_inventory.json'));
const sitemap = readJson(join(DATA_DIR, 'sitemap_urls.json'));
const gates = readJson(join(DATA_DIR, 'gates.json'));
const clusterDoc = readJson(join(DATA_DIR, 'cannibalization_clusters.json'));
const evidenceCtx = {
  claimById: new Map(claimsDoc.claims.map((c) => [c.id, c])),
  sourceById: new Map(sources.sources.map((s) => [s.id, s])),
};
const AS_OF = opt2('as-of') ?? new Date().toISOString().slice(0, 10);

const sourceById = new Map(sources.sources.map((s) => [s.id, s]));
const claimById = new Map(claimsDoc.claims.map((c) => [c.id, c]));
const rules = forbidden.rules.map((r) => ({ ...r, re: new RegExp(r.pattern, 'giu') }));
const inventoryUrls = new Set((inventory.pages ?? []).map((p) => p.url));
const inventoryByUrl = new Map((inventory.pages ?? []).map((p) => [p.url, p]));
/** path -> cluster ที่ยังไม่มี canonical owner */
const clusterByPath = new Map();
for (const c of clusterDoc.clusters ?? []) {
  for (const path of c.competing_urls) clusterByPath.set(path, c);
}
const sitemapUrls = new Set(sitemap.urls ?? []);

const CACHE_PATH = opt('cache', join(ROOT, 'tools/.qa-cache.json'));
const cache = existsSync(CACHE_PATH) ? readJson(CACHE_PATH) : {};

function listPackageDirs() {
  const dirs = [];
  const roots = [join(ROOT, 'content-packages')];
  if (argv.has('--fixtures')) roots.push(join(ROOT, 'tests/fixtures'));
  for (const base of roots) {
    if (!existsSync(base)) continue;
    for (const entry of readdirSync(base)) {
      const full = join(base, entry);
      if (entry.startsWith('.') || !statSync(full).isDirectory()) continue;
      dirs.push(full);
    }
  }
  return dirs.sort();
}

function hashPackage(dir) {
  const h = createHash('sha256');
  for (const f of REQUIRED_FILES) {
    const p = join(dir, f);
    h.update(f).update(existsSync(p) ? readFileSync(p) : Buffer.from('<missing>'));
  }
  return h.digest('hex');
}

/** หลักฐานที่ audit.json ให้ไว้ เพียงพอสำหรับ severity นี้หรือไม่ */
function evidenceSatisfies(audit, severity) {
  const entries = Array.isArray(audit?.evidence) ? audit.evidence : [];
  return entries.some((e) => {
    if (!e || e.verified !== true) return false;
    const src = sourceById.get(e.source_id);
    if (!src || src.status !== 'SUPPLIED') return false;
    if (severity === 'EVIDENCE') return EVIDENCE_AUTHORITIES.has(src.authority);
    if (severity === 'OWNER') return OWNER_AUTHORITIES.has(src.authority) && e.owner_confirmed === true;
    return false;
  });
}

function scanForbidden(text) {
  const hits = [];
  for (const rule of rules) {
    rule.re.lastIndex = 0;
    const found = text.match(rule.re);
    if (found) hits.push({ rule_id: rule.id, severity: rule.severity, claim_ref: rule.claim_ref, message: rule.message, matches: [...new Set(found)].slice(0, 8) });
  }
  return hits;
}

function checkPackage(dir) {
  const name = dir.replace(ROOT + '/', '');
  const findings = [];
  const add = (level, code, detail) => findings.push({ level, code, detail });

  const missing = REQUIRED_FILES.filter((f) => !existsSync(join(dir, f)));
  if (missing.length) {
    add('FAIL', 'PKG_INCOMPLETE', `ขาดไฟล์บังคับ: ${missing.join(', ')}`);
    return { package: name, tier: 'UNDETERMINED', findings, status: 'FAIL' };
  }

  const raw = Object.fromEntries(REQUIRED_FILES.map((f) => [f, readFileSync(join(dir, f), 'utf8')]));
  const parsed = {};
  for (const f of ['meta.json', 'audit.json', 'package_status.json', 'schema.jsonld']) {
    try { parsed[f] = JSON.parse(raw[f]); }
    catch (err) { add('FAIL', 'JSON_INVALID', `${f}: ${err.message}`); }
  }
  if (findings.some((f) => f.code === 'JSON_INVALID')) {
    return { package: name, tier: 'UNDETERMINED', findings, status: 'FAIL' };
  }

  const meta = parsed['meta.json'];
  const audit = parsed['audit.json'];
  const status = parsed['package_status.json'];
  const schema = parsed['schema.jsonld'];

  // --- ยังเป็นเทมเพลตอยู่ไหม
  const placeholders = REQUIRED_FILES.filter((f) => /\{\{[^}]*\}\}/.test(raw[f]));
  if (placeholders.length) add('FAIL', 'PLACEHOLDER_LEFT', `ยังมี {{...}} ค้างใน: ${placeholders.join(', ')}`);

  // --- กติกาสถานะ: ห้ามหลุด DRAFT / ห้าม publish โดยไม่ผ่านทุก gate
  if (status.package_status !== 'DRAFT_PENDING_REVIEW' && status.gates?.owner_approval !== 'GRANTED') {
    add('FAIL', 'STATUS_ESCAPED_DRAFT', `package_status = ${status.package_status} แต่ owner_approval = ${status.gates?.owner_approval}`);
  }
  const renderPass = gates.gates['GATE-RENDER'].status === 'PASS';
  const allGatesPass = status.gates && ['mechanical', 'claim_qa', 'cannibalization'].every((g) => status.gates[g] === 'PASS')
    && status.gates.owner_approval === 'GRANTED' && renderPass;
  if (status.publish_allowed === true && !allGatesPass) {
    add('FAIL', 'PUBLISH_NOT_ALLOWED', 'publish_allowed = true แต่ยังผ่าน gate ไม่ครบ (รวม rendering gate และ owner approval)');
  }
  if (!renderPass && meta.robots && !/noindex/i.test(meta.robots)) {
    add('FAIL', 'ROBOTS_TOO_OPEN', `rendering gate ยัง ${gates.gates['GATE-RENDER'].status} แต่ meta.robots = "${meta.robots}" — ต้องคง noindex`);
  }

  // --- metadata
  const tLen = [...(meta.title ?? '')].length;
  if (tLen < TITLE_MIN || tLen > TITLE_MAX) add('FAIL', 'META_TITLE_LEN', `title ยาว ${tLen} ตัวอักษร (ต้อง ${TITLE_MIN}-${TITLE_MAX})`);
  const dLen = [...(meta.meta_description ?? '')].length;
  if (dLen < DESC_MIN || dLen > DESC_MAX) add('FAIL', 'META_DESC_LEN', `meta_description ยาว ${dLen} ตัวอักษร (ต้อง ${DESC_MIN}-${DESC_MAX})`);
  for (const field of ['canonical', 'target_url', 'page_type', 'canonical_intent', 'primary_keyword', 'intent', 'action']) {
    if (!meta[field]) add('FAIL', 'META_MISSING', `meta.json ขาดฟิลด์ ${field}`);
  }
  for (const field of ['canonical', 'target_url']) {
    if (meta[field] && !String(meta[field]).startsWith(SITE_ORIGIN)) {
      add('FAIL', 'META_URL_ORIGIN', `${field} ต้องขึ้นต้นด้วย ${SITE_ORIGIN}`);
    }
  }

  // --- sitemap / internal links (ถ้า source ยังไม่มา = ตรวจไม่ได้ ห้ามนับเป็นผ่าน)
  if (sitemapUrls.size === 0) {
    add('BLOCKED_ON_SOURCE', 'SITEMAP_UNAVAILABLE', 'data/sitemap_urls.json ว่าง (SRC-WEB-001 ยังไม่ส่ง) — ตรวจ sitemap ไม่ได้');
  } else if (meta.target_url && !sitemapUrls.has(meta.target_url)) {
    add('FAIL', 'SITEMAP_MISS', `target_url ไม่อยู่ใน sitemap ปัจจุบัน: ${meta.target_url}`);
  }
  const links = Array.isArray(meta.internal_links) ? meta.internal_links : [];
  if (inventoryUrls.size === 0) {
    add('BLOCKED_ON_SOURCE', 'INVENTORY_UNAVAILABLE', 'data/page_inventory.json ว่าง (SRC-WEB-002 ยังไม่ส่ง) — ตรวจ internal links ไม่ได้');
  } else {
    if (links.length === 0) add('FAIL', 'INTERNAL_LINKS_EMPTY', 'ไม่มี internal_links เลย');
    for (const l of links) {
      const url = typeof l === 'string' ? l : l?.url;
      if (!url || !inventoryUrls.has(url)) add('FAIL', 'INTERNAL_LINK_UNKNOWN', `internal link ไม่อยู่ใน page inventory: ${url ?? JSON.stringify(l)}`);
    }
  }

  // --- cannibalization: ห้ามยิง intent ของ cluster ที่ยังไม่มีเจ้าของ canonical
  const targetPath = meta.target_url ? String(meta.target_url).replace(SITE_ORIGIN, '') || '/' : null;
  const cluster = targetPath ? clusterByPath.get(targetPath) : null;
  if (cluster && !cluster.canonical_owner) {
    const detail = `${cluster.cluster_id} ${cluster.label} — ${cluster.count} URL เดิมชน intent เดียวกัน และยังไม่มี canonical_owner`;
    if (meta.action === 'NEW') add('FAIL', 'CANNIBAL_UNRESOLVED', `ห้ามสร้างหน้าใหม่ใน cluster นี้: ${detail}`);
    else add('FAIL', 'CANNIBAL_NO_OWNER', `target_url อยู่ใน cluster ที่ยังไม่ตัดสิน: ${detail}`);
  }

  // --- schema
  if (!schema['@context'] || !schema['@type']) add('FAIL', 'SCHEMA_SHAPE', 'schema.jsonld ต้องมี @context และ @type');
  if (schema.url && meta.canonical && schema.url !== meta.canonical) add('FAIL', 'SCHEMA_URL_MISMATCH', 'schema.url ไม่ตรงกับ meta.canonical');
  if (schema.name && meta.title && schema.name !== meta.title) add('FAIL', 'SCHEMA_NAME_MISMATCH', 'schema.name ไม่ตรงกับ meta.title');
  for (const key of SCHEMA_COMMERCIAL_KEYS) {
    if (key in schema && !evidenceSatisfies(audit, 'OWNER')) {
      add('FAIL', 'SCHEMA_UNBACKED_COMMERCIAL', `schema มี "${key}" แต่ไม่มีหลักฐาน ACS ที่ยืนยันแล้ว (CLM-O-001 / CLM-B-003)`);
    }
  }

  // --- forbidden words
  const scanText = [raw['article.md'], meta.title, meta.meta_description, JSON.stringify(schema)].filter(Boolean).join('\n');
  const hits = scanForbidden(scanText);
  let evidenceFlags = 0, ownerFlags = 0;
  for (const h of hits) {
    if (h.severity === 'BLOCK') {
      add('FAIL', 'FORBIDDEN_BLOCK', `${h.rule_id} พบ [${h.matches.join(' | ')}] — ${h.message}`);
    } else if (h.severity === 'EVIDENCE') {
      evidenceFlags++;
      if (!evidenceSatisfies(audit, 'EVIDENCE')) {
        add('FAIL', 'EVIDENCE_MISSING', `${h.rule_id} พบ [${h.matches.join(' | ')}] — ${h.message}`);
      }
    } else if (h.severity === 'OWNER') {
      ownerFlags++;
      if (!evidenceSatisfies(audit, 'OWNER')) {
        add('FAIL', 'OWNER_CONFIRM_MISSING', `${h.rule_id} พบ [${h.matches.join(' | ')}] — ${h.message}`);
      }
    }
  }

  // --- หลักฐานครบไหม และราคายังไม่หมดอายุไหม
  const ev = checkPackageEvidence(dir, AS_OF, evidenceCtx);
  for (const problem of ev.problems) add('FAIL', 'EVIDENCE_INCOMPLETE', problem.replace(dir + '/', ''));
  for (const warning of ev.warnings) add('WARN', 'EVIDENCE_EXPIRING', warning.replace(dir + '/', ''));

  // --- claim id ที่อ้างถึงต้องมีจริงในทะเบียนกลาง
  const referenced = new Set([
    ...(raw['article.md'].match(/CLM-[A-Z]-\d{3}/g) ?? []),
    ...(raw['claim_register.md'].match(/CLM-[A-Z]-\d{3}/g) ?? []),
    ...(audit.evidence ?? []).map((e) => e?.claim_id).filter(Boolean),
    ...(status.flagged_claims ?? []),
  ]);
  for (const id of referenced) {
    const claim = claimById.get(id);
    if (!claim) { add('FAIL', 'CLAIM_UNKNOWN', `อ้าง claim ที่ไม่มีในทะเบียนกลาง: ${id}`); continue; }
    if (claim.class === 'BLOCKED' && !raw['claim_register.md'].includes(id)) {
      add('FAIL', 'CLAIM_BLOCKED_USED', `ใช้ claim ที่เป็น BLOCKED โดยไม่บันทึกการลบใน claim_register.md: ${id}`);
    }
  }
  for (const id of status.blocked_on_sources ?? []) {
    if (!sourceById.has(id)) add('FAIL', 'SOURCE_UNKNOWN', `อ้าง source ที่ไม่มีใน Source Pack: ${id}`);
  }

  // --- ระดับ QA ที่ต้องใช้
  const isP0 = status.p0 === true;
  const isNew = meta.action === 'NEW';
  const targetPage = meta.target_url ? inventoryByUrl.get(meta.target_url) : null;
  const pageRiskFlags = (targetPage?.risk_flags ?? []).filter((f) => FULL_QA_FLAGS.has(f));
  let tier;
  if (isP0 || isNew || evidenceFlags > 0 || ownerFlags > 0 || pageRiskFlags.length > 0) tier = 'T2_FULL';
  else if ((status.flagged_claims ?? []).length > 0) tier = 'T1_CLAIM';
  else tier = 'WORDING_QA_OK';

  const hasFail = findings.some((f) => f.level === 'FAIL');
  const blocked = findings.some((f) => f.level === 'BLOCKED_ON_SOURCE');
  return {
    package: name,
    tier,
    evidence_flags: evidenceFlags,
    owner_flags: ownerFlags,
    page_risk_flags: pageRiskFlags,
    findings,
    status: hasFail ? 'FAIL' : blocked ? 'BLOCKED_ON_SOURCE' : 'PASS',
  };
}

function printBoard() {
  const board = readJson(join(DATA_DIR, 'packages.json'));
  const tally = {};
  for (const p of board.packages) tally[p.board_status] = (tally[p.board_status] ?? 0) + 1;
  console.log(`\nPackage Status Board — as of ${board.as_of} (${board.packages.length}/${board.total_packages_declared_by_owner} packages)`);
  console.log('-'.repeat(96));
  for (const p of board.packages) {
    console.log(`${p.board_status.padEnd(8)} ${p.package_id.padEnd(20)} ${(p.package_status).padEnd(22)} ${p.board_reason}`);
  }
  console.log('-'.repeat(96));
  console.log(Object.entries(tally).map(([k, v]) => `${k}=${v}`).join('  '));
  console.log(`rendering gate: ${gates.gates['GATE-RENDER'].status}  |  cannibalization gate: ${gates.gates['GATE-CANNIBAL'].status}\n`);
}

function main() {
  if (argv.has('--board')) { printBoard(); return 0; }

  const dirs = listPackageDirs();
  const results = [];
  let skipped = 0;

  for (const dir of dirs) {
    const key = dir.replace(ROOT + '/', '');
    const hash = hashPackage(dir);
    if (argv.has('--changed-only') && cache[key]?.hash === hash && cache[key]?.status === 'PASS') {
      skipped++;
      results.push({ package: key, tier: cache[key].tier, findings: [], status: 'SKIPPED_UNCHANGED' });
      continue;
    }
    const res = checkPackage(dir);
    cache[key] = { hash, status: res.status, tier: res.tier, checked_at: new Date().toISOString() };
    results.push(res);
  }
  writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2) + '\n');

  const failed = results.filter((r) => r.status === 'FAIL');
  const blocked = results.filter((r) => r.status === 'BLOCKED_ON_SOURCE');
  const passed = results.filter((r) => r.status === 'PASS');

  if (argv.has('--json')) {
    console.log(JSON.stringify({ as_of: new Date().toISOString(), rendering_gate: gates.gates['GATE-RENDER'].status, results }, null, 2));
  } else {
    console.log(`\nACS SEO mechanical QA — ${results.length} package(s) พบใน content-packages/${argv.has('--fixtures') ? ' + tests/fixtures/' : ''}`);
    if (results.length === 0) {
      console.log('  (ยังไม่มีแพ็กเกจในระบบ — คัด template/package/ ไปสร้างใน content-packages/<PKG-ID>/)');
    }
    for (const r of results) {
      console.log(`\n[${r.status}] ${r.package}  tier=${r.tier}`);
      for (const f of r.findings) console.log(`   ${f.level.padEnd(18)} ${f.code.padEnd(28)} ${f.detail}`);
    }
    console.log(`\nสรุป: PASS=${passed.length}  FAIL=${failed.length}  BLOCKED_ON_SOURCE=${blocked.length}  SKIPPED=${skipped}`);
    console.log(`Rendering gate (global): ${gates.gates['GATE-RENDER'].status} — ${gates.gates['GATE-RENDER'].status === 'PASS' ? 'พร้อมพิจารณา index' : 'ห้ามนับว่าพร้อม SEO'}`);
    console.log('ทุกแพ็กเกจยังคงเป็น DRAFT_PENDING_REVIEW จนกว่า Owner จะอนุมัติ\n');
  }
  return failed.length > 0 ? 1 : 0;
}

process.exit(main());
