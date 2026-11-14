import { statusConfig, type StatusConfig } from '../config/status';
import { SITE } from '../config/site';
import type { EnquiryFields } from '../rules/enquiry';
import { enquiryBackend, toStoredEnquiry, type EnquiryBackend, type EnquiryReceipt } from './enquiry-backend';

/**
 * The store boundary. Every write in the application goes through here.
 *
 * A write is attempted only when BOTH hold: the status config says the
 * enquiry feature is live, and a backend is registered. Otherwise it is
 * REFUSED and says so. The UI renders the message it gets and never shows a
 * success it did not receive. There is no fallback that pretends: no local
 * queue, no fake id. A backend that answers without a reference, or throws,
 * is a failure, not a success.
 */
export type StoreStatus = 'not_connected' | 'invalid' | 'failed';

export type StoreResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: StoreStatus; message: string };

export type { EnquiryReceipt } from './enquiry-backend';

export const NOT_CONNECTED_MESSAGE =
  `ยังไม่ได้ส่งคำขอนี้ — ระบบรับคำขอยังไม่เชื่อมต่อ ข้อมูลที่กรอกไม่ได้ถูกบันทึกหรือส่งไปที่ใด ` +
  `หากต้องการติดต่อ ACS ตอนนี้ กรุณาโทร ${SITE.phoneDisplay}`;

export const INVALID_MESSAGE =
  'ยังไม่ได้ส่งคำขอนี้ — ข้อมูลบางช่องยังไม่ครบหรือไม่ถูกต้อง กรุณาตรวจแล้วส่งอีกครั้ง';

export const FAILED_MESSAGE =
  `ส่งคำขอไม่สำเร็จ ข้อมูลยังไม่ถึง ACS กรุณาลองส่งอีกครั้ง หรือโทร ${SITE.phoneDisplay}`;

const newKey = () => globalThis.crypto.randomUUID();

export async function submitEnquiry(
  payload: EnquiryFields,
  config: StatusConfig = statusConfig,
  backend: EnquiryBackend | null = enquiryBackend,
  now: () => string = () => new Date().toISOString(),
  idempotencyKey: string = newKey(),
): Promise<StoreResult<EnquiryReceipt>> {
  // Both gates, every time. A backend alone does not open the door, and
  // neither does a config that says "live" with nothing behind it.
  if (config.features.enquiry !== 'live' || backend === null) {
    return { ok: false, status: 'not_connected', message: NOT_CONNECTED_MESSAGE };
  }
  const built = toStoredEnquiry(payload, now(), idempotencyKey);
  if (!built.ok) return { ok: false, status: 'invalid', message: INVALID_MESSAGE };
  try {
    const receipt = await backend.submit(built.enquiry);
    if (!receipt || typeof receipt.reference !== 'string' || !receipt.reference.trim()) {
      return { ok: false, status: 'failed', message: FAILED_MESSAGE };
    }
    return { ok: true, data: { reference: receipt.reference, createdAt: receipt.createdAt, ...(receipt.environment ? { environment: receipt.environment } : {}) } };
  } catch {
    // The reason stays out of the message and out of any log: it may carry what the visitor typed.
    return { ok: false, status: 'failed', message: FAILED_MESSAGE };
  }
}
