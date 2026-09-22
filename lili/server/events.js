/**
 * Append-only event log.
 *
 * Records status changes and significant actions so a handoff can be audited.
 * It deliberately does NOT record: API keys, raw model responses, or any model
 * reasoning. Only the decision and its inputs are kept.
 */
import { load, save } from "./store.js";
import { randomUUID } from "node:crypto";

const REDACT = /(api[-_]?key|authorization|bearer|secret|token|password)/i;

function scrub(note) {
  if (typeof note !== "string") return note;
  return REDACT.test(note) ? "[redacted]" : note.slice(0, 500);
}

export function record({ actorId, actorRole, type, subjectId, from = null, to = null, note = null, meta = null }) {
  const events = load("events", []);
  const event = {
    id: randomUUID(),
    ts: new Date().toISOString(),
    actorId,
    actorRole,
    type,
    subjectId,
    from,
    to,
    note: scrub(note),
    meta: meta && typeof meta === "object" ? JSON.parse(JSON.stringify(meta)) : null,
  };
  events.push(event);
  save("events", events);
  return event;
}

export function listFor(subjectId) {
  return load("events", []).filter((e) => e.subjectId === subjectId);
}

export function listAll(limit = 200) {
  return load("events", []).slice(-limit).reverse();
}
