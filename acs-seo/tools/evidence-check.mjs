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
 *
 * It reads `audit.json` (claims array) and any `*evidence*.json` in the package.
 */
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, basename } from "node:path";

const REQUIRED_SOURCE = ["document_uri", "revision_or_date", "date_checked", "checked_by"];
const NEEDS_CONDITIONS = /\d/; // a quoted figure must carry its measured conditions

const targets = process.argv.slice(2).filter((a) => !a.startsWith("--"));
if (!targets.length) {
  console.error("usage: node evidence-check.mjs <package-dir> [...]");
  process.exit(2);
}

const problems = [];
let recordsChecked = 0;

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

function checkEvidence(file) {
  let rec;
  try { rec = JSON.parse(readFileSync(file, "utf8")); }
  catch (err) { problems.push(`${file}: not valid JSON (${err.message})`); return; }
  if (rec._readme && isBlank(rec.sentence_verbatim)) return; // untouched template
  recordsChecked += 1;

  if (isBlank(rec.sentence_verbatim)) problems.push(`${file}: "sentence_verbatim" is empty — there is nothing to evidence`);
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

if (problems.length) {
  console.log("incomplete evidence:\n");
  for (const p of problems) console.log(`  - ${p}`);
  console.log(`\n${problems.length} problem(s) across ${recordsChecked} record(s)`);
  process.exit(1);
}
console.log(`evidence complete — ${recordsChecked} record(s) checked, nothing missing`);
