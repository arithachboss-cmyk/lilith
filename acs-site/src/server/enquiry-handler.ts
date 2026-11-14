import { toStoredEnquiry, type EnquiryReceipt, type StoredEnquiry } from '../data/enquiry-backend';
import { emptyEnquiry, type EnquiryFields } from '../rules/enquiry';

/**
 * The server side of an enquiry. It trusts nothing the browser sends: the
 * same rules run again here, and an enquiry without service consent is never
 * stored, whatever the client claimed.
 *
 * It is written against plain values so the same function can sit behind any
 * host. It logs nothing: not the body, not an error, not an address.
 */
export const MAX_BODY_BYTES = 32 * 1024;

export interface EnquiryStore {
  /** Must return the first receipt again when the same key is saved twice. */
  save(enquiry: StoredEnquiry): Promise<EnquiryReceipt>;
}

export interface HandlerRequest {
  method: string;
  /** Lower-case header names. */
  headers: Record<string, string | undefined>;
  body: string;
  /** Who is asking, for rate limiting only. Never stored. */
  client: string;
}

export interface HandlerResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
}

export interface HandlerDeps {
  store: EnquiryStore;
  /** The one origin whose pages may post here. */
  allowedOrigin: string;
  environment: 'preview' | 'production';
  now: () => string;
  limiter: RateLimiter;
}

/** At most `limit` requests per client in any window of `windowMs`. */
export class RateLimiter {
  readonly #seen = new Map<string, number[]>();
  constructor(readonly limit: number, readonly windowMs: number, readonly clock: () => number = Date.now) {}

  allow(client: string): boolean {
    const now = this.clock();
    const recent = (this.#seen.get(client) ?? []).filter((t) => now - t < this.windowMs);
    if (recent.length >= this.limit) {
      this.#seen.set(client, recent);
      return false;
    }
    recent.push(now);
    this.#seen.set(client, recent);
    return true;
  }
}

const json = (status: number, payload: unknown, extra: Record<string, string> = {}): HandlerResponse => ({
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extra },
  body: JSON.stringify(payload),
});

const refuse = (status: number, code: string, extra: Record<string, string> = {}) => json(status, { ok: false, code }, extra);

/** Only the fields the form has, each of the type it must be. Anything else in the body is dropped. */
function readFields(value: unknown): EnquiryFields | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  const out = emptyEnquiry();
  const strings = ['name', 'phone', 'company', 'email', 'industry', 'businessScale', 'country', 'message'] as const;
  for (const key of strings) {
    if (typeof raw[key] !== 'string') return null;
    out[key] = raw[key];
  }
  for (const key of ['interests', 'items'] as const) {
    const list = raw[key];
    if (!Array.isArray(list) || list.length > 50 || list.some((x) => typeof x !== 'string')) return null;
    out[key] = [...(list as string[])];
  }
  // Consent must be the boolean true. "true", 1 or a missing key is not consent.
  out.serviceConsent = raw.serviceConsent === true;
  out.marketingConsent = raw.marketingConsent === true;
  return out;
}

export async function handleEnquiry(request: HandlerRequest, deps: HandlerDeps): Promise<HandlerResponse> {
  if (request.method !== 'POST') return refuse(405, 'method_not_allowed', { allow: 'POST' });
  // A page on another site must not be able to post here on a visitor's behalf.
  if (request.headers.origin !== deps.allowedOrigin) return refuse(403, 'origin_not_allowed');
  if (!/^application\/json\b/i.test(request.headers['content-type'] ?? '')) return refuse(415, 'json_only');
  if (new TextEncoder().encode(request.body).length > MAX_BODY_BYTES) return refuse(413, 'too_large');
  if (!deps.limiter.allow(request.client)) return refuse(429, 'too_many', { 'retry-after': String(Math.ceil(deps.limiter.windowMs / 1000)) });

  const key = request.headers['idempotency-key'] ?? '';
  if (!/^[A-Za-z0-9-]{16,64}$/.test(key)) return refuse(400, 'idempotency_key_required');

  let parsed: unknown;
  try {
    parsed = JSON.parse(request.body);
  } catch {
    return refuse(400, 'not_json');
  }
  const fields = readFields(parsed);
  if (!fields) return refuse(400, 'wrong_shape');

  const built = toStoredEnquiry(fields, deps.now(), key);
  // The answer names the fields that failed, never what was typed into them.
  if (!built.ok) return json(422, { ok: false, code: 'invalid', fields: Object.keys(built.errors).sort() });

  try {
    const receipt = await deps.store.save(built.enquiry);
    if (!receipt?.reference) return refuse(503, 'not_stored');
    return json(201, { ok: true, reference: receipt.reference, createdAt: receipt.createdAt, environment: deps.environment });
  } catch {
    return refuse(503, 'not_stored');
  }
}
