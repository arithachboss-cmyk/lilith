import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { LOCAL_DATABASE_URL, databaseUrl, migrationDatabaseUrl } from "../env";

const POOLED = "postgresql://app:secret@db.example.test/lilith?sslmode=require";
const DIRECT = "postgresql://app:secret@direct.example.test/lilith";

describe("database URLs", () => {
  it("uses the local Docker database on a developer machine", () => {
    for (const env of [{}, { APP_ENV: "local" }, { APP_ENV: "" }]) {
      expect(databaseUrl(env)).toBe(LOCAL_DATABASE_URL);
      expect(migrationDatabaseUrl(env)).toBe(LOCAL_DATABASE_URL);
    }
  });

  it("points the local default at the database docker-compose.yml starts", () => {
    const compose = readFileSync(
      new URL("../../../docker-compose.yml", import.meta.url),
      "utf8",
    );
    const url = new URL(LOCAL_DATABASE_URL);
    expect(url.hostname).toBe("127.0.0.1");
    // Published on the loopback address only, on the port the URL names.
    expect(compose).toContain(`"127.0.0.1:${url.port}:5432"`);
    expect(compose).toContain(`POSTGRES_USER: ${url.username}`);
    expect(compose).toContain(`POSTGRES_PASSWORD: ${url.password}`);
    expect(compose).toContain(`POSTGRES_DB: ${url.pathname.slice(1)}`);
  });

  it("uses DATABASE_URL for the application", () => {
    expect(databaseUrl({ DATABASE_URL: POOLED })).toBe(POOLED);
    expect(
      databaseUrl({ DATABASE_URL: POOLED, DATABASE_DIRECT_URL: DIRECT }),
    ).toBe(POOLED);
  });

  it("prefers the direct URL for migrations", () => {
    expect(
      migrationDatabaseUrl({
        DATABASE_URL: POOLED,
        DATABASE_DIRECT_URL: DIRECT,
      }),
    ).toBe(DIRECT);
    expect(migrationDatabaseUrl({ DATABASE_URL: POOLED })).toBe(POOLED);
    expect(
      migrationDatabaseUrl({ DATABASE_URL: POOLED, DATABASE_DIRECT_URL: " " }),
    ).toBe(POOLED);
  });

  it("never falls back to the local database outside local", () => {
    for (const APP_ENV of ["dev", "staging", "production", "LOCAL", "prod"]) {
      expect(() => databaseUrl({ APP_ENV })).toThrow(/DATABASE_URL is not set/);
      expect(() => migrationDatabaseUrl({ APP_ENV })).toThrow(/is not set/);
      expect(() => databaseUrl({ APP_ENV, DATABASE_URL: "" })).toThrow();
      expect(databaseUrl({ APP_ENV, DATABASE_URL: POOLED })).toBe(POOLED);
    }
  });

  it("does not use the direct URL for the application", () => {
    expect(() =>
      databaseUrl({ APP_ENV: "production", DATABASE_DIRECT_URL: DIRECT }),
    ).toThrow(/DATABASE_URL is not set/);
  });
});
