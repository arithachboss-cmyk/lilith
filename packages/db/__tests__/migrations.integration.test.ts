import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createEmptyDatabase,
  migrate,
  prisma,
  query,
  type TestDatabase,
} from "./test-database";

// Blueprint ARCH-004: after `pnpm db:migrate` these five are installed.
const REQUIRED = ["citext", "pg_trgm", "pgcrypto", "postgis", "vector"];

let database: TestDatabase;

beforeAll(async () => {
  database = await createEmptyDatabase();
});

afterAll(async () => {
  await database.drop();
});

async function installedExtensions(): Promise<string[]> {
  const rows = await query<{ extname: string }>(
    database.url,
    "SELECT extname FROM pg_extension WHERE extname <> 'plpgsql' ORDER BY extname",
  );
  return rows.map((row) => row.extname);
}

describe("pnpm db:migrate", () => {
  it("starts from a database with none of the extensions", async () => {
    expect(await installedExtensions()).toEqual([]);
  });

  it("applies the migrations to an empty database", async () => {
    const result = migrate(database.url);
    expect(result.status, result.output).toBe(0);
    expect(result.output).toContain("0001_extensions");
    expect(result.output).toContain(
      "All migrations have been successfully applied",
    );
  });

  it("installs postgis, pgcrypto, pg_trgm, vector and citext", async () => {
    const installed = await installedExtensions();
    for (const extension of REQUIRED) expect(installed).toContain(extension);
  });

  it("runs on PostgreSQL 16", async () => {
    const [row] = await query<{ version: string }>(
      database.url,
      "SELECT current_setting('server_version_num') AS version",
    );
    expect(Math.floor(Number(row?.version) / 10_000)).toBe(16);
  });

  it("makes each extension usable", async () => {
    const [row] = await query<{
      metres: number;
      cosine: number;
      uuid: string;
      trigram: number;
      same: boolean;
    }>(
      database.url,
      `SELECT
         round(ST_Distance(
           'SRID=4326;POINT(100.5786 13.7244)'::geography,
           'SRID=4326;POINT(100.5850 13.7200)'::geography))::int AS metres,
         ('[1,0,0]'::vector <=> '[0,1,0]'::vector)::float8        AS cosine,
         gen_random_uuid()::text                                   AS uuid,
         similarity('thong lo', 'thonglor')::float8                AS trigram,
         ('Ari@Example.com'::citext = 'ari@example.com')           AS same`,
    );
    expect(row?.metres).toBeGreaterThan(700);
    expect(row?.metres).toBeLessThan(1000);
    expect(row?.cosine).toBe(1);
    expect(row?.uuid).toMatch(/^[0-9a-f-]{36}$/);
    expect(row?.trigram).toBeGreaterThan(0.3);
    expect(row?.same).toBe(true);
  });

  it("supports the index types the data model needs", async () => {
    await query(
      database.url,
      `CREATE TABLE index_probe (
         id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
         point geography(POINT, 4326),
         embedding vector(1536),
         name text)`,
    );
    await query(database.url, "CREATE INDEX ON index_probe USING gist (point)");
    await query(
      database.url,
      "CREATE INDEX ON index_probe USING hnsw (embedding vector_cosine_ops)",
    );
    await query(
      database.url,
      "CREATE INDEX ON index_probe USING gin (name gin_trgm_ops)",
    );
    const rows = await query<{ indexdef: string }>(
      database.url,
      "SELECT indexdef FROM pg_indexes WHERE tablename = 'index_probe'",
    );
    const definitions = rows.map((row) => row.indexdef).join("\n");
    for (const method of ["gist", "hnsw", "gin"])
      expect(definitions).toContain(`USING ${method}`);
    await query(database.url, "DROP TABLE index_probe");
  });

  it("records the migration, and a second run changes nothing", async () => {
    const again = migrate(database.url);
    expect(again.status, again.output).toBe(0);
    expect(again.output).toContain("No pending migrations to apply");
    const rows = await query<{ migration_name: string; applied: boolean }>(
      database.url,
      `SELECT migration_name, finished_at IS NOT NULL AS applied
         FROM _prisma_migrations ORDER BY migration_name`,
    );
    expect(rows).toEqual([
      { migration_name: "0001_extensions", applied: true },
    ]);
  });

  it("reports the database as up to date", () => {
    const status = prisma(database.url, "migrate", "status");
    expect(status.status, status.output).toBe(0);
    expect(status.output).toContain("Database schema is up to date");
  });
});
