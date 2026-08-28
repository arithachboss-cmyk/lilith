import { env } from "cloudflare:workers";

export function isAuthenticated(request: Request) {
  return Boolean(
    request.headers.get("oai-authenticated-user-id") &&
      request.headers.get("oai-authenticated-user-email"),
  );
}

export function hasImportToken(request: Request) {
  const expected = String(env.LEAD_IMPORT_TOKEN ?? "").trim();
  if (!expected) return false;

  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  const headerToken = request.headers.get("x-lilith-import-token")?.trim();

  return Boolean((bearer && bearer === expected) || (headerToken && headerToken === expected));
}

export function canImportLeads(request: Request) {
  return isAuthenticated(request) || hasImportToken(request);
}
