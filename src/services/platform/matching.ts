import { env } from "cloudflare:workers";
import { z } from "zod";
import { matchProperty } from "../../domain/matching/engine";
import { DEFAULT_MATCH_WEIGHTS } from "../../domain/matching/weights";
import type { MatchResult } from "../../domain/matching/types";
import type { Actor, InterestInput } from "../../domain/platform/contracts";
import { audit, database, event, now, statement, uid } from "./database";
import { ApiError } from "./http";
import { getProperty, getRequirement } from "./inventory";
import {
  PROPERTY_COLUMNS,
  REQUIREMENT_COLUMNS,
  propertyRecord,
  requirementRecord,
  type MatchView,
  type StoredProperty,
  type StoredRequirement,
} from "./records";

export const generateInput = z
  .object({
    kind: z.enum(["property", "requirement"]),
    id: z.string().uuid(),
    cursor: z.number().int().min(0).max(1000000).default(0),
  })
  .strict();
const weightsSchema = z
  .object({
    budget: z.number().finite().nonnegative(),
    location: z.number().finite().nonnegative(),
    bedrooms: z.number().finite().nonnegative(),
    facilities: z.number().finite().nonnegative(),
  })
  .strict();
const GENERATION_PAGE_SIZE = 8;
export async function generateMatches(
  account: Actor,
  input: z.infer<typeof generateInput>,
) {
  const rawWeights = env.MATCH_WEIGHTS_JSON;
  const weights = rawWeights
    ? weightsSchema.parse(JSON.parse(String(rawWeights)))
    : DEFAULT_MATCH_WEIGHTS;
  const pairs = [];
  let hasMore = false;
  if (input.kind === "requirement") {
    const requirement = await getRequirement(account, input.id);
    if (requirement.status !== "ACTIVE")
      throw new ApiError(409, "INACTIVE_RESOURCE", "Requirement is closed");
    const rows = await statement(
      `SELECT ${PROPERTY_COLUMNS} FROM mp_properties WHERE status='PUBLISHED' AND transaction_type=? AND property_type=? AND owner_id<>? ORDER BY id LIMIT ? OFFSET ?`,
      requirement.transactionType,
      requirement.propertyType,
      account.id,
      GENERATION_PAGE_SIZE + 1,
      input.cursor,
    ).all<StoredProperty>();
    hasMore = rows.results.length > GENERATION_PAGE_SIZE;
    for (const row of rows.results.slice(0, GENERATION_PAGE_SIZE))
      pairs.push({ property: propertyRecord(row), requirement });
  } else {
    const property = await getProperty(account, input.id);
    if (property.ownerId !== account.id)
      throw new ApiError(404, "NOT_FOUND", "Property not found");
    if (property.status !== "PUBLISHED")
      throw new ApiError(409, "INACTIVE_RESOURCE", "Property is not published");
    const rows = await statement(
      `SELECT ${REQUIREMENT_COLUMNS} FROM mp_requirements WHERE status='ACTIVE' AND transaction_type=? AND property_type=? AND created_by<>? ORDER BY id LIMIT ? OFFSET ?`,
      property.transactionType,
      property.propertyType,
      account.id,
      GENERATION_PAGE_SIZE + 1,
      input.cursor,
    ).all<StoredRequirement>();
    hasMore = rows.results.length > GENERATION_PAGE_SIZE;
    for (const row of rows.results.slice(0, GENERATION_PAGE_SIZE))
      pairs.push({ property, requirement: requirementRecord(row) });
  }
  const writes: D1PreparedStatement[] = [];
  for (const { property, requirement } of pairs) {
    const result = matchProperty(property, requirement, weights),
      id = uid();
    const guard = {
      sql: "EXISTS (SELECT 1 FROM mp_matches WHERE id=?)",
      args: [id],
    };
    writes.push(
      statement(
        "INSERT INTO mp_matches (id,property_id,requirement_id,status,created_at) VALUES (?,?,?,'MATCH_CREATED',?) ON CONFLICT(property_id,requirement_id) DO NOTHING",
        id,
        property.id,
        requirement.id,
        now(),
      ),
      statement(
        "INSERT INTO mp_match_scores (match_id,score,confidence,hard_constraint_passed,result,weights,engine_version) SELECT id,?,?,?,?,?,? FROM mp_matches WHERE id=?",
        result.score,
        result.confidence,
        Number(result.hardConstraintPassed),
        JSON.stringify(result),
        JSON.stringify(weights),
        result.engineVersion,
        id,
      ),
      statement(
        `INSERT INTO mp_match_reasons (match_id,code,matched,explanation) ${result.reasons.map(() => "SELECT id,?,?,? FROM mp_matches WHERE id=?").join(" UNION ALL ")}`,
        ...result.reasons.flatMap((reason) => [
          reason.code,
          Number(reason.matched),
          reason.text,
          id,
        ]),
      ),
      audit(
        account.id,
        "match.generated",
        id,
        { engineVersion: result.engineVersion },
        guard,
      ),
      event(
        account.id,
        "match_generated",
        id,
        `match:${id}`,
        { score: result.score },
        guard,
      ),
    );
  }
  if (writes.length) await database().batch(writes);
  return {
    evaluated: pairs.length,
    nextCursor: hasMore ? input.cursor + GENERATION_PAGE_SIZE : null,
  };
}

export async function matchAccess(account: Actor, id: string) {
  const row = await statement(
    `SELECT m.id,m.property_id AS propertyId,m.requirement_id AS requirementId,m.status,p.owner_id AS ownerId,r.created_by AS demandId,p.status AS propertyStatus,r.status AS requirementStatus,s.hard_constraint_passed AS hardPassed FROM mp_matches m JOIN mp_properties p ON p.id=m.property_id JOIN mp_requirements r ON r.id=m.requirement_id JOIN mp_match_scores s ON s.match_id=m.id WHERE m.id=? AND (p.owner_id=? OR r.created_by=?)`,
    id,
    account.id,
    account.id,
  ).first<{
    id: string;
    propertyId: string;
    requirementId: string;
    status: string;
    ownerId: string;
    demandId: string;
    propertyStatus: string;
    requirementStatus: string;
    hardPassed: number;
  }>();
  if (!row) throw new ApiError(404, "NOT_FOUND", "Match not found");
  return row;
}
export async function listMatches(
  account: Actor,
  cursor: number,
  discover = false,
  requirementId?: string,
) {
  if (requirementId) await getRequirement(account, requirementId);
  const rows = await statement(
    `SELECT m.id,m.status,m.property_id AS propertyId,r.title AS requirementTitle,s.result,i.decision,other.decision AS counterpartyDecision,room.id AS roomId,profile.display_name AS counterparty
    FROM mp_matches m JOIN mp_properties p ON p.id=m.property_id JOIN mp_requirements r ON r.id=m.requirement_id JOIN mp_match_scores s ON s.match_id=m.id
    LEFT JOIN mp_interests i ON i.match_id=m.id AND i.actor_id=?
    LEFT JOIN mp_interests other ON other.match_id=m.id AND other.actor_id<>?
    LEFT JOIN mp_deal_rooms room ON room.match_id=m.id
    JOIN mp_profiles profile ON profile.user_id=CASE WHEN p.owner_id=? THEN r.created_by ELSE p.owner_id END
    WHERE (p.owner_id=? OR r.created_by=?) ${discover ? "AND s.hard_constraint_passed=1 AND p.status='PUBLISHED' AND r.status='ACTIVE' AND i.decision IS NULL" : ""} ${requirementId ? "AND r.id=?" : ""}
    ORDER BY s.score DESC,m.id LIMIT ? OFFSET ?`,
    account.id,
    account.id,
    account.id,
    account.id,
    account.id,
    ...(requirementId ? [requirementId] : []),
    11,
    cursor,
  ).all<{
    id: string;
    status: string;
    propertyId: string;
    requirementTitle: string;
    result: string;
    decision: string | null;
    counterpartyDecision: string | null;
    roomId: string | null;
    counterparty: string;
  }>();
  const items: MatchView[] = [];
  for (const row of rows.results.slice(0, 10)) {
    const { propertyId, result, ...rest } = row;
    items.push({
      ...rest,
      property: await getProperty(account, propertyId),
      result: JSON.parse(result) as MatchResult,
    });
  }
  return { items, nextCursor: rows.results.length > 10 ? cursor + 10 : null };
}

export async function expressInterest(
  account: Actor,
  id: string,
  input: InterestInput,
) {
  const match = await matchAccess(account, id);
  if (
    match.ownerId === match.demandId ||
    !match.hardPassed ||
    match.propertyStatus !== "PUBLISHED" ||
    match.requirementStatus !== "ACTIVE"
  )
    throw new ApiError(
      409,
      "MATCH_UNAVAILABLE",
      "This match is not eligible for interest",
    );
  const existingRoom = await statement(
    "SELECT id FROM mp_deal_rooms WHERE match_id=?",
    id,
  ).first<{ id: string }>();
  if (existingRoom) {
    if (input.decision === "PASS")
      throw new ApiError(
        409,
        "MUTUAL_MATCH_LOCKED",
        "Use deal cancellation after a mutual match",
      );
    return { mutual: true, roomId: existingRoom.id };
  }
  const side = account.id === match.ownerId ? "SUPPLY" : "DEMAND",
    operation = uid(),
    room = uid(),
    at = now();
  const interestGuard = {
    sql: "EXISTS (SELECT 1 FROM mp_interests WHERE match_id=? AND actor_id=? AND operation_id=?)",
    args: [id, account.id, operation],
  };
  const roomGuard = {
    sql: "EXISTS (SELECT 1 FROM mp_deal_rooms WHERE id=?)",
    args: [room],
  };
  await database().batch([
    statement(
      `INSERT INTO mp_interests (match_id,actor_id,side,decision,operation_id,updated_at)
      SELECT ?,?,?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM mp_deal_rooms WHERE match_id=?)
      ON CONFLICT(match_id,side) DO UPDATE SET decision=excluded.decision,operation_id=excluded.operation_id,updated_at=excluded.updated_at
      WHERE mp_interests.decision<>excluded.decision AND NOT EXISTS (SELECT 1 FROM mp_deal_rooms WHERE match_id=?)`,
      id,
      account.id,
      side,
      input.decision,
      operation,
      at,
      id,
      id,
    ),
    audit(
      account.id,
      "interest.recorded",
      id,
      { decision: input.decision, side },
      interestGuard,
    ),
    ...(input.decision !== "PASS"
      ? [
          event(
            account.id,
            "interest_expressed",
            id,
            `interest:${operation}`,
            { decision: input.decision, side },
            interestGuard,
          ),
        ]
      : []),
    statement(
      `UPDATE mp_matches SET status='INTEREST_EXPRESSED' WHERE id=? AND status='MATCH_CREATED' AND EXISTS (SELECT 1 FROM mp_interests WHERE match_id=? AND decision IN ('INTERESTED','SUPER_MATCH'))`,
      id,
      id,
    ),
    statement(
      `INSERT INTO mp_deal_rooms (id,match_id,state,version,last_operation_id,created_at)
      SELECT ?,m.id,'DEAL_ROOM_OPENED',0,?,? FROM mp_matches m
      JOIN mp_properties p ON p.id=m.property_id JOIN mp_requirements r ON r.id=m.requirement_id
      JOIN mp_match_scores score ON score.match_id=m.id
      JOIN mp_interests supply ON supply.match_id=m.id AND supply.actor_id=p.owner_id AND supply.side='SUPPLY'
      JOIN mp_interests demand ON demand.match_id=m.id AND demand.actor_id=r.created_by AND demand.side='DEMAND'
      WHERE m.id=? AND p.owner_id<>r.created_by AND p.status='PUBLISHED' AND r.status='ACTIVE' AND score.hard_constraint_passed=1
      AND supply.decision IN ('INTERESTED','SUPER_MATCH') AND demand.decision IN ('INTERESTED','SUPER_MATCH')
      ON CONFLICT(match_id) DO NOTHING`,
      room,
      operation,
      at,
      id,
    ),
    statement(
      "UPDATE mp_matches SET status='MUTUAL_MATCH' WHERE id=? AND EXISTS (SELECT 1 FROM mp_deal_rooms WHERE match_id=?)",
      id,
      id,
    ),
    statement(
      "INSERT INTO mp_deal_participants (room_id,user_id,side) SELECT id,?,'SUPPLY' FROM mp_deal_rooms WHERE id=? UNION ALL SELECT id,?,'DEMAND' FROM mp_deal_rooms WHERE id=?",
      match.ownerId,
      room,
      match.demandId,
      room,
    ),
    audit(account.id, "match.mutual", id, { roomId: room }, roomGuard),
    audit(account.id, "deal_room.opened", room, { matchId: id }, roomGuard),
    event(
      account.id,
      "mutual_match",
      id,
      `mutual:${id}`,
      { roomId: room },
      roomGuard,
    ),
    event(
      account.id,
      "deal_room_opened",
      room,
      `room:${room}`,
      { matchId: id },
      roomGuard,
    ),
    statement(
      "INSERT INTO mp_notifications (id,user_id,event_key,title,href,created_at) SELECT ? || ':' || user_id,user_id,?,'A mutual match opened your deal room',?,? FROM mp_deal_participants WHERE room_id=?",
      room,
      `room:${room}`,
      `/middle/deals/${room}`,
      at,
      room,
    ),
  ]);
  const result = await statement(
    "SELECT id FROM mp_deal_rooms WHERE match_id=?",
    id,
  ).first<{ id: string }>();
  if (result && input.decision === "PASS")
    throw new ApiError(
      409,
      "MUTUAL_MATCH_LOCKED",
      "A mutual match was created. Use deal cancellation.",
    );
  return { mutual: Boolean(result), roomId: result?.id ?? null };
}
