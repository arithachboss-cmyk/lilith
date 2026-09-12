import { evaluateConstraints, normalizeLocation } from "./constraints";
import {
  DEFAULT_MATCH_WEIGHTS,
  MATCH_ENGINE_VERSION,
  validateWeights,
} from "./weights";
import type {
  MatchingProperty,
  MatchingRequirement,
  MatchResult,
  MatchWeights,
} from "./types";

/** No model/network access: identical inputs and weights always produce identical output. */
export function matchProperty(
  property: MatchingProperty,
  requirement: MatchingRequirement,
  weights: MatchWeights = DEFAULT_MATCH_WEIGHTS,
): MatchResult {
  validateWeights(weights);
  const constraints = evaluateConstraints(property, requirement);
  const hardConstraintPassed =
    constraints.transaction &&
    constraints.type &&
    constraints.currency &&
    (!requirement.hardBudget || constraints.budget) &&
    (!requirement.hardLocation || constraints.location);
  const available = new Set(property.facilities.map(normalizeLocation));
  const wanted = [...new Set(requirement.facilities.map(normalizeLocation))];
  const found = wanted.filter((facility) => available.has(facility));
  const facilities = wanted.length ? found.length / wanted.length : 1;
  const reasons = [
    {
      code: "transaction",
      matched: constraints.transaction,
      text: constraints.transaction
        ? "Transaction type matches"
        : "Different transaction type",
    },
    {
      code: "property_type",
      matched: constraints.type,
      text: constraints.type
        ? "Property type matches"
        : "Different property type",
    },
    {
      code: "currency",
      matched: constraints.currency,
      text: constraints.currency ? "Currency matches" : "Different currency",
    },
    {
      code: "budget",
      matched: constraints.budget,
      text: constraints.budget
        ? "Within the maximum budget"
        : "Above the maximum budget",
    },
    {
      code: "location",
      matched: constraints.location,
      text: constraints.location
        ? "In a requested location"
        : "Outside the requested locations",
    },
    {
      code: "bedrooms",
      matched: constraints.bedrooms,
      text: constraints.bedrooms
        ? "Meets the bedroom requirement"
        : "Fewer bedrooms than requested",
    },
    {
      code: "facilities",
      matched: facilities === 1,
      text: wanted.length
        ? `${found.length} of ${wanted.length} requested facilities`
        : "No facility preferences specified",
    },
  ];
  const total = Object.values(weights).reduce((sum, value) => sum + value, 0);
  const weighted =
    Number(constraints.budget) * weights.budget +
    Number(constraints.location) * weights.location +
    Number(constraints.bedrooms) * weights.bedrooms +
    facilities * weights.facilities;
  const unmatchedConstraints = reasons
    .filter((reason) => !reason.matched)
    .map((reason) => reason.code);
  return {
    score: hardConstraintPassed ? Math.round((weighted / total) * 100) : 0,
    // Completeness of preference evidence, not a probability of closing a deal.
    confidence: wanted.length ? 1 : 0.75,
    hardConstraintPassed,
    matchedConstraints: reasons
      .filter((reason) => reason.matched)
      .map((reason) => reason.code),
    unmatchedConstraints,
    tradeoffs: reasons
      .filter((reason) => !reason.matched)
      .map((reason) => reason.text),
    reasons,
    engineVersion: MATCH_ENGINE_VERSION,
  };
}
