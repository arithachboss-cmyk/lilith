import { describe, expect, it } from 'vitest';
import { mainContentHash, nextVersions, staleRoutes, type Versions } from '../../src/build/versions';
import { renderSite } from '../../src/build/site';
import { statusConfig, type StatusConfig } from '../../src/config/status';
import { products } from '../../src/data/catalog';
import { productPage } from '../../src/render/pages';
import {
  allStrings, breadcrumbJsonLd, extractJsonLd, forbiddenKeysIn, hasProductMarkup, jsonLdScript, productJsonLd,
} from '../../src/render/structured';
import { hasSpecFigure } from '../../src/rules/figures';

const product = (id: string) => products.find((p) => p.id === id)!;
const asOf = '2026-11-13';

describe('product structured data', () => {
  it('describes the product with what the page states and nothing more', () => {
    expect(productJsonLd(product('te200'))).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'TE200 Desktop Printer',
      alternateName: 'เครื่องพิมพ์ฉลากแบบตั้งโต๊ะ',
      description: 'เครื่องพิมพ์ฉลากขนาดกะทัดรัด สำหรับฉลากสินค้าและงานประจำวัน',
      brand: { '@type': 'Brand', name: 'TSC' },
      category: 'Barcode printers',
      url: 'https://www.asiancoding.com/products/te200/',
    });
  });

  it('is emitted for the 9 models and families, not for the 5 supplies and solution entries', () => {
    expect(products.filter(hasProductMarkup).map((p) => p.id).sort()).toEqual(
      ['1950g', '1960g', 'ds2208', 'ds3600', 'm510', 'tc22', 'te200', 'zd421', 'zt411'],
    );
    for (const id of ['rfid', 'labels', 'wax-ribbons', 'wax-resin-ribbons', 'resin-ribbons']) {
      expect(productJsonLd(product(id))).toBeNull();
    }
  });

  it('never carries a price, an offer, availability, a rating or a review', () => {
    for (const p of products) {
      expect(forbiddenKeysIn(extractJsonLd(productPage(p, [], asOf)))).toEqual([]);
    }
  });

  it('would catch a forbidden key however deeply it is nested', () => {
    expect(forbiddenKeysIn({ a: [{ offers: { price: 1, priceCurrency: 'THB' } }], aggregateRating: {} }).sort()).toEqual(
      ['aggregateRating', 'offers', 'price', 'priceCurrency'],
    );
  });

  it('states no spec figure in any description', () => {
    for (const p of products) {
      const data = productJsonLd(p);
      if (data) expect(hasSpecFigure(String(data.description))).toBe(false);
    }
  });

  it('puts exactly one Product and one breadcrumb on a model page', () => {
    const blocks = extractJsonLd(productPage(product('1950g'), [], asOf));
    expect(blocks.map((b) => b['@type'])).toEqual(['Product', 'BreadcrumbList']);
  });

  it('puts only a breadcrumb on a supplies page', () => {
    const blocks = extractJsonLd(productPage(product('wax-ribbons'), [], asOf));
    expect(blocks.map((b) => b['@type'])).toEqual(['BreadcrumbList']);
  });

  it('builds the breadcrumb from real pages, each with its own address', () => {
    const items = breadcrumbJsonLd(product('zd421')).itemListElement as Array<{ position: number; item: string }>;
    expect(items.map((i) => i.item)).toEqual([
      'https://www.asiancoding.com/',
      'https://www.asiancoding.com/products/',
      'https://www.asiancoding.com/categories/printers/',
      'https://www.asiancoding.com/products/zd421/',
    ]);
    expect(items.map((i) => i.position)).toEqual([1, 2, 3, 4]);
  });

  it('cannot be closed early by a value containing a script tag', () => {
    const html = jsonLdScript({ name: '</script><script>alert(1)</script>' });
    expect(html.match(/<\/script>/g)).toHaveLength(1);
    expect(extractJsonLd(html)[0]?.name).toBe('</script><script>alert(1)</script>');
  });

  it('collects every string for inspection', () => {
    expect(allStrings({ a: 'x', b: [{ c: 'y' }], d: 3 })).toEqual(['x', 'y']);
  });
});

describe('page versions and lastmod', () => {
  const page = (route: string, body: string) => ({ route, html: `<header>nav</header><main id="main">${body}</main><footer>f</footer>` });
  const t1 = '2026-11-13T10:00:00Z';
  const t2 = '2026-11-14T10:00:00Z';

  it('hashes the main content only, so shared chrome does not move a date', () => {
    const a = '<header>old nav</header><main id="main">same</main>';
    const b = '<header>new nav</header><main id="main">same</main>';
    expect(mainContentHash(a)).toBe(mainContentHash(b));
    expect(mainContentHash(a)).not.toBe(mainContentHash('<main id="main">different</main>'));
  });

  it('keeps the date of an unchanged page and moves the date of a changed one', () => {
    const first = nextVersions({}, [page('/a/', 'one'), page('/b/', 'two')], t1);
    const second = nextVersions(first, [page('/a/', 'one'), page('/b/', 'two, edited')], t2);
    expect(second['/a/']).toEqual(first['/a/']);
    expect(second['/a/']?.lastmod).toBe(t1);
    expect(second['/b/']?.lastmod).toBe(t2);
    expect(second['/b/']?.hash).not.toBe(first['/b/']?.hash);
  });

  it('never gives a changed page the date it had before', () => {
    const first = nextVersions({}, [page('/a/', 'one')], t1);
    const second = nextVersions(first, [page('/a/', 'two')], t2);
    const third = nextVersions(second, [page('/a/', 'three')], '2026-11-14T10:00:01Z');
    expect(new Set([first['/a/']?.lastmod, second['/a/']?.lastmod, third['/a/']?.lastmod]).size).toBe(3);
  });

  it('dates a new page and drops a page that is gone', () => {
    const first = nextVersions({}, [page('/a/', 'one'), page('/gone/', 'x')], t1);
    const second = nextVersions(first, [page('/a/', 'one'), page('/new/', 'y')], t2);
    expect(Object.keys(second).sort()).toEqual(['/a/', '/new/']);
    expect(second['/new/']?.lastmod).toBe(t2);
  });

  it('is stable: stamping twice without a change changes nothing', () => {
    const first = nextVersions({}, [page('/a/', 'one')], t1);
    expect(nextVersions(first, [page('/a/', 'one')], t2)).toEqual(first);
  });

  it('reports pages whose content no longer matches the manifest', () => {
    const versions = nextVersions({}, [page('/a/', 'one'), page('/b/', 'two')], t1);
    expect(staleRoutes(versions, [page('/a/', 'one'), page('/b/', 'two')])).toEqual([]);
    expect(staleRoutes(versions, [page('/a/', 'one'), page('/b/', 'edited'), page('/c/', 'new')])).toEqual(['/b/', '/c/']);
  });

  it('writes each lastmod into the live sitemap, and none when there is no manifest', () => {
    const live: StatusConfig = { system: 'live', features: { ...statusConfig.features } };
    const versions: Versions = { '/': { hash: 'x', lastmod: t1 }, '/products/te200/': { hash: 'y', lastmod: t2 } };
    const xml = renderSite(live, [], asOf, versions).files.get('sitemap.xml')!;
    expect(xml).toContain(`<url><loc>https://www.asiancoding.com/</loc><lastmod>${t1}</lastmod></url>`);
    expect(xml).toContain(`<url><loc>https://www.asiancoding.com/products/te200/</loc><lastmod>${t2}</lastmod></url>`);
    expect(xml).toContain('<url><loc>https://www.asiancoding.com/enquiry/</loc></url>');
    expect(renderSite(live, [], asOf).files.get('sitemap.xml')).not.toContain('<lastmod>');
  });
});
