// End-to-end checks against the built site, served by scripts/serve.ts, which
// applies the one-address rule the production host must also apply.
// Plain Node on purpose: Playwright is pre-installed globally in the build
// container and must not be re-installed per project.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServer } from './server.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const out = join(root, 'test-results');
const screens = join(out, 'screens');
mkdirSync(screens, { recursive: true });

let BASE = '';
const report = JSON.parse(readFileSync(join(root, 'dist', 'build-report.json'), 'utf8'));
const ROUTES = report.routes;
const PRODUCT_ROUTES = ROUTES.filter((r) => /^\/products\/[^/]+\/$/.test(r));
const WIDTHS = [360, 1280];
// One of each page type is enough for screenshots and axe; overflow runs on every route.
const SAMPLE = ['/', '/products/', '/products/1950g/', '/products/tc22/', '/basket/', '/enquiry/', '/about/', '/categories/ribbons/', '/categories/scanners/', '/status/'];
const PII = { name: 'สมชาย ทดสอบระบบ', phone: '081-555-0142', company: 'บริษัท ทดสอบอีทูอี จำกัด', email: 'e2e-check@example.com', message: 'ข้อความทดสอบลับเฉพาะ' };

const checks = [];
const check = (id, name, pass, detail = '') => {
  checks.push({ id, name, pass: Boolean(pass), detail: String(detail) });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${id}  ${name}${pass || !detail ? '' : `  — ${detail}`}`);
};

let server;
let browser;
const axeResults = [];
try {
  server = await startServer(root);
  BASE = server.base;
  browser = await chromium.launch();

  /* ---------- routes: reachable, one h1, demo badge, closed to crawlers ---------- */
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    const h1s = new Map();
    const bad = [];
    for (const route of ROUTES) {
      const res = await page.goto(BASE + route, { waitUntil: 'load' });
      const h1 = await page.locator('h1').allTextContents();
      const title = await page.title();
      const badge = await page.locator('[data-system-status]').getAttribute('data-system-status');
      const robots = await page.locator('meta[name="robots"]').getAttribute('content').catch(() => null);
      if (res.status() !== 200 || h1.length !== 1 || !title.trim() || badge !== report.system || (!report.indexable && robots !== 'noindex,nofollow')) {
        bad.push(`${route} status=${res.status()} h1=${h1.length} badge=${badge} robots=${robots}`);
      }
      h1s.set(route, h1[0] ?? '');
    }
    check('E01', `all ${ROUTES.length} routes return 200 with exactly one h1 and a title`, bad.length === 0, bad.join(' | '));
    const productH1 = PRODUCT_ROUTES.map((r) => h1s.get(r));
    check('E02', '14 product routes with 14 distinct h1', PRODUCT_ROUTES.length === 14 && new Set(productH1).size === 14, `${PRODUCT_ROUTES.length} routes, ${new Set(productH1).size} distinct`);

    const missing = await page.goto(`${BASE}/products/does-not-exist/`);
    check('E03', 'an unknown product returns 404, not a soft 200', missing.status() === 404, `status ${missing.status()}`);
    // One address per page: every other spelling redirects permanently, none returns 200.
    const wrong = [];
    for (const route of ROUTES) {
      const bare = route === '/' ? null : route.replace(/\/$/, '');
      const forms = [`${route}index.html`, ...(bare ? [bare, `${bare}.html`] : [])];
      for (const form of forms) {
        const r = await fetch(BASE + form, { redirect: 'manual' });
        if (!(r.status === 301 && r.headers.get('location') === route)) wrong.push(`${form} → ${r.status} ${r.headers.get('location') ?? ''}`);
      }
    }
    check('E28', `each of ${ROUTES.length} pages answers at one address; every other form is a 301 to it`, wrong.length === 0, wrong.join(' | '));
    const kept = await fetch(`${BASE}/products?category=printers`, { redirect: 'manual' });
    check('E29', 'a redirect keeps the query string', kept.status === 301 && kept.headers.get('location') === '/products/?category=printers', `${kept.status} ${kept.headers.get('location')}`);

    // Addresses that moved (build-report.json lists them) must land on their new page in one hop.
    const moves = Object.entries(report.redirects ?? {});
    const lost = [];
    for (const [from, to] of moves) {
      const bare = from.replace(/\/$/, '');
      for (const form of [from, bare, `${bare}.html`, `${from}index.html`]) {
        const r = await fetch(BASE + form, { redirect: 'manual' });
        if (!(r.status === 301 && r.headers.get('location') === to)) lost.push(`${form} → ${r.status} ${r.headers.get('location') ?? ''}`);
      }
      const landed = await fetch(BASE + to, { redirect: 'manual' });
      if (landed.status !== 200) lost.push(`${to} → ${landed.status}`);
    }
    check('E36', `each of ${moves.length} moved addresses (${moves.map(([from]) => from).join(', ')}) answers 301 to its new page, in every spelling`, moves.length > 0 && lost.length === 0, lost.join(' | '));

    // The plan for the old site's addresses: an approved row redirects, a proposed
    // one does not (it waits for the Owner), and one with no equivalent stays a 404.
    const plan = JSON.parse(readFileSync(join(root, 'src', 'data', 'redirect-plan.json'), 'utf8')).rows;
    const counted = Object.values(report.redirectPlan?.counts ?? {}).reduce((sum, n) => sum + n, 0);
    const planWrong = [];
    for (const row of plan) {
      const r = await fetch(BASE + encodeURI(row.from), { redirect: 'manual' });
      const expected = row.status === 'approved' ? 301 : 404;
      if (r.status !== expected) planWrong.push(`${row.from} (${row.status}) → ${r.status}`);
    }
    await page.goto(`${BASE}/status/`);
    const launchRows = await page.locator('[data-launch]').evaluateAll((els) => els.map((el) => ({ key: el.dataset.launch, ready: el.dataset.ready === 'true', detail: el.querySelector('td:last-child')?.textContent ?? '' })));
    const launchExpected = (report.launch ?? []).map((row) => ({ key: row.key, ready: row.ready, detail: row.detail }));
    check('E38', `the old-address plan holds on the server (${plan.length} rows: only approved ones redirect) and the status page shows the launch conditions as the build reports them`, plan.length === 81 && counted === 81 && planWrong.length === 0 && launchExpected.length === 5 && JSON.stringify(launchRows) === JSON.stringify(launchExpected), planWrong.join(' | ') || JSON.stringify(launchRows));

    // The six category pages list their own products, with JavaScript off.
    const noJs = await browser.newContext({ javaScriptEnabled: false });
    const catPage = await noJs.newPage();
    const wrongCats = [];
    for (const route of ROUTES.filter((r) => r.startsWith('/categories/'))) {
      await catPage.goto(BASE + route);
      const id = route.split('/')[2];
      const cards = await catPage.locator('[data-product-card]').evaluateAll((els) => els.map((el) => el.dataset.category));
      if (cards.length === 0 || cards.some((c) => c !== id)) wrongCats.push(`${route} cards=${cards.join(',')}`);
    }
    await noJs.close();
    check('E37', 'each category page lists products of its own category only, without JavaScript', ROUTES.filter((r) => r.startsWith('/categories/')).length === 6 && wrongCats.length === 0, wrongCats.join(' | '));
    const sitemap = await fetch(`${BASE}/sitemap.xml`);
    check('E30', 'a demo build serves no sitemap', report.indexable || sitemap.status === 404, `status ${sitemap.status}`);

    const robotsTxt = await (await fetch(`${BASE}/robots.txt`)).text();
    check('E04', 'robots.txt closes a non-live build to crawlers', report.indexable || /Disallow: \/\s*$/m.test(robotsTxt), robotsTxt.replace(/\n/g, ' '));

    /* ---------- internal links ---------- */
    const seen = new Set();
    const dead = [];
    for (const route of ROUTES) {
      await page.goto(BASE + route, { waitUntil: 'load' });
      const hrefs = await page.locator('a[href]').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
      for (const href of hrefs) {
        if (!href || !href.startsWith('/')) continue;
        const path = href.split('#')[0];
        if (seen.has(path)) continue;
        seen.add(path);
        const r = await fetch(BASE + path, { redirect: 'manual' });
        if (r.status !== 200) dead.push(`${path} → ${r.status} (from ${route})`);
      }
    }
    check('E05', `no internal link is dead (${seen.size} distinct targets)`, dead.length === 0, dead.join(' | '));

    // No page may link to an asiancoding.com URL: every one in the source data returns 404.
    const acsLinks = [];
    for (const route of ROUTES) {
      await page.goto(BASE + route, { waitUntil: 'load' });
      const n = await page.locator('a[href*="asiancoding.com/"]').count();
      if (n) acsLinks.push(`${route} (${n})`);
    }
    check('E06', 'no page links to a dead asiancoding.com URL from the catalogue data', acsLinks.length === 0, acsLinks.join(' | '));
    await ctx.close();
  }

  /* ---------- product text without JavaScript ---------- */
  {
    const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/products/te200/`);
    const h1 = await page.locator('h1').textContent();
    const body = await page.locator('main').textContent();
    check('E07', 'product page text is in the HTML with JavaScript disabled', h1 === 'เครื่องพิมพ์ฉลากแบบตั้งโต๊ะ' && body.includes('TE200 Desktop Printer') && body.includes('Thermal-transfer label printing'), h1);
    await page.goto(`${BASE}/products/`);
    const cards = await page.locator('[data-product-card]:visible').count();
    check('E08', 'catalogue lists all 14 products with JavaScript disabled', cards === 14, `${cards} cards`);
    // Controls that only work with the script must not be shown without it.
    const deadControls = [];
    if (await page.locator('[data-catalogue-tools]').isVisible()) deadControls.push('catalogue search and filters');
    await page.goto(`${BASE}/products/te200/`);
    if (await page.locator('[data-add-to-basket]').isVisible()) deadControls.push('add-to-basket button');
    await page.goto(`${BASE}/enquiry/`);
    if (await page.locator('#enquiry-form').isVisible()) deadControls.push('enquiry form');
    const noscript = await page.locator('noscript').first().textContent();
    check('E33', 'without JavaScript, script-only controls stay hidden and the page says how to reach ACS', deadControls.length === 0 && noscript.includes('02-203-0232'), deadControls.join(' | '));
    // What each product page shows must match the build report exactly: a figure
    // line appears only if the report ties it to an approved record, a held-back
    // line never appears, and the page states how many it holds back.
    const wrongFigures = [];
    for (const route of PRODUCT_ROUTES) {
      const id = route.split('/')[2];
      await page.goto(BASE + route);
      const lines = await page.locator('.feature-list li').allTextContents();
      const shown = (report.shownFigures ?? []).filter((f) => f.productId === id);
      const held = report.omittedFigures.filter((f) => f.productId === id);
      for (const f of shown) if (!lines.includes(f.feature) || !f.recordId || !f.approvedBy) wrongFigures.push(`${id}: approved line missing "${f.feature}"`);
      for (const f of held) if (lines.includes(f.feature)) wrongFigures.push(`${id}: held-back line shown "${f.feature}"`);
      const notice = await page.locator('[data-omitted-figures]').getAttribute('data-omitted-figures').catch(() => null);
      if ((held.length ? String(held.length) : null) !== notice) wrongFigures.push(`${id}: page says ${notice} held back, report says ${held.length}`);
      const sourceNote = await page.locator('[data-figure-source]').count();
      if (shown.length > 0 && sourceNote !== 1) wrongFigures.push(`${id}: shows figures without naming their source`);
    }
    // A note from ACS appears on its product page exactly when the report says it is shown.
    for (const route of PRODUCT_ROUTES) {
      const id = route.split('/')[2];
      await page.goto(BASE + route);
      const onPage = (await page.locator('[data-acs-note]').allTextContents()).map((t) => t.replace('ข้อมูลจาก ACS', '').trim());
      const expected = (report.productNotes ?? []).filter((n) => n.productId === id && n.shown).map((n) => n.text);
      if (JSON.stringify(onPage) !== JSON.stringify(expected)) wrongFigures.push(`${id}: notes on page ${JSON.stringify(onPage)} ≠ report ${JSON.stringify(expected)}`);
    }
    const accounted = (report.shownFigures ?? []).length + report.omittedFigures.length;
    check('E09', `figure lines match the build report on all ${PRODUCT_ROUTES.length} product pages (${(report.shownFigures ?? []).length} shown under an approved record, ${report.omittedFigures.length} held back)`, wrongFigures.length === 0 && accounted === 7, wrongFigures.join(' | '));
    const familyNotes = [];
    for (const id of ['tc22', 'ds3600', 'te200']) {
      await page.goto(`${BASE}/products/${id}/`);
      familyNotes.push(await page.locator('[data-family-note]').count());
    }
    check('E31', 'family pages say they cover more than one model; a single model does not', JSON.stringify(familyNotes) === '[1,1,0]', JSON.stringify(familyNotes));
    // Structured data, read the way a crawler would: from the HTML, without running scripts.
    const FORBIDDEN = ['offers', 'price', 'priceCurrency', 'availability', 'aggregateRating', 'review'];
    const schemaProblems = [];
    for (const route of PRODUCT_ROUTES) {
      await page.goto(BASE + route);
      const raw = await page.locator('script[type="application/ld+json"]').allTextContents();
      let blocks;
      try { blocks = raw.map((text) => JSON.parse(text)); } catch { schemaProblems.push(`${route} does not parse`); continue; }
      const text = JSON.stringify(blocks);
      for (const key of FORBIDDEN) if (text.includes(`"${key}"`)) schemaProblems.push(`${route} has ${key}`);
      if (blocks.filter((b) => b['@type'] === 'BreadcrumbList').length !== 1) schemaProblems.push(`${route} breadcrumb`);
      if (blocks.filter((b) => b['@type'] === 'Product').length > 1) schemaProblems.push(`${route} has several Products`);
    }
    await page.goto(`${BASE}/products/te200/`);
    const te200 = (await page.locator('script[type="application/ld+json"]').allTextContents()).map((t) => JSON.parse(t)).find((b) => b['@type'] === 'Product');
    check('E32', 'product structured data parses on all 14 pages and carries no price, offer, availability or rating', schemaProblems.length === 0 && te200?.name === 'TE200 Desktop Printer' && te200?.brand?.name === 'TSC', schemaProblems.join(' | '));
    await ctx.close();
  }

  /* ---------- catalogue filter and search ---------- */
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/products/`);
    const visible = () => page.locator('[data-product-card]:visible').count();
    await page.click('[data-filter="scanners"]');
    const scanners = await visible();
    await page.click('[data-filter="all"]');
    await page.fill('#catalogue-search', 'TE 200');
    const model = await visible();
    await page.fill('#catalogue-search', 'ริบบอน');
    const thai = await visible();
    await page.fill('#catalogue-search', 'zzzz-no-such');
    const none = await visible();
    const emptyShown = await page.locator('#catalogue-empty').isVisible();
    check('E10', 'catalogue filter and search narrow the list (scanners 4, "TE 200" 1, ริบบอน 3, nonsense 0)', scanners === 4 && model === 1 && thai === 3 && none === 0 && emptyShown, `${scanners}/${model}/${thai}/${none}`);
    await page.goto(`${BASE}/products/?category=printers`);
    check('E11', 'a category link from the home page pre-selects the filter', (await visible()) === 4 && (await page.locator('[data-filter="printers"]').getAttribute('aria-pressed')) === 'true');
    await ctx.close();
  }

  /* ---------- basket, enquiry, store boundary, PII ---------- */
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    const requests = [];
    page.on('request', (r) => requests.push(`${r.method()} ${r.url()}`));

    await page.goto(`${BASE}/basket/`);
    const emptyState = { message: await page.locator('#basket-empty').isVisible(), actions: await page.locator('#basket-actions').isVisible(), list: await page.locator('#basket-list').isVisible() };
    check('E34', 'an empty basket shows its empty message and no "continue" actions', emptyState.message && !emptyState.actions && !emptyState.list, JSON.stringify(emptyState));

    await page.goto(`${BASE}/products/te200/`);
    await page.click('[data-add-to-basket]');
    await page.goto(`${BASE}/basket/`);
    const items = await page.locator('#basket-list li').count();
    check('E12', 'a product added on its page appears in the basket', items === 1, `${items} item(s)`);

    await page.goto(`${BASE}/enquiry/`);
    const consent = await page.evaluate(() => [document.querySelector('#f-serviceConsent').checked, document.querySelector('#f-marketingConsent').checked]);
    check('E13', 'both consent boxes start unticked', consent[0] === false && consent[1] === false, JSON.stringify(consent));
    check('E14', 'the enquiry carries the basket items over', (await page.locator('#basket-summary li').count()) === 1);

    await page.click('#next-step');
    const step1 = await page.evaluate(() => ['name', 'phone'].map((n) => {
      const input = document.querySelector(`[name="${n}"]`);
      const err = document.querySelector(`#err-${n}`);
      return !err.hidden && err.textContent.trim().length > 0 && err.getAttribute('role') === 'alert'
        && input.getAttribute('aria-invalid') === 'true' && input.getAttribute('aria-describedby').split(' ').includes(`err-${n}`);
    }));
    const stillStep1 = await page.locator('fieldset[data-step="1"]').isVisible();
    check('E15', 'an empty step is refused; each error is announced and tied to its field', step1.every(Boolean) && stillStep1, JSON.stringify(step1));

    await page.fill('#f-name', PII.name);
    await page.fill('#f-phone', PII.phone);
    await page.click('#next-step');
    const focusOnStep2 = await page.evaluate(() => document.activeElement?.id);
    await page.fill('#f-company', PII.company);
    await page.fill('#f-email', PII.email);
    await page.click('#next-step');
    await page.selectOption('#f-industry', 'retail');
    await page.selectOption('#f-businessScale', 'multi_site');
    await page.check('input[name="interests"][value="printers"]');
    await page.fill('#f-message', PII.message);
    check('E16', 'focus moves to the heading of the new step', focusOnStep2 === 'step-2-title', String(focusOnStep2));

    await page.click('#send-enquiry');
    const refused = await page.locator('#err-serviceConsent').isVisible();
    const resultHidden = await page.locator('#enquiry-result').isHidden();
    check('E17', 'submitting without service consent is refused', refused && resultHidden);

    await page.check('#f-serviceConsent');
    const marketing = await page.isChecked('#f-marketingConsent');
    await page.click('#send-enquiry');
    await page.waitForSelector('#enquiry-result:not([hidden])');
    const outcome = await page.locator('#enquiry-result').getAttribute('data-outcome');
    const message = await page.locator('#enquiry-result').textContent();
    const pageText = await page.locator('main').textContent();
    check('E18', 'marketing consent is not required to submit', marketing === false);
    check('E19', 'the store boundary refuses the write and the screen says so', outcome === 'not_connected' && message.includes('ยังไม่ได้ส่งคำขอ'), `${outcome}: ${message.slice(0, 60)}`);
    check('E20', 'no success message appears without a success', !/บันทึกคำขอแล้ว|ส่งคำขอสำเร็จ|เลขอ้างอิง|ขอบคุณ/.test(pageText));

    const storage = await page.evaluate(() => ({
      local: Object.fromEntries(Object.entries(localStorage)),
      session: Object.fromEntries(Object.entries(sessionStorage)),
      cookie: document.cookie,
    }));
    const dump = JSON.stringify(storage);
    const leaked = Object.values(PII).filter((v) => dump.includes(v) || page.url().includes(encodeURIComponent(v)) || page.url().includes(v));
    check('E21', 'after a filled form, storage, cookies and the URL hold nothing personal', leaked.length === 0 && Object.keys(storage.local).length === 0 && storage.cookie === '', dump);
    check('E22', 'the only stored key is the basket of product ids', JSON.stringify(Object.keys(storage.session)) === '["acs:basket:v1"]' && storage.session['acs:basket:v1'] === '["te200"]', dump);
    const outbound = requests.filter((r) => !r.includes(BASE));
    const writes = requests.filter((r) => !r.startsWith('GET '));
    check('E23', 'no request leaves the site and nothing is POSTed', outbound.length === 0 && writes.length === 0, [...outbound, ...writes].join(' | '));

    /* keyboard-only path through step 1 */
    await page.goto(`${BASE}/enquiry/`);
    await page.keyboard.press('Tab');
    const first = await page.evaluate(() => document.activeElement?.className);
    await page.focus('#f-name');
    await page.keyboard.type('ทดสอบคีย์บอร์ด');
    await page.keyboard.press('Tab');
    await page.keyboard.type('0812345678');
    await page.keyboard.press('Enter');
    const advanced = await page.locator('fieldset[data-step="2"]').isVisible();
    check('E24', 'skip link is the first focus stop, and Enter advances a step without submitting', first === 'skip-link' && advanced, `${first} / step2=${advanced}`);
    await ctx.close();
  }

  /* ---------- layout: overflow, screenshots, accessibility ---------- */
  for (const width of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await ctx.newPage();
    const overflow = [];
    for (const route of ROUTES) {
      await page.goto(BASE + route, { waitUntil: 'load' });
      const extra = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (extra > 0) overflow.push(`${route} +${extra}px`);
    }
    check(`E25-${width}`, `no horizontal page scroll at ${width}px on any of ${ROUTES.length} routes`, overflow.length === 0, overflow.join(' | '));

    // An element carrying `hidden` must really be hidden, whatever its CSS says.
    const shown = [];
    for (const route of ROUTES) {
      await page.goto(BASE + route, { waitUntil: 'load' });
      const leaks = await page.evaluate(() => [...document.querySelectorAll('[hidden]')].filter((el) => getComputedStyle(el).display !== 'none').map((el) => el.id || el.className || el.tagName));
      for (const leak of leaks) shown.push(`${route} ${leak}`);
    }
    check(`E35-${width}`, `no element marked hidden is displayed at ${width}px on any of ${ROUTES.length} routes`, shown.length === 0, [...new Set(shown)].join(' | '));

    const small = [];
    const violations = [];
    for (const route of SAMPLE) {
      await page.goto(BASE + route, { waitUntil: 'load' });
      if (route === '/enquiry/') {
        // Reach step 3 so the longest part of the form is what gets checked.
        await page.fill('#f-name', 'ทดสอบ'); await page.fill('#f-phone', '0812345678'); await page.click('#next-step');
        await page.fill('#f-company', 'ทดสอบ'); await page.fill('#f-email', 'a@example.com'); await page.click('#next-step');
      }
      const name = route === '/' ? 'home' : route.replace(/^\/|\/$/g, '').replace(/\//g, '-');
      await page.screenshot({ path: join(screens, `${name}-${width}.png`), fullPage: true });

      await page.addScriptTag({ content: axeSource });
      const result = await page.evaluate(() => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } }));
      const serious = result.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      axeResults.push({ route, width, violations: result.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, help: v.help, targets: v.nodes.slice(0, 5).map((n) => n.target.join(' ')) })) });
      for (const v of serious) violations.push(`${route} ${v.id} ×${v.nodes.length}`);

      const tiny = await page.evaluate(() => [...document.querySelectorAll('a, button, input, select, textarea')]
        .filter((el) => el.offsetParent !== null && !el.closest('p, li.card, .feature-list, .pending, .held, table') && !el.matches('.card-title a'))
        .map((el) => ({ el, r: el.getBoundingClientRect() }))
        .filter(({ el, r }) => r.height < 44 && !(el.matches('input[type="checkbox"]') && el.closest('label')?.getBoundingClientRect().height >= 44))
        .map(({ el, r }) => `${el.tagName.toLowerCase()}.${el.className || el.id} ${Math.round(r.height)}px`));
      for (const t of tiny) small.push(`${route} ${t}`);
    }
    check(`E26-${width}`, `no serious or critical accessibility violation at ${width}px (${SAMPLE.length} page types)`, violations.length === 0, violations.join(' | '));
    check(`E27-${width}`, `standalone controls are at least 44px tall at ${width}px`, small.length === 0, [...new Set(small)].join(' | '));
    await ctx.close();
  }
} catch (error) {
  check('E00', 'e2e run completed', false, error?.stack ?? String(error));
} finally {
  await browser?.close();
  server?.stop();
}

const failed = checks.filter((c) => !c.pass);
writeFileSync(join(out, 'e2e.json'), JSON.stringify({ ranAt: new Date().toISOString(), base: BASE, routes: ROUTES.length, passed: checks.length - failed.length, failed: failed.length, checks }, null, 2) + '\n');
writeFileSync(join(out, 'axe.json'), JSON.stringify({ ranAt: new Date().toISOString(), tags: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'], pages: axeResults }, null, 2) + '\n');
// One evidence file per acceptance area, as the PRD names them. Each is a
// slice of the same run, so they cannot disagree with e2e.json.
const slice = (file, about, ids) => {
  const picked = checks.filter((c) => ids.some((id) => c.id === id || c.id.startsWith(`${id}-`)));
  writeFileSync(join(out, file), JSON.stringify({ ranAt: new Date().toISOString(), about, passed: picked.filter((c) => c.pass).length, failed: picked.filter((c) => !c.pass).length, checks: picked }, null, 2) + '\n');
};
slice('norender.json', 'product text and catalogue present in the HTML with JavaScript disabled', ['E07', 'E08', 'E09', 'E33', 'E37']);
slice('links.json', 'internal links, dead-link guard and the one-address rule', ['E05', 'E06', 'E28', 'E29', 'E36']);
slice('overflow.json', 'no horizontal page scroll at 360 and 1280 px', ['E25']);
slice('pii.json', 'nothing personal in storage, cookies, URLs or outbound requests', ['E21', 'E22', 'E23']);
console.log(`\n${checks.length - failed.length}/${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
