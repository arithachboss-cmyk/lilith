import { z } from "zod";
import { dto } from "./registry";

/**
 * Closed vocabularies of the contract. Values come from Blueprint §8 unless a
 * comment names another section.
 */
function vocabulary<const T extends readonly [string, ...string[]]>(
  id: string,
  values: T,
) {
  return dto(id, z.enum(values));
}

// ---- Identity (§8.2.1) -----------------------------------------------------

export const Role = vocabulary("Role", [
  "OWNER",
  "AGENT",
  "CLIENT",
  "ADMIN",
  "SUPPORT",
]);
export type Role = z.infer<typeof Role>;

/** Roles a user may add to their own account (§18.1: admin roles are granted admin-side). */
export const SelfServiceRole = vocabulary("SelfServiceRole", [
  "OWNER",
  "AGENT",
  "CLIENT",
]);
export type SelfServiceRole = z.infer<typeof SelfServiceRole>;

/** Wire form of the tier, as §8 and §18.1 write it. §3.3 names them `T0_UNVERIFIED` … `T4_OWNERSHIP`. */
export const VerificationTier = vocabulary("VerificationTier", [
  "T0",
  "T1",
  "T2",
  "T3",
  "T4",
]);
export type VerificationTier = z.infer<typeof VerificationTier>;

export const OtpChannel = vocabulary("OtpChannel", ["SMS", "EMAIL"]);
export type OtpChannel = z.infer<typeof OtpChannel>;

export const OtpPurpose = vocabulary("OtpPurpose", [
  "SIGNUP",
  "LOGIN",
  "PHONE_CHANGE",
]);
export type OtpPurpose = z.infer<typeof OtpPurpose>;

// §18.1
export const NextStep = vocabulary("NextStep", [
  "SELECT_ROLE",
  "PROFILE",
  "VERIFY_IDENTITY",
  "HOME",
]);
export type NextStep = z.infer<typeof NextStep>;

export const VerificationSubjectType = vocabulary("VerificationSubjectType", [
  "USER",
  "AGENT",
  "ORG",
  "PROPERTY",
  "DOCUMENT",
]);
export type VerificationSubjectType = z.infer<typeof VerificationSubjectType>;

export const VerificationKind = vocabulary("VerificationKind", [
  "PHONE",
  "EMAIL",
  "NATIONAL_ID",
  "PASSPORT",
  "LICENCE",
  "COMPANY_DOC",
  "TITLE_DEED",
  "LEASE_AUTHORITY",
]);
export type VerificationKind = z.infer<typeof VerificationKind>;

export const VerificationStatus = vocabulary("VerificationStatus", [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "EXPIRED",
]);
export type VerificationStatus = z.infer<typeof VerificationStatus>;

export const DocumentClassification = vocabulary("DocumentClassification", [
  "PUBLIC",
  "INTERNAL",
  "SENSITIVE",
]);
export type DocumentClassification = z.infer<typeof DocumentClassification>;

// §18.3
export const UploadPurpose = vocabulary("UploadPurpose", [
  "PROPERTY_PHOTO",
  "PROPERTY_DOCUMENT",
  "MESSAGE_ATTACHMENT",
  "VERIFICATION",
  "AVATAR",
]);
export type UploadPurpose = z.infer<typeof UploadPurpose>;

// ---- Geography (§8.2.2) ----------------------------------------------------

export const LocationLevel = vocabulary("LocationLevel", [
  "COUNTRY",
  "PROVINCE",
  "DISTRICT",
  "SUBDISTRICT",
  "AREA",
  "PROJECT",
]);
export type LocationLevel = z.infer<typeof LocationLevel>;

export const TransitSystem = vocabulary("TransitSystem", [
  "BTS",
  "MRT",
  "ARL",
  "SRT",
  "BRT",
]);
export type TransitSystem = z.infer<typeof TransitSystem>;

// ---- Supply (§8.2.3) -------------------------------------------------------

export const PropertyStatus = vocabulary("PropertyStatus", [
  "DRAFT",
  "PENDING_REVIEW",
  "PUBLISHED",
  "PAUSED",
  "UNDER_OFFER",
  "TRANSACTED",
  "ARCHIVED",
  "REJECTED",
]);
export type PropertyStatus = z.infer<typeof PropertyStatus>;

export const PropertyTransactionType = vocabulary("PropertyTransactionType", [
  "SALE",
  "RENT",
  "RENT_TO_OWN",
  "INVESTMENT",
]);
export type PropertyTransactionType = z.infer<typeof PropertyTransactionType>;

export const PropertyType = vocabulary("PropertyType", [
  "CONDO",
  "APARTMENT",
  "HOUSE",
  "TOWNHOUSE",
  "LAND",
  "OFFICE",
  "RETAIL",
  "WAREHOUSE",
]);
export type PropertyType = z.infer<typeof PropertyType>;

export const Furnishing = vocabulary("Furnishing", [
  "UNFURNISHED",
  "PARTIAL",
  "FULLY",
]);
export type Furnishing = z.infer<typeof Furnishing>;

export const PetPolicy = vocabulary("PetPolicy", [
  "NOT_ALLOWED",
  "SMALL_PETS",
  "ALLOWED",
  "NEGOTIABLE",
]);
export type PetPolicy = z.infer<typeof PetPolicy>;

export const MediaKind = vocabulary("MediaKind", [
  "PHOTO",
  "FLOORPLAN",
  "VIDEO",
  "TOUR_360",
]);
export type MediaKind = z.infer<typeof MediaKind>;

export const PropertyDocumentKind = vocabulary("PropertyDocumentKind", [
  "TITLE_DEED",
  "ID_CARD",
  "COMPANY_CERT",
  "LEASE_AUTHORITY",
  "FLOORPLAN_PDF",
  "OTHER",
]);
export type PropertyDocumentKind = z.infer<typeof PropertyDocumentKind>;

export const DocumentVisibility = vocabulary("DocumentVisibility", [
  "OWNER_ONLY",
  "DEAL_PARTICIPANTS",
  "ADMIN_ONLY",
]);
export type DocumentVisibility = z.infer<typeof DocumentVisibility>;

export const AmenityCategory = vocabulary("AmenityCategory", [
  "BUILDING",
  "UNIT",
  "NEARBY",
]);
export type AmenityCategory = z.infer<typeof AmenityCategory>;

export const MandateType = vocabulary("MandateType", [
  "EXCLUSIVE",
  "OPEN",
  "CO_AGENCY",
]);
export type MandateType = z.infer<typeof MandateType>;

export const MandateStatus = vocabulary("MandateStatus", [
  "PENDING",
  "ACTIVE",
  "EXPIRED",
  "REVOKED",
]);
export type MandateStatus = z.infer<typeof MandateStatus>;

// ---- Demand (§8.2.4) -------------------------------------------------------

export const RequirementStatus = vocabulary("RequirementStatus", [
  "DRAFT",
  "ACTIVE",
  "PAUSED",
  "FULFILLED",
  "EXPIRED",
  "ARCHIVED",
]);
export type RequirementStatus = z.infer<typeof RequirementStatus>;

export const RequirementTransactionType = vocabulary(
  "RequirementTransactionType",
  ["BUY", "RENT", "RENT_TO_OWN", "INVEST"],
);
export type RequirementTransactionType = z.infer<
  typeof RequirementTransactionType
>;

/** `furnishing_pref` is "ENUM + ANY" in §8.2.4. */
export const FurnishingPreference = vocabulary("FurnishingPreference", [
  "UNFURNISHED",
  "PARTIAL",
  "FULLY",
  "ANY",
]);
export type FurnishingPreference = z.infer<typeof FurnishingPreference>;

export const PetRequirement = vocabulary("PetRequirement", [
  "NONE",
  "SMALL_PET",
  "LARGE_PET",
]);
export type PetRequirement = z.infer<typeof PetRequirement>;

export const Urgency = vocabulary("Urgency", [
  "IMMEDIATE",
  "WITHIN_1M",
  "WITHIN_3M",
  "EXPLORING",
]);
export type Urgency = z.infer<typeof Urgency>;

export const Importance = vocabulary("Importance", ["MUST", "NICE", "BONUS"]);
export type Importance = z.infer<typeof Importance>;

// ---- Matching (§8.2.5, §9.6, §18.6) ----------------------------------------

export const MatchStatus = vocabulary("MatchStatus", [
  "GENERATED",
  "VIEWED",
  "PASSED_BY_DEMAND",
  "PASSED_BY_SUPPLY",
  "INTERESTED_BY_DEMAND",
  "INTERESTED_BY_SUPPLY",
  "MUTUAL",
  "EXPIRED",
  "SUPPRESSED",
]);
export type MatchStatus = z.infer<typeof MatchStatus>;

/** The four bands shown in the UI (§9.6); scores under 45 are not shown. */
export const MatchBand = vocabulary("MatchBand", [
  "EXCEPTIONAL",
  "STRONG",
  "FAIR",
  "COMPROMISE",
]);
export type MatchBand = z.infer<typeof MatchBand>;

export const ReasonKind = vocabulary("ReasonKind", [
  "MATCHED",
  "TRADEOFF",
  "UNMATCHED",
]);
export type ReasonKind = z.infer<typeof ReasonKind>;

export const ReasonSource = vocabulary("ReasonSource", ["RULE", "AI"]);
export type ReasonSource = z.infer<typeof ReasonSource>;

export const MatchSide = vocabulary("MatchSide", ["DEMAND", "SUPPLY"]);
export type MatchSide = z.infer<typeof MatchSide>;

export const InterestAction = vocabulary("InterestAction", [
  "INTERESTED",
  "SUPER",
  "PASS",
]);
export type InterestAction = z.infer<typeof InterestAction>;

export const PassReasonCode = vocabulary("PassReasonCode", [
  "TOO_EXPENSIVE",
  "LOCATION",
  "SIZE",
  "PHOTOS",
  "OTHER",
]);
export type PassReasonCode = z.infer<typeof PassReasonCode>;

// ---- Deal (§8.2.6, §11.1, §18.7) -------------------------------------------

/** The 14 states of the deal state machine (§11.1). */
export const DealStatus = vocabulary("DealStatus", [
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
]);
export type DealStatus = z.infer<typeof DealStatus>;

export const ParticipantRole = vocabulary("ParticipantRole", [
  "OWNER",
  "LISTING_AGENT",
  "BUYER_AGENT",
  "CLIENT",
  "ADMIN_SUPPORT",
]);
export type ParticipantRole = z.infer<typeof ParticipantRole>;

export const MessageType = vocabulary("MessageType", [
  "TEXT",
  "SYSTEM",
  "ATTACHMENT",
  "OFFER_REF",
  "VIEWING_REF",
  "AI_SUMMARY",
]);
export type MessageType = z.infer<typeof MessageType>;

export const ViewingStatus = vocabulary("ViewingStatus", [
  "REQUESTED",
  "CONFIRMED",
  "RESCHEDULED",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
]);
export type ViewingStatus = z.infer<typeof ViewingStatus>;

export const ViewingOutcome = vocabulary("ViewingOutcome", [
  "POSITIVE",
  "NEUTRAL",
  "NEGATIVE",
]);
export type ViewingOutcome = z.infer<typeof ViewingOutcome>;

export const OfferType = vocabulary("OfferType", [
  "INITIAL",
  "COUNTER",
  "FINAL",
]);
export type OfferType = z.infer<typeof OfferType>;

export const OfferStatus = vocabulary("OfferStatus", [
  "SUBMITTED",
  "COUNTERED",
  "ACCEPTED",
  "REJECTED",
  "WITHDRAWN",
  "EXPIRED",
]);
export type OfferStatus = z.infer<typeof OfferStatus>;

export const AgreementType = vocabulary("AgreementType", [
  "RESERVATION",
  "LEASE",
  "SALE_PURCHASE",
  "RTO",
]);
export type AgreementType = z.infer<typeof AgreementType>;

export const AgreementStatus = vocabulary("AgreementStatus", [
  "DRAFT",
  "PENDING_SIGNATURES",
  "SIGNED",
  "VOID",
]);
export type AgreementStatus = z.infer<typeof AgreementStatus>;

export const DealCancelReasonCode = vocabulary("DealCancelReasonCode", [
  "PRICE",
  "TIMING",
  "PROPERTY_UNAVAILABLE",
  "CLIENT_WITHDREW",
  "OTHER",
]);
export type DealCancelReasonCode = z.infer<typeof DealCancelReasonCode>;

// ---- Money (§8.2.7) --------------------------------------------------------

export const FeeBasis = vocabulary("FeeBasis", [
  "TRANSACTION_VALUE",
  "ANNUAL_RENT",
  "MONTHLY_RENT",
  "FIXED",
]);
export type FeeBasis = z.infer<typeof FeeBasis>;

export const FeeStatus = vocabulary("FeeStatus", [
  "DRAFT",
  "ISSUED",
  "WAIVED",
  "VOID",
]);
export type FeeStatus = z.infer<typeof FeeStatus>;

export const InvoiceStatus = vocabulary("InvoiceStatus", [
  "ISSUED",
  "PARTIALLY_PAID",
  "PAID",
  "OVERDUE",
  "CANCELLED",
]);
export type InvoiceStatus = z.infer<typeof InvoiceStatus>;

export const PaymentMethod = vocabulary("PaymentMethod", [
  "BANK_TRANSFER",
  "PROMPTPAY",
  "CARD",
  "OTHER",
]);
export type PaymentMethod = z.infer<typeof PaymentMethod>;

export const PaymentStatus = vocabulary("PaymentStatus", [
  "PENDING",
  "CONFIRMED",
  "FAILED",
  "REFUNDED",
]);
export type PaymentStatus = z.infer<typeof PaymentStatus>;

// ---- AI, notifications, moderation (§8.2.8, §18.9) -------------------------

export const AiRunStatus = vocabulary("AiRunStatus", [
  "OK",
  "TIMEOUT",
  "ERROR",
  "REJECTED_SCHEMA",
  "FALLBACK",
]);
export type AiRunStatus = z.infer<typeof AiRunStatus>;

export const AiRating = vocabulary("AiRating", ["UP", "DOWN"]);
export type AiRating = z.infer<typeof AiRating>;

export const AiLanguage = vocabulary("AiLanguage", ["th", "en"]);
export type AiLanguage = z.infer<typeof AiLanguage>;

export const NormalizeKind = vocabulary("NormalizeKind", [
  "PROJECT_NAME",
  "AMENITY",
  "LOCATION",
]);
export type NormalizeKind = z.infer<typeof NormalizeKind>;

/** §10.3 T3: the dictionary is consulted first, the model handles misses. */
export const NormalizeSource = vocabulary("NormalizeSource", [
  "DICTIONARY",
  "AI",
]);
export type NormalizeSource = z.infer<typeof NormalizeSource>;

export const NotificationPriority = vocabulary("NotificationPriority", [
  "LOW",
  "NORMAL",
  "HIGH",
]);
export type NotificationPriority = z.infer<typeof NotificationPriority>;

export const NotificationChannel = vocabulary("NotificationChannel", [
  "PUSH",
  "EMAIL",
  "SMS",
  "IN_APP",
]);
export type NotificationChannel = z.infer<typeof NotificationChannel>;

export const ModerationItemType = vocabulary("ModerationItemType", [
  "PROPERTY",
  "USER",
  "DOCUMENT",
  "MESSAGE",
  "REPORT",
]);
export type ModerationItemType = z.infer<typeof ModerationItemType>;

export const ModerationQueue = vocabulary("ModerationQueue", [
  "VERIFICATION",
  "LISTING_REVIEW",
  "DUPLICATE",
  "FRAUD",
  "CONTENT",
]);
export type ModerationQueue = z.infer<typeof ModerationQueue>;

export const ModerationStatus = vocabulary("ModerationStatus", [
  "PENDING",
  "IN_REVIEW",
  "RESOLVED",
  "ESCALATED",
]);
export type ModerationStatus = z.infer<typeof ModerationStatus>;
