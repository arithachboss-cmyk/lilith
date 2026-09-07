import { domainError } from "./errors.ts";
import type { DomainError } from "./errors.ts";
import { err, ok } from "./result.ts";
import type { Result } from "./result.ts";

export const MIN_SATANG = -9_223_372_036_854_775_808n;
export const MAX_SATANG = 9_223_372_036_854_775_807n;
const SATANG_PER_BAHT = 100n;
const DECIMAL_PLACES = 2;
const MAX_BAHT_INPUT_LENGTH = 21;
const BAHT_PATTERN = /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]{1,2})?$/u;

type MoneyError = DomainError<"VALIDATION_FAILED">;

function invalidAmount(reason: string): Result<never, MoneyError> {
  return err(
    domainError("VALIDATION_FAILED", "Invalid monetary amount.", {
      fieldErrors: { amount: reason },
    }),
  );
}

function inRange(amount: bigint): boolean {
  return amount >= MIN_SATANG && amount <= MAX_SATANG;
}

function tryFromBaht(value: unknown): Result<bigint, MoneyError> {
  if (typeof value !== "string")
    return invalidAmount("Expected a decimal baht string.");
  if (value.length > MAX_BAHT_INPUT_LENGTH)
    return invalidAmount("Amount exceeds the signed 64-bit satang range.");
  const match = BAHT_PATTERN.exec(value);
  // A JS dollar anchor may match before a final newline; require the entire input.
  if (match === null || match[0] !== value)
    return invalidAmount(
      "Use an ungrouped decimal with at most two fractional digits.",
    );
  const negative = value.startsWith("-");
  const unsigned = negative ? value.slice(1) : value;
  const [whole = "0", fraction = ""] = unsigned.split(".");
  const absolute =
    BigInt(whole) * SATANG_PER_BAHT +
    BigInt(fraction.padEnd(DECIMAL_PLACES, "0"));
  const amount = negative ? -absolute : absolute;
  return inRange(amount)
    ? ok(amount)
    : invalidAmount("Amount exceeds the signed 64-bit satang range.");
}

function fromBaht(value: string): bigint {
  const result = tryFromBaht(value);
  if (!result.ok) throw new RangeError(result.error.fieldErrors.amount);
  return result.value;
}

function format(amount: bigint): string {
  if (typeof amount !== "bigint" || !inRange(amount))
    throw new RangeError("Expected signed 64-bit bigint satang.");
  const negative = amount < 0n;
  const absolute = negative ? -amount : amount;
  const whole = absolute / SATANG_PER_BAHT;
  const fraction = (absolute % SATANG_PER_BAHT)
    .toString()
    .padStart(DECIMAL_PLACES, "0");
  return `${negative ? "-" : ""}${whole}.${fraction}`;
}

/** Baht/satang conversion only. Services use tryFromBaht for untrusted input. */
export const Money = Object.freeze({ fromBaht, tryFromBaht, format });
