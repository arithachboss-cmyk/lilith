import {
  countUpserts,
  seedId,
  type SeedConnection,
  type SeedResult,
} from "./ids";
import { findStationSeed } from "./stations";

export type LocationLevelCode =
  "COUNTRY" | "PROVINCE" | "DISTRICT" | "SUBDISTRICT" | "AREA" | "PROJECT";

export interface LocationSeed {
  /** Unique in `locations`, and the natural key of the seed row. */
  readonly slug: string;
  /** The slug of the parent; `null` for the country. */
  readonly parentSlug: string | null;
  readonly level: LocationLevelCode;
  readonly nameTh: string;
  readonly nameEn: string;
  /** WGS 84, degrees. */
  readonly lat: number;
  readonly lng: number;
}

/**
 * The centre of an area is the BTS station that carries its name. The three
 * areas have no official boundary; the owner chose this on 2026-11-14
 * (ADR-0019).
 */
function area(
  slug: string,
  nameTh: string,
  nameEn: string,
  stationCode: string,
): LocationSeed {
  const station = findStationSeed("BTS", stationCode);
  return {
    slug,
    parentSlug: "bangkok",
    level: "AREA",
    nameTh,
    nameEn,
    lat: station.lat,
    lng: station.lng,
  };
}

/**
 * The three launch areas (Blueprint §22.4) under their province and country,
 * parents before children.
 *
 * The points of Thailand and Bangkok are the coordinates Wikidata gives for
 * Q869 and Q1861 (retrieved 2026-11-14). They mark the place on a map and are
 * not meant for measuring a distance.
 */
export const LOCATION_SEEDS: readonly LocationSeed[] = [
  {
    slug: "thailand",
    parentSlug: null,
    level: "COUNTRY",
    nameTh: "ประเทศไทย",
    nameEn: "Thailand",
    lat: 14,
    lng: 101,
  },
  {
    slug: "bangkok",
    parentSlug: "thailand",
    level: "PROVINCE",
    nameTh: "กรุงเทพมหานคร",
    nameEn: "Bangkok",
    lat: 13.75,
    lng: 100.51666666667,
  },
  area("thong-lo", "ทองหล่อ", "Thong Lo", "E6"),
  area("ari", "อารีย์", "Ari", "N5"),
  area("on-nut", "อ่อนนุช", "On Nut", "E9"),
];

export function locationSeedId(slug: string): string {
  return seedId("location", slug);
}

/**
 * Writes the seed locations, parents first. A row that already holds the same
 * values is left untouched, so a second run changes nothing. No row is ever
 * deleted.
 */
export async function seedLocations(db: SeedConnection): Promise<SeedResult> {
  const written: Record<string, unknown>[] = [];
  for (const seed of LOCATION_SEEDS) {
    const result = await db.query(
      `INSERT INTO locations AS l
              (id, parent_id, level, name_th, name_en, slug, centroid)
       VALUES ($1::uuid, $2::uuid, $3::location_level, $4, $5, $6,
               ST_SetSRID(ST_MakePoint($8::float8, $7::float8), 4326)::geography)
       ON CONFLICT (id) DO UPDATE
          SET parent_id = EXCLUDED.parent_id,
              level = EXCLUDED.level,
              name_th = EXCLUDED.name_th,
              name_en = EXCLUDED.name_en,
              slug = EXCLUDED.slug,
              centroid = EXCLUDED.centroid
        WHERE (l.parent_id, l.level, l.name_th, l.name_en, l.slug)
                IS DISTINCT FROM
              (EXCLUDED.parent_id, EXCLUDED.level, EXCLUDED.name_th,
               EXCLUDED.name_en, EXCLUDED.slug)
           OR NOT ST_Equals(l.centroid::geometry, EXCLUDED.centroid::geometry)
       RETURNING (xmax = 0) AS inserted`,
      [
        locationSeedId(seed.slug),
        seed.parentSlug === null ? null : locationSeedId(seed.parentSlug),
        seed.level,
        seed.nameTh,
        seed.nameEn,
        seed.slug,
        seed.lat,
        seed.lng,
      ],
    );
    written.push(...result.rows);
  }
  return countUpserts("locations", LOCATION_SEEDS.length, written);
}
