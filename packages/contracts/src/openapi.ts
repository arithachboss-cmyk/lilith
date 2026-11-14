import { z } from "zod";
import { dtoRegistry, namedSchemas, schemaId } from "./dto/registry";
import {
  ERROR_DETAILS,
  ERROR_STATUS,
  ErrorEnvelope,
  type ErrorCode,
} from "./errors";
import {
  ROUTES,
  ROUTE_SECTIONS,
  routeAuth,
  routeErrorCodes,
  routeIdempotency,
  routeParamNames,
  routeStatus,
  type RouteContract,
} from "./routes";

/**
 * OpenAPI 3.1 generator. The document is derived from the zod schemas and the
 * route table — it is never written by hand (Blueprint §18). `pnpm
 * contracts:openapi` writes it to `packages/contracts/openapi.json`.
 *
 * Schemas are rendered in their input form: like the zod parsers on both
 * sides, the wire tolerates unknown members and the parsers strip them.
 */

export type Json =
  string | number | boolean | null | Json[] | { [key: string]: Json };
export type JsonObject = { [key: string]: Json };

export const OPENAPI_VERSION = "3.1.0";
export const API_VERSION = "1.0.0";
export const SESSION_COOKIE = "__Host-mp_session";

const SCHEMA_REF = "#/components/schemas/";

function isObject(value: Json | undefined): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** zod writes a `$schema` and an `$id` on each root; a component has neither. */
function withoutRootKeywords(schema: JsonObject): JsonObject {
  const rest = { ...schema };
  delete rest["$schema"];
  delete rest["$id"];
  return rest;
}

function componentSchemas(): Record<string, JsonObject> {
  const { schemas } = z.toJSONSchema(dtoRegistry, {
    metadata: dtoRegistry,
    io: "input",
    uri: (id) => `${SCHEMA_REF}${id}`,
  });
  return Object.fromEntries(
    Object.entries(schemas as Record<string, JsonObject>)
      .map(([id, schema]) => [id, withoutRootKeywords(schema)] as const)
      .sort(([a], [b]) => a.localeCompare(b)),
  );
}

function rewriteLocalRefs(value: Json): Json {
  if (Array.isArray(value)) return value.map(rewriteLocalRefs);
  if (!isObject(value)) return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, member]) => [
      key,
      key === "$ref" && typeof member === "string"
        ? member.replace(/^#\/\$defs\//, SCHEMA_REF)
        : rewriteLocalRefs(member),
    ]),
  );
}

/** JSON Schema of any schema; named schemas become references to components. */
function schemaOf(schema: z.ZodType): JsonObject {
  const id = schemaId(schema);
  if (id !== undefined) return { $ref: `${SCHEMA_REF}${id}` };
  const converted = withoutRootKeywords(
    z.toJSONSchema(schema, {
      metadata: dtoRegistry,
      io: "input",
    }) as JsonObject,
  );
  const definitions = converted["$defs"];
  if (isObject(definitions)) {
    for (const name of Object.keys(definitions)) {
      if (!namedSchemas().has(name))
        throw new Error(`Schema uses an unnamed shared definition: ${name}`);
    }
  }
  delete converted["$defs"];
  return rewriteLocalRefs(converted) as JsonObject;
}

interface ObjectParts {
  readonly properties: Record<string, JsonObject>;
  readonly required: ReadonlySet<string>;
}

function objectParts(schema: z.ZodObject): ObjectParts {
  const converted = schemaOf(schema);
  const properties = converted["properties"];
  const required = converted["required"];
  return {
    properties: isObject(properties)
      ? (properties as Record<string, JsonObject>)
      : {},
    required: new Set(Array.isArray(required) ? (required as string[]) : []),
  };
}

function openApiPath(path: string): string {
  return path.replace(/:([A-Za-z][A-Za-z0-9]*)/g, "{$1}");
}

function parametersOf(contract: RouteContract): JsonObject[] {
  const parameters: JsonObject[] = [];
  const declared =
    contract.params === undefined ? undefined : objectParts(contract.params);
  const names = routeParamNames(contract);
  if (declared !== undefined) {
    const unknown = Object.keys(declared.properties).filter(
      (name) => !names.includes(name),
    );
    if (unknown.length > 0)
      throw new Error(
        `${contract.path}: params not in the path: ${unknown.join(", ")}`,
      );
  }
  for (const name of names) {
    parameters.push({
      name,
      in: "path",
      required: true,
      schema: declared?.properties[name] ?? { $ref: `${SCHEMA_REF}OpaqueId` },
    });
  }
  if (contract.query !== undefined) {
    const query = objectParts(contract.query);
    for (const [name, schema] of Object.entries(query.properties)) {
      parameters.push({
        name,
        in: "query",
        required: query.required.has(name),
        schema,
      });
    }
  }
  const idempotency = routeIdempotency(contract);
  if (idempotency !== "none") {
    parameters.push({
      $ref: `#/components/parameters/${
        idempotency === "required" ? "IdempotencyKeyRequired" : "IdempotencyKey"
      }`,
    });
  }
  if (contract.ifMatch === true)
    parameters.push({ $ref: "#/components/parameters/IfMatch" });
  return parameters;
}

const REQUEST_ID_HEADER: JsonObject = {
  "X-Request-Id": { $ref: "#/components/headers/RequestId" },
};

const SUCCESS_TEXT: Record<number, string> = {
  200: "OK",
  201: "Created",
  202: "Accepted",
  204: "No content",
  302: "Redirect to a signed URL",
};

function successResponse(contract: RouteContract): JsonObject {
  const status = routeStatus(contract);
  const text = SUCCESS_TEXT[status] ?? "OK";
  if (contract.stream !== undefined) {
    return {
      description: `${text}. A stream of server-sent events: ${Object.keys(contract.stream).join(", ")}.`,
      headers: REQUEST_ID_HEADER,
      content: { "text/event-stream": { schema: { type: "string" } } },
    };
  }
  if (status === 302) {
    return {
      description: text,
      headers: {
        ...REQUEST_ID_HEADER,
        Location: {
          description: "The signed URL.",
          required: true,
          schema: { type: "string" },
        },
      },
    };
  }
  if (contract.response === undefined) {
    return {
      description:
        status === 204
          ? text
          : `${text}. Blueprint v1.0 does not define a response body.`,
      headers: REQUEST_ID_HEADER,
    };
  }
  return {
    description: text,
    headers: REQUEST_ID_HEADER,
    content: { "application/json": { schema: schemaOf(contract.response) } },
  };
}

const ALL_CODES = Object.keys(ERROR_STATUS) as ErrorCode[];

function errorResponseName(codes: readonly ErrorCode[]): string {
  return `Error.${codes.join(".")}`;
}

function describeCode(code: ErrorCode): string {
  if (!Object.hasOwn(ERROR_DETAILS, code)) return code;
  const members = Object.keys(
    ERROR_DETAILS[code as keyof typeof ERROR_DETAILS].shape,
  );
  return `${code} (adds ${members.map((member) => `\`${member}\``).join(", ")})`;
}

/** The error codes of a route, grouped by HTTP status, in catalogue order. */
function errorGroups(contract: RouteContract): Map<number, ErrorCode[]> {
  const codes = new Set(routeErrorCodes(contract));
  const groups = new Map<number, ErrorCode[]>();
  for (const code of ALL_CODES) {
    if (!codes.has(code)) continue;
    const status = ERROR_STATUS[code];
    groups.set(status, [...(groups.get(status) ?? []), code]);
  }
  return groups;
}

function operationOf(
  id: string,
  contract: RouteContract,
  errorResponses: Record<string, JsonObject>,
): JsonObject {
  const responses: Record<string, JsonObject> = {
    [String(routeStatus(contract))]: successResponse(contract),
  };
  const groups = [...errorGroups(contract)].sort(([a], [b]) => a - b);
  for (const [status, codes] of groups) {
    const name = errorResponseName(codes);
    errorResponses[name] ??= {
      description: codes.map(describeCode).join(" · "),
      headers: REQUEST_ID_HEADER,
      content: {
        "application/json": { schema: schemaOf(ErrorEnvelope) },
      },
    };
    responses[String(status)] = { $ref: `#/components/responses/${name}` };
  }

  const operation: JsonObject = {
    operationId: id,
    summary: contract.summary,
    tags: [ROUTE_SECTIONS[contract.section]],
  };
  const auth = routeAuth(contract);
  if (auth === "public") operation["security"] = [];
  if (auth === "admin")
    operation["description"] =
      "Admin only: the session must belong to a user with an admin role.";
  const parameters = parametersOf(contract);
  if (parameters.length > 0) operation["parameters"] = parameters;
  if (contract.body !== undefined) {
    operation["requestBody"] = {
      required: true,
      content: { "application/json": { schema: schemaOf(contract.body) } },
    };
  }
  if (contract.stream !== undefined) {
    operation["x-sse-events"] = Object.fromEntries(
      Object.entries(contract.stream).map(([name, data]) => [
        name,
        schemaOf(data),
      ]),
    );
  }
  operation["responses"] = responses;
  return operation;
}

function collectSchemaRefs(value: Json, into: Set<string>): void {
  if (Array.isArray(value)) {
    for (const member of value) collectSchemaRefs(member, into);
    return;
  }
  if (!isObject(value)) return;
  for (const [key, member] of Object.entries(value)) {
    if (
      key === "$ref" &&
      typeof member === "string" &&
      member.startsWith(SCHEMA_REF)
    )
      into.add(member.slice(SCHEMA_REF.length));
    else collectSchemaRefs(member, into);
  }
}

/** Keeps the component schemas that the API reaches, directly or through others. */
function reachableSchemas(
  all: Record<string, JsonObject>,
  roots: Json,
): Record<string, JsonObject> {
  const reached = new Set<string>();
  const queue: string[] = [];
  const visit = (value: Json) => {
    const found = new Set<string>();
    collectSchemaRefs(value, found);
    for (const id of found) {
      if (reached.has(id)) continue;
      if (all[id] === undefined)
        throw new Error(`Reference to an unknown schema: ${id}`);
      reached.add(id);
      queue.push(id);
    }
  };
  visit(roots);
  for (let id = queue.shift(); id !== undefined; id = queue.shift())
    visit(all[id] as JsonObject);
  return Object.fromEntries(
    Object.entries(all).filter(([id]) => reached.has(id)),
  );
}

export function buildOpenApiDocument(): JsonObject {
  const paths: Record<string, JsonObject> = {};
  const errorResponses: Record<string, JsonObject> = {};
  const operationIds = new Set<string>();
  for (const [id, contract] of Object.entries(ROUTES) as [
    string,
    RouteContract,
  ][]) {
    const path = openApiPath(contract.path);
    const method = contract.method.toLowerCase();
    const item = (paths[path] ??= {});
    if (item[method] !== undefined)
      throw new Error(`Duplicate route: ${contract.method} ${contract.path}`);
    if (operationIds.has(id)) throw new Error(`Duplicate operation id: ${id}`);
    operationIds.add(id);
    item[method] = operationOf(id, contract, errorResponses);
  }

  const responses = Object.fromEntries(
    Object.entries(errorResponses).sort(([a], [b]) => a.localeCompare(b)),
  );
  const parameters: JsonObject = {
    IdempotencyKey: {
      name: "Idempotency-Key",
      in: "header",
      required: false,
      description:
        "A UUID naming this request. Sending the same key again returns the first response instead of repeating the action.",
      schema: { type: "string", format: "uuid" },
    },
    IdempotencyKeyRequired: {
      name: "Idempotency-Key",
      in: "header",
      required: true,
      description:
        "A UUID naming this request; required for offers, transitions and payments. Sending the same key again returns the first response instead of repeating the action.",
      schema: { type: "string", format: "uuid" },
    },
    IfMatch: {
      name: "If-Match",
      in: "header",
      required: true,
      description:
        'The `version` the client last read, in quotes, for example `"3"`. A mismatch answers 409 CONFLICT_VERSION.',
      schema: { type: "string", pattern: '^"\\d+"$' },
    },
  };
  const headers: JsonObject = {
    RequestId: {
      description:
        "Id of this request. Clients show it on error screens; it matches `error.request_id`.",
      schema: { type: "string" },
    },
  };

  return {
    openapi: OPENAPI_VERSION,
    info: {
      title: "LILITH by THE MIDDLE API",
      version: API_VERSION,
      description:
        "Generated from the zod schemas of `packages/contracts` (Blueprint v1.0 §18). Do not edit by hand: run `pnpm contracts:openapi`.\n\nMoney is a whole number of satang with `currency` THB, never a float. Date-times are RFC 3339 in UTC; dates are YYYY-MM-DD. Lists use cursor pagination: `{ data, next_cursor }`. Every non-2xx response is the error envelope.",
    },
    servers: [{ url: "/", description: "Same origin as the web app." }],
    tags: Object.entries(ROUTE_SECTIONS).map(([section, name]) => ({
      name,
      description: `Blueprint §${section}.`,
    })),
    security: [{ sessionCookie: [] }],
    paths,
    components: {
      schemas: reachableSchemas(componentSchemas(), {
        paths,
        responses,
      }),
      responses,
      parameters,
      headers,
      securitySchemes: {
        sessionCookie: {
          type: "apiKey",
          in: "cookie",
          name: SESSION_COOKIE,
          description: "Session cookie set by `POST /api/auth/otp/verify`.",
        },
      },
    },
  };
}

/** The document exactly as it is written to `openapi.json`. */
export function renderOpenApiDocument(): string {
  return `${JSON.stringify(buildOpenApiDocument(), null, 2)}\n`;
}
