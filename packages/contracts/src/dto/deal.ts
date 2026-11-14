import { z } from "zod";
import {
  AgreementStatus,
  AgreementType,
  DealCancelReasonCode,
  DealStatus,
  MatchSide,
  MessageType,
  OfferStatus,
  OfferType,
  ParticipantRole,
  ViewingOutcome,
  ViewingStatus,
} from "./enums";
import {
  Code,
  Currency,
  DateOnly,
  DealId,
  DocumentId,
  LongText,
  MediumText,
  OpaqueId,
  OpenObject,
  openObject,
  PositiveSatang,
  ShortText,
  Timestamp,
  UserId,
  Version,
  ViewingSlotId,
  page,
  pageQuery,
} from "./primitives";
import { PropertySummaryDTO } from "./property";
import { dto } from "./registry";
import { RequirementSummaryDTO } from "./requirement";

// ---- Viewings --------------------------------------------------------------

export const ViewingSlotInput = dto(
  "ViewingSlotInput",
  z.object({ starts_at: Timestamp, ends_at: Timestamp }),
);

const attendee = z.object({ name: ShortText, role: ShortText });

// Derived from `viewings` and `viewing_slots` (§8.2.6); feedback stays with
// the party who gave it.
export const ViewingDTO = dto(
  "ViewingDTO",
  z.object({
    id: OpaqueId,
    status: ViewingStatus,
    slots: z.array(
      z.object({
        id: ViewingSlotId,
        starts_at: Timestamp,
        ends_at: Timestamp,
        selected: z.boolean(),
      }),
    ),
    scheduled_at: Timestamp.nullable(),
    duration_minutes: z.int().min(1).nullable(),
    location_note: z.string().nullable(),
    attendees: z.array(z.object({ name: z.string(), role: z.string() })),
    requested_by_user_id: UserId,
    confirmed_by_user_id: UserId.nullable(),
    completed_at: Timestamp.nullable(),
    version: Version,
  }),
);
export type ViewingDTO = z.infer<typeof ViewingDTO>;

// POST /api/deals/:id/viewings
export const ViewingCreateBody = dto(
  "ViewingCreateBody",
  z.object({
    slots: z.array(ViewingSlotInput).min(1).max(10),
    attendees: z.array(attendee).max(10),
    note: MediumText.optional(),
  }),
);
// POST …/viewings/:vid/confirm
export const ViewingConfirmBody = dto(
  "ViewingConfirmBody",
  z.object({ selected_slot_id: ViewingSlotId, location_note: MediumText }),
);
// POST …/viewings/:vid/reschedule
export const ViewingRescheduleBody = dto(
  "ViewingRescheduleBody",
  z.object({
    reason: MediumText.min(1),
    slots: z.array(ViewingSlotInput).min(1).max(10),
  }),
);
// POST …/viewings/:vid/complete
export const ViewingCompleteBody = dto(
  "ViewingCompleteBody",
  z.object({ outcome: ViewingOutcome, feedback: OpenObject.optional() }),
);
// POST …/viewings/:vid/cancel
export const ViewingCancelBody = dto(
  "ViewingCancelBody",
  z.object({ reason_code: Code, reason_text: MediumText }),
);

// ---- Offers ----------------------------------------------------------------

/**
 * The terms §18.7 shows for a lease. `terms` is JSONB (§8.2.6) and other
 * transaction types add their own, so unknown members are kept.
 */
export const OfferTerms = dto(
  "OfferTerms",
  z.looseObject({
    lease_months: z.int().min(1).optional(),
    deposit_months: z.number().min(0).optional(),
    advance_months: z.number().min(0).optional(),
    furniture_included: z.boolean().optional(),
    move_in_date: DateOnly.optional(),
  }),
);
export type OfferTerms = z.infer<typeof OfferTerms>;

// Derived from `offers` (§8.2.6).
export const OfferDTO = dto(
  "OfferDTO",
  z.object({
    id: OpaqueId,
    sequence: z.int().min(1),
    side: MatchSide,
    type: OfferType,
    amount: PositiveSatang,
    currency: Currency,
    terms: OfferTerms,
    status: OfferStatus,
    expires_at: Timestamp,
    parent_offer_id: OpaqueId.nullable(),
    offered_by_user_id: UserId,
    created_at: Timestamp,
  }),
);
export type OfferDTO = z.infer<typeof OfferDTO>;

// POST /api/deals/:id/offers
export const OfferCreateBody = dto(
  "OfferCreateBody",
  z.object({
    amount: PositiveSatang,
    currency: Currency,
    terms: OfferTerms,
    expires_at: Timestamp,
  }),
);
export type OfferCreateBody = z.infer<typeof OfferCreateBody>;

// POST …/offers/:oid/counter
export const OfferCounterBody = dto(
  "OfferCounterBody",
  z.object({
    amount: PositiveSatang,
    terms: OfferTerms,
    expires_at: Timestamp,
  }),
);
// POST …/offers/:oid/reject
export const OfferRejectBody = dto(
  "OfferRejectBody",
  z.object({ reason_code: Code }),
);

// ---- Agreement -------------------------------------------------------------

// Derived from `agreements` (§8.2.6).
export const AgreementDTO = dto(
  "AgreementDTO",
  z.object({
    id: OpaqueId,
    document_id: DocumentId,
    type: AgreementType,
    status: AgreementStatus,
    signers: z.array(
      z.object({
        user_id: UserId,
        method: Code,
        signed_at: Timestamp.nullable(),
      }),
    ),
    signed_at: Timestamp.nullable(),
  }),
);
export type AgreementDTO = z.infer<typeof AgreementDTO>;

// POST /api/deals/:id/agreement
export const AgreementCreateBody = dto(
  "AgreementCreateBody",
  z.object({
    document_id: DocumentId,
    type: AgreementType,
    signers: z
      .array(z.object({ user_id: UserId, method: Code }))
      .min(1)
      .max(10),
  }),
);
// POST /api/deals/:id/agreement/sign
export const AgreementSignBody = dto(
  "AgreementSignBody",
  z.object({ evidence_document_id: DocumentId }),
);

// ---- Messages (§12.1) ------------------------------------------------------

// Derived from `messages` (§8.2.6) and the ordering rule of §12.1.
export const MessageDTO = dto(
  "MessageDTO",
  z.object({
    id: OpaqueId,
    seq: z.int().min(0),
    type: MessageType,
    sender_user_id: UserId.nullable(),
    body: z.string(),
    attachments: z.array(DocumentId),
    redacted: z.boolean(),
    created_at: Timestamp,
  }),
);
export type MessageDTO = z.infer<typeof MessageDTO>;

// POST /api/deals/:id/messages
export const MessageCreateBody = dto(
  "MessageCreateBody",
  z.object({
    body: LongText.min(1),
    attachments: z.array(DocumentId).max(10).optional(),
  }),
);
// GET /api/deals/:id/messages?limit=50&before_seq=…
export const MessageListQuery = z.object({
  limit: pageQuery.limit,
  before_seq: z.coerce.number().int().min(0).optional(),
});
export const MessageListResponse = dto("MessageListResponse", page(MessageDTO));
// POST /api/deals/:id/messages/read
export const MessagesReadBody = dto(
  "MessagesReadBody",
  z.object({ up_to_seq: z.int().min(0) }),
);

// ---- DealDTO (§18.7) -------------------------------------------------------

/**
 * `contact` is present only once the deal room is open and only when the
 * caller is a participant.
 */
export const DealParticipant = dto(
  "DealParticipant",
  z.object({
    user_id: UserId,
    display_name: z.string(),
    role: ParticipantRole,
    can_negotiate: z.boolean(),
    can_close: z.boolean(),
    contact: z
      .object({
        phone: z.string().nullable(),
        line_id: z.string().nullable(),
      })
      .optional(),
  }),
);

/**
 * `allowed_transitions` is computed by the server from the state machine and
 * the caller's permissions; the client renders its buttons from it alone.
 */
export const DealDTO = dto(
  "DealDTO",
  z.object({
    id: DealId,
    reference_code: z.string(),
    status: DealStatus,
    version: Version,
    property: PropertySummaryDTO,
    requirement: RequirementSummaryDTO,
    participants: z.array(DealParticipant),
    current_viewing: ViewingDTO.nullable(),
    current_offer: OfferDTO.nullable(),
    allowed_transitions: z.array(DealStatus),
    unread_messages: z.int().min(0),
    opened_at: Timestamp,
    updated_at: Timestamp,
  }),
);
export type DealDTO = z.infer<typeof DealDTO>;

/** Derived: a subset of DealDTO for lists. It has no participants, so no contact. */
export const DealSummaryDTO = dto(
  "DealSummaryDTO",
  DealDTO.pick({
    id: true,
    reference_code: true,
    status: true,
    property: true,
    requirement: true,
    unread_messages: true,
    opened_at: true,
    updated_at: true,
  }),
);
export type DealSummaryDTO = z.infer<typeof DealSummaryDTO>;

// GET /api/deals?status=&limit=20
export const DealListQuery = z.object({
  status: DealStatus.optional(),
  ...pageQuery,
});
export const DealListResponse = dto("DealListResponse", page(DealSummaryDTO));

/** One merged timeline entry. §18.7 names it without giving its shape. */
export const TimelineItem = dto(
  "TimelineItem",
  openObject(),
  "A timeline entry: a transition, message, viewing or offer. Blueprint v1.0 does not give its shape.",
);
// GET /api/deals/:id/timeline?limit=50
export const TimelineQuery = z.object({ limit: pageQuery.limit });
export const TimelineResponse = dto(
  "TimelineResponse",
  z.object({ data: z.array(TimelineItem) }),
);

// ---- The transition endpoint -----------------------------------------------

/**
 * POST /api/deals/:id/transitions. What `payload` must hold depends on the
 * pair of states (§11.2); the state machine validates it.
 */
export const DealTransitionBody = dto(
  "DealTransitionBody",
  z.object({
    to: DealStatus,
    payload: OpenObject.optional(),
    reason: MediumText.nullable().optional(),
  }),
);
export type DealTransitionBody = z.infer<typeof DealTransitionBody>;

export const DealTransitionResponse = dto(
  "DealTransitionResponse",
  z.object({
    deal: DealDTO,
    transition: z.object({
      from: DealStatus,
      to: DealStatus,
      occurred_at: Timestamp,
    }),
    events_emitted: z.array(z.string()),
  }),
);
export type DealTransitionResponse = z.infer<typeof DealTransitionResponse>;

// POST …/offers/:oid/accept
export const OfferAcceptResponse = dto(
  "OfferAcceptResponse",
  z.object({ deal: DealDTO, agreement_required: z.boolean() }),
);

// ---- Close and cancel ------------------------------------------------------

// POST /api/deals/:id/close — the evidence document is optional (§11.2 #15).
export const DealCloseBody = dto(
  "DealCloseBody",
  z.object({
    transaction_value_amount: PositiveSatang,
    currency: Currency,
    closed_at: DateOnly,
    evidence_document_id: DocumentId.optional(),
  }),
);
export type DealCloseBody = z.infer<typeof DealCloseBody>;

export const DealCloseResponse = dto(
  "DealCloseResponse",
  z.object({
    deal: z.object({
      status: DealStatus,
      close_confirmations: z.array(
        z.object({ user_id: UserId, at: Timestamp }),
      ),
    }),
    awaiting_confirmation_from: z.array(UserId),
  }),
);

// POST /api/deals/:id/cancel
export const DealCancelBody = dto(
  "DealCancelBody",
  z.object({ reason_code: DealCancelReasonCode, reason_text: MediumText }),
);

// ---- SSE frames on /api/deals/:id/stream -----------------------------------

export const DEAL_STREAM_EVENTS = {
  "message.created": z.object({ message: MessageDTO }),
  "deal.transitioned": z.object({
    from: DealStatus,
    to: DealStatus,
    deal: DealDTO,
  }),
  "viewing.updated": z.object({ viewing: ViewingDTO }),
  "offer.updated": z.object({ offer: OfferDTO }),
  "participant.typing": z.object({ user_id: UserId, at: Timestamp }),
  // Sent every 25 seconds.
  heartbeat: z.object({ at: Timestamp }),
} as const;
export type DealStreamEventName = keyof typeof DEAL_STREAM_EVENTS;
