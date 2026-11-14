import { HealthResponse } from "@lilith/contracts/dto";
import { ErrorEnvelope } from "@lilith/contracts/errors";
import type { SystemHealth } from "@lilith/core/system";
import { describe, expect, it } from "vitest";
import { createHealthHandler } from "../health-handler";

const READY: SystemHealth = {
  status: "ok",
  db: "ok",
  queue: "not_configured",
  ai: "not_configured",
  version: "abc123",
};

describe("GET /api/health handler", () => {
  it("answers 200 with a body that matches the contract", async () => {
    const response = await createHealthHandler(() => Promise.resolve(READY))();
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    const body: unknown = await response.json();
    expect(HealthResponse.parse(body)).toEqual(READY);
    expect(body).toEqual(READY);
  });

  it("still answers 200 when the system is degraded", async () => {
    const degraded: SystemHealth = {
      ...READY,
      status: "degraded",
      db: "unreachable",
    };
    const response = await createHealthHandler(() =>
      Promise.resolve(degraded),
    )();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(degraded);
  });

  it("sends a fresh X-Request-Id and forbids caching on every response", async () => {
    const handler = createHealthHandler(() => Promise.resolve(READY));
    const first = await handler();
    const second = await handler();
    const ids = [first, second].map((r) => r.headers.get("X-Request-Id"));
    for (const id of ids) expect(id).toMatch(/^req_[0-9a-f-]{36}$/);
    expect(ids[0]).not.toBe(ids[1]);
    expect(first.headers.get("Cache-Control")).toBe("no-store");
  });

  it("strips members the contract does not name", async () => {
    const leaky = { ...READY, databaseUrl: "postgresql://user:secret@host/db" };
    const response = await createHealthHandler(() => Promise.resolve(leaky))();
    const text = await response.text();
    expect(text).not.toContain("secret");
    expect(JSON.parse(text)).toEqual(READY);
  });

  it("answers 500 with the error envelope when the service throws", async () => {
    const response = await createHealthHandler(() =>
      Promise.reject(new Error("connect ECONNREFUSED 10.0.0.5:5432")),
    )();
    expect(response.status).toBe(500);
    const text = await response.text();
    const envelope = ErrorEnvelope.parse(JSON.parse(text));
    expect(envelope.error.code).toBe("INTERNAL");
    expect(envelope.error.retryable).toBe(true);
    expect(envelope.error.message_th).toMatch(/[฀-๿]/);
    expect(envelope.error.message_en).toMatch(/[A-Za-z]/);
    // The id in the body is the one in the header.
    expect(envelope.error.request_id).toBe(
      response.headers.get("X-Request-Id"),
    );
    // Nothing about the cause reaches the caller.
    expect(text).not.toContain("ECONNREFUSED");
    expect(text).not.toContain("10.0.0.5");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("answers 500 when the service returns something outside the contract", async () => {
    const wrong = { ...READY, db: "on fire" } as unknown as SystemHealth;
    const response = await createHealthHandler(() => Promise.resolve(wrong))();
    expect(response.status).toBe(500);
    const envelope = ErrorEnvelope.parse(await response.json());
    expect(envelope.error.code).toBe("INTERNAL");
  });
});
