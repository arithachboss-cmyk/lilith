import {
  countUpserts,
  seedId,
  type SeedConnection,
  type SeedResult,
} from "./ids";

/**
 * Where the station positions come from. The owner chose this source on
 * 2026-11-14 (ADR-0019). The catalogue labels the dataset "Open Data Common",
 * classes it as public data and states no access condition; it links no
 * licence text.
 */
export const STATIONS_SOURCE = {
  title: "ชื่อสถานีและเส้นทางรถไฟฟ้า",
  publisher: "กรมการขนส่งทางราง (Department of Rail Transport)",
  catalogue: "https://datagov.mot.go.th/dataset/rail_station",
  resourceId: "1f03a45d-e3b5-4e37-95e6-092dcc75f6ba",
  resourceModified: "2026-09-23",
  retrieved: "2026-11-14",
  licenceLabel: "Open Data Common",
} as const;

export type TransitSystemCode = "BTS" | "MRT" | "ARL" | "SRT" | "BRT";

export interface StationSeed {
  readonly system: TransitSystemCode;
  /** The operator's name of the line, in English: `Sukhumvit`, `Blue`. */
  readonly line: string;
  readonly code: string;
  readonly nameTh: string;
  readonly nameEn: string;
  /** WGS 84, degrees. One point for the whole station. */
  readonly lat: number;
  readonly lng: number;
}

function station(
  system: TransitSystemCode,
  line: string,
  code: string,
  nameTh: string,
  nameEn: string,
  lat: number,
  lng: number,
): StationSeed {
  return { system, line, code, nameTh, nameEn, lat, lng };
}

/**
 * The 24 stations of the launch corridor (Blueprint §22.4, roadmap "On Nut →
 * Ari"): the 15 BTS Sukhumvit line stations from On Nut to Ari, and the 9 MRT
 * Blue line stations from Phra Ram 9 to Hua Lamphong, each in line order.
 *
 * Codes, names and coordinates are the source's own, copied by script. The
 * source calls the lines "Light green" and "Blue". Two names differ from it:
 *   E5    Thai name    source "พร้อมพงศ์", the operator writes "พร้อมพงษ์"
 *   BL23  English name source "Queen Sirikit National " (cut short)
 */
// prettier-ignore
export const STATION_SEEDS: readonly StationSeed[] = [
  station("BTS", "Sukhumvit", "E9", "อ่อนนุช", "On Nut", 13.70563696, 100.6010277),
  station("BTS", "Sukhumvit", "E8", "พระโขนง", "Phra Khanong", 13.71523481, 100.5912765),
  station("BTS", "Sukhumvit", "E7", "เอกมัย", "Ekkamai", 13.71955685, 100.5850876),
  station("BTS", "Sukhumvit", "E6", "ทองหล่อ", "Thong Lo", 13.72435715, 100.5784291),
  station("BTS", "Sukhumvit", "E5", "พร้อมพงษ์", "Phrom Phong", 13.73045553, 100.5696996),
  station("BTS", "Sukhumvit", "E4", "อโศก", "Asok", 13.73704787, 100.5603549),
  station("BTS", "Sukhumvit", "E3", "นานา", "Nana", 13.74053723, 100.5554754),
  station("BTS", "Sukhumvit", "E2", "เพลินจิต", "Phloen Chit", 13.74305844, 100.5490357),
  station("BTS", "Sukhumvit", "E1", "ชิดลม", "Chit Lom", 13.74408069, 100.5430873),
  station("BTS", "Sukhumvit", "CEN", "สยาม", "Siam", 13.74561143, 100.5341474),
  station("BTS", "Sukhumvit", "N1", "ราชเทวี", "Ratchathewi", 13.75207562, 100.5315714),
  station("BTS", "Sukhumvit", "N2", "พญาไท", "Phaya Thai", 13.75700979, 100.5338066),
  station("BTS", "Sukhumvit", "N3", "อนุสาวรีย์ชัยสมรภูมิ", "Victory Monument", 13.7628712, 100.5370477),
  station("BTS", "Sukhumvit", "N4", "สนามเป้า", "Sanam Pao", 13.77264449, 100.5421253),
  station("BTS", "Sukhumvit", "N5", "อารีย์", "Ari", 13.77985028, 100.5446531),
  station("MRT", "Blue", "BL20", "พระราม 9", "Phra Ram 9", 13.75791625, 100.5655452),
  station("MRT", "Blue", "BL21", "เพชรบุรี", "Phetchaburi", 13.74868501, 100.5631611),
  station("MRT", "Blue", "BL22", "สุขุมวิท", "Sukhumvit", 13.73855034, 100.5614557),
  station("MRT", "Blue", "BL23", "ศูนย์การประชุมแห่งชาติสิริกิติ์", "Queen Sirikit National Convention Centre", 13.72315611, 100.5601051),
  station("MRT", "Blue", "BL24", "คลองเตย", "Khlong Toei", 13.72233526, 100.5539195),
  station("MRT", "Blue", "BL25", "ลุมพินี", "Lumphini", 13.72577127, 100.5456769),
  station("MRT", "Blue", "BL26", "สีลม", "Si Lom", 13.72926025, 100.5365456),
  station("MRT", "Blue", "BL27", "สามย่าน", "Sam Yan", 13.73234822, 100.5299815),
  station("MRT", "Blue", "BL28", "หัวลำโพง", "Hua Lamphong", 13.73783973, 100.5171627),
];

/** The natural key of a station: unique in `transit_stations`. */
export function stationKey(
  seed: Pick<StationSeed, "system" | "line" | "code">,
): string {
  return `${seed.system}/${seed.line}/${seed.code}`;
}

export function stationSeedId(
  seed: Pick<StationSeed, "system" | "line" | "code">,
): string {
  return seedId("transit_station", stationKey(seed));
}

/** The seed station with this code on this system; throws when there is none. */
export function findStationSeed(
  system: TransitSystemCode,
  code: string,
): StationSeed {
  const found = STATION_SEEDS.find(
    (seed) => seed.system === system && seed.code === code,
  );
  if (found === undefined) throw new Error(`No seed station ${system} ${code}`);
  return found;
}

/**
 * Writes the seed stations. A row that already holds the same values is left
 * untouched, so a second run changes nothing. No row is ever deleted.
 */
export async function seedStations(db: SeedConnection): Promise<SeedResult> {
  const written: Record<string, unknown>[] = [];
  for (const seed of STATION_SEEDS) {
    const result = await db.query(
      `INSERT INTO transit_stations AS t
              (id, system, line, code, name_th, name_en, point)
       VALUES ($1::uuid, $2::transit_system, $3, $4, $5, $6,
               ST_SetSRID(ST_MakePoint($8::float8, $7::float8), 4326)::geography)
       ON CONFLICT (id) DO UPDATE
          SET system = EXCLUDED.system,
              line = EXCLUDED.line,
              code = EXCLUDED.code,
              name_th = EXCLUDED.name_th,
              name_en = EXCLUDED.name_en,
              point = EXCLUDED.point
        WHERE (t.system, t.line, t.code, t.name_th, t.name_en)
                IS DISTINCT FROM
              (EXCLUDED.system, EXCLUDED.line, EXCLUDED.code,
               EXCLUDED.name_th, EXCLUDED.name_en)
           OR NOT ST_Equals(t.point::geometry, EXCLUDED.point::geometry)
       RETURNING (xmax = 0) AS inserted`,
      [
        stationSeedId(seed),
        seed.system,
        seed.line,
        seed.code,
        seed.nameTh,
        seed.nameEn,
        seed.lat,
        seed.lng,
      ],
    );
    written.push(...result.rows);
  }
  return countUpserts("transit_stations", STATION_SEEDS.length, written);
}
