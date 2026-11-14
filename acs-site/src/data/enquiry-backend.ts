import { consentWordingVersion, validateEnquiry, type EnquiryFields, type Errors } from '../rules/enquiry';

/**
 * The contract a real enquiry backend has to meet, and what it is handed.
 *
 * No backend is registered. This file is the shape one must have; the store
 * (data/store.ts) decides whether to call it. A backend earns its place by
 * passing the contract in tests/unit/enquiry-backend.test.ts, not by being
 * written.
 */
export interface ConsentRecord {
  /** Always true: an enquiry without service consent is never built. */
  service: true;
  /** Exactly what the visitor chose. Never defaulted. */
  marketing: boolean;
  /** Identifies the consent wording the visitor was shown. */
  wordingVersion: string;
  givenAt: string;
}

export interface StoredEnquiry {
  /** The same key sent twice must create one enquiry, not two. */
  idempotencyKey: string;
  contact: { name: string; phone: string; company: string; email: string };
  details: { industry: string; businessScale: string; country: string; interests: string[]; message: string; items: string[] };
  consent: ConsentRecord;
}

export interface EnquiryReceipt {
  reference: string;
  createdAt: string;
}

export interface EnquiryBackend {
  readonly name: string;
  submit(enquiry: StoredEnquiry): Promise<EnquiryReceipt>;
}

export type BuildResult = { ok: true; enquiry: StoredEnquiry } | { ok: false; errors: Errors };

/** Turns what the form holds into what may be stored. Invalid input builds nothing. */
export function toStoredEnquiry(fields: EnquiryFields, givenAt: string, idempotencyKey: string): BuildResult {
  const errors = validateEnquiry(fields);
  if (Object.keys(errors).length > 0 || fields.serviceConsent !== true) {
    return { ok: false, errors };
  }
  return {
    ok: true,
    enquiry: {
      idempotencyKey,
      contact: { name: fields.name.trim(), phone: fields.phone.trim(), company: fields.company.trim(), email: fields.email.trim() },
      details: {
        industry: fields.industry, businessScale: fields.businessScale, country: fields.country,
        interests: [...fields.interests], message: fields.message, items: [...fields.items],
      },
      consent: { service: true, marketing: fields.marketingConsent === true, wordingVersion: consentWordingVersion(), givenAt },
    },
  };
}

/**
 * The backend the site uses. `null` means none exists, and the store refuses
 * every write. Where enquiries go is the Owner's decision; it is not made here.
 */
export const enquiryBackend: EnquiryBackend | null = null;
