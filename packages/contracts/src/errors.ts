import { z } from "zod";
import { DealStatus } from "./dto/enums";
import { Timestamp } from "./dto/primitives";
import { dto } from "./dto/registry";

/** The canonical codes of Blueprint §18.0, each with its HTTP status. */
export const CANONICAL_ERROR_STATUS = {
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  TIER_INSUFFICIENT: 403,
  NOT_FOUND: 404,
  VALIDATION_FAILED: 422,
  CONFLICT_VERSION: 409,
  DEAL_TRANSITION_NOT_ALLOWED: 409,
  // Not a failure: the stored response of the first request is returned again.
  IDEMPOTENT_REPLAY: 200,
  RATE_LIMITED: 429,
  AI_BUDGET_EXCEEDED: 429,
  // A designed response: the client degrades to its non-AI variant (§18.9).
  AI_UNAVAILABLE: 503,
  INTERNAL: 500,
} as const;

/** Codes that §18 uses on single endpoints, outside the canonical list. */
export const ENDPOINT_ERROR_STATUS = {
  OTP_INVALID: 422, // §18.1
  PROPERTY_INCOMPLETE: 422, // §18.4
  SUPER_MATCH_QUOTA_EXCEEDED: 429, // §18.6
  CLOSE_VALUE_MISMATCH: 409, // §18.7
} as const;

export const ERROR_STATUS = {
  ...CANONICAL_ERROR_STATUS,
  ...ENDPOINT_ERROR_STATUS,
} as const;

export type CanonicalErrorCode = keyof typeof CANONICAL_ERROR_STATUS;
export type ErrorCode = keyof typeof ERROR_STATUS;

export const ERROR_CODES = Object.keys(ERROR_STATUS) as [
  ErrorCode,
  ...ErrorCode[],
];

export const ErrorCodeSchema = dto("ErrorCode", z.enum(ERROR_CODES));

export function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === "string" && Object.hasOwn(ERROR_STATUS, value);
}

export function httpStatusOf(code: ErrorCode): number {
  return ERROR_STATUS[code];
}

/**
 * Extra members that §18 shows next to `code` for three codes. They sit
 * inside `error`, beside the fixed members.
 */
export const ERROR_DETAILS = {
  DEAL_TRANSITION_NOT_ALLOWED: z.object({
    allowed_from_here: z.array(DealStatus),
  }),
  SUPER_MATCH_QUOTA_EXCEEDED: z.object({ resets_at: Timestamp }),
  CLOSE_VALUE_MISMATCH: z.object({ escalated_to_support: z.boolean() }),
} as const satisfies Partial<Record<ErrorCode, z.ZodObject>>;

type CodeWithDetails = keyof typeof ERROR_DETAILS;
export type ErrorDetails<C extends ErrorCode> = C extends CodeWithDetails
  ? z.infer<(typeof ERROR_DETAILS)[C]>
  : never;

const FIXED_MEMBERS = [
  "code",
  "message_en",
  "message_th",
  "field_errors",
  "request_id",
  "retryable",
] as const;

/** The body of every non-2xx response (§18.0). */
export const ErrorEnvelope = dto(
  "ErrorEnvelope",
  z.object({
    error: z.looseObject({
      code: ErrorCodeSchema,
      message_en: z.string().min(1),
      message_th: z.string().min(1),
      field_errors: z.record(z.string(), z.string()).optional(),
      request_id: z.string().min(1).max(128),
      retryable: z.boolean(),
    }),
  }),
  "Body of every non-2xx response. Some codes add members beside `code`, for example `allowed_from_here`.",
);
export type ErrorEnvelope = z.infer<typeof ErrorEnvelope>;

type ErrorInput<C extends ErrorCode> = {
  readonly code: C;
  readonly message_en: string;
  readonly message_th: string;
  readonly request_id: string;
  readonly retryable: boolean;
  readonly field_errors?: Readonly<Record<string, string>>;
} & (C extends CodeWithDetails
  ? { readonly details: ErrorDetails<C> }
  : { readonly details?: Readonly<Record<string, unknown>> });

function detailsSchemaOf(code: ErrorCode): z.ZodObject | undefined {
  return Object.hasOwn(ERROR_DETAILS, code)
    ? ERROR_DETAILS[code as CodeWithDetails]
    : undefined;
}

/**
 * Builds a valid envelope. Texts and `retryable` come from the caller: this
 * package fixes the shape and the status of each code, not the wording.
 */
export function errorEnvelope<C extends ErrorCode>(
  input: ErrorInput<C>,
): ErrorEnvelope {
  if (!isErrorCode(input.code))
    throw new TypeError(`Unknown error code: ${String(input.code)}`);
  const schema = detailsSchemaOf(input.code);
  const details: Record<string, unknown> =
    schema === undefined ? { ...input.details } : schema.parse(input.details);
  for (const member of FIXED_MEMBERS) {
    if (Object.hasOwn(details, member))
      throw new TypeError(`Error details cannot replace "${member}"`);
  }
  return ErrorEnvelope.parse({
    error: {
      ...details,
      code: input.code,
      message_en: input.message_en,
      message_th: input.message_th,
      ...(input.field_errors === undefined
        ? {}
        : { field_errors: { ...input.field_errors } }),
      request_id: input.request_id,
      retryable: input.retryable,
    },
  });
}
