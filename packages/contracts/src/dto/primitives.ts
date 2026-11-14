import { z } from "zod";
import { dto } from "./registry";

// ---- Identifiers -----------------------------------------------------------

const idBody = z.string().regex(/^[0-9A-Za-z_-]{1,64}$/);

/**
 * API ids are opaque strings with a type prefix (`usr_…`, `prp_…`). How the
 * part after the prefix encodes the database UUID is not fixed here
 * (ADR-0016).
 */
function prefixedId<P extends string>(name: string, prefix: P) {
  return dto(name, z.templateLiteral([`${prefix}_`, idBody]));
}

// Prefixes shown in Blueprint §18.
export const UserId = prefixedId("UserId", "usr");
export const PropertyId = prefixedId("PropertyId", "prp");
export const RequirementId = prefixedId("RequirementId", "req");
export const MatchId = prefixedId("MatchId", "mch");
export const DealRoomId = prefixedId("DealRoomId", "drm");
export const DealId = prefixedId("DealId", "del");
export const DocumentId = prefixedId("DocumentId", "doc");
export const FeeId = prefixedId("FeeId", "fee");
export const InvoiceId = prefixedId("InvoiceId", "inv");
export const AiRunId = prefixedId("AiRunId", "air");
export const OtpChallengeId = prefixedId("OtpChallengeId", "ch");
export const ViewingSlotId = prefixedId("ViewingSlotId", "slt");
export const LocationId = prefixedId("LocationId", "loc");

/** An id whose prefix §18 does not show. Opaque, and bounded in length. */
export const OpaqueId = dto(
  "OpaqueId",
  z.string().min(1).max(128),
  "An opaque identifier. Blueprint v1.0 shows no prefix for this kind of id.",
);

export type UserId = z.infer<typeof UserId>;
export type PropertyId = z.infer<typeof PropertyId>;
export type RequirementId = z.infer<typeof RequirementId>;
export type MatchId = z.infer<typeof MatchId>;
export type DealRoomId = z.infer<typeof DealRoomId>;
export type DealId = z.infer<typeof DealId>;
export type DocumentId = z.infer<typeof DocumentId>;
export type FeeId = z.infer<typeof FeeId>;
export type InvoiceId = z.infer<typeof InvoiceId>;
export type AiRunId = z.infer<typeof AiRunId>;
export type OtpChallengeId = z.infer<typeof OtpChallengeId>;
export type ViewingSlotId = z.infer<typeof ViewingSlotId>;
export type LocationId = z.infer<typeof LocationId>;

// ---- Time ------------------------------------------------------------------

export const Timestamp = dto(
  "Timestamp",
  z.iso.datetime(),
  "RFC 3339 date-time in UTC, ending in Z.",
);
export const DateOnly = dto(
  "DateOnly",
  z.iso.date(),
  "Calendar date without a time, YYYY-MM-DD.",
);

// ---- Money -----------------------------------------------------------------

/**
 * Money on the wire: a whole number of satang as a JSON integer, never a
 * float (§18.0). It is limited to the range a JSON client reads without
 * losing precision; core keeps the same amount as a `bigint`.
 */
export const Satang = dto(
  "Satang",
  z.int().min(0),
  "Amount of money in satang (100 satang = 1 baht). A whole number, never a float.",
);
export const Currency = dto("Currency", z.literal("THB"));

/** Converts core's `bigint` satang to the wire integer. */
export function toWireAmount(satang: bigint): number {
  if (satang < 0n || satang > BigInt(Number.MAX_SAFE_INTEGER))
    throw new RangeError(`Amount cannot be sent as a JSON integer: ${satang}`);
  return Number(satang);
}

/** Converts a wire integer to core's `bigint` satang. */
export function fromWireAmount(amount: number): bigint {
  if (!Number.isSafeInteger(amount) || amount < 0)
    throw new RangeError(`Not a whole, non-negative satang amount: ${amount}`);
  return BigInt(amount);
}

// ---- Text ------------------------------------------------------------------

// §15.3 requires every input string to be bounded and gives no numbers; these
// three limits are the contract's own (ADR-0016).
export const ShortText = z.string().min(1).max(120);
export const MediumText = z.string().max(500);
export const LongText = z.string().max(5000);

/** A machine code such as `AMENITY_GYM` or `WALK_UNDER_TARGET`. */
export const Code = z.string().regex(/^[A-Z][A-Z0-9_]{0,63}$/);

export const Locale = z.string().min(2).max(35);

/**
 * Unspecified JSON object: the blueprint names the field but not its shape.
 * `openObject()` gives a fresh instance for a schema that gets its own name.
 */
export function openObject() {
  return z.record(z.string(), z.unknown());
}
export const OpenObject = openObject();

// ---- Geography -------------------------------------------------------------

export const LatLng = dto(
  "LatLng",
  z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
);

// ---- Pagination ------------------------------------------------------------

export const Cursor = z.string().min(1).max(512);

/** `?limit=20&cursor=<opaque>` (§18.0). The upper bound is the contract's own. */
export const pageQuery = {
  limit: z.coerce.number().int().min(1).max(100).optional(),
  cursor: Cursor.optional(),
};

/** `{ "data": [...], "next_cursor": "…" | null }` (§18.0). */
export function page<T extends z.ZodType>(item: T) {
  return z.object({ data: z.array(item), next_cursor: Cursor.nullable() });
}

// ---- Misc ------------------------------------------------------------------

/** A URL the server hands out (signed media, upload target). */
export const Url = z.string().min(1).max(2048);

/** A monetary amount that must be greater than zero. */
export const PositiveSatang = dto(
  "PositiveSatang",
  z.int().min(1),
  "Amount in satang, greater than zero.",
);

export const Percent = z.number().min(0).max(100);
export const Ratio = z.number().min(0).max(1);
export const Score = z.int().min(0).max(100);
export const Version = z.int().min(0);
