/** Decimal currency strings at boundaries; integer minor units during arithmetic. */
export const MONEY_PATTERN = /^(0|[1-9]\d{0,11})(\.\d{1,2})?$/;
export function toMinorUnits(value: string): bigint {
  if (!MONEY_PATTERN.test(value)) throw new Error("Invalid monetary amount");
  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole) * BigInt(100) + BigInt(fraction.padEnd(2, "0"));
}
export function fromMinorUnits(value: bigint): string {
  if (value < BigInt(0)) throw new Error("Negative monetary amount");
  return `${value / BigInt(100)}.${String(value % BigInt(100)).padStart(2, "0")}`;
}
export function canonicalMoney(value: string): string {
  return fromMinorUnits(toMinorUnits(value));
}
