/**
 * Finds measured spec figures in a catalogue feature line.
 *
 * A figure is a number that claims something measurable about the product: an
 * ingress rating, a temperature range, a resolution, a dimension. Model names
 * that merely contain digits (RS-232, 1D/2D, TE200, DS2208) are not figures.
 *
 * Owner rule (Queue #4): no spec certainty without the product's datasheet.
 * So a line holding a figure is only rendered when an active evidence record
 * covers it — see rules/evidence.ts.
 *
 * JavaScript's \b is ASCII-only and silently fails next to Thai letters, so no
 * pattern here relies on it around a Thai unit. That bug already shipped once
 * in this repository's claim scanner.
 */
import { products } from '../data/catalog';

const NUM = String.raw`\d+(?:[.,]\d+)?`;
// A range (0–50) or a short list of alternatives (203 หรือ 300) shares one unit,
// so the whole run is one figure: evidence has to cover every number in it.
const RANGE = String.raw`${NUM}(?:\s*(?:[–—-]|หรือ|และ|or|and|/)\s*${NUM})*`;

const LATIN_UNITS = [
  '°\\s?[CF]', 'dpi', 'ips', 'mm/s', 'mm', 'cm', 'km', 'inch(?:es)?', 'in', 'px', 'ppm',
  'kg', 'g', 'lbs?', 'V', 'mAh', 'Wh', 'W', 'Hz', 'kHz', 'MHz', 'GHz', 'nm', 'ms', 'm',
  'hours?', 'hrs?', '%',
];
const THAI_UNITS = [
  'มม\\.?', 'ซม\\.?', 'เมตร', 'นิ้ว', 'พิกเซล', 'กรัม', 'กิโลกรัม', 'ชั่วโมง', 'ชม\\.?',
  'วินาที', 'องศา', 'เปอร์เซ็นต์', 'ครั้ง',
];

const PATTERNS: RegExp[] = [
  // Ingress protection rating: IP52, IP 65
  /(?<![A-Za-z0-9])IP\s?\d{2}(?![A-Za-z0-9])/g,
  // Dimensions or sensor size: 640 × 480 พิกเซล, 4 x 6 in
  new RegExp(String.raw`${NUM}\s*[×xX]\s*${NUM}(?:\s*(?:${[...LATIN_UNITS, ...THAI_UNITS].join('|')}))?`, 'g'),
  // Number (or range) + Latin unit. A Latin letter or digit may not follow the unit.
  new RegExp(String.raw`(?<![A-Za-z0-9-])${RANGE}\s*(?:${LATIN_UNITS.join('|')})(?![A-Za-z0-9])`, 'g'),
  // Number (or range) + Thai unit. No boundary assertion: \b does not work in Thai.
  new RegExp(String.raw`(?<![A-Za-z0-9-])${RANGE}\s*(?:${THAI_UNITS.join('|')})`, 'g'),
];

/**
 * Model numbers that happen to end in a unit letter. "1950g" is a Honeywell
 * model, not 1,950 grams. They are taken from the catalogue's own product
 * names, so nothing is whitelisted by hand, and a match is dropped only when
 * it is spelled exactly like the model: "1950 g" with a space is still a weight.
 */
export const MODEL_TOKENS: ReadonlySet<string> = new Set(
  products.flatMap((p) => [p.id, ...p.name.split(/[\s/]+/)]).filter((token) => /\d/.test(token)),
);

/** Every figure in the line, in reading order, without overlaps. */
export function extractFigures(text: string, modelTokens: ReadonlySet<string> = MODEL_TOKENS): string[] {
  const hits: Array<{ start: number; end: number; value: string }> = [];
  for (const re of PATTERNS) {
    re.lastIndex = 0;
    for (const m of text.matchAll(re)) {
      const start = m.index ?? 0;
      hits.push({ start, end: start + m[0].length, value: m[0].trim() });
    }
  }
  hits.sort((a, b) => a.start - b.start || b.end - a.end);
  const out: typeof hits = [];
  for (const h of hits) {
    const last = out.at(-1);
    if (last && h.start < last.end) continue; // contained in a longer match
    out.push(h);
  }
  return out.map((h) => h.value).filter((value) => !modelTokens.has(value));
}

export function hasSpecFigure(text: string): boolean {
  return extractFigures(text).length > 0;
}

/** Whitespace and dash variants must not decide whether a quote matches. */
export function normaliseFigure(text: string): string {
  return text
    .normalize('NFKC')
    .replace(/[–—−]/g, '-')
    .replace(/\s+/g, '')
    .toLowerCase();
}

/**
 * The same quantity, written the way the catalogue (Thai) and a manufacturer
 * (English) each write it. Only spellings of one unit are listed; nothing here
 * converts between units.
 */
const UNIT_SPELLINGS: Array<[RegExp, string]> = [
  [/พิกเซล|pixels?|px/g, 'pixels'],
  [/นิ้ว|inch(?:es)?|in\.|(?<=\d)in(?![a-z])|(?<=\d)"/g, 'in'],
  [/มม\.?|millimet(?:er|re)s?|(?<=\d)mm\.?/g, 'mm'],
];

function canonical(text: string): string {
  let out = normaliseFigure(text).replace(/×/g, 'x');
  for (const [pattern, unit] of UNIT_SPELLINGS) out = out.replace(pattern, unit);
  return out;
}

const LIST_SEPARATOR = /หรือ|และ|or|and|\//;

/**
 * The parts of a figure that a source has to state. A range ("0–50 °C") is one
 * claim and stays whole. A list of alternatives ("203 หรือ 300 dpi") is one
 * claim per number, each carrying the shared unit.
 */
export function figureParts(figure: string): string[] {
  const text = normaliseFigure(figure);
  const match = new RegExp(`^((?:${NUM})(?:(?:${LIST_SEPARATOR.source})(?:${NUM}))+)(.*)$`).exec(text);
  if (!match) return [canonical(figure)];
  const unit = match[2] ?? '';
  return (match[1] ?? '').split(LIST_SEPARATOR).map((n) => canonical(n + unit));
}

/**
 * Does the source quote state this figure? Every part must appear in the
 * quote, and not as the tail of a longer number: "300 dpi" is not covered by
 * "1300 dpi", nor "5 mm" by "2.5 mm".
 */
export function quoteCovers(figure: string, quote: string): boolean {
  const source = canonical(quote);
  return figureParts(figure).every((part) => {
    for (let at = source.indexOf(part); at !== -1; at = source.indexOf(part, at + 1)) {
      const before = source[at - 1] ?? '';
      const after = source[at + part.length] ?? '';
      const startsClean = !/[\d.,]/.test(before) || !/^\d/.test(part);
      const endsClean = !(/\d$/.test(part) && /\d/.test(after)) && !(/[a-z]$/.test(part) && /[a-z]/.test(after));
      if (startsClean && endsClean) return true;
    }
    return false;
  });
}
