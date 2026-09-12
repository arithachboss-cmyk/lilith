import { env } from "cloudflare:workers";
import type {
  AnalyticsEventName,
  DomainEventName,
} from "../../domain/platform/events";
export function database(): D1Database {
  if (!env.DB) throw new Error("Platform database binding is missing");
  return env.DB;
}
export const now = () => new Date().toISOString();
export const uid = () => crypto.randomUUID();
export function statement(sql: string, ...params: (string | number | null)[]) {
  return database()
    .prepare(sql)
    .bind(...params);
}
export function audit(
  actor: string,
  action: string,
  resource: string,
  details: unknown = {},
  guard?: { sql: string; args: (string | number)[] },
) {
  return statement(
    `INSERT INTO mp_audit_logs (id,actor_id,action,resource_id,details,created_at) SELECT ?,?,?,?,?,? ${guard ? `WHERE ${guard.sql}` : ""}`,
    uid(),
    actor,
    action,
    resource,
    JSON.stringify(details),
    now(),
    ...(guard?.args ?? []),
  );
}
export function event(
  actor: string,
  name: DomainEventName | AnalyticsEventName,
  resource: string,
  dedupKey: string,
  payload: unknown = {},
  guard?: { sql: string; args: (string | number)[] },
  kind: "DOMAIN" | "ANALYTICS" = "DOMAIN",
) {
  return statement(
    `INSERT INTO mp_events (id,kind,name,actor_id,resource_id,payload,dedup_key,created_at) SELECT ?,?,?,?,?,?,?,? ${guard ? `WHERE ${guard.sql}` : ""} ON CONFLICT(dedup_key) DO NOTHING`,
    uid(),
    kind,
    name,
    actor,
    resource,
    JSON.stringify(payload),
    dedupKey,
    now(),
    ...(guard?.args ?? []),
  );
}
