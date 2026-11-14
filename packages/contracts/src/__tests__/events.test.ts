import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  EVENT_NAMES,
  EVENT_PROPS,
  EVENT_SCHEMA_VERSION,
  EventEnvelope,
  isEventName,
  trackEvent,
  type EventName,
} from "../events";
import * as fixtures from "./fixtures";

// Blueprint §16.3, written out here and not read from the module under test.
const TAXONOMY = [
  // Acquisition & identity
  "app_opened",
  "welcome_viewed",
  "signup_started",
  "otp_requested",
  "otp_submitted",
  "otp_verified",
  "signup_completed",
  "role_selected",
  "profile_completed",
  "verification_submitted",
  "profile_verified",
  "verification_rejected",
  "login_succeeded",
  "login_failed",
  // Supply
  "property_draft_created",
  "property_step_completed",
  "media_uploaded",
  "ai_property_review_requested",
  "ai_property_review_accepted",
  "property_published",
  "property_paused",
  "property_archived",
  "property_rejected",
  // Demand
  "requirement_draft_created",
  "requirement_step_completed",
  "ai_requirement_extracted",
  "requirement_activated",
  "requirement_paused",
  "requirement_fulfilled",
  // Matching
  "match_generated",
  "match_feed_served",
  "match_viewed",
  "match_explanation_viewed",
  "interest_expressed",
  "match_passed",
  "super_match_used",
  "match_mutual",
  // Deal
  "deal_room_opened",
  "contact_disclosed",
  "message_sent",
  "message_read",
  "viewing_requested",
  "viewing_confirmed",
  "viewing_completed",
  "viewing_no_show",
  "viewing_cancelled",
  "offer_submitted",
  "offer_countered",
  "offer_accepted",
  "offer_rejected",
  "offer_expired",
  "agreement_sent",
  "agreement_signed",
  "deal_closed",
  "deal_cancelled",
  // Money
  "fee_generated",
  "invoice_issued",
  "invoice_viewed",
  "payment_recorded",
  "fee_paid",
  "fee_waived",
  "receipt_downloaded",
  // Intelligence & system
  "insights_viewed",
  "notification_sent",
  "notification_opened",
  "ai_run_completed",
  "ai_output_overridden",
  "error_shown",
];

// Primary events of the screen register (§5.2) that §16.3 does not list.
const SCREEN_ONLY = [
  "dashboard_viewed",
  "ai_review_viewed",
  "ai_extraction_used",
  "property_detail_viewed",
  "match_inbox_viewed",
  "ai_deal_summary_viewed",
  "deal_timeline_viewed",
  "fee_viewed",
  "trust_center_viewed",
];

// The props §16.3 names for each event that has any.
const PROPS: Record<string, string[]> = {
  property_step_completed: ["step"],
  media_uploaded: ["kind", "count"],
  ai_property_review_accepted: ["fields_edited"],
  property_rejected: ["reason"],
  requirement_step_completed: ["step"],
  ai_requirement_extracted: ["fields_filled", "ambiguities"],
  match_generated: ["score", "confidence", "profile"],
  match_feed_served: ["count", "avg_score"],
  match_viewed: ["position_in_deck", "dwell_ms"],
  interest_expressed: ["side", "action"],
  match_passed: ["side", "reason"],
  message_sent: ["length_bucket", "has_attachment"],
  viewing_requested: ["slots_offered"],
  viewing_confirmed: ["lead_time_hours"],
  viewing_completed: ["outcome"],
  offer_submitted: ["amount_bucket", "round"],
  deal_closed: ["transaction_value_bucket", "days_from_match"],
  deal_cancelled: ["stage", "reason_code"],
  fee_generated: ["amount_bucket"],
  fee_waived: ["reason_code"],
  insights_viewed: ["panel"],
  notification_sent: ["type", "channel"],
  notification_opened: ["type"],
  ai_run_completed: ["task", "status", "latency_ms", "cost_micro_usd"],
  ai_output_overridden: ["task", "field"],
  error_shown: ["code", "route"],
};

// One valid props object per event that takes props.
const VALID: { [N in EventName]?: Record<string, unknown> } = {
  property_step_completed: { step: 2 },
  media_uploaded: { kind: "PHOTO", count: 6 },
  ai_property_review_accepted: { fields_edited: 1 },
  property_rejected: { reason: "DUPLICATE" },
  requirement_step_completed: { step: "budget" },
  ai_requirement_extracted: { fields_filled: 7, ambiguities: 1 },
  match_generated: {
    score: 87,
    confidence: 0.82,
    profile: "default_rent_v1@1",
  },
  match_feed_served: { count: 20, avg_score: 74.5 },
  match_viewed: { position_in_deck: 3, dwell_ms: 4200 },
  interest_expressed: { side: "DEMAND", action: "INTERESTED" },
  match_passed: { side: "DEMAND", reason: "TOO_EXPENSIVE" },
  message_sent: { length_bucket: "51-200", has_attachment: false },
  viewing_requested: { slots_offered: 3 },
  viewing_confirmed: { lead_time_hours: 46.5 },
  viewing_completed: { outcome: "POSITIVE" },
  offer_submitted: { amount_bucket: "45k-60k", round: 1 },
  deal_closed: { transaction_value_bucket: "10m-20m", days_from_match: 23 },
  deal_cancelled: { stage: "NEGOTIATION", reason_code: "PRICE" },
  fee_generated: { amount_bucket: "10k-20k" },
  fee_waived: { reason_code: "PROMOTION" },
  insights_viewed: { panel: "DEMAND_PRESSURE" },
  notification_sent: { type: "match.mutual", channel: "PUSH" },
  notification_opened: { type: "match.mutual" },
  ai_run_completed: {
    task: "extract_property",
    status: "OK",
    latency_ms: 1840,
    cost_micro_usd: 2100,
  },
  ai_output_overridden: { task: "extract_property", field: "bedrooms" },
  error_shown: { code: "RATE_LIMITED", route: "/deals/[id]" },
};

function validPropsOf(name: EventName): Record<string, unknown> {
  return VALID[name] ?? {};
}

describe("event registry", () => {
  it("holds the taxonomy of §16.3 and the screen events of §5.2, and nothing else", () => {
    expect([...EVENT_NAMES].sort()).toEqual(
      [...TAXONOMY, ...SCREEN_ONLY].sort(),
    );
    expect(new Set(EVENT_NAMES).size).toBe(
      TAXONOMY.length + SCREEN_ONLY.length,
    );
  });

  it("names every event object-first in snake_case", () => {
    for (const name of EVENT_NAMES)
      expect(name).toMatch(/^[a-z]+(_[a-z0-9]+)+$/);
  });

  it("gives each event the props §16.3 names", () => {
    for (const name of EVENT_NAMES) {
      const named = PROPS[name] ?? [];
      const declared = Object.keys(EVENT_PROPS[name].shape);
      // `interest_expressed` also takes the two props of the §16.2 example.
      const extra =
        name === "interest_expressed" ? ["score", "position_in_deck"] : [];
      expect(declared.sort(), name).toEqual([...named, ...extra].sort());
    }
  });

  it("recognises registered names only", () => {
    expect(isEventName("deal_closed")).toBe(true);
    for (const value of ["not_registered", "toString", "", 7, null])
      expect(isEventName(value)).toBe(false);
  });
});

describe("trackEvent", () => {
  it("builds every registered event from valid props", () => {
    for (const name of EVENT_NAMES) {
      const schema = EVENT_PROPS[name];
      const props = schema.parse(validPropsOf(name));
      expect(props, name).toEqual(validPropsOf(name));
    }
    expect(Object.keys(VALID).sort()).toEqual(Object.keys(PROPS).sort());
  });

  it("returns a frozen, validated pair", () => {
    const event = trackEvent("offer_submitted", {
      amount_bucket: "45k-60k",
      round: 2,
    });
    expect(event).toEqual({
      event_name: "offer_submitted",
      props: { amount_bucket: "45k-60k", round: 2 },
    });
    expect(Object.isFrozen(event)).toBe(true);
    expect(trackEvent("app_opened")).toEqual({
      event_name: "app_opened",
      props: {},
    });
    expect(trackEvent("app_opened", {}).props).toEqual({});
  });

  it("is a TypeScript error for an unregistered name, and throws at run time", () => {
    // prettier-ignore
    // @ts-expect-error the name is not in the registry
    expect(() => trackEvent("not_registered")).toThrow("Event is not registered: not_registered");
    // prettier-ignore
    // @ts-expect-error inherited names are not events
    expect(() => trackEvent("toString")).toThrow("Event is not registered: toString");
  });

  it("is a TypeScript error for missing, unknown or mistyped props", () => {
    // prettier-ignore
    // @ts-expect-error props are required for this event
    expect(() => trackEvent("offer_submitted")).toThrow();
    // prettier-ignore
    // @ts-expect-error `round` is missing
    expect(() => trackEvent("offer_submitted", { amount_bucket: "45k-60k" })).toThrow();
    // prettier-ignore
    // @ts-expect-error `amount` is not a registered prop
    expect(() => trackEvent("offer_submitted", { amount_bucket: "45k-60k", round: 1, amount: 4200000 })).toThrow();
    // prettier-ignore
    // @ts-expect-error `side` must be DEMAND or SUPPLY
    expect(() => trackEvent("match_passed", { side: "BUYER" })).toThrow();
    // prettier-ignore
    // @ts-expect-error an event without props takes none
    expect(() => trackEvent("app_opened", { anything: 1 })).toThrow();
  });
});

describe("event privacy (§16.3)", () => {
  it("rejects a raw amount where a bucket is expected", () => {
    for (const raw of ["4200000", "45000", "0"]) {
      expect(
        EVENT_PROPS.offer_submitted.safeParse({ amount_bucket: raw, round: 1 })
          .success,
        raw,
      ).toBe(false);
    }
    for (const label of ["45k-60k", "<1k", "60k+", "1m-2m"]) {
      expect(
        EVENT_PROPS.offer_submitted.safeParse({
          amount_bucket: label,
          round: 1,
        }).success,
        label,
      ).toBe(true);
    }
  });

  it("rejects free text, phone numbers and emails in string props", () => {
    const free = [
      "ห้องมุม เงียบ ไม่ติดถนนใหญ่",
      "call me on 0812345678",
      "+66812345678",
      "someone@example.com",
      "88/123 Sukhumvit 71",
    ];
    for (const text of free) {
      expect(
        EVENT_PROPS.property_rejected.safeParse({ reason: text }).success,
        text,
      ).toBe(false);
      expect(
        EVENT_PROPS.fee_waived.safeParse({ reason_code: text }).success,
        text,
      ).toBe(false);
      expect(
        EVENT_PROPS.insights_viewed.safeParse({ panel: text }).success,
        text,
      ).toBe(false);
      expect(
        EVENT_PROPS.notification_opened.safeParse({ type: text }).success,
        text,
      ).toBe(false);
      expect(
        EVENT_PROPS.message_sent.safeParse({
          length_bucket: text,
          has_attachment: false,
        }).success,
        text,
      ).toBe(false);
    }
  });

  it("rejects a route that carries a query or a space", () => {
    for (const route of ["/deals/[id]", "/property/new", "/"])
      expect(
        EVENT_PROPS.error_shown.safeParse({ code: "INTERNAL", route }).success,
      ).toBe(true);
    for (const route of [
      "/search?q=0812345678",
      "deals",
      "/a b",
      "https://x.test/a",
    ])
      expect(
        EVENT_PROPS.error_shown.safeParse({ code: "INTERNAL", route }).success,
        route,
      ).toBe(false);
  });

  it("rejects any prop that is not registered, for every event", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...EVENT_NAMES),
        fc.string({ minLength: 1, maxLength: 12 }),
        fc.oneof(fc.string(), fc.integer(), fc.boolean()),
        (name, extraKey, extraValue) => {
          const schema = EVENT_PROPS[name];
          fc.pre(!Object.hasOwn(schema.shape, extraKey));
          fc.pre(extraKey !== "__proto__");
          const props = { ...validPropsOf(name), [extraKey]: extraValue };
          return schema.safeParse(props).success === false;
        },
      ),
      { numRuns: 2000 },
    );
  });
});

describe("event envelope (§16.2)", () => {
  it("parses the example and keeps every member", () => {
    const parsed = EventEnvelope.parse(fixtures.eventEnvelope);
    expect(parsed).toEqual(fixtures.eventEnvelope);
    expect(EventEnvelope.parse(JSON.parse(JSON.stringify(parsed)))).toEqual(
      fixtures.eventEnvelope,
    );
    expect(fixtures.eventEnvelope.schema_version).toBe(EVENT_SCHEMA_VERSION);
  });

  it("accepts an anonymous server event", () => {
    const event = {
      ...fixtures.eventEnvelope,
      event_name: "app_opened",
      user_id: null,
      session_id: null,
      role: null,
      subject_type: null,
      subject_id: null,
      props: {},
    };
    expect(EventEnvelope.parse(event)).toEqual(event);
  });

  it("checks the props against the registry", () => {
    const wrong = [
      { ...fixtures.eventEnvelope, event_name: "not_registered" },
      { ...fixtures.eventEnvelope, props: { side: "DEMAND" } },
      {
        ...fixtures.eventEnvelope,
        props: { ...fixtures.eventEnvelope.props, price: 4500000 },
      },
      { ...fixtures.eventEnvelope, event_name: "app_opened" },
      { ...fixtures.eventEnvelope, occurred_at: "2026-09-07 10:22" },
      { ...fixtures.eventEnvelope, source: "MOBILE" },
      { ...fixtures.eventEnvelope, role: "GUEST" },
    ];
    for (const event of wrong)
      expect(
        EventEnvelope.safeParse(event).success,
        JSON.stringify(event),
      ).toBe(false);
  });

  it("reports a props problem under `props`", () => {
    const result = EventEnvelope.safeParse({
      ...fixtures.eventEnvelope,
      props: { side: "DEMAND", action: "MAYBE" },
    });
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues[0]?.path).toEqual(["props", "action"]);
  });
});
