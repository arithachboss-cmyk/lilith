/**
 * Discoverability checks for a LIVE configuration, without ever writing a live
 * build to dist/. The shipped build is demo and closed to crawlers, so these
 * rules can only be proven on a variant rendered in memory.
 *
 * Writes test-results/canonical.json, sitemap.json and schema.json.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveAddress } from '../src/build/address';
import { REDIRECTS } from '../src/build/redirects';
import { absoluteUrl, canonicalOf, htmlIsIndexable, renderSite } from '../src/build/site';
import { staleRoutes, type Versions } from '../src/build/versions';
import { products } from '../src/data/catalog';
import versionsJson from '../src/data/page-versions.json';
import { extractFigures } from '../src/rules/figures';
import { allStrings, extractJsonLd, forbiddenKeysIn, hasProductMarkup } from '../src/render/structured';
import { statusConfig, type StatusConfig } from '../src/config/status';
import { evidenceRecords } from '../src/data/evidence';

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'test-results');
mkdirSync(out, { recursive: true });
const asOf = new Date().toISOString().slice(0, 10);

const live: StatusConfig = { system: 'live', features: { ...statusConfig.features } };
const versions = versionsJson as Versions;
const site = renderSite(live, evidenceRecords, asOf, versions);
const demo = renderSite(statusConfig, evidenceRecords, asOf);
const fileSet = new Set(site.files.keys());

interface Check { name: string; pass: boolean; detail: string }
const canonicalChecks: Check[] = [];
const sitemapChecks: Check[] = [];
const schemaChecks: Check[] = [];
const add = (list: Check[], name: string, pass: boolean, detail = '') => {
  list.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${pass || !detail ? '' : `  — ${detail}`}`);
};

/* ---------- canonical: T4 ---------- */
const pageRows = site.pages.map((p) => {
  const html = site.files.get(p.file) ?? '';
  const canonical = canonicalOf(html);
  return { route: p.route, indexable: p.indexable, canonical, noindex: !htmlIsIndexable(html) };
});
const wrongCanonical = pageRows.filter((r) => r.indexable && !(r.canonical.length === 1 && r.canonical[0] === absoluteUrl(r.route)));
add(canonicalChecks, 'every indexable page has exactly one canonical, pointing at itself', wrongCanonical.length === 0, wrongCanonical.map((r) => r.route).join(' '));
const mixed = pageRows.filter((r) => !r.indexable && (r.canonical.length > 0 || !r.noindex));
add(canonicalChecks, 'a page that is not indexable says noindex and names no canonical', mixed.length === 0, mixed.map((r) => r.route).join(' '));
const notFound = site.files.get('404.html') ?? '';
add(canonicalChecks, 'the error page is noindex with no canonical', !htmlIsIndexable(notFound) && canonicalOf(notFound).length === 0);

const htmlFiles = [...fileSet].filter((f) => f.endsWith('.html'));
const strays = htmlFiles.filter((f) => f !== '404.html' && f !== 'index.html' && !f.endsWith('/index.html'));
add(canonicalChecks, 'no page is emitted under a second file name', strays.length === 0, strays.join(' '));

const variants: string[] = [];
for (const p of site.pages) {
  const bare = p.route === '/' ? null : p.route.replace(/\/$/, '');
  const forms = [`${p.route}index.html`, ...(bare ? [bare, `${bare}.html`] : [])];
  if (resolveAddress(p.route, fileSet).status !== 200) variants.push(`${p.route} is not 200`);
  for (const form of forms) {
    const r = resolveAddress(form, fileSet);
    if (!(r.status === 301 && r.location === p.route)) variants.push(`${form} → ${r.status}`);
  }
}
add(canonicalChecks, `each of ${site.pages.length} pages answers 200 at one address and 301 from every other form`, variants.length === 0, variants.join(' | '));

const badMoves: string[] = [];
for (const [from, to] of Object.entries(REDIRECTS)) {
  const bare = from.replace(/\/$/, '');
  for (const form of [from, bare, `${bare}.html`, `${from}index.html`]) {
    const r = resolveAddress(form, fileSet, REDIRECTS);
    if (!(r.status === 301 && r.location === to)) badMoves.push(`${form} → ${r.status}`);
  }
  if (resolveAddress(to, fileSet, REDIRECTS).status !== 200) badMoves.push(`${to} is not 200`);
}
add(canonicalChecks, `each of ${Object.keys(REDIRECTS).length} moved addresses answers 301 to its new page in one hop, in every spelling`, badMoves.length === 0, badMoves.join(' | '));

const demoRows = demo.pages.map((p) => demo.files.get(p.file) ?? '');
add(canonicalChecks, 'the shipped demo build: every page noindex, no canonical anywhere', demoRows.every((h) => !htmlIsIndexable(h) && canonicalOf(h).length === 0));

/* ---------- sitemap and robots: T7 ---------- */
const xml = site.files.get('sitemap.xml') ?? '';
const locs = [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1] ?? '');
const expected = site.pages.filter((p) => p.indexable).map((p) => absoluteUrl(p.route));
add(sitemapChecks, 'the sitemap lists every indexable URL', expected.every((u) => locs.includes(u)), expected.filter((u) => !locs.includes(u)).join(' '));
add(sitemapChecks, 'the sitemap lists nothing else', locs.every((u) => expected.includes(u)), locs.filter((u) => !expected.includes(u)).join(' '));
add(sitemapChecks, 'no URL appears twice', new Set(locs).size === locs.length);
const unresolved = locs.filter((u) => resolveAddress(new URL(u).pathname, fileSet).status !== 200);
add(sitemapChecks, 'every sitemap entry resolves to 200', unresolved.length === 0, unresolved.join(' '));
const robots = site.files.get('robots.txt') ?? '';
const sitemapLine = /^Sitemap: (\S+)$/m.exec(robots)?.[1] ?? '';
add(sitemapChecks, 'robots.txt names the sitemap, and the sitemap is there', sitemapLine === absoluteUrl('/sitemap.xml') && resolveAddress('/sitemap.xml', fileSet).status === 200, sitemapLine);
add(sitemapChecks, 'robots.txt of a live build does not close the site', !/^Disallow: \/\s*$/m.test(robots));
add(sitemapChecks, 'the shipped demo build: no sitemap, robots closes the site', !demo.files.has('sitemap.xml') && /^Disallow: \/\s*$/m.test(demo.files.get('robots.txt') ?? ''));

/* ---------- lastmod: FR-20 ---------- */
const indexablePages = site.pages.filter((p) => p.indexable).map((p) => ({ route: p.route, html: site.files.get(p.file) ?? '' }));
const lastmods = [...xml.matchAll(/<url><loc>([^<]*)<\/loc>(?:<lastmod>([^<]*)<\/lastmod>)?<\/url>/g)].map((m) => ({ loc: m[1] ?? '', lastmod: m[2] ?? '' }));
const undated = lastmods.filter((u) => !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(u.lastmod));
add(sitemapChecks, 'every sitemap entry carries a lastmod timestamp', lastmods.length === locs.length && undated.length === 0, undated.map((u) => u.loc).join(' '));
const stale = staleRoutes(versions, indexablePages);
add(sitemapChecks, 'the version manifest matches the current content of every indexable page (else run `npm run stamp`)', stale.length === 0, stale.join(' '));
const extra = Object.keys(versions).filter((route) => !indexablePages.some((p) => p.route === route));
add(sitemapChecks, 'the manifest holds no page that is no longer indexable', extra.length === 0, extra.join(' '));

/* ---------- structured data: T17 ---------- */
const schemaRows = products.map((p) => {
  const html = site.files.get(`products/${p.id}/index.html`) ?? '';
  let blocks: Record<string, unknown>[] = [];
  let parseError = '';
  try { blocks = extractJsonLd(html); } catch (error) { parseError = String(error); }
  const productBlocks = blocks.filter((b) => b['@type'] === 'Product');
  const crumbs = blocks.filter((b) => b['@type'] === 'BreadcrumbList');
  return { id: p.id, kind: p.kind, expectsProduct: hasProductMarkup(p), parseError, productBlocks, crumbs, forbidden: forbiddenKeysIn(blocks), figures: allStrings(blocks).flatMap((text) => extractFigures(text)) };
});
const unparsed = schemaRows.filter((r) => r.parseError);
add(schemaChecks, 'every JSON-LD block parses', unparsed.length === 0, unparsed.map((r) => r.id).join(' '));
const wrongCount = schemaRows.filter((r) => r.productBlocks.length !== (r.expectsProduct ? 1 : 0));
add(schemaChecks, 'model and family pages carry exactly one Product; solution and supplies pages carry none', wrongCount.length === 0, wrongCount.map((r) => `${r.id}(${r.productBlocks.length})`).join(' '));
const incomplete = schemaRows.filter((r) => r.expectsProduct).filter((r) => {
  const b = r.productBlocks[0] ?? {};
  const brand = b.brand as Record<string, unknown> | undefined;
  return !(b['@context'] === 'https://schema.org' && typeof b.name === 'string' && b.name && typeof b.description === 'string' && b.description
    && brand?.['@type'] === 'Brand' && typeof brand?.name === 'string' && b.url === absoluteUrl(`/products/${r.id}/`));
});
add(schemaChecks, 'each Product names itself, its brand and its own canonical URL', incomplete.length === 0, incomplete.map((r) => r.id).join(' '));
const forbidden = schemaRows.filter((r) => r.forbidden.length);
add(schemaChecks, 'no structured data carries a price, an offer, availability, a rating or a review', forbidden.length === 0, forbidden.map((r) => `${r.id}:${r.forbidden.join(',')}`).join(' '));
const leaked = schemaRows.filter((r) => r.figures.length);
add(schemaChecks, 'no structured data states a spec figure', leaked.length === 0, leaked.map((r) => `${r.id}:${r.figures.join(',')}`).join(' '));
const badCrumbs = schemaRows.filter((r) => r.crumbs.length !== 1);
add(schemaChecks, 'every product page carries one breadcrumb trail', badCrumbs.length === 0, badCrumbs.map((r) => r.id).join(' '));
const everyBlock = site.pages.map((p) => {
  let blocks: Record<string, unknown>[] = [];
  try { blocks = extractJsonLd(site.files.get(p.file) ?? ''); } catch { return { route: p.route, bad: 'does not parse' }; }
  const forbiddenHere = forbiddenKeysIn(blocks);
  const figuresHere = allStrings(blocks).flatMap((text) => extractFigures(text));
  return { route: p.route, bad: [...forbiddenHere, ...figuresHere].join(',') };
}).filter((r) => r.bad);
add(schemaChecks, `structured data on all ${site.pages.length} pages parses and carries no forbidden key or spec figure`, everyBlock.length === 0, everyBlock.map((r) => `${r.route}:${r.bad}`).join(' '));
const others = site.pages.filter((p) => !p.route.startsWith('/products/') || p.route === '/products/').filter((p) => extractJsonLd(site.files.get(p.file) ?? '').some((b) => b['@type'] === 'Product'));
add(schemaChecks, 'no other page claims to be a Product', others.length === 0, others.map((p) => p.route).join(' '));

const failed = [...canonicalChecks, ...sitemapChecks, ...schemaChecks].filter((c) => !c.pass);
const stamp = { ranAt: new Date().toISOString(), variant: 'live (rendered in memory, never written to dist/)' };
writeFileSync(join(out, 'canonical.json'), JSON.stringify({ ...stamp, passed: canonicalChecks.filter((c) => c.pass).length, failed: canonicalChecks.filter((c) => !c.pass).length, checks: canonicalChecks, pages: pageRows }, null, 2) + '\n');
writeFileSync(join(out, 'sitemap.json'), JSON.stringify({ ...stamp, passed: sitemapChecks.filter((c) => c.pass).length, failed: sitemapChecks.filter((c) => !c.pass).length, checks: sitemapChecks, urls: lastmods }, null, 2) + '\n');
writeFileSync(join(out, 'schema.json'), JSON.stringify({ ...stamp, validation: 'structural only: parsed and checked against this project\'s rules, not run through an external validator', passed: schemaChecks.filter((c) => c.pass).length, failed: schemaChecks.filter((c) => !c.pass).length, checks: schemaChecks, products: schemaRows.map((r) => ({ id: r.id, kind: r.kind, product: r.productBlocks[0] ?? null })) }, null, 2) + '\n');
const total = canonicalChecks.length + sitemapChecks.length + schemaChecks.length;
console.log(`\n${total - failed.length}/${total} checks passed · ${locs.length} URLs in the live sitemap`);
process.exit(failed.length ? 1 : 0);
