import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { resolveAddress } from '../../src/build/address';
import { launchReadiness } from '../../src/build/launch';
import {
  activeRedirects, planCounts, planProblems, redirectPlan, REDIRECTS, type PlanRow,
} from '../../src/build/redirects';
import { renderSite } from '../../src/build/site';
import { statusConfig, type StatusConfig } from '../../src/config/status';
import { productImages, products } from '../../src/data/catalog';
import { imageBlock, priceBlock, productPage, statusPage, stockBlock } from '../../src/render/pages';
import { extractFigures } from '../../src/rules/figures';
import { imageProblems, type ProductImage } from '../../src/rules/images';

const asOf = '2026-11-14';
const live = renderSite({ ...statusConfig, system: 'live' }, [], asOf);
const routes = live.pages.map((p) => p.route);
const files = new Set(live.files.keys());
const te200 = products.find((p) => p.id === 'te200')!;
const withPresentation = (prices: 'pending' | 'quote_on_request', stock: 'pending' | 'ask_acs'): StatusConfig => ({
  ...statusConfig, presentation: { prices, stock },
});

describe('price and stock wording (the Owner has not chosen yet)', () => {
  it('ships with both still pending, so pages show the waiting notice', () => {
    expect(statusConfig.presentation).toEqual({ prices: 'pending', stock: 'pending' });
    const html = productPage(te200, [], asOf);
    expect(html).toContain('รอเจ้าของกำหนด');
    expect(html).not.toContain('data-price-mode');
    expect(html).not.toContain('data-stock-mode');
  });

  it('treats a config with no presentation as pending', () => {
    const bare: StatusConfig = { system: 'demo', features: statusConfig.features };
    expect(priceBlock(bare)).toBe(priceBlock(statusConfig));
    expect(stockBlock(bare)).toBe(stockBlock(statusConfig));
  });

  it('words a price as a request for a quote when that is chosen, with no figure and no waiting notice', () => {
    const html = priceBlock(withPresentation('quote_on_request', 'pending'));
    expect(html).toContain('data-price-mode="quote_on_request"');
    expect(html).toContain('ขอใบเสนอราคาจาก ACS');
    expect(html).not.toContain('รอเจ้าของกำหนด');
    expect(extractFigures(html.replace(/<[^>]+>/g, ' '))).toEqual([]);
    expect(html).not.toMatch(/฿|บาท|THB|ส่วนลด|ถูกที่สุด/);
  });

  it('words stock as a question for ACS when that is chosen, and promises no availability', () => {
    const html = stockBlock(withPresentation('pending', 'ask_acs'));
    expect(html).toContain('data-stock-mode="ask_acs"');
    expect(html).not.toContain('รอเจ้าของกำหนด');
    expect(html).not.toMatch(/พร้อมส่ง|มีสินค้า|ส่งภายใน|in stock|\d/);
  });

  it('changes one block at a time', () => {
    const html = productPage(te200, [], asOf, withPresentation('quote_on_request', 'pending'));
    expect(html).toContain('data-price-mode');
    expect(html).not.toContain('data-stock-mode');
    expect(html).toContain('รอเจ้าของกำหนด');
  });
});

describe('product images (none supplied yet)', () => {
  const photo: ProductImage = { productId: 'te200', file: 'te200.jpg', width: 1200, height: 900, alt: 'เครื่องพิมพ์ฉลาก TSC TE200 มุมด้านหน้า', suppliedBy: 'ACS', suppliedOn: '2026-11-14' };
  const ids = products.map((p) => p.id);

  it('ships with no image, so every product shows the labelled placeholder', () => {
    expect(productImages).toEqual([]);
    expect(imageBlock(te200)).toContain('รอรูปสินค้า');
    expect(productPage(te200, [], asOf)).not.toContain('<img');
  });

  it('renders a supplied image with its size, alt text and lazy loading', () => {
    const html = imageBlock(te200, [photo]);
    expect(html).toBe('<img class="product-img" src="/assets/products/te200.jpg" width="1200" height="900" alt="เครื่องพิมพ์ฉลาก TSC TE200 มุมด้านหน้า" loading="lazy" decoding="async">');
    expect(imageBlock(products.find((p) => p.id === 'zt411')!, [photo])).toContain('รอรูปสินค้า');
  });

  it('accepts a complete entry whose file is present', () => {
    expect(imageProblems([photo], ids, ['te200.jpg'])).toEqual([]);
  });

  it('refuses a missing file, a missing size, empty alt text, an unknown product and a duplicate', () => {
    expect(imageProblems([photo], ids, []).join()).toMatch(/file is not in/);
    expect(imageProblems([{ ...photo, width: 0 }], ids, ['te200.jpg']).join()).toMatch(/pixel size/);
    expect(imageProblems([{ ...photo, alt: ' ' }], ids, ['te200.jpg']).join()).toMatch(/alt text/);
    expect(imageProblems([{ ...photo, productId: 'nope' }], ids, ['te200.jpg']).join()).toMatch(/names no product/);
    expect(imageProblems([photo, { ...photo }], ids, ['te200.jpg']).join()).toMatch(/more than one image/);
    expect(imageProblems([{ ...photo, file: '../secret.png' }], ids, ['../secret.png']).join()).toMatch(/file name/);
    expect(imageProblems([{ ...photo, suppliedOn: 'today' }], ids, ['te200.jpg']).join()).toMatch(/who supplied it/);
  });
});

describe('the plan for the old site\'s dead addresses', () => {
  it('covers every dead address of the reconciliation, once each', () => {
    const file = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'acs-seo', 'data', 'sitemap-reconciliation.json');
    const dead = (JSON.parse(readFileSync(file, 'utf8')) as { rows: Array<{ path: string; status: number }> }).rows
      .filter((r) => r.status !== 200).map((r) => `${r.path.replace(/\/$/, '')}/`).sort();
    expect(dead).toHaveLength(81);
    expect(redirectPlan.map((r) => r.from).sort()).toEqual(dead);
  });

  it('is internally sound: real targets, a reason on every row, no page shadowed', () => {
    expect(planProblems(redirectPlan, routes)).toEqual([]);
    expect(planCounts()).toEqual({ approved: 1, proposed: 30, no_equivalent: 50 });
  });

  it('applies only what the Owner approved', () => {
    expect(REDIRECTS).toEqual({ '/company/': '/about/', '/why-acs/': '/about/' });
    for (const row of redirectPlan.filter((r) => r.status !== 'approved')) {
      expect(resolveAddress(row.from, files, REDIRECTS)).toEqual({ status: 404 });
    }
  });

  it('would apply a proposed row the moment it is approved, in every spelling', () => {
    const approved = redirectPlan.map((r): PlanRow => (r.from === '/contact/' ? { ...r, status: 'approved' } : r));
    const active = activeRedirects(approved);
    for (const form of ['/contact', '/contact/', '/contact.html', '/contact/index.html']) {
      expect(resolveAddress(form, files, active)).toEqual({ status: 301, location: '/enquiry/' });
    }
    const thai = redirectPlan.map((r): PlanRow => (r.from === '/เครื่องสแกนบาร์โค้ด/' ? { ...r, status: 'approved' } : r));
    expect(resolveAddress(encodeURI('/เครื่องสแกนบาร์โค้ด'), files, activeRedirects(thai))).toEqual({ status: 301, location: '/categories/scanners/' });
  });

  it('sends nothing to a page that has nothing to do with it', () => {
    const noHome = redirectPlan.filter((r) => r.status === 'no_equivalent');
    expect(noHome.every((r) => r.to === null)).toBe(true);
    expect(noHome.filter((r) => r.oldType === 'Article')).toHaveLength(12);
    expect(noHome.some((r) => r.from.startsWith('/case-study/'))).toBe(true);
  });

  it('rejects a broken plan', () => {
    const row = redirectPlan[0]!;
    expect(planProblems([{ ...row, from: '/about/', to: '/products/', status: 'proposed' }], routes).join()).toMatch(/is a page of the new site/);
    expect(planProblems([{ ...row, to: '/nowhere/', status: 'proposed' }], routes).join()).toMatch(/is not a page/);
    expect(planProblems([{ ...row, to: null, status: 'approved' }], routes).join()).toMatch(/does not fit/);
    expect(planProblems([{ ...row, to: '/about/', status: 'no_equivalent' }], routes).join()).toMatch(/does not fit/);
    expect(planProblems([{ ...row, reason: '' }], routes).join()).toMatch(/gives no reason/);
    expect(planProblems([row, row], routes).join()).toMatch(/listed twice/);
  });
});

describe('launch readiness', () => {
  it('reports every condition as not ready today', () => {
    const rows = launchReadiness(statusConfig);
    expect(rows.map((r) => r.key)).toEqual(['prices', 'stock', 'images', 'enquiry', 'redirects']);
    expect(rows.every((r) => r.ready === false)).toBe(true);
    expect(rows.find((r) => r.key === 'images')?.detail).toBe('มีรูปแล้ว 0 จาก 14 รายการ');
    expect(rows.find((r) => r.key === 'redirects')?.detail).toBe('อนุมัติแล้ว 1 · เสนอไว้รออนุมัติ 30 · ไม่มีหน้าเทียบเท่า 50');
  });

  it('turns a row ready only when the choice is really made', () => {
    const rows = launchReadiness(withPresentation('quote_on_request', 'ask_acs'));
    expect(rows.filter((r) => r.ready).map((r) => r.key)).toEqual(['prices', 'stock']);
  });

  it('does not call the enquiry path ready just because the config says live', () => {
    const forced: StatusConfig = { ...statusConfig, features: { ...statusConfig.features, enquiry: 'live' } };
    expect(launchReadiness(forced).find((r) => r.key === 'enquiry')?.ready).toBe(false);
  });

  it('shows the same rows on the status page', () => {
    const html = statusPage(statusConfig);
    for (const row of launchReadiness(statusConfig)) {
      expect(html).toContain(`data-launch="${row.key}" data-ready="false"`);
      expect(html).toContain(row.detail);
    }
  });
});
