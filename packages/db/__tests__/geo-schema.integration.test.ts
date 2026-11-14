import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createEmptyDatabase,
  migrate,
  prisma,
  query,
  type TestDatabase,
} from "./test-database";

// Blueprint §8.2.2 and DB-003: what migration 0004_geo must create.

let database: TestDatabase;

beforeAll(async () => {
  database = await createEmptyDatabase();
  const result = migrate(database.url);
  if (result.status !== 0) throw new Error(result.output);
});

afterAll(async () => {
  await database.drop();
});

const sql = <Row extends Record<string, unknown>>(
  text: string,
  values: unknown[] = [],
) => query<Row>(database.url, text, values);

/** The SQLSTATE of the error a statement raises, or "ok". */
async function outcome(text: string, values: unknown[] = []): Promise<string> {
  try {
    await sql(text, values);
    return "ok";
  } catch (error) {
    return String((error as { code?: unknown }).code);
  }
}

const UNIQUE_VIOLATION = "23505";
const CHECK_VIOLATION = "23514";
const FOREIGN_KEY_VIOLATION = "23503";
const NOT_NULL_VIOLATION = "23502";
const INVALID_ENUM = "22P02";
const WRONG_GEOMETRY = "22023";

const POINT = "ST_SetSRID(ST_MakePoint(100.5784, 13.7243), 4326)::geography";

function insertLocation(slug: string, extra = ""): string {
  return `INSERT INTO locations (level, name_th, name_en, slug, centroid${extra === "" ? "" : ", parent_id"})
          VALUES ('AREA', 'ทดสอบ', 'Test', '${slug}', ${POINT}${extra === "" ? "" : `, ${extra}`})
          RETURNING id`;
}

function insertStation(line: string, code: string): string {
  return `INSERT INTO transit_stations (system, line, code, name_th, name_en, point)
          VALUES ('BTS', '${line}', '${code}', 'ทดสอบ', 'Test', ${POINT})
          RETURNING id`;
}

async function columnsOf(table: string) {
  const rows = await sql<{
    name: string;
    type: string;
    nullable: string;
    fallback: string | null;
  }>(
    `SELECT column_name AS name, udt_name AS type, is_nullable AS nullable,
            column_default AS fallback
       FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position`,
    [table],
  );
  return rows.map(
    (row) =>
      `${row.name} ${row.type}${row.nullable === "NO" ? " NOT NULL" : ""}${
        row.fallback === null ? "" : ` DEFAULT ${row.fallback}`
      }`,
  );
}

async function indexesOf(table: string): Promise<Record<string, string>> {
  const rows = await sql<{ name: string; definition: string }>(
    `SELECT indexname AS name, indexdef AS definition
       FROM pg_indexes WHERE schemaname = 'public' AND tablename = $1`,
    [table],
  );
  return Object.fromEntries(
    rows.map((row) => [
      row.name,
      row.definition.replace(/^.* USING /, "").replaceAll('"', ""),
    ]),
  );
}

describe("migration 0004_geo", () => {
  it("is recorded after the extensions", async () => {
    const rows = await sql<{ name: string; done: boolean }>(
      `SELECT migration_name AS name, finished_at IS NOT NULL AS done
         FROM _prisma_migrations ORDER BY migration_name`,
    );
    expect(rows).toEqual([
      { name: "0001_extensions", done: true },
      { name: "0004_geo", done: true },
    ]);
  });

  it("does not create property_transit, which needs the properties table", async () => {
    const rows = await sql<{ name: string }>(
      `SELECT table_name AS name FROM information_schema.tables
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
          AND table_name NOT IN ('_prisma_migrations', 'spatial_ref_sys')
        ORDER BY table_name`,
    );
    expect(rows.map((row) => row.name)).toEqual([
      "locations",
      "transit_stations",
    ]);
  });

  it("creates the level and system enums with the blueprint's values, in order", async () => {
    const rows = await sql<{ name: string; labels: string[] }>(
      `SELECT t.typname AS name,
              array_agg(e.enumlabel::text ORDER BY e.enumsortorder) AS labels
         FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid
        WHERE t.typname IN ('location_level', 'transit_system')
        GROUP BY t.typname ORDER BY t.typname`,
    );
    expect(rows).toEqual([
      {
        name: "location_level",
        labels: [
          "COUNTRY",
          "PROVINCE",
          "DISTRICT",
          "SUBDISTRICT",
          "AREA",
          "PROJECT",
        ],
      },
      { name: "transit_system", labels: ["BTS", "MRT", "ARL", "SRT", "BRT"] },
    ]);
  });

  it("creates locations with the columns of §8.2.2 and the §8 conventions", async () => {
    expect(await columnsOf("locations")).toEqual([
      "id uuid NOT NULL DEFAULT gen_random_uuid()",
      "parent_id uuid",
      "level location_level NOT NULL",
      "name_th text NOT NULL",
      "name_en text NOT NULL",
      "slug text NOT NULL",
      "centroid geography NOT NULL",
      "boundary geography",
      "created_at timestamptz NOT NULL DEFAULT now()",
      "updated_at timestamptz NOT NULL DEFAULT now()",
    ]);
  });

  it("creates transit_stations with the columns of §8.2.2 and the §8 conventions", async () => {
    expect(await columnsOf("transit_stations")).toEqual([
      "id uuid NOT NULL DEFAULT gen_random_uuid()",
      "system transit_system NOT NULL",
      "line text NOT NULL",
      "code text NOT NULL",
      "name_th text NOT NULL",
      "name_en text NOT NULL",
      "point geography NOT NULL",
      "created_at timestamptz NOT NULL DEFAULT now()",
      "updated_at timestamptz NOT NULL DEFAULT now()",
    ]);
  });

  it("types the geography columns as WGS 84 points and polygons", async () => {
    const rows = await sql<{ place: string; type: string; srid: number }>(
      `SELECT f_table_name || '.' || f_geography_column AS place, type, srid
         FROM geography_columns ORDER BY 1`,
    );
    expect(rows).toEqual([
      { place: "locations.boundary", type: "Polygon", srid: 4326 },
      { place: "locations.centroid", type: "Point", srid: 4326 },
      { place: "transit_stations.point", type: "Point", srid: 4326 },
    ]);
  });

  it("indexes locations: GiST on centroid and boundary, parent, slug and names", async () => {
    expect(await indexesOf("locations")).toEqual({
      locations_pkey: "btree (id)",
      locations_slug_key: "btree (slug)",
      idx_locations_parent: "btree (parent_id)",
      idx_locations_centroid: "gist (centroid)",
      idx_locations_boundary: "gist (boundary)",
      idx_locations_name_th_trgm: "gin (name_th gin_trgm_ops)",
      idx_locations_name_en_trgm: "gin (name_en gin_trgm_ops)",
    });
  });

  it("indexes transit_stations: GiST on the point, and one row per station of a line", async () => {
    expect(await indexesOf("transit_stations")).toEqual({
      transit_stations_pkey: "btree (id)",
      transit_stations_system_line_code_key: "btree (system, line, code)",
      idx_transit_stations_point: "gist (point)",
    });
    const [row] = await sql<{ unique: boolean }>(
      `SELECT indisunique AS unique FROM pg_index
        WHERE indexrelid = 'transit_stations_system_line_code_key'::regclass`,
    );
    expect(row?.unique).toBe(true);
  });

  it("refers from a location to its parent, and restricts deleting the parent", async () => {
    const rows = await sql<{ definition: string }>(
      `SELECT pg_get_constraintdef(oid) AS definition FROM pg_constraint
        WHERE conrelid = 'locations'::regclass AND contype = 'f'`,
    );
    expect(rows.map((row) => row.definition)).toEqual([
      "FOREIGN KEY (parent_id) REFERENCES locations(id) ON DELETE RESTRICT",
    ]);
  });

  it("describes the same tables in the Prisma schema", () => {
    const diff = prisma(
      database.url,
      "migrate",
      "diff",
      "--from-config-datasource",
      "--to-schema",
      "prisma/schema.prisma",
      "--exit-code",
    );
    expect(diff.status, diff.output).toBe(0);
  });
});

describe("locations", () => {
  it("gives a new row an id and both timestamps", async () => {
    const [row] = await sql<{
      id: string;
      created: Date;
      updated: Date;
    }>(
      `${insertLocation("defaults")}, created_at AS created, updated_at AS updated`,
    );
    expect(row?.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(row?.created).toBeInstanceOf(Date);
    expect(row?.updated).toEqual(row?.created);
  });

  it("moves updated_at on every change and never created_at", async () => {
    await sql(insertLocation("touched"));
    await sql(
      `UPDATE locations
          SET created_at = created_at - interval '1 day',
              updated_at = updated_at - interval '1 day'
        WHERE slug = 'touched'`,
    );
    const [before] = await sql<{ created: Date; updated: Date }>(
      `SELECT created_at AS created, updated_at AS updated
         FROM locations WHERE slug = 'touched'`,
    );
    const [after] = await sql<{ created: Date; updated: Date }>(
      `UPDATE locations SET name_en = 'Renamed' WHERE slug = 'touched'
       RETURNING created_at AS created, updated_at AS updated`,
    );
    expect(after?.created).toEqual(before?.created);
    expect(after?.updated.getTime()).toBeGreaterThan(
      before?.updated.getTime() ?? Infinity,
    );
  });

  it("does not let a writer set updated_at by hand", async () => {
    await sql(insertLocation("stamped"));
    const [row] = await sql<{ recent: boolean }>(
      `UPDATE locations SET updated_at = '2000-01-01' WHERE slug = 'stamped'
       RETURNING updated_at > now() - interval '1 minute' AS recent`,
    );
    expect(row?.recent).toBe(true);
  });

  it("refuses a second location with the same slug", async () => {
    expect(await outcome(insertLocation("twice"))).toBe("ok");
    expect(await outcome(insertLocation("twice"))).toBe(UNIQUE_VIOLATION);
  });

  it("accepts only lower-case slugs of letters, digits and single hyphens", async () => {
    for (const slug of ["rama-9", "soi11", "a"])
      expect(await outcome(insertLocation(slug)), slug).toBe("ok");
    for (const slug of [
      "Thong-Lo",
      "thong lo",
      "-thong",
      "thong-",
      "thong--lo",
      "thong_lo",
      "ทองหล่อ",
      "",
    ])
      expect(await outcome(insertLocation(slug)), slug).toBe(CHECK_VIOLATION);
  });

  it("refuses a name that is empty or padded with spaces", async () => {
    const insert = (th: string, en: string) =>
      outcome(
        `INSERT INTO locations (level, name_th, name_en, slug, centroid)
         VALUES ('AREA', $1, $2, 'name-' || md5($1 || '/' || $2), ${POINT})`,
        [th, en],
      );
    expect(await insert("อารีย์", "Ari")).toBe("ok");
    for (const [th, en] of [
      ["", "Ari"],
      ["อารีย์", ""],
      [" อารีย์", "Ari"],
      ["อารีย์", "Ari "],
      ["   ", "Ari"],
    ] as const)
      expect(await insert(th, en), `"${th}" / "${en}"`).toBe(CHECK_VIOLATION);
  });

  it("needs a level, both names, a slug and a centroid", async () => {
    const values: Record<string, string> = {
      level: "'AREA'",
      name_th: "'ทดสอบ'",
      name_en: "'Test'",
      slug: "'needs'",
      centroid: POINT,
    };
    for (const missing of Object.keys(values)) {
      const kept = Object.keys(values).filter((name) => name !== missing);
      expect(
        await outcome(
          `INSERT INTO locations (${kept.join(", ")})
           VALUES (${kept.map((name) => values[name]).join(", ")})`,
        ),
        missing,
      ).toBe(NOT_NULL_VIOLATION);
    }
  });

  it("refuses a level outside the six of the blueprint", async () => {
    expect(
      await outcome(
        `INSERT INTO locations (level, name_th, name_en, slug, centroid)
         VALUES ('STREET', 'ทดสอบ', 'Test', 'street', ${POINT})`,
      ),
    ).toBe(INVALID_ENUM);
  });

  it("accepts a parent that exists, and no other", async () => {
    const [parent] = await sql<{ id: string }>(insertLocation("parent"));
    expect(
      await outcome(insertLocation("child", `'${parent?.id ?? ""}'`)),
    ).toBe("ok");
    expect(
      await outcome(
        insertLocation("orphan", "'00000000-0000-4000-8000-000000000000'"),
      ),
    ).toBe(FOREIGN_KEY_VIOLATION);
  });

  it("refuses a location that is its own parent", async () => {
    await sql(insertLocation("selfish"));
    expect(
      await outcome(
        "UPDATE locations SET parent_id = id WHERE slug = 'selfish'",
      ),
    ).toBe(CHECK_VIOLATION);
  });

  it("refuses to delete a location that still has children", async () => {
    const [parent] = await sql<{ id: string }>(insertLocation("kept"));
    await sql(insertLocation("kept-child", `'${parent?.id ?? ""}'`));
    expect(await outcome("DELETE FROM locations WHERE slug = 'kept'")).toBe(
      FOREIGN_KEY_VIOLATION,
    );
    expect(
      await outcome("DELETE FROM locations WHERE slug = 'kept-child'"),
    ).toBe("ok");
    expect(await outcome("DELETE FROM locations WHERE slug = 'kept'")).toBe(
      "ok",
    );
  });

  it("stores a point as the centroid and a polygon as the boundary, not the reverse", async () => {
    const polygon =
      "ST_GeogFromText('SRID=4326;POLYGON((100.57 13.72, 100.59 13.72, 100.59 13.73, 100.57 13.73, 100.57 13.72))')";
    expect(
      await outcome(
        `INSERT INTO locations (level, name_th, name_en, slug, centroid, boundary)
         VALUES ('AREA', 'ทดสอบ', 'Test', 'shaped', ${POINT}, ${polygon})`,
      ),
    ).toBe("ok");
    expect(
      await outcome(
        `INSERT INTO locations (level, name_th, name_en, slug, centroid, boundary)
         VALUES ('AREA', 'ทดสอบ', 'Test', 'point-boundary', ${POINT}, ${POINT})`,
      ),
    ).toBe(WRONG_GEOMETRY);
    expect(
      await outcome(
        `INSERT INTO locations (level, name_th, name_en, slug, centroid)
         VALUES ('AREA', 'ทดสอบ', 'Test', 'polygon-centroid', ${polygon})`,
      ),
    ).toBe(WRONG_GEOMETRY);
  });

  it("measures between centroids in metres", async () => {
    const [row] = await sql<{ metres: number }>(
      `SELECT ST_Distance(
                ST_SetSRID(ST_MakePoint(100.5784291, 13.72435715), 4326)::geography,
                ST_SetSRID(ST_MakePoint(100.5784291, 13.73435715), 4326)::geography
              ) AS metres`,
    );
    // 0.01 degree of latitude here is 1,106.4 m (Karney's geodesic).
    expect(row?.metres).toBeCloseTo(1106.368, 2);
  });
});

describe("transit_stations", () => {
  it("gives a new row an id and both timestamps, and moves updated_at on change", async () => {
    const [row] = await sql<{ id: string }>(insertStation("Defaults", "D1"));
    expect(row?.id).toMatch(/^[0-9a-f-]{36}$/);
    await sql(
      `UPDATE transit_stations SET updated_at = updated_at - interval '1 day'
        WHERE code = 'D1'`,
    );
    const [after] = await sql<{ fresh: boolean; created: boolean }>(
      `UPDATE transit_stations SET name_en = 'Renamed' WHERE code = 'D1'
       RETURNING updated_at > now() - interval '1 minute' AS fresh,
                 created_at > now() - interval '1 minute' AS created`,
    );
    expect(after).toEqual({ fresh: true, created: true });
  });

  it("refuses the same station of a line twice", async () => {
    expect(await outcome(insertStation("Sukhumvit", "CEN"))).toBe("ok");
    expect(await outcome(insertStation("Sukhumvit", "CEN"))).toBe(
      UNIQUE_VIOLATION,
    );
  });

  it("accepts the same code on another line, as at an interchange", async () => {
    expect(await outcome(insertStation("Silom", "CEN"))).toBe("ok");
  });

  it("refuses a system outside the five of the blueprint", async () => {
    expect(
      await outcome(
        `INSERT INTO transit_stations (system, line, code, name_th, name_en, point)
         VALUES ('TRAM', 'Blue', 'T1', 'ทดสอบ', 'Test', ${POINT})`,
      ),
    ).toBe(INVALID_ENUM);
  });

  it("refuses a line, code or name that is empty or padded with spaces", async () => {
    const insert = (line: string, code: string, th: string, en: string) =>
      outcome(
        `INSERT INTO transit_stations (system, line, code, name_th, name_en, point)
         VALUES ('MRT', $1, $2, $3, $4, ${POINT})`,
        [line, code, th, en],
      );
    expect(await insert("Blue", "BL01", "ท่าพระ", "Tha Phra")).toBe("ok");
    for (const [line, code, th, en] of [
      ["", "BL02", "ทดสอบ", "Test"],
      ["Blue ", "BL02", "ทดสอบ", "Test"],
      ["Blue", "", "ทดสอบ", "Test"],
      ["Blue", " BL02", "ทดสอบ", "Test"],
      ["Blue", "BL02", "", "Test"],
      ["Blue", "BL02", "ทดสอบ ", "Test"],
      ["Blue", "BL02", "ทดสอบ", ""],
      ["Blue", "BL02", "ทดสอบ", "Queen Sirikit National "],
    ] as const)
      expect(
        await insert(line, code, th, en),
        `"${line}" "${code}" "${th}" "${en}"`,
      ).toBe(CHECK_VIOLATION);
  });

  it("needs a system, line, code, both names and a point", async () => {
    const values: Record<string, string> = {
      system: "'ARL'",
      line: "'City'",
      code: "'A8'",
      name_th: "'พญาไท'",
      name_en: "'Phaya Thai'",
      point: POINT,
    };
    for (const missing of Object.keys(values)) {
      const kept = Object.keys(values).filter((name) => name !== missing);
      expect(
        await outcome(
          `INSERT INTO transit_stations (${kept.join(", ")})
           VALUES (${kept.map((name) => values[name]).join(", ")})`,
        ),
        missing,
      ).toBe(NOT_NULL_VIOLATION);
    }
  });

  it("stores only a point", async () => {
    expect(
      await outcome(
        `INSERT INTO transit_stations (system, line, code, name_th, name_en, point)
         VALUES ('SRT', 'Red', 'RN01', 'ทดสอบ', 'Test',
                 ST_GeogFromText('SRID=4326;LINESTRING(100.5 13.7, 100.6 13.8)'))`,
      ),
    ).toBe(WRONG_GEOMETRY);
  });
});

describe("name search support", () => {
  // pg_trgm reads a letter as a letter only under a locale that knows the
  // script. Under the C locale Thai text has no trigrams and matches nothing.
  it("finds trigrams in Thai text under this database's locale", async () => {
    const [row] = await sql<{
      trigrams: number;
      same: number;
      near: number;
      far: number;
    }>(
      `SELECT cardinality(show_trgm('ทองหล่อ')) AS trigrams,
              similarity('ทองหล่อ', 'ทองหล่อ') AS same,
              similarity('ทองหล่อ', 'ทองหลอ') AS near,
              similarity('ทองหล่อ', 'อารีย์') AS far`,
    );
    expect(row?.trigrams).toBeGreaterThanOrEqual(7);
    expect(row?.same).toBe(1);
    expect(row?.near).toBeGreaterThan(0.3);
    expect(row?.far).toBeLessThan(0.1);
  });

  it("compares English names without regard to case", async () => {
    const [row] = await sql<{ same: number }>(
      "SELECT similarity('Thong Lo', 'thong lo') AS same",
    );
    expect(row?.same).toBe(1);
  });
});
