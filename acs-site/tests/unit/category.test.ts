import { describe, expect, it } from 'vitest';
import { statusConfig, type StatusConfig } from '../../src/config/status';
import { categories, categoryPath, productPath, products, productsIn } from '../../src/data/catalog';
import { categoryPage, cataloguePage, homePage, productPage } from '../../src/render/pages';
import { extractJsonLd, forbiddenKeysIn } from '../../src/render/structured';
import { extractFigures } from '../../src/rules/figures';

const live: StatusConfig = { system: 'live', features: { ...statusConfig.features } };
const category = (id: string) => categories.find((c) => c.id === id)!;
const text = (html: string) => (/<main\b[^>]*>([\s\S]*?)<\/main>/.exec(html)?.[1] ?? '').replace(/<[^>]+>/g, ' ');

describe('category pages (D-09)', () => {
  it('gives every category an address that no product can collide with', () => {
    const productRoutes = new Set(products.map((p) => productPath(p.id)));
    for (const c of categories) {
      expect(categoryPath(c.id)).toBe(`/categories/${c.id}/`);
      expect(productRoutes.has(categoryPath(c.id))).toBe(false);
    }
    // Two entries share a name with their category, which is why categories are not under /products/.
    expect(products.filter((p) => categories.some((c) => c.id === p.id)).map((p) => p.id).sort()).toEqual(['labels', 'rfid']);
  });

  it('puts every product in exactly one category page', () => {
    const listed = categories.flatMap((c) => productsIn(c.id).map((p) => p.id));
    expect(listed.sort()).toEqual(products.map((p) => p.id).sort());
    expect(categories.every((c) => productsIn(c.id).length > 0)).toBe(true);
  });

  it('lists exactly its own products, each linked to its page', () => {
    for (const c of categories) {
      const html = categoryPage(c, live);
      const cards = [...html.matchAll(/data-product-card data-id="([^"]+)"/g)].map((m) => m[1]);
      expect(cards).toEqual(productsIn(c.id).map((p) => p.id));
      for (const p of productsIn(c.id)) expect(html).toContain(`href="${productPath(p.id)}"`);
    }
  });

  it('uses the category name as its only h1 and its own address as canonical', () => {
    for (const c of categories) {
      const html = categoryPage(c, live);
      expect(html.match(/<h1>/g)).toHaveLength(1);
      expect(html).toContain(`<h1>${c.thai}</h1>`);
      expect(html).toContain(`<link rel="canonical" href="https://www.asiancoding.com/categories/${c.id}/">`);
    }
  });

  it('has a heading no product page uses', () => {
    const productHeadings = new Set(products.map((p) => p.thaiTitle));
    for (const c of categories) expect(productHeadings.has(c.thai)).toBe(false);
  });

  it('states no figure, price or stock of its own', () => {
    for (const c of categories) {
      const body = text(categoryPage(c, live));
      expect(extractFigures(body)).toEqual([]);
      expect(body).not.toMatch(/฿|บาท|THB|พร้อมส่ง|มีสินค้า|in stock/i);
    }
  });

  it('carries a breadcrumb and an item list, and nothing forbidden', () => {
    for (const c of categories) {
      const blocks = extractJsonLd(categoryPage(c, live));
      expect(blocks.map((b) => b['@type'])).toEqual(['BreadcrumbList', 'ItemList']);
      expect(forbiddenKeysIn(blocks)).toEqual([]);
      expect(blocks[1]?.numberOfItems).toBe(productsIn(c.id).length);
    }
  });

  it('stays out of the index when the feature is not live', () => {
    const off: StatusConfig = { system: 'live', features: { ...statusConfig.features, categoryPages: 'not_connected' } };
    expect(categoryPage(category('printers'), off)).toContain('noindex');
    expect(categoryPage(category('printers'), statusConfig)).toContain('noindex');
  });

  it('is linked from the home page, the catalogue and each product breadcrumb', () => {
    for (const c of categories) {
      expect(homePage(live)).toContain(`href="${categoryPath(c.id)}"`);
      expect(cataloguePage(live)).toContain(`href="${categoryPath(c.id)}"`);
    }
    for (const p of products) expect(productPage(p, [], '2026-11-13', live)).toContain(`href="${categoryPath(p.category)}"`);
    expect(homePage(live)).not.toContain('?category=');
  });
});

describe('the ribbon category owns the ribbon choice (D-10)', () => {
  const html = categoryPage(category('ribbons'), live);

  it('sets the three ribbon kinds side by side', () => {
    expect(html).toContain('data-chooser');
    const rows = [...html.matchAll(/<tr><th scope="row"><a href="([^"]+)">/g)].map((m) => m[1]);
    expect(rows).toEqual(['/products/wax-ribbons/', '/products/wax-resin-ribbons/', '/products/resin-ribbons/']);
  });

  it('says only what the catalogue says about each kind', () => {
    const table = /<tbody>([\s\S]*?)<\/tbody>/.exec(html)?.[1] ?? '';
    const cells = [...table.matchAll(/<td>([\s\S]*?)<\/td>/g)].map((m) => m[1]);
    const allowed = productsIn('ribbons').flatMap((p) => [p.thaiDescription, p.features.join(' · ')]);
    expect(cells).toEqual(allowed);
  });

  it('is the only category with a chooser', () => {
    for (const c of categories.filter((x) => x.id !== 'ribbons')) {
      expect(categoryPage(c, live)).not.toContain('data-chooser');
    }
  });

  it('keeps the three ribbon pages, each under its own name', () => {
    const titles = productsIn('ribbons').map((p) => p.thaiTitle);
    expect(new Set(titles).size).toBe(3);
    expect(titles).not.toContain(category('ribbons').thai);
  });
});
