import pg from "pg";
import type { SeedConnection, SeedResult } from "./ids";
import { seedLocations } from "./locations";
import { seedStations } from "./stations";

export { SEED_NAMESPACE, seedId, uuidV5 } from "./ids";
export type { SeedConnection, SeedResult } from "./ids";
export {
  LOCATION_SEEDS,
  locationSeedId,
  seedLocations,
  type LocationSeed,
} from "./locations";
export {
  STATIONS_SOURCE,
  STATION_SEEDS,
  findStationSeed,
  seedStations,
  stationSeedId,
  type StationSeed,
} from "./stations";

/**
 * Writes the reference data every environment needs: the locations and the
 * transit stations. They are real places, not test data. DB-011 adds the
 * synthetic world (users, properties, requirements) for development only.
 */
export async function seedReferenceData(
  db: SeedConnection,
): Promise<SeedResult[]> {
  return [await seedLocations(db), await seedStations(db)];
}

/**
 * `pnpm db:seed`: connects, runs `write` in one transaction and disconnects.
 * Either every row is written or none is, whatever stops the run. Without
 * `write` it writes the reference data.
 */
export async function runSeed(
  connectionString: string,
  write: (db: SeedConnection) => Promise<SeedResult[]> = seedReferenceData,
): Promise<SeedResult[]> {
  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    await client.query("BEGIN");
    try {
      const results = await write(client);
      await client.query("COMMIT");
      return results;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  } finally {
    await client.end();
  }
}
