#!/usr/bin/env node
/**
 * ตรวจว่า "หลักฐานมาถึงจริง" ไม่ใช่แค่มีช่องให้กรอก
 *
 * validate.mjs บอกว่าข้อความไหนต้องการหลักฐาน — ไฟล์นี้ตรวจว่าหลักฐานนั้นครบและยังไม่หมดอายุ
 *
 *   node tools/evidence-check.mjs <package-dir> [...]
 *   node tools/evidence-check.mjs <dir> --as-of 2026-12-01     ประเมินความถูกต้องของราคา ณ วันที่กำหนด
 *
 * อ่านสองอย่าง: `audit.json` (ดัชนี claim → source) และไฟล์ `*evidence*.json` (ตัวบันทึกหลักฐาน)
 *
 * ราคามีกฎพิเศษที่หลักฐานอื่นไม่ต้องมี: `valid_until` เป็นฟิลด์บังคับ และต้องยังไม่ผ่าน
 * เพราะราคาที่ไม่มีวันหมดอายุไม่ได้ "ถูกต้องตลอดไป" แต่จะค้างอยู่บนหน้าเว็บโดยยังดูเหมือน
 * มีแหล่งอ้างอิง ซึ่งคือความเสียหายที่คำตัดสิน Queue #16/#18 ต้องการกันไว้
 *
 * ค่าที่วัดมาก็เช่นกัน: ตัวเลขที่วัดที่ 23 °C ไม่ได้อนุญาตให้พูดถึงห้องแช่แข็ง
 * การลอกตัวเลขมาโดยไม่เอาเงื่อนไขการวัดมาด้วย คือวิธีที่ claim ที่มีหลักฐานกลายเป็น claim เท็จ
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const WARN_WITHIN_DAYS = 30;
const CONDITION_FIELDS = ['temperature', 'exposure', 'substrate', 'duration', 'test_method'];
const OWNER_CLASSES = new Set(['OWNER_REQUIRED']);
const EVIDENCE_CLASSES = new Set(['EVIDENCE_REQUIRED', 'OWNER_REQUIRED']);

const isBlank = (v) => v === undefined || v === null || String(v).trim() === '';
const daysBetween = (a, b) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);
const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));

/** ตรวจ audit.json — ดัชนีที่ผูก claim เข้ากับ source ในทะเบียนกลาง */
function checkAudit(file, ctx, out) {
  let audit;
  try { audit = readJson(file); }
  catch (err) { out.problems.push(`${file}: JSON ไม่ถูกต้อง (${err.message})`); return; }

  for (const e of audit.evidence ?? []) {
    out.records++;
    if (isBlank(e.claim_id)) { out.problems.push(`${file}: มี evidence entry ที่ไม่ระบุ claim_id`); continue; }
    const claim = ctx.claimById.get(e.claim_id);
    if (!claim) { out.problems.push(`${file}: claim ${e.claim_id} ไม่มีในทะเบียนกลาง`); continue; }
    if (!EVIDENCE_CLASSES.has(claim.class)) continue;

    if (e.verified !== true) {
      out.problems.push(`${file}: claim ${e.claim_id} เป็น ${claim.class} แต่ยัง verified = false — ต้องมีหลักฐานก่อนแพ็กเกจจะผ่านได้`);
      continue;
    }
    const src = ctx.sourceById.get(e.source_id);
    if (!src) { out.problems.push(`${file}: claim ${e.claim_id} อ้าง source ${e.source_id} ที่ไม่มีใน Source Pack`); continue; }
    if (src.status !== 'SUPPLIED') {
      out.problems.push(`${file}: claim ${e.claim_id} อ้าง ${e.source_id} ซึ่งยังเป็น ${src.status} — ยังใช้เป็นหลักฐานไม่ได้`);
    }
    if (isBlank(e.source_locator)) {
      out.problems.push(`${file}: claim ${e.claim_id} ไม่ระบุ source_locator — ต้องบอกหน้าหรือหัวข้อที่ยืนยันข้อความนี้`);
    }
    if (OWNER_CLASSES.has(claim.class) && e.owner_confirmed !== true) {
      out.problems.push(`${file}: claim ${e.claim_id} เป็น OWNER_REQUIRED แต่ยังไม่มี owner_confirmed`);
    }
  }
}

/** ราคาพกหน้าต่างเวลาของตัวเองมาด้วย — ทุกอย่างในนี้คือเรื่องหน้าต่างนั้น */
function checkPriceRecord(file, rec, asOf, out) {
  const v = rec.validity ?? {};
  const p = rec.price ?? {};

  for (const f of ['effective_date', 'valid_until']) {
    if (isBlank(v[f])) {
      out.problems.push(`${file}: validity.${f} ว่าง — ${f === 'valid_until' ? 'ราคาที่ไม่มีวันหมดอายุจะค้างอยู่บนหน้าเว็บเงียบ ๆ' : 'ราคาที่ไม่มีวันมีผลตรวจสอบไม่ได้'}`);
      continue;
    }
    if (!ISO.test(v[f])) out.problems.push(`${file}: validity.${f} ไม่ใช่รูปแบบ YYYY-MM-DD`);
  }
  if (ISO.test(v.effective_date ?? '') && daysBetween(asOf, v.effective_date) > 0) {
    out.problems.push(`${file}: validity.effective_date ${v.effective_date} เป็นวันในอนาคต ณ ${asOf}`);
  }
  if (ISO.test(v.valid_until ?? '')) {
    const left = daysBetween(asOf, v.valid_until);
    if (left < 0) out.problems.push(`${file}: ราคาหมดอายุแล้ว — valid_until ${v.valid_until} ผ่านมา ${-left} วัน ณ ${asOf} ห้ามคงไว้บนหน้าเว็บ`);
    else if (left <= WARN_WITHIN_DAYS) out.warnings.push(`${file}: ราคาจะหมดอายุในอีก ${left} วัน (${v.valid_until}) — นัดตรวจซ้ำได้แล้ว`);
  }
  if (ISO.test(v.effective_date ?? '') && ISO.test(v.valid_until ?? '') && daysBetween(v.effective_date, v.valid_until) < 0) {
    out.problems.push(`${file}: validity.valid_until มาก่อน validity.effective_date`);
  }

  if (p.amount === null || p.amount === undefined) out.problems.push(`${file}: price.amount ว่าง`);
  if (isBlank(p.currency)) out.problems.push(`${file}: price.currency ว่าง`);
  if (isBlank(p.unit)) out.problems.push(`${file}: price.unit ว่าง — "18,500" ยังไม่เป็นราคาจนกว่าจะบอกว่าต่ออะไร`);
  if (p.includes_vat === null || p.includes_vat === undefined) {
    out.problems.push(`${file}: price.includes_vat ยังไม่ระบุ — ขอบเขต VAT เป็นส่วนหนึ่งของราคา ไม่ใช่เชิงอรรถ`);
  }
  if (isBlank(rec.source?.issued_by)) {
    out.problems.push(`${file}: source.issued_by ว่าง — ราคาต้องมาจาก ACS ไม่ใช่จากหน้าเว็บผู้ผลิต`);
  }

  const wording = `${rec.approved_wording_th ?? ''}${rec.approved_wording_en ?? ''}`;
  if (!isBlank(wording) && ISO.test(v.effective_date ?? '') && !wording.includes(v.effective_date)) {
    out.problems.push(`${file}: ข้อความที่อนุมัติไม่ได้พา effective_date ${v.effective_date} ไปด้วย — วันที่ต้องปรากฏให้ผู้อ่านเห็น ไม่ใช่อยู่แค่ในไฟล์นี้`);
  }
}

function checkEvidenceRecord(file, asOf, out) {
  let rec;
  try { rec = readJson(file); }
  catch (err) { out.problems.push(`${file}: JSON ไม่ถูกต้อง (${err.message})`); return; }
  if (rec._readme && isBlank(rec.sentence_verbatim)) return;   // เทมเพลตที่ยังไม่ถูกใช้
  out.records++;

  if (isBlank(rec.sentence_verbatim)) out.problems.push(`${file}: sentence_verbatim ว่าง — ไม่มีข้อความให้หาหลักฐาน`);
  if (rec.verdict === 'CLEARED' && (isBlank(rec.reviewer) || isBlank(rec.reviewed_on))) {
    out.problems.push(`${file}: ตั้ง CLEARED โดยไม่มีผู้ตรวจและวันที่`);
  }

  const isPrice = Object.hasOwn(rec, 'price') || Object.hasOwn(rec, 'validity');
  if (isPrice) {
    for (const f of ['document_uri_or_location', 'revision_or_date', 'date_checked', 'checked_by']) {
      if (isBlank(rec.source?.[f])) out.problems.push(`${file}: source.${f} ว่าง`);
    }
    checkPriceRecord(file, rec, asOf, out);
    return;
  }

  for (const f of ['document_uri', 'revision_or_date', 'date_checked', 'checked_by']) {
    if (isBlank(rec.source?.[f])) out.problems.push(`${file}: source.${f} ว่าง`);
  }
  if (isBlank(rec.product?.vendor) || isBlank(rec.product?.part_number)) {
    out.problems.push(`${file}: ไม่ได้ระบุว่าหลักฐานนี้เป็นของสินค้าตัวไหน (ต้องมี vendor + part_number)`);
  }
  if (isBlank(rec.what_the_source_actually_says)) {
    out.problems.push(`${file}: what_the_source_actually_says ว่าง — เทียบข้อความกับแหล่งไม่ได้`);
  }
  const quotesFigure = [rec.what_the_source_actually_says, rec.approved_wording_th, rec.approved_wording_en]
    .some((t) => /\d/.test(String(t ?? '')));
  if (quotesFigure) {
    const stated = CONDITION_FIELDS.filter((k) => !isBlank(rec.measured_conditions?.[k]));
    if (stated.length === 0) {
      out.problems.push(`${file}: มีการอ้างตัวเลขแต่ไม่ได้บันทึกเงื่อนไขที่วัดมาเลย — นี่คือวิธีที่ claim ซึ่งมีหลักฐานกลายเป็น claim เท็จ`);
    }
  }
}

/** ตรวจหนึ่งแพ็กเกจ — ใช้ได้ทั้งจาก CLI และจาก validate.mjs */
export function checkPackageEvidence(dir, asOf = new Date().toISOString().slice(0, 10), ctx = defaultContext()) {
  const out = { problems: [], warnings: [], records: 0 };
  walk(dir, asOf, ctx, out);
  return out;
}

export function defaultContext(dataDir = join(ROOT, 'data')) {
  const claims = readJson(join(dataDir, 'claims.json'));
  const sources = readJson(join(dataDir, 'source_pack.json'));
  return {
    claimById: new Map(claims.claims.map((c) => [c.id, c])),
    sourceById: new Map(sources.sources.map((s) => [s.id, s])),
  };
}

function walk(target, asOf, ctx, out) {
  if (!existsSync(target)) { out.problems.push(`${target}: ไม่พบ`); return; }
  if (!statSync(target).isDirectory()) {
    if (basename(target) === 'audit.json') checkAudit(target, ctx, out);
    else checkEvidenceRecord(target, asOf, out);
    return;
  }
  for (const entry of readdirSync(target)) {
    const full = join(target, entry);
    if (statSync(full).isDirectory()) { walk(full, asOf, ctx, out); continue; }
    if (entry === 'audit.json') checkAudit(full, ctx, out);
    else if (/evidence.*\.json$/i.test(entry)) checkEvidenceRecord(full, asOf, out);
  }
}

/* ---------- CLI ---------- */
if (import.meta.url === `file://${process.argv[1]}`) {
  const argv = process.argv.slice(2);
  const asOfIndex = argv.indexOf('--as-of');
  const asOf = asOfIndex >= 0 && argv[asOfIndex + 1] ? argv[asOfIndex + 1] : new Date().toISOString().slice(0, 10);
  // asOfIndex เป็น -1 เมื่อไม่ได้ส่ง --as-of จึงต้องกันไม่ให้ตัด argv[0] ซึ่งเป็นเป้าหมายทิ้งไป
  const asOfValueIndex = asOfIndex >= 0 ? asOfIndex + 1 : -1;
  const targets = argv.filter((a, i) => !a.startsWith('--') && i !== asOfValueIndex);
  if (!targets.length) {
    console.error('ใช้: node tools/evidence-check.mjs <package-dir> [...] [--as-of YYYY-MM-DD]');
    process.exit(2);
  }
  const ctx = defaultContext();
  const all = { problems: [], warnings: [], records: 0 };
  for (const t of targets) {
    const r = checkPackageEvidence(t, asOf, ctx);
    all.problems.push(...r.problems); all.warnings.push(...r.warnings); all.records += r.records;
  }
  if (all.warnings.length) {
    console.log('คำเตือน:\n');
    for (const w of all.warnings) console.log(`  ! ${w}`);
    console.log('');
  }
  if (all.problems.length) {
    console.log('หลักฐานยังไม่ครบ:\n');
    for (const p of all.problems) console.log(`  - ${p}`);
    console.log(`\nพบ ${all.problems.length} ปัญหา จาก ${all.records} รายการ ณ ${asOf}`);
    process.exit(1);
  }
  console.log(`หลักฐานครบ — ตรวจ ${all.records} รายการ ณ ${asOf} ไม่มีอะไรขาด`);
}
