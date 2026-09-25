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
import { loadRules, scanForbidden, exemptSpans, findLinks, canonicalizeTarget } from './forbidden-scan.mjs';
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
const rules = loadRules(join(DATA_DIR, 'forbidden_terms.json'));
const inventoryUrls = new Set((inventory.pages ?? []).map((p) => p.url));
const inventoryByUrl = new Map((inventory.pages ?? []).map((p) => [p.url, p]));
/*
 * path -> cluster ทุกกลุ่มที่ path นั้นอยู่
 *
 * ต้องเป็นรายการ ไม่ใช่ค่าเดียว — URL หนึ่งอยู่ได้หลายกลุ่มพร้อมกัน (ตอนนี้
 * /retail-barcode-scanner อยู่ทั้ง C-1 และ C-6) ถ้าเก็บค่าเดียว กลุ่มที่เขียนทีหลัง
 * ในไฟล์จะทับกลุ่มก่อนหน้า แล้วผลของ gate จะขึ้นกับลำดับบรรทัดใน JSON
 * ซึ่งไม่ใช่คุณสมบัติด้านความปลอดภัย · ถ้ากลุ่มที่มีหน้าหลักบังเอิญอยู่ทีหลัง
 * หน้าที่ยังชนกับกลุ่มที่ไม่มีหน้าหลักจะผ่าน gate ไปเงียบ ๆ
 */
const clustersByPath = new Map();
for (const c of clusterDoc.clusters ?? []) {
  for (const path of c.competing_urls) {
    if (!clustersByPath.has(path)) clustersByPath.set(path, []);
    clustersByPath.get(path).push(c);
  }
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

/*
 * ลายนิ้วมือของ "กติกา" คือตัวเครื่องมือกับไฟล์ข้อมูลทั้งหมด ไม่ใช่แค่ไฟล์ในแพ็กเกจ
 *
 * ก่อนหน้านี้ hashPackage() แฮชเฉพาะ REQUIRED_FILES แปลว่าเมื่อแก้กฎใน forbidden_terms.json
 * หรือแก้ validate.mjs เอง แพ็กเกจที่ไฟล์ไม่เปลี่ยนจะถูกคืนจากแคชเป็น SKIPPED_UNCHANGED
 * แล้ว --changed-only จะให้ไฟเขียวจากกติกาที่ไม่เคยถูกประเมินเลย
 *
 * ครอบคลุมเกินจริงโดยตั้งใจ (เช่น packages.json ไม่มีผลต่อคำตัดสินรายแพ็กเกจ) เพราะการ
 * ตรวจซ้ำเกินจำเป็นเสียแค่เวลา ส่วนการข้ามการตรวจทำให้ด่านหายไปเงียบ ๆ
 */
const TOOLCHAIN_FINGERPRINT = (() => {
  const h = createHash('sha256');
  const add = (dir, filter) => {
    if (!existsSync(dir)) return;
    for (const f of readdirSync(dir).sort()) {
      if (!filter(f)) continue;
      h.update(f).update(readFileSync(join(dir, f)));
    }
  };
  add(join(ROOT, 'tools'), (f) => f.endsWith('.mjs'));
  add(DATA_DIR, (f) => f.endsWith('.json'));
  return h.digest('hex');
})();

function hashPackage(dir) {
  const h = createHash('sha256');
  h.update(TOOLCHAIN_FINGERPRINT);
  // ไฟล์ .html ถูกสแกนคำต้องห้ามเหมือน article.md จึงต้องอยู่ในกุญแจแคชด้วย
  const extra = readdirSync(dir).filter((f) => /\.html?$/i.test(f)).sort();
  for (const f of [...REQUIRED_FILES, ...extra]) {
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

/**
 * ตัดจำนวน matches ที่ 8 เพื่อไม่ให้ข้อความ finding ยาวเกินอ่าน — การสแกนอยู่ใน forbidden-scan.mjs
 *
 * ยกเว้นช่วงที่เป็นที่อยู่ของหน้าที่มีอยู่จริงใน inventory ถ้า inventory ว่าง (SRC-WEB-002 ยังไม่ส่ง)
 * จะไม่มีอะไรถูกยกเว้นเลย ซึ่งเป็นค่าตั้งต้นที่เข้มกว่า ไม่ใช่หลวมกว่า
 */
const scanPackageText = (text) =>
  scanForbidden(text, rules, exemptSpans(text, inventoryUrls))
    .map((h) => ({ ...h, matches: h.matches.slice(0, 8) }));

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
  /* หน้าที่ไม่เผยแพร่สาธารณะ: gate ที่เป็นเรื่อง SEO ล้วน ๆ ไม่มีผล เพราะไม่มีการ index
     แต่ gate เรื่อง claim ยังบังคับครบทุกข้อ — การจำกัดผู้เข้าถึงไม่ได้ทำให้ข้อความเป็นจริงขึ้น
     และในบริบทการขาย ข้อความที่ผิดยิ่งมีน้ำหนักมากขึ้น ไม่ใช่น้อยลง */
  const isPrivate = meta.visibility === 'PRIVATE';
  const renderPass = gates.gates['GATE-RENDER'].status === 'PASS';
  const allGatesPass = status.gates && ['mechanical', 'claim_qa', 'cannibalization'].every((g) => status.gates[g] === 'PASS')
    && status.gates.owner_approval === 'GRANTED' && renderPass;
  if (status.publish_allowed === true && !allGatesPass) {
    add('FAIL', 'PUBLISH_NOT_ALLOWED', 'publish_allowed = true แต่ยังผ่าน gate ไม่ครบ (รวม rendering gate และ owner approval)');
  }
  if (isPrivate) {
    for (const field of ['access_control', 'audience']) {
      if (!meta[field]) add('FAIL', 'PRIVATE_META_MISSING', `หน้า PRIVATE ต้องระบุ ${field} ว่าใครเข้าถึงได้และบังคับด้วยอะไร`);
    }
    if (meta.robots && !/noindex/i.test(meta.robots)) {
      add('FAIL', 'PRIVATE_MUST_NOINDEX', 'หน้า PRIVATE ต้องคง noindex — ถ้า index ได้ก็ไม่ใช่หน้าส่วนตัวอีกต่อไป');
    }
  }
  if (!isPrivate && !renderPass && meta.robots && !/noindex/i.test(meta.robots)) {
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
  if (isPrivate) {
    add('INFO', 'PRIVATE_SEO_CHECKS_SKIPPED', 'ข้ามการตรวจ sitemap, internal links และ cannibalization เพราะหน้านี้ไม่เผยแพร่สาธารณะ — การตรวจ claim ยังบังคับครบ');
  } else if (sitemapUrls.size === 0) {
    add('BLOCKED_ON_SOURCE', 'SITEMAP_UNAVAILABLE', 'data/sitemap_urls.json ว่าง (SRC-WEB-001 ยังไม่ส่ง) — ตรวจ sitemap ไม่ได้');
  } else if (meta.action === 'NEW') {
    // หน้าใหม่ย่อมไม่อยู่ใน sitemap ปัจจุบัน — การบังคับให้อยู่คือการบังคับให้เติม URL
    // ที่ยังไม่มีจริงลงในไฟล์ FACT ของเว็บ ข้อตรวจจึงกลับด้าน: ต้องยืนยันว่ายังไม่มี
    if (meta.target_url && sitemapUrls.has(meta.target_url)) {
      add('FAIL', 'NEW_PAGE_EXISTS',
        `action = NEW แต่ target_url อยู่ใน sitemap แล้ว จึงเป็นการปรับปรุงหน้าเดิม ให้ใช้ action = ENRICH: ${meta.target_url}`);
    }
  } else if (meta.target_url && !sitemapUrls.has(meta.target_url)) {
    add('FAIL', 'SITEMAP_MISS', `target_url ไม่อยู่ใน sitemap ปัจจุบัน: ${meta.target_url}`);
  }
  const links = Array.isArray(meta.internal_links) ? meta.internal_links : [];
  /* ลิงก์ที่อยู่ในเนื้อบทความจริง ๆ — เดิมไม่มีอะไรตรวจเลย validate ดูแต่รายการที่ประกาศไว้ใน meta
     ทั้งที่สิ่งที่ผู้อ่านคลิกคือลิงก์ในเนื้อ ไม่ใช่รายการใน meta */
  const declared = new Set(links.map((l) => canonicalizeTarget(typeof l === 'string' ? l : l?.url)).filter(Boolean));
  const bodyTargets = findLinks(raw['article.md']).targets;
  if (isPrivate) {
    // ไม่ตรวจ internal links ของหน้าที่ไม่อยู่ในโครงสร้างเว็บสาธารณะ
  } else if (inventoryUrls.size === 0) {
    add('BLOCKED_ON_SOURCE', 'INVENTORY_UNAVAILABLE', 'data/page_inventory.json ว่าง (SRC-WEB-002 ยังไม่ส่ง) — ตรวจ internal links ไม่ได้');
  } else {
    if (links.length === 0) add('FAIL', 'INTERNAL_LINKS_EMPTY', 'ไม่มี internal_links เลย');
    for (const l of links) {
      const url = typeof l === 'string' ? l : l?.url;
      if (!url || !inventoryUrls.has(url)) add('FAIL', 'INTERNAL_LINK_UNKNOWN', `internal link ไม่อยู่ใน page inventory: ${url ?? JSON.stringify(l)}`);
    }
    for (const t of bodyTargets) {
      if (!inventoryUrls.has(t.url)) {
        add('FAIL', 'BODY_LINK_UNKNOWN', `บทความลิงก์ไปหน้าที่ไม่มีใน page inventory: ${t.raw}`);
      } else if (!declared.has(t.url)) {
        add('FAIL', 'BODY_LINK_UNDECLARED',
          `บทความลิงก์ไป ${t.url} แต่ไม่ได้ประกาศไว้ใน meta.internal_links — รายการที่ประกาศคือสิ่งที่ถูกตรวจ ถ้าเนื้อบทความลิงก์เกินจากนั้น ส่วนที่เกินจะไม่เคยถูกตรวจเลย`);
      }
    }
  }

  // --- cannibalization: ห้ามยิง intent ของ cluster ที่ยังไม่มีเจ้าของ canonical
  const targetPath = meta.target_url ? String(meta.target_url).replace(SITE_ORIGIN, '') || '/' : null;
  /* กั้นถ้ามีกลุ่มใดก็ตามที่ยังไม่มีหน้าหลัก — ไม่ใช่แค่กลุ่มสุดท้ายที่เจอ */
  const memberOf = targetPath ? (clustersByPath.get(targetPath) ?? []) : [];
  const unowned = memberOf.filter((c) => !c.canonical_owner);
  const cluster = unowned[0] ?? null;
  if (cluster && !isPrivate) {
    const generic = cluster.generic_urls;
    const scope = generic
      ? `${cluster.count} URL ในกลุ่ม แต่ที่ชนกันจริงคือ ${generic.length} หน้าที่ไม่มี modifier (${generic.join(', ')})`
      : `${cluster.count} URL เดิมชน intent เดียวกัน`;
    const due = cluster.decision_due ? ` · กำหนดตัดสิน ${cluster.decision_due}` : '';
    const doc = cluster.decision_document ? ` · ดู ${cluster.decision_document}` : '';
    const alsoIn = memberOf.length > 1
      ? ` · URL นี้อยู่ ${memberOf.length} กลุ่มพร้อมกัน (${memberOf.map((c) => c.cluster_id).join(', ')}) ยังไม่มีหน้าหลัก ${unowned.length} กลุ่ม`
      : '';
    const detail = `${cluster.cluster_id} ${cluster.label} — ${scope} และยังไม่มี canonical_owner${due}${doc}${alsoIn}`;
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
  // ไฟล์ .html ในแพ็กเกจคือสิ่งที่ขึ้นเว็บจริง จึงต้องถูกสแกนเท่ากับ article.md
  const htmlFiles = readdirSync(dir).filter((f) => /\.html?$/i.test(f));
  const htmlText = htmlFiles.map((f) => readFileSync(join(dir, f), 'utf8'));
  const scanText = [raw['article.md'], ...htmlText, meta.title, meta.meta_description, JSON.stringify(schema)].filter(Boolean).join('\n');
  const hits = scanPackageText(scanText);
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
  /*
   * ลิงก์ไปหน้าที่ถือ flag เสี่ยง ต้องคง T2_FULL ไว้
   *
   * เดิมข้อนี้เกิดขึ้นเองโดยบังเอิญ — ลิงก์ไป /brady ทำให้ FW-E-009 จับชื่อผู้ผลิตใน URL
   * evidenceFlags จึงเป็นบวกและดัน tier ขึ้น T2 พอยกเว้น URL ออกจากการสแกนแล้ว
   * tier จะตกลงมาเงียบ ๆ และเพราะ QA_TIER_MISMATCH เป็นแค่ WARN คนจะ "แก้" ด้วยการ
   * ลด qa_tier ในไฟล์ตาม
   *
   * นับเฉพาะลิงก์ใน **เนื้อบทความ** ไม่นับ meta.internal_links เพราะตัวสแกนเดิมอ่านแค่
   * article.md / .html / title / meta description / schema — ไม่เคยอ่าน internal_links เลย
   * ขอบเขตนี้จึงเท่ากับพฤติกรรมเดิมพอดี ถ้านับ meta ด้วยจะกลายเป็นนโยบายใหม่
   * (PKG-ABOUT-ACS จะถูกดันจาก T1_CLAIM เป็น T2_FULL ทั้งที่ไม่เกี่ยวกับการยกเว้น URL)
   * ซึ่งเป็นคำถามที่ต้องออกแบบ ไม่ใช่แถมมากับการแก้บั๊ก
   */
  const linkedFlagged = [...new Set(bodyTargets.map((t) => t.url))]
    .map((u) => inventoryByUrl.get(u))
    .filter((p) => (p?.risk_flags ?? []).some((f) => FULL_QA_FLAGS.has(f)));
  let tier;
  if (isP0 || isNew || evidenceFlags > 0 || ownerFlags > 0 || pageRiskFlags.length > 0 || linkedFlagged.length > 0) tier = 'T2_FULL';
  else if ((status.flagged_claims ?? []).length > 0) tier = 'T1_CLAIM';
  else tier = 'WORDING_QA_OK';

  if (status.qa_tier && status.qa_tier !== tier) {
    add('WARN', 'QA_TIER_MISMATCH', `package_status.qa_tier = ${status.qa_tier} แต่กฎคำนวณได้ ${tier} — ให้แก้ไฟล์ให้ตรงกับที่กฎบอก หรืออธิบายว่าทำไมถึงต้องสูงกว่า`);
  }

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
