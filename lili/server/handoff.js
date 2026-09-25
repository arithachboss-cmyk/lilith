/**
 * Handoff to the team queue.
 *
 * Two rules the owner set are enforced here rather than in the UI:
 *  1. A suspended or rejected co-agent cannot submit. Checked server-side on every call.
 *  2. What is created is a REQUEST. Its status is `REQUESTED` and only a team member
 *     can move it to `CONFIRMED`. Lili never creates a confirmed appointment.
 *
 * Writes are idempotent: the key is derived from the content, so a double-tap, a retry
 * after a timeout, or a resubmitted form returns the original record instead of a twin.
 */
import { createHash, randomUUID } from "node:crypto";
import { load, save } from "./store.js";
import { canSubmit, assertCanRead } from "./auth.js";
import { assess } from "./readiness.js";
import { record } from "./events.js";

export const SUBMISSION_STATES = ["REQUESTED", "IN_REVIEW", "CONTACTED", "CONFIRMED", "CLOSED"];

function submissions() {
  return load("submissions", []);
}

function fingerprint(convo) {
  const payload = JSON.stringify({
    owner: convo.ownerId,
    flow: convo.flow,
    requirement: Object.keys(convo.requirement).sort().reduce((a, k) => ({ ...a, [k]: convo.requirement[k] }), {}),
    agent: convo.flow === "coagent" ? convo.agentProfile : null,
  });
  return createHash("sha256").update(payload).digest("hex").slice(0, 32);
}

export function submit(convo, user, { idempotencyKey = null } = {}) {
  const permission = canSubmit(user);
  if (!permission.allowed) {
    record({ actorId: user.id, actorRole: user.role, type: "submission_denied", subjectId: convo.id, note: permission.reason });
    return { ok: false, code: "forbidden", reason: permission.reason };
  }

  const readiness = assess({ ...convo, unansweredQuestions: convo.unansweredQuestions }, convo.lang);
  if (!readiness.canSubmit) {
    return { ok: false, code: "not_ready", readiness };
  }

  const key = idempotencyKey || fingerprint(convo);
  const list = submissions();
  const existing = list.find((s) => s.idempotencyKey === key && s.ownerId === user.id);
  if (existing) {
    record({ actorId: user.id, actorRole: user.role, type: "submission_duplicate_suppressed", subjectId: existing.id });
    return { ok: true, duplicate: true, submission: existing };
  }

  const now = new Date().toISOString();
  const submission = {
    id: randomUUID(),
    ref: `TMP-${now.slice(0, 10).replace(/-/g, "")}-${list.length + 1}`,
    idempotencyKey: key,
    ownerId: user.id,
    ownerRole: user.role,
    conversationId: convo.id,
    flow: convo.flow,
    // A request, never a confirmed appointment.
    kind: "viewing_request",
    status: "REQUESTED",
    statusHistory: [{ status: "REQUESTED", at: now, by: user.id }],
    requirement: { ...convo.requirement },
    agentProfile: convo.flow === "coagent" ? { ...convo.agentProfile } : null,
    consent: convo.flow === "coagent" ? { ...convo.consent } : null,
    flags: readiness.flags,
    openQuestions: [...convo.unansweredQuestions],
    submitterAccountStatus: user.status,
    createdAt: now,
  };
  list.push(submission);
  save("submissions", list);

  convo.submissionId = submission.id;
  record({ actorId: user.id, actorRole: user.role, type: "submission_created", subjectId: submission.id, to: "REQUESTED", meta: { ref: submission.ref, flow: convo.flow } });
  return { ok: true, duplicate: false, submission };
}

export function listForUser(user) {
  const all = submissions();
  if (user.role === "team") return all;
  return all.filter((s) => s.ownerId === user.id);
}

export function getForUser(user, id) {
  const found = submissions().find((s) => s.id === id);
  return assertCanRead(user, found) ? found : null;
}

/** Only a team member may advance status. `CONFIRMED` is reachable only from here. */
export function setStatus(user, id, status, note = null) {
  if (user.role !== "team") return { ok: false, code: "forbidden" };
  if (!SUBMISSION_STATES.includes(status)) return { ok: false, code: "bad_status" };

  const list = submissions();
  const s = list.find((x) => x.id === id);
  if (!s) return { ok: false, code: "not_found" };

  const from = s.status;
  s.status = status;
  s.statusHistory.push({ status, at: new Date().toISOString(), by: user.id, note: note ? String(note).slice(0, 300) : null });
  save("submissions", list);
  record({ actorId: user.id, actorRole: user.role, type: "submission_status_changed", subjectId: s.id, from, to: status, note });
  return { ok: true, submission: s };
}

/** Messages the team chooses to share back to the submitting partner. */
export function shareNote(user, id, text) {
  if (user.role !== "team") return { ok: false, code: "forbidden" };
  const list = submissions();
  const s = list.find((x) => x.id === id);
  if (!s) return { ok: false, code: "not_found" };
  s.sharedNotes = s.sharedNotes || [];
  s.sharedNotes.push({ at: new Date().toISOString(), by: user.id, text: String(text).slice(0, 1000) });
  save("submissions", list);
  record({ actorId: user.id, actorRole: user.role, type: "note_shared_with_partner", subjectId: s.id });
  return { ok: true, submission: s };
}
