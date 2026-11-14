import { beforeAll, describe, expect, it } from "vitest";
import type { DatabaseHealthPort } from "../health";
import { getSystemHealth } from "../health";

/**
 * The same repository with `DATABASE_URL` pointing at a port where nothing
 * listens. The URL is set before the repository module is loaded, because the
 * process's shared client reads it on first use.
 */
let repository: DatabaseHealthPort;

beforeAll(async () => {
  process.env["DATABASE_URL"] = "postgresql://lilith:lilith@127.0.0.1:1/lilith";
  const { createSystemRepository } = await import("../repository");
  repository = createSystemRepository();
});

describe("system repository with no database", () => {
  it("rejects, quickly", async () => {
    const started = Date.now();
    await expect(repository.probe()).rejects.toThrow();
    expect(Date.now() - started).toBeLessThan(5_000);
  });

  it("lets the health service report the database as unreachable", async () => {
    const health = await getSystemHealth({
      database: repository,
      version: "integration",
    });
    expect(health.db).toBe("unreachable");
    expect(health.status).toBe("degraded");
  });
});
