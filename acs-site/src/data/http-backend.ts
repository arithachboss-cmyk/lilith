import type { EnquiryBackend, EnquiryReceipt, StoredEnquiry } from './enquiry-backend';

/**
 * Sends an enquiry to the site's own endpoint. Anything other than a 201 with
 * a reference is thrown, so the store reports a failure and the visitor is
 * never told an enquiry arrived when it did not.
 */
export class HttpEnquiryBackend implements EnquiryBackend {
  readonly name: string;

  constructor(
    readonly endpoint: string,
    readonly timeoutMs = 15000,
    readonly send: typeof fetch = (...args) => fetch(...args),
  ) {
    this.name = `http ${endpoint}`;
  }

  async submit(enquiry: StoredEnquiry): Promise<EnquiryReceipt> {
    const { contact, details, consent, idempotencyKey } = enquiry;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.send(this.endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'idempotency-key': idempotencyKey },
        // The server builds its own consent record and timestamp; it is sent the choices, not a record to trust.
        body: JSON.stringify({ ...contact, ...details, serviceConsent: consent.service, marketingConsent: consent.marketing }),
        signal: controller.signal,
        credentials: 'omit',
        cache: 'no-store',
      });
      if (response.status !== 201) throw new Error(`enquiry endpoint answered ${response.status}`);
      const data = (await response.json()) as Partial<EnquiryReceipt> & { ok?: boolean };
      if (data.ok !== true || typeof data.reference !== 'string' || !data.reference.trim() || typeof data.createdAt !== 'string') {
        throw new Error('enquiry endpoint answered without a reference');
      }
      return { reference: data.reference, createdAt: data.createdAt, ...(data.environment ? { environment: data.environment } : {}) };
    } finally {
      clearTimeout(timer);
    }
  }
}
