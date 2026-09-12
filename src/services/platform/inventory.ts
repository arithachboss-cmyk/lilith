import type {
  Actor,
  PropertyInput,
  RequirementInput,
} from "../../domain/platform/contracts";
import { audit, database, event, now, statement, uid } from "./database";
import { requireRole } from "./auth";
import { ApiError } from "./http";
import {
  PROPERTY_COLUMNS,
  REQUIREMENT_COLUMNS,
  propertyRecord,
  requirementRecord,
  type StoredProperty,
  type StoredRequirement,
} from "./records";

export async function createProperty(account: Actor, value: PropertyInput) {
  requireRole(account, ["OWNER"]);
  const id = uid(),
    at = now();
  await database().batch([
    statement(
      `INSERT INTO mp_properties (id,owner_id,name,description,transaction_type,property_type,location,price,currency,bedrooms,area_sqm,facilities,status,verified,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,'PUBLISHED',0,?)`,
      id,
      account.id,
      value.name,
      value.description,
      value.transactionType,
      value.propertyType,
      value.location,
      value.price,
      value.currency,
      value.bedrooms,
      value.areaSqm,
      JSON.stringify(value.facilities),
      at,
    ),
    audit(account.id, "property.created", id),
    event(account.id, "property_created", id, `property-created:${id}`),
    audit(account.id, "property.published", id),
    event(account.id, "property_published", id, `property-published:${id}`),
  ]);
  return { id };
}
export async function createRequirement(
  account: Actor,
  value: RequirementInput,
) {
  requireRole(account, ["AGENT", "CLIENT"]);
  const id = uid(),
    at = now();
  await database().batch([
    statement(
      `INSERT INTO mp_requirements (id,created_by,title,description,transaction_type,property_type,budget_max,currency,locations,min_bedrooms,facilities,hard_budget,hard_location,consent_at,status,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,'ACTIVE',?)`,
      id,
      account.id,
      value.title,
      value.description,
      value.transactionType,
      value.propertyType,
      value.budgetMax,
      value.currency,
      JSON.stringify(value.locations),
      value.minBedrooms,
      JSON.stringify(value.facilities),
      Number(value.hardBudget),
      Number(value.hardLocation),
      at,
      at,
    ),
    audit(account.id, "requirement.created", id, { consent: true }),
    event(account.id, "requirement_created", id, `requirement:${id}`),
  ]);
  return { id };
}
export async function getProperty(account: Actor, id: string) {
  const row = await statement(
    `SELECT ${PROPERTY_COLUMNS} FROM mp_properties WHERE id=? AND (status='PUBLISHED' OR owner_id=?)`,
    id,
    account.id,
  ).first<StoredProperty>();
  if (!row) throw new ApiError(404, "NOT_FOUND", "Property not found");
  return propertyRecord(row);
}
export async function getRequirement(account: Actor, id: string) {
  const row = await statement(
    `SELECT ${REQUIREMENT_COLUMNS} FROM mp_requirements WHERE id=? AND created_by=?`,
    id,
    account.id,
  ).first<StoredRequirement>();
  if (!row) throw new ApiError(404, "NOT_FOUND", "Requirement not found");
  return requirementRecord(row);
}
export const PAGE_SIZE = 20;
export async function ownInventory(
  account: Actor,
  cursor: number,
  kind: "properties" | "requirements",
) {
  if (kind === "properties") {
    const rows = await statement(
      `SELECT ${PROPERTY_COLUMNS} FROM mp_properties WHERE owner_id=? ORDER BY created_at DESC,id LIMIT ? OFFSET ?`,
      account.id,
      PAGE_SIZE + 1,
      cursor,
    ).all<StoredProperty>();
    return {
      items: rows.results.slice(0, PAGE_SIZE).map(propertyRecord),
      nextCursor: rows.results.length > PAGE_SIZE ? cursor + PAGE_SIZE : null,
    };
  }
  const rows = await statement(
    `SELECT ${REQUIREMENT_COLUMNS} FROM mp_requirements WHERE created_by=? ORDER BY created_at DESC,id LIMIT ? OFFSET ?`,
    account.id,
    PAGE_SIZE + 1,
    cursor,
  ).all<StoredRequirement>();
  return {
    items: rows.results.slice(0, PAGE_SIZE).map(requirementRecord),
    nextCursor: rows.results.length > PAGE_SIZE ? cursor + PAGE_SIZE : null,
  };
}
