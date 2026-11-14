import { describe, expect, it } from "vitest";
import {
  CANONICAL_ERROR_STATUS,
  ERROR_CODES,
  ERROR_STATUS,
  ErrorEnvelope,
  errorEnvelope,
  httpStatusOf,
  isErrorCode,
} from "../errors";
import * as fixtures from "./fixtures";

// Blueprint §18.0, written out here and not read from the module under test.
const CANONICAL: Record<string, number> = {
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  TIER_INSUFFICIENT: 403,
  NOT_FOUND: 404,
  VALIDATION_FAILED: 422,
  CONFLICT_VERSION: 409,
  DEAL_TRANSITION_NOT_ALLOWED: 409,
  IDEMPOTENT_REPLAY: 200,
  RATE_LIMITED: 429,
  AI_BUDGET_EXCEEDED: 429,
  AI_UNAVAILABLE: 503,
  INTERNAL: 500,
};

// Codes §18 uses on single endpoints.
const ENDPOINT: Record<string, number> = {
  OTP_INVALID: 422,
  PROPERTY_INCOMPLETE: 422,
  SUPER_MATCH_QUOTA_EXCEEDED: 429,
  CLOSE_VALUE_MISMATCH: 409,
};

const base = {
  message_en: "Not found.",
  message_th: "ไม่พบข้อมูล",
  request_id: "req_01JABC",
  retryable: false,
};

describe("error codes", () => {
  it("has every canonical code of §18.0 with its HTTP status", () => {
    expect(CANONICAL_ERROR_STATUS).toEqual(CANONICAL);
  });

  it("has the endpoint codes of §18 and nothing else", () => {
    expect(ERROR_STATUS).toEqual({ ...CANONICAL, ...ENDPOINT });
    expect([...ERROR_CODES].sort()).toEqual(
      Object.keys({ ...CANONICAL, ...ENDPOINT }).sort(),
    );
  });

  it.each(Object.entries({ ...CANONICAL, ...ENDPOINT }))(
    "%s answers %i",
    (code, status) => {
      expect(isErrorCode(code)).toBe(true);
      if (isErrorCode(code)) expect(httpStatusOf(code)).toBe(status);
    },
  );

  it("does not treat inherited or unknown names as codes", () => {
    for (const value of ["NOPE", "toString", "constructor", "", 404, null])
      expect(isErrorCode(value)).toBe(false);
  });
});

describe("error envelope", () => {
  it("parses the example of §18.0 and keeps every member", () => {
    const parsed = ErrorEnvelope.parse(fixtures.errorEnvelope);
    expect(parsed).toEqual(fixtures.errorEnvelope);
    expect(ErrorEnvelope.parse(JSON.parse(JSON.stringify(parsed)))).toEqual(
      fixtures.errorEnvelope,
    );
  });

  it("builds an envelope that the schema accepts", () => {
    const envelope = errorEnvelope({ ...base, code: "NOT_FOUND" });
    expect(envelope).toEqual({ error: { code: "NOT_FOUND", ...base } });
    expect(ErrorEnvelope.parse(envelope)).toEqual(envelope);
  });

  it("carries field errors when given", () => {
    const envelope = errorEnvelope({
      ...base,
      code: "VALIDATION_FAILED",
      field_errors: { amount: "must be greater than 0" },
    });
    expect(envelope.error.field_errors).toEqual({
      amount: "must be greater than 0",
    });
  });

  it("puts the members §18 shows beside `code` inside `error`", () => {
    const transition = errorEnvelope({
      ...base,
      code: "DEAL_TRANSITION_NOT_ALLOWED",
      details: { allowed_from_here: ["VIEWING_COMPLETED", "CANCELLED"] },
    });
    expect(transition.error["allowed_from_here"]).toEqual([
      "VIEWING_COMPLETED",
      "CANCELLED",
    ]);

    const quota = errorEnvelope({
      ...base,
      code: "SUPER_MATCH_QUOTA_EXCEEDED",
      details: { resets_at: "2026-09-08T00:00:00Z" },
    });
    expect(quota.error["resets_at"]).toBe("2026-09-08T00:00:00Z");

    const mismatch = errorEnvelope({
      ...base,
      code: "CLOSE_VALUE_MISMATCH",
      details: { escalated_to_support: true },
    });
    expect(mismatch.error["escalated_to_support"]).toBe(true);
  });

  it("requires the details of a code that has them", () => {
    // prettier-ignore
    // @ts-expect-error details are required for this code
    expect(() => errorEnvelope({ ...base, code: "CLOSE_VALUE_MISMATCH" })).toThrow();
    const allowed_from_here = ["NOT_A_STATE"];
    // prettier-ignore
    // @ts-expect-error not a list of deal statuses
    expect(() => errorEnvelope({ ...base, code: "DEAL_TRANSITION_NOT_ALLOWED", details: { allowed_from_here } })).toThrow();
  });

  it("does not let details replace a fixed member", () => {
    for (const member of ["code", "request_id", "retryable", "message_th"]) {
      expect(() =>
        errorEnvelope({
          ...base,
          code: "INTERNAL",
          details: { [member]: "spoofed" },
        }),
      ).toThrow(TypeError);
    }
  });

  it("rejects an unknown code and empty texts", () => {
    // prettier-ignore
    // @ts-expect-error not a registered code
    expect(() => errorEnvelope({ ...base, code: "SOMETHING_ELSE" })).toThrow(TypeError);
    expect(() =>
      errorEnvelope({ ...base, code: "INTERNAL", message_th: "" }),
    ).toThrow();
    expect(() =>
      errorEnvelope({ ...base, code: "INTERNAL", request_id: "" }),
    ).toThrow();
  });

  it("rejects an envelope without the fixed members", () => {
    for (const member of [
      "code",
      "message_en",
      "message_th",
      "request_id",
      "retryable",
    ]) {
      const error: Record<string, unknown> = {
        ...fixtures.errorEnvelope.error,
      };
      delete error[member];
      expect(ErrorEnvelope.safeParse({ error }).success).toBe(false);
    }
    expect(ErrorEnvelope.safeParse({}).success).toBe(false);
    expect(
      ErrorEnvelope.safeParse({
        error: { ...fixtures.errorEnvelope.error, code: "UNKNOWN" },
      }).success,
    ).toBe(false);
  });
});
