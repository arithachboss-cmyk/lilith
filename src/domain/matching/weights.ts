import type { MatchWeights } from "./types";
export const MATCH_ENGINE_VERSION = "deterministic-v1";
export const DEFAULT_MATCH_WEIGHTS: Readonly<MatchWeights> = Object.freeze({
  budget: 40,
  location: 30,
  bedrooms: 20,
  facilities: 10,
});
export function validateWeights(weights: MatchWeights): void {
  const values = Object.values(weights);
  if (
    values.length !== 4 ||
    values.some((value) => !Number.isFinite(value) || value < 0) ||
    values.reduce((a, b) => a + b, 0) <= 0
  ) {
    throw new Error(
      "Match weights must be finite, non-negative and have a positive sum",
    );
  }
}
