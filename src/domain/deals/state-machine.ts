export const DEAL_STATES = [
  "MATCH_CREATED",
  "INTEREST_EXPRESSED",
  "MUTUAL_MATCH",
  "DEAL_ROOM_OPENED",
  "VIEWING_REQUESTED",
  "VIEWING_CONFIRMED",
  "VIEWING_COMPLETED",
  "OFFER_SUBMITTED",
  "COUNTER_OFFER",
  "NEGOTIATION",
  "AGREEMENT_PENDING",
  "AGREEMENT_SIGNED",
  "DEAL_CLOSED",
  "CANCELLED",
] as const;
export type DealState = (typeof DEAL_STATES)[number];
const transitions: Record<DealState, readonly DealState[]> = {
  MATCH_CREATED: ["INTEREST_EXPRESSED", "CANCELLED"],
  INTEREST_EXPRESSED: ["MUTUAL_MATCH", "CANCELLED"],
  MUTUAL_MATCH: ["DEAL_ROOM_OPENED", "CANCELLED"],
  DEAL_ROOM_OPENED: ["VIEWING_REQUESTED", "CANCELLED"],
  VIEWING_REQUESTED: ["VIEWING_CONFIRMED", "CANCELLED"],
  VIEWING_CONFIRMED: ["VIEWING_COMPLETED", "CANCELLED"],
  VIEWING_COMPLETED: ["OFFER_SUBMITTED", "CANCELLED"],
  OFFER_SUBMITTED: [
    "COUNTER_OFFER",
    "NEGOTIATION",
    "AGREEMENT_PENDING",
    "CANCELLED",
  ],
  COUNTER_OFFER: ["NEGOTIATION", "AGREEMENT_PENDING", "CANCELLED"],
  NEGOTIATION: ["COUNTER_OFFER", "AGREEMENT_PENDING", "CANCELLED"],
  AGREEMENT_PENDING: ["AGREEMENT_SIGNED", "CANCELLED"],
  AGREEMENT_SIGNED: ["DEAL_CLOSED", "CANCELLED"],
  DEAL_CLOSED: [],
  CANCELLED: [],
};
export function canTransition(from: DealState, to: DealState): boolean {
  return transitions[from].includes(to);
}
export function assertTransition(from: DealState, to: DealState): void {
  if (!canTransition(from, to))
    throw new Error(`Transition ${from} → ${to} is not allowed`);
}
