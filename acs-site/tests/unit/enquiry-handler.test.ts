import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { enquirySliceConfig, ENQUIRY_ENDPOINT, shippedConfig, statusConfig } from '../../src/config/status';
import { enquiryBackend, type StoredEnquiry } from '../../src/data/enquiry-backend';
import { HttpEnquiryBackend } from '../../src/data/http-backend';
import { FAILED_MESSAGE, submitEnquiry } from '../../src/data/store';
import { launchReadiness } from '../../src/build/launch';
import { enquiryPage, statusPage } from '../../src/render/pages';
import { consentWordingVersion, emptyEnquiry, type EnquiryFields } from '../../src/rules/enquiry';
import {
  handleEnquiry, MAX_BODY_BYTES, RateLimiter, type EnquiryStore, type HandlerDeps, type HandlerRequest,
} from '../../src/server/enquiry-handler';
import { FileEnquiryStore } from '../../src/server/file-store';
import { MemoryBackend } from './support/memory-backend';

const ORIGIN = 'https://www.asiancoding.com';
const KEY = 'a1b2c3d4-e5f6-7890-abcd-ef0123456789';
const now = () => '2026-11-14T04:00:00.000Z';
const body = (over: Record<string, unknown> = {}) => JSON.stringify({
  ...emptyEnquiry(), name: 'สมชาย ทดสอบ', phone: '081-555-0142', company: 'บริษัท ทดสอบ จำกัด', email: 'check@example.com',
  industry: 'retail', businessScale: 'single_site', country: 'TH', interests: ['scanners'], message: 'ข้อความลับเฉพาะ',
  serviceConsent: true, marketingConsent: false, items: ['te200'], ...over,
});
const request = (over: Partial<HandlerRequest> = {}, headers: Record<string, string | undefined> = {}): HandlerRequest => ({
  method: 'POST', body: body(), client: '203.0.113.7',
  headers: { origin: ORIGIN, 'content-type': 'application/json', 'idempotency-key': KEY, ...headers }, ...over,
});
const deps = (store: EnquiryStore = new MemoryBackend(), over: Partial<HandlerDeps> = {}): HandlerDeps => ({
  store: { save: (e: StoredEnquiry) => store.save(e) }, allowedOrigin: ORIGIN, environment: 'preview', now,
  limiter: new RateLimiter(100, 60_000), ...over,
});
const dirs: string[] = [];
const tempStore = () => {
  const dir = mkdtempSync(join(tmpdir(), 'acs-enq-'));
  dirs.push(dir);
  return new FileEnquiryStore(dir);
};

afterEach(() => {
  vi.restoreAllMocks();
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('the enquiry endpoint', () => {
  it('stores a valid enquiry and answers 201 with a reference and its environment', async () => {
    const store = new MemoryBackend();
    const out = await handleEnquiry(request(), deps(store));
    expect(out.status).toBe(201);
    expect(JSON.parse(out.body)).toEqual({ ok: true, reference: 'T-0001', createdAt: now(), environment: 'preview' });
    expect(out.headers['cache-control']).toBe('no-store');
    expect(store.stored.get(KEY)?.enquiry.consent).toEqual({ service: true, marketing: false, wordingVersion: consentWordingVersion(), givenAt: now() });
  });

  it('builds the consent record itself and ignores one the client sends', async () => {
    const store = new MemoryBackend();
    await handleEnquiry(request({ body: body({ consent: { service: true, marketing: true, givenAt: '1999-01-01' }, marketingConsent: false }) }), deps(store));
    expect(store.stored.get(KEY)?.enquiry.consent.marketing).toBe(false);
    expect(store.stored.get(KEY)?.enquiry.consent.givenAt).toBe(now());
  });

  it('never stores an enquiry without real service consent', async () => {
    const store = new MemoryBackend();
    for (const consent of [false, 'true', 1, null, undefined]) {
      const out = await handleEnquiry(request({ body: body({ serviceConsent: consent }) }), deps(store));
      expect(out.status).toBe(422);
      expect(JSON.parse(out.body)).toEqual({ ok: false, code: 'invalid', fields: ['serviceConsent'] });
    }
    expect(store.calls).toBe(0);
  });

  it('checks every field again and names the bad ones without echoing what was typed', async () => {
    const out = await handleEnquiry(request({ body: body({ email: 'secret-not-an-email', interests: [], phone: 'xx' }) }), deps());
    expect(out.status).toBe(422);
    expect(JSON.parse(out.body).fields).toEqual(['email', 'interests', 'phone']);
    expect(out.body).not.toContain('secret');
  });

  it('drops fields the form does not have', async () => {
    const store = new MemoryBackend();
    await handleEnquiry(request({ body: body({ isAdmin: true, reference: 'FAKE-1', price: 1 }) }), deps(store));
    const stored = JSON.stringify(store.stored.get(KEY)?.enquiry);
    expect(stored).not.toMatch(/isAdmin|FAKE-1|price/);
  });

  it.each([
    ['a GET', request({ method: 'GET' }), 405, 'method_not_allowed'],
    ['another site', request({}, { origin: 'https://evil.example' }), 403, 'origin_not_allowed'],
    ['no origin', request({}, { origin: undefined }), 403, 'origin_not_allowed'],
    ['a form post', request({}, { 'content-type': 'application/x-www-form-urlencoded' }), 415, 'json_only'],
    ['an oversized body', request({ body: body({ message: 'ก'.repeat(MAX_BODY_BYTES) }) }), 413, 'too_large'],
    ['no idempotency key', request({}, { 'idempotency-key': undefined }), 400, 'idempotency_key_required'],
    ['a short key', request({}, { 'idempotency-key': 'abc' }), 400, 'idempotency_key_required'],
    ['broken JSON', request({ body: '{"name":' }), 400, 'not_json'],
    ['an array', request({ body: '[]' }), 400, 'wrong_shape'],
    ['a number where text belongs', request({ body: body({ name: 42 }) }), 400, 'wrong_shape'],
    ['interests that are not a list', request({ body: body({ interests: 'scanners' }) }), 400, 'wrong_shape'],
  ])('refuses %s', async (_label, req, status, code) => {
    const store = new MemoryBackend();
    const out = await handleEnquiry(req, deps(store));
    expect([out.status, JSON.parse(out.body).code]).toEqual([status, code]);
    expect(store.calls).toBe(0);
  });

  it('answers the same receipt when the same key arrives twice', async () => {
    const store = tempStore();
    const first = await handleEnquiry(request(), deps(store));
    const second = await handleEnquiry(request(), deps(store));
    expect(JSON.parse(second.body).reference).toBe(JSON.parse(first.body).reference);
    expect(store.all()).toHaveLength(1);
  });

  it('limits how often one client may post, and says when to retry', async () => {
    let t = 0;
    const limiter = new RateLimiter(2, 60_000, () => t);
    const d = deps(new MemoryBackend(), { limiter });
    const statuses = [];
    for (let i = 0; i < 3; i += 1) statuses.push((await handleEnquiry(request({}, { 'idempotency-key': `${KEY.slice(0, -1)}${i}` }), d)).status);
    expect(statuses).toEqual([201, 201, 429]);
    const blocked = await handleEnquiry(request(), d);
    expect(blocked.headers['retry-after']).toBe('60');
    expect((await handleEnquiry(request({ client: '198.51.100.9' }), d)).status).toBe(201);
    t = 60_001;
    expect((await handleEnquiry(request({}, { 'idempotency-key': `${KEY.slice(0, -1)}z` }), d)).status).toBe(201);
  });

  it('answers 503 when the store fails or returns nothing, never 201', async () => {
    const failing: EnquiryStore = { save: async () => { throw new Error('disk full: check@example.com'); } };
    const empty = { save: async () => ({ reference: '', createdAt: now() }) } as EnquiryStore;
    for (const store of [failing, empty]) {
      const out = await handleEnquiry(request(), deps(store));
      expect([out.status, JSON.parse(out.body)]).toEqual([503, { ok: false, code: 'not_stored' }]);
    }
  });

  it('logs nothing at all, whatever happens', async () => {
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((level) => vi.spyOn(console, level).mockImplementation(() => {}));
    await handleEnquiry(request(), deps());
    await handleEnquiry(request({ body: 'nope' }), deps());
    await handleEnquiry(request(), deps({ save: async () => { throw new Error('x'); } }));
    for (const spy of spies) expect(spy).not.toHaveBeenCalled();
  });
});

describe('the preview file store', () => {
  it('writes one line per enquiry with the receipt beside it, readable only by its owner', async () => {
    const store = tempStore();
    await handleEnquiry(request(), deps(store));
    const lines = readFileSync(store.file, 'utf8').trim().split('\n');
    expect(lines).toHaveLength(1);
    const row = JSON.parse(lines[0]!);
    expect(row.receipt.reference).toMatch(/^ENQ-20261114-[0-9A-F]{8}$/);
    expect(Object.keys(row.enquiry).sort()).toEqual(['consent', 'contact', 'details', 'idempotencyKey']);
  });
});

describe('the browser side', () => {
  const stored: StoredEnquiry = {
    idempotencyKey: KEY,
    contact: { name: 'สมชาย', phone: '081-555-0142', company: 'ทดสอบ', email: 'check@example.com' },
    details: { industry: 'retail', businessScale: 'single_site', country: 'TH', interests: ['scanners'], message: '', items: [] },
    consent: { service: true, marketing: false, wordingVersion: 'c-00000000', givenAt: now() },
  };
  const answering = (status: number, payload: unknown) => (async () => new Response(JSON.stringify(payload), { status })) as unknown as typeof fetch;

  it('posts JSON with the key, no cookies, and sends the choices rather than a consent record', async () => {
    const calls: Array<[string, RequestInit]> = [];
    const send = (async (url: string, init: RequestInit) => { calls.push([url, init]); return new Response(JSON.stringify({ ok: true, reference: 'ENQ-1', createdAt: now(), environment: 'preview' }), { status: 201 }); }) as unknown as typeof fetch;
    const receipt = await new HttpEnquiryBackend('/api/enquiries', 1000, send).submit(stored);
    expect(receipt).toEqual({ reference: 'ENQ-1', createdAt: now(), environment: 'preview' });
    const [url, init] = calls[0]!;
    expect(url).toBe('/api/enquiries');
    expect(init.method).toBe('POST');
    expect(init.credentials).toBe('omit');
    expect((init.headers as Record<string, string>)['idempotency-key']).toBe(KEY);
    const sent = JSON.parse(init.body as string);
    expect(sent).toMatchObject({ name: 'สมชาย', serviceConsent: true, marketingConsent: false });
    expect(sent).not.toHaveProperty('consent');
    expect(url).not.toMatch(/สมชาย|example/);
  });

  it.each([
    [422, { ok: false, code: 'invalid' }],
    [503, { ok: false, code: 'not_stored' }],
    [200, { ok: true, reference: 'ENQ-1', createdAt: 'x' }],
    [201, { ok: true, reference: ' ', createdAt: 'x' }],
    [201, { ok: false, reference: 'ENQ-1', createdAt: 'x' }],
    [201, {}],
  ])('treats a %i answer of %j as a failure, never a success', async (status, payload) => {
    const backend = new HttpEnquiryBackend('/api/enquiries', 1000, answering(status, payload));
    await expect(backend.submit(stored)).rejects.toThrow();
    const out = await submitEnquiry({ ...emptyEnquiry(), ...filledFields() }, enquirySliceConfig(), backend, now, KEY);
    expect(out).toEqual({ ok: false, status: 'failed', message: FAILED_MESSAGE });
  });

  it('reports a network failure as a failure', async () => {
    const backend = new HttpEnquiryBackend('/api/enquiries', 1000, (async () => { throw new TypeError('network down'); }) as unknown as typeof fetch);
    expect(await submitEnquiry(filledFields(), enquirySliceConfig(), backend, now, KEY)).toEqual({ ok: false, status: 'failed', message: FAILED_MESSAGE });
  });

  it('runs browser to store through the real handler and back', async () => {
    const store = tempStore();
    const send = (async (_url: string, init: RequestInit) => {
      const out = await handleEnquiry({ method: init.method!, body: init.body as string, client: 'c', headers: { ...(init.headers as Record<string, string>), origin: ORIGIN } }, deps(store));
      return new Response(out.body, { status: out.status, headers: out.headers });
    }) as unknown as typeof fetch;
    const out = await submitEnquiry(filledFields(), enquirySliceConfig(), new HttpEnquiryBackend('/api/enquiries', 1000, send), now, KEY);
    expect(out.ok && out.data.environment).toBe('preview');
    expect(store.all()).toHaveLength(1);
    expect(out.ok && store.all()[0]?.receipt.reference).toBe(out.ok && out.data.reference);
  });
});

function filledFields(): EnquiryFields {
  return JSON.parse(body()) as EnquiryFields;
}

describe('the slice never becomes the shipped site', () => {
  it('ships with no endpoint, no backend, and the enquiry feature still demo', () => {
    expect(ENQUIRY_ENDPOINT).toBeNull();
    expect(enquiryBackend).toBeNull();
    expect(statusConfig).toBe(shippedConfig);
    expect(shippedConfig.features.enquiry).toBe('demo');
    expect(shippedConfig.enquiryEnvironment).toBeUndefined();
  });

  it('keeps the slice in demo, closed to crawlers, and marked as a test', () => {
    const slice = enquirySliceConfig();
    expect(slice.system).toBe('demo');
    expect(slice.enquiryEnvironment).toBe('preview');
    const page = enquiryPage(slice);
    expect(page).toContain('data-enquiry-environment="preview"');
    expect(page).toContain('คำขอยังไม่ถึงทีมขาย ACS');
    expect(page).toContain('noindex');
    expect(enquiryPage(shippedConfig)).not.toContain('data-enquiry-environment');
    expect(enquiryPage(shippedConfig)).toContain('ยังไม่ส่งและไม่บันทึกข้อมูลไปที่ใด');
  });

  it('does not call a test store a destination', () => {
    const slice = enquirySliceConfig();
    expect(launchReadiness(slice).find((r) => r.key === 'enquiry')).toMatchObject({ ready: false, detail: 'เชื่อมกับที่เก็บทดสอบเท่านั้น ยังไม่ถึงทีมขาย ACS' });
    expect(statusPage(slice)).toContain('ส่งไปยังที่เก็บทดสอบเท่านั้น ยังไม่ถึงทีมขาย ACS');
  });
});
