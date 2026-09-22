/**
 * Identity, role and scope — all server-side.
 *
 * The role and the account status come from the stored user record keyed by a
 * bearer token. They are never read from the request body and never from anything
 * the model produced. A prompt cannot change what a caller is allowed to do.
 */
import { randomUUID } from "node:crypto";
import { load, save } from "./store.js";

/** Demo accounts. Clearly fictional and labelled as such in the UI. */
const SEED_USERS = [
  { id: "u-tenant-1", role: "tenant", name: "Demo Tenant", status: "active", token: "demo-tenant" },
  { id: "u-agent-active", role: "coagent", name: "Demo Co-agent (active)", status: "active", token: "demo-agent-active" },
  { id: "u-agent-pending", role: "coagent", name: "Demo Co-agent (pending)", status: "pending", token: "demo-agent-pending" },
  { id: "u-agent-suspended", role: "coagent", name: "Demo Co-agent (suspended)", status: "suspended", token: "demo-agent-suspended" },
  { id: "u-agent-rejected", role: "coagent", name: "Demo Co-agent (rejected)", status: "rejected", token: "demo-agent-rejected" },
  { id: "u-team-1", role: "team", name: "Demo Team Member", status: "active", token: "demo-team" },
];

export function users() {
  let list = load("users", null);
  if (!list) list = save("users", SEED_USERS.map((u) => ({ ...u })));
  return list;
}

export function userByToken(token) {
  if (!token) return null;
  return users().find((u) => u.token === token) || null;
}

export function userById(id) {
  return users().find((u) => u.id === id) || null;
}

/**
 * Submission rights.
 *
 * Business rule given by the owner: a `pending` co-agent may still submit; a
 * `suspended` or `rejected` one may not submit anything further. This is checked
 * on the server for every write, not only when the UI happens to show a button.
 */
export function canSubmit(user) {
  if (!user) return { allowed: false, reason: "no_session" };
  if (user.role === "team") return { allowed: true, reason: null };
  if (user.role === "tenant") return user.status === "active"
    ? { allowed: true, reason: null }
    : { allowed: false, reason: "account_not_active" };
  if (user.role === "coagent") {
    if (user.status === "active" || user.status === "pending") return { allowed: true, reason: null };
    return { allowed: false, reason: `account_${user.status}` };
  }
  return { allowed: false, reason: "unknown_role" };
}

/** A co-agent sees only their own records. Team sees everything. Tenants see their own. */
export function scopeFilter(user) {
  if (user.role === "team") return () => true;
  return (record) => record.ownerId === user.id;
}

export function assertCanRead(user, record) {
  if (!record) return false;
  if (user.role === "team") return true;
  return record.ownerId === user.id;
}

export function newSessionId() {
  return randomUUID();
}
