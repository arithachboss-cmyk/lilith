import type { EnquiryBackend, EnquiryReceipt, StoredEnquiry } from '../../../src/data/enquiry-backend';
import type { EnquiryStore } from '../../../src/server/enquiry-handler';

/**
 * A backend that lives only in tests. It exists to prove the store and the
 * contract, and is never imported by anything under src/.
 */
export class MemoryBackend implements EnquiryBackend, EnquiryStore {
  readonly name = 'memory (tests only)';
  readonly stored = new Map<string, { enquiry: StoredEnquiry; receipt: EnquiryReceipt }>();
  calls = 0;

  /** The same thing seen from the server: a store saves what a backend submits. */
  save(enquiry: StoredEnquiry): Promise<EnquiryReceipt> {
    return this.submit(enquiry);
  }

  async submit(enquiry: StoredEnquiry): Promise<EnquiryReceipt> {
    this.calls += 1;
    const existing = this.stored.get(enquiry.idempotencyKey);
    if (existing) return existing.receipt;
    const receipt = { reference: `T-${String(this.stored.size + 1).padStart(4, '0')}`, createdAt: enquiry.consent.givenAt };
    this.stored.set(enquiry.idempotencyKey, { enquiry, receipt });
    return receipt;
  }
}
