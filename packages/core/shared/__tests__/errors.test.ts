import { describe, expect, it } from "vitest";
import { domainError, isDomainError } from "../errors";

describe("domainError", () => {
  it("defaults to a non-retryable error with no optional fields", () => {
    const error = domainError("NOT_FOUND", "Deal not found");
    expect(error).toEqual({
      code: "NOT_FOUND",
      message: "Deal not found",
      retryable: false,
    });
    expect("fieldErrors" in error).toBe(false);
    expect("details" in error).toBe(false);
  });

  it("carries field errors, details and the retryable flag", () => {
    const error = domainError("VALIDATION_FAILED", "Offer is invalid", {
      retryable: true,
      fieldErrors: { amount: "must be greater than 0" },
      details: { from: "VIEWING_REQUESTED", to: "DEAL_CLOSED" },
    });
    expect(error).toEqual({
      code: "VALIDATION_FAILED",
      message: "Offer is invalid",
      retryable: true,
      fieldErrors: { amount: "must be greater than 0" },
      details: { from: "VIEWING_REQUESTED", to: "DEAL_CLOSED" },
    });
  });

  it("is immutable and does not keep a reference to the caller's objects", () => {
    const fieldErrors = { amount: "must be greater than 0" };
    const error = domainError("VALIDATION_FAILED", "Offer is invalid", {
      fieldErrors,
    });
    fieldErrors.amount = "changed";
    expect(error.fieldErrors).toEqual({ amount: "must be greater than 0" });
    expect(Object.isFrozen(error)).toBe(true);
    expect(Object.isFrozen(error.fieldErrors)).toBe(true);
  });

  it("refuses an empty code", () => {
    expect(() => domainError("", "no code")).toThrow(TypeError);
  });
});

describe("isDomainError", () => {
  it("accepts what domainError builds", () => {
    expect(isDomainError(domainError("FORBIDDEN", "Not a participant"))).toBe(
      true,
    );
  });

  it.each([
    null,
    undefined,
    "NOT_FOUND",
    42,
    {},
    { code: "", message: "x", retryable: false },
    { code: "X", message: 1, retryable: false },
    { code: "X", message: "x" },
    { code: "X", message: "x", retryable: "no" },
    new Error("boom"),
  ])("rejects %j", (value) => {
    expect(isDomainError(value)).toBe(false);
  });
});
