/**
 * Builds the acceptance matrix T1–T18 from the evidence files, so the matrix
 * cannot say something the evidence does not. A test whose evidence file is
 * missing is NOT RUN, never assumed.
 *
 * Writes test-results/summary.json. Exits non-zero if any test FAILS; NOT RUN
 * and the human steps do not fail the run, but they keep the gate closed.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'test-results');

type Status = 'PASS' | 'FAIL' | 'NOT RUN' | 'HUMAN STEP';
interface Row { id: string; proves: string; status: Status; evidence: string; detail: string }
interface Check { id?: string; name: string; pass: boolean }

function load<T>(file: string): T | null {
  const path = join(out, file);
  return existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as T) : null;
}

const e2e = load<{ checks: Check[] }>('e2e.json');
const unit = load<{ numTotalTests: number; numPassedTests: number; numFailedTests: number; testResults: Array<{ assertionResults: Array<{ fullName: string; status: string }> }> }>('unit.json');
const canonical = load<{ checks: Check[] }>('canonical.json');
const sitemap = load<{ checks: Check[]; urls: unknown[] }>('sitemap.json');
const schema = load<{ checks: Check[] }>('schema.json');
const claims = load<{ pass: boolean; byClass: Record<string, number>; omittedFigures: unknown[]; activeEvidenceRecords: number }>('claims.json');
const cwv = load<{ passed: number; failed: number; pages: unknown[] }>('cwv.json');
const offline = load<{ pass: boolean; commit: string; steps: Array<{ name: string; pass: boolean }>; networkBlocked: boolean }>('offline.json');

/**
 * An offline run proves something only about the code it ran on. Returns the
 * code files that differ between that commit and what is on disk now; reports
 * and evidence files do not count.
 */
function codeChangedSince(commit: string): string[] | null {
  try {
    const repo = join(out, '..', '..');
    const names = execFileSync('git', ['-C', repo, 'diff', '--name-only', commit, '--', 'acs-site', 'acs-seo/tools'], { encoding: 'utf8' });
    return names.split('\n').filter((f) => f && !f.includes('/test-results/') && !f.endsWith('.md'));
  } catch {
    return null;
  }
}
const stale = offline ? codeChangedSince(offline.commit) : null;

const rows: Row[] = [];

/** PASS only if every named e2e check exists and passed. */
function fromE2e(ids: string[]): { status: Status; detail: string } {
  if (!e2e) return { status: 'NOT RUN', detail: 'e2e.json missing' };
  const picked = ids.map((id) => ({ id, found: e2e.checks.filter((c) => c.id === id || c.id?.startsWith(`${id}-`)) }));
  const missing = picked.filter((p) => p.found.length === 0).map((p) => p.id);
  if (missing.length) return { status: 'NOT RUN', detail: `no result for ${missing.join(', ')}` };
  const all = picked.flatMap((p) => p.found);
  const failed = all.filter((c) => !c.pass);
  return { status: failed.length ? 'FAIL' : 'PASS', detail: `${all.length - failed.length}/${all.length} checks (${ids.join(', ')})` };
}

function fromChecks(file: { checks: Check[] } | null, name: string): { status: Status; detail: string } {
  if (!file) return { status: 'NOT RUN', detail: `${name} missing` };
  const failed = file.checks.filter((c) => !c.pass);
  return { status: failed.length ? 'FAIL' : 'PASS', detail: `${file.checks.length - failed.length}/${file.checks.length} checks` };
}

function unitTests(pattern: RegExp): { status: Status; detail: string } {
  if (!unit) return { status: 'NOT RUN', detail: 'unit.json missing' };
  const matched = unit.testResults.flatMap((f) => f.assertionResults).filter((a) => pattern.test(a.fullName));
  if (!matched.length) return { status: 'NOT RUN', detail: `no unit test matches ${pattern}` };
  const failed = matched.filter((a) => a.status !== 'passed');
  return { status: failed.length ? 'FAIL' : 'PASS', detail: `${matched.length - failed.length}/${matched.length} unit tests` };
}

/** Worst status wins: a FAIL anywhere fails the row, a gap makes it NOT RUN. */
function combine(...parts: Array<{ status: Status; detail: string }>): { status: Status; detail: string } {
  const status: Status = parts.some((p) => p.status === 'FAIL') ? 'FAIL' : parts.some((p) => p.status === 'NOT RUN') ? 'NOT RUN' : 'PASS';
  return { status, detail: parts.map((p) => p.detail).join(' · ') };
}

const add = (id: string, proves: string, evidence: string, result: { status: Status; detail: string }) =>
  rows.push({ id, proves, evidence, ...result });

add('T1', 'Every rule and parser behaves, including on Thai input', 'unit.json',
  unit ? { status: unit.numFailedTests === 0 && unit.numTotalTests > 0 ? 'PASS' : 'FAIL', detail: `${unit.numPassedTests}/${unit.numTotalTests} unit tests` } : { status: 'NOT RUN', detail: 'unit.json missing' });
add('T2', 'A clean checkout builds and tests with no network access', 'offline.json',
  offline && (stale === null || stale.length > 0)
    ? { status: 'NOT RUN', detail: stale === null ? `ran on ${offline.commit.slice(0, 7)}, which git cannot compare with the current code` : `ran on ${offline.commit.slice(0, 7)}; ${stale.length} code file(s) changed since — run tests/qa/offline.mjs again on a committed tree` }
    : offline
    ? { status: offline.pass && offline.networkBlocked ? 'PASS' : 'FAIL', detail: `commit ${offline.commit.slice(0, 7)} · ${offline.steps.filter((s) => s.pass).length}/${offline.steps.length} steps · network ${offline.networkBlocked ? 'blocked' : 'NOT blocked'}` }
    : { status: 'NOT RUN', detail: 'offline.json missing — run tests/qa/offline.mjs on a committed tree' });
add('T3', '14 product routes return 200 with distinct headings', 'e2e.json', fromE2e(['E01', 'E02', 'E31']));
add('T4', 'Self-referencing canonical on every indexable page; no page answers at two addresses', 'canonical.json, links.json', combine(fromChecks(canonical, 'canonical.json'), fromE2e(['E28', 'E29', 'E36'])));
add('T5', 'Product text is present with JavaScript disabled', 'norender.json', fromE2e(['E07', 'E08', 'E33', 'E37']));
add('T6', 'No internal link resolves to a 404', 'links.json', fromE2e(['E05', 'E06']));
add('T7', 'The sitemap lists every indexable URL and only those; robots.txt names it', 'sitemap.json', fromChecks(sitemap, 'sitemap.json'));
add('T8', 'The claim scanner reports zero BLOCKED over the built HTML', 'claims.json',
  claims ? { status: claims.pass ? 'PASS' : 'FAIL', detail: `BLOCKED ${claims.byClass.BLOCKED ?? 0} · EVIDENCE_REQUIRED ${claims.byClass.EVIDENCE_REQUIRED ?? 0}` } : { status: 'NOT RUN', detail: 'claims.json missing' });
add('T9', 'No serious or critical accessibility violation at 360 and 1280 px', 'axe.json', fromE2e(['E26']));
add('T10', 'No horizontal page scroll at 360 or 1280 px', 'overflow.json', fromE2e(['E25']));
add('T11', 'The enquiry form refuses an empty required field and announces each error', 'e2e.json', fromE2e(['E15', 'E16', 'E24']));
add('T12', 'Submitting returns not-connected and no success message appears', 'e2e.json', combine(fromE2e(['E19', 'E20']), unitTests(/store boundary/)));
add('T13', 'Consent boxes start unticked; service consent required; marketing consent not', 'e2e.json', fromE2e(['E13', 'E17', 'E18']));
add('T14', 'After a filled form, storage and URLs hold nothing personal', 'pii.json', fromE2e(['E21', 'E22', 'E23']));
add('T15', 'A figure with no active evidence record is not shown, and the build names it', 'claims.json, norender.json',
  combine(
    claims ? { status: claims.activeEvidenceRecords === 0 && claims.omittedFigures.length > 0 ? 'PASS' : 'FAIL', detail: `${claims.omittedFigures.length} figures held back, ${claims.activeEvidenceRecords} active records` } : { status: 'NOT RUN', detail: 'claims.json missing' },
    fromE2e(['E09']),
    unitTests(/what a product page may show/),
  ));
add('T16', 'An evidence record cannot go active when its approver is its author', 'unit.json', unitTests(/evidence activation gate/));
add('T17', 'Product structured data validates and carries no price or availability', 'schema.json', combine(fromChecks(schema, 'schema.json'), fromE2e(['E32'])));

const screenDir = join(out, 'screens');
const shots = existsSync(screenDir) ? readdirSync(screenDir).filter((f) => f.endsWith('.png')).length : 0;
rows.push({
  id: 'T18', proves: 'Screenshots of every page type at 360 and 1280 px, reviewed by eye', evidence: 'screens/*.png',
  status: 'HUMAN STEP',
  detail: `${shots} screenshots captured. Looked at by the author only; a second pair of eyes has not seen them.`,
});

const extra = {
  coreWebVitals: cwv
    ? { status: cwv.failed === 0 ? 'PASS (lab only)' : 'FAIL', detail: `${cwv.passed}/${cwv.pages.length} pages within target on a local server; not field data` }
    : { status: 'NOT RUN', detail: 'cwv.json missing' },
};

const count = (s: Status) => rows.filter((r) => r.status === s).length;
const gate = {
  automatedTestsGreen: count('FAIL') === 0 && count('NOT RUN') === 0,
  m2Complete: false,
  externalReview: false,
  ownerUat: false,
  open: false,
  why: 'M3 closes only when M2 is complete, someone other than the author has reviewed the exact commit, and the Owner has done UAT. None of the three has happened.',
};

writeFileSync(join(out, 'summary.json'), JSON.stringify({
  generatedAt: new Date().toISOString(),
  counts: { PASS: count('PASS'), FAIL: count('FAIL'), 'NOT RUN': count('NOT RUN'), 'HUMAN STEP': count('HUMAN STEP') },
  gate,
  tests: rows,
  beyondThePrdTests: extra,
}, null, 2) + '\n');

for (const r of rows) console.log(`${r.status.padEnd(10)} ${r.id.padEnd(4)} ${r.proves}\n           ${r.detail}`);
console.log(`\nCore Web Vitals: ${extra.coreWebVitals.status} — ${extra.coreWebVitals.detail}`);
console.log(`\nPASS ${count('PASS')} · FAIL ${count('FAIL')} · NOT RUN ${count('NOT RUN')} · HUMAN STEP ${count('HUMAN STEP')}`);
console.log(`M3 gate: ${gate.open ? 'OPEN' : 'CLOSED'} — ${gate.why}`);
process.exit(count('FAIL') ? 1 : 0);
