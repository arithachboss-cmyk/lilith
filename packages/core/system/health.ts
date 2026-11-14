/**
 * The state of the platform itself: is each thing it depends on there and
 * ready? This is the first path that runs through every layer — route, core,
 * repository, database — so it also proves that the layers connect (SKEL-001,
 * ADR-0018).
 *
 * A dependency that is down is an answer, not a failure: the service never
 * throws and never returns an error for it.
 */

export type DependencyStatus =
  "ok" | "not_migrated" | "unreachable" | "not_configured";

export interface SystemHealth {
  /** `ok` when every dependency that exists is ready, otherwise `degraded`. */
  readonly status: "ok" | "degraded";
  readonly db: DependencyStatus;
  readonly queue: DependencyStatus;
  readonly ai: DependencyStatus;
  readonly version: string;
}

/** The extensions the data model needs; migration 0001 installs them. */
export const REQUIRED_EXTENSIONS = [
  "citext",
  "pg_trgm",
  "pgcrypto",
  "postgis",
  "vector",
] as const;

/** What the health service needs from the database. */
export interface DatabaseHealthPort {
  /** Rejects when the database does not answer. */
  probe(): Promise<{ readonly extensions: readonly string[] }>;
}

export interface SystemHealthDependencies {
  readonly database: DatabaseHealthPort;
  /** The running build, for example a git revision. */
  readonly version: string;
}

async function databaseStatus(
  database: DatabaseHealthPort,
): Promise<DependencyStatus> {
  try {
    const { extensions } = await database.probe();
    return REQUIRED_EXTENSIONS.every((name) => extensions.includes(name))
      ? "ok"
      : "not_migrated";
  } catch {
    return "unreachable";
  }
}

export async function getSystemHealth(
  dependencies: SystemHealthDependencies,
): Promise<SystemHealth> {
  const db = await databaseStatus(dependencies.database);
  return {
    // The job queue and the AI service are not built yet. They are reported
    // as such and do not count against the overall status.
    status: db === "ok" ? "ok" : "degraded",
    db,
    queue: "not_configured",
    ai: "not_configured",
    version: dependencies.version,
  };
}
