import { env } from "cloudflare:workers";
import { z } from "zod";

const assertionSchema = z
  .object({
    id: z.string().min(1).max(200),
    email: z.email().max(254),
    method: z.string().min(1).max(10),
    url: z.url().max(2048),
    issued_at: z.number().int(),
    expires_at: z.number().int(),
  })
  .strict();

/**
 * No production identity adapter is enabled in this readiness build.
 * Unsigned oai-authenticated-* headers alone never authorize access.
 * The ephemeral signed adapter is exclusively for the loopback mock harness.
 * Sites authentication must be integrated and independently verified before
 * enabling an approved operator; a trust flag or Host check is not proof.
 */
export async function verifiedIdentity(source: Request | Headers) {
  // SSR helpers lack verified method/URL context, so they stay signed out.
  if (!(source instanceof Request)) return null;
  const config = env as typeof env & {
    MIDDLE_READINESS_MODE?: string;
    MIDDLE_MOCK_IDENTITY_KEY?: string;
  };
  const key = config.MIDDLE_MOCK_IDENTITY_KEY ?? "";
  if (config.MIDDLE_READINESS_MODE !== "mock" || !/^[a-f0-9]{64}$/.test(key))
    return null;
  const headers = source instanceof Request ? source.headers : source;
  const assertion = headers.get("x-middle-mock-identity") ?? "";
  if (assertion.length > 4096) return null;
  const parts = assertion.split(".");
  if (parts.length !== 2 || !/^[a-f0-9]{64}$/.test(parts[1])) return null;
  try {
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      Uint8Array.from(key.match(/../g)!, (v) => parseInt(v, 16)),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const valid = await crypto.subtle.verify(
      "HMAC",
      cryptoKey,
      Uint8Array.from(parts[1].match(/../g)!, (v) => parseInt(v, 16)),
      new TextEncoder().encode(parts[0]),
    );
    if (!valid) return null;
    const bytes = Uint8Array.from(
      atob(parts[0].replaceAll("-", "+").replaceAll("_", "/")),
      (c) => c.charCodeAt(0),
    );
    const identity = assertionSchema.parse(
      JSON.parse(new TextDecoder().decode(bytes)),
    );
    const url = new URL(identity.url);
    const now = Math.floor(Date.now() / 1000);
    if (
      url.protocol !== "http:" ||
      !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
      identity.issued_at > now ||
      identity.expires_at <= now ||
      identity.expires_at - identity.issued_at > 60 ||
      identity.expires_at <= identity.issued_at
    )
      return null;
    if (
      source instanceof Request &&
      (identity.url !== source.url || identity.method !== source.method)
    )
      return null;
    return { id: identity.id, email: identity.email };
  } catch {
    return null;
  }
}
