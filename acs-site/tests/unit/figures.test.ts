import { describe, expect, it } from 'vitest';
import { figureParts, quoteCovers } from '../../src/rules/figures';
import { products } from '../../src/data/catalog';
import { extractFigures, hasSpecFigure, normaliseFigure } from '../../src/rules/figures';

describe('spec figure detection', () => {
  // Every feature line in the live catalogue that states a measured figure.
  // These are regression cases taken from the data, not a formula.
  const expected: Record<string, string[]> = {
    '1950g': ['มาตรฐานการป้องกัน IP52', 'ช่วงอุณหภูมิใช้งาน 0–50 °C'],
    '1960g': ['มาตรฐานการป้องกัน IP52'],
    m510: ['พิมพ์แบบ Thermal Transfer ความละเอียด 300 dpi', 'รองรับฉลากกว้างสูงสุด 1.5 นิ้ว (38.1 มม.)'],
    zd421: ['ความละเอียด 203 หรือ 300 dpi ตามรุ่นย่อย'],
    ds2208: ['เซนเซอร์ภาพ 640 × 480 พิกเซล'],
  };

  it('flags exactly the figure-bearing lines of the live catalogue', () => {
    const found: Record<string, string[]> = {};
    for (const p of products) {
      const lines = p.features.filter(hasSpecFigure);
      if (lines.length) found[p.id] = lines;
    }
    expect(found).toEqual(expected);
  });

  it('finds 7 figure lines across 5 products', () => {
    const lines = products.flatMap((p) => p.features.filter(hasSpecFigure));
    expect(lines).toHaveLength(7);
    expect(products.filter((p) => p.features.some(hasSpecFigure))).toHaveLength(5);
  });

  it.each([
    ['อ่านบาร์โค้ด 1D/2D'],
    ['เชื่อมต่อแบบมีสาย; USB, RS-232, RS-485 และ Keyboard Wedge ตามชุดอุปกรณ์'],
    ['ZT400 series industrial printer'],
    ['TC22 / TC27 handheld mobile computer family'],
    ['เครื่องสแกนแบบมีสาย (DS2208); ไม่ใช่รุ่นไร้สาย DS2278'],
    ['อ่านบาร์โค้ด 1D และ 2D'],
    ['TE series desktop printer'],
  ])('does not treat a model or interface name as a figure: %s', (line) => {
    expect(extractFigures(line)).toEqual([]);
  });

  it('extracts the figure text itself', () => {
    expect(extractFigures('มาตรฐานการป้องกัน IP52')).toEqual(['IP52']);
    expect(extractFigures('ช่วงอุณหภูมิใช้งาน 0–50 °C')).toEqual(['0–50 °C']);
    expect(extractFigures('เซนเซอร์ภาพ 640 × 480 พิกเซล')).toEqual(['640 × 480 พิกเซล']);
    expect(extractFigures('รองรับฉลากกว้างสูงสุด 1.5 นิ้ว (38.1 มม.)')).toEqual(['1.5 นิ้ว', '38.1 มม.']);
    expect(extractFigures('ความละเอียด 203 หรือ 300 dpi ตามรุ่นย่อย')).toEqual(['203 หรือ 300 dpi']);
  });

  it('matches Thai units, which an ASCII word boundary would miss', () => {
    expect(hasSpecFigure('อ่านได้ไกล 10 เมตร')).toBe(true);
    expect(hasSpecFigure('หนัก 250 กรัม')).toBe(true);
    expect(hasSpecFigure('กว้าง 104 มม.')).toBe(true);
  });

  it('does not read a model number ending in a unit letter as a figure', () => {
    expect(extractFigures('Xenon XP 1950g')).toEqual([]);
    expect(extractFigures('เทียบกับ Xenon Ultra 1960g')).toEqual([]);
    for (const p of products) expect(extractFigures(p.name)).toEqual([]);
  });

  it('still reads the same digits as a figure when they are written as a weight', () => {
    expect(extractFigures('น้ำหนัก 1950 g')).toEqual(['1950 g']);
    expect(extractFigures('หนัก 250g')).toEqual(['250g']);
    // With no catalogue to consult, the rule falls back to the cautious reading.
    expect(extractFigures('Xenon XP 1950g', new Set())).toEqual(['1950g']);
  });

  it('normalises dashes and spacing', () => {
    expect(normaliseFigure('0–50 °C')).toBe(normaliseFigure('0-50°C'));
  });
});

describe('does a source quote state a figure?', () => {
  it('accepts the same number and unit whatever the spacing or dash', () => {
    expect(quoteCovers('IP52', 'IP Rating : IP52')).toBe(true);
    expect(quoteCovers('0–50 °C', 'Operating Temperature : 0 - 50 °C|32 - 122 °F')).toBe(true);
  });

  it('accepts a unit spelled in Thai against the same unit in English', () => {
    expect(quoteCovers('640 × 480 พิกเซล', 'IMAGE SENSOR: 640X480 PIXELS')).toBe(true);
    expect(quoteCovers('1.5 นิ้ว', 'Maximum label width 1.5 in. (38.1 mm)')).toBe(true);
    expect(quoteCovers('38.1 มม.', 'Maximum label width 1.5 in. (38.1 mm)')).toBe(true);
  });

  it('never converts between units', () => {
    expect(quoteCovers('1.5 นิ้ว', 'Maximum label width 38.1 mm')).toBe(false);
    expect(quoteCovers('38.1 มม.', 'Maximum label width 1.5 in')).toBe(false);
    expect(quoteCovers('640 × 480 พิกเซล', '640 x 480 mm')).toBe(false);
  });

  it('needs every alternative in a list, each with the unit', () => {
    expect(figureParts('203 หรือ 300 dpi')).toEqual(['203dpi', '300dpi']);
    expect(quoteCovers('203 หรือ 300 dpi', 'Print Resolution 203 dpi (8 dot/mm)|300 dpi (12 dot/mm)')).toBe(true);
    expect(quoteCovers('203 หรือ 300 dpi', 'Print Resolution 203 dpi (8 dot/mm)')).toBe(false);
    expect(quoteCovers('203 หรือ 300 dpi', 'Print Resolution 203 or 300')).toBe(false);
    expect(quoteCovers('203 หรือ 300 dpi', '203 dpi, optional 600 dpi')).toBe(false);
  });

  it('keeps a range whole: both ends, as a range', () => {
    expect(figureParts('0–50 °C')).toEqual(['0-50°c']);
    expect(quoteCovers('0–50 °C', 'Operating Temperature 0 °C minimum')).toBe(false);
    expect(quoteCovers('0–50 °C', 'Operating Temperature : 0 - 40 °C')).toBe(false);
    expect(quoteCovers('0–50 °C', 'Operating Temperature : -10 - 50 °C')).toBe(false);
  });

  it('is not fooled by a longer number that ends the same way', () => {
    expect(quoteCovers('300 dpi', 'up to 1300 dpi')).toBe(false);
    expect(quoteCovers('5 mm', 'thickness 2.5 mm')).toBe(false);
    expect(quoteCovers('IP52', 'IP520 series')).toBe(false);
    expect(quoteCovers('640 × 480 พิกเซล', '1640x480 pixels')).toBe(false);
    expect(quoteCovers('640 × 480 พิกเซล', '640x4800 pixels')).toBe(false);
  });

  it('refuses a different value', () => {
    expect(quoteCovers('IP52', 'IP Rating : IP41')).toBe(false);
    expect(quoteCovers('640 × 480 พิกเซล', 'IMAGE SENSOR: 1280X800 PIXELS')).toBe(false);
    expect(quoteCovers('300 dpi', '')).toBe(false);
  });
});
