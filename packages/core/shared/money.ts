import { err, ok, type Result } from "./result";

/**
 * Money is an integer number of satang (1 baht = 100 satang) held in a
 * `bigint`. JavaScript numbers are never used for amounts (ADR-0004).
 */
export type Satang = bigint;

export type MoneyParseError = "INVALID_FORMAT" | "OUT_OF_RANGE";

const SATANG_PER_BAHT = 100n;
// The range of a PostgreSQL BIGINT, the column type of every `*_amount`.
const MAX_SATANG = 9_223_372_036_854_775_807n;
const MIN_SATANG = -9_223_372_036_854_775_808n;

// Optional sign, optional baht sign, whole baht either plain or grouped in
// threes, and at most two decimal places. No spaces and no exponent.
const BAHT_PATTERN = /^(-)?฿?(\d+|\d{1,3}(?:,\d{3})+)(?:\.(\d{1,2}))?$/;

function isInRange(amount: Satang): boolean {
  return amount >= MIN_SATANG && amount <= MAX_SATANG;
}

/** Parses a baht amount such as "12500.50", "12,500.50" or "฿12,500.50". */
function parseBaht(text: string): Result<Satang, MoneyParseError> {
  const match = BAHT_PATTERN.exec(text);
  if (!match) return err("INVALID_FORMAT");
  const [, sign, whole = "", fraction = ""] = match;
  const magnitude =
    BigInt(whole.replaceAll(",", "")) * SATANG_PER_BAHT +
    BigInt(fraction.padEnd(2, "0"));
  const amount = sign ? -magnitude : magnitude;
  return isInRange(amount) ? ok(amount) : err("OUT_OF_RANGE");
}

/** Like `parseBaht`, but throws. Use it only for values the code controls. */
function fromBaht(text: string): Satang {
  const parsed = parseBaht(text);
  if (parsed.ok) return parsed.value;
  if (parsed.error === "OUT_OF_RANGE")
    throw new RangeError(`Baht amount is out of range: ${text}`);
  throw new SyntaxError(`Not a baht amount: ${text}`);
}

function split(amount: Satang) {
  const magnitude = amount < 0n ? -amount : amount;
  return {
    sign: amount < 0n ? "-" : "",
    baht: (magnitude / SATANG_PER_BAHT).toString(),
    satang: (magnitude % SATANG_PER_BAHT).toString().padStart(2, "0"),
  };
}

/** Plain decimal baht with two places, e.g. `1250050n` → "12500.50". */
function format(amount: Satang): string {
  const { sign, baht, satang } = split(amount);
  return `${sign}${baht}.${satang}`;
}

/** Display form, e.g. `1250050n` → "฿12,500.50". */
function formatBaht(amount: Satang): string {
  const { sign, baht, satang } = split(amount);
  return `${sign}฿${baht.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${satang}`;
}

export const Money = {
  CURRENCY: "THB",
  SATANG_PER_BAHT,
  MAX_SATANG,
  MIN_SATANG,
  isInRange,
  parseBaht,
  fromBaht,
  format,
  formatBaht,
} as const;
