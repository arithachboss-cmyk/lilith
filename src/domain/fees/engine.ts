import { fromMinorUnits, toMinorUnits } from "../shared/money";
export interface FeePolicy {
  id: string;
  rate: string;
  basis: "TRANSACTION_VALUE";
  currency: "THB";
}
export function calculateFee(transactionValue: string, policy: FeePolicy) {
  if (!/^(0\.\d{1,6}|1(?:\.0{1,6})?)$/.test(policy.rate))
    throw new Error("Invalid fee rate");
  const [whole, fraction = ""] = policy.rate.split(".");
  const precision = BigInt(1000000);
  const rate = BigInt(whole) * precision + BigInt(fraction.padEnd(6, "0"));
  const value = toMinorUnits(transactionValue);
  if (value <= BigInt(0)) throw new Error("Transaction value must be positive");
  const minorFee = (value * rate + precision / BigInt(2)) / precision;
  return {
    policyId: policy.id,
    transactionValue: fromMinorUnits(value),
    feeBasis: policy.basis,
    feeRate: policy.rate,
    feeAmount: fromMinorUnits(minorFee),
    currency: policy.currency,
    invoiceStatus: "DRAFT" as const,
    paymentStatus: "UNPAID" as const,
  };
}
