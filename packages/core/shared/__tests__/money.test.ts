import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { Money, MIN_SATANG, MAX_SATANG } from "../money.ts";

describe("BIGINT satang conversion", () => {
  it.each([
    ["12500.50", 1_250_050n],
    ["0", 0n],
    ["0.1", 10n],
    ["1", 100n],
    ["-0", 0n],
    ["-0.0", 0n],
    ["-0.00", 0n],
    ["-0.01", -1n],
    ["92233720368547758.07", MAX_SATANG],
    ["-92233720368547758.08", MIN_SATANG],
  ] as const)("parses %s without floating point", (input, expected) => {
    expect(Money.fromBaht(input)).toBe(expected);
    expect(Money.tryFromBaht(input)).toEqual({ ok: true, value: expected });
  });

  it.each([
    [-101n, "-1.01"],
    [-100n, "-1.00"],
    [-99n, "-0.99"],
    [-1n, "-0.01"],
    [0n, "0.00"],
    [1n, "0.01"],
    [99n, "0.99"],
    [100n, "1.00"],
    [101n, "1.01"],
    [MAX_SATANG, "92233720368547758.07"],
    [MIN_SATANG, "-92233720368547758.08"],
  ] as const)("formats %s satang canonically", (amount, expected) => {
    expect(Money.format(amount)).toBe(expected);
  });

  it.each([
    "",
    " ",
    " 1",
    "1 ",
    "1\n",
    "1\r\n",
    "+1",
    "01",
    "00.01",
    ".1",
    "1.",
    "1.001",
    "1,000",
    "฿1",
    "1e2",
    "0x10",
    "๑.๐๐",
    "１.００",
    "−1",
    "NaN",
    "Infinity",
    "92233720368547758.08",
    "-92233720368547758.09",
    "9".repeat(10_000),
  ])("rejects noncanonical or out-of-range input %#", (input) => {
    const result = Money.tryFromBaht(input);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("Expected rejection");
    expect(result.error.code).toBe("VALIDATION_FAILED");
    expect(result.error.fieldErrors.amount).toBeTruthy();
    expect(Money.fromBaht.bind(null, input)).toThrow(RangeError);
  });

  it("does not coerce untrusted values or call user-defined conversion methods", () => {
    const hostile = {
      toString() {
        throw new Error("Must not coerce");
      },
    };
    for (const input of [null, undefined, 1, 1n, true, [], {}, hostile]) {
      expect(Money.tryFromBaht(input).ok).toBe(false);
    }
  });

  it("rejects invalid satang values at the formatter boundary", () => {
    expect(() => Money.format(MAX_SATANG + 1n)).toThrow(RangeError);
    expect(() => Money.format(MIN_SATANG - 1n)).toThrow(RangeError);
    // @ts-expect-error Money must not accept floating point values.
    expect(() => Money.format(12.5)).toThrow(RangeError);
  });

  it("round-trips 10,000 generated values across the signed 64-bit range", () => {
    fc.assert(
      fc.property(fc.bigInt({ min: MIN_SATANG, max: MAX_SATANG }), (value) => {
        expect(Money.fromBaht(Money.format(value))).toBe(value);
      }),
      { numRuns: 10_000, seed: 20260908 },
    );
  });
});
