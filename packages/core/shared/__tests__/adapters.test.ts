import { afterEach, describe, expect, it, vi } from "vitest";
import { createClock, fixedClock, systemClock } from "../clock.ts";
import { createIdGenerator, parseUUID, systemIds } from "../ids.ts";

const fixtureUUID = "01a07d5b-f4b1-7511-91ce-d0fd2658bcc5";
vi.mock("node:crypto", () => ({
  randomUUID: () => "50b0e0f7-bf20-4449-b62c-12edceeaaae5",
}));
afterEach(() => vi.useRealTimers());

describe("injected clocks", () => {
  it("keeps fixed clocks independent of wall-clock changes", () => {
    const clock = fixedClock(1000);
    vi.useFakeTimers();
    vi.setSystemTime(5000);
    expect(clock.now()).toBe(1000);
    expect(systemClock.now()).toBe(5000);
    vi.setSystemTime(9000);
    expect(clock.now()).toBe(1000);
    expect(systemClock.now()).toBe(9000);
    expect(Object.isFrozen(clock)).toBe(true);
  });
  it("reads injected time lazily on each call", () => {
    const read = vi.fn().mockReturnValueOnce(1000).mockReturnValueOnce(2000);
    const clock = createClock(read);
    expect(read).not.toHaveBeenCalled();
    expect(clock.now()).toBe(1000);
    expect(clock.now()).toBe(2000);
    expect(read).toHaveBeenCalledTimes(2);
  });
  it.each([
    NaN,
    Infinity,
    -Infinity,
    0.5,
    8_640_000_000_000_001,
    -8_640_000_000_000_001,
  ])("rejects invalid time %s without a fallback", (value) => {
    expect(() => fixedClock(value)).toThrow(RangeError);
    expect(() => createClock(() => value).now()).toThrow(RangeError);
  });
  it.each([-8_640_000_000_000_000, -1, 0, 8_640_000_000_000_000])(
    "accepts valid time %s",
    (value) => {
      expect(fixedClock(value).now()).toBe(value);
    },
  );
});

describe("UUID adapters", () => {
  it("validates and normalizes UUIDs without resolving an identity", () => {
    expect(parseUUID(fixtureUUID.toUpperCase())).toEqual({
      ok: true,
      value: fixtureUUID,
    });
    expect(parseUUID("50b0e0f7-bf20-4449-b62c-12edceeaaae5").ok).toBe(true);
  });
  it.each([
    null,
    1,
    "",
    "not-a-uuid",
    `${fixtureUUID}\n`,
    "01a07d5b-f4b1-0511-91ce-d0fd2658bcc5",
    "01a07d5b-f4b1-7511-01ce-d0fd2658bcc5",
  ])("rejects invalid UUID %#", (input) => {
    const result = parseUUID(input);
    expect(result).toMatchObject({
      ok: false,
      error: { code: "VALIDATION_FAILED" },
    });
  });
  it("uses an injected generator lazily and fails when the provider is broken", () => {
    const generate = vi.fn(() => fixtureUUID);
    const ids = createIdGenerator(generate);
    expect(generate).not.toHaveBeenCalled();
    expect(ids.next()).toBe(fixtureUUID);
    expect(ids.next()).toBe(fixtureUUID);
    expect(generate).toHaveBeenCalledTimes(2);
    expect(Object.isFrozen(ids)).toBe(true);
    expect(() => createIdGenerator(() => "invalid").next()).toThrow(TypeError);
    expect(() =>
      createIdGenerator(() => {
        throw new Error("Provider unavailable");
      }).next(),
    ).toThrow("Provider unavailable");
  });
  it("connects the system adapter to the crypto provider", () => {
    expect(systemIds.next()).toBe("50b0e0f7-bf20-4449-b62c-12edceeaaae5");
  });
});
