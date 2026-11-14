import { z } from "zod";
import { NotificationChannel, NotificationPriority } from "./enums";
import {
  Code,
  LocationId,
  OpaqueId,
  OpenObject,
  Timestamp,
  Url,
  page,
  pageQuery,
} from "./primitives";
import { dto } from "./registry";

// ---- Insights (§18.10) -----------------------------------------------------

// GET /api/insights/overview?scope=owner|agent|client&area_id=&period=90d
export const InsightsQuery = z.object({
  scope: z.enum(["owner", "agent", "client"]),
  area_id: LocationId.optional(),
  period: z
    .string()
    .regex(/^\d{1,3}d$/)
    .optional(),
});

/**
 * Each panel has a `code` and its own members. Cells under the k-anonymity
 * threshold are suppressed and listed instead (§16.5).
 */
export const InsightsResponse = dto(
  "InsightsResponse",
  z.object({
    panels: z.array(z.looseObject({ code: Code })),
    suppressed_panels: z.array(Code),
    suppression_reason: z.string().nullable(),
  }),
);
export type InsightsResponse = z.infer<typeof InsightsResponse>;

// ---- Notifications ---------------------------------------------------------

// Derived from `notifications` (§8.2.8).
export const NotificationDTO = dto(
  "NotificationDTO",
  z.object({
    id: OpaqueId,
    type: z.string(),
    title_th: z.string(),
    title_en: z.string(),
    body_th: z.string(),
    body_en: z.string(),
    deep_link: z.string(),
    subject_type: z.string().nullable(),
    subject_id: OpaqueId.nullable(),
    priority: NotificationPriority,
    read_at: Timestamp.nullable(),
    created_at: Timestamp,
  }),
);
export type NotificationDTO = z.infer<typeof NotificationDTO>;

// GET /api/notifications?unread=true&limit=20
export const NotificationListQuery = z.object({
  unread: z.enum(["true", "false"]).optional(),
  ...pageQuery,
});
export const NotificationListResponse = dto(
  "NotificationListResponse",
  page(NotificationDTO).extend({ unread_count: z.int().min(0) }),
);

// Derived from `notification_prefs` (§8.2.8).
export const NotificationPref = dto(
  "NotificationPref",
  z.object({
    channel: NotificationChannel,
    type: z.string().min(1).max(64),
    enabled: z.boolean(),
    quiet_hours: OpenObject.nullable().optional(),
  }),
);
// GET and PUT /api/notifications/preferences
export const NotificationPrefsBody = dto(
  "NotificationPrefsBody",
  z.object({ prefs: z.array(NotificationPref).max(200) }),
);

// POST /api/push/subscribe — a W3C PushSubscription as the browser serialises it.
export const PushSubscribeBody = dto(
  "PushSubscribeBody",
  z.object({
    subscription: z.looseObject({
      endpoint: Url,
      keys: z.object({
        p256dh: z.string().min(1).max(512),
        auth: z.string().min(1).max(512),
      }),
    }),
  }),
);

// ---- Health ----------------------------------------------------------------

// GET /api/health — §18.10 names the members and not their values.
export const HealthResponse = dto(
  "HealthResponse",
  z.object({
    status: z.string(),
    db: z.string(),
    queue: z.string(),
    ai: z.string(),
    version: z.string(),
  }),
);
