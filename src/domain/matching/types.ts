export type TransactionType = "RENT" | "SALE";
export type PropertyType = "CONDO" | "HOUSE" | "HOTEL" | "LAND" | "COMMERCIAL";
export interface MatchingProperty {
  transactionType: TransactionType;
  propertyType: PropertyType;
  price: string;
  currency: "THB";
  location: string;
  bedrooms: number;
  facilities: string[];
}
export interface MatchingRequirement {
  transactionType: TransactionType;
  propertyType: PropertyType;
  budgetMax: string;
  currency: "THB";
  locations: string[];
  minBedrooms: number;
  facilities: string[];
  hardBudget: boolean;
  hardLocation: boolean;
}
export type MatchDimension = "budget" | "location" | "bedrooms" | "facilities";
export type MatchWeights = Record<MatchDimension, number>;
export interface MatchReason {
  code: string;
  matched: boolean;
  text: string;
}
export interface MatchResult {
  score: number;
  confidence: number;
  hardConstraintPassed: boolean;
  matchedConstraints: string[];
  tradeoffs: string[];
  unmatchedConstraints: string[];
  reasons: MatchReason[];
  engineVersion: string;
}
