import { z } from "zod";
import {
  VerificationKind,
  VerificationStatus,
  VerificationSubjectType,
} from "./enums";
import { DocumentId, MediumText, OpaqueId, Timestamp } from "./primitives";
import { dto } from "./registry";

// POST /api/verifications (§18.2)
export const VerificationCreateBody = dto(
  "VerificationCreateBody",
  z.object({
    subject_type: VerificationSubjectType,
    subject_id: OpaqueId,
    kind: VerificationKind,
    document_id: DocumentId,
  }),
);
export type VerificationCreateBody = z.infer<typeof VerificationCreateBody>;

export const VerificationCreateResponse = dto(
  "VerificationCreateResponse",
  z.object({ verification_id: OpaqueId, status: VerificationStatus }),
);

// Derived from `verification_records` (§8.2.1); §18.2 names it without showing it.
export const VerificationDTO = dto(
  "VerificationDTO",
  z.object({
    id: OpaqueId,
    subject_type: VerificationSubjectType,
    subject_id: OpaqueId,
    kind: VerificationKind,
    status: VerificationStatus,
    document_id: DocumentId.nullable(),
    reviewed_at: Timestamp.nullable(),
    reject_reason: z.string().nullable(),
    expires_at: Timestamp.nullable(),
  }),
);
export type VerificationDTO = z.infer<typeof VerificationDTO>;

// GET /api/verifications?subject_type=USER&subject_id=usr_…
export const VerificationListQuery = z.object({
  subject_type: VerificationSubjectType,
  subject_id: OpaqueId,
});
export const VerificationListResponse = dto(
  "VerificationListResponse",
  z.object({ data: z.array(VerificationDTO) }),
);

// POST /admin/api/verifications/:id/decide
export const VerificationDecideBody = dto(
  "VerificationDecideBody",
  z.object({
    decision: z.enum(["APPROVED", "REJECTED"]),
    reason: MediumText,
  }),
);
