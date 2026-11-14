import { describe, expect, it } from 'vitest';
import { products } from '../../src/data/catalog';
import { evidenceApprovals, evidenceDrafts, evidenceGaps, evidenceProblems, evidenceRecords } from '../../src/data/evidence';
import { applyApprovals, AuditLog, draftBlockers, splitFeatures } from '../../src/rules/evidence';
import { extractFigures } from '../../src/rules/figures';

const asOf = '2026-11-13';
const held = products.flatMap((p) => splitFeatures(p.id, p.features, [], asOf).omitted.map((feature) => `${p.id}|${feature}`));

describe('evidence drafts', () => {
  it('are written as drafts; only a recorded approval makes one active', () => {
    expect(evidenceDrafts.every((r) => r.status === 'draft' && !r.approvedBy)).toBe(true);
    expect(evidenceProblems).toEqual([]);
    expect(evidenceApprovals.map((a) => a.recordId).sort()).toEqual(evidenceDrafts.map((r) => r.id).sort());
    expect(evidenceRecords.filter((r) => r.status === 'active')).toHaveLength(evidenceApprovals.length);
  });

  it('were each approved by a named person who is not the author', () => {
    for (const a of evidenceApprovals) {
      const draft = evidenceDrafts.find((r) => r.id === a.recordId)!;
      expect(a.approvedBy).toMatch(/\S+ \S+/);
      expect(a.approvedBy.toLowerCase()).not.toContain('claude');
      expect(a.approvedBy.trim().toLowerCase()).not.toBe(draft.author.trim().toLowerCase());
      expect(a.approvedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('each point at a figure line the catalogue really has', () => {
    for (const r of evidenceDrafts) {
      expect(held).toContain(`${r.subject.productId}|${r.subject.feature}`);
      expect(extractFigures(r.subject.feature).length).toBeGreaterThan(0);
    }
  });

  it('are blocked by nothing except a second person', () => {
    expect(evidenceDrafts).toHaveLength(7);
    for (const r of evidenceDrafts) expect(draftBlockers(r).map((c) => c.name)).toEqual([]);
  });

  it('would still be refused for the catalogue line the Owner chose not to show', () => {
    // The snapshot's own wording adds a millimetre value the source never states.
    const draft = evidenceDrafts.find((r) => r.id === 'EV-M510-02')!;
    const asSnapshot = { ...draft, subject: { ...draft.subject, feature: 'รองรับฉลากกว้างสูงสุด 1.5 นิ้ว (38.1 มม.)' } };
    expect(draftBlockers(asSnapshot).map((c) => c.name)).toEqual(['quote-covers:38.1 มม.']);
    const log = new AuditLog();
    const { records } = applyApprovals([asSnapshot], [{ recordId: 'EV-M510-02', approvedBy: 'Somchai (ACS product manager)', approvedOn: '2026-11-20' }], log);
    expect(records[0]?.status).toBe('draft');
    expect(log.entries()[0]?.action).toBe('activation_refused');
  });

  it('account, with the listed gaps, for every held-back figure exactly once', () => {
    const covered = [
      ...evidenceDrafts.map((r) => `${r.subject.productId}|${r.subject.feature}`),
      ...evidenceGaps.map((g) => `${g.productId}|${g.feature}`),
    ];
    expect(covered.sort()).toEqual([...held].sort());
  });

  it('carries the Owner\'s answer to the one question a record left open', () => {
    // The ZD421 record asked which resolution ACS supplies. The line on the page covers both.
    const zd421 = evidenceApprovals.find((a) => a.recordId === 'EV-ZD421-01')!;
    expect(zd421.confirmations).toEqual([
      { on: '2026-11-14', by: 'Arithach Chartariyapong, CEO, Asian Coding Systems', text: 'ACS sells the ZD421 in both resolutions, 203 dpi and 300 dpi.' },
    ]);
    expect(evidenceDrafts.find((r) => r.id === 'EV-ZD421-01')?.subject.feature).toBe('ความละเอียด 203 หรือ 300 dpi ตามรุ่นย่อย');
  });

  it('show nothing while they are drafts', () => {
    const p = products.find((x) => x.id === '1950g')!;
    const unapproved = applyApprovals(evidenceDrafts, [], new AuditLog()).records;
    expect(unapproved.every((r) => r.status === 'draft')).toBe(true);
    expect(splitFeatures(p.id, p.features, unapproved, asOf).omitted).toHaveLength(2);
  });
});

describe('approving a draft', () => {
  const draft = evidenceDrafts[0]!;

  it('activates it when a different, named person approves', () => {
    const log = new AuditLog();
    const { records, problems } = applyApprovals(evidenceDrafts, [{ recordId: draft.id, approvedBy: 'Somchai (ACS product manager)', approvedOn: '2026-11-20' }], log);
    expect(problems).toEqual([]);
    const active = records.find((r) => r.id === draft.id)!;
    expect(active).toMatchObject({ status: 'active', approvedBy: 'Somchai (ACS product manager)' });
    expect(records.filter((r) => r.status === 'active')).toHaveLength(1);
    expect(log.entries().map((e) => [e.recordId, e.action, e.at])).toEqual([[draft.id, 'activated', '2026-11-20']]);
    const p = products.find((x) => x.id === '1950g')!;
    expect(splitFeatures(p.id, p.features, records, asOf).shown).toContain(draft.subject.feature);
    expect(splitFeatures(p.id, p.features, records, asOf).omitted).toHaveLength(1);
  });

  it('refuses the author, in any spelling, and logs the refusal', () => {
    for (const approvedBy of [draft.author, ` ${draft.author.toUpperCase()} `, '']) {
      const log = new AuditLog();
      const { records } = applyApprovals(evidenceDrafts, [{ recordId: draft.id, approvedBy, approvedOn: '2026-11-20' }], log);
      expect(records.every((r) => r.status === 'draft')).toBe(true);
      expect(log.entries().map((e) => e.action)).toEqual(['activation_refused']);
    }
  });

  it('refuses an approval when the quote does not cover the figure', () => {
    const log = new AuditLog();
    const wrong = [{ ...draft, quote: 'IP Rating : IP41' }];
    const { records } = applyApprovals(wrong, [{ recordId: draft.id, approvedBy: 'Somchai', approvedOn: '2026-11-20' }], log);
    expect(records[0]?.status).toBe('draft');
    expect(log.entries()[0]?.checks.filter((c) => !c.pass).map((c) => c.name)).toEqual(['quote-covers:IP52']);
  });

  it('reports an approval that names no draft, a duplicate, and a record typed in as active', () => {
    const log = new AuditLog();
    expect(applyApprovals(evidenceDrafts, [{ recordId: 'EV-NOPE', approvedBy: 'Somchai', approvedOn: '2026-11-20' }], log).problems).toEqual(['approval names no draft: EV-NOPE']);
    const twice = [{ recordId: draft.id, approvedBy: 'A', approvedOn: '2026-11-20' }, { recordId: draft.id, approvedBy: 'B', approvedOn: '2026-11-21' }];
    expect(applyApprovals(evidenceDrafts, twice, log).problems).toEqual([`more than one approval for ${draft.id}`]);
    const typedIn = applyApprovals([{ ...draft, status: 'active', approvedBy: 'Somchai' }], [], log);
    expect(typedIn.problems).toEqual([`${draft.id}: a record must be written as a draft`]);
    expect(typedIn.records[0]?.status).toBe('draft');
  });
});
