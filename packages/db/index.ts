// The only package that talks to PostgreSQL (Blueprint §19). Everything else
// reaches the database through the client created here.
export {
  ACTOR_SETTING,
  createDatabaseClient,
  getDatabaseClient,
  type DatabaseClient,
  type DatabaseProbe,
  type DatabaseTransaction,
} from "./client";
export {
  DEFAULT_STATION_LIMIT,
  MAX_STATION_LIMIT,
  MAX_STATION_RADIUS_METERS,
  type GeoPoint,
  type GeoQueries,
  type NearbyStation,
  type TransitSystem,
} from "./geo";
export {
  LOCAL_DATABASE_URL,
  databaseUrl,
  migrationDatabaseUrl,
  type Environment,
} from "./env";
