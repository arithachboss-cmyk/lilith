/**
 * A second, independent position for each seed station: the coordinates that
 * Wikidata gives (retrieved 2026-11-14, CC0). The seed itself comes from the
 * Department of Rail Transport, so a seed point that is far from its
 * reference is a wrong station, a typing mistake or swapped coordinates.
 *
 * `precise` is true when Wikidata states the position to one arc second
 * (about 30 metres) or better. The others are stated to about a kilometre and
 * written with three or four decimals.
 */
export interface StationReference {
  readonly system: "BTS" | "MRT";
  readonly code: string;
  readonly wikidata: string;
  readonly lat: number;
  readonly lng: number;
  readonly precise: boolean;
}

function reference(
  system: "BTS" | "MRT",
  code: string,
  wikidata: string,
  lat: number,
  lng: number,
  precise: boolean,
): StationReference {
  return { system, code, wikidata, lat, lng, precise };
}

// prettier-ignore
export const STATION_REFERENCES: readonly StationReference[] = [
  reference("BTS", "E9", "Q1028755", 13.70561111, 100.60108333, true),
  reference("BTS", "E8", "Q4924738", 13.715194444444444, 100.59128333333334, true),
  reference("BTS", "E7", "Q4919536", 13.719558333333334, 100.585175, true),
  reference("BTS", "E6", "Q4924220", 13.7242, 100.579, false),
  reference("BTS", "E5", "Q1028691", 13.730438888888889, 100.56973055555555, true),
  reference("BTS", "E4", "Q4924120", 13.73703333, 100.56041944, true),
  reference("BTS", "E3", "Q6633167", 13.740602777777777, 100.55539722222223, true),
  reference("BTS", "E2", "Q4921113", 13.743080555555556, 100.54901944444444, true),
  reference("BTS", "E1", "Q6633149", 13.744108333333333, 100.54309722222222, true),
  reference("BTS", "CEN", "Q1016037", 13.745619, 100.534228, true),
  reference("BTS", "N1", "Q6633184", 13.751875, 100.531575, false),
  reference("BTS", "N2", "Q15139351", 13.756941666666666, 100.53384444444444, true),
  reference("BTS", "N3", "Q4919845", 13.762744, 100.537086, true),
  reference("BTS", "N4", "Q4922512", 13.77262222, 100.54209167, true),
  reference("BTS", "N5", "Q6149301", 13.779702777777779, 100.54464166666666, true),
  reference("MRT", "BL20", "Q1036857", 13.75722222, 100.56527778, true),
  reference("MRT", "BL21", "Q4921013", 13.7491, 100.563, false),
  reference("MRT", "BL22", "Q1036841", 13.7376, 100.561, false),
  reference("MRT", "BL23", "Q4921067", 13.7231, 100.56, false),
  reference("MRT", "BL24", "Q4920172", 13.7224, 100.554, false),
  reference("MRT", "BL25", "Q4923316", 13.7256, 100.546, false),
  reference("MRT", "BL26", "Q1036816", 13.72882752, 100.5377984, true),
  reference("MRT", "BL27", "Q1039683", 13.7323, 100.529, false),
  reference("MRT", "BL28", "Q13021858", 13.7373, 100.518, false),
];

/**
 * How far a seed point may be from its reference, in metres.
 *
 * An elevated BTS station with a precise reference: 50 metres, the tolerance
 * the DB-003 card names. Every other station: 150 metres. That wider bound is
 * a check against gross mistakes only. Either the reference is coarse, or the
 * station is underground and about 200 metres long, so two honest sources can
 * mark different ends of it.
 */
export function referenceToleranceMeters(reference: StationReference): number {
  return reference.system === "BTS" && reference.precise ? 50 : 150;
}
