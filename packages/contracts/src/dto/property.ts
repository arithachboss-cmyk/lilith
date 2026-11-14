import { z } from "zod";
import {
  DocumentVisibility,
  Furnishing,
  MandateStatus,
  MandateType,
  MediaKind,
  PetPolicy,
  PropertyDocumentKind,
  PropertyStatus,
  PropertyTransactionType,
  PropertyType,
  TransitSystem,
} from "./enums";
import { LocationRef } from "./geo";
import {
  AiRunId,
  Code,
  Currency,
  DateOnly,
  DocumentId,
  LatLng,
  MediumText,
  OpaqueId,
  openObject,
  PropertyId,
  Satang,
  Score,
  Timestamp,
  Url,
  UserId,
  Version,
  page,
  pageQuery,
} from "./primitives";
import { dto } from "./registry";

// ---- Parts -----------------------------------------------------------------

/**
 * `sale_amount` follows the pattern of `rent_monthly_amount`: the §8 column
 * name without its `price_` prefix. An amount is present exactly when the
 * listing has that transaction type.
 */
export const PropertyPrice = dto(
  "PropertyPrice",
  z.object({
    sale_amount: Satang.optional(),
    rent_monthly_amount: Satang.optional(),
    currency: Currency,
    negotiable: z.boolean(),
  }),
);
export type PropertyPrice = z.infer<typeof PropertyPrice>;

export const PropertyMediaItem = dto(
  "PropertyMediaItem",
  z.object({
    url: Url,
    blurhash: z.string().nullable(),
    kind: MediaKind,
    is_cover: z.boolean(),
  }),
);

const transitItem = z.object({
  system: TransitSystem,
  station: z.string(),
  walk_minutes: z.int().min(0),
});

const listedBy = z.object({
  type: z.enum(["OWNER", "AGENT"]),
  display_name: z.string(),
  org: z.string().nullable(),
  verified: z.boolean(),
});

// ---- PropertyPublicDTO (§18.4) ---------------------------------------------

/**
 * What any authenticated T2 user may see. Absent by construction:
 * `address_line`, `unit_number`, the exact `geo_point`, the owner's identity
 * and contact, and documents. Parsing with this schema strips them.
 */
export const PropertyPublicDTO = dto(
  "PropertyPublicDTO",
  z.object({
    id: PropertyId,
    reference_code: z.string(),
    property_type: PropertyType,
    transaction_types: z.array(PropertyTransactionType).min(1),
    project_name: z.string().nullable(),
    area: LocationRef,
    geo_approx: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
      jitter_m: z.int().min(0),
    }),
    price: PropertyPrice,
    size_sqm: z.number().min(0).nullable(),
    bedrooms: z.int().min(0).nullable(),
    bathrooms: z.int().min(0).nullable(),
    floor: z.int().nullable(),
    furnishing: Furnishing.nullable(),
    pet_policy: PetPolicy.nullable(),
    available_from: DateOnly.nullable(),
    amenities: z.array(Code),
    transit: z.array(transitItem),
    media: z.array(PropertyMediaItem),
    badges: z.array(Code),
    listed_by: listedBy,
    published_at: Timestamp,
    last_verified_at: Timestamp.nullable(),
  }),
  "A listing as any authenticated T2 user may see it. It never carries the address line, the unit number, the exact coordinates, the owner's identity or contact, or documents.",
);
export type PropertyPublicDTO = z.infer<typeof PropertyPublicDTO>;

// ---- PropertyPrivateDTO (§18.4) --------------------------------------------

const propertyDocument = z.object({
  document_id: DocumentId,
  kind: PropertyDocumentKind,
  visibility: DocumentVisibility,
});

// Derived from `mandates` (§8.2.3).
const mandate = z.object({
  id: OpaqueId,
  type: MandateType,
  status: MandateStatus,
  starts_at: Timestamp,
  ends_at: Timestamp.nullable(),
});

/** The members §18.4 adds to the public DTO. */
export const PROPERTY_PRIVATE_ONLY_FIELDS = [
  "address_line",
  "unit_number",
  "geo_point",
  "documents",
  "owner",
  "mandate",
  "quality_flags",
  "completion_score",
  "version",
] as const;

/**
 * Public DTO plus the private members. A draft has no area, coordinates or
 * publication date yet, so those three public members are nullable here.
 */
export const PropertyPrivateDTO = dto(
  "PropertyPrivateDTO",
  PropertyPublicDTO.extend({
    area: LocationRef.nullable(),
    geo_approx: PropertyPublicDTO.shape.geo_approx.nullable(),
    published_at: Timestamp.nullable(),
    address_line: z.string().nullable(),
    unit_number: z.string().nullable(),
    geo_point: LatLng.nullable(),
    documents: z.array(propertyDocument),
    owner: z.object({ user_id: UserId, display_name: z.string() }),
    mandate: mandate.nullable(),
    quality_flags: z.array(Code),
    completion_score: Score,
    version: Version,
  }),
  "The listing as its owner, its listing agent and admins see it.",
);
export type PropertyPrivateDTO = z.infer<typeof PropertyPrivateDTO>;

// ---- Summary and media (named in §18.4, shown nowhere) ---------------------

/**
 * Derived: members of the public DTO plus `status`, which a list that mixes
 * drafts and published listings needs. It has no private member.
 */
export const PropertySummaryDTO = dto(
  "PropertySummaryDTO",
  z.object({
    id: PropertyId,
    reference_code: z.string(),
    status: PropertyStatus,
    property_type: PropertyType,
    transaction_types: z.array(PropertyTransactionType).min(1),
    project_name: z.string().nullable(),
    area: LocationRef.nullable(),
    price: PropertyPrice,
    size_sqm: z.number().min(0).nullable(),
    bedrooms: z.int().min(0).nullable(),
    bathrooms: z.int().min(0).nullable(),
    media: z.array(PropertyMediaItem),
    published_at: Timestamp.nullable(),
  }),
);
export type PropertySummaryDTO = z.infer<typeof PropertySummaryDTO>;

// Derived from `property_media` (§8.2.3) and the media item of the public DTO.
export const PropertyMediaDTO = dto(
  "PropertyMediaDTO",
  PropertyMediaItem.extend({
    id: OpaqueId,
    sort_order: z.int().min(0),
  }),
);
export type PropertyMediaDTO = z.infer<typeof PropertyMediaDTO>;

// ---- Requests and responses ------------------------------------------------

// POST /api/properties
export const PropertyCreateBody = dto(
  "PropertyCreateBody",
  z.object({
    transaction_types: z.array(PropertyTransactionType).min(1),
    property_type: PropertyType,
  }),
);
export type PropertyCreateBody = z.infer<typeof PropertyCreateBody>;

export const PropertyCreateResponse = dto(
  "PropertyCreateResponse",
  z.object({ property: PropertyPrivateDTO }),
);

// PATCH /api/properties/:id — "any subset of wizard fields"; §18.4 does not
// list them, so the body stays open until the task that owns the wizard.
export const PropertyPatchBody = dto(
  "PropertyPatchBody",
  openObject(),
  "Any subset of the wizard fields. Blueprint v1.0 does not list them.",
);

export const PropertyPatchResponse = dto(
  "PropertyPatchResponse",
  z.object({
    property: PropertyPrivateDTO,
    completion_score: Score,
    missing_for_publish: z.array(z.string()),
  }),
);

// POST /api/properties/:id/media
export const PropertyMediaAddBody = dto(
  "PropertyMediaAddBody",
  z.object({
    items: z
      .array(
        z.object({
          document_id: DocumentId,
          kind: MediaKind,
          sort_order: z.int().min(0),
          is_cover: z.boolean(),
        }),
      )
      .min(1)
      .max(50),
  }),
);
export const PropertyMediaAddResponse = dto(
  "PropertyMediaAddResponse",
  z.object({ media: z.array(PropertyMediaDTO) }),
);

// POST /api/properties/:id/publish — with AI off there is no run to cite.
export const PropertyPublishBody = dto(
  "PropertyPublishBody",
  z.object({
    acknowledge_ai_review: z.boolean(),
    ai_run_id: AiRunId.optional(),
  }),
);
export const PropertyPublishResponse = dto(
  "PropertyPublishResponse",
  z.object({
    property: PropertyPrivateDTO,
    status: z.enum(["PUBLISHED", "PENDING_REVIEW"]),
  }),
);

// POST /api/properties/:id/pause { reason? } and /archive { reason }
export const PropertyPauseBody = dto(
  "PropertyPauseBody",
  z.object({ reason: MediumText.optional() }),
);
export const PropertyArchiveBody = dto(
  "PropertyArchiveBody",
  z.object({ reason: MediumText.min(1) }),
);

// GET /api/properties/:id — "Public or Private DTO by authorization". The
// private schema is tried first: only it has the private members.
export const PropertyDetailResponse = dto(
  "PropertyDetailResponse",
  z.union([PropertyPrivateDTO, PropertyPublicDTO]),
);

// GET /api/properties?owner=me&status=PUBLISHED&limit=20
export const PropertyListQuery = z.object({
  owner: z.literal("me").optional(),
  status: PropertyStatus.optional(),
  ...pageQuery,
});
export const PropertyListResponse = dto(
  "PropertyListResponse",
  page(PropertySummaryDTO),
);
