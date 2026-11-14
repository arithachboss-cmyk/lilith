import { describe, expect, it } from "vitest";
import { getSystemHealth } from "../health";
import { createSystemRepository } from "../repository";

// Runs against the database of docker-compose.yml, after `pnpm db:migrate`,
// through the process's shared client.
describe("system repository on a real database", () => {
  it("lets the health service see a migrated database as ok", async () => {
    const health = await getSystemHealth({
      database: createSystemRepository(),
      version: "integration",
    });
    expect(health).toEqual({
      status: "ok",
      db: "ok",
      queue: "not_configured",
      ai: "not_configured",
      version: "integration",
    });
  });

  it("reads the real catalogue: every required extension is reported", async () => {
    const { extensions } = await createSystemRepository().probe();
    for (const name of ["citext", "pg_trgm", "pgcrypto", "postgis", "vector"])
      expect(extensions).toContain(name);
  });
});
