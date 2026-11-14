import { z } from "zod";
import {
  MatchBand,
  MatchStatus,
  PassReasonCode,
  ReasonKind,
  ReasonSource,
} from "./enums";
import {
  AiRunId,
  Code,
  DealRoomId,
  MatchId,
  MediumText,
  OpenObject,
  Ratio,
  RequirementId,
  Score,
  Timestamp,
  page,
  pageQuery,
} from "./primitives";
import { PropertyPublicDTO, PropertySummaryDTO } from "./property";
import { dto } from "./registry";
import { RequirementSummaryDTO } from "./requirement";

// ---- Reasons (§9.7) --------------------------------------------------------

/** One deterministic reason: matched, a trade-off, or unmatched. */
export const MatchReason = dto(
  "MatchReason",
  z.object({
    dimension: z.string(),
    code: Code,
    score: Ratio,
    params: OpenObject.optional(),
    text_th: z.string(),
    text_en: z.string(),
  }),
);
export type MatchReason = z.infer<typeof MatchReason>;

// ---- Feed (§18.6) ----------------------------------------------------------

export const MatchFeedItem = dto(
  "MatchFeedItem",
  z.object({
    match_id: MatchId,
    score: Score,
    confidence: Ratio,
    band: MatchBand,
    property: PropertyPublicDTO,
    top_reasons: z.array(
      z.object({
        code: Code,
        kind: ReasonKind.optional(),
        text_th: z.string(),
        text_en: z.string(),
      }),
    ),
    expires_at: Timestamp,
  }),
);
export type MatchFeedItem = z.infer<typeof MatchFeedItem>;

// GET /api/matches/feed?requirement_id=req_…&limit=20&cursor=…
export const MatchFeedQuery = z.object({
  requirement_id: RequirementId,
  ...pageQuery,
});
export const MatchFeedResponse = dto(
  "MatchFeedResponse",
  page(MatchFeedItem).extend({
    meta: z.object({
      weight_profile: z.string(),
      generated_at: Timestamp,
      total_candidates: z.int().min(0),
    }),
  }),
);
export type MatchFeedResponse = z.infer<typeof MatchFeedResponse>;

// ---- Explanation (§18.6, §9.7) ---------------------------------------------

/**
 * Only `match_explanation` may come from the model. When the template
 * fallback wrote it, `source` is RULE and the model members are null.
 */
export const MatchExplanationResponse = dto(
  "MatchExplanationResponse",
  z.object({
    score: Score,
    confidence: Ratio,
    weight_profile: z.string(),
    dimension_scores: z.record(z.string(), z.number().nullable()),
    matched_constraints: z.array(MatchReason),
    tradeoffs: z.array(MatchReason),
    unmatched_constraints: z.array(MatchReason),
    match_explanation: z.object({
      text_th: z.string(),
      text_en: z.string(),
      source: ReasonSource,
      model: z.string().nullable(),
      prompt_version: z.string().nullable(),
      confidence: Ratio.nullable(),
      generated_at: Timestamp,
      ai_run_id: AiRunId.nullable(),
    }),
  }),
);
export type MatchExplanationResponse = z.infer<typeof MatchExplanationResponse>;

// ---- Interest and pass -----------------------------------------------------

// POST /api/matches/:id/interest
export const MatchInterestBody = dto(
  "MatchInterestBody",
  z.object({ super: z.boolean(), note: MediumText.optional() }),
);
export const MatchInterestResponse = dto(
  "MatchInterestResponse",
  z.object({
    match: z.object({ status: MatchStatus }),
    mutual: z.boolean(),
    deal_room_id: DealRoomId.nullable(),
  }),
);

// POST /api/matches/:id/pass
export const MatchPassBody = dto(
  "MatchPassBody",
  z.object({ reason_code: PassReasonCode }),
);

// ---- Inbox and detail ------------------------------------------------------

// Derived from `matches` (§8.2.5).
export const MatchDTO = dto(
  "MatchDTO",
  z.object({
    id: MatchId,
    score: Score,
    confidence: Ratio,
    band: MatchBand,
    status: MatchStatus,
    generated_at: Timestamp,
    expires_at: Timestamp.nullable(),
  }),
);
export type MatchDTO = z.infer<typeof MatchDTO>;

// GET /api/matches?status=MUTUAL|INTERESTED&role=demand|supply&limit=20
export const MatchListQuery = z.object({
  status: z.enum(["MUTUAL", "INTERESTED"]).optional(),
  role: z.enum(["demand", "supply"]).optional(),
  ...pageQuery,
});

// Derived: §18.6 gives the list as `{ data, next_cursor }` without the item.
export const MatchListResponse = dto(
  "MatchListResponse",
  page(
    z.object({
      match: MatchDTO,
      property: PropertySummaryDTO,
      deal_room_id: DealRoomId.nullable(),
    }),
  ),
);

// GET /api/matches/:id
export const MatchDetailResponse = dto(
  "MatchDetailResponse",
  z.object({
    match: MatchDTO,
    property: PropertyPublicDTO,
    requirement_summary: RequirementSummaryDTO,
    deal_room_id: DealRoomId.optional(),
  }),
);
