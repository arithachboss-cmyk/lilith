#!/usr/bin/env node
/**
 * Evidence completeness check.
 *
 * `claim-scan.mjs` finds claims that need evidence. This checks that the evidence
 * actually arrived: every claim row that is EVIDENCE_REQUIRED or OWNER_REQUIRED and
 * marked CLEARED must carry a real source, and every record that quotes a measured
 * value must carry the conditions it was measured under.
 *
 *   node evidence-check.mjs <package-dir> [...]     exit 1 if any record is incomplete
 *   node evidence-check.mjs <dir> --as-of 2026-12-01  evaluate price validity at a date
 *
 * It reads `audit.json` (claims array) and any `*evidence*.json` in the package.
 *
 * Price records get an extra rule the others do not need: `valid_until` is mandatory and
 * must not have passed. A price with no expiry does not stay correct — it rots on a live
 * page while still looking sourced, which is the exact failure the Owner decision for
 * Queue #16/#18 guards against.
 */
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, basename } from "node:path";
import { parseArgs } from "./argv.mjs";

const REQUIRED_SOURCE = ["document_uri", "revision_or_date", "date_checked", "checked_by"];
const NEEDS_CONDITIONS = /\d/; // a quoted figure must carry its measured conditions

const { values, positional } = parseArgs(process.argv.slice(2), ["as-of"]);
const asOf = values["as-of"] ?? new Date().toISOString().slice(0, 10);
const warnWithinDays = 30;
const targets = positional;
if (!targets.length) {
  console.error("usage: node evidence-check.mjs <package-dir> [...]");
  process.exit(2);
}

const problems = [];
const warnings = [];
let recordsChecked = 0;

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const daysBetween = (a, b) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);

function isBlank(v) {
  return v === undefined || v === null || String(v).trim() === "";
}

function checkAudit(file) {
  let audit;
  try { audit = JSON.parse(readFileSync(file, "utf8")); }
  catch (err) { problems.push(`${file}: not valid JSON (${err.message})`); return; }

  for (const claim of audit.claims ?? []) {
    recordsChecked += 1;
    const needsSource = ["EVIDENCE_REQUIRED", "OWNER_REQUIRED"].includes(claim.class);
    if (claim.verdict === "CLEARED") {
      if (!needsSource) continue;
      for (const f of ["source_uri", "source_revision", "date_checked", "reviewer"]) {
        if (isBlank(claim[f])) problems.push(`${file}: claim ${claim.claim_id} is CLEARED but "${f}" is empty`);
      }
    } else if (claim.verdict === "OPEN" && needsSource) {
      problems.push(`${file}: claim ${claim.claim_id} still OPEN — needs ${claim.class} evidence before the package can pass`);
    }
  }
}

/** A price record carries its own validity window. Everything here is about that window. */
function checkPriceRecord(file, rec) {
  const v = rec.validity ?? {};
  const p = rec.price ?? {};

  for (const f of ["effective_date", "valid_until"]) {
    if (isBlank(v[f])) { problems.push(`${file}: validity.${f} is empty — a price without ${f === "valid_until" ? "an expiry rots silently on a live page" : "an effective date cannot be checked"}`); continue; }
    if (!ISO.test(v[f])) problems.push(`${file}: validity.${f} is not YYYY-MM-DD`);
  }
  if (ISO.test(v.effective_date ?? "") && daysBetween(asOf, v.effective_date) > 0) {
    problems.push(`${file}: validity.effective_date ${v.effective_date} is in the future as of ${asOf}`);
  }
  if (ISO.test(v.valid_until ?? "")) {
    const left = daysBetween(asOf, v.valid_until);
    if (left < 0) problems.push(`${file}: price EXPIRED — valid_until ${v.valid_until} passed ${-left} day(s) ago as of ${asOf}. It must not stay published.`);
    else if (left <= warnWithinDays) warnings.push(`${file}: price expires in ${left} day(s) (${v.valid_until}) — schedule the re-check now`);
  }
  if (ISO.test(v.effective_date ?? "") && ISO.test(v.valid_until ?? "") && daysBetween(v.effective_date, v.valid_until) < 0) {
    problems.push(`${file}: validity.valid_until is before validity.effective_date`);
  }

  if (p.amount === null || p.amount === undefined) problems.push(`${file}: price.amount is empty`);
  if (isBlank(p.currency)) problems.push(`${file}: price.currency is empty`);
  if (isBlank(p.unit)) problems.push(`${file}: price.unit is empty — "18,500" is not a price until it says per what`);
  if (p.includes_vat === null || p.includes_vat === undefined) {
    problems.push(`${file}: price.includes_vat is unset — VAT scope is part of the price, not a footnote`);
  }
  if (isBlank(rec.source?.issued_by)) problems.push(`${file}: source.issued_by is empty — the price must come from ACS, not from a vendor page`);

  const wording = `${rec.approved_wording_th ?? ""}${rec.approved_wording_en ?? ""}`;
  if (!isBlank(wording) && ISO.test(v.effective_date ?? "") && !wording.includes(v.effective_date)) {
    problems.push(`${file}: the approved wording does not carry the effective date ${v.effective_date} — the date has to be visible to the reader, not only in this file`);
  }
}

function checkEvidence(file) {
  let rec;
  try { rec = JSON.parse(readFileSync(file, "utf8")); }
  catch (err) { problems.push(`${file}: not valid JSON (${err.message})`); return; }
  if (rec._readme && isBlank(rec.sentence_verbatim)) return; // untouched template
  recordsChecked += 1;

  if (isBlank(rec.sentence_verbatim)) problems.push(`${file}: "sentence_verbatim" is empty — there is nothing to evidence`);

  const isPrice = rec.claim_id === "CR-03" || Object.hasOwn(rec, "price") || Object.hasOwn(rec, "validity");
  if (isPrice) {
    for (const f of ["document_uri_or_location", "revision_or_date", "date_checked", "checked_by"]) {
      if (isBlank(rec.source?.[f])) problems.push(`${file}: source.${f} is empty`);
    }
    checkPriceRecord(file, rec);
    if (rec.verdict === "CLEARED" && (isBlank(rec.reviewer) || isBlank(rec.reviewed_on))) {
      problems.push(`${file}: CLEARED without a reviewer and date`);
    }
    return;
  }

  for (const f of REQUIRED_SOURCE) {
    if (isBlank(rec.source?.[f])) problems.push(`${file}: source.${f} is empty`);
  }
  if (isBlank(rec.product?.vendor) || isBlank(rec.product?.part_number)) {
    problems.push(`${file}: the product this claim is about is not identified (vendor + part_number)`);
  }
  if (isBlank(rec.what_the_source_actually_says)) {
    problems.push(`${file}: "what_the_source_actually_says" is empty — the claim cannot be checked against the source`);
  }
  const quotesFigure = NEEDS_CONDITIONS.test(String(rec.what_the_source_actually_says ?? ""))
    || NEEDS_CONDITIONS.test(String(rec.approved_wording_th ?? ""))
    || NEEDS_CONDITIONS.test(String(rec.approved_wording_en ?? ""));
  if (quotesFigure) {
    const cond = rec.measured_conditions ?? {};
    const stated = ["temperature", "exposure", "substrate", "duration", "test_method"].filter((k) => !isBlank(cond[k]));
    if (!stated.length) {
      problems.push(`${file}: a figure is quoted but no measured condition is recorded — this is how an evidenced claim becomes a false one`);
    }
  }
  if (rec.verdict === "CLEARED" && (isBlank(rec.reviewer) || isBlank(rec.reviewed_on))) {
    problems.push(`${file}: CLEARED without a reviewer and date`);
  }
}

function walk(dir) {
  if (!existsSync(dir)) { problems.push(`${dir}: not found`); return; }
  if (!statSync(dir).isDirectory()) { checkAudit(dir); return; }
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) { walk(full); continue; }
    if (basename(full) === "audit.json") checkAudit(full);
    else if (/evidence.*\.json$/i.test(entry)) checkEvidence(full);
  }
}

for (const t of targets) walk(t);

if (warnings.length) {
  console.log("warnings:\n");
  for (const w of warnings) console.log(`  ! ${w}`);
  console.log("");
}
if (problems.length) {
  console.log("incomplete evidence:\n");
  for (const p of problems) console.log(`  - ${p}`);
  console.log(`\n${problems.length} problem(s) across ${recordsChecked} record(s), as of ${asOf}`);
  process.exit(1);
}
console.log(`evidence complete — ${recordsChecked} record(s) checked as of ${asOf}, nothing missing`);
