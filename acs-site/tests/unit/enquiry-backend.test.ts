import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { statusConfig, type StatusConfig } from '../../src/config/status';
import { enquiryBackend, toStoredEnquiry, type EnquiryBackend } from '../../src/data/enquiry-backend';
import { FAILED_MESSAGE, INVALID_MESSAGE, NOT_CONNECTED_MESSAGE, submitEnquiry } from '../../src/data/store';
import {
  consentWordingVersion, emptyEnquiry, MARKETING_CONSENT_TEXT, SERVICE_CONSENT_TEXT, type EnquiryFields,
} from '../../src/rules/enquiry';
import { enquiryPage } from '../../src/render/pages';
import { MemoryBackend } from './support/memory-backend';

const live: StatusConfig = { system: 'live', features: { ...statusConfig.features, enquiry: 'live' } };
const now = () => '2026-11-14T03:00:00.000Z';
const filled = (over: Partial<EnquiryFields> = {}): EnquiryFields => ({
  ...emptyEnquiry(), name: 'สมชาย ทดสอบ', phone: '081-555-0142', company: 'บริษัท ทดสอบ จำกัด', email: 'check@example.com',
  industry: 'retail', businessScale: 'single_site', country: 'TH', interests: ['scanners'], message: 'ข้อความลับเฉพาะ',
  serviceConsent: true, marketingConsent: false, items: ['te200'], ...over,
});

afterEach(() => vi.restoreAllMocks());

describe('no backend is registered', () => {
  it('ships with none, so the site still refuses every enquiry', async () => {
    expect(enquiryBackend).toBeNull();
    expect(await submitEnquiry(filled(), live)).toEqual({ ok: false, status: 'not_connected', message: NOT_CONNECTED_MESSAGE });
  });

  it('keeps the test backend out of src/', () => {
    const src = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src');
    const files = (dir: string): string[] => readdirSync(dir).flatMap((name) => {
      const full = join(dir, name);
      return statSync(full).isDirectory() ? files(full) : [full];
    });
    for (const file of files(src).filter((f) => f.endsWith('.ts'))) {
      expect(readFileSync(file, 'utf8')).not.toMatch(/memory-backend|MemoryBackend/);
    }
  });
});

describe('the two gates of the store', () => {
  it('refuses when a backend exists but the config does not say live', async () => {
    const backend = new MemoryBackend();
    const out = await submitEnquiry(filled(), statusConfig, backend, now, 'k1');
    expect(out).toEqual({ ok: false, status: 'not_connected', message: NOT_CONNECTED_MESSAGE });
    expect(backend.calls).toBe(0);
  });

  it('refuses when the config says live but no backend exists', async () => {
    expect((await submitEnquiry(filled(), live, null, now, 'k1')).ok).toBe(false);
  });
});

describe('what a backend must do (the contract)', () => {
  it('returns a reference, and only then does the store report success', async () => {
    const backend = new MemoryBackend();
    const out = await submitEnquiry(filled(), live, backend, now, 'k1');
    expect(out).toEqual({ ok: true, data: { reference: 'T-0001', createdAt: now() } });
  });

  it('stores the consent exactly as given, with the wording version and the time', async () => {
    const backend = new MemoryBackend();
    await submitEnquiry(filled({ marketingConsent: false }), live, backend, now, 'k1');
    await submitEnquiry(filled({ marketingConsent: true }), live, backend, now, 'k2');
    expect(backend.stored.get('k1')?.enquiry.consent).toEqual({ service: true, marketing: false, wordingVersion: consentWordingVersion(), givenAt: now() });
    expect(backend.stored.get('k2')?.enquiry.consent.marketing).toBe(true);
  });

  it('creates one enquiry when the same key arrives twice', async () => {
    const backend = new MemoryBackend();
    const first = await submitEnquiry(filled(), live, backend, now, 'same');
    const second = await submitEnquiry(filled(), live, backend, now, 'same');
    expect(backend.stored.size).toBe(1);
    expect(second).toEqual(first);
  });

  it('is never handed an enquiry without service consent, or an invalid one', async () => {
    const backend = new MemoryBackend();
    for (const bad of [filled({ serviceConsent: false }), filled({ email: 'not-an-email' }), filled({ interests: [] }), emptyEnquiry()]) {
      expect(await submitEnquiry(bad, live, backend, now, 'k')).toEqual({ ok: false, status: 'invalid', message: INVALID_MESSAGE });
    }
    expect(backend.calls).toBe(0);
    expect(toStoredEnquiry(filled({ serviceConsent: false }), now(), 'k').ok).toBe(false);
  });

  it('carries the basket items and trims the contact fields', async () => {
    const backend = new MemoryBackend();
    await submitEnquiry(filled({ name: '  สมชาย ทดสอบ  ' }), live, backend, now, 'k1');
    const stored = backend.stored.get('k1')!.enquiry;
    expect(stored.contact.name).toBe('สมชาย ทดสอบ');
    expect(stored.details.items).toEqual(['te200']);
    expect(Object.keys(stored).sort()).toEqual(['consent', 'contact', 'details', 'idempotencyKey']);
  });
});

describe('a backend that fails', () => {
  const throwing: EnquiryBackend = { name: 'throws', submit: async () => { throw new Error('boom: check@example.com'); } };
  const empty: EnquiryBackend = { name: 'empty', submit: async () => ({ reference: '  ', createdAt: now() }) };
  const nothing = { name: 'nothing', submit: async () => undefined } as unknown as EnquiryBackend;

  it('is reported as a failure, never as success', async () => {
    for (const backend of [throwing, empty, nothing]) {
      const out = await submitEnquiry(filled(), live, backend, now, 'k');
      expect(out).toEqual({ ok: false, status: 'failed', message: FAILED_MESSAGE });
    }
  });

  it('leaks nothing the visitor typed into the message or the console', async () => {
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((level) => vi.spyOn(console, level).mockImplementation(() => {}));
    const out = await submitEnquiry(filled(), live, throwing, now, 'k');
    await submitEnquiry(filled(), live, new MemoryBackend(), now, 'k2');
    expect(JSON.stringify(out)).not.toMatch(/example\.com|สมชาย|081-555|ข้อความลับ|boom/);
    for (const spy of spies) expect(spy).not.toHaveBeenCalled();
  });

  it('tells the visitor the enquiry did not arrive and how to reach ACS', () => {
    expect(FAILED_MESSAGE).toContain('ไม่สำเร็จ');
    expect(FAILED_MESSAGE).toContain('02-203-0232');
    expect(FAILED_MESSAGE).not.toMatch(/บันทึกคำขอแล้ว|เลขอ้างอิง/);
  });
});

describe('consent wording', () => {
  it('is shown on the form exactly as it is versioned', () => {
    const html = enquiryPage();
    expect(html).toContain(SERVICE_CONSENT_TEXT);
    expect(html).toContain(MARKETING_CONSENT_TEXT);
    expect(consentWordingVersion()).toMatch(/^c-[0-9a-f]{8}$/);
  });

  it('keeps marketing consent separate and optional in its own words', () => {
    expect(MARKETING_CONSENT_TEXT).toContain('ไม่บังคับ');
    expect(SERVICE_CONSENT_TEXT).not.toContain('ข่าวสาร');
  });
});
