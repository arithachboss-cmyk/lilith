import { z } from "zod";
import { DocumentClassification, UploadPurpose } from "./enums";
import { DocumentId, Timestamp, Url } from "./primitives";
import { dto } from "./registry";

// POST /api/uploads/sign (§18.3)
export const UploadSignBody = dto(
  "UploadSignBody",
  z.object({
    purpose: UploadPurpose,
    filename: z.string().min(1).max(255),
    mime: z.string().min(3).max(127),
    bytes: z.int().min(1),
    sha256: z.string().min(1).max(128),
  }),
);
export type UploadSignBody = z.infer<typeof UploadSignBody>;

export const UploadSignResponse = dto(
  "UploadSignResponse",
  z.object({
    document_id: DocumentId,
    upload_url: Url,
    method: z.literal("PUT"),
    headers: z.record(z.string(), z.string()),
    expires_at: Timestamp,
    max_bytes: z.int().min(1),
  }),
);
export type UploadSignResponse = z.infer<typeof UploadSignResponse>;

// Derived from `documents` (§8.2.1) without the storage location.
export const DocumentDTO = dto(
  "DocumentDTO",
  z.object({
    id: DocumentId,
    mime: z.string(),
    bytes: z.int().min(0),
    sha256: z.string(),
    classification: DocumentClassification,
    virus_scanned_at: Timestamp.nullable(),
  }),
);
export type DocumentDTO = z.infer<typeof DocumentDTO>;

// POST /api/uploads/:documentId/complete
export const UploadCompleteResponse = dto(
  "UploadCompleteResponse",
  z.object({ document: DocumentDTO, processing: z.boolean() }),
);

// GET /api/documents/:id/url
export const DocumentUrlResponse = dto(
  "DocumentUrlResponse",
  z.object({ url: Url, expires_at: Timestamp }),
);
