/**
 * Runs the ACS claim scanner over the built HTML and records the result.
 * Fails when anything is BLOCKED. Writes test-results/claims.json, which is
 * also the record of every spec figure the build held back (T8, T15).
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const scanner = join(root, '..', 'acs-seo', 'tools', 'claim-scan.mjs');
const out = join(root, 'test-results');
mkdirSync(out, { recursive: true });

interface Finding { cr: string; cls: string; rule: string; match: string }
interface ScanFile { file: string; findings: Finding[] }

const run = spawnSync('node', [scanner, 'dist', '--all', '--json'], { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
let files: ScanFile[] = [];
let error = '';
try {
  files = (JSON.parse(run.stdout) as { files: ScanFile[] }).files;
} catch {
  error = `scanner output could not be read (exit ${run.status}): ${run.stderr.slice(0, 300)}`;
}

const tally: Record<string, number> = {};
const byClass: Record<string, number> = { BLOCKED: 0, EVIDENCE_REQUIRED: 0, OWNER_REQUIRED: 0 };
const blocked: Array<{ file: string; cr: string; match: string }> = [];
for (const f of files) {
  for (const x of f.findings) {
    tally[`${x.cr} ${x.cls} ${x.rule}`] = (tally[`${x.cr} ${x.cls} ${x.rule}`] ?? 0) + 1;
    byClass[x.cls] = (byClass[x.cls] ?? 0) + 1;
    if (x.cls === 'BLOCKED') blocked.push({ file: f.file, cr: x.cr, match: x.match });
  }
}

// The company page is the one page that makes claims about ACS itself. Each
// claim row the scanner raises there must have a CLEARED evidence record in the
// governed package; a new kind of claim in the copy fails the run.
const evidenceDir = join(root, '..', 'acs-seo', 'packages', 'about-acs', 'publish');
const aboutRows = [...new Set(files.filter((f) => f.file.replace(/\\/g, '/').endsWith('about/index.html')).flatMap((f) => f.findings.map((x) => x.cr)))].sort();
const aboutClaims = aboutRows.map((cr) => {
  const file = join(evidenceDir, `claim-evidence-${cr.toLowerCase().replace('-', '')}.json`);
  const verdict = existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as { verdict?: string }).verdict ?? 'NO VERDICT' : 'NO RECORD';
  return { cr, verdict };
});
const unevidenced = aboutClaims.filter((c) => c.verdict !== 'CLEARED');

const report = JSON.parse(readFileSync(join(root, 'dist', 'build-report.json'), 'utf8')) as {
  omittedFigures: unknown[]; activeEvidenceRecords: number;
};
const pass = !error && files.length > 0 && blocked.length === 0 && unevidenced.length === 0;
writeFileSync(join(out, 'claims.json'), JSON.stringify({
  ranAt: new Date().toISOString(),
  scanner: 'acs-seo/tools/claim-scan.mjs over dist/',
  filesScanned: files.length,
  pass,
  error,
  byClass,
  tally,
  blocked,
  aboutPageClaims: aboutClaims,
  activeEvidenceRecords: report.activeEvidenceRecords,
  omittedFigures: report.omittedFigures,
}, null, 2) + '\n');

console.log(`${pass ? 'PASS' : 'FAIL'}  claim scan: BLOCKED ${byClass.BLOCKED} · EVIDENCE_REQUIRED ${byClass.EVIDENCE_REQUIRED} · OWNER_REQUIRED ${byClass.OWNER_REQUIRED} · files ${files.length}`);
console.log(`      figures held back for want of evidence: ${report.omittedFigures.length}`);
console.log(`      about page claims: ${aboutClaims.map((c) => `${c.cr} ${c.verdict}`).join(' · ') || 'none raised'}`);
if (error) console.log(`      ${error}`);
process.exit(pass ? 0 : 1);
