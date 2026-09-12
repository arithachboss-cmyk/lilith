import { describe, expect, it } from "vitest";
import { matchProperty } from "../../src/domain/matching/engine";
import type {
  MatchingProperty,
  MatchingRequirement,
} from "../../src/domain/matching/types";
import { calculateFee } from "../../src/domain/fees/engine";
import {
  canTransition,
  DEAL_STATES,
} from "../../src/domain/deals/state-machine";
import { canonicalMoney, toMinorUnits } from "../../src/domain/shared/money";
import {
  moneySchema,
  propertyInput,
  profileInput,
  requirementInput,
} from "../../src/domain/platform/contracts";
const property: MatchingProperty = {
  transactionType: "RENT",
  propertyType: "CONDO",
  price: "45000.00",
  currency: "THB",
  location: "Sukhumvit",
  bedrooms: 2,
  facilities: ["pool", "gym"],
};
const requirement: MatchingRequirement = {
  transactionType: "RENT",
  propertyType: "CONDO",
  budgetMax: "50000.00",
  currency: "THB",
  locations: ["Sukhumvit"],
  minBedrooms: 2,
  facilities: ["pool", "gym"],
  hardBudget: false,
  hardLocation: false,
};
describe("matching engine v1", () => {
  it("scores a perfect match with complete explanations", () => {
    const result = matchProperty(property, requirement);
    expect(result.score).toBe(100);
    expect(result.confidence).toBe(1);
    expect(result.hardConstraintPassed).toBe(true);
    expect(result.tradeoffs).toEqual([]);
  });
  it("reduces the score for a soft budget mismatch", () => {
    const result = matchProperty(
      { ...property, price: "60000.00" },
      requirement,
    );
    expect(result.score).toBe(60);
    expect(result.unmatchedConstraints).toContain("budget");
    expect(result.hardConstraintPassed).toBe(true);
  });
  it("fails the hard constraint for a different transaction type", () => {
    const result = matchProperty(
      { ...property, transactionType: "SALE" },
      requirement,
    );
    expect(result.score).toBe(0);
    expect(result.hardConstraintPassed).toBe(false);
  });
  it("reports a soft location mismatch", () => {
    const result = matchProperty(
      { ...property, location: "Silom" },
      requirement,
    );
    expect(result.score).toBe(70);
    expect(result.tradeoffs).toContain("Outside the requested locations");
  });
  it("scores partial facilities proportionally", () => {
    const result = matchProperty(
      { ...property, facilities: ["pool"] },
      requirement,
    );
    expect(result.score).toBe(95);
    expect(
      result.reasons.find((item) => item.code === "facilities")?.text,
    ).toBe("1 of 2 requested facilities");
  });
  it("excludes a budget mismatch when budget is hard", () => {
    const result = matchProperty(
      { ...property, price: "60000.00" },
      { ...requirement, hardBudget: true },
    );
    expect(result.score).toBe(0);
    expect(result.hardConstraintPassed).toBe(false);
  });
  it("excludes hard location mismatches and wrong property types", () => {
    expect(
      matchProperty(
        { ...property, location: "Silom" },
        { ...requirement, hardLocation: true },
      ).hardConstraintPassed,
    ).toBe(false);
    expect(
      matchProperty({ ...property, propertyType: "HOTEL" }, requirement)
        .hardConstraintPassed,
    ).toBe(false);
  });
  it("accepts configurable weights and rejects invalid weight sets", () => {
    expect(
      matchProperty({ ...property, facilities: [] }, requirement, {
        budget: 1,
        location: 1,
        bedrooms: 1,
        facilities: 1,
      }).score,
    ).toBe(75);
    expect(() =>
      matchProperty(property, requirement, {
        budget: 0,
        location: 0,
        bedrooms: 0,
        facilities: 0,
      }),
    ).toThrow();
    expect(() =>
      matchProperty(property, requirement, {
        budget: NaN,
        location: 1,
        bedrooms: 1,
        facilities: 1,
      }),
    ).toThrow();
  });
  it("normalizes whitespace/case, deduplicates facilities and is deterministic", () => {
    const input = {
      ...requirement,
      locations: [" sukhumvit "],
      facilities: ["pool", "Pool", "gym"],
    };
    expect(matchProperty(property, input).score).toBe(100);
    expect(matchProperty(property, input)).toEqual(
      matchProperty(property, input),
    );
  });
  it("compares money exactly at the one-satang boundary", () => {
    expect(
      matchProperty(
        { ...property, price: "50000.01" },
        { ...requirement, hardBudget: true },
      ).hardConstraintPassed,
    ).toBe(false);
  });
});
describe("fee engine and monetary safety", () => {
  const policy = {
    id: "policy-test",
    rate: "0.001",
    basis: "TRANSACTION_VALUE" as const,
    currency: "THB" as const,
  };
  it("calculates the configured 0.1% with no floating point", () => {
    expect(calculateFee("123456789.12", policy).feeAmount).toBe("123456.79");
    expect(
      calculateFee("1000000.00", { ...policy, rate: "0.002" }).feeAmount,
    ).toBe("2000.00");
  });
  it("rounds half-up at a minor currency unit", () => {
    expect(calculateFee("5.00", policy).feeAmount).toBe("0.01");
    expect(calculateFee("4.99", policy).feeAmount).toBe("0.00");
  });
  it("handles the largest supported input without lost precision", () => {
    expect(canonicalMoney("999999999999.99")).toBe("999999999999.99");
    expect(toMinorUnits("0.1")).toBe(BigInt(10));
  });
  it("rejects noncanonical money, negative values and invalid rates", () => {
    for (const input of ["-1", "1e5", "NaN", "1.005", "01", "1000000000000"])
      expect(() => toMinorUnits(input)).toThrow();
    expect(() => calculateFee("5", { ...policy, rate: "1.1" })).toThrow();
  });
});
describe("state and input boundaries", () => {
  it("permits the viewing sequence and rejects skips and terminal changes", () => {
    expect(canTransition("DEAL_ROOM_OPENED", "VIEWING_REQUESTED")).toBe(true);
    expect(canTransition("DEAL_ROOM_OPENED", "DEAL_CLOSED")).toBe(false);
    for (const state of DEAL_STATES) {
      expect(canTransition("DEAL_CLOSED", state)).toBe(false);
      expect(canTransition("CANCELLED", state)).toBe(false);
    }
  });
  it("returns Zod errors, not exceptions, for invalid money", () => {
    for (const value of ["banana", "-1", "99999999999999", "0", "1.111"])
      expect(moneySchema.safeParse(value).success).toBe(false);
  });
  it("rejects role escalation and injected ownership", () => {
    expect(
      profileInput.safeParse({ role: "ADMIN", displayName: "Test admin" })
        .success,
    ).toBe(false);
    expect(
      propertyInput.safeParse({
        ...property,
        name: "TEST Property",
        description: "",
        areaSqm: 80,
        ownerId: "victim",
      }).success,
    ).toBe(false);
    expect(
      requirementInput.safeParse({
        ...requirement,
        title: "TEST Requirement",
        description: "",
        clientConsent: false,
      }).success,
    ).toBe(false);
  });
});
