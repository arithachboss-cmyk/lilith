import { z } from "zod";
import {
  FeeBasis,
  FeeStatus,
  InvoiceStatus,
  PaymentMethod,
  PaymentStatus,
} from "./enums";
import {
  Currency,
  DocumentId,
  FeeId,
  InvoiceId,
  MediumText,
  OpaqueId,
  PositiveSatang,
  Satang,
  ShortText,
  Timestamp,
  Url,
  UserId,
} from "./primitives";
import { dto } from "./registry";

/**
 * The computed fee, as §18.8 shows it. Every number is produced by the fee
 * engine from a published rule; this contract defines no rate, basis or payer.
 */
export const FeeDTO = dto(
  "FeeDTO",
  z.object({
    id: FeeId,
    status: FeeStatus,
    transaction_value_amount: Satang,
    fee_basis: FeeBasis,
    fee_basis_amount: Satang,
    fee_rate_bp: z.int().min(0),
    fee_amount: Satang,
    vat_amount: Satang,
    total_amount: Satang,
    currency: Currency,
    payer: z.object({ user_id: UserId, display_name: z.string() }),
    rule: z.object({ code: z.string(), version: z.int().min(1) }),
    computed_at: Timestamp,
  }),
);
export type FeeDTO = z.infer<typeof FeeDTO>;

export const InvoiceDTO = dto(
  "InvoiceDTO",
  z.object({
    id: InvoiceId,
    invoice_number: z.string(),
    status: InvoiceStatus,
    due_at: Timestamp,
    pdf_url: Url,
  }),
);
export type InvoiceDTO = z.infer<typeof InvoiceDTO>;

// Derived from `payments` and `receipts` (§8.2.7).
export const PaymentDTO = dto(
  "PaymentDTO",
  z.object({
    id: OpaqueId,
    method: PaymentMethod,
    amount: PositiveSatang,
    paid_at: Timestamp,
    reference: z.string().nullable(),
    status: PaymentStatus,
  }),
);
export type PaymentDTO = z.infer<typeof PaymentDTO>;

export const ReceiptDTO = dto(
  "ReceiptDTO",
  z.object({
    id: OpaqueId,
    receipt_number: z.string(),
    issued_at: Timestamp,
  }),
);
export type ReceiptDTO = z.infer<typeof ReceiptDTO>;

// GET /api/deals/:id/fee
export const DealFeeResponse = dto(
  "DealFeeResponse",
  z.object({
    fee: FeeDTO,
    invoice: InvoiceDTO.nullable(),
    payments: z.array(PaymentDTO),
    receipt: ReceiptDTO.nullable(),
  }),
);
export type DealFeeResponse = z.infer<typeof DealFeeResponse>;

// POST /api/invoices/:id/payments
export const PaymentCreateBody = dto(
  "PaymentCreateBody",
  z.object({
    method: PaymentMethod,
    amount: PositiveSatang,
    paid_at: Timestamp,
    reference: ShortText,
    evidence_document_id: DocumentId,
  }),
);
export type PaymentCreateBody = z.infer<typeof PaymentCreateBody>;

export const PaymentCreateResponse = dto(
  "PaymentCreateResponse",
  z.object({ payment: PaymentDTO }),
);

// POST /admin/api/fees/:id/waive and /admin/api/invoices/:id/void
export const ReasonBody = dto(
  "ReasonBody",
  z.object({ reason: MediumText.min(1) }),
);
