import { verifiedIdentity } from "@/src/services/identity";
import { env } from "cloudflare:workers";

export async function isAuthenticated(request: Request) {
  // Legacy name retained for API compatibility; this is operator authorization.
  const manager = String(env.LILITH_ADMIN_EMAIL ?? "")
    .trim()
    .toLowerCase();
  const account = await verifiedIdentity(request);
  return Boolean(manager && account?.email.trim().toLowerCase() === manager);
}

export function hasImportToken(request: Request) {
  const expected = String(env.LEAD_IMPORT_TOKEN ?? "").trim();
  if (!expected) return false;

  const bearer = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "")
    .trim();
  const headerToken = request.headers.get("x-lilith-import-token")?.trim();

  return Boolean(
    (bearer && bearer === expected) ||
    (headerToken && headerToken === expected),
  );
}

export async function canImportLeads(request: Request) {
  return (await isAuthenticated(request)) || hasImportToken(request);
}
