import { describe, expect, it } from "vitest";
import {
  REQUIRED_EXTENSIONS,
  getSystemHealth,
  type DatabaseHealthPort,
} from "../health";

const ALL = ["citext", "pg_trgm", "pgcrypto", "postgis", "vector"];

function database(
  probe: DatabaseHealthPort["probe"],
): DatabaseHealthPort & { calls: number } {
  const port = {
    calls: 0,
    probe: () => {
      port.calls += 1;
      return probe();
    },
  };
  return port;
}

const answering = (extensions: string[]) =>
  database(() => Promise.resolve({ extensions }));

describe("getSystemHealth", () => {
  it("is ok when the database answers with every required extension", async () => {
    const health = await getSystemHealth({
      database: answering([...ALL, "fuzzystrmatch"]),
      version: "abc123",
    });
    expect(health).toEqual({
      status: "ok",
      db: "ok",
      queue: "not_configured",
      ai: "not_configured",
      version: "abc123",
    });
  });

  it("needs exactly the five extensions migration 0001 installs", () => {
    expect([...REQUIRED_EXTENSIONS].sort()).toEqual(ALL);
  });

  it.each(ALL)("is not_migrated when %s is missing", async (missing) => {
    const health = await getSystemHealth({
      database: answering(ALL.filter((name) => name !== missing)),
      version: "v",
    });
    expect(health.db).toBe("not_migrated");
    expect(health.status).toBe("degraded");
  });

  it("is not_migrated on an empty database", async () => {
    const health = await getSystemHealth({
      database: answering([]),
      version: "v",
    });
    expect(health.db).toBe("not_migrated");
    expect(health.status).toBe("degraded");
  });

  it("is unreachable when the probe rejects, and does not throw", async () => {
    const health = await getSystemHealth({
      database: database(() => Promise.reject(new Error("ECONNREFUSED"))),
      version: "v",
    });
    expect(health.db).toBe("unreachable");
    expect(health.status).toBe("degraded");
  });

  it("is unreachable when the probe throws before returning a promise", async () => {
    const health = await getSystemHealth({
      database: database(() => {
        throw new Error("no client");
      }),
      version: "v",
    });
    expect(health.db).toBe("unreachable");
  });

  it("carries no detail of the failure", async () => {
    const health = await getSystemHealth({
      database: database(() =>
        Promise.reject(new Error("password authentication failed for lilith")),
      ),
      version: "v",
    });
    expect(JSON.stringify(health)).not.toContain("password");
    expect(Object.keys(health).sort()).toEqual(
      ["ai", "db", "queue", "status", "version"].sort(),
    );
  });

  it("asks the database once per call", async () => {
    const port = answering(ALL);
    await getSystemHealth({ database: port, version: "v" });
    await getSystemHealth({ database: port, version: "v" });
    expect(port.calls).toBe(2);
  });

  it("reports the parts that are not built yet as such, whatever the database says", async () => {
    for (const port of [
      answering(ALL),
      answering([]),
      database(() => Promise.reject(new Error("down"))),
    ]) {
      const health = await getSystemHealth({ database: port, version: "v" });
      expect(health.queue).toBe("not_configured");
      expect(health.ai).toBe("not_configured");
    }
  });
});
