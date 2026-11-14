import { z } from "zod";
import {
  FurnishingPreference,
  Importance,
  PetRequirement,
  PropertyType,
  RequirementStatus,
  RequirementTransactionType,
  Urgency,
} from "./enums";
import { LocationRef } from "./geo";
import {
  Code,
  Currency,
  DateOnly,
  MediumText,
  OpaqueId,
  OpenObject,
  openObject,
  Percent,
  RequirementId,
  Satang,
  Score,
  UserId,
  Version,
  page,
  pageQuery,
} from "./primitives";
import { dto } from "./registry";

// ---- RequirementDTO (§18.5, "excerpt") -------------------------------------

/**
 * The members §18.5 shows. A draft starts with only its transaction type, so
 * everything the wizard fills in later is nullable.
 */
export const RequirementDTO = dto(
  "RequirementDTO",
  z.object({
    id: RequirementId,
    status: RequirementStatus,
    transaction_type: RequirementTransactionType,
    property_types: z.array(PropertyType),
    budget: z.object({
      min_amount: Satang.nullable(),
      max_amount: Satang.nullable(),
      flex_pct: Percent,
      currency: Currency,
    }),
    locations: z.array(LocationRef.partial({ name_th: true })),
    bedrooms: z.object({
      min: z.int().min(0).nullable(),
      max: z.int().min(0).nullable(),
    }),
    size_sqm: z.object({
      min: z.number().min(0).nullable(),
      max: z.number().min(0).nullable(),
    }),
    move_in: z.object({ from: DateOnly.nullable(), to: DateOnly.nullable() }),
    lease_months: z.int().min(1).nullable(),
    furnishing_pref: FurnishingPreference.nullable(),
    pet_requirement: PetRequirement.nullable(),
    max_walk_minutes_to_transit: z.int().min(0).nullable(),
    preferences: z.array(
      z.object({
        key: Code,
        value: z.unknown().optional(),
        importance: Importance,
      }),
    ),
    special_requirements_text: z.string().nullable(),
    // Lilith output with its provenance under `_meta`.
    extracted_attributes: OpenObject,
    urgency: Urgency.nullable(),
    version: Version,
  }),
);
export type RequirementDTO = z.infer<typeof RequirementDTO>;

/** Derived: a subset of RequirementDTO for lists and deal headers. */
export const RequirementSummaryDTO = dto(
  "RequirementSummaryDTO",
  RequirementDTO.pick({
    id: true,
    status: true,
    transaction_type: true,
    property_types: true,
    budget: true,
    locations: true,
    bedrooms: true,
    move_in: true,
    urgency: true,
  }),
);
export type RequirementSummaryDTO = z.infer<typeof RequirementSummaryDTO>;

// ---- Requests and responses ------------------------------------------------

// POST /api/requirements
export const RequirementCreateBody = dto(
  "RequirementCreateBody",
  z.object({ transaction_type: RequirementTransactionType }),
);

// PATCH /api/requirements/:id — §18.5 gives no body.
export const RequirementPatchBody = dto(
  "RequirementPatchBody",
  openObject(),
  "Any subset of the wizard fields. Blueprint v1.0 does not list them.",
);
export const RequirementPatchResponse = dto(
  "RequirementPatchResponse",
  z.object({ requirement: RequirementDTO, completion_score: Score }),
);

// POST /api/requirements/:id/activate
export const RequirementActivateResponse = dto(
  "RequirementActivateResponse",
  z.object({
    requirement: RequirementDTO,
    status: z.literal("ACTIVE"),
    matching_job_id: OpaqueId,
  }),
);

// POST /api/requirements/:id/pause { reason? }
export const RequirementPauseBody = dto(
  "RequirementPauseBody",
  z.object({ reason: MediumText.optional() }),
);

// GET /api/requirements?scope=me|client:<id>&status=ACTIVE
export const RequirementListQuery = z.object({
  scope: z
    .union([z.literal("me"), z.templateLiteral(["client:", UserId])])
    .optional(),
  status: RequirementStatus.optional(),
  ...pageQuery,
});
export const RequirementListResponse = dto(
  "RequirementListResponse",
  page(RequirementSummaryDTO),
);
