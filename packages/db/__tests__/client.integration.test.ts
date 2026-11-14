import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  ACTOR_SETTING,
  createDatabaseClient,
  type DatabaseClient,
  type DatabaseTransaction,
} from "../index";
import {
  createEmptyDatabase,
  migrate,
  type TestDatabase,
} from "./test-database";

const ALICE = "11111111-1111-4111-8111-111111111111";
const BOB = "22222222-2222-4222-8222-222222222222";

let database: TestDatabase;
/** One connection only, so "outside" is the very connection used inside. */
let pool: pg.Pool;
let client: DatabaseClient;

beforeAll(async () => {
  database = await createEmptyDatabase();
  const migrated = migrate(database.url);
  expect(migrated.status, migrated.output).toBe(0);
  pool = new pg.Pool({ connectionString: database.url, max: 1 });
  client = createDatabaseClient(pool);
});

afterAll(async () => {
  await client.close();
  await pool.end();
  await database.drop();
});

async function actorInside(tx: DatabaseTransaction): Promise<string | null> {
  const rows = await tx.$queryRaw<{ actor: string | null }[]>`
    SELECT current_setting('app.user_id', true) AS actor`;
  return rows[0]?.actor ?? null;
}

/**
 * The setting as the pool's connection sees it outside any transaction.
 * PostgreSQL gives NULL before the setting was ever used on a connection and
 * an empty string afterwards; both mean "no actor".
 */
async function actorOutside(from: pg.Pool = pool): Promise<string | null> {
  const result = await from.query<{ actor: string | null }>(
    "SELECT current_setting('app.user_id', true) AS actor",
  );
  const actor = result.rows[0]?.actor ?? null;
  return actor === "" ? null : actor;
}

describe("withActor", () => {
  it("has no actor before any call", async () => {
    expect(await actorOutside()).toBeNull();
  });

  it("sets app.user_id inside the transaction", async () => {
    expect(ACTOR_SETTING).toBe("app.user_id");
    expect(await client.withActor(ALICE, actorInside)).toBe(ALICE);
  });

  it("clears it once the transaction has committed", async () => {
    await client.withActor(ALICE, actorInside);
    expect(await actorOutside()).toBeNull();
  });

  it("makes current_setting('app.user_id') unusable outside, as a policy needs", async () => {
    await client.withActor(ALICE, actorInside);
    const result = await pool.query<{ actor: string | null }>(
      "SELECT NULLIF(current_setting('app.user_id', true), '')::uuid AS actor",
    );
    expect(result.rows[0]?.actor).toBeNull();
  });

  it("really runs inside a transaction, on one connection", async () => {
    const seen = await client.withActor(ALICE, async (tx) => {
      const first = await tx.$queryRaw<{ id: string; pid: number }[]>`
        SELECT txid_current()::text AS id, pg_backend_pid() AS pid`;
      const second = await tx.$queryRaw<{ id: string; pid: number }[]>`
        SELECT txid_current()::text AS id, pg_backend_pid() AS pid`;
      return { first: first[0], second: second[0] };
    });
    expect(seen.first?.id).toBe(seen.second?.id);
    expect(seen.first?.pid).toBe(seen.second?.pid);
  });

  it("gives the next caller on the same connection its own actor", async () => {
    expect(await client.withActor(ALICE, actorInside)).toBe(ALICE);
    expect(await client.withActor(BOB, actorInside)).toBe(BOB);
    expect(await actorOutside()).toBeNull();
  });

  it("returns what the callback returns", async () => {
    const value = await client.withActor(ALICE, async (tx) => {
      const rows = await tx.$queryRaw<{ sum: number }[]>`SELECT 2 + 3 AS sum`;
      return { sum: rows[0]?.sum, actor: await actorInside(tx) };
    });
    expect(value).toEqual({ sum: 5, actor: ALICE });
  });

  it("rolls back and clears the actor when the callback throws", async () => {
    await pool.query("CREATE TABLE IF NOT EXISTS rollback_probe (note text)");
    await expect(
      client.withActor(ALICE, async (tx) => {
        await tx.$executeRaw`INSERT INTO rollback_probe VALUES ('kept?')`;
        throw new Error("stop");
      }),
    ).rejects.toThrow("stop");
    const rows = await pool.query("SELECT * FROM rollback_probe");
    expect(rows.rowCount).toBe(0);
    expect(await actorOutside()).toBeNull();
  });

  it("commits the callback's writes when it succeeds", async () => {
    await pool.query("CREATE TABLE IF NOT EXISTS commit_probe (actor text)");
    await client.withActor(BOB, async (tx) => {
      await tx.$executeRaw`
        INSERT INTO commit_probe VALUES (current_setting('app.user_id'))`;
    });
    const rows = await pool.query<{ actor: string }>(
      "SELECT actor FROM commit_probe",
    );
    expect(rows.rows).toEqual([{ actor: BOB }]);
  });

  it("stores the id in lower case, whatever the caller sent", async () => {
    const upper = "AAAAAAAA-BBBB-4CCC-8DDD-EEEEEEEEEEEE";
    expect(await client.withActor(upper, actorInside)).toBe(
      upper.toLowerCase(),
    );
  });

  it("refuses anything that is not a UUID, before opening a transaction", async () => {
    const wrong: unknown[] = [
      "",
      "alice",
      "usr_01JUSER",
      `${ALICE}'; SET app.user_id = '${BOB}`,
      `${ALICE} `,
      ALICE.replaceAll("-", ""),
      null,
      undefined,
      42,
    ];
    let called = 0;
    for (const value of wrong) {
      await expect(
        client.withActor(value as string, async () => {
          called += 1;
        }),
      ).rejects.toThrow(TypeError);
    }
    expect(called).toBe(0);
    expect(await actorOutside()).toBeNull();
  });
});

describe("withActor under concurrency", () => {
  let wide: pg.Pool;
  let shared: DatabaseClient;

  beforeAll(() => {
    wide = new pg.Pool({ connectionString: database.url, max: 4 });
    shared = createDatabaseClient(wide);
  });

  afterAll(async () => {
    await shared.close();
    await wide.end();
  });

  it("never shows one actor to another's transaction", async () => {
    const actors = Array.from(
      { length: 40 },
      (_, index) =>
        `00000000-0000-4000-8000-${index.toString(16).padStart(12, "0")}`,
    );
    const seen = await Promise.all(
      actors.map((actor) =>
        shared.withActor(actor, async (tx) => {
          const before = await actorInside(tx);
          await tx.$executeRaw`SELECT pg_sleep(0.01)`;
          const after = await actorInside(tx);
          return { before, after };
        }),
      ),
    );
    seen.forEach((result, index) => {
      expect(result).toEqual({ before: actors[index], after: actors[index] });
    });
  });

  it("leaves every pooled connection without an actor afterwards", async () => {
    const leftovers = await Promise.all(
      Array.from({ length: 8 }, () => actorOutside(wide)),
    );
    expect(leftovers.every((actor) => actor === null)).toBe(true);
  });
});
