import { z } from "zod";
import * as d from "./dto/index";
import type { ErrorCode } from "./errors";

/**
 * The route table of Blueprint §18: every endpoint with the schemas of its
 * request and response. The OpenAPI document is generated from this table and
 * contract tests read the same entries, so a route cannot drift from its
 * documentation.
 *
 * Where §18 writes a bare `→ 200` or leaves a body out, the entry has no
 * `response` or `body` either (ADR-0016).
 */

export type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
export type RoutePath = `/api/${string}` | `/admin/api/${string}`;
export type RouteSection = keyof typeof ROUTE_SECTIONS;

/** The sub-sections of §18, used as the tags of the OpenAPI document. */
export const ROUTE_SECTIONS = {
  "18.1": "Auth & identity",
  "18.2": "Verification",
  "18.3": "Uploads & documents",
  "18.4": "Properties",
  "18.5": "Requirements",
  "18.6": "Matching",
  "18.7": "Deals",
  "18.8": "Fees, invoices, payments",
  "18.9": "Lilith AI",
  "18.10": "Insights, notifications, misc",
  "18.11": "Admin API",
} as const;

export interface RouteContract {
  readonly method: HttpMethod;
  readonly path: RoutePath;
  readonly section: RouteSection;
  readonly summary: string;
  /** Set on the few routes that need no session. */
  readonly auth?: "public";
  /** Set where the `Idempotency-Key` header is required, not just accepted. */
  readonly idempotencyKey?: "required";
  /** Set where the request must carry `If-Match: "<version>"`. */
  readonly ifMatch?: true;
  /** Schemas of the `:name` path segments; a segment left out is an opaque id. */
  readonly params?: z.ZodObject;
  readonly query?: z.ZodObject;
  readonly body?: z.ZodType;
  /** Success status; 200 when left out. */
  readonly status?: 201 | 202 | 204 | 302;
  readonly response?: z.ZodType;
  /** Server-sent event frames, by event name, for a `text/event-stream` route. */
  readonly stream?: Readonly<Record<string, z.ZodType>>;
  /** Codes this route can return beyond those every route of its kind returns. */
  readonly errors?: readonly ErrorCode[];
}

function route<const T extends RouteContract>(contract: T): T {
  return contract;
}

const AI_ERRORS = ["AI_UNAVAILABLE", "AI_BUDGET_EXCEEDED"] as const;
const TRANSITION_ERRORS = ["DEAL_TRANSITION_NOT_ALLOWED"] as const;

const propertyParams = z.object({ id: d.PropertyId });
const requirementParams = z.object({ id: d.RequirementId });
const matchParams = z.object({ id: d.MatchId });
const dealParams = z.object({ id: d.DealId });
const invoiceParams = z.object({ id: d.InvoiceId });
const aiRunParams = z.object({ id: d.AiRunId });
const userParams = z.object({ id: d.UserId });

export const ROUTES = {
  // ---- 18.1 Auth & identity -------------------------------------------------
  requestOtp: route({
    method: "POST",
    path: "/api/auth/otp/request",
    section: "18.1",
    summary: "Request a one-time code",
    auth: "public",
    body: d.OtpRequestBody,
    response: d.OtpRequestResponse,
  }),
  verifyOtp: route({
    method: "POST",
    path: "/api/auth/otp/verify",
    section: "18.1",
    summary: "Verify a one-time code and start a session",
    auth: "public",
    body: d.OtpVerifyBody,
    response: d.OtpVerifyResponse,
    errors: ["OTP_INVALID"],
  }),
  logout: route({
    method: "POST",
    path: "/api/auth/logout",
    section: "18.1",
    summary: "End the current session",
    status: 204,
  }),
  getMe: route({
    method: "GET",
    path: "/api/me",
    section: "18.1",
    summary: "Current user, roles, tier and flags",
    response: d.MeResponse,
  }),
  updateProfile: route({
    method: "PATCH",
    path: "/api/me/profile",
    section: "18.1",
    summary: "Update the profile",
    body: d.ProfilePatchBody,
    response: d.ProfileDTO,
  }),
  addRole: route({
    method: "POST",
    path: "/api/me/roles",
    section: "18.1",
    summary: "Add a role to the account",
    body: d.RoleAddBody,
    response: d.RolesResponse,
  }),
  getTrust: route({
    method: "GET",
    path: "/api/me/trust",
    section: "18.1",
    summary: "Tier, verifications and trust score",
    response: d.TrustResponse,
  }),
  listSessions: route({
    method: "GET",
    path: "/api/me/sessions",
    section: "18.1",
    summary: "List the user's sessions",
    response: d.SessionsResponse,
  }),
  revokeSession: route({
    method: "DELETE",
    path: "/api/me/sessions/:id",
    section: "18.1",
    summary: "Revoke one session",
    status: 204,
  }),
  requestDataExport: route({
    method: "POST",
    path: "/api/me/export",
    section: "18.1",
    summary: "Request an export of the user's data",
    status: 202,
    response: d.ExportResponse,
  }),
  requestAccountDeletion: route({
    method: "POST",
    path: "/api/me/delete",
    section: "18.1",
    summary: "Request deletion of the account",
    body: d.AccountDeleteBody,
    status: 202,
    response: d.AccountDeleteResponse,
  }),

  // ---- 18.2 Verification ----------------------------------------------------
  createVerification: route({
    method: "POST",
    path: "/api/verifications",
    section: "18.2",
    summary: "Submit a verification",
    body: d.VerificationCreateBody,
    status: 201,
    response: d.VerificationCreateResponse,
  }),
  listVerifications: route({
    method: "GET",
    path: "/api/verifications",
    section: "18.2",
    summary: "List the verifications of a subject",
    query: d.VerificationListQuery,
    response: d.VerificationListResponse,
  }),
  adminDecideVerification: route({
    method: "POST",
    path: "/admin/api/verifications/:id/decide",
    section: "18.2",
    summary: "Approve or reject a verification",
    body: d.VerificationDecideBody,
  }),

  // ---- 18.3 Uploads & documents ---------------------------------------------
  signUpload: route({
    method: "POST",
    path: "/api/uploads/sign",
    section: "18.3",
    summary: "Get a signed upload URL",
    body: d.UploadSignBody,
    response: d.UploadSignResponse,
  }),
  completeUpload: route({
    method: "POST",
    path: "/api/uploads/:documentId/complete",
    section: "18.3",
    summary: "Mark an upload as complete",
    params: z.object({ documentId: d.DocumentId }),
    response: d.UploadCompleteResponse,
  }),
  getDocumentUrl: route({
    method: "GET",
    path: "/api/documents/:id/url",
    section: "18.3",
    summary: "Get a signed URL to read a document",
    params: z.object({ id: d.DocumentId }),
    response: d.DocumentUrlResponse,
  }),

  // ---- 18.4 Properties ------------------------------------------------------
  createProperty: route({
    method: "POST",
    path: "/api/properties",
    section: "18.4",
    summary: "Create a draft listing",
    body: d.PropertyCreateBody,
    status: 201,
    response: d.PropertyCreateResponse,
  }),
  updateProperty: route({
    method: "PATCH",
    path: "/api/properties/:id",
    section: "18.4",
    summary: "Update wizard fields of a listing",
    ifMatch: true,
    params: propertyParams,
    body: d.PropertyPatchBody,
    response: d.PropertyPatchResponse,
  }),
  addPropertyMedia: route({
    method: "POST",
    path: "/api/properties/:id/media",
    section: "18.4",
    summary: "Attach uploaded media to a listing",
    params: propertyParams,
    body: d.PropertyMediaAddBody,
    response: d.PropertyMediaAddResponse,
  }),
  removePropertyMedia: route({
    method: "DELETE",
    path: "/api/properties/:id/media/:mediaId",
    section: "18.4",
    summary: "Remove one media item",
    params: z.object({ id: d.PropertyId, mediaId: d.OpaqueId }),
    status: 204,
  }),
  publishProperty: route({
    method: "POST",
    path: "/api/properties/:id/publish",
    section: "18.4",
    summary: "Publish a listing",
    params: propertyParams,
    body: d.PropertyPublishBody,
    response: d.PropertyPublishResponse,
    errors: ["PROPERTY_INCOMPLETE"],
  }),
  pauseProperty: route({
    method: "POST",
    path: "/api/properties/:id/pause",
    section: "18.4",
    summary: "Pause a listing",
    params: propertyParams,
    body: d.PropertyPauseBody,
  }),
  archiveProperty: route({
    method: "POST",
    path: "/api/properties/:id/archive",
    section: "18.4",
    summary: "Archive a listing",
    params: propertyParams,
    body: d.PropertyArchiveBody,
  }),
  getProperty: route({
    method: "GET",
    path: "/api/properties/:id",
    section: "18.4",
    summary: "Get a listing — public or private DTO by authorization",
    params: propertyParams,
    response: d.PropertyDetailResponse,
  }),
  listProperties: route({
    method: "GET",
    path: "/api/properties",
    section: "18.4",
    summary: "List listings",
    query: d.PropertyListQuery,
    response: d.PropertyListResponse,
  }),

  // ---- 18.5 Requirements ----------------------------------------------------
  createRequirement: route({
    method: "POST",
    path: "/api/requirements",
    section: "18.5",
    summary: "Create a draft requirement",
    body: d.RequirementCreateBody,
    status: 201,
    response: d.RequirementDTO,
  }),
  updateRequirement: route({
    method: "PATCH",
    path: "/api/requirements/:id",
    section: "18.5",
    summary: "Update wizard fields of a requirement",
    ifMatch: true,
    params: requirementParams,
    body: d.RequirementPatchBody,
    response: d.RequirementPatchResponse,
  }),
  activateRequirement: route({
    method: "POST",
    path: "/api/requirements/:id/activate",
    section: "18.5",
    summary: "Activate a requirement and start matching",
    params: requirementParams,
    response: d.RequirementActivateResponse,
  }),
  pauseRequirement: route({
    method: "POST",
    path: "/api/requirements/:id/pause",
    section: "18.5",
    summary: "Pause a requirement",
    params: requirementParams,
    body: d.RequirementPauseBody,
  }),
  listRequirements: route({
    method: "GET",
    path: "/api/requirements",
    section: "18.5",
    summary: "List requirements",
    query: d.RequirementListQuery,
    response: d.RequirementListResponse,
  }),
  getRequirement: route({
    method: "GET",
    path: "/api/requirements/:id",
    section: "18.5",
    summary: "Get a requirement",
    params: requirementParams,
    response: d.RequirementDTO,
  }),

  // ---- 18.6 Matching --------------------------------------------------------
  getMatchFeed: route({
    method: "GET",
    path: "/api/matches/feed",
    section: "18.6",
    summary: "Match feed of a requirement",
    query: d.MatchFeedQuery,
    response: d.MatchFeedResponse,
  }),
  getMatchExplanation: route({
    method: "GET",
    path: "/api/matches/:id/explanation",
    section: "18.6",
    summary: "Why this match: score, reasons and explanation",
    params: matchParams,
    response: d.MatchExplanationResponse,
  }),
  expressInterest: route({
    method: "POST",
    path: "/api/matches/:id/interest",
    section: "18.6",
    summary: "Express interest, or use a super match",
    idempotencyKey: "required",
    params: matchParams,
    body: d.MatchInterestBody,
    response: d.MatchInterestResponse,
    errors: ["SUPER_MATCH_QUOTA_EXCEEDED"],
  }),
  passMatch: route({
    method: "POST",
    path: "/api/matches/:id/pass",
    section: "18.6",
    summary: "Pass on a match, with a reason",
    params: matchParams,
    body: d.MatchPassBody,
  }),
  listMatches: route({
    method: "GET",
    path: "/api/matches",
    section: "18.6",
    summary: "Match inbox",
    query: d.MatchListQuery,
    response: d.MatchListResponse,
  }),
  getMatch: route({
    method: "GET",
    path: "/api/matches/:id",
    section: "18.6",
    summary: "Get a match",
    params: matchParams,
    response: d.MatchDetailResponse,
  }),

  // ---- 18.7 Deals -----------------------------------------------------------
  listDeals: route({
    method: "GET",
    path: "/api/deals",
    section: "18.7",
    summary: "List deals",
    query: d.DealListQuery,
    response: d.DealListResponse,
  }),
  getDeal: route({
    method: "GET",
    path: "/api/deals/:id",
    section: "18.7",
    summary: "Get a deal",
    params: dealParams,
    response: d.DealDTO,
  }),
  getDealTimeline: route({
    method: "GET",
    path: "/api/deals/:id/timeline",
    section: "18.7",
    summary: "Merged timeline of transitions, messages, viewings and offers",
    params: dealParams,
    query: d.TimelineQuery,
    response: d.TimelineResponse,
  }),
  streamDeal: route({
    method: "GET",
    path: "/api/deals/:id/stream",
    section: "18.7",
    summary: "Live deal events (server-sent events)",
    params: dealParams,
    stream: d.DEAL_STREAM_EVENTS,
  }),
  transitionDeal: route({
    method: "POST",
    path: "/api/deals/:id/transitions",
    section: "18.7",
    summary:
      "The single transition endpoint — every state change goes through it",
    idempotencyKey: "required",
    ifMatch: true,
    params: dealParams,
    body: d.DealTransitionBody,
    response: d.DealTransitionResponse,
    errors: TRANSITION_ERRORS,
  }),
  sendMessage: route({
    method: "POST",
    path: "/api/deals/:id/messages",
    section: "18.7",
    summary: "Send a message in the deal room",
    params: dealParams,
    body: d.MessageCreateBody,
    status: 201,
    response: d.MessageDTO,
  }),
  listMessages: route({
    method: "GET",
    path: "/api/deals/:id/messages",
    section: "18.7",
    summary: "List messages of the deal room",
    params: dealParams,
    query: d.MessageListQuery,
    response: d.MessageListResponse,
  }),
  markMessagesRead: route({
    method: "POST",
    path: "/api/deals/:id/messages/read",
    section: "18.7",
    summary: "Mark messages as read up to a sequence number",
    params: dealParams,
    body: d.MessagesReadBody,
    status: 204,
  }),
  requestViewing: route({
    method: "POST",
    path: "/api/deals/:id/viewings",
    section: "18.7",
    summary: "Request a viewing",
    idempotencyKey: "required",
    params: dealParams,
    body: d.ViewingCreateBody,
    status: 201,
    response: d.ViewingDTO,
    errors: TRANSITION_ERRORS,
  }),
  confirmViewing: route({
    method: "POST",
    path: "/api/deals/:id/viewings/:vid/confirm",
    section: "18.7",
    summary: "Confirm a viewing slot",
    idempotencyKey: "required",
    params: z.object({ id: d.DealId, vid: d.OpaqueId }),
    body: d.ViewingConfirmBody,
    errors: TRANSITION_ERRORS,
  }),
  rescheduleViewing: route({
    method: "POST",
    path: "/api/deals/:id/viewings/:vid/reschedule",
    section: "18.7",
    summary: "Reschedule a viewing",
    idempotencyKey: "required",
    params: z.object({ id: d.DealId, vid: d.OpaqueId }),
    body: d.ViewingRescheduleBody,
    errors: TRANSITION_ERRORS,
  }),
  completeViewing: route({
    method: "POST",
    path: "/api/deals/:id/viewings/:vid/complete",
    section: "18.7",
    summary: "Record the outcome of a viewing",
    idempotencyKey: "required",
    params: z.object({ id: d.DealId, vid: d.OpaqueId }),
    body: d.ViewingCompleteBody,
    errors: TRANSITION_ERRORS,
  }),
  cancelViewing: route({
    method: "POST",
    path: "/api/deals/:id/viewings/:vid/cancel",
    section: "18.7",
    summary: "Cancel a viewing",
    idempotencyKey: "required",
    params: z.object({ id: d.DealId, vid: d.OpaqueId }),
    body: d.ViewingCancelBody,
    errors: TRANSITION_ERRORS,
  }),
  submitOffer: route({
    method: "POST",
    path: "/api/deals/:id/offers",
    section: "18.7",
    summary: "Submit an offer",
    idempotencyKey: "required",
    params: dealParams,
    body: d.OfferCreateBody,
    status: 201,
    response: d.OfferDTO,
    errors: TRANSITION_ERRORS,
  }),
  counterOffer: route({
    method: "POST",
    path: "/api/deals/:id/offers/:oid/counter",
    section: "18.7",
    summary: "Counter an offer",
    idempotencyKey: "required",
    params: z.object({ id: d.DealId, oid: d.OpaqueId }),
    body: d.OfferCounterBody,
    status: 201,
    errors: TRANSITION_ERRORS,
  }),
  acceptOffer: route({
    method: "POST",
    path: "/api/deals/:id/offers/:oid/accept",
    section: "18.7",
    summary: "Accept an offer",
    idempotencyKey: "required",
    params: z.object({ id: d.DealId, oid: d.OpaqueId }),
    response: d.OfferAcceptResponse,
    errors: TRANSITION_ERRORS,
  }),
  rejectOffer: route({
    method: "POST",
    path: "/api/deals/:id/offers/:oid/reject",
    section: "18.7",
    summary: "Reject an offer",
    idempotencyKey: "required",
    params: z.object({ id: d.DealId, oid: d.OpaqueId }),
    body: d.OfferRejectBody,
    errors: TRANSITION_ERRORS,
  }),
  withdrawOffer: route({
    method: "POST",
    path: "/api/deals/:id/offers/:oid/withdraw",
    section: "18.7",
    summary: "Withdraw an offer",
    idempotencyKey: "required",
    params: z.object({ id: d.DealId, oid: d.OpaqueId }),
    errors: TRANSITION_ERRORS,
  }),
  createAgreement: route({
    method: "POST",
    path: "/api/deals/:id/agreement",
    section: "18.7",
    summary: "Attach the agreement and name its signers",
    idempotencyKey: "required",
    params: dealParams,
    body: d.AgreementCreateBody,
    status: 201,
    response: d.AgreementDTO,
    errors: TRANSITION_ERRORS,
  }),
  signAgreement: route({
    method: "POST",
    path: "/api/deals/:id/agreement/sign",
    section: "18.7",
    summary: "Record a signature on the agreement",
    idempotencyKey: "required",
    params: dealParams,
    body: d.AgreementSignBody,
    errors: TRANSITION_ERRORS,
  }),
  closeDeal: route({
    method: "POST",
    path: "/api/deals/:id/close",
    section: "18.7",
    summary: "Confirm the closing — both sides must enter the same value",
    idempotencyKey: "required",
    params: dealParams,
    body: d.DealCloseBody,
    response: d.DealCloseResponse,
    errors: ["CLOSE_VALUE_MISMATCH", ...TRANSITION_ERRORS],
  }),
  cancelDeal: route({
    method: "POST",
    path: "/api/deals/:id/cancel",
    section: "18.7",
    summary: "Cancel a deal, with a reason",
    idempotencyKey: "required",
    params: dealParams,
    body: d.DealCancelBody,
    errors: TRANSITION_ERRORS,
  }),

  // ---- 18.8 Fees, invoices, payments ----------------------------------------
  getDealFee: route({
    method: "GET",
    path: "/api/deals/:id/fee",
    section: "18.8",
    summary: "Fee, invoice, payments and receipt of a deal",
    params: dealParams,
    response: d.DealFeeResponse,
  }),
  getInvoice: route({
    method: "GET",
    path: "/api/invoices/:id",
    section: "18.8",
    summary: "Get an invoice",
    params: invoiceParams,
    response: d.InvoiceDTO,
  }),
  getInvoicePdf: route({
    method: "GET",
    path: "/api/invoices/:id/pdf",
    section: "18.8",
    summary: "Redirect to the signed URL of the invoice PDF",
    params: invoiceParams,
    status: 302,
  }),
  recordPayment: route({
    method: "POST",
    path: "/api/invoices/:id/payments",
    section: "18.8",
    summary: "Record a payment; an operator confirms it",
    idempotencyKey: "required",
    params: invoiceParams,
    body: d.PaymentCreateBody,
    status: 201,
    response: d.PaymentCreateResponse,
  }),
  getReceiptPdf: route({
    method: "GET",
    path: "/api/receipts/:id/pdf",
    section: "18.8",
    summary: "Redirect to the signed URL of the receipt PDF",
    status: 302,
  }),
  adminConfirmPayment: route({
    method: "POST",
    path: "/admin/api/payments/:id/confirm",
    section: "18.8",
    summary: "Confirm a recorded payment",
    idempotencyKey: "required",
  }),
  adminWaiveFee: route({
    method: "POST",
    path: "/admin/api/fees/:id/waive",
    section: "18.8",
    summary: "Waive a fee (dual control)",
    params: z.object({ id: d.FeeId }),
    body: d.ReasonBody,
  }),
  adminVoidInvoice: route({
    method: "POST",
    path: "/admin/api/invoices/:id/void",
    section: "18.8",
    summary: "Void an invoice",
    params: invoiceParams,
    body: d.ReasonBody,
  }),

  // ---- 18.9 Lilith AI -------------------------------------------------------
  aiExtractProperty: route({
    method: "POST",
    path: "/api/ai/extract-property",
    section: "18.9",
    summary: "Extract listing fields from free text",
    body: d.AiExtractPropertyBody,
    response: d.AiExtractPropertyResponse,
    errors: AI_ERRORS,
  }),
  aiExtractRequirement: route({
    method: "POST",
    path: "/api/ai/extract-requirement",
    section: "18.9",
    summary: "Extract requirement fields from free text",
    body: d.AiExtractRequirementBody,
    response: d.AiExtractRequirementResponse,
    errors: AI_ERRORS,
  }),
  aiNormalize: route({
    method: "POST",
    path: "/api/ai/normalize",
    section: "18.9",
    summary: "Normalise project names, amenities or locations",
    body: d.AiNormalizeBody,
    response: d.AiNormalizeResponse,
    errors: AI_ERRORS,
  }),
  aiExplainMatch: route({
    method: "POST",
    path: "/api/ai/explain-match",
    section: "18.9",
    summary: "Write the explanation paragraph of a match",
    body: d.AiExplainMatchBody,
    response: d.AiExplainMatchResponse,
    errors: AI_ERRORS,
  }),
  aiDealSummary: route({
    method: "POST",
    path: "/api/ai/deal-summary",
    section: "18.9",
    summary: "Summarise a deal with open items, actions and risks",
    body: d.AiDealSummaryBody,
    response: d.AiDealSummaryResponse,
    errors: AI_ERRORS,
  }),
  aiDetectDuplicate: route({
    method: "POST",
    path: "/api/ai/detect-duplicate",
    section: "18.9",
    summary: "Find likely duplicates of a listing",
    body: d.AiPropertyBody,
    response: d.AiDetectDuplicateResponse,
    errors: AI_ERRORS,
  }),
  aiPropertyReview: route({
    method: "POST",
    path: "/api/ai/property-review",
    section: "18.9",
    summary: "Review a listing before publishing",
    body: d.AiPropertyBody,
    response: d.AiPropertyReviewResponse,
    errors: AI_ERRORS,
  }),
  aiRequirementSummary: route({
    method: "POST",
    path: "/api/ai/requirement-summary",
    section: "18.9",
    summary: "Summarise a requirement (named in §18.12; no contract in §18.9)",
    body: d.AiRequirementSummaryBody,
    response: d.AiRequirementSummaryResponse,
    errors: AI_ERRORS,
  }),
  aiRunFeedback: route({
    method: "POST",
    path: "/api/ai/runs/:id/feedback",
    section: "18.9",
    summary: "Rate an AI result",
    params: aiRunParams,
    body: d.AiFeedbackBody,
    status: 204,
  }),
  aiRunOverride: route({
    method: "POST",
    path: "/api/ai/runs/:id/override",
    section: "18.9",
    summary: "Override one AI-filled field",
    params: aiRunParams,
    body: d.AiOverrideBody,
  }),

  // ---- 18.10 Insights, notifications, misc ----------------------------------
  getInsightsOverview: route({
    method: "GET",
    path: "/api/insights/overview",
    section: "18.10",
    summary: "Property intelligence panels",
    query: d.InsightsQuery,
    response: d.InsightsResponse,
  }),
  listNotifications: route({
    method: "GET",
    path: "/api/notifications",
    section: "18.10",
    summary: "List notifications",
    query: d.NotificationListQuery,
    response: d.NotificationListResponse,
  }),
  markNotificationRead: route({
    method: "POST",
    path: "/api/notifications/:id/read",
    section: "18.10",
    summary: "Mark one notification as read",
    status: 204,
  }),
  markAllNotificationsRead: route({
    method: "POST",
    path: "/api/notifications/read-all",
    section: "18.10",
    summary: "Mark every notification as read",
    status: 204,
  }),
  getNotificationPreferences: route({
    method: "GET",
    path: "/api/notifications/preferences",
    section: "18.10",
    summary: "Get notification preferences",
    response: d.NotificationPrefsBody,
  }),
  putNotificationPreferences: route({
    method: "PUT",
    path: "/api/notifications/preferences",
    section: "18.10",
    summary: "Replace notification preferences",
    body: d.NotificationPrefsBody,
  }),
  subscribePush: route({
    method: "POST",
    path: "/api/push/subscribe",
    section: "18.10",
    summary: "Register a web-push subscription",
    body: d.PushSubscribeBody,
    status: 204,
  }),
  searchGeo: route({
    method: "GET",
    path: "/api/geo/search",
    section: "18.10",
    summary: "Search locations",
    query: d.GeoSearchQuery,
    response: d.GeoSearchResponse,
  }),
  listStations: route({
    method: "GET",
    path: "/api/geo/stations",
    section: "18.10",
    summary: "Transit stations near a point",
    query: d.StationsQuery,
    response: d.StationsResponse,
  }),
  listAmenities: route({
    method: "GET",
    path: "/api/amenities",
    section: "18.10",
    summary: "Amenity catalogue",
    response: d.AmenitiesResponse,
  }),
  getHealth: route({
    method: "GET",
    path: "/api/health",
    section: "18.10",
    summary: "Health of the service and its dependencies",
    auth: "public",
    response: d.HealthResponse,
  }),

  // ---- 18.11 Admin API (excerpt) --------------------------------------------
  adminListQueue: route({
    method: "GET",
    path: "/admin/api/queues/:queue",
    section: "18.11",
    summary: "Items of a moderation queue",
    params: z.object({ queue: d.ModerationQueue }),
    query: d.QueueListQuery,
    response: d.QueueListResponse,
  }),
  adminDecideQueueItem: route({
    method: "POST",
    path: "/admin/api/queues/items/:id/decide",
    section: "18.11",
    summary: "Decide a queue item",
    body: d.QueueDecideBody,
  }),
  adminGetUserTimeline: route({
    method: "GET",
    path: "/admin/api/users/:id/timeline",
    section: "18.11",
    summary: "Timeline of a user",
    params: userParams,
    response: d.TimelineResponse,
  }),
  adminSuspendUser: route({
    method: "POST",
    path: "/admin/api/users/:id/suspend",
    section: "18.11",
    summary: "Suspend a user",
    params: userParams,
    body: d.UserSuspendBody,
  }),
  adminForceUnpublishProperty: route({
    method: "POST",
    path: "/admin/api/properties/:id/force-unpublish",
    section: "18.11",
    summary: "Unpublish a listing",
    params: propertyParams,
    body: d.ReasonBody,
  }),
  adminForceTransitionDeal: route({
    method: "POST",
    path: "/admin/api/deals/:id/force-transition",
    section: "18.11",
    summary: "Move a deal to a state, with a reason",
    idempotencyKey: "required",
    params: dealParams,
    body: d.ForceTransitionBody,
    errors: TRANSITION_ERRORS,
  }),
  adminListWeightProfiles: route({
    method: "GET",
    path: "/admin/api/weight-profiles",
    section: "18.11",
    summary: "List weight profiles",
  }),
  adminShadowScoreWeightProfile: route({
    method: "POST",
    path: "/admin/api/weight-profiles/:id/shadow-score",
    section: "18.11",
    summary: "Start a shadow-scoring run",
    body: d.ShadowScoreBody,
    status: 202,
    response: d.ShadowScoreResponse,
  }),
  adminGetShadowReport: route({
    method: "GET",
    path: "/admin/api/weight-profiles/:id/shadow-report",
    section: "18.11",
    summary: "Report of the shadow-scoring run",
    response: d.ShadowReportResponse,
  }),
  adminPublishWeightProfile: route({
    method: "POST",
    path: "/admin/api/weight-profiles/:id/publish",
    section: "18.11",
    summary: "Publish a weight profile and enqueue a rescore",
    body: d.ReasonBody,
  }),
  adminCreateFeeRule: route({
    method: "POST",
    path: "/admin/api/fee-rules",
    section: "18.11",
    summary: "Create a fee rule",
    body: d.FeeRuleCreateBody,
    status: 201,
  }),
  adminPublishFeeRule: route({
    method: "POST",
    path: "/admin/api/fee-rules/:id/publish",
    section: "18.11",
    summary: "Publish a fee rule (dual control)",
  }),
  adminActivatePromptVersion: route({
    method: "POST",
    path: "/admin/api/prompt-versions/:id/activate",
    section: "18.11",
    summary: "Activate a prompt version (requires a passing eval report)",
  }),
  adminListAudit: route({
    method: "GET",
    path: "/admin/api/audit",
    section: "18.11",
    summary: "Search the audit log",
    query: d.AuditQuery,
    response: d.AuditListResponse,
  }),
  adminGetDailyReconciliation: route({
    method: "GET",
    path: "/admin/api/reconciliation/daily",
    section: "18.11",
    summary: "Daily reconciliation of fees, invoices and payments",
    query: d.ReconciliationQuery,
    response: d.ReconciliationResponse,
  }),
} as const satisfies Record<string, RouteContract>;

export type RouteId = keyof typeof ROUTES;

export const ROUTE_IDS = Object.keys(ROUTES) as RouteId[];

// ---- Rules that follow from §18.0 ------------------------------------------

export type RouteAuth = "public" | "session" | "admin";

export function routeAuth(contract: RouteContract): RouteAuth {
  if (contract.auth === "public") return "public";
  return contract.path.startsWith("/admin/api/") ? "admin" : "session";
}

export function routeStatus(contract: RouteContract): number {
  return contract.status ?? 200;
}

/** Names of the `:name` segments of the path, in order. */
export function routeParamNames(contract: RouteContract): string[] {
  return [...contract.path.matchAll(/:([A-Za-z][A-Za-z0-9]*)/g)].map(
    (match) => match[1] as string,
  );
}

/**
 * Every mutating request accepts `Idempotency-Key`; offers, transitions and
 * payments require it (§18.0).
 */
export function routeIdempotency(
  contract: RouteContract,
): "required" | "accepted" | "none" {
  if (contract.idempotencyKey === "required") return "required";
  return contract.method === "GET" ? "none" : "accepted";
}

/** Every error code the route can answer with, canonical ones included. */
export function routeErrorCodes(contract: RouteContract): ErrorCode[] {
  const codes = new Set<ErrorCode>(["RATE_LIMITED", "INTERNAL"]);
  if (routeAuth(contract) !== "public") {
    codes.add("UNAUTHENTICATED");
    codes.add("FORBIDDEN");
    codes.add("TIER_INSUFFICIENT");
  }
  if (routeParamNames(contract).length > 0) codes.add("NOT_FOUND");
  if (contract.body !== undefined || contract.query !== undefined)
    codes.add("VALIDATION_FAILED");
  if (contract.ifMatch === true) codes.add("CONFLICT_VERSION");
  for (const code of contract.errors ?? []) codes.add(code);
  return [...codes];
}
