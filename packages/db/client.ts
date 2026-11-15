import { PrismaPg } from "@prisma/adapter-pg";
import type pg from "pg";
import { databaseUrl } from "./env";
import { PrismaClient, type Prisma } from "./generated/prisma/client";
import { createGeoQueries, type GeoQueries } from "./geo";

/**
 * The Prisma client of one transaction. Repositories receive this, so every
 * query they make runs as the actor of that transaction.
 */
export type DatabaseTransaction = Prisma.TransactionClient;

export interface DatabaseClient {
  /**
   * Runs `fn` in one transaction in which the setting `app.user_id` is the
   * acting user. Row Level Security policies read that setting (Blueprint
   * §14.2, ADR-0011), so a query inside `fn` sees only what the actor may see.
   *
   * The setting is local to the transaction: it is gone after commit or
   * rollback, and a pooled connection never carries it to the next request.
   */
  withActor<T>(
    userId: string,
    fn: (tx: DatabaseTransaction) => Promise<T>,
  ): Promise<T>;
  /**
   * Asks the server what it is. It reads the system catalogue only, touches
   * no table and needs no actor. It rejects when the database does not answer
   * within `timeoutMs` (2 seconds unless given).
   */
  probe(options?: { readonly timeoutMs?: number }): Promise<DatabaseProbe>;
  /**
   * Named reads of the geography reference data: locations and transit
   * stations. That data is public, so these reads need no actor. This is not
   * a way to query other tables without one.
   */
  readonly geo: GeoQueries;
  /** Closes the client. A pool passed in by the caller stays open. */
  close(): Promise<void>;
}

/** What `probe` learns from the server. */
export interface DatabaseProbe {
  readonly serverVersion: string;
  /** Installed extensions, sorted, without the built-in `plpgsql`. */
  readonly extensions: readonly string[];
}

/** The setting that Row Level Security policies read. */
export const ACTOR_SETTING = "app.user_id";

const PROBE_TIMEOUT_MS = 2_000;
// A new connection that cannot be made fails after this long instead of hanging.
const CONNECTION_TIMEOUT_MS = 5_000;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Creates the database client. Without an argument it connects with
 * `DATABASE_URL`, or to the local Docker database on a developer machine.
 */
export function createDatabaseClient(
  source: string | pg.Pool | pg.PoolConfig = databaseUrl(process.env),
): DatabaseClient {
  const adapter = new PrismaPg(
    typeof source === "string"
      ? {
          connectionString: source,
          connectionTimeoutMillis: CONNECTION_TIMEOUT_MS,
        }
      : source,
  );
  const prisma = new PrismaClient({ adapter });
  return {
    async withActor(userId, fn) {
      if (typeof userId !== "string" || !UUID_PATTERN.test(userId))
        throw new TypeError("withActor needs the acting user's id as a UUID");
      const actor = userId.toLowerCase();
      return prisma.$transaction(async (tx) => {
        // set_config(name, value, true) is the function form of SET LOCAL:
        // the value lasts until this transaction ends. Unlike the SET
        // statement it takes the value as a bound parameter.
        await tx.$executeRaw`SELECT set_config(${ACTOR_SETTING}, ${actor}, true)`;
        return fn(tx);
      });
    },
    async probe(options) {
      const rows = await withTimeout(
        prisma.$queryRaw<{ version: string; extensions: string[] }[]>`
          SELECT current_setting('server_version') AS version,
                 COALESCE(
                   array_agg(extname::text ORDER BY extname)
                     FILTER (WHERE extname <> 'plpgsql'),
                   ARRAY[]::text[]) AS extensions
            FROM pg_extension`,
        options?.timeoutMs ?? PROBE_TIMEOUT_MS,
      );
      const row = rows[0];
      if (row === undefined) throw new Error("The database gave no answer");
      return { serverVersion: row.version, extensions: row.extensions };
    },
    geo: createGeoQueries(prisma),
    close: () => prisma.$disconnect(),
  };
}

function withTimeout<T>(work: Promise<T>, milliseconds: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const expiry = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () =>
        reject(
          new Error(`The database did not answer within ${milliseconds} ms`),
        ),
      milliseconds,
    );
  });
  return Promise.race([work, expiry]).finally(() => clearTimeout(timer));
}

const SHARED_CLIENT = Symbol.for("lilith.db.client");

/**
 * The one client of this process, created on first use from `DATABASE_URL`.
 * It is kept on `globalThis` so that a development server which reloads its
 * modules does not open a new pool each time.
 */
export function getDatabaseClient(): DatabaseClient {
  const holder = globalThis as { [SHARED_CLIENT]?: DatabaseClient };
  return (holder[SHARED_CLIENT] ??= createDatabaseClient());
}
