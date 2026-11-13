import { describe, expect, it } from 'vitest';
import { isIndexable, statusConfig, systemBadgeText, type StatusConfig } from '../../src/config/status';
import { products } from '../../src/data/catalog';
import { esc } from '../../src/render/html';
import {
  aboutPage, cataloguePage, enquiryPage, homePage, productPage, statusPage,
} from '../../src/render/pages';
import type { EvidenceRecord } from '../../src/rules/evidence';

const withSystem = (system: StatusConfig['system'], features: Partial<StatusConfig['features']> = {}): StatusConfig => ({
  system,
  features: { ...statusConfig.features, ...features },
});
const product = (id: string) => products.find((p) => p.id === id)!;

describe('status config drives every screen', () => {
  it('ships in demo mode', () => {
    expect(statusConfig.system).toBe('demo');
    expect(isIndexable()).toBe(false);
  });

  it('changes the badge when the config changes', () => {
    expect(homePage(withSystem('demo'))).toContain('data-system-status="demo"');
    expect(homePage(withSystem('live'))).toContain('data-system-status="live"');
    expect(homePage(withSystem('live'))).toContain(esc(systemBadgeText(withSystem('live'))));
    expect(homePage(withSystem('demo'))).not.toContain('data-system-status="live"');
  });

  it('closes every page of a non-live build to crawlers', () => {
    for (const html of [homePage(), cataloguePage(), enquiryPage(), aboutPage(), statusPage(), productPage(product('te200'), [], '2026-11-13')]) {
      expect(html).toContain('<meta name="robots" content="noindex,nofollow">');
    }
    expect(homePage(withSystem('live'))).not.toContain('noindex');
  });

  it('changes dependent screens when a feature status changes', () => {
    expect(enquiryPage(withSystem('demo'))).toContain('chip-demo');
    expect(enquiryPage(withSystem('demo', { enquiry: 'not_connected' }))).toContain('notice-not_connected');
    expect(statusPage(withSystem('demo', { prices: 'live' }))).toMatch(/data-feature="prices">.*?chip-live/s);
    expect(statusPage()).toMatch(/data-feature="prices">.*?chip-not_connected/s);
  });
});

describe('product page', () => {
  it('renders the Thai title as the only h1', () => {
    const html = productPage(product('te200'), [], '2026-11-13');
    expect(html.match(/<h1[ >]/g)).toHaveLength(1);
    expect(html).toContain('<h1>เครื่องพิมพ์ฉลากแบบตั้งโต๊ะ</h1>');
    expect(html).toContain('TE200 Desktop Printer');
  });

  it('omits figure lines that have no active evidence, and says how many', () => {
    const html = productPage(product('1950g'), [], '2026-11-13');
    expect(html).not.toContain('IP52');
    expect(html).not.toContain('0–50');
    expect(html).toContain('data-omitted-figures="2"');
    expect(html).toContain('อ่านบาร์โค้ด 1D/2D');
  });

  it('shows a figure once an active record covers it', () => {
    const record: EvidenceRecord = {
      id: 'EV-1', claimId: 'CR-07', subject: { productId: '1950g', feature: 'มาตรฐานการป้องกัน IP52' },
      quote: 'IP52', sourceUrl: 'https://example.com/d.pdf', sourceRevision: 'A', retrievedOn: '2026-11-13',
      status: 'active', author: 'a@example.com', approvedBy: 'b@example.com',
    };
    const html = productPage(product('1950g'), [record], '2026-11-13');
    expect(html).toContain('มาตรฐานการป้องกัน IP52');
    expect(html).toContain('data-omitted-figures="1"');
  });

  it('shows placeholders, never a price or stock value', () => {
    const html = productPage(product('zd421'), [], '2026-11-13');
    expect(html.match(/รอเจ้าของกำหนด/g)?.length).toBeGreaterThanOrEqual(2);
    expect(html).not.toMatch(/฿|บาท|THB|in stock|มีสินค้าพร้อมส่ง/i);
  });

  it('says a family covers more than one model', () => {
    expect(productPage(product('tc22'), [], '2026-11-13')).toContain('ตระกูลผลิตภัณฑ์ — ครอบคลุมมากกว่าหนึ่งรุ่น');
    expect(productPage(product('tc22'), [], '2026-11-13')).toContain('TC22 / TC27');
    expect(productPage(product('te200'), [], '2026-11-13')).not.toContain('ตระกูลผลิตภัณฑ์');
    expect(productPage(product('ds3600'), [], '2026-11-13')).toContain('data-family-note');
    expect(productPage(product('te200'), [], '2026-11-13')).not.toContain('data-family-note');
  });

  it('links the manufacturer page but never a dead ACS page', () => {
    expect(productPage(product('te200'), [], '2026-11-13')).toContain('apac.tscprinters.com');
    for (const p of products) {
      const html = productPage(p, [], '2026-11-13');
      expect(html).not.toMatch(/href="https?:\/\/(www\.)?asiancoding\.com/);
    }
  });
});

describe('other pages', () => {
  it('lists all 14 products on the catalogue, in the HTML itself', () => {
    const html = cataloguePage();
    expect(html.match(/data-product-card/g)).toHaveLength(14);
    for (const p of products) expect(html).toContain(`href="/products/${p.id}/"`);
  });

  it('renders both consent boxes unticked', () => {
    const html = enquiryPage();
    expect(html).toContain('name="serviceConsent"');
    expect(html).toContain('name="marketingConsent"');
    expect(html).not.toMatch(/<input[^>]*\schecked/);
  });

  it('shows a placeholder for the company page until its copy is approved', () => {
    const html = aboutPage(withSystem('live', { company: 'not_connected' }));
    expect(html).toContain('ยังไม่เผยแพร่');
    expect(html).not.toContain('1994');
    expect(html).toContain('noindex');
  });

  it('escapes HTML', () => {
    expect(esc(`<a href="x">&'`)).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&#39;');
  });
});
