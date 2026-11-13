import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { statusConfig, type StatusConfig } from '../../src/config/status';
import { ABOUT_APPROVAL, ABOUT_MARKDOWN, parseAbout } from '../../src/content/about';
import { aboutPage } from '../../src/render/pages';
import { extractJsonLd, forbiddenKeysIn } from '../../src/render/structured';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const packageDir = join(repo, 'acs-seo', 'packages', 'about-acs');
const live: StatusConfig = { system: 'live', features: { ...statusConfig.features, company: 'live' } };
const text = (html: string) => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

describe('the about page copy', () => {
  it('is the governed package draft, character for character', () => {
    expect(ABOUT_MARKDOWN).toBe(readFileSync(join(packageDir, 'draft-v3-evidenced.md'), 'utf8'));
  });

  it('names who approved it, when, and the evidence behind its two claims', () => {
    expect(ABOUT_APPROVAL.approvedBy).toBe('ACS Owner');
    expect(ABOUT_APPROVAL.approvedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    for (const file of ['claim-evidence-cr10.json', 'claim-evidence-cr06.json']) {
      const record = JSON.parse(readFileSync(join(packageDir, 'publish', file), 'utf8')) as { verdict: string };
      expect(existsSync(join(packageDir, 'publish', file))).toBe(true);
      expect(record.verdict).toBe('CLEARED');
    }
  });

  it('renders every sentence of the draft and adds none', () => {
    const about = parseAbout();
    const main = /<article[^>]*>([\s\S]*?)<p class="actions">/.exec(aboutPage(live))?.[1] ?? '';
    const expected = ABOUT_MARKDOWN.replace(/^# /, '').replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
    expect(text(main)).toBe(expected);
    expect(about.heading).toBe('อยู่ข้างหน้างานจริงตั้งแต่ปี 1994');
    expect(about.paragraphs).toHaveLength(8);
  });

  it('keeps the two pledges emphasised', () => {
    expect(aboutPage(live)).toContain('<strong>ซื่อสัตย์</strong>');
    expect(aboutPage(live)).toContain('<strong>มั่นคง</strong>');
  });

  it('escapes anything the draft might contain', () => {
    expect(parseAbout('# A <b>\n\nx <script>alert(1)</script> **y**').paragraphs).toEqual([
      'x &lt;script&gt;alert(1)&lt;/script&gt; <strong>y</strong>',
    ]);
  });

  it('refuses Markdown it cannot render faithfully', () => {
    expect(() => parseAbout('no heading')).toThrow();
    expect(() => parseAbout('# T\n\n- a list')).toThrow();
    expect(() => parseAbout('# T\n\n## second heading')).toThrow();
  });

  it('describes the company in structured data with the evidenced founding year only', () => {
    const blocks = extractJsonLd(aboutPage(live));
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({ '@type': 'Organization', name: 'Asian Coding Systems', foundingDate: '1994' });
    expect(forbiddenKeysIn(blocks)).toEqual([]);
    expect(Object.keys(blocks[0]!).sort()).toEqual(['@context', '@type', 'email', 'foundingDate', 'name', 'telephone', 'url']);
  });

  it('does not name a customer', () => {
    expect(aboutPage(live)).not.toMatch(/7-Eleven|เซเว่น|CP ALL/i);
  });
});
