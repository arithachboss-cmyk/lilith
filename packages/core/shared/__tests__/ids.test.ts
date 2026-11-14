import { describe, expect, it } from "vitest";
import { isUuid, randomIds, sequentialIds } from "../ids";

describe("randomIds", () => {
  it("produces distinct version 4 UUIDs", () => {
    const ids = Array.from({ length: 1000 }, () => randomIds.next());
    expect(new Set(ids).size).toBe(1000);
    for (const id of ids) {
      expect(isUuid(id)).toBe(true);
      expect(id[14]).toBe("4");
    }
  });
});

describe("sequentialIds", () => {
  it("counts upwards from 1 with well-formed UUIDs", () => {
    const ids = sequentialIds();
    expect(ids.next()).toBe("00000000-0000-4000-8000-000000000001");
    expect(ids.next()).toBe("00000000-0000-4000-8000-000000000002");
    expect(isUuid(ids.next())).toBe(true);
  });

  it("starts where it is told and keeps separate generators independent", () => {
    const first = sequentialIds(255);
    const second = sequentialIds(255);
    expect(first.next()).toBe("00000000-0000-4000-8000-0000000000ff");
    expect(first.next()).toBe("00000000-0000-4000-8000-000000000100");
    expect(second.next()).toBe("00000000-0000-4000-8000-0000000000ff");
  });

  it("stops at the end of its range instead of producing a malformed id", () => {
    const ids = sequentialIds(0xffff_ffff_ffff);
    expect(ids.next()).toBe("00000000-0000-4000-8000-ffffffffffff");
    expect(() => ids.next()).toThrow(RangeError);
  });

  it.each([-1, 1.5, Number.NaN, 0x1_0000_0000_0000])(
    "refuses to start at %s",
    (start) => {
      expect(() => sequentialIds(start)).toThrow(RangeError);
    },
  );
});

describe("isUuid", () => {
  it.each([
    "00000000-0000-4000-8000-000000000001",
    "3F2504E0-4F89-41D3-9A0C-0305E82C3301",
    "018f4c7e-8a3b-7c1d-9e2f-0a1b2c3d4e5f",
  ])("accepts %s", (value) => {
    expect(isUuid(value)).toBe(true);
  });

  it.each([
    "",
    "not-a-uuid",
    "00000000-0000-0000-0000-000000000000",
    "00000000-0000-4000-7000-000000000001",
    "00000000000040008000000000000001",
    "00000000-0000-4000-8000-00000000000g",
    " 00000000-0000-4000-8000-000000000001",
    42,
    null,
    undefined,
  ])("rejects %j", (value) => {
    expect(isUuid(value)).toBe(false);
  });
});
