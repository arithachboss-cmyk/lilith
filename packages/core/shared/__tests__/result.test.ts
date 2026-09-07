import { describe, expect, it, vi } from "vitest";
import { ok, err, mapResult, flatMapResult } from "../result.ts";
import { domainError } from "../errors.ts";

describe("Result and DomainError", () => {
  it.each([0, false, null, undefined, ""])(
    "preserves a falsy success value %#",
    (value) => {
      expect(ok(value)).toEqual({ ok: true, value });
      expect(Object.isFrozen(ok(value))).toBe(true);
    },
  );
  it("maps successes and chains a business failure without throwing", () => {
    expect(mapResult(ok(2), (value) => value * 3)).toEqual(ok(6));
    const failure = domainError("NOT_FOUND", "Record does not exist.");
    expect(flatMapResult(ok(2), () => err(failure))).toEqual(err(failure));
    expect(flatMapResult(ok(2), (value) => ok(value + 1))).toEqual(ok(3));
  });
  it("short-circuits both mapping operations on failure", () => {
    const result = err(domainError("FORBIDDEN", "Access denied."));
    const map = vi.fn(() => 1);
    const chain = vi.fn(() => ok(1));
    expect(mapResult(result, map)).toBe(result);
    expect(flatMapResult(result, chain)).toBe(result);
    expect(map).not.toHaveBeenCalled();
    expect(chain).not.toHaveBeenCalled();
    expect(Object.isFrozen(result)).toBe(true);
  });
  it("copies and freezes field errors, with retry disabled by default", () => {
    const fields = { amount: "Invalid amount." };
    const failure = domainError("VALIDATION_FAILED", "Invalid input.", {
      fieldErrors: fields,
    });
    fields.amount = "Changed outside the error";
    expect(failure.fieldErrors.amount).toBe("Invalid amount.");
    expect(failure.retryable).toBe(false);
    expect(Object.isFrozen(failure)).toBe(true);
    expect(Object.isFrozen(failure.fieldErrors)).toBe(true);
    expect(
      domainError("UNAVAILABLE", "Try again.", { retryable: true }).retryable,
    ).toBe(true);
    expect(domainError("NOT_FOUND", "Missing.").fieldErrors).toEqual({});
  });
});
