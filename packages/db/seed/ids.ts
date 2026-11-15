import { createHash } from "node:crypto";

/**
 * Seed rows get the same id on every machine and on every run (Blueprint
 * DB-011: "fixed UUID namespace"). An id is the version-5 UUID of the row's
 * natural key inside this namespace, so it never changes while the key stays.
 *
 * The namespace is `uuidV5("seed.lilith.invalid", DNS namespace)`.
 */
export const SEED_NAMESPACE = "0821b600-2a16-5efc-9b10-f0367e0d65f1";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** RFC 9562 version 5: the SHA-1 of the namespace followed by the name. */
export function uuidV5(name: string, namespace: string): string {
  if (!UUID_PATTERN.test(namespace))
    throw new TypeError("uuidV5 needs the namespace as a lower-case UUID");
  const hash = createHash("sha1")
    .update(Buffer.from(namespace.replaceAll("-", ""), "hex"))
    .update(name, "utf8")
    .digest();
  const bytes = hash.subarray(0, 16);
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x50; // version 5
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80; // RFC variant
  const hex = bytes.toString("hex");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}

/** The id of the seed row of `table` whose natural key is `key`. */
export function seedId(table: string, key: string): string {
  if (table === "" || key === "")
    throw new TypeError("seedId needs a table and a key");
  return uuidV5(`${table}:${key}`, SEED_NAMESPACE);
}

/** What a seed function needs from a connection: `pg` clients and pools fit. */
export interface SeedConnection {
  query(
    text: string,
    values?: unknown[],
  ): Promise<{ readonly rows: Record<string, unknown>[] }>;
}

/** What one seed function did to its table. */
export interface SeedResult {
  readonly table: string;
  readonly inserted: number;
  readonly updated: number;
  readonly unchanged: number;
}

/**
 * Counts the rows an upsert returned. The statement returns one row per row
 * it wrote, with `inserted` true for a new row; a row that already matched is
 * not written and not returned.
 */
export function countUpserts(
  table: string,
  total: number,
  written: readonly Record<string, unknown>[],
): SeedResult {
  const inserted = written.filter((row) => row["inserted"] === true).length;
  return {
    table,
    inserted,
    updated: written.length - inserted,
    unchanged: total - written.length,
  };
}
