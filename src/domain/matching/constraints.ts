import { toMinorUnits } from "../shared/money";
import type { MatchingProperty, MatchingRequirement } from "./types";
export const normalizeLocation = (value: string) =>
  value.trim().toLocaleLowerCase("en").replace(/\s+/g, " ");
export function evaluateConstraints(
  property: MatchingProperty,
  requirement: MatchingRequirement,
) {
  return {
    transaction: property.transactionType === requirement.transactionType,
    type: property.propertyType === requirement.propertyType,
    currency: property.currency === requirement.currency,
    budget: toMinorUnits(property.price) <= toMinorUnits(requirement.budgetMax),
    location: requirement.locations
      .map(normalizeLocation)
      .includes(normalizeLocation(property.location)),
    bedrooms: property.bedrooms >= requirement.minBedrooms,
  };
}
