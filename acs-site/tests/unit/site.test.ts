import { describe, expect, it } from 'vitest';
import { resolveAddress } from '../../src/build/address';
import { absoluteUrl, canonicalOf, htmlIsIndexable, renderSite } from '../../src/build/site';
import { statusConfig, type StatusConfig } from '../../src/config/status';
import { REDIRECTS, redirectProblems } from '../../src/build/redirects';
import { categories, products } from '../../src/data/catalog';

const asOf = '2026-11-13';
const liveConfig = (features: Partial<StatusConfig['features']> = {}): StatusConfig => ({
  system: 'live',
  features: { ...statusConfig.features, ...features },
});
const demo = renderSite(statusConfig, [], asOf);
const live = renderSite(liveConfig(), [], asOf);
const locsOf = (xml: string) => [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);

describe('the shipped demo build', () => {
  it('renders 26 pages', () => {
    expect(demo.pages).toHaveLength(26);
  });

  it('opens nothing to crawlers', () => {
    expect(demo.pages.filter((p) => p.indexable)).toEqual([]);
    for (const p of demo.pages) {
      const html = demo.files.get(p.file)!;
      expect(htmlIsIndexable(html)).toBe(false);
      expect(canonicalOf(html)).toEqual([]);
    }
  });

  it('ships no sitemap and a robots.txt that closes the site', () => {
    expect(demo.files.has('sitemap.xml')).toBe(false);
    expect(demo.files.get('robots.txt')).toBe('User-agent: *\nDisallow: /\n');
  });
});

describe('a live build', () => {
  const indexable = live.pages.filter((p) => p.indexable).map((p) => p.route);

  it('indexes the home page, the catalogue, 6 categories, 14 products, the enquiry page and the about page', () => {
    expect(indexable.sort()).toEqual([
      '/', '/products/', '/enquiry/', '/about/',
      ...categories.map((c) => `/categories/${c.id}/`),
      ...products.map((p) => `/products/${p.id}/`),
    ].sort());
    expect(indexable).toHaveLength(24);
  });

  it('keeps the basket and the status page out', () => {
    for (const route of ['/basket/', '/status/']) {
      const html = live.files.get(`${route.slice(1)}index.html`)!;
      expect(htmlIsIndexable(html)).toBe(false);
      expect(canonicalOf(html)).toEqual([]);
    }
    expect(htmlIsIndexable(live.files.get('404.html')!)).toBe(false);
  });

  it('gives every indexable page exactly one canonical, pointing at itself', () => {
    for (const p of live.pages.filter((x) => x.indexable)) {
      expect(canonicalOf(live.files.get(p.file)!)).toEqual([absoluteUrl(p.route)]);
    }
  });

  it('never states noindex and a canonical on the same page', () => {
    for (const html of live.files.values()) {
      if (!html.startsWith('<!doctype html>')) continue;
      expect(htmlIsIndexable(html) ? canonicalOf(html).length : 0).toBe(htmlIsIndexable(html) ? 1 : 0);
      if (!htmlIsIndexable(html)) expect(canonicalOf(html)).toEqual([]);
    }
  });

  it('writes canonicals on the www host with a trailing slash', () => {
    expect(canonicalOf(live.files.get('products/te200/index.html')!)).toEqual(['https://www.asiancoding.com/products/te200/']);
    expect(canonicalOf(live.files.get('index.html')!)).toEqual(['https://www.asiancoding.com/']);
  });

  it('keeps one canonical for the catalogue whatever filter is applied', () => {
    // Filters are query parameters on one static page; its canonical cannot vary.
    expect(canonicalOf(live.files.get('products/index.html')!)).toEqual(['https://www.asiancoding.com/products/']);
  });

  it('lists exactly the indexable pages in the sitemap, each once', () => {
    const locs = locsOf(live.files.get('sitemap.xml')!);
    expect(locs.slice().sort()).toEqual(indexable.map(absoluteUrl).sort());
    expect(new Set(locs).size).toBe(locs.length);
  });

  it('names the sitemap in robots.txt and does not close the site', () => {
    const robots = live.files.get('robots.txt')!;
    expect(robots).toContain('Sitemap: https://www.asiancoding.com/sitemap.xml');
    expect(robots).not.toMatch(/^Disallow: \/\s*$/m);
  });

  it('lists the about page only while its copy is approved', () => {
    const unapproved = renderSite(liveConfig({ company: 'not_connected' }), [], asOf);
    expect(locsOf(live.files.get('sitemap.xml')!)).toContain('https://www.asiancoding.com/about/');
    expect(locsOf(unapproved.files.get('sitemap.xml')!)).not.toContain('https://www.asiancoding.com/about/');
    expect(htmlIsIndexable(unapproved.files.get('about/index.html')!)).toBe(false);
  });

  it('lists the category pages only while that feature is live', () => {
    const without = renderSite(liveConfig({ categoryPages: 'not_connected' }), [], asOf);
    expect(locsOf(without.files.get('sitemap.xml')!).filter((u) => u?.includes('/categories/'))).toEqual([]);
    expect(locsOf(live.files.get('sitemap.xml')!).filter((u) => u?.includes('/categories/'))).toHaveLength(6);
  });

  it('emits each page under one file name only', () => {
    const html = [...live.files.keys()].filter((f) => f.endsWith('.html'));
    expect(html.filter((f) => f !== '404.html' && f !== 'index.html' && !f.endsWith('/index.html'))).toEqual([]);
  });
});

describe('one address per page', () => {
  const files = new Set(live.files.keys());

  it('serves the trailing-slash form', () => {
    expect(resolveAddress('/', files)).toEqual({ status: 200, file: 'index.html' });
    expect(resolveAddress('/products/te200/', files)).toEqual({ status: 200, file: 'products/te200/index.html' });
  });

  it.each([
    ['/index.html', '/'],
    ['/products', '/products/'],
    ['/products.html', '/products/'],
    ['/products/index.html', '/products/'],
    ['/products/te200', '/products/te200/'],
    ['/products/te200.html', '/products/te200/'],
    ['/products/te200/index.html', '/products/te200/'],
  ])('redirects %s permanently to %s', (from, to) => {
    expect(resolveAddress(from, files)).toEqual({ status: 301, location: to });
  });

  it('answers 200 at exactly one address for every page', () => {
    for (const p of live.pages) {
      const bare = p.route === '/' ? null : p.route.replace(/\/$/, '');
      const forms = [p.route, `${p.route}index.html`, ...(bare ? [bare, `${bare}.html`] : [])];
      expect(forms.filter((f) => resolveAddress(f, files).status === 200)).toEqual([p.route]);
    }
  });

  it('ignores the query string when resolving', () => {
    expect(resolveAddress('/products/?category=printers', files)).toEqual({ status: 200, file: 'products/index.html' });
  });

  it('serves plain files and refuses everything else', () => {
    expect(resolveAddress('/robots.txt', files)).toEqual({ status: 200, file: 'robots.txt' });
    expect(resolveAddress('/sitemap.xml', files)).toEqual({ status: 200, file: 'sitemap.xml' });
    expect(resolveAddress('/products/does-not-exist/', files)).toEqual({ status: 404 });
    expect(resolveAddress('/products/does-not-exist', files)).toEqual({ status: 404 });
    expect(resolveAddress('/nope.html', files)).toEqual({ status: 404 });
  });

  it('does not treat the error page as an address', () => {
    expect(resolveAddress('/404/', files)).toEqual({ status: 404 });
    expect(resolveAddress('/404', files)).toEqual({ status: 404 });
  });

  it.each([
    ['/why-acs'], ['/why-acs/'], ['/why-acs.html'], ['/why-acs/index.html'],
    ['/company'], ['/company/'], ['/company.html'], ['/company/index.html'],
  ])('sends the moved address %s to /about/ in one hop', (from) => {
    expect(resolveAddress(from, files, REDIRECTS)).toEqual({ status: 301, location: '/about/' });
    expect(resolveAddress('/about/', files, REDIRECTS)).toEqual({ status: 200, file: 'about/index.html' });
  });

  it('does not redirect an address that merely starts like a moved one', () => {
    expect(resolveAddress('/why-acs-not/', files, REDIRECTS)).toEqual({ status: 404 });
    expect(resolveAddress('/company/team/', files, REDIRECTS)).toEqual({ status: 404 });
  });

  it('never lets a redirect shadow a real page', () => {
    expect(resolveAddress('/about/', files, { '/about/': '/products/' })).toEqual({ status: 200, file: 'about/index.html' });
  });

  it('accepts the shipped redirect list and rejects a broken one', () => {
    const routes = live.pages.map((p) => p.route);
    expect(redirectProblems(REDIRECTS, routes)).toEqual([]);
    expect(redirectProblems({ '/about/': '/products/' }, routes).join()).toContain('is a real page');
    expect(redirectProblems({ '/old/': '/nowhere/' }, routes).join()).toContain('is not a page');
    expect(redirectProblems({ '/a/': '/b/', '/b/': '/about/' }, routes).join()).toContain('a chain');
    expect(redirectProblems({ 'old': '/about/' }, routes).join()).toContain('must look like');
  });

  it('refuses path tricks', () => {
    expect(resolveAddress('/../package.json', files)).toEqual({ status: 404 });
    expect(resolveAddress('/products//te200/', files)).toEqual({ status: 404 });
    expect(resolveAddress('/%E0%A4%A', files)).toEqual({ status: 404 });
  });
});
