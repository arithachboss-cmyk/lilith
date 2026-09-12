import type { z } from "zod";
import {
  canTransition,
  type DealState,
} from "../../domain/deals/state-machine";
import type {
  Actor,
  ViewingInput,
  messageInput,
  transitionInput,
} from "../../domain/platform/contracts";
import type { DomainEventName } from "../../domain/platform/events";
import { audit, database, event, now, statement, uid } from "./database";
import { ApiError } from "./http";
import { getProperty } from "./inventory";
import {
  MESSAGE_COLUMNS,
  ROOM_COLUMNS,
  VIEWING_COLUMNS,
  type ChatMessage,
  type Room,
  type RoomView,
  type TimelineEvent,
  type Viewing,
} from "./records";

export async function roomAccess(account: Actor, id: string): Promise<Room> {
  const room = await statement(
    `SELECT ${ROOM_COLUMNS} FROM mp_deal_rooms WHERE id=? AND EXISTS (SELECT 1 FROM mp_deal_participants WHERE room_id=mp_deal_rooms.id AND user_id=?)`,
    id,
    account.id,
  ).first<Room>();
  if (!room) throw new ApiError(404, "NOT_FOUND", "Deal room not found");
  return room;
}
function permittedActions(
  room: Room,
  account: Actor,
  viewing: Viewing | undefined,
): string[] {
  const actions: string[] = [];
  if (canTransition(room.state, "VIEWING_REQUESTED"))
    actions.push("VIEWING_REQUESTED");
  if (
    canTransition(room.state, "VIEWING_CONFIRMED") &&
    viewing &&
    viewing.requestedBy !== account.id &&
    Date.parse(viewing.scheduledAt) > Date.now()
  )
    actions.push("VIEWING_CONFIRMED");
  if (
    canTransition(room.state, "VIEWING_COMPLETED") &&
    viewing &&
    Date.parse(viewing.scheduledAt) <= Date.now()
  )
    actions.push("VIEWING_COMPLETED");
  if (canTransition(room.state, "CANCELLED")) actions.push("CANCELLED");
  return actions;
}
export async function roomDetail(
  account: Actor,
  id: string,
): Promise<RoomView> {
  const room = await roomAccess(account, id);
  const match = await statement(
    "SELECT property_id AS propertyId FROM mp_matches WHERE id=?",
    room.matchId,
  ).first<{ propertyId: string }>();
  if (!match) throw new Error("Room match is missing");
  const [property, participants, viewings, messages, timeline] =
    await Promise.all([
      getProperty(account, match.propertyId),
      statement(
        "SELECT p.user_id AS userId,p.side,profile.display_name AS displayName FROM mp_deal_participants p JOIN mp_profiles profile ON profile.user_id=p.user_id WHERE p.room_id=? ORDER BY p.side",
        id,
      ).all<{ userId: string; side: string; displayName: string }>(),
      statement(
        `SELECT ${VIEWING_COLUMNS} FROM mp_viewings WHERE room_id=? ORDER BY created_at DESC LIMIT 20`,
        id,
      ).all<Viewing>(),
      statement(
        `SELECT ${MESSAGE_COLUMNS} FROM mp_messages WHERE room_id=? ORDER BY created_at DESC,id DESC LIMIT 100`,
        id,
      ).all<ChatMessage>(),
      statement(
        "SELECT name,payload,created_at AS createdAt FROM mp_events WHERE resource_id=? AND kind='DOMAIN' ORDER BY created_at DESC,id DESC LIMIT 100",
        id,
      ).all<TimelineEvent>(),
    ]);
  return {
    ...room,
    property,
    participants: participants.results,
    viewings: viewings.results,
    messages: messages.results.reverse(),
    timeline: timeline.results,
    allowedActions: permittedActions(room, account, viewings.results[0]),
  };
}
export async function listRooms(account: Actor, cursor: number) {
  const rows = await statement(
    `SELECT r.id,r.state,r.created_at AS createdAt,p.name AS propertyName,p.location FROM mp_deal_rooms r JOIN mp_matches m ON m.id=r.match_id JOIN mp_properties p ON p.id=m.property_id JOIN mp_deal_participants participant ON participant.room_id=r.id WHERE participant.user_id=? ORDER BY r.created_at DESC,r.id LIMIT 21 OFFSET ?`,
    account.id,
    cursor,
  ).all<{
    id: string;
    state: DealState;
    createdAt: string;
    propertyName: string;
    location: string;
  }>();
  return {
    items: rows.results.slice(0, 20),
    nextCursor: rows.results.length > 20 ? cursor + 20 : null,
  };
}
export async function requestViewing(
  account: Actor,
  id: string,
  value: ViewingInput,
) {
  const room = await roomAccess(account, id);
  const scheduledAt = new Date(value.scheduledAt).toISOString();
  const previous = await statement(
    `SELECT ${VIEWING_COLUMNS} FROM mp_viewings WHERE requested_by=? AND request_id=?`,
    account.id,
    value.requestId,
  ).first<Viewing>();
  if (previous) {
    if (
      previous.roomId !== id ||
      previous.scheduledAt !== scheduledAt ||
      previous.notes !== value.notes
    )
      throw new ApiError(
        409,
        "IDEMPOTENCY_CONFLICT",
        "This request ID was already used for another viewing",
      );
    return previous;
  }
  if (!canTransition(room.state, "VIEWING_REQUESTED"))
    throw new ApiError(
      409,
      "INVALID_TRANSITION",
      "This deal cannot request a viewing in its current state",
    );
  const MAX_VIEWING_HORIZON_MS = 366 * 24 * 60 * 60 * 1000;
  const timestamp = Date.parse(scheduledAt);
  if (
    timestamp <= Date.now() ||
    timestamp > Date.now() + MAX_VIEWING_HORIZON_MS
  )
    throw new ApiError(
      422,
      "INVALID_VIEWING_TIME",
      "Choose a future viewing within the next year",
    );
  const operation = uid(),
    viewingId = uid(),
    at = now();
  const guard = {
    sql: "EXISTS (SELECT 1 FROM mp_deal_rooms WHERE id=? AND last_operation_id=?)",
    args: [id, operation],
  };
  const results = await database()
    .batch([
      statement(
        "UPDATE mp_deal_rooms SET state='VIEWING_REQUESTED',version=version+1,last_operation_id=? WHERE id=? AND version=? AND state=?",
        operation,
        id,
        room.version,
        room.state,
      ),
      statement(
        "INSERT INTO mp_viewings (id,room_id,requested_by,scheduled_at,notes,status,request_id,created_at) SELECT ?,id,?,?,?,'REQUESTED',?,? FROM mp_deal_rooms WHERE id=? AND last_operation_id=?",
        viewingId,
        account.id,
        scheduledAt,
        value.notes,
        value.requestId,
        at,
        id,
        operation,
      ),
      audit(
        account.id,
        "viewing.requested",
        id,
        { viewingId, from: room.state, to: "VIEWING_REQUESTED" },
        guard,
      ),
      event(
        account.id,
        "viewing_requested",
        id,
        `viewing:${viewingId}`,
        { viewingId, scheduledAt },
        guard,
      ),
      statement(
        "INSERT INTO mp_notifications (id,user_id,event_key,title,href,created_at) SELECT ? || ':' || user_id,user_id,?,'A viewing needs your confirmation',?,? FROM mp_deal_participants WHERE room_id=? AND user_id<>? AND EXISTS (SELECT 1 FROM mp_deal_rooms WHERE id=? AND last_operation_id=?)",
        viewingId,
        `viewing:${viewingId}`,
        `/middle/deals/${id}`,
        at,
        id,
        account.id,
        id,
        operation,
      ),
    ])
    .catch(async (error: unknown) => {
      const concurrent = await statement(
        `SELECT ${VIEWING_COLUMNS} FROM mp_viewings WHERE requested_by=? AND request_id=?`,
        account.id,
        value.requestId,
      ).first<Viewing>();
      if (
        concurrent &&
        (concurrent.roomId !== id ||
          concurrent.scheduledAt !== scheduledAt ||
          concurrent.notes !== value.notes)
      ) {
        throw new ApiError(
          409,
          "IDEMPOTENCY_CONFLICT",
          "This request ID was already used for another viewing",
        );
      }
      throw error;
    });
  if (results[0].meta.changes !== 1) {
    const retry = await statement(
      `SELECT ${VIEWING_COLUMNS} FROM mp_viewings WHERE requested_by=? AND request_id=?`,
      account.id,
      value.requestId,
    ).first<Viewing>();
    if (
      retry &&
      retry.roomId === id &&
      retry.scheduledAt === scheduledAt &&
      retry.notes === value.notes
    )
      return retry;
    throw new ApiError(
      409,
      "STALE_DEAL",
      "The deal changed. Refresh and try again.",
    );
  }
  return statement(
    `SELECT ${VIEWING_COLUMNS} FROM mp_viewings WHERE id=?`,
    viewingId,
  ).first<Viewing>();
}

/** Every persisted transition goes through authorization, rules, CAS, audit and an outbox event. */
export async function transitionDeal(
  account: Actor,
  id: string,
  value: z.infer<typeof transitionInput>,
) {
  const room = await roomAccess(account, id);
  const viewing = await statement(
    `SELECT ${VIEWING_COLUMNS} FROM mp_viewings WHERE room_id=? ORDER BY created_at DESC LIMIT 1`,
    id,
  ).first<Viewing>();
  if (!permittedActions(room, account, viewing ?? undefined).includes(value.to))
    throw new ApiError(
      409,
      "INVALID_TRANSITION",
      "This transition is unavailable for you in the current deal state",
    );
  const operation = uid();
  const eventNames: Record<typeof value.to, DomainEventName> = {
    VIEWING_CONFIRMED: "viewing_confirmed",
    VIEWING_COMPLETED: "viewing_completed",
    CANCELLED: "deal_cancelled",
  };
  const viewingStates = {
    VIEWING_CONFIRMED: "CONFIRMED",
    VIEWING_COMPLETED: "COMPLETED",
    CANCELLED: "CANCELLED",
  };
  const guard = {
    sql: "EXISTS (SELECT 1 FROM mp_deal_rooms WHERE id=? AND last_operation_id=?)",
    args: [id, operation],
  };
  const result = await database().batch([
    statement(
      "UPDATE mp_deal_rooms SET state=?,version=version+1,last_operation_id=? WHERE id=? AND state=? AND version=?",
      value.to,
      operation,
      id,
      room.state,
      room.version,
    ),
    statement(
      "UPDATE mp_viewings SET status=? WHERE room_id=? AND status<>'COMPLETED' AND EXISTS (SELECT 1 FROM mp_deal_rooms WHERE id=? AND last_operation_id=?)",
      viewingStates[value.to],
      id,
      id,
      operation,
    ),
    audit(
      account.id,
      "deal.transitioned",
      id,
      { from: room.state, to: value.to, reason: value.reason },
      guard,
    ),
    event(
      account.id,
      eventNames[value.to],
      id,
      `transition:${operation}`,
      { from: room.state, to: value.to, reason: value.reason },
      guard,
    ),
  ]);
  if (result[0].meta.changes !== 1)
    throw new ApiError(
      409,
      "STALE_DEAL",
      "The deal changed. Refresh and try again.",
    );
  return { id, state: value.to };
}
export async function sendMessage(
  account: Actor,
  id: string,
  value: z.infer<typeof messageInput>,
) {
  const room = await roomAccess(account, id);
  if (["CANCELLED", "DEAL_CLOSED"].includes(room.state))
    throw new ApiError(409, "CLOSED_DEAL", "This deal is read only");
  const messageId = uid();
  const previous = await statement(
    `SELECT ${MESSAGE_COLUMNS} FROM mp_messages WHERE sender_id=? AND request_id=?`,
    account.id,
    value.requestId,
  ).first<ChatMessage>();
  if (previous) {
    if (previous.roomId !== id || previous.body !== value.body)
      throw new ApiError(
        409,
        "IDEMPOTENCY_CONFLICT",
        "This request ID was already used for a different message",
      );
    return previous;
  }
  const guard = {
    sql: "EXISTS (SELECT 1 FROM mp_messages WHERE id=?)",
    args: [messageId],
  };
  await database().batch([
    statement(
      "INSERT INTO mp_messages (id,room_id,sender_id,body,request_id,created_at) SELECT ?,id,?,?,?,? FROM mp_deal_rooms WHERE id=? AND state NOT IN ('CANCELLED','DEAL_CLOSED') ON CONFLICT(sender_id,request_id) DO NOTHING",
      messageId,
      account.id,
      value.body,
      value.requestId,
      now(),
      id,
    ),
    audit(account.id, "message.sent", id, { messageId }, guard),
    event(
      account.id,
      "message_sent",
      id,
      `message:${messageId}`,
      { messageId },
      guard,
    ),
  ]);
  const saved = await statement(
    `SELECT ${MESSAGE_COLUMNS} FROM mp_messages WHERE sender_id=? AND request_id=?`,
    account.id,
    value.requestId,
  ).first<ChatMessage>();
  if (!saved)
    throw new ApiError(
      409,
      "CLOSED_DEAL",
      "The deal was closed. Message was not sent.",
    );
  if (saved.roomId !== id || saved.body !== value.body)
    throw new ApiError(
      409,
      "IDEMPOTENCY_CONFLICT",
      "This request ID was already used for a different message",
    );
  return saved;
}
