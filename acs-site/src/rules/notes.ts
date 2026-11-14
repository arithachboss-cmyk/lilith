import { productById } from '../data/catalog';
import type { EvidenceRecord } from './evidence';
import { extractFigures, quoteCovers } from './figures';

/** Something ACS says about a product, on the Owner's recorded statement. */
export interface ProductNote {
  productId: string;
  text: string;
  statedBy: string;
  statedOn: string;
  basis: string;
}

/**
 * Words a note may not use. Prices, stock and delivery each have their own
 * gate and their own evidence; a note is not a way around them.
 */
const OUT_OF_SCOPE = /฿|บาท|THB|ราคา|ส่วนลด|โปรโมชั่น|สต็อก|พร้อมส่ง|มีสินค้า|ส่งภายใน|ภายใน\s*\d|จัดส่ง|in stock|ready to ship|รับประกัน|ดีที่สุด|อันดับ/i;

/** Problems with the note itself, whatever the evidence says. */
export function noteProblems(notes: readonly ProductNote[]): string[] {
  const problems: string[] = [];
  for (const n of notes) {
    const label = `${n.productId}: "${n.text}"`;
    if (!productById(n.productId)) problems.push(`${label} names no product`);
    if (!n.text.trim()) problems.push(`${label} is empty`);
    if (!n.statedBy.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(n.statedOn) || !n.basis.trim()) {
      problems.push(`${label} must say who stated it, when, and on what basis`);
    }
    const banned = OUT_OF_SCOPE.exec(n.text);
    if (banned) problems.push(`${label} speaks of price, stock, delivery or rank ("${banned[0]}")`);
    if (notes.filter((other) => other.productId === n.productId && other.text === n.text).length > 1) {
      problems.push(`${label} is recorded twice`);
    }
  }
  return [...new Set(problems)];
}

/**
 * A note is shown only while every figure in it is stated by an approved,
 * unexpired evidence record for the same product. A note with no figure needs
 * no record. Take the approval away and the note goes with it.
 */
export function noteAllowed(note: ProductNote, records: readonly EvidenceRecord[], asOf: string): boolean {
  const quotes = records
    .filter((r) =>
      r.status === 'active' && r.subject.productId === note.productId && Boolean(r.approvedBy)
      && r.approvedBy!.trim().toLowerCase() !== r.author.trim().toLowerCase() && (!r.expiresOn || r.expiresOn >= asOf))
    .map((r) => r.quote);
  return extractFigures(note.text).every((figure) => quotes.some((quote) => quoteCovers(figure, quote)));
}

export function notesFor(
  productId: string,
  notes: readonly ProductNote[],
  records: readonly EvidenceRecord[],
  asOf: string,
): ProductNote[] {
  return notes.filter((n) => n.productId === productId && noteAllowed(n, records, asOf));
}
