import { randomUUID } from 'node:crypto';
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { EnquiryReceipt, StoredEnquiry } from '../data/enquiry-backend';
import type { EnquiryStore } from './enquiry-handler';

/**
 * A store for the preview environment only: one JSON line per enquiry in a
 * folder on the test machine. It holds whatever a tester types, so the folder
 * is never inside the published site and never committed. It is not a
 * production store: no backup, no access control, one process at a time.
 */
export class FileEnquiryStore implements EnquiryStore {
  readonly file: string;

  constructor(directory: string) {
    mkdirSync(directory, { recursive: true });
    this.file = join(directory, 'enquiries.jsonl');
  }

  all(): Array<{ receipt: EnquiryReceipt; enquiry: StoredEnquiry }> {
    if (!existsSync(this.file)) return [];
    return readFileSync(this.file, 'utf8').split('\n').filter(Boolean).map((line) => JSON.parse(line));
  }

  async save(enquiry: StoredEnquiry): Promise<EnquiryReceipt> {
    const existing = this.all().find((row) => row.enquiry.idempotencyKey === enquiry.idempotencyKey);
    if (existing) return existing.receipt;
    const day = enquiry.consent.givenAt.slice(0, 10).replace(/-/g, '');
    const receipt = { reference: `ENQ-${day}-${randomUUID().slice(0, 8).toUpperCase()}`, createdAt: enquiry.consent.givenAt };
    appendFileSync(this.file, `${JSON.stringify({ receipt, enquiry })}\n`, { mode: 0o600 });
    return receipt;
  }
}
