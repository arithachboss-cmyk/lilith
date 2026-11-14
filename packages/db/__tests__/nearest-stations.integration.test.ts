import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  DEFAULT_STATION_LIMIT,
  MAX_STATION_LIMIT,
  MAX_STATION_RADIUS_METERS,
  createDatabaseClient,
  type DatabaseClient,
  type NearbyStation,
} from "../index";
import {
  STATION_SEEDS,
  findStationSeed,
  runSeed,
  stationSeedId,
  type StationSeed,
} from "../seed/index";
import { geodesicMeters, type Position } from "./geodesy";
import { STATION_REFERENCES } from "./station-reference";
import {
  createEmptyDatabase,
  migrate,
  query,
  type TestDatabase,
} from "./test-database";

// DB-003: `nearestStations(point, 1500)` returns correct ordering, and
// known-distance assertions (Thong Lo station → a fixed test point, ±50 m).

let database: TestDatabase;
let client: DatabaseClient;

beforeAll(async () => {
  database = await createEmptyDatabase();
  const result = migrate(database.url);
  if (result.status !== 0) throw new Error(result.output);
  await runSeed(database.url);
  client = createDatabaseClient(database.url);
});

afterAll(async () => {
  await client.close();
  await database.drop();
});

const THONG_LO = findStationSeed("BTS", "E6");
const EVERYWHERE = MAX_STATION_RADIUS_METERS;

/** Fixed test points and their distance to Thong Lo station. */
// The distances are Karney's geodesic on WGS 84, computed with the
// geographiclib package: a calculation outside PostGIS and outside this
// repository.
const KNOWN_FROM_THONG_LO = [
  { name: "the station itself", lat: 13.72435715, lng: 100.5784291, metres: 0 },
  {
    name: "0.01° due north",
    lat: 13.73435715,
    lng: 100.5784291,
    metres: 1106.368,
  },
  {
    name: "0.01° due east",
    lat: 13.72435715,
    lng: 100.5884291,
    metres: 1081.615,
  },
  { name: "13.7300, 100.5800", lat: 13.73, lng: 100.58, metres: 647.015 },
  {
    name: "Ekkamai station as Wikidata places it",
    lat: 13.719558333333334,
    lng: 100.585175,
    metres: 902.373,
  },
  {
    name: "Phrom Phong station as Wikidata places it",
    lat: 13.730438888888889,
    lng: 100.56973055555555,
    metres: 1156.684,
  },
] as const;

const ORIGINS: readonly (Position & { readonly name: string })[] = [
  { name: "Asok junction", lat: 13.7375, lng: 100.5608 },
  { name: "Thong Lo station", lat: THONG_LO.lat, lng: THONG_LO.lng },
  { name: "Ari station", lat: 13.77985028, lng: 100.5446531 },
  { name: "On Nut station", lat: 13.70563696, lng: 100.6010277 },
  { name: "Lumphini Park", lat: 13.7307, lng: 100.5418 },
  { name: "between the two lines", lat: 13.7305, lng: 100.5655 },
];

const keyOf = (station: Pick<NearbyStation, "system" | "code">): string =>
  `${station.system} ${station.code}`;

/** What an independent calculation says the answer must be. */
function expectedWithin(
  origin: Position,
  radius: number,
): { key: string; metres: number }[] {
  return STATION_SEEDS.map((seed) => ({
    key: keyOf(seed),
    metres: geodesicMeters(origin, seed),
  }))
    .filter((entry) => entry.metres <= radius)
    .sort((a, b) => a.metres - b.metres);
}

function distanceTo(
  stations: readonly NearbyStation[],
  seed: StationSeed,
): number | undefined {
  return stations.find((station) => keyOf(station) === keyOf(seed))
    ?.distanceMeters;
}

describe("known distances from Thong Lo station", () => {
  for (const point of KNOWN_FROM_THONG_LO) {
    it(`${point.name}: ${Math.round(point.metres)} m`, async () => {
      const stations = await client.geo.nearestStations(point, 1500);
      const measured = distanceTo(stations, THONG_LO);
      expect(measured).toBeDefined();
      // The card's tolerance.
      expect(Math.abs((measured ?? NaN) - point.metres)).toBeLessThanOrEqual(
        50,
      );
      // What the function really achieves: whole metres.
      expect(Math.abs((measured ?? NaN) - point.metres)).toBeLessThanOrEqual(
        0.5,
      );
    });
  }

  it("places the seed's Thong Lo station within 50 m of where two neighbours say it is", () => {
    // Sukhumvit Road is straight between Phrom Phong and Ekkamai. Wikidata
    // places both to an arc second. A station on the line between them adds
    // no detour; one that is off the line, or swapped, adds a long one.
    const reference = (code: string): Position => {
      const found = STATION_REFERENCES.find((entry) => entry.code === code);
      if (found === undefined) throw new Error(`no reference ${code}`);
      return found;
    };
    const before = reference("E5");
    const after = reference("E7");
    const detour =
      geodesicMeters(before, THONG_LO) +
      geodesicMeters(THONG_LO, after) -
      geodesicMeters(before, after);
    expect(detour).toBeGreaterThanOrEqual(0);
    expect(detour).toBeLessThan(5);
  });
});

describe("nearestStations(point, 1500)", () => {
  it("lists Thong Lo, Ekkamai and Phrom Phong, in that order, from Thong Lo station", async () => {
    const stations = await client.geo.nearestStations(THONG_LO, 1500);
    expect(
      stations.map((station) => [station.code, station.distanceMeters]),
    ).toEqual([
      ["E6", 0],
      ["E7", 895],
      ["E5", 1160],
    ]);
  });

  it("lists both systems, nearest first, from Asok junction", async () => {
    const stations = await client.geo.nearestStations(
      { lat: 13.7375, lng: 100.5608 },
      1500,
    );
    expect(
      stations
        .slice(0, 4)
        .map((station) => [keyOf(station), station.distanceMeters]),
    ).toEqual([
      ["BTS E4", 69],
      ["MRT BL22", 136],
      ["BTS E3", 667],
      ["BTS E5", 1239],
    ]);
  });

  for (const origin of ORIGINS) {
    it(`returns exactly the stations within 1,500 m of ${origin.name}, nearest first`, async () => {
      const expected = expectedWithin(origin, 1500);
      // The comparison is only fair when no station sits on the edge and no
      // two are at the same distance.
      for (const seed of STATION_SEEDS)
        expect(Math.abs(geodesicMeters(origin, seed) - 1500)).toBeGreaterThan(
          1,
        );
      expected.forEach((entry, index) => {
        const next = expected[index + 1];
        if (next !== undefined)
          expect(next.metres - entry.metres).toBeGreaterThan(0.01);
      });

      const stations = await client.geo.nearestStations(origin, 1500);
      expect(stations.map(keyOf)).toEqual(expected.map((entry) => entry.key));
      expect(stations.length).toBeGreaterThan(0);
      for (const station of stations)
        expect(station.distanceMeters).toBeLessThanOrEqual(1500);
    });
  }
});

describe("nearestStations distances", () => {
  for (const origin of ORIGINS) {
    it(`agree with an independent calculation to the metre, for all 24 stations from ${origin.name}`, async () => {
      const stations = await client.geo.nearestStations(origin, EVERYWHERE);
      expect(stations).toHaveLength(24);
      for (const station of stations) {
        const seed = findStationSeed(
          station.system as StationSeed["system"],
          station.code,
        );
        const independent = geodesicMeters(origin, seed);
        expect(
          Math.abs(station.distanceMeters - independent),
          keyOf(station),
        ).toBeLessThanOrEqual(0.51);
      }
    });

    it(`never decrease down the list, from ${origin.name}`, async () => {
      const stations = await client.geo.nearestStations(origin, EVERYWHERE);
      const distances = stations.map((station) => station.distanceMeters);
      expect(distances).toEqual([...distances].sort((a, b) => a - b));
    });
  }

  it("are whole metres", async () => {
    const stations = await client.geo.nearestStations(ORIGINS[0]!, EVERYWHERE);
    for (const station of stations)
      expect(Number.isInteger(station.distanceMeters)).toBe(true);
  });
});

describe("nearestStations result", () => {
  it("carries the station's id, system, line, code, names and point", async () => {
    const [nearest] = await client.geo.nearestStations(THONG_LO, 100);
    expect(nearest).toEqual({
      id: stationSeedId(THONG_LO),
      system: "BTS",
      line: "Sukhumvit",
      code: "E6",
      nameTh: "ทองหล่อ",
      nameEn: "Thong Lo",
      point: { lat: 13.72435715, lng: 100.5784291 },
      distanceMeters: 0,
    });
  });

  it("gives an MRT station its own system and line", async () => {
    const [nearest] = await client.geo.nearestStations(
      findStationSeed("MRT", "BL26"),
      50,
    );
    expect(nearest).toMatchObject({
      system: "MRT",
      line: "Blue",
      code: "BL26",
      nameTh: "สีลม",
      nameEn: "Si Lom",
    });
  });

  it("is empty where no station is in reach", async () => {
    const chiangMai = { lat: 18.7883, lng: 98.9853 };
    expect(await client.geo.nearestStations(chiangMai, EVERYWHERE)).toEqual([]);
    expect(await client.geo.nearestStations(THONG_LO, 1)).toHaveLength(1);
  });

  it("does not read the point with latitude and longitude swapped", async () => {
    // 13.7° E, 100.6° N does not exist; a swap must fail, not answer.
    await expect(
      client.geo.nearestStations({ lat: 100.5784291, lng: 13.72435715 }, 1500),
    ).rejects.toThrow(RangeError);
    // A real point at the swapped longitude, far to the west: nothing there.
    expect(
      await client.geo.nearestStations(
        { lat: 13.72435715, lng: 13.72435715 },
        EVERYWHERE,
      ),
    ).toEqual([]);
  });
});

describe("nearestStations radius", () => {
  it("includes a station whose exact distance is inside the radius, and not one outside", async () => {
    const ekkamai = findStationSeed("BTS", "E7");
    const exact = geodesicMeters(THONG_LO, ekkamai); // 894.84 m
    expect(exact % 1).toBeGreaterThan(0.1);
    expect(exact % 1).toBeLessThan(0.9);
    const inside = await client.geo.nearestStations(THONG_LO, Math.ceil(exact));
    const outside = await client.geo.nearestStations(
      THONG_LO,
      Math.floor(exact),
    );
    expect(inside.map((station) => station.code)).toEqual(["E6", "E7"]);
    expect(outside.map((station) => station.code)).toEqual(["E6"]);
  });

  it("widens the answer as the radius grows", async () => {
    let previous = 0;
    for (const radius of [100, 1000, 2000, 5000, EVERYWHERE]) {
      const stations = await client.geo.nearestStations(THONG_LO, radius);
      expect(stations.length).toBeGreaterThanOrEqual(previous);
      expect(stations.length).toBe(expectedWithin(THONG_LO, radius).length);
      previous = stations.length;
    }
    expect(previous).toBe(24);
  });

  it("refuses a radius that is not a whole number from 1 to 50,000", async () => {
    for (const radius of [0, -1, 1.5, 50_001, Number.NaN, Infinity])
      await expect(
        client.geo.nearestStations(THONG_LO, radius),
        String(radius),
      ).rejects.toThrow(RangeError);
    expect(MAX_STATION_RADIUS_METERS).toBe(50_000);
  });
});

describe("nearestStations limit", () => {
  it("returns the nearest few when a limit is given", async () => {
    const all = await client.geo.nearestStations(THONG_LO, EVERYWHERE);
    const three = await client.geo.nearestStations(THONG_LO, EVERYWHERE, {
      limit: 3,
    });
    expect(three).toEqual(all.slice(0, 3));
  });

  it("returns at most 50 unless told otherwise, and never more than 200", async () => {
    expect(DEFAULT_STATION_LIMIT).toBe(50);
    expect(MAX_STATION_LIMIT).toBe(200);
    for (const limit of [0, -1, 2.5, 201, Number.NaN])
      await expect(
        client.geo.nearestStations(THONG_LO, 1500, { limit }),
        String(limit),
      ).rejects.toThrow(RangeError);
    expect(
      await client.geo.nearestStations(THONG_LO, EVERYWHERE, { limit: 200 }),
    ).toHaveLength(24);
  });

  it("caps a crowded answer at the default limit", async () => {
    const crowded = await createEmptyDatabase();
    try {
      expect(migrate(crowded.url).status).toBe(0);
      await query(
        crowded.url,
        `INSERT INTO transit_stations (system, line, code, name_th, name_en, point)
         SELECT 'BRT', 'Test', 'T' || n, 'ทดสอบ', 'Test',
                ST_SetSRID(ST_MakePoint(100.5 + n * 0.0001, 13.7), 4326)::geography
           FROM generate_series(1, 60) AS n`,
      );
      const other = createDatabaseClient(crowded.url);
      try {
        const origin = { lat: 13.7, lng: 100.5 };
        const capped = await other.geo.nearestStations(origin, 5000);
        expect(capped).toHaveLength(50);
        expect(capped.map((station) => station.code)).toEqual(
          Array.from({ length: 50 }, (_, index) => `T${index + 1}`),
        );
        expect(
          await other.geo.nearestStations(origin, 5000, { limit: 60 }),
        ).toHaveLength(60);
      } finally {
        await other.close();
      }
    } finally {
      await crowded.drop();
    }
  });
});

describe("nearestStations origin", () => {
  it("refuses a latitude or longitude that is not on the globe", async () => {
    const bad: Position[] = [
      { lat: 90.1, lng: 100 },
      { lat: -90.1, lng: 100 },
      { lat: 13.7, lng: 180.1 },
      { lat: 13.7, lng: -180.1 },
      { lat: Number.NaN, lng: 100 },
      { lat: 13.7, lng: Infinity },
      { lat: "13.7" as never, lng: 100 },
    ];
    for (const origin of bad)
      await expect(
        client.geo.nearestStations(origin, 1500),
        JSON.stringify(origin),
      ).rejects.toThrow(RangeError);
  });

  it("accepts the edges of the globe", async () => {
    for (const origin of [
      { lat: 90, lng: 180 },
      { lat: -90, lng: -180 },
      { lat: 0, lng: 0 },
    ])
      expect(await client.geo.nearestStations(origin, 1500)).toEqual([]);
  });
});

describe("nearestStations at an interchange", () => {
  it("orders stations at the same distance by system, line and code", async () => {
    const siam = findStationSeed("BTS", "CEN");
    // Siam serves two BTS lines from one building.
    await query(
      database.url,
      `INSERT INTO transit_stations (system, line, code, name_th, name_en, point)
       VALUES ('BTS', 'Silom', 'CEN', 'สยาม', 'Siam',
               ST_SetSRID(ST_MakePoint($2::float8, $1::float8), 4326)::geography),
              ('ARL', 'Test', 'ZZ', 'ทดสอบ', 'Test',
               ST_SetSRID(ST_MakePoint($2::float8, $1::float8), 4326)::geography)`,
      [siam.lat, siam.lng],
    );
    try {
      const stations = await client.geo.nearestStations(siam, 10);
      expect(
        stations.map((station) => [
          station.system,
          station.line,
          station.code,
          station.distanceMeters,
        ]),
      ).toEqual([
        ["BTS", "Silom", "CEN", 0],
        ["BTS", "Sukhumvit", "CEN", 0],
        ["ARL", "Test", "ZZ", 0],
      ]);
    } finally {
      await query(
        database.url,
        "DELETE FROM transit_stations WHERE line IN ('Silom', 'Test')",
      );
    }
  });
});
