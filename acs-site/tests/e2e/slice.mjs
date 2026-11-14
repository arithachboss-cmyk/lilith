// End-to-end check of the enquiry slice: a real browser, a real HTTP request,
// the real handler, a real file on disk. Run `npm run slice` (it builds
// dist-slice/ first). The store is a throwaway folder, deleted afterwards.
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServer } from './server.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const out = join(root, 'test-results');
mkdirSync(join(out, 'screens'), { recursive: true });
const data = mkdtempSync(join(tmpdir(), 'acs-slice-'));
const storeFile = join(data, 'enquiries.jsonl');
const rows = () => (existsSync(storeFile) ? readFileSync(storeFile, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : []);
const PII = { name: 'สมชาย ทดสอบสไลซ์', phone: '081-555-0142', company: 'บริษัท ทดสอบสไลซ์ จำกัด', email: 'slice-check@example.com', message: 'ข้อความทดสอบลับเฉพาะสไลซ์' };

const checks = [];
const check = (id, name, pass, detail = '') => {
  checks.push({ id, name, pass: Boolean(pass), detail: String(detail) });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${id}  ${name}${pass || !detail ? '' : `  — ${detail}`}`);
};

async function fill(page, { consent = true } = {}) {
  await page.fill('#f-name', PII.name);
  await page.fill('#f-phone', PII.phone);
  await page.click('#next-step');
  await page.fill('#f-company', PII.company);
  await page.fill('#f-email', PII.email);
  await page.click('#next-step');
  await page.selectOption('#f-industry', 'retail');
  await page.selectOption('#f-businessScale', 'single_site');
  await page.check('input[name="interests"][value="scanners"]');
  await page.fill('#f-message', PII.message);
  if (consent) await page.check('#f-serviceConsent');
}

let server;
let browser;
let error = '';
try {
  const report = JSON.parse(readFileSync(join(root, 'dist-slice', 'build-report.json'), 'utf8'));
  server = await startServer(root, ['--root', 'dist-slice', '--api', data]);
  const BASE = server.base;
  browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 360, height: 800 } });
  const page = await ctx.newPage();
  const posts = [];
  const foreign = [];
  page.on('request', (r) => {
    if (r.method() === 'POST') posts.push(r.url());
    if (!r.url().startsWith(BASE)) foreign.push(r.url());
  });

  await page.goto(`${BASE}/enquiry/`);
  const notice = await page.locator('[data-enquiry-environment="preview"]').textContent().catch(() => '');
  const robots = await page.locator('meta[name="robots"]').getAttribute('content');
  const badge = await page.locator('[data-system-status]').getAttribute('data-system-status');
  check('S01', 'the slice says it is a test before anyone types, stays demo and closed to crawlers', report.slice === 'enquiry' && notice.includes('ยังไม่ถึงทีมขาย ACS') && robots === 'noindex,nofollow' && badge === 'demo', `${badge} ${robots}`);

  await fill(page, { consent: false });
  await page.click('#send-enquiry');
  await page.waitForTimeout(300);
  check('S02', 'without service consent nothing is posted and nothing is stored', posts.length === 0 && rows().length === 0 && (await page.locator('#err-serviceConsent').isVisible()), `${posts.length} posts, ${rows().length} rows`);

  await page.goto(`${BASE}/products/te200/`);
  await page.click('[data-add-to-basket]');
  await page.goto(`${BASE}/enquiry/`);
  await fill(page);
  await page.click('#send-enquiry');
  await page.waitForSelector('#enquiry-result[data-outcome]');
  const outcome = await page.locator('#enquiry-result').getAttribute('data-outcome');
  const text = await page.locator('#enquiry-result').textContent();
  const stored = rows();
  const shownRef = /ENQ-\d{8}-[0-9A-F]{8}/.exec(text)?.[0] ?? '';
  check('S03', 'a filled form is posted once, stored once, and the receipt shown is the one stored', outcome === 'success' && posts.length === 1 && posts[0] === `${BASE}/api/enquiries` && stored.length === 1 && shownRef !== '' && stored[0]?.receipt.reference === shownRef, `${outcome} · ${posts.length} posts · ${stored.length} rows · ${shownRef}`);
  check('S04', 'the receipt says it is a test and that the enquiry has not reached ACS', text.includes('ระบบทดสอบ') && text.includes('ยังไม่ถึงทีมขาย ACS') && (await page.locator('#enquiry-result').getAttribute('data-environment')) === 'preview', text);
  const look = await page.locator('#enquiry-result').evaluate((el) => { const s = getComputedStyle(el); return { border: s.borderTopColor, background: s.backgroundColor }; });
  const errorRed = 'rgb(161, 26, 26)';
  check('S12', 'once sent, the form is gone so it cannot be sent twice, and the receipt does not look like an error', (await page.locator('#enquiry-form').isHidden()) && (await page.locator('#send-enquiry').isHidden()) && look.border !== errorRed, JSON.stringify(look));
  const e = stored[0]?.enquiry;
  check('S05', 'what is stored is what was typed, with the consent as given and the wording version', e && e.contact.name === PII.name && e.contact.email === PII.email && e.details.message === PII.message && JSON.stringify(e.details.items) === '["te200"]' && e.consent.service === true && e.consent.marketing === false && /^c-[0-9a-f]{8}$/.test(e.consent.wordingVersion) && !Number.isNaN(Date.parse(e.consent.givenAt)), JSON.stringify(e?.consent));
  await page.screenshot({ path: join(out, 'screens', 'slice-enquiry-success-360.png'), fullPage: true });

  const storage = await page.evaluate(() => JSON.stringify([{ ...localStorage }, { ...sessionStorage }, document.cookie]));
  const leaked = Object.values(PII).filter((v) => storage.includes(v) || page.url().includes(encodeURIComponent(v)));
  check('S06', 'after sending, storage, cookies and the URL hold nothing personal, and no request left the site', leaked.length === 0 && foreign.length === 0, `${leaked.join(' | ')} ${foreign.join(' ')}`);

  const cross = await fetch(`${BASE}/api/enquiries`, { method: 'POST', headers: { origin: 'https://evil.example', 'content-type': 'application/json', 'idempotency-key': 'a'.repeat(32) }, body: '{}' });
  const get = await fetch(`${BASE}/api/enquiries`);
  check('S07', 'the endpoint refuses another site and anything but a POST', cross.status === 403 && get.status === 405 && rows().length === 1, `${cross.status} ${get.status}`);

  // The endpoint goes down: the form must say so and must not claim success.
  await page.route('**/api/enquiries', (route) => route.abort());
  await page.goto(`${BASE}/enquiry/`);
  await fill(page);
  await page.click('#send-enquiry');
  await page.waitForSelector('#enquiry-result[data-outcome]');
  const failOutcome = await page.locator('#enquiry-result').getAttribute('data-outcome');
  const failText = await page.locator('#enquiry-result').textContent();
  check('S08', 'when the endpoint cannot be reached the form reports a failure, shows no reference, and nothing more is stored', failOutcome === 'failed' && failText.includes('ไม่สำเร็จ') && !/ENQ-|บันทึกคำขอ/.test(failText) && rows().length === 1, `${failOutcome} · ${failText}`);
  await page.unroute('**/api/enquiries');

  await page.route('**/api/enquiries', (route) => route.fulfill({ status: 503, contentType: 'application/json', body: '{"ok":false,"code":"not_stored"}' }));
  await page.goto(`${BASE}/enquiry/`);
  await fill(page);
  await page.click('#send-enquiry');
  await page.waitForSelector('#enquiry-result[data-outcome]');
  check('S09', 'when the store refuses (503) the form reports a failure', (await page.locator('#enquiry-result').getAttribute('data-outcome')) === 'failed');
  await page.unroute('**/api/enquiries');

  await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
  const axe = await page.evaluate(async () => (await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } })).violations.filter((v) => ['serious', 'critical'].includes(v.impact)).map((v) => v.id));
  const focused = await page.evaluate(() => document.activeElement?.id);
  check('S10', 'the result is announced, takes focus, and the page has no serious accessibility violation', axe.length === 0 && focused === 'enquiry-result' && (await page.locator('#enquiry-result').getAttribute('role')) === 'alert', `${axe.join(',')} focus=${focused}`);

  const shipped = existsSync(join(root, 'dist', 'assets', 'app.js')) ? readFileSync(join(root, 'dist', 'assets', 'app.js'), 'utf8') : null;
  const shippedPage = existsSync(join(root, 'dist', 'enquiry', 'index.html')) ? readFileSync(join(root, 'dist', 'enquiry', 'index.html'), 'utf8') : '';
  check('S11', 'the shipped build in dist/ names no endpoint and carries no test notice', shipped !== null && !shipped.includes('/api/enquiries') && !shippedPage.includes('data-enquiry-environment'), shipped === null ? 'dist/ not built' : '');
} catch (e) {
  error = e?.stack ?? String(e);
  console.log(`FAIL  ${error}`);
} finally {
  await browser?.close();
  server?.stop();
  // The store held what the test typed. It goes with the test.
  rmSync(data, { recursive: true, force: true });
}

const failed = checks.filter((c) => !c.pass).length + (error ? 1 : 0);
writeFileSync(join(out, 'slice.json'), JSON.stringify({ ranAt: new Date().toISOString(), about: 'the enquiry slice: browser to handler to a throwaway file store, and back', storeRemoved: !existsSync(data), passed: checks.filter((c) => c.pass).length, failed, error, checks }, null, 2) + '\n');
console.log(`\n${checks.filter((c) => c.pass).length}/${checks.length} slice checks passed`);
process.exit(failed ? 1 : 0);
