import { z } from "zod";
import {
  AiLanguage,
  AiRating,
  AiRunStatus,
  Importance,
  NormalizeKind,
  NormalizeSource,
} from "./enums";
import {
  AiRunId,
  Code,
  DealId,
  LongText,
  MatchId,
  MediumText,
  OpenObject,
  openObject,
  PropertyId,
  Ratio,
  RequirementId,
  Score,
  ShortText,
  Timestamp,
} from "./primitives";
import { dto } from "./registry";

// ---- The `{ data, meta }` envelope (§10.2) ---------------------------------

/**
 * Provenance of every AI result. A component that shows `data` must show
 * this too.
 */
export const AiMeta = dto(
  "AiMeta",
  z.object({
    ai_run_id: AiRunId,
    task: z.string(),
    model: z.string(),
    prompt_version: z.string(),
    confidence: Ratio.nullable(),
    input_ref: OpenObject,
    generated_at: Timestamp,
    status: AiRunStatus,
    latency_ms: z.int().min(0),
    cost_micro_usd: z.int().min(0),
    human_override: z.unknown(),
  }),
);
export type AiMeta = z.infer<typeof AiMeta>;

function aiResponse<T extends z.ZodType>(id: string, data: T) {
  return dto(id, z.object({ data, meta: AiMeta }));
}

const extractedField = z.object({ value: z.unknown(), confidence: Ratio });
const freeText = LongText.min(1);

// ---- §18.9 -----------------------------------------------------------------

// POST /api/ai/extract-property
export const AiExtractPropertyBody = dto(
  "AiExtractPropertyBody",
  z.object({
    property_id: PropertyId.optional(),
    text: freeText,
    language: AiLanguage,
  }),
);
export const AiExtractPropertyResponse = aiResponse(
  "AiExtractPropertyResponse",
  z.object({
    fields: z.record(z.string(), extractedField),
    amenity_codes: z.array(Code),
    red_flags: z.array(z.string()),
  }),
);

// POST /api/ai/extract-requirement
export const AiExtractRequirementBody = dto(
  "AiExtractRequirementBody",
  z.object({
    requirement_id: RequirementId.optional(),
    text: freeText,
    language: AiLanguage,
  }),
);
export const AiExtractRequirementResponse = aiResponse(
  "AiExtractRequirementResponse",
  z.object({
    fields: z.record(z.string(), extractedField),
    preferences: z.array(
      z.object({
        key: Code,
        value: z.unknown().optional(),
        importance: Importance,
      }),
    ),
    ambiguities: z.array(z.string()),
  }),
);

// POST /api/ai/normalize
export const AiNormalizeBody = dto(
  "AiNormalizeBody",
  z.object({
    kind: NormalizeKind,
    values: z.array(ShortText).min(1).max(50),
  }),
);
export const AiNormalizeResponse = aiResponse(
  "AiNormalizeResponse",
  z.object({
    normalized: z.array(
      z.object({
        input: z.string(),
        code: z.string().nullable(),
        confidence: Ratio,
        source: NormalizeSource,
      }),
    ),
  }),
);

// POST /api/ai/explain-match
export const AiExplainMatchBody = dto(
  "AiExplainMatchBody",
  z.object({ match_id: MatchId }),
);
export const AiExplainMatchResponse = aiResponse(
  "AiExplainMatchResponse",
  z.object({ text_th: z.string(), text_en: z.string() }),
);

// POST /api/ai/deal-summary — suggested actions come from a closed vocabulary
// of platform actions, so the UI can render them as real buttons (§10.3 T5).
export const AiDealSummaryBody = dto(
  "AiDealSummaryBody",
  z.object({ deal_id: DealId }),
);
export const AiDealSummaryResponse = aiResponse(
  "AiDealSummaryResponse",
  z.object({
    summary_th: z.string(),
    summary_en: z.string(),
    open_items: z.array(z.object({ code: Code, text_th: z.string() })),
    suggested_actions: z.array(
      z.object({ action: Code, label_th: z.string() }),
    ),
    risks: z.array(z.object({ code: Code, severity: Code })),
  }),
);

// POST /api/ai/detect-duplicate
const duplicateCandidate = z.object({
  property_id: PropertyId,
  similarity: Ratio,
  is_duplicate: z.boolean(),
  evidence: z.array(z.string()),
});
export const AiPropertyBody = dto(
  "AiPropertyBody",
  z.object({ property_id: PropertyId }),
);
export const AiDetectDuplicateResponse = aiResponse(
  "AiDetectDuplicateResponse",
  z.object({ candidates: z.array(duplicateCandidate) }),
);

// POST /api/ai/property-review
export const AiPropertyReviewResponse = aiResponse(
  "AiPropertyReviewResponse",
  z.object({
    quality_score: Score,
    missing: z.array(z.string()),
    suggestions: z.array(
      z.object({
        field: z.string(),
        reason: z.string(),
        proposed_th: z.string(),
      }),
    ),
    duplicate_candidates: z.array(duplicateCandidate),
    policy_flags: z.array(z.string()),
  }),
);

// POST /api/ai/requirement-summary — screen 18 uses it (§18.12), but §18.9
// gives it no contract. Request and `data` stay open.
export const AiRequirementSummaryBody = dto(
  "AiRequirementSummaryBody",
  openObject(),
  "Not specified in Blueprint v1.0.",
);
export const AiRequirementSummaryResponse = aiResponse(
  "AiRequirementSummaryResponse",
  OpenObject,
);

// POST /api/ai/runs/:id/feedback
export const AiFeedbackBody = dto(
  "AiFeedbackBody",
  z.object({ rating: AiRating, comment: MediumText.optional() }),
);
// POST /api/ai/runs/:id/override — records the human decision.
export const AiOverrideBody = dto(
  "AiOverrideBody",
  z.object({ field: ShortText, value: z.unknown() }),
);
