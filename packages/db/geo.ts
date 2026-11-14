import type { TransitSystem } from "./generated/prisma/enums";
import type { PrismaClient } from "./generated/prisma/client";

/** A position in WGS 84, in degrees. */
export interface GeoPoint {
  readonly lat: number;
  readonly lng: number;
}

export type { TransitSystem };

export interface NearbyStation {
  readonly id: string;
  readonly system: TransitSystem;
  readonly line: string;
  readonly code: string;
  readonly nameTh: string;
  readonly nameEn: string;
  readonly point: GeoPoint;
  /**
   * The straight-line distance from the origin to the station's point, in
   * whole metres. It is not a walking distance, and a station is one point
   * although its platforms are 150 metres long or more.
   */
  readonly distanceMeters: number;
}

/**
 * Reads of the geography reference data (Blueprint §8.2.2). The data is
 * public and the same for everyone, so these reads need no actor.
 */
export interface GeoQueries {
  /**
   * The stations within `radiusMeters` of `origin`, nearest first. Stations
   * at the same distance come in the order of system, line and code. A
   * station exactly on the radius is included.
   *
   * `radiusMeters` is a whole number from 1 to 50,000. At most `limit`
   * stations are returned: 50 unless given, 200 at most.
   */
  nearestStations(
    origin: GeoPoint,
    radiusMeters: number,
    options?: { readonly limit?: number },
  ): Promise<NearbyStation[]>;
}

export const MAX_STATION_RADIUS_METERS = 50_000;
export const DEFAULT_STATION_LIMIT = 50;
export const MAX_STATION_LIMIT = 200;

interface StationRow {
  id: string;
  system: TransitSystem;
  line: string;
  code: string;
  name_th: string;
  name_en: string;
  lat: number;
  lng: number;
  distance_m: number;
}

function wholeNumberBetween(
  value: number,
  low: number,
  high: number,
  what: string,
): number {
  if (!Number.isInteger(value) || value < low || value > high)
    throw new RangeError(
      `${what} must be a whole number from ${low} to ${high}`,
    );
  return value;
}

function degrees(value: number, limit: number, what: string): number {
  if (typeof value !== "number" || !Number.isFinite(value))
    throw new RangeError(`${what} must be a number`);
  if (value < -limit || value > limit)
    throw new RangeError(`${what} must be from -${limit} to ${limit}`);
  return value;
}

export function createGeoQueries(
  prisma: Pick<PrismaClient, "$queryRaw">,
): GeoQueries {
  return {
    async nearestStations(origin, radiusMeters, options) {
      const lat = degrees(origin.lat, 90, "Latitude");
      const lng = degrees(origin.lng, 180, "Longitude");
      const radius = wholeNumberBetween(
        radiusMeters,
        1,
        MAX_STATION_RADIUS_METERS,
        "The radius in metres",
      );
      const limit = wholeNumberBetween(
        options?.limit ?? DEFAULT_STATION_LIMIT,
        1,
        MAX_STATION_LIMIT,
        "The limit",
      );
      // PostGIS writes a point as (longitude, latitude). ST_DWithin and
      // ST_Distance on geography both measure on the WGS 84 spheroid, in
      // metres, so the filter and the order agree.
      const rows = await prisma.$queryRaw<StationRow[]>`
        SELECT s.id::text AS id,
               s.system::text AS system,
               s.line,
               s.code,
               s.name_th,
               s.name_en,
               ST_Y(s.point::geometry) AS lat,
               ST_X(s.point::geometry) AS lng,
               round(ST_Distance(s.point, o.origin))::int AS distance_m
          FROM transit_stations AS s
         CROSS JOIN (
               SELECT ST_SetSRID(
                        ST_MakePoint(${lng}::float8, ${lat}::float8),
                        4326)::geography AS origin
               ) AS o
         WHERE ST_DWithin(s.point, o.origin, ${radius}::float8)
         ORDER BY ST_Distance(s.point, o.origin), s.system, s.line, s.code
         LIMIT ${limit}::int`;
      return rows.map((row) => ({
        id: row.id,
        system: row.system,
        line: row.line,
        code: row.code,
        nameTh: row.name_th,
        nameEn: row.name_en,
        point: { lat: row.lat, lng: row.lng },
        distanceMeters: row.distance_m,
      }));
    },
  };
}
