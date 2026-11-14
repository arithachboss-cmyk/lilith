import { afterEach, describe, expect, it, vi } from "vitest";
import { manualClock, systemClock, type Clock } from "../clock";

// What a domain service does with an injected clock.
function isExpired(clock: Clock, expiresAt: string): boolean {
  return clock.now().getTime() >= new Date(expiresAt).getTime();
}

describe("manualClock", () => {
  it("stays where it was started until it is moved", () => {
    const clock = manualClock("2026-11-14T00:00:00.000Z");
    expect(clock.now().toISOString()).toBe("2026-11-14T00:00:00.000Z");
    expect(clock.now().toISOString()).toBe("2026-11-14T00:00:00.000Z");
  });

  it("accepts a Date as well as an ISO string", () => {
    const clock = manualClock(new Date("2026-11-14T00:00:00.000Z"));
    expect(clock.now().toISOString()).toBe("2026-11-14T00:00:00.000Z");
  });

  it("advances by milliseconds and jumps with set", () => {
    const clock = manualClock("2026-11-14T00:00:00.000Z");
    clock.advance(1500);
    expect(clock.now().toISOString()).toBe("2026-11-14T00:00:01.500Z");
    clock.advance(0);
    expect(clock.now().toISOString()).toBe("2026-11-14T00:00:01.500Z");
    clock.set("2027-01-01T00:00:00.000Z");
    expect(clock.now().toISOString()).toBe("2027-01-01T00:00:00.000Z");
  });

  it("lets a test stand just before and just after a deadline", () => {
    const expiresAt = "2026-11-15T00:00:00.000Z";
    const clock = manualClock("2026-11-14T23:59:59.999Z");
    expect(isExpired(clock, expiresAt)).toBe(false);
    clock.advance(1);
    expect(isExpired(clock, expiresAt)).toBe(true);
  });

  it("cannot be moved by mutating a Date it returned or was given", () => {
    const start = new Date("2026-11-14T00:00:00.000Z");
    const clock = manualClock(start);
    start.setUTCFullYear(1999);
    clock.now().setUTCFullYear(1999);
    expect(clock.now().toISOString()).toBe("2026-11-14T00:00:00.000Z");
  });

  it("refuses invalid dates and backwards or non-finite advances", () => {
    expect(() => manualClock("not a date")).toThrow(RangeError);
    const clock = manualClock("2026-11-14T00:00:00.000Z");
    expect(() => clock.set(new Date(Number.NaN))).toThrow(RangeError);
    expect(() => clock.advance(-1)).toThrow(RangeError);
    expect(() => clock.advance(Number.NaN)).toThrow(RangeError);
    expect(() => clock.advance(Number.POSITIVE_INFINITY)).toThrow(RangeError);
    expect(clock.now().toISOString()).toBe("2026-11-14T00:00:00.000Z");
  });
});

describe("systemClock", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("reads the system time", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-14T08:30:00.000Z"));
    expect(systemClock.now().toISOString()).toBe("2026-11-14T08:30:00.000Z");
    vi.setSystemTime(new Date("2026-11-14T08:30:05.000Z"));
    expect(systemClock.now().toISOString()).toBe("2026-11-14T08:30:05.000Z");
  });
});
