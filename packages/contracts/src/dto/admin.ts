import { z } from "zod";
import {
  DealStatus,
  ModerationItemType,
  ModerationQueue,
  ModerationStatus,
} from "./enums";
import {
  Code,
  DateOnly,
  MediumText,
  OpaqueId,
  OpenObject,
  openObject,
  Timestamp,
  page,
  pageQuery,
} from "./primitives";
import { dto } from "./registry";

/**
 * Admin API (§18.11, an excerpt in the blueprint). Where §18.11 gives no
 * response body, the route has none here either.
 */

// Derived from `moderation_queue` (§8.2.8).
export const QueueItemDTO = dto(
  "QueueItemDTO",
  z.object({
    id: OpaqueId,
    item_type: ModerationItemType,
    item_id: OpaqueId,
    queue: ModerationQueue,
    priority: z.int(),
    assigned_to: OpaqueId.nullable(),
    status: ModerationStatus,
    sla_due_at: Timestamp.nullable(),
    decision: z.string().nullable(),
    decided_by: OpaqueId.nullable(),
    decided_at: Timestamp.nullable(),
  }),
);
export type QueueItemDTO = z.infer<typeof QueueItemDTO>;

// GET /admin/api/queues/:queue?status=PENDING
export const QueueListQuery = z.object({ status: ModerationStatus.optional() });
export const QueueListResponse = dto(
  "QueueListResponse",
  z.object({ data: z.array(QueueItemDTO) }),
);

// POST /admin/api/queues/items/:id/decide
export const QueueDecideBody = dto(
  "QueueDecideBody",
  z.object({
    decision: z.enum(["APPROVE", "REJECT", "ESCALATE"]),
    reason: MediumText.min(1),
  }),
);

// POST /admin/api/users/:id/suspend
export const UserSuspendBody = dto(
  "UserSuspendBody",
  z.object({ reason: MediumText.min(1), until: Timestamp }),
);

// POST /admin/api/deals/:id/force-transition
export const ForceTransitionBody = dto(
  "ForceTransitionBody",
  z.object({ to: DealStatus, reason: MediumText.min(1) }),
);

// POST /admin/api/weight-profiles/:id/shadow-score
export const ShadowScoreBody = dto(
  "ShadowScoreBody",
  z.object({ sample: z.int().min(1).max(100_000) }),
);
export const ShadowScoreResponse = dto(
  "ShadowScoreResponse",
  z.object({ report_job_id: OpaqueId }),
);

// GET /admin/api/weight-profiles/:id/shadow-report — members named, not typed.
export const ShadowReportResponse = dto(
  "ShadowReportResponse",
  z.object({
    score_delta_histogram: z.unknown(),
    rank_changes: z.unknown(),
    top10_churn_pct: z.unknown(),
  }),
);

// POST /admin/api/fee-rules { … } — the body is not given. A fee rule's basis,
// rate and payer are the owner's to set; nothing here supplies one.
export const FeeRuleCreateBody = dto(
  "FeeRuleCreateBody",
  openObject(),
  "Not specified in Blueprint v1.0.",
);

// GET /admin/api/audit?actor=&subject_type=&subject_id=&from=&to=
export const AuditQuery = z.object({
  actor: OpaqueId.optional(),
  subject_type: Code.optional(),
  subject_id: OpaqueId.optional(),
  from: Timestamp.optional(),
  to: Timestamp.optional(),
  ...pageQuery,
});
export const AuditListResponse = dto("AuditListResponse", page(OpenObject));

// GET /admin/api/reconciliation/daily?date= — members named, not typed.
export const ReconciliationQuery = z.object({ date: DateOnly });
export const ReconciliationResponse = dto(
  "ReconciliationResponse",
  z.object({
    fees_issued: z.unknown(),
    invoices_issued: z.unknown(),
    payments_confirmed: z.unknown(),
    drift: z.unknown(),
  }),
);
