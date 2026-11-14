import { describe, expect, it } from "vitest";
import {
  LOCATION_SEEDS,
  SEED_NAMESPACE,
  STATIONS_SOURCE,
  STATION_SEEDS,
  findStationSeed,
  locationSeedId,
  seedId,
  stationSeedId,
  uuidV5,
} from "../seed/index";
import { countUpserts } from "../seed/ids";
import { stationKey } from "../seed/stations";
import { geodesicMeters } from "./geodesy";
import {
  STATION_REFERENCES,
  referenceToleranceMeters,
} from "./station-reference";

const DNS_NAMESPACE = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
const URL_NAMESPACE = "6ba7b811-9dad-11d1-80b4-00c04fd430c8";

const BTS_ORDER = [
  ...["E9", "E8", "E7", "E6", "E5", "E4", "E3", "E2", "E1"],
  ...["CEN", "N1", "N2", "N3", "N4", "N5"],
];
const MRT_ORDER = [
  ...["BL20", "BL21", "BL22", "BL23", "BL24"],
  ...["BL25", "BL26", "BL27", "BL28"],
];

const THAI_NAME = /^[ก-ฺเ-๎0-9 ]+$/u;
const ENGLISH_NAME = /^[A-Za-z0-9 ]+$/;

function decimals(value: number): number {
  return (String(value).split(".")[1] ?? "").length;
}

describe("uuidV5", () => {
  // The expected values come from Python's uuid module.
  it("gives the published version-5 UUIDs", () => {
    expect(uuidV5("python.org", DNS_NAMESPACE)).toBe(
      "886313e1-3b8a-5372-9b90-0c9aee199e5d",
    );
    expect(uuidV5("https://www.example.com/", URL_NAMESPACE)).toBe(
      "3d3ed9d2-aa3d-5fa6-90e8-ed662e90f559",
    );
  });

  it("reads the name as UTF-8", () => {
    expect(uuidV5("ทองหล่อ", DNS_NAMESPACE)).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    expect(uuidV5("ทองหล่อ", DNS_NAMESPACE)).not.toBe(
      uuidV5("ทองหลอ", DNS_NAMESPACE),
    );
  });

  it("refuses a namespace that is not a lower-case UUID", () => {
    for (const namespace of ["", "seed", DNS_NAMESPACE.toUpperCase()])
      expect(() => uuidV5("x", namespace)).toThrow(TypeError);
  });
});

describe("seed ids", () => {
  it("come from one fixed namespace", () => {
    expect(SEED_NAMESPACE).toBe("0821b600-2a16-5efc-9b10-f0367e0d65f1");
    expect(SEED_NAMESPACE).toBe(uuidV5("seed.lilith.invalid", DNS_NAMESPACE));
  });

  // Written out, so that a change of namespace or of key format cannot pass
  // unnoticed: other seed rows and test fixtures will refer to these ids.
  it("are the same on every machine and every run", () => {
    expect(locationSeedId("thailand")).toBe(
      "ed64b8b7-6e18-5974-92aa-4e542f55149c",
    );
    expect(locationSeedId("bangkok")).toBe(
      "42b485ab-1e5c-5771-ad5e-781881666a5b",
    );
    expect(locationSeedId("thong-lo")).toBe(
      "bd2f2f34-b32d-51d8-9883-9877e4395531",
    );
    expect(locationSeedId("ari")).toBe("b400f337-e308-55ed-80b0-d5fbe7119ab6");
    expect(locationSeedId("on-nut")).toBe(
      "f666f043-2300-50c2-8c74-34e09b1f33f6",
    );
    expect(stationSeedId(findStationSeed("BTS", "E6"))).toBe(
      "0a1eb6dc-3dd9-504c-bf4d-c464f178fe32",
    );
    expect(stationSeedId(findStationSeed("MRT", "BL22"))).toBe(
      "8507fe49-bf0a-5b13-af20-b4925343e776",
    );
    expect(stationSeedId(findStationSeed("BTS", "CEN"))).toBe(
      "ca37e423-a4ff-53cd-8d50-cb065224a275",
    );
  });

  it("differ between tables for the same key", () => {
    expect(seedId("location", "ari")).not.toBe(
      seedId("transit_station", "ari"),
    );
  });

  it("need a table and a key", () => {
    expect(() => seedId("", "ari")).toThrow(TypeError);
    expect(() => seedId("location", "")).toThrow(TypeError);
  });
});

describe("countUpserts", () => {
  it("separates new, changed and untouched rows", () => {
    expect(
      countUpserts("t", 5, [
        { inserted: true },
        { inserted: false },
        { inserted: true },
      ]),
    ).toEqual({ table: "t", inserted: 2, updated: 1, unchanged: 2 });
  });
});

describe("station seed", () => {
  it("holds the 24 stations of the launch corridor", () => {
    expect(STATION_SEEDS).toHaveLength(24);
  });

  it("lists the BTS Sukhumvit line from On Nut to Ari, in line order", () => {
    const bts = STATION_SEEDS.filter((seed) => seed.system === "BTS");
    expect(bts.map((seed) => seed.code)).toEqual(BTS_ORDER);
    expect(new Set(bts.map((seed) => seed.line))).toEqual(
      new Set(["Sukhumvit"]),
    );
    expect(bts[0]?.nameEn).toBe("On Nut");
    expect(bts.at(-1)?.nameEn).toBe("Ari");
  });

  it("lists the MRT Blue line from Phra Ram 9 to Hua Lamphong, in line order", () => {
    const mrt = STATION_SEEDS.filter((seed) => seed.system === "MRT");
    expect(mrt.map((seed) => seed.code)).toEqual(MRT_ORDER);
    expect(new Set(mrt.map((seed) => seed.line))).toEqual(new Set(["Blue"]));
    expect(mrt[0]?.nameEn).toBe("Phra Ram 9");
    expect(mrt.at(-1)?.nameEn).toBe("Hua Lamphong");
  });

  it("names the station the blueprint's distance test uses", () => {
    expect(findStationSeed("BTS", "E6")).toMatchObject({
      nameTh: "ทองหล่อ",
      nameEn: "Thong Lo",
      line: "Sukhumvit",
    });
  });

  it("has no station twice", () => {
    const keys = STATION_SEEDS.map(stationKey);
    expect(new Set(keys).size).toBe(keys.length);
    const ids = STATION_SEEDS.map(stationSeedId);
    expect(new Set(ids).size).toBe(ids.length);
    const points = STATION_SEEDS.map((seed) => `${seed.lat},${seed.lng}`);
    expect(new Set(points).size).toBe(points.length);
  });

  it("has a clean Thai and English name for every station", () => {
    for (const seed of STATION_SEEDS) {
      expect(seed.nameTh, seed.code).toMatch(THAI_NAME);
      expect(seed.nameEn, seed.code).toMatch(ENGLISH_NAME);
      expect(seed.nameTh, seed.code).toBe(seed.nameTh.trim());
      expect(seed.nameEn, seed.code).toBe(seed.nameEn.trim());
    }
  });

  it("corrects the two names the source has wrong", () => {
    expect(findStationSeed("BTS", "E5").nameTh).toBe("พร้อมพงษ์");
    expect(findStationSeed("MRT", "BL23").nameEn).toBe(
      "Queen Sirikit National Convention Centre",
    );
  });

  it("has every station inside the corridor", () => {
    for (const seed of STATION_SEEDS) {
      expect(seed.lat, seed.code).toBeGreaterThan(13.69);
      expect(seed.lat, seed.code).toBeLessThan(13.79);
      expect(seed.lng, seed.code).toBeGreaterThan(100.51);
      expect(seed.lng, seed.code).toBeLessThan(100.61);
    }
  });

  // A coordinate with fewer decimals is coarser than about a metre in
  // latitude. The first source tried gave three or four for nine stations.
  it("states every coordinate to six decimals or more", () => {
    for (const seed of STATION_SEEDS) {
      expect(decimals(seed.lat), seed.code).toBeGreaterThanOrEqual(6);
      expect(decimals(seed.lng), seed.code).toBeGreaterThanOrEqual(6);
    }
  });

  it("puts neighbouring stations of a line 400 to 2,000 metres apart", () => {
    for (const order of [BTS_ORDER, MRT_ORDER]) {
      const system = order === BTS_ORDER ? "BTS" : "MRT";
      for (let index = 1; index < order.length; index += 1) {
        const from = findStationSeed(system, order[index - 1] ?? "");
        const to = findStationSeed(system, order[index] ?? "");
        const gap = geodesicMeters(from, to);
        expect(gap, `${from.code} to ${to.code}`).toBeGreaterThan(400);
        expect(gap, `${from.code} to ${to.code}`).toBeLessThan(2_000);
      }
    }
  });

  it("agrees with a second, independent source for every station", () => {
    expect(STATION_REFERENCES).toHaveLength(STATION_SEEDS.length);
    for (const reference of STATION_REFERENCES) {
      const seed = findStationSeed(reference.system, reference.code);
      const apart = geodesicMeters(seed, reference);
      expect(apart, `${seed.code} ${seed.nameEn}`).toBeLessThanOrEqual(
        referenceToleranceMeters(reference),
      );
    }
  });

  it("is within 50 metres of the precise reference at 13 elevated stations", () => {
    const strict = STATION_REFERENCES.filter(
      (reference) => referenceToleranceMeters(reference) === 50,
    );
    expect(strict).toHaveLength(13);
  });

  it("records where the positions come from", () => {
    expect(STATIONS_SOURCE.publisher).toContain("กรมการขนส่งทางราง");
    expect(STATIONS_SOURCE.catalogue).toBe(
      "https://datagov.mot.go.th/dataset/rail_station",
    );
    expect(STATIONS_SOURCE.retrieved).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(STATIONS_SOURCE.licenceLabel).toBe("Open Data Common");
  });

  it("fails clearly for a station that is not in the seed", () => {
    expect(() => findStationSeed("BTS", "E99")).toThrow("No seed station");
    expect(() => findStationSeed("MRT", "E6")).toThrow("No seed station");
  });
});

describe("location seed", () => {
  it("holds the three launch areas under Bangkok and Thailand", () => {
    expect(
      LOCATION_SEEDS.map((seed) => [seed.slug, seed.level, seed.parentSlug]),
    ).toEqual([
      ["thailand", "COUNTRY", null],
      ["bangkok", "PROVINCE", "thailand"],
      ["thong-lo", "AREA", "bangkok"],
      ["ari", "AREA", "bangkok"],
      ["on-nut", "AREA", "bangkok"],
    ]);
  });

  it("names each place in Thai and English", () => {
    expect(
      LOCATION_SEEDS.map((seed) => [seed.slug, seed.nameTh, seed.nameEn]),
    ).toEqual([
      ["thailand", "ประเทศไทย", "Thailand"],
      ["bangkok", "กรุงเทพมหานคร", "Bangkok"],
      ["thong-lo", "ทองหล่อ", "Thong Lo"],
      ["ari", "อารีย์", "Ari"],
      ["on-nut", "อ่อนนุช", "On Nut"],
    ]);
  });

  it("lists a parent before its children", () => {
    const seen = new Set<string>();
    for (const seed of LOCATION_SEEDS) {
      if (seed.parentSlug !== null)
        expect(seen.has(seed.parentSlug), seed.slug).toBe(true);
      seen.add(seed.slug);
    }
    expect(seen.size).toBe(LOCATION_SEEDS.length);
  });

  it("centres each area on the BTS station that carries its name", () => {
    const pairs = [
      ["thong-lo", "E6"],
      ["ari", "N5"],
      ["on-nut", "E9"],
    ] as const;
    for (const [slug, code] of pairs) {
      const area = LOCATION_SEEDS.find((seed) => seed.slug === slug);
      const station = findStationSeed("BTS", code);
      expect(area?.nameTh).toBe(station.nameTh);
      expect(area?.nameEn).toBe(station.nameEn);
      expect([area?.lat, area?.lng]).toEqual([station.lat, station.lng]);
    }
  });

  it("marks Bangkok near its stations and Thailand near Bangkok", () => {
    const bangkok = LOCATION_SEEDS.find((seed) => seed.slug === "bangkok");
    const thailand = LOCATION_SEEDS.find((seed) => seed.slug === "thailand");
    if (bangkok === undefined || thailand === undefined)
      throw new Error("the seed has no Bangkok or no Thailand");
    for (const station of STATION_SEEDS)
      expect(geodesicMeters(bangkok, station), station.code).toBeLessThan(
        15_000,
      );
    expect(geodesicMeters(thailand, bangkok)).toBeLessThan(100_000);
  });

  it("uses slugs the table accepts", () => {
    for (const seed of LOCATION_SEEDS)
      expect(seed.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });
});
