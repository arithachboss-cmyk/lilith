import { z } from "zod";
import {
  AiRunStatus,
  DealStatus,
  InterestAction,
  MatchSide,
  NotificationChannel,
  PassReasonCode,
  Role,
  ViewingOutcome,
} from "./dto/enums";
import { Timestamp } from "./dto/primitives";

/**
 * Product-analytics event registry — the single source of event names
 * (Blueprint §16.3). A name that is not a key of `EVENT_PROPS` does not
 * type-check anywhere an `EventName` is expected.
 *
 * Privacy (§16.3): props never carry a raw price, an exact address, a phone
 * number, an email or free text. Every props object is therefore strict —
 * unknown props are rejected — and string props are codes or bucket labels.
 * The blueprint names the props; their types below are this contract's
 * reading (ADR-0016).
 */

const none = z.strictObject({});
const count = z.int().min(0);
const milliseconds = z.int().min(0);

/**
 * A bucket label: one bound or one range of short numbers, such as "45k-60k",
 * "<1k", "200+" or "51-200". A bare number is not a bucket, and numbers longer
 * than four digits do not fit, so a raw amount or a phone number is rejected.
 */
const bucket = z
  .string()
  .regex(
    /^(?!\d+$)[<>]?\d{1,4}(?:\.\d{1,2})?[kmb]?(?:-\d{1,4}(?:\.\d{1,2})?[kmb]?)?\+?$/,
  );
/** UPPER_SNAKE code, e.g. a reason code or a panel code. */
const code = z.string().regex(/^[A-Z][A-Z0-9_]{0,63}$/);
/** lower_snake or dotted key, e.g. an AI task, a field name, a notification type. */
const key = z.string().regex(/^[a-z][a-z0-9_.]{0,63}$/);
/** A wizard step: its number or its key. */
const step = z.union([z.int().min(1).max(50), key]);
/** A weight profile reference such as "default_rent_v1@1". */
const profile = z.string().regex(/^[a-z][a-z0-9_]{0,63}@\d{1,6}$/);
/** A route template such as "/deals/[id]", never a URL with real ids or a query. */
const route = z.string().regex(/^\/[A-Za-z0-9_\-/[\]().]{0,119}$/);

export const EVENT_PROPS = {
  // Acquisition & identity
  app_opened: none,
  welcome_viewed: none,
  signup_started: none,
  otp_requested: none,
  otp_submitted: none,
  otp_verified: none,
  signup_completed: none,
  role_selected: none,
  profile_completed: none,
  verification_submitted: none,
  profile_verified: none,
  verification_rejected: none,
  login_succeeded: none,
  login_failed: none,

  // Supply
  property_draft_created: none,
  property_step_completed: z.strictObject({ step }),
  media_uploaded: z.strictObject({ kind: code, count }),
  ai_property_review_requested: none,
  ai_property_review_accepted: z.strictObject({ fields_edited: count }),
  property_published: none,
  property_paused: none,
  property_archived: none,
  property_rejected: z.strictObject({ reason: code }),

  // Demand
  requirement_draft_created: none,
  requirement_step_completed: z.strictObject({ step }),
  ai_requirement_extracted: z.strictObject({
    fields_filled: count,
    ambiguities: count,
  }),
  requirement_activated: none,
  requirement_paused: none,
  requirement_fulfilled: none,

  // Matching
  match_generated: z.strictObject({
    score: z.int().min(0).max(100),
    confidence: z.number().min(0).max(1),
    profile,
  }),
  match_feed_served: z.strictObject({
    count,
    avg_score: z.number().min(0).max(100),
  }),
  match_viewed: z.strictObject({
    position_in_deck: count,
    dwell_ms: milliseconds,
  }),
  match_explanation_viewed: none,
  // `score` and `position_in_deck` appear in the §16.2 example envelope.
  interest_expressed: z.strictObject({
    side: MatchSide,
    action: InterestAction,
    score: z.int().min(0).max(100).optional(),
    position_in_deck: count.optional(),
  }),
  match_passed: z.strictObject({
    side: MatchSide,
    reason: PassReasonCode.optional(),
  }),
  super_match_used: none,
  match_mutual: none,

  // Deal
  deal_room_opened: none,
  contact_disclosed: none,
  message_sent: z.strictObject({
    length_bucket: bucket,
    has_attachment: z.boolean(),
  }),
  message_read: none,
  viewing_requested: z.strictObject({ slots_offered: z.int().min(1) }),
  viewing_confirmed: z.strictObject({ lead_time_hours: z.number().min(0) }),
  viewing_completed: z.strictObject({ outcome: ViewingOutcome }),
  viewing_no_show: none,
  viewing_cancelled: none,
  offer_submitted: z.strictObject({
    amount_bucket: bucket,
    round: z.int().min(1),
  }),
  offer_countered: none,
  offer_accepted: none,
  offer_rejected: none,
  offer_expired: none,
  agreement_sent: none,
  agreement_signed: none,
  deal_closed: z.strictObject({
    transaction_value_bucket: bucket,
    days_from_match: z.number().min(0),
  }),
  deal_cancelled: z.strictObject({ stage: DealStatus, reason_code: code }),

  // Money
  fee_generated: z.strictObject({ amount_bucket: bucket }),
  invoice_issued: none,
  invoice_viewed: none,
  payment_recorded: none,
  fee_paid: none,
  fee_waived: z.strictObject({ reason_code: code }),
  receipt_downloaded: none,

  // Intelligence & system
  insights_viewed: z.strictObject({ panel: code }),
  notification_sent: z.strictObject({
    type: key,
    channel: NotificationChannel,
  }),
  notification_opened: z.strictObject({ type: key }),
  ai_run_completed: z.strictObject({
    task: key,
    status: AiRunStatus,
    latency_ms: milliseconds,
    cost_micro_usd: count,
  }),
  ai_output_overridden: z.strictObject({ task: key, field: key }),
  error_shown: z.strictObject({ code, route }),

  // Named as a screen's primary event in §5.2 but absent from §16.3.
  dashboard_viewed: none,
  ai_review_viewed: none,
  ai_extraction_used: none,
  property_detail_viewed: none,
  match_inbox_viewed: none,
  ai_deal_summary_viewed: none,
  deal_timeline_viewed: none,
  fee_viewed: none,
  trust_center_viewed: none,
} as const satisfies Record<string, z.ZodObject>;

export type EventName = keyof typeof EVENT_PROPS;
export type EventProps<N extends EventName> = z.infer<(typeof EVENT_PROPS)[N]>;

export const EVENT_NAMES = Object.keys(EVENT_PROPS) as [
  EventName,
  ...EventName[],
];

export function isEventName(value: unknown): value is EventName {
  return typeof value === "string" && Object.hasOwn(EVENT_PROPS, value);
}

/** Where an event was recorded (`events.source`, §8.2.8). */
export const AnalyticsSource = z.enum(["WEB", "SERVER", "JOB"]);
export type AnalyticsSource = z.infer<typeof AnalyticsSource>;

/** Current version of the envelope of §16.2. */
export const EVENT_SCHEMA_VERSION = 1;

/** The envelope every analytics event carries (§16.2). */
export const EventEnvelope = z
  .object({
    event_name: z.enum(EVENT_NAMES),
    occurred_at: Timestamp,
    user_id: z.string().min(1).max(128).nullable(),
    anonymous_id: z.string().min(1).max(128).nullable(),
    session_id: z.string().min(1).max(128).nullable(),
    role: Role.nullable(),
    source: AnalyticsSource,
    schema_version: z.int().min(1),
    subject_type: code.nullable(),
    subject_id: z.string().min(1).max(128).nullable(),
    props: z.record(z.string(), z.unknown()),
  })
  .superRefine((event, context) => {
    const result = EVENT_PROPS[event.event_name].safeParse(event.props);
    if (result.success) return;
    for (const issue of result.error.issues) {
      context.addIssue({
        code: "custom",
        message: issue.message,
        path: ["props", ...issue.path],
      });
    }
  });
export type EventEnvelope = z.infer<typeof EventEnvelope>;

export interface TrackedEvent<N extends EventName = EventName> {
  readonly event_name: N;
  readonly props: EventProps<N>;
}

// Props may be left out exactly when the event has no required prop.
type PropsArgument<N extends EventName> =
  Record<never, never> extends EventProps<N>
    ? [props?: EventProps<N>]
    : [props: EventProps<N>];

/**
 * Builds a registered event with validated props. `trackEvent("not_registered")`
 * is a TypeScript error, and so is a missing, unknown or mistyped prop. The
 * sink (browser beacon, server writer) wraps this function and adds the rest
 * of the envelope.
 */
export function trackEvent<N extends EventName>(
  name: N,
  ...[props]: PropsArgument<N>
): TrackedEvent<N> {
  if (!isEventName(name))
    throw new TypeError(`Event is not registered: ${String(name)}`);
  const schema: z.ZodType = EVENT_PROPS[name];
  return Object.freeze({
    event_name: name,
    props: schema.parse(props ?? {}) as EventProps<N>,
  });
}
