/**
 * Where the database is. The application uses `DATABASE_URL` (pooled) and
 * migrations use `DATABASE_DIRECT_URL` (not pooled), as Blueprint §20 names
 * them.
 *
 * On a developer machine neither needs to be set: with `APP_ENV` unset or
 * `local`, both fall back to the Docker database of `docker-compose.yml`.
 * Anywhere else a missing URL is an error, never a silent default.
 */

export type Environment = Readonly<Record<string, string | undefined>>;

/** The local Docker database. Its credentials exist only in docker-compose.yml. */
export const LOCAL_DATABASE_URL =
  "postgresql://lilith:lilith@127.0.0.1:54329/lilith";

function isLocal(env: Environment): boolean {
  const appEnv = env["APP_ENV"];
  return appEnv === undefined || appEnv === "" || appEnv === "local";
}

function present(value: string | undefined): string | undefined {
  return value === undefined || value.trim() === "" ? undefined : value;
}

function required(env: Environment, value: string | undefined, name: string) {
  if (value !== undefined) return value;
  if (isLocal(env)) return LOCAL_DATABASE_URL;
  throw new Error(
    `${name} is not set. It is required when APP_ENV is "${env["APP_ENV"]}".`,
  );
}

/** Connection string for the application. */
export function databaseUrl(env: Environment): string {
  return required(env, present(env["DATABASE_URL"]), "DATABASE_URL");
}

/** Connection string for migrations: the direct URL when there is one. */
export function migrationDatabaseUrl(env: Environment): string {
  return required(
    env,
    present(env["DATABASE_DIRECT_URL"]) ?? present(env["DATABASE_URL"]),
    "DATABASE_DIRECT_URL or DATABASE_URL",
  );
}
