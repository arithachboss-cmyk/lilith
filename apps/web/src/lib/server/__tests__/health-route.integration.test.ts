import { HealthResponse } from "@lilith/contracts/dto";
import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/health/route";
import { appVersion } from "../system";

/**
 * The real route, with nothing replaced: route adapter → core service →
 * repository → database package → PostgreSQL. It needs the database of
 * docker-compose.yml, migrated.
 */
describe("GET /api/health through every layer", () => {
  it("reports a migrated database as ok", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("X-Request-Id")).toMatch(/^req_/);
    const body = HealthResponse.parse(await response.json());
    expect(body).toEqual({
      status: "ok",
      db: "ok",
      queue: "not_configured",
      ai: "not_configured",
      version: appVersion(),
    });
  });

  it("answers the same on every call", async () => {
    const bodies = await Promise.all(
      Array.from({ length: 10 }, async () => (await GET()).json()),
    );
    for (const body of bodies)
      expect(body).toMatchObject({ status: "ok", db: "ok" });
  });
});

describe("appVersion", () => {
  it("is the injected build, or dev when none was injected", () => {
    expect(appVersion({ APP_VERSION: "1f37e29" })).toBe("1f37e29");
    expect(appVersion({})).toBe("dev");
    expect(appVersion({ APP_VERSION: "  " })).toBe("dev");
  });
});
