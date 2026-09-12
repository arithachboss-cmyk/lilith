import type {
  MatchingProperty,
  MatchingRequirement,
  MatchResult,
} from "../../domain/matching/types";
import type { DealState } from "../../domain/deals/state-machine";
export interface Property extends MatchingProperty {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  areaSqm: number;
  status: string;
  verified: boolean;
  createdAt: string;
}
export interface Requirement extends MatchingRequirement {
  id: string;
  createdBy: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
}
export interface MatchView {
  id: string;
  status: string;
  property: Property;
  requirementTitle: string;
  counterparty: string;
  result: MatchResult;
  decision: string | null;
  counterpartyDecision: string | null;
  roomId: string | null;
}
export interface Room {
  id: string;
  matchId: string;
  state: DealState;
  version: number;
  lastOperationId: string;
  createdAt: string;
}
export interface Viewing {
  id: string;
  roomId: string;
  requestedBy: string;
  scheduledAt: string;
  notes: string;
  status: string;
  requestId: string;
  createdAt: string;
}
export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  body: string;
  requestId: string;
  createdAt: string;
  displayName?: string;
}
export interface TimelineEvent {
  name: string;
  payload: string;
  createdAt: string;
}
export interface RoomView extends Room {
  property: Property;
  participants: { userId: string; displayName: string; side: string }[];
  viewings: Viewing[];
  messages: ChatMessage[];
  timeline: TimelineEvent[];
  allowedActions: string[];
}
export const PROPERTY_COLUMNS = `id,owner_id AS ownerId,name,description,transaction_type AS transactionType,property_type AS propertyType,location,price,currency,bedrooms,area_sqm AS areaSqm,facilities,status,verified,created_at AS createdAt`;
export const REQUIREMENT_COLUMNS = `id,created_by AS createdBy,title,description,transaction_type AS transactionType,property_type AS propertyType,budget_max AS budgetMax,currency,locations,min_bedrooms AS minBedrooms,facilities,hard_budget AS hardBudget,hard_location AS hardLocation,status,created_at AS createdAt`;
export const ROOM_COLUMNS = `id,match_id AS matchId,state,version,last_operation_id AS lastOperationId,created_at AS createdAt`;
export const VIEWING_COLUMNS = `id,room_id AS roomId,requested_by AS requestedBy,scheduled_at AS scheduledAt,notes,status,request_id AS requestId,created_at AS createdAt`;
export const MESSAGE_COLUMNS = `id,room_id AS roomId,sender_id AS senderId,body,request_id AS requestId,created_at AS createdAt`;
type StoredProperty = Omit<Property, "facilities" | "verified"> & {
  facilities: string;
  verified: number;
};
type StoredRequirement = Omit<
  Requirement,
  "facilities" | "locations" | "hardBudget" | "hardLocation"
> & {
  facilities: string;
  locations: string;
  hardBudget: number;
  hardLocation: number;
};
export function propertyRecord(row: StoredProperty): Property {
  return {
    ...row,
    facilities: JSON.parse(row.facilities) as string[],
    verified: Boolean(row.verified),
  };
}
export function requirementRecord(row: StoredRequirement): Requirement {
  return {
    ...row,
    facilities: JSON.parse(row.facilities) as string[],
    locations: JSON.parse(row.locations) as string[],
    hardBudget: Boolean(row.hardBudget),
    hardLocation: Boolean(row.hardLocation),
  };
}
export type { StoredProperty, StoredRequirement };
