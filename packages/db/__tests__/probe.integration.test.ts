import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDatabaseClient, type DatabaseClient } from "../index";
import {
  createEmptyDatabase,
  migrate,
  type TestDatabase,
} from "./test-database";

const REQUIRED = ["citext", "pg_trgm", "pgcrypto", "postgis", "vector"];

let empty: TestDatabase;
let migrated: TestDatabase;
let onEmpty: DatabaseClient;
let onMigrated: DatabaseClient;

beforeAll(async () => {
  empty = await createEmptyDatabase();
  migrated = await createEmptyDatabase();
  const result = migrate(migrated.url);
  expect(result.status, result.output).toBe(0);
  onEmpty = createDatabaseClient(empty.url);
  onMigrated = createDatabaseClient(migrated.url);
});

afterAll(async () => {
  await onEmpty.close();
  await onMigrated.close();
  await empty.drop();
  await migrated.drop();
});

describe("probe", () => {
  it("reports PostgreSQL 16 and the installed extensions", async () => {
    const probe = await onMigrated.probe();
    expect(probe.serverVersion).toMatch(/^16\./);
    for (const extension of REQUIRED)
      expect(probe.extensions).toContain(extension);
    expect(probe.extensions).not.toContain("plpgsql");
    expect([...probe.extensions]).toEqual([...probe.extensions].sort());
  });

  it("reports no extension on a database that was never migrated", async () => {
    expect((await onEmpty.probe()).extensions).toEqual([]);
  });

  it("needs no actor and creates nothing", async () => {
    await onEmpty.probe();
    const tables = await onEmpty.withActor(
      "11111111-1111-4111-8111-111111111111",
      (tx) => tx.$queryRaw<{ count: number }[]>`
        SELECT count(*)::int AS count FROM pg_tables
         WHERE schemaname = 'public'`,
    );
    expect(tables[0]?.count).toBe(0);
  });

  it("rejects quickly when nothing listens at the address", async () => {
    const url = new URL(migrated.url);
    url.port = "1";
    const nowhere = createDatabaseClient(url.toString());
    const started = Date.now();
    await expect(nowhere.probe()).rejects.toThrow();
    expect(Date.now() - started).toBeLessThan(5_000);
    await nowhere.close();
  });

  it("rejects when the answer takes longer than the time allowed", async () => {
    // A pool of one whose only connection is busy for a second: the probe
    // has to wait for it, which is longer than the 200 ms it is given.
    const pool = new pg.Pool({ connectionString: migrated.url, max: 1 });
    const busy = createDatabaseClient(pool);
    try {
      const sleeping = pool.query("SELECT pg_sleep(1)");
      const started = Date.now();
      await expect(busy.probe({ timeoutMs: 200 })).rejects.toThrow(
        /did not answer within 200 ms/,
      );
      const waited = Date.now() - started;
      expect(waited).toBeGreaterThanOrEqual(190);
      expect(waited).toBeLessThan(900);
      await sleeping;
      // The client is still usable once the connection is free again.
      expect((await busy.probe()).serverVersion).toMatch(/^16\./);
    } finally {
      await busy.close();
      await pool.end();
    }
  });

  it("rejects when the password is wrong", async () => {
    const url = new URL(migrated.url);
    url.password = "wrong";
    const denied = createDatabaseClient(url.toString());
    await expect(denied.probe()).rejects.toThrow();
    await denied.close();
  });
});
