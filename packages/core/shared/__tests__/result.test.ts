import { describe, expect, it } from "vitest";
import { err, ok, Result } from "../result";

// Cast, not annotate: an annotated const is narrowed to the side it was given.
const success = ok(2) as Result<number, string>;
const failure = err("boom") as Result<number, string>;

describe("Result", () => {
  it("builds plain tagged values", () => {
    expect(ok(2)).toEqual({ ok: true, value: 2 });
    expect(err("boom")).toEqual({ ok: false, error: "boom" });
    expect(Result.ok).toBe(ok);
    expect(Result.err).toBe(err);
  });

  it("tells the two sides apart", () => {
    expect(Result.isOk(success)).toBe(true);
    expect(Result.isErr(success)).toBe(false);
    expect(Result.isOk(failure)).toBe(false);
    expect(Result.isErr(failure)).toBe(true);
  });

  it("map changes a success and leaves a failure untouched", () => {
    expect(Result.map(success, (value) => value * 2)).toEqual(ok(4));
    expect(Result.map(failure, (value) => value * 2)).toBe(failure);
  });

  it("mapErr changes a failure and leaves a success untouched", () => {
    expect(Result.mapErr(failure, (error) => error.length)).toEqual(err(4));
    expect(Result.mapErr(success, (error) => error.length)).toBe(success);
  });

  it("andThen chains only on success and never runs the next step after a failure", () => {
    const half = (value: number): Result<number, "ODD"> =>
      value % 2 === 0 ? ok(value / 2) : err("ODD");
    expect(Result.andThen(success, half)).toEqual(ok(1));
    expect(Result.andThen(ok(3), half)).toEqual(err("ODD"));
    let called = false;
    const outcome = Result.andThen(failure, (value) => {
      called = true;
      return half(value);
    });
    expect(outcome).toBe(failure);
    expect(called).toBe(false);
  });

  it("unwrapOr returns the value or the fallback", () => {
    expect(Result.unwrapOr(success, 0)).toBe(2);
    expect(Result.unwrapOr(failure, 0)).toBe(0);
  });
});
