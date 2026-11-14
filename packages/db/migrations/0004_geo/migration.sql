-- 0004_geo — locations and transit stations (Blueprint §8.2.2, DB-003).
--
--   locations         the place hierarchy: country, province, ..., area, project
--   transit_stations  rail stations, each with one point
--
-- This migration needs 0001_extensions only. It carries the number the
-- blueprint gives it, so it can be applied before 0002 and 0003 exist and
-- they can be added afterwards (ADR-0019).
--
-- `property_transit` (§8.2.2) is not created here. It refers to `properties`,
-- which arrives with 0005_property (DB-004).
--
-- Forward fix instead of a down migration: once other tables refer to these
-- two, they are corrected by a later migration and never dropped.

-- §8 conventions: `updated_at` is maintained by a trigger. Every table shares
-- this one function. It is written with CREATE OR REPLACE, and 0002_identity
-- must do the same, so that the two migrations work in either order.
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TYPE location_level AS ENUM (
  'COUNTRY',
  'PROVINCE',
  'DISTRICT',
  'SUBDISTRICT',
  'AREA',
  'PROJECT'
);

CREATE TYPE transit_system AS ENUM ('BTS', 'MRT', 'ARL', 'SRT', 'BRT');

CREATE TABLE locations (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id  uuid,
  level      location_level NOT NULL,
  name_th    text NOT NULL,
  name_en    text NOT NULL,
  slug       text NOT NULL,
  centroid   geography(Point, 4326) NOT NULL,
  boundary   geography(Polygon, 4326),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT locations_parent_id_fkey
    FOREIGN KEY (parent_id) REFERENCES locations (id) ON DELETE RESTRICT,
  CONSTRAINT locations_slug_key UNIQUE (slug),
  CONSTRAINT locations_slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  CONSTRAINT locations_name_th_clean
    CHECK (name_th <> '' AND name_th = btrim(name_th)),
  CONSTRAINT locations_name_en_clean
    CHECK (name_en <> '' AND name_en = btrim(name_en)),
  CONSTRAINT locations_not_own_parent CHECK (parent_id <> id)
);

CREATE INDEX idx_locations_parent ON locations (parent_id);
CREATE INDEX idx_locations_centroid ON locations USING gist (centroid);
CREATE INDEX idx_locations_boundary ON locations USING gist (boundary);
-- Search by name in Thai and English (API-004: "trigram + exact").
CREATE INDEX idx_locations_name_th_trgm
  ON locations USING gin (name_th gin_trgm_ops);
CREATE INDEX idx_locations_name_en_trgm
  ON locations USING gin (name_en gin_trgm_ops);

CREATE TRIGGER locations_set_updated_at
  BEFORE UPDATE ON locations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE transit_stations (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  system     transit_system NOT NULL,
  line       text NOT NULL,
  code       text NOT NULL,
  name_th    text NOT NULL,
  name_en    text NOT NULL,
  point      geography(Point, 4326) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- One row for a station on a line, so a search never lists it twice.
  CONSTRAINT transit_stations_system_line_code_key UNIQUE (system, line, code),
  CONSTRAINT transit_stations_line_clean
    CHECK (line <> '' AND line = btrim(line)),
  CONSTRAINT transit_stations_code_clean
    CHECK (code <> '' AND code = btrim(code)),
  CONSTRAINT transit_stations_name_th_clean
    CHECK (name_th <> '' AND name_th = btrim(name_th)),
  CONSTRAINT transit_stations_name_en_clean
    CHECK (name_en <> '' AND name_en = btrim(name_en))
);

CREATE INDEX idx_transit_stations_point
  ON transit_stations USING gist (point);

CREATE TRIGGER transit_stations_set_updated_at
  BEFORE UPDATE ON transit_stations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
