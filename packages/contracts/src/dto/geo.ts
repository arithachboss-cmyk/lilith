import { z } from "zod";
import { AmenityCategory, LocationLevel, TransitSystem } from "./enums";
import { Code, LatLng, LocationId, OpaqueId } from "./primitives";
import { dto } from "./registry";

/** A location as it appears inside another DTO (§18.4 `area`). */
export const LocationRef = dto(
  "LocationRef",
  z.object({ id: LocationId, name_th: z.string(), name_en: z.string() }),
);
export type LocationRef = z.infer<typeof LocationRef>;

// Derived from §8.2.2; §18.10 names the DTOs without showing them.
export const LocationDTO = dto(
  "LocationDTO",
  z.object({
    id: LocationId,
    parent_id: LocationId.nullable(),
    level: LocationLevel,
    name_th: z.string(),
    name_en: z.string(),
    slug: z.string(),
  }),
);
export type LocationDTO = z.infer<typeof LocationDTO>;

export const StationDTO = dto(
  "StationDTO",
  z.object({
    id: OpaqueId,
    system: TransitSystem,
    line: z.string(),
    code: z.string(),
    name_th: z.string(),
    name_en: z.string(),
    point: LatLng,
  }),
);
export type StationDTO = z.infer<typeof StationDTO>;

export const AmenityDTO = dto(
  "AmenityDTO",
  z.object({
    code: Code,
    name_th: z.string(),
    name_en: z.string(),
    category: AmenityCategory,
    icon: z.string().nullable(),
  }),
);
export type AmenityDTO = z.infer<typeof AmenityDTO>;

// GET /api/geo/search?q=ทองหล่อ&level=AREA
export const GeoSearchQuery = z.object({
  q: z.string().min(1).max(120),
  level: LocationLevel.optional(),
});
export const GeoSearchResponse = dto(
  "GeoSearchResponse",
  z.object({ data: z.array(LocationDTO) }),
);

// GET /api/geo/stations?near=13.72,100.58&radius=1500
export const StationsQuery = z.object({
  near: z.string().regex(/^-?\d{1,2}(?:\.\d+)?,-?\d{1,3}(?:\.\d+)?$/),
  radius: z.coerce.number().int().min(1).max(50_000).optional(),
});
export const StationsResponse = dto(
  "StationsResponse",
  z.object({ data: z.array(StationDTO) }),
);

export const AmenitiesResponse = dto(
  "AmenitiesResponse",
  z.object({ data: z.array(AmenityDTO) }),
);
