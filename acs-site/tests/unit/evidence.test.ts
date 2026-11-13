import { describe, expect, it } from 'vitest';
import { products } from '../../src/data/catalog';
import { evidenceRecords } from '../../src/data/evidence';
import {
  activate, AuditLog, figureAllowed, splitFeatures, type EvidenceRecord,
} from '../../src/rules/evidence';

const draft = (over: Partial<EvidenceRecord> = {}): EvidenceRecord => ({
  id: 'EV-TEST-1',
  claimId: 'CR-07',
  subject: { productId: '1950g', feature: 'มาตรฐานการป้องกัน IP52' },
  quote: 'Sealing: IP52',
  sourceUrl: 'https://example.com/datasheet.pdf',
  sourceRevision: 'Rev A',
  retrievedOn: '2026-11-13',
  status: 'draft',
  author: 'writer@example.com',
  ...over,
});
const fixedNow = () => '2026-11-13T00:00:00.000Z';

describe('evidence activation gate', () => {
  it('activates a sourced draft approved by someone else', () => {
    const log = new AuditLog();
    const out = activate(draft(), 'reviewer@example.com', log, fixedNow);
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.record.status).toBe('active');
      expect(out.record.approvedBy).toBe('reviewer@example.com');
    }
    expect(log.entries().at(-1)?.action).toBe('activated');
  });

  it('refuses when the approver is the author', () => {
    const log = new AuditLog();
    const out = activate(draft(), 'Writer@Example.com ', log, fixedNow);
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.failed.map((c) => c.name)).toContain('approver-is-not-author');
    expect(log.entries().at(-1)?.action).toBe('activation_refused');
  });

  it('refuses when no approver is named', () => {
    const out = activate(draft(), '  ', new AuditLog(), fixedNow);
    expect(out.ok).toBe(false);
  });

  it('refuses when the quote does not state the figure', () => {
    const out = activate(draft({ quote: 'Sealing: IP54' }), 'reviewer@example.com', new AuditLog(), fixedNow);
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.failed.map((c) => c.name)).toContain('quote-covers:IP52');
  });

  it('refuses when a second figure in the line is not covered', () => {
    const record = draft({
      subject: { productId: 'm510', feature: 'รองรับฉลากกว้างสูงสุด 1.5 นิ้ว (38.1 มม.)' },
      quote: 'Maximum label width 1.5 นิ้ว',
    });
    const out = activate(record, 'reviewer@example.com', new AuditLog(), fixedNow);
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.failed.map((c) => c.name)).toEqual(['quote-covers:38.1 มม.']);
  });

  it('refuses without a source or a revision', () => {
    expect(activate(draft({ sourceUrl: '' }), 'r@example.com', new AuditLog(), fixedNow).ok).toBe(false);
    expect(activate(draft({ sourceRevision: ' ' }), 'r@example.com', new AuditLog(), fixedNow).ok).toBe(false);
  });

  it('refuses to re-activate an active record', () => {
    expect(activate(draft({ status: 'active' }), 'r@example.com', new AuditLog(), fixedNow).ok).toBe(false);
  });

  it('never mutates the draft it was given', () => {
    const record = draft();
    activate(record, 'reviewer@example.com', new AuditLog(), fixedNow);
    expect(record.status).toBe('draft');
    expect(record.approvedBy).toBeUndefined();
  });

  it('keeps an append-only audit log', () => {
    const log = new AuditLog();
    activate(draft(), 'writer@example.com', log, fixedNow);
    activate(draft(), 'reviewer@example.com', log, fixedNow);
    const entries = log.entries();
    expect(entries.map((e) => e.action)).toEqual(['activation_refused', 'activated']);
    // The copy handed out cannot be used to rewrite history.
    (entries as unknown[]).length = 0;
    expect(log.entries()).toHaveLength(2);
    expect(() => {
      (log.entries()[0] as { action: string }).action = 'activated';
    }).toThrow();
    expect(Object.keys(Object.getOwnPropertyDescriptors(AuditLog.prototype)).sort()).toEqual(['append', 'constructor', 'entries']);
  });
});

describe('what a product page may show', () => {
  const feature = 'มาตรฐานการป้องกัน IP52';
  const active = draft({ status: 'active', approvedBy: 'reviewer@example.com' });

  it('holds a figure back when no record covers it', () => {
    expect(figureAllowed('1950g', feature, [], '2026-11-13')).toBe(false);
  });

  it('shows a figure covered by an active record', () => {
    expect(figureAllowed('1950g', feature, [active], '2026-11-13')).toBe(true);
  });

  it('ignores drafts, other products, self-approved and expired records', () => {
    expect(figureAllowed('1950g', feature, [draft()], '2026-11-13')).toBe(false);
    expect(figureAllowed('1960g', feature, [active], '2026-11-13')).toBe(false);
    expect(figureAllowed('1950g', feature, [{ ...active, approvedBy: active.author }], '2026-11-13')).toBe(false);
    expect(figureAllowed('1950g', feature, [{ ...active, expiresOn: '2026-11-12' }], '2026-11-13')).toBe(false);
  });

  it('ships seven active records, each approved by someone other than its author, and holds nothing back', () => {
    const active = evidenceRecords.filter((r) => r.status === 'active');
    expect(active).toHaveLength(7);
    for (const r of active) {
      expect(r.approvedBy).toBeTruthy();
      expect(r.approvedBy!.trim().toLowerCase()).not.toBe(r.author.trim().toLowerCase());
    }
    const omitted = products.flatMap((p) => splitFeatures(p.id, p.features, evidenceRecords, '2026-11-13').omitted);
    expect(omitted).toEqual([]);
  });

  it('holds all seven back again the moment the approvals are taken away', () => {
    const omitted = products.flatMap((p) => splitFeatures(p.id, p.features, [], '2026-11-13').omitted);
    expect(omitted).toHaveLength(7);
  });

  it('keeps lines without figures', () => {
    const p = products.find((x) => x.id === '1950g')!;
    const { shown, omitted } = splitFeatures(p.id, p.features, [], '2026-11-13');
    expect(shown).toEqual(['อ่านบาร์โค้ด 1D/2D', 'เชื่อมต่อแบบมีสาย; USB, RS-232, RS-485 และ Keyboard Wedge ตามชุดอุปกรณ์']);
    expect(omitted).toHaveLength(2);
  });
});
