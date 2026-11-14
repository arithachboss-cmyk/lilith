import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { migrationDatabaseUrl } from "../env";

/**
 * Integration tests run against the database of `docker-compose.yml` and
 * never touch its data: each test file creates its own empty database from
 * `template0`, migrates it with the same command as `pnpm db:migrate`, and
 * drops it afterwards.
 */

const packageRoot = fileURLToPath(new URL("../", import.meta.url));

export const serverUrl = migrationDatabaseUrl(process.env);

function urlForDatabase(name: string): string {
  const url = new URL(serverUrl);
  url.pathname = `/${name}`;
  return url.toString();
}

async function onServer<T>(run: (client: pg.Client) => Promise<T>): Promise<T> {
  const client = new pg.Client({ connectionString: serverUrl });
  try {
    await client.connect();
  } catch (cause) {
    throw new Error(
      "The database is not reachable. Start it with `docker compose up -d --wait`.",
      { cause },
    );
  }
  try {
    return await run(client);
  } finally {
    await client.end();
  }
}

export interface TestDatabase {
  readonly name: string;
  readonly url: string;
  drop(): Promise<void>;
}

/** Creates an empty database: no tables and no extensions beyond plpgsql. */
export async function createEmptyDatabase(): Promise<TestDatabase> {
  const name = `lilith_test_${randomBytes(6).toString("hex")}`;
  await onServer((client) =>
    client.query(`CREATE DATABASE "${name}" TEMPLATE template0`),
  );
  return {
    name,
    url: urlForDatabase(name),
    drop: () =>
      onServer(async (client) => {
        await client.query(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`);
      }),
  };
}

export interface CommandResult {
  readonly status: number | null;
  readonly output: string;
}

/** Runs the Prisma CLI of this package against the given database. */
export function prisma(databaseUrl: string, ...args: string[]): CommandResult {
  const result = spawnSync(
    process.execPath,
    ["node_modules/prisma/build/index.js", ...args],
    {
      cwd: packageRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
        DATABASE_DIRECT_URL: databaseUrl,
      },
    },
  );
  return {
    status: result.status,
    output: `${result.stdout}${result.stderr}`,
  };
}

/** `prisma migrate deploy` — what `pnpm db:migrate` runs. */
export function migrate(databaseUrl: string): CommandResult {
  return prisma(databaseUrl, "migrate", "deploy");
}

export async function query<Row extends pg.QueryResultRow>(
  databaseUrl: string,
  text: string,
  values: unknown[] = [],
): Promise<Row[]> {
  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    return (await client.query<Row>(text, values)).rows;
  } finally {
    await client.end();
  }
}
