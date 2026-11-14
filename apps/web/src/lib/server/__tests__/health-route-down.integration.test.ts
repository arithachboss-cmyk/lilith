import { HealthResponse } from "@lilith/contracts/dto";
import { beforeAll, describe, expect, it } from "vitest";

/**
 * The real route again, this time with `DATABASE_URL` pointing at a port
 * where nothing listens. It shows that the route's answer really comes from
 * the database: with the same code and no database, it says so.
 *
 * The URL is set before the route module is loaded, because the process's
 * shared client reads it on first use. Each test file has its own process
 * state, so this does not affect the other files.
 */
let GET: () => Promise<Response>;

beforeAll(async () => {
  process.env["DATABASE_URL"] = "postgresql://lilith:lilith@127.0.0.1:1/lilith";
  ({ GET } = await import("@/app/api/health/route"));
});

describe("GET /api/health with no database", () => {
  it("answers 200 degraded, with the database unreachable", async () => {
    const started = Date.now();
    const response = await GET();
    expect(Date.now() - started).toBeLessThan(5_000);
    expect(response.status).toBe(200);
    const body = HealthResponse.parse(await response.json());
    expect(body.status).toBe("degraded");
    expect(body.db).toBe("unreachable");
  });

  it("says nothing about where it tried to connect", async () => {
    const text = await (await GET()).text();
    expect(text).not.toMatch(/127\.0\.0\.1|ECONNREFUSED|postgresql|lilith:/);
  });

  it("keeps answering on later calls", async () => {
    for (let call = 0; call < 3; call += 1) {
      const body = HealthResponse.parse(await (await GET()).json());
      expect(body.db).toBe("unreachable");
    }
  });
});
