import { describe, expect, it } from 'vitest';
import { productNotes, products } from '../../src/data/catalog';
import { evidenceDrafts, evidenceRecords } from '../../src/data/evidence';
import { productPage } from '../../src/render/pages';
import { extractJsonLd } from '../../src/render/structured';
import { applyApprovals, AuditLog } from '../../src/rules/evidence';
import { noteAllowed, noteProblems, notesFor, type ProductNote } from '../../src/rules/notes';

const asOf = '2026-11-14';
const zd421 = products.find((p) => p.id === 'zd421')!;
const note: ProductNote = {
  productId: 'zd421', text: 'ACS จำหน่ายทั้งรุ่น 203 dpi และ 300 dpi',
  statedBy: 'Arithach Chartariyapong, CEO, Asian Coding Systems', statedOn: '2026-11-14', basis: 'Owner statement',
};
const unapproved = applyApprovals(evidenceDrafts, [], new AuditLog()).records;

describe('notes from ACS on a product page', () => {
  it('records one note, with who stated it and when', () => {
    expect(productNotes).toEqual([expect.objectContaining({ productId: 'zd421', text: note.text, statedOn: '2026-11-14' })]);
    expect(noteProblems(productNotes)).toEqual([]);
  });

  it('shows the note on the ZD421 page and on no other', () => {
    expect(productPage(zd421, evidenceRecords, asOf)).toContain(`<span class="acs-note-label">ข้อมูลจาก ACS</span> ${note.text}</p>`);
    for (const p of products.filter((x) => x.id !== 'zd421')) {
      expect(productPage(p, evidenceRecords, asOf)).not.toContain('data-acs-note');
    }
  });

  it('keeps the catalogue line as it was, beside the note', () => {
    expect(productPage(zd421, evidenceRecords, asOf)).toContain('<li>ความละเอียด 203 หรือ 300 dpi ตามรุ่นย่อย</li>');
  });

  it('hides the note the moment the evidence behind its figures is not approved', () => {
    expect(noteAllowed(note, evidenceRecords, asOf)).toBe(true);
    expect(noteAllowed(note, unapproved, asOf)).toBe(false);
    expect(noteAllowed(note, [], asOf)).toBe(false);
    expect(productPage(zd421, unapproved, asOf)).not.toContain('data-acs-note');
    expect(productPage(zd421, unapproved, asOf)).not.toContain('ACS จำหน่ายทั้งรุ่น');
  });

  it('does not borrow evidence from another product, an expired record or a self-approved one', () => {
    const active = evidenceRecords.find((r) => r.id === 'EV-ZD421-01')!;
    expect(noteAllowed({ ...note, productId: 'zt411' }, evidenceRecords, asOf)).toBe(false);
    expect(noteAllowed(note, [{ ...active, expiresOn: '2026-11-13' }], asOf)).toBe(false);
    expect(noteAllowed(note, [{ ...active, approvedBy: active.author }], asOf)).toBe(false);
  });

  it('refuses a figure the approved source does not state', () => {
    expect(noteAllowed({ ...note, text: 'ACS จำหน่ายทั้งรุ่น 203 dpi และ 600 dpi' }, evidenceRecords, asOf)).toBe(false);
    expect(noteAllowed({ ...note, text: 'ACS จำหน่ายรุ่น 300 dpi พิมพ์ได้ 152 mm/s' }, evidenceRecords, asOf)).toBe(false);
    expect(notesFor('zd421', [{ ...note, text: 'ACS จำหน่ายรุ่น 600 dpi' }], evidenceRecords, asOf)).toEqual([]);
  });

  it('allows a note with no figure, and needs no record for it', () => {
    expect(noteAllowed({ ...note, text: 'ACS จำหน่ายทั้งสองรุ่นย่อย' }, [], asOf)).toBe(true);
  });

  it('refuses a note about price, stock, delivery or rank', () => {
    for (const text of ['ราคาเริ่มต้น 9,900 บาท', 'มีสินค้าพร้อมส่ง', 'จัดส่งภายใน 3 วัน', 'in stock now', 'รุ่นที่ดีที่สุด', 'รับประกัน 2 ปี']) {
      expect(noteProblems([{ ...note, text }]).join()).toMatch(/speaks of price, stock, delivery or rank/);
    }
  });

  it('refuses a note with no one behind it, an unknown product, or a duplicate', () => {
    expect(noteProblems([{ ...note, statedBy: '' }]).join()).toMatch(/must say who stated it/);
    expect(noteProblems([{ ...note, statedOn: 'today' }]).join()).toMatch(/must say who stated it/);
    expect(noteProblems([{ ...note, productId: 'nope' }]).join()).toMatch(/names no product/);
    expect(noteProblems([note, note]).join()).toMatch(/recorded twice/);
  });

  it('escapes the note and keeps it out of structured data', () => {
    const html = productPage(zd421, evidenceRecords, asOf);
    expect(JSON.stringify(extractJsonLd(html))).not.toContain('จำหน่ายทั้งรุ่น');
    expect(html).not.toMatch(/<p class="acs-note"[^>]*>[^<]*<script/);
  });
});
