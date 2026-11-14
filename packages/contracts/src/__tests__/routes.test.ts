import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  ROUTES,
  ROUTE_IDS,
  ROUTE_SECTIONS,
  routeAuth,
  routeErrorCodes,
  routeIdempotency,
  routeParamNames,
  routeStatus,
  type RouteContract,
  type RouteId,
} from "../routes";

const entries = Object.entries(ROUTES) as [RouteId, RouteContract][];
const key = (contract: RouteContract) => `${contract.method} ${contract.path}`;

/**
 * Every `METHOD /path` that Blueprint §18 writes, read from the document
 * itself. The route table is compared with this list, so an endpoint added to
 * or dropped from either side fails here.
 */
function endpointsInBlueprint(): string[] {
  const text = readFileSync(
    new URL("../../../../docs/04-api-contracts.md", import.meta.url),
    "utf8",
  );
  const found = new Set<string>();
  const pattern =
    /\b(GET|POST|PATCH|PUT|DELETE)\s*(\/(?:admin\/)?api\/[A-Za-z0-9_\-/:]+)/g;
  for (const match of text.matchAll(pattern))
    found.add(`${match[1]} ${match[2]}`);
  return [...found].sort();
}

describe("route table", () => {
  it("has exactly the endpoints of Blueprint §18", () => {
    const blueprint = endpointsInBlueprint();
    expect(blueprint.length).toBeGreaterThan(100);
    expect(entries.map(([, contract]) => key(contract)).sort()).toEqual(
      blueprint,
    );
  });

  it("lists each endpoint once", () => {
    const keys = entries.map(([, contract]) => key(contract));
    expect(new Set(keys).size).toBe(keys.length);
    expect(ROUTE_IDS).toHaveLength(keys.length);
  });

  it("files every route under its own section of §18", () => {
    for (const [id, contract] of entries) {
      expect(Object.keys(ROUTE_SECTIONS), id).toContain(contract.section);
      expect(contract.summary.length, id).toBeGreaterThan(0);
      expect(id).toMatch(/^[a-z][A-Za-z0-9]+$/);
    }
    for (const [id, contract] of entries) {
      if (contract.path.startsWith("/admin/api/")) expect(id).toMatch(/^admin/);
      if (contract.section === "18.11")
        expect(contract.path, id).toMatch(/^\/admin\/api\//);
    }
  });

  it("declares params only for segments the path has", () => {
    for (const [id, contract] of entries) {
      const names = routeParamNames(contract);
      expect(new Set(names).size, id).toBe(names.length);
      if (contract.params === undefined) continue;
      for (const name of Object.keys(contract.params.shape))
        expect(names, id).toContain(name);
    }
  });

  it("gives no body to GET or DELETE, and no response body to 204 or 302", () => {
    for (const [id, contract] of entries) {
      if (contract.method === "GET" || contract.method === "DELETE")
        expect(contract.body, id).toBeUndefined();
      if (contract.status === 204 || contract.status === 302)
        expect(contract.response, id).toBeUndefined();
      if (contract.stream !== undefined) {
        expect(contract.method, id).toBe("GET");
        expect(contract.response, id).toBeUndefined();
      }
      expect([200, 201, 202, 204, 302]).toContain(routeStatus(contract));
    }
  });
});

describe("rules of §18.0 on the route table", () => {
  it("opens three routes to callers without a session", () => {
    const open = entries
      .filter(([, contract]) => routeAuth(contract) === "public")
      .map(([id]) => id);
    expect(open.sort()).toEqual(["getHealth", "requestOtp", "verifyOtp"]);
  });

  it("treats every /admin/api route as admin, and no other", () => {
    for (const [id, contract] of entries) {
      expect(routeAuth(contract) === "admin", id).toBe(
        contract.path.startsWith("/admin/api/"),
      );
    }
  });

  it("requires an idempotency key for offers, transitions and payments", () => {
    const required = entries
      .filter(([, contract]) => routeIdempotency(contract) === "required")
      .map(([id]) => id);
    expect(required.sort()).toEqual(
      [
        // transitions
        "expressInterest",
        "transitionDeal",
        "requestViewing",
        "confirmViewing",
        "rescheduleViewing",
        "completeViewing",
        "cancelViewing",
        "createAgreement",
        "signAgreement",
        "closeDeal",
        "cancelDeal",
        "adminForceTransitionDeal",
        // offers
        "submitOffer",
        "counterOffer",
        "acceptOffer",
        "rejectOffer",
        "withdrawOffer",
        // payments
        "recordPayment",
        "adminConfirmPayment",
      ].sort(),
    );
  });

  it("accepts an idempotency key on every other mutating route, and on no read", () => {
    for (const [id, contract] of entries) {
      const rule = routeIdempotency(contract);
      if (contract.method === "GET") expect(rule, id).toBe("none");
      else expect(rule, id).not.toBe("none");
    }
  });

  it("asks for If-Match exactly where §18 shows it", () => {
    const versioned = entries
      .filter(([, contract]) => contract.ifMatch === true)
      .map(([id]) => id);
    expect(versioned.sort()).toEqual(
      ["transitionDeal", "updateProperty", "updateRequirement"].sort(),
    );
    for (const id of versioned)
      expect(routeErrorCodes(ROUTES[id])).toContain("CONFLICT_VERSION");
  });

  it("derives the canonical error codes of each route", () => {
    for (const [id, contract] of entries) {
      const codes = routeErrorCodes(contract);
      expect(codes, id).toContain("INTERNAL");
      expect(codes, id).toContain("RATE_LIMITED");
      expect(codes.includes("UNAUTHENTICATED"), id).toBe(
        routeAuth(contract) !== "public",
      );
      expect(codes.includes("NOT_FOUND"), id).toBe(contract.path.includes(":"));
      expect(codes.includes("VALIDATION_FAILED"), id).toBe(
        contract.body !== undefined || contract.query !== undefined,
      );
      expect(codes.includes("CONFLICT_VERSION"), id).toBe(
        contract.ifMatch === true,
      );
      expect(codes, id).not.toContain("IDEMPOTENT_REPLAY");
      expect(new Set(codes).size, id).toBe(codes.length);
    }
  });

  it("puts the endpoint codes on the endpoints §18 names", () => {
    expect(routeErrorCodes(ROUTES.verifyOtp)).toContain("OTP_INVALID");
    expect(routeErrorCodes(ROUTES.publishProperty)).toContain(
      "PROPERTY_INCOMPLETE",
    );
    expect(routeErrorCodes(ROUTES.publishProperty)).toContain(
      "TIER_INSUFFICIENT",
    );
    expect(routeErrorCodes(ROUTES.expressInterest)).toContain(
      "SUPER_MATCH_QUOTA_EXCEEDED",
    );
    expect(routeErrorCodes(ROUTES.closeDeal)).toContain("CLOSE_VALUE_MISMATCH");
    expect(routeErrorCodes(ROUTES.transitionDeal)).toContain(
      "DEAL_TRANSITION_NOT_ALLOWED",
    );
    const owners: Record<string, string[]> = {
      OTP_INVALID: ["verifyOtp"],
      PROPERTY_INCOMPLETE: ["publishProperty"],
      SUPER_MATCH_QUOTA_EXCEEDED: ["expressInterest"],
      CLOSE_VALUE_MISMATCH: ["closeDeal"],
    };
    for (const [code, ids] of Object.entries(owners)) {
      const found = entries
        .filter(([, contract]) =>
          (routeErrorCodes(contract) as string[]).includes(code),
        )
        .map(([id]) => id);
      expect(found, code).toEqual(ids);
    }
  });

  it("lets every AI task degrade: 503 AI_UNAVAILABLE is a designed response", () => {
    const tasks = entries.filter(
      ([, contract]) =>
        contract.path.startsWith("/api/ai/") &&
        !contract.path.startsWith("/api/ai/runs/"),
    );
    expect(tasks).toHaveLength(8);
    for (const [id, contract] of tasks) {
      expect(routeErrorCodes(contract), id).toContain("AI_UNAVAILABLE");
      expect(routeErrorCodes(contract), id).toContain("AI_BUDGET_EXCEEDED");
    }
    for (const [id, contract] of entries) {
      if (
        contract.path.startsWith("/api/ai/") &&
        tasks.every(([t]) => t !== id)
      )
        expect(routeErrorCodes(contract), id).not.toContain("AI_UNAVAILABLE");
      if (!contract.path.startsWith("/api/ai/"))
        expect(routeErrorCodes(contract), id).not.toContain("AI_UNAVAILABLE");
    }
  });
});
