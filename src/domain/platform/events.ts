export const DOMAIN_EVENTS = [
  "signup_started",
  "signup_completed",
  "property_created",
  "property_published",
  "requirement_created",
  "match_generated",
  "interest_expressed",
  "mutual_match",
  "deal_room_opened",
  "viewing_requested",
  "viewing_confirmed",
  "viewing_completed",
  "offer_submitted",
  "offer_accepted",
  "agreement_signed",
  "deal_closed",
  "fee_generated",
  "fee_paid",
  "deal_cancelled",
  "message_sent",
] as const;
export type DomainEventName = (typeof DOMAIN_EVENTS)[number];
export const ANALYTICS_EVENTS = ["match_viewed", "property_viewed"] as const;
export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];
