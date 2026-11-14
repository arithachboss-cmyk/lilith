import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { ERROR_STATUS } from "../errors";
import {
  API_VERSION,
  SESSION_COOKIE,
  buildOpenApiDocument,
  renderOpenApiDocument,
  type Json,
  type JsonObject,
} from "../openapi";
import {
  ROUTES,
  routeAuth,
  routeErrorCodes,
  routeIdempotency,
  routeStatus,
  type RouteContract,
} from "../routes";

const packageRoot = fileURLToPath(new URL("../../", import.meta.url));
const document = buildOpenApiDocument();
const paths = document["paths"] as Record<string, Record<string, JsonObject>>;
const components = document["components"] as Record<string, JsonObject>;
const schemas = components["schemas"] as Record<string, JsonObject>;

function operationOf(contract: RouteContract): JsonObject {
  const path = contract.path.replace(/:([A-Za-z][A-Za-z0-9]*)/g, "{$1}");
  const operation = paths[path]?.[contract.method.toLowerCase()];
  if (operation === undefined)
    throw new Error(`No operation for ${contract.method} ${contract.path}`);
  return operation;
}

function refsIn(value: Json, into: string[] = []): string[] {
  if (Array.isArray(value)) for (const member of value) refsIn(member, into);
  else if (typeof value === "object" && value !== null) {
    for (const [key, member] of Object.entries(value)) {
      if (key === "$ref" && typeof member === "string") into.push(member);
      else refsIn(member, into);
    }
  }
  return into;
}

function resolve(ref: string): Json | undefined {
  let node: Json | undefined = document;
  for (const part of ref.replace(/^#\//, "").split("/")) {
    if (typeof node !== "object" || node === null || Array.isArray(node))
      return undefined;
    node = node[part.replaceAll("~1", "/").replaceAll("~0", "~")];
  }
  return node;
}

describe("OpenAPI document", () => {
  it("is an OpenAPI 3.1 document with the conventions of §18.0", () => {
    expect(document["openapi"]).toBe("3.1.0");
    expect(document["info"]).toMatchObject({ version: API_VERSION });
    expect(document["security"]).toEqual([{ sessionCookie: [] }]);
    expect(components["securitySchemes"]).toMatchObject({
      sessionCookie: { type: "apiKey", in: "cookie", name: SESSION_COOKIE },
    });
    expect(SESSION_COOKIE).toBe("__Host-mp_session");
  });

  it("has one operation for every route, under its operation id", () => {
    const operations = Object.values(paths).flatMap((item) =>
      Object.values(item),
    );
    expect(operations).toHaveLength(Object.keys(ROUTES).length);
    const ids = operations.map((operation) => operation["operationId"]);
    expect(new Set(ids).size).toBe(ids.length);
    for (const [id, contract] of Object.entries(ROUTES) as [
      string,
      RouteContract,
    ][]) {
      expect(operationOf(contract)["operationId"]).toBe(id);
    }
    for (const path of Object.keys(paths)) {
      expect(path).toMatch(/^\/(admin\/)?api\//);
      expect(path).not.toContain(":");
    }
  });

  it("resolves every reference, and uses every component", () => {
    const refs = refsIn(document);
    expect(refs.length).toBeGreaterThan(500);
    for (const ref of refs) {
      expect(ref.startsWith("#/"), ref).toBe(true);
      expect(resolve(ref), ref).toBeDefined();
    }
    const used = new Set(refs);
    for (const [kind, members] of Object.entries(components)) {
      if (kind === "securitySchemes") continue;
      for (const name of Object.keys(members))
        expect(
          used.has(`#/components/${kind}/${name}`),
          `${kind}/${name}`,
        ).toBe(true);
    }
  });

  it("documents the success status and the error statuses of each route", () => {
    for (const [id, contract] of Object.entries(ROUTES) as [
      string,
      RouteContract,
    ][]) {
      const responses = operationOf(contract)["responses"] as JsonObject;
      const expected = new Set([
        String(routeStatus(contract)),
        ...routeErrorCodes(contract).map((code) => String(ERROR_STATUS[code])),
      ]);
      expect(Object.keys(responses).sort(), id).toEqual([...expected].sort());
    }
  });

  it("names every error code of a route in the description of its status", () => {
    for (const [id, contract] of Object.entries(ROUTES) as [
      string,
      RouteContract,
    ][]) {
      const responses = operationOf(contract)["responses"] as JsonObject;
      for (const code of routeErrorCodes(contract)) {
        const response = responses[String(ERROR_STATUS[code])] as JsonObject;
        const resolved = resolve(response["$ref"] as string) as JsonObject;
        expect(resolved["description"], `${id} ${code}`).toContain(code);
        expect(JSON.stringify(resolved["content"]), id).toContain(
          "#/components/schemas/ErrorEnvelope",
        );
      }
    }
    const transition = resolve(
      "#/components/responses/Error.CONFLICT_VERSION.DEAL_TRANSITION_NOT_ALLOWED",
    ) as JsonObject;
    expect(transition["description"]).toContain("allowed_from_here");
  });

  it("sends X-Request-Id on every response", () => {
    const responses = [
      ...Object.values(paths).flatMap((item) =>
        Object.values(item).flatMap((operation) =>
          Object.values(operation["responses"] as JsonObject),
        ),
      ),
      ...Object.values(components["responses"] as JsonObject),
    ] as JsonObject[];
    for (const response of responses) {
      if (response["$ref"] !== undefined) continue;
      expect(response["headers"]).toMatchObject({
        "X-Request-Id": { $ref: "#/components/headers/RequestId" },
      });
    }
  });

  it("marks public routes, idempotency keys and If-Match as the table says", () => {
    for (const [id, contract] of Object.entries(ROUTES) as [
      string,
      RouteContract,
    ][]) {
      const operation = operationOf(contract);
      expect(operation["security"] !== undefined, id).toBe(
        routeAuth(contract) === "public",
      );
      const refs = refsIn(operation["parameters"] ?? []);
      const idempotency = routeIdempotency(contract);
      expect(
        refs.includes("#/components/parameters/IdempotencyKeyRequired"),
        id,
      ).toBe(idempotency === "required");
      expect(refs.includes("#/components/parameters/IdempotencyKey"), id).toBe(
        idempotency === "accepted",
      );
      expect(refs.includes("#/components/parameters/IfMatch"), id).toBe(
        contract.ifMatch === true,
      );
    }
    const parameters = components["parameters"] as Record<string, JsonObject>;
    expect(parameters["IdempotencyKeyRequired"]).toMatchObject({
      name: "Idempotency-Key",
      in: "header",
      required: true,
    });
    expect(parameters["IdempotencyKey"]).toMatchObject({ required: false });
    expect(parameters["IfMatch"]).toMatchObject({ name: "If-Match" });
  });

  it("declares every path and query parameter", () => {
    const feed = operationOf(ROUTES.getMatchFeed)["parameters"] as JsonObject[];
    expect(feed).toEqual([
      {
        name: "requirement_id",
        in: "query",
        required: true,
        schema: { $ref: "#/components/schemas/RequirementId" },
      },
      {
        name: "limit",
        in: "query",
        required: false,
        schema: { type: "integer", minimum: 1, maximum: 100 },
      },
      {
        name: "cursor",
        in: "query",
        required: false,
        schema: { type: "string", minLength: 1, maxLength: 512 },
      },
    ]);
    for (const [path, item] of Object.entries(paths)) {
      const inPath = [...path.matchAll(/\{([^}]+)\}/g)].map((m) => m[1]);
      for (const operation of Object.values(item)) {
        const declared = ((operation["parameters"] ?? []) as JsonObject[])
          .filter((parameter) => parameter["in"] === "path")
          .map((parameter) => parameter["name"]);
        expect(declared, path).toEqual(inPath);
      }
    }
  });

  it("renders money, time and ids as §18.0 defines them", () => {
    expect(schemas["Satang"]).toMatchObject({ type: "integer", minimum: 0 });
    expect(schemas["Currency"]).toMatchObject({ const: "THB" });
    expect(schemas["Timestamp"]).toMatchObject({ format: "date-time" });
    expect(schemas["DateOnly"]).toMatchObject({ format: "date" });
    expect(schemas["UserId"]).toMatchObject({ type: "string" });
    expect(String(schemas["UserId"]?.["pattern"])).toContain("usr_");
    expect(JSON.stringify(schemas["FeeDTO"])).not.toContain('"type":"number"');
  });

  it("keeps the public listing free of private members", () => {
    const publicProperties = Object.keys(
      schemas["PropertyPublicDTO"]?.["properties"] as JsonObject,
    );
    for (const member of [
      "address_line",
      "unit_number",
      "geo_point",
      "documents",
      "owner",
    ])
      expect(publicProperties).not.toContain(member);
    expect(
      Object.keys(schemas["PropertyPrivateDTO"]?.["properties"] as JsonObject),
    ).toContain("address_line");
  });

  it("describes the frames of the deal stream", () => {
    const operation = operationOf(ROUTES.streamDeal);
    expect(Object.keys(operation["x-sse-events"] as JsonObject).sort()).toEqual(
      [
        "deal.transitioned",
        "heartbeat",
        "message.created",
        "offer.updated",
        "participant.typing",
        "viewing.updated",
      ].sort(),
    );
    expect(JSON.stringify(operation["responses"])).toContain(
      "text/event-stream",
    );
  });

  it("is plain JSON and the same on every build", () => {
    const rendered = renderOpenApiDocument();
    expect(JSON.parse(rendered)).toEqual(document);
    expect(renderOpenApiDocument()).toBe(rendered);
    expect(rendered.endsWith("}\n")).toBe(true);
    expect(rendered).not.toContain("$defs");
    expect(rendered).not.toContain('"$schema"');
  });
});

describe("the committed openapi.json", () => {
  it("is what the generator emits now", () => {
    const committed = readFileSync(`${packageRoot}openapi.json`, "utf8");
    expect(
      committed === renderOpenApiDocument(),
      "openapi.json is out of date — run `pnpm contracts:openapi`",
    ).toBe(true);
  });

  it("passes `redocly lint` with the strict rule set", () => {
    const result = spawnSync(
      "node",
      [
        "node_modules/@redocly/cli/bin/cli.js",
        "lint",
        "openapi.json",
        "--config",
        "redocly.yaml",
      ],
      {
        cwd: packageRoot,
        encoding: "utf8",
        env: {
          ...process.env,
          REDOCLY_TELEMETRY: "off",
          REDOCLY_SUPPRESS_UPDATE_NOTICE: "true",
        },
      },
    );
    const output = `${result.stdout}${result.stderr}`;
    expect(result.status, output).toBe(0);
    expect(output).toContain("Your API description is valid");
    // The two redirects of §18.8 have no 2xx response; nothing else is excused.
    expect(output).toContain("2 problems are explicitly ignored");
  }, 60_000);
});
