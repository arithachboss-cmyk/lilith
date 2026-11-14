import { getDatabaseClient, type DatabaseClient } from "@lilith/db";
import type { DatabaseHealthPort } from "./health";

/**
 * The database as the health service sees it. Without an argument it uses the
 * process's shared client; tests pass their own.
 */
export function createSystemRepository(
  client: DatabaseClient = getDatabaseClient(),
): DatabaseHealthPort {
  return { probe: () => client.probe() };
}
