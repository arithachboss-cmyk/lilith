// The only package that talks to PostgreSQL (Blueprint §19). Everything else
// reaches the database through the client created here.
export {
  ACTOR_SETTING,
  createDatabaseClient,
  type DatabaseClient,
  type DatabaseTransaction,
} from "./client";
export {
  LOCAL_DATABASE_URL,
  databaseUrl,
  migrationDatabaseUrl,
  type Environment,
} from "./env";
