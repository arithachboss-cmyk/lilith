import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDatabaseClient } from "../index";
import {
  LOCATION_SEEDS,
  STATION_SEEDS,
  locationSeedId,
  runSeed,
  stationSeedId,
  type SeedResult,
} from "../seed/index";
import {
  createEmptyDatabase,
  migrate,
  query,
  type TestDatabase,
} from "./test-database";

// DB-003: stations seeded with real coordinates. DB-011: seeding twice gives
// identical row counts and identical ids.

const packageRoot = fileURLToPath(new URL("../", import.meta.url));
const SOME_USER = "7b1f6c1e-9d0a-4b7e-8a53-3f1f0e5d2c11";

async function migrated(): Promise<TestDatabase> {
  const database = await createEmptyDatabase();
  const result = migrate(database.url);
  if (result.status !== 0) throw new Error(result.output);
  return database;
}

let database: TestDatabase;
let first: SeedResult[];

const sql = <Row extends Record<string, unknown>>(
  text: string,
  values: unknown[] = [],
) => query<Row>(database.url, text, values);

type Snapshot = {
  id: string;
  stamp: string;
  version: string;
};

/** Every seeded row with its update time and row version. */
async function snapshot(): Promise<Snapshot[]> {
  return sql<Snapshot>(
    `SELECT id::text, updated_at::text AS stamp, xmin::text AS version
       FROM locations
      UNION ALL
     SELECT id::text, updated_at::text, xmin::text FROM transit_stations
      ORDER BY 1`,
  );
}

beforeAll(async () => {
  database = await migrated();
  first = await runSeed(database.url);
});

afterAll(async () => {
  await database.drop();
});

describe("the reference seed, first run", () => {
  it("reports 5 locations and 24 stations inserted", () => {
    expect(first).toEqual([
      { table: "locations", inserted: 5, updated: 0, unchanged: 0 },
      { table: "transit_stations", inserted: 24, updated: 0, unchanged: 0 },
    ]);
  });

  it("creates 3 areas, with levels in the order of the hierarchy", async () => {
    const rows = await sql<{ level: string; total: number }>(
      `SELECT l.level::text AS level, count(*)::int AS total
         FROM locations l GROUP BY l.level ORDER BY l.level`,
    );
    expect(rows).toEqual([
      { level: "COUNTRY", total: 1 },
      { level: "PROVINCE", total: 1 },
      { level: "AREA", total: 3 },
    ]);
  });

  it("creates 24 stations: 15 on the BTS Sukhumvit line and 9 on the MRT Blue line", async () => {
    const rows = await sql<{ system: string; line: string; total: number }>(
      `SELECT system::text, line, count(*)::int AS total
         FROM transit_stations GROUP BY system, line ORDER BY system`,
    );
    expect(rows).toEqual([
      { system: "BTS", line: "Sukhumvit", total: 15 },
      { system: "MRT", line: "Blue", total: 9 },
    ]);
  });

  it("stores every station exactly as the seed lists it, under its fixed id", async () => {
    const rows = await sql<Record<string, unknown>>(
      `SELECT id::text, system::text, line, code, name_th, name_en,
              ST_Y(point::geometry) AS lat, ST_X(point::geometry) AS lng
         FROM transit_stations ORDER BY id`,
    );
    const expected = STATION_SEEDS.map((seed) => ({
      id: stationSeedId(seed),
      system: seed.system,
      line: seed.line,
      code: seed.code,
      name_th: seed.nameTh,
      name_en: seed.nameEn,
      lat: seed.lat,
      lng: seed.lng,
    })).sort((a, b) => (a.id < b.id ? -1 : 1));
    expect(rows).toEqual(expected);
  });

  it("stores every location exactly as the seed lists it, under its fixed id", async () => {
    const rows = await sql<Record<string, unknown>>(
      `SELECT id::text, parent_id::text AS parent, level::text, slug,
              name_th, name_en,
              ST_Y(centroid::geometry) AS lat, ST_X(centroid::geometry) AS lng,
              boundary IS NULL AS unbounded
         FROM locations ORDER BY id`,
    );
    const expected = LOCATION_SEEDS.map((seed) => ({
      id: locationSeedId(seed.slug),
      parent: seed.parentSlug === null ? null : locationSeedId(seed.parentSlug),
      level: seed.level,
      slug: seed.slug,
      name_th: seed.nameTh,
      name_en: seed.nameEn,
      lat: seed.lat,
      lng: seed.lng,
      unbounded: true,
    })).sort((a, b) => (a.id < b.id ? -1 : 1));
    expect(rows).toEqual(expected);
  });

  it("chains each area to Bangkok and Bangkok to Thailand", async () => {
    const rows = await sql<{ path: string }>(
      `WITH RECURSIVE up AS (
         SELECT id, parent_id, slug::text AS path FROM locations
          WHERE level = 'AREA'
         UNION ALL
         SELECT p.id, p.parent_id, up.path || ' < ' || p.slug
           FROM up JOIN locations p ON p.id = up.parent_id
       )
       SELECT path FROM up WHERE parent_id IS NULL ORDER BY path`,
    );
    expect(rows.map((row) => row.path)).toEqual([
      "ari < bangkok < thailand",
      "on-nut < bangkok < thailand",
      "thong-lo < bangkok < thailand",
    ]);
  });

  it("puts the centre of each area on the BTS station of the same name", async () => {
    const rows = await sql<{ area: string; code: string; metres: number }>(
      `SELECT l.slug AS area, s.code, ST_Distance(l.centroid, s.point) AS metres
         FROM locations l
         JOIN transit_stations s
           ON s.system = 'BTS' AND s.name_en = l.name_en
        WHERE l.level = 'AREA' ORDER BY l.slug`,
    );
    expect(rows).toEqual([
      { area: "ari", code: "N5", metres: 0 },
      { area: "on-nut", code: "E9", metres: 0 },
      { area: "thong-lo", code: "E6", metres: 0 },
    ]);
  });

  it("can be read through the generated Prisma client", async () => {
    const client = createDatabaseClient(database.url);
    try {
      const { areas, stations } = await client.withActor(
        SOME_USER,
        async (tx) => ({
          areas: await tx.location.findMany({
            where: { level: "AREA" },
            orderBy: { slug: "asc" },
            select: {
              slug: true,
              nameTh: true,
              nameEn: true,
              parent: { select: { slug: true } },
            },
          }),
          stations: await tx.transitStation.count({
            where: { system: "MRT" },
          }),
        }),
      );
      expect(areas).toEqual([
        {
          slug: "ari",
          nameTh: "อารีย์",
          nameEn: "Ari",
          parent: { slug: "bangkok" },
        },
        {
          slug: "on-nut",
          nameTh: "อ่อนนุช",
          nameEn: "On Nut",
          parent: { slug: "bangkok" },
        },
        {
          slug: "thong-lo",
          nameTh: "ทองหล่อ",
          nameEn: "Thong Lo",
          parent: { slug: "bangkok" },
        },
      ]);
      expect(stations).toBe(9);
    } finally {
      await client.close();
    }
  });
});

describe("the reference seed, run again", () => {
  it("changes nothing: same ids, same row versions, same update times", async () => {
    const before = await snapshot();
    expect(before).toHaveLength(29);
    const second = await runSeed(database.url);
    expect(second).toEqual([
      { table: "locations", inserted: 0, updated: 0, unchanged: 5 },
      { table: "transit_stations", inserted: 0, updated: 0, unchanged: 24 },
    ]);
    expect(await snapshot()).toEqual(before);
  });

  it("puts back a station that was renamed and moved, and touches no other row", async () => {
    const id = stationSeedId({ system: "BTS", line: "Sukhumvit", code: "E6" });
    await sql(
      `UPDATE transit_stations
          SET name_th = 'ผิด',
              point = ST_SetSRID(ST_MakePoint(100.579, 13.7242), 4326)::geography
        WHERE id = $1`,
      [id],
    );
    const before = await snapshot();
    const again = await runSeed(database.url);
    expect(again).toEqual([
      { table: "locations", inserted: 0, updated: 0, unchanged: 5 },
      { table: "transit_stations", inserted: 0, updated: 1, unchanged: 23 },
    ]);
    const [row] = await sql<{ name: string; lat: number; lng: number }>(
      `SELECT name_th AS name, ST_Y(point::geometry) AS lat,
              ST_X(point::geometry) AS lng
         FROM transit_stations WHERE id = $1`,
      [id],
    );
    expect(row).toEqual({
      name: "ทองหล่อ",
      lat: 13.72435715,
      lng: 100.5784291,
    });
    const after = await snapshot();
    const changed = after.filter(
      (now, index) => now.version !== before[index]?.version,
    );
    expect(changed.map((now) => now.id)).toEqual([id]);
  });

  it("puts back a station that was only moved", async () => {
    const id = stationSeedId({ system: "MRT", line: "Blue", code: "BL22" });
    await sql(
      `UPDATE transit_stations
          SET point = ST_SetSRID(ST_MakePoint(100.561, 13.7376), 4326)::geography
        WHERE id = $1`,
      [id],
    );
    const again = await runSeed(database.url);
    expect(again[1]).toEqual({
      table: "transit_stations",
      inserted: 0,
      updated: 1,
      unchanged: 23,
    });
    const [row] = await sql<{ lat: number; lng: number }>(
      `SELECT ST_Y(point::geometry) AS lat, ST_X(point::geometry) AS lng
         FROM transit_stations WHERE id = $1`,
      [id],
    );
    expect(row).toEqual({ lat: 13.73855034, lng: 100.5614557 });
  });

  it("puts back a location whose centre alone was moved", async () => {
    await sql(
      `UPDATE locations
          SET centroid = ST_SetSRID(ST_MakePoint(100.579, 13.7242), 4326)::geography
        WHERE slug = 'thong-lo'`,
    );
    const again = await runSeed(database.url);
    expect(again[0]).toEqual({
      table: "locations",
      inserted: 0,
      updated: 1,
      unchanged: 4,
    });
    const [row] = await sql<{ lat: number; lng: number }>(
      `SELECT ST_Y(centroid::geometry) AS lat, ST_X(centroid::geometry) AS lng
         FROM locations WHERE slug = 'thong-lo'`,
    );
    expect(row).toEqual({ lat: 13.72435715, lng: 100.5784291 });
  });

  it("puts back a location whose parent, name or centre was changed", async () => {
    await sql(
      `UPDATE locations SET parent_id = NULL, name_en = 'Aree',
              centroid = ST_SetSRID(ST_MakePoint(100.5411, 13.7803), 4326)::geography
        WHERE slug = 'ari'`,
    );
    const again = await runSeed(database.url);
    expect(again[0]).toEqual({
      table: "locations",
      inserted: 0,
      updated: 1,
      unchanged: 4,
    });
    const [row] = await sql<{ parent: string; name: string; lat: number }>(
      `SELECT parent_id::text AS parent, name_en AS name,
              ST_Y(centroid::geometry) AS lat
         FROM locations WHERE slug = 'ari'`,
    );
    expect(row).toEqual({
      parent: locationSeedId("bangkok"),
      name: "Ari",
      lat: 13.77985028,
    });
  });

  it("leaves a row it does not know alone", async () => {
    await sql(
      `INSERT INTO transit_stations (system, line, code, name_th, name_en, point)
       VALUES ('ARL', 'City', 'A8', 'พญาไท', 'Phaya Thai',
               ST_SetSRID(ST_MakePoint(100.5348391, 13.75677853), 4326)::geography)`,
    );
    await runSeed(database.url);
    const [row] = await sql<{ total: number; arl: number }>(
      `SELECT count(*)::int AS total,
              count(*) FILTER (WHERE system = 'ARL')::int AS arl
         FROM transit_stations`,
    );
    expect(row).toEqual({ total: 25, arl: 1 });
  });
});

describe("the reference seed, when a row is in its way", () => {
  let blocked: TestDatabase;

  beforeAll(async () => {
    blocked = await migrated();
    // The same station under another id: the seed's own row cannot be added.
    await query(
      blocked.url,
      `INSERT INTO transit_stations (system, line, code, name_th, name_en, point)
       VALUES ('BTS', 'Sukhumvit', 'N5', 'อารีย์', 'Ari',
               ST_SetSRID(ST_MakePoint(100.5446531, 13.77985028), 4326)::geography)`,
    );
  });

  afterAll(async () => {
    await blocked.drop();
  });

  it("fails, and writes nothing at all", async () => {
    await expect(runSeed(blocked.url)).rejects.toMatchObject({
      code: "23505",
    });
    const [row] = await query<{ locations: number; stations: number }>(
      blocked.url,
      `SELECT (SELECT count(*)::int FROM locations) AS locations,
              (SELECT count(*)::int FROM transit_stations) AS stations`,
    );
    expect(row).toEqual({ locations: 0, stations: 1 });
  });
});

describe("pnpm db:seed", () => {
  let fresh: TestDatabase;

  beforeAll(async () => {
    fresh = await migrated();
  });

  afterAll(async () => {
    await fresh.drop();
  });

  function seedCommand(url: string) {
    const result = spawnSync(
      process.execPath,
      ["node_modules/tsx/dist/cli.mjs", "seed/cli.ts"],
      {
        cwd: packageRoot,
        encoding: "utf8",
        env: { ...process.env, DATABASE_URL: url, DATABASE_DIRECT_URL: url },
      },
    );
    return { status: result.status, output: result.stdout + result.stderr };
  }

  it("seeds the database it is pointed at and says what it did", async () => {
    const result = seedCommand(fresh.url);
    expect(result.status, result.output).toBe(0);
    expect(result.output).toContain(
      "locations: 5 inserted, 0 updated, 0 unchanged",
    );
    expect(result.output).toContain(
      "transit_stations: 24 inserted, 0 updated, 0 unchanged",
    );
    const [row] = await query<{ stations: number }>(
      fresh.url,
      "SELECT count(*)::int AS stations FROM transit_stations",
    );
    expect(row?.stations).toBe(24);
  });

  it("is safe to run a second time", () => {
    const result = seedCommand(fresh.url);
    expect(result.status, result.output).toBe(0);
    expect(result.output).toContain(
      "locations: 0 inserted, 0 updated, 5 unchanged",
    );
    expect(result.output).toContain(
      "transit_stations: 0 inserted, 0 updated, 24 unchanged",
    );
  });

  it("fails with a non-zero status when the tables are missing", async () => {
    const empty = await createEmptyDatabase();
    try {
      const result = seedCommand(empty.url);
      expect(result.status).not.toBe(0);
      expect(result.output).toContain("locations");
    } finally {
      await empty.drop();
    }
  });
});
