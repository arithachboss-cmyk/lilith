import { ErrorEnvelope } from "@lilith/contracts/errors";
import { describe, expect, it } from "vitest";
import {
  REQUEST_ID_HEADER,
  errorResponse,
  jsonResponse,
  newRequestId,
} from "../http";

const TEXTS = { en: "Not found.", th: "ไม่พบข้อมูล" };

describe("API edge helpers", () => {
  it("makes request ids that differ and fit the contract", () => {
    const ids = Array.from({ length: 100 }, newRequestId);
    expect(new Set(ids).size).toBe(100);
    for (const id of ids) {
      expect(id).toMatch(/^req_[0-9a-f]{8}-[0-9a-f-]{27}$/);
      expect(id.length).toBeLessThanOrEqual(128);
    }
  });

  it("puts the request id and no-store on a JSON response", async () => {
    const response = jsonResponse({ hello: "world" }, "req_x", 201);
    expect(response.status).toBe(201);
    expect(response.headers.get(REQUEST_ID_HEADER)).toBe("req_x");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({ hello: "world" });
    expect(jsonResponse({}, "req_y").status).toBe(200);
  });

  it("gives each error code the status of the contract, in the envelope", async () => {
    const cases = [
      ["NOT_FOUND", 404],
      ["UNAUTHENTICATED", 401],
      ["VALIDATION_FAILED", 422],
      ["RATE_LIMITED", 429],
      ["INTERNAL", 500],
    ] as const;
    for (const [code, status] of cases) {
      const response = errorResponse(code, TEXTS, "req_z", false);
      expect(response.status, code).toBe(status);
      const envelope = ErrorEnvelope.parse(await response.json());
      expect(envelope).toEqual({
        error: {
          code,
          message_en: TEXTS.en,
          message_th: TEXTS.th,
          request_id: "req_z",
          retryable: false,
        },
      });
      expect(response.headers.get(REQUEST_ID_HEADER)).toBe("req_z");
    }
  });
});
