import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  applyOverrides, featureOverrides, products, sourceProducts, type FeatureOverride,
} from '../../src/data/catalog';
import { overrideProblems } from '../../src/rules/overrides';
import { productPage } from '../../src/render/pages';

const base: FeatureOverride = {
  productId: 'm510', from: 'รองรับฉลากกว้างสูงสุด 1.5 นิ้ว (38.1 มม.)', to: 'รองรับฉลากกว้างสูงสุด 1.5 นิ้ว',
  decision: 'D-12', decidedBy: 'ACS Owner', decidedOn: '2026-11-13', reason: 'the manufacturer states inches only',
};

describe('catalogue overrides', () => {
  it('leave the snapshot file exactly as it was fetched', () => {
    const file = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src', 'data', 'catalog.source.json');
    const snapshot = JSON.parse(readFileSync(file, 'utf8')) as { products: Array<{ id: string; features: string[] }> };
    expect(snapshot.products.find((p) => p.id === 'm510')?.features).toContain('รองรับฉลากกว้างสูงสุด 1.5 นิ้ว (38.1 มม.)');
    expect(sourceProducts.find((p) => p.id === 'm510')?.features).toContain('รองรับฉลากกว้างสูงสุด 1.5 นิ้ว (38.1 มม.)');
  });

  it('change one line of one product and nothing else', () => {
    expect(featureOverrides).toHaveLength(1);
    const differing = products.flatMap((p, i) =>
      p.features.map((f, j) => [p.id, sourceProducts[i]?.features[j], f] as const).filter(([, before, after]) => before !== after));
    expect(differing).toEqual([['m510', 'รองรับฉลากกว้างสูงสุด 1.5 นิ้ว (38.1 มม.)', 'รองรับฉลากกว้างสูงสุด 1.5 นิ้ว']]);
    for (const [i, p] of products.entries()) expect({ ...p, features: [] }).toEqual({ ...sourceProducts[i], features: [] });
  });

  it('record who decided, when and why', () => {
    expect(overrideProblems(featureOverrides)).toEqual([]);
    expect(featureOverrides[0]).toMatchObject({ decision: 'D-12', decidedBy: 'ACS Owner', decidedOn: '2026-11-13' });
  });

  it('never put the millimetre figure on the page, with or without evidence', () => {
    const m510 = products.find((p) => p.id === 'm510')!;
    const active = m510.features.map((feature, i) => ({
      id: `T-${i}`, claimId: 'CR-07', subject: { productId: 'm510', feature }, quote: 'x', sourceUrl: 'https://example.com/x',
      sourceRevision: 'r', retrievedOn: '2026-11-13', status: 'active' as const, author: 'A', approvedBy: 'B',
    }));
    const html = productPage(m510, active, '2026-11-13');
    expect(html).toContain('รองรับฉลากกว้างสูงสุด 1.5 นิ้ว');
    expect(html).not.toContain('38.1');
    expect(productPage(m510, [], '2026-11-13')).not.toContain('38.1');
  });

  it('refuse an override that matches no snapshot line', () => {
    expect(() => applyOverrides(sourceProducts, [{ ...base, from: 'รองรับฉลากกว้างสูงสุด 1.5 นิ้ว' }])).toThrow(/matches no line/);
    expect(() => applyOverrides(sourceProducts, [{ ...base, productId: 'nope' }])).toThrow(/matches no line/);
  });

  it('refuse an override that adds a figure or any new text', () => {
    expect(overrideProblems([{ ...base, to: 'รองรับฉลากกว้างสูงสุด 2 นิ้ว' }]).join()).toMatch(/adds/);
    expect(overrideProblems([{ ...base, to: 'รองรับฉลากกว้างสูงสุด 1.5 นิ้ว (38.1 มม.) 600 dpi' }]).join()).toMatch(/adds/);
    expect(overrideProblems([{ ...base, to: 'รองรับฉลากกว้างที่สุดในตลาด 1.5 นิ้ว' }]).join()).toMatch(/adds text/);
    expect(overrideProblems([{ ...base, to: '' }]).join()).toMatch(/adds text/);
    expect(overrideProblems([{ ...base, to: base.from }]).join()).toMatch(/changes nothing/);
  });

  it('refuse an override with no decision behind it', () => {
    for (const gap of [{ decidedBy: '' }, { decidedOn: 'yesterday' }, { reason: ' ' }, { decision: '' }]) {
      expect(overrideProblems([{ ...base, ...gap }]).join()).toMatch(/must say who decided/);
    }
  });
});
