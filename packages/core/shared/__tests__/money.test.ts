import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { Money } from "../money";

const satang = fc.bigInt({ min: Money.MIN_SATANG, max: Money.MAX_SATANG });

describe("Money.fromBaht", () => {
  it("turns the acceptance example into satang", () => {
    expect(Money.fromBaht("12500.50")).toBe(1250050n);
  });

  it.each([
    ["0", 0n],
    ["0.00", 0n],
    ["-0.00", 0n],
    ["1", 100n],
    ["0.05", 5n],
    ["0.5", 50n],
    ["-0.05", -5n],
    ["12,500.50", 1250050n],
    ["฿12,500.50", 1250050n],
    ["-฿12,500.50", -1250050n],
    ["12500000", 1_250_000_000n],
    ["12,500,000.00", 1_250_000_000n],
    ["007", 700n],
  ])("parses %s", (text, expected) => {
    expect(Money.fromBaht(text)).toBe(expected);
  });

  it.each([
    "",
    " ",
    " 12500.50",
    "12500.50 ",
    "12 500",
    "12500.",
    ".50",
    "12500.505",
    "1.005",
    "12,50",
    "1,2345",
    "1,234,56",
    ",123",
    "12500,50",
    "+5",
    "--5",
    "1e3",
    "0x10",
    "12.5.0",
    "฿",
    "฿-5",
    "THB 5",
    "๑๒",
    "NaN",
  ])("rejects %j as a format error", (text) => {
    expect(Money.parseBaht(text)).toEqual({
      ok: false,
      error: "INVALID_FORMAT",
    });
    expect(() => Money.fromBaht(text)).toThrow(SyntaxError);
  });

  it("accepts the whole BIGINT range and nothing beyond it", () => {
    expect(Money.fromBaht("92233720368547758.07")).toBe(Money.MAX_SATANG);
    expect(Money.fromBaht("-92233720368547758.08")).toBe(Money.MIN_SATANG);
    expect(Money.parseBaht("92233720368547758.08")).toEqual({
      ok: false,
      error: "OUT_OF_RANGE",
    });
    expect(Money.parseBaht("-92233720368547758.09")).toEqual({
      ok: false,
      error: "OUT_OF_RANGE",
    });
    expect(() => Money.fromBaht("92233720368547758.08")).toThrow(RangeError);
  });

  it("parseBaht returns the same amount without throwing", () => {
    expect(Money.parseBaht("12500.50")).toEqual({ ok: true, value: 1250050n });
  });
});

describe("Money.format", () => {
  it.each([
    [0n, "0.00", "฿0.00"],
    [5n, "0.05", "฿0.05"],
    [-5n, "-0.05", "-฿0.05"],
    [100n, "1.00", "฿1.00"],
    [99_999n, "999.99", "฿999.99"],
    [100_000n, "1000.00", "฿1,000.00"],
    [1250050n, "12500.50", "฿12,500.50"],
    [-1250050n, "-12500.50", "-฿12,500.50"],
    [1_250_000_000n, "12500000.00", "฿12,500,000.00"],
    [Money.MAX_SATANG, "92233720368547758.07", "฿92,233,720,368,547,758.07"],
    [Money.MIN_SATANG, "-92233720368547758.08", "-฿92,233,720,368,547,758.08"],
  ])("formats %s", (amount, plain, display) => {
    expect(Money.format(amount)).toBe(plain);
    expect(Money.formatBaht(amount)).toBe(display);
  });
});

describe("Money round trip (property-based, 10,000 random values each)", () => {
  it("fromBaht(format(x)) === x", () => {
    fc.assert(
      fc.property(satang, (x) => Money.fromBaht(Money.format(x)) === x),
      { numRuns: 10_000 },
    );
  });

  it("fromBaht(formatBaht(x)) === x", () => {
    fc.assert(
      fc.property(satang, (x) => Money.fromBaht(Money.formatBaht(x)) === x),
      { numRuns: 10_000 },
    );
  });

  it("format always produces the canonical two-decimal form", () => {
    fc.assert(
      fc.property(satang, (x) =>
        /^-?(0|[1-9]\d*)\.\d{2}$/.test(Money.format(x)),
      ),
      { numRuns: 10_000 },
    );
  });

  it("a parsed amount is always inside the BIGINT range", () => {
    fc.assert(
      fc.property(fc.bigInt({ min: -(10n ** 30n), max: 10n ** 30n }), (x) => {
        const parsed = Money.parseBaht(Money.format(x));
        return Money.isInRange(x)
          ? parsed.ok && parsed.value === x
          : !parsed.ok && parsed.error === "OUT_OF_RANGE";
      }),
      { numRuns: 10_000 },
    );
  });
});

describe("Money constants", () => {
  it("describes Thai baht in satang", () => {
    expect(Money.CURRENCY).toBe("THB");
    expect(Money.SATANG_PER_BAHT).toBe(100n);
    expect(Money.MAX_SATANG).toBe(2n ** 63n - 1n);
    expect(Money.MIN_SATANG).toBe(-(2n ** 63n));
  });
});
