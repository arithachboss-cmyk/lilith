import { PrismaPg } from "@prisma/adapter-pg";
import type pg from "pg";
import { databaseUrl } from "./env";
import { PrismaClient, type Prisma } from "./generated/prisma/client";

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
  /** Closes the client. A pool passed in by the caller stays open. */
  close(): Promise<void>;
}

/** The setting that Row Level Security policies read. */
export const ACTOR_SETTING = "app.user_id";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Creates the database client. Without an argument it connects with
 * `DATABASE_URL`, or to the local Docker database on a developer machine.
 */
export function createDatabaseClient(
  source: string | pg.Pool | pg.PoolConfig = databaseUrl(process.env),
): DatabaseClient {
  const prisma = new PrismaClient({ adapter: new PrismaPg(source) });
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
    close: () => prisma.$disconnect(),
  };
}
