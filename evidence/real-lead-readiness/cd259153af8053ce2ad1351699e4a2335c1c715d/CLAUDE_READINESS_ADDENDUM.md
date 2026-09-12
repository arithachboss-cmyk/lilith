# Claude architecture/governance addendum

Exact source: cd259153af8053ce2ad1351699e4a2335c1c715d

Please independently review changes after your historical 8bd0e3d7 review. Current source incorporates bee6a6e9 image-race repairs plus closed identity and mock lifecycle. Return APPROVE / REVISE / BLOCK with file/line evidence, scoped code verdict and separate real-release verdict. Do not infer actual Owner authorization or hosted proof. No production adapter is enabled; Sites public v14 was observed read-only and was not deployed or tested. Every included file below is git-show output of this exact SHA. Prior REAL_LEAD_READINESS_REPORT describes historical bee evidence, not new-source approval. No current Claude verdict is claimed.



## src/services/identity.ts
SHA-256: c7aa9d2c4993c0f836d9c2ca6d26e1337f36fdada52718070d134aa0b0b95985
```
import { env } from "cloudflare:workers";
import { z } from "zod";

const assertionSchema = z
  .object({
    id: z.string().min(1).max(200),
    email: z.email().max(254),
    method: z.string().min(1).max(10),
    url: z.url().max(2048),
    issued_at: z.number().int(),
    expires_at: z.number().int(),
  })
  .strict();

/**
 * No production identity adapter is enabled in this readiness build.
 * Unsigned oai-authenticated-* headers alone never authorize access.
 * The ephemeral signed adapter is exclusively for the loopback mock harness.
 * Sites authentication must be integrated and independently verified before
 * enabling an approved operator; a trust flag or Host check is not proof.
 */
export async function verifiedIdentity(source: Request | Headers) {
  // SSR helpers lack verified method/URL context, so they stay signed out.
  if (!(source instanceof Request)) return null;
  const config = env as typeof env & {
    MIDDLE_READINESS_MODE?: string;
    MIDDLE_MOCK_IDENTITY_KEY?: string;
  };
  const key = config.MIDDLE_MOCK_IDENTITY_KEY ?? "";
  if (config.MIDDLE_READINESS_MODE !== "mock" || !/^[a-f0-9]{64}$/.test(key))
    return null;
  const headers = source instanceof Request ? source.headers : source;
  const assertion = headers.get("x-middle-mock-identity") ?? "";
  if (assertion.length > 4096) return null;
  const parts = assertion.split(".");
  if (parts.length !== 2 || !/^[a-f0-9]{64}$/.test(parts[1])) return null;
  try {
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      Uint8Array.from(key.match(/../g)!, (v) => parseInt(v, 16)),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const valid = await crypto.subtle.verify(
      "HMAC",
      cryptoKey,
      Uint8Array.from(parts[1].match(/../g)!, (v) => parseInt(v, 16)),
      new TextEncoder().encode(parts[0]),
    );
    if (!valid) return null;
    const bytes = Uint8Array.from(
      atob(parts[0].replaceAll("-", "+").replaceAll("_", "/")),
      (c) => c.charCodeAt(0),
    );
    const identity = assertionSchema.parse(
      JSON.parse(new TextDecoder().decode(bytes)),
    );
    const url = new URL(identity.url);
    const now = Math.floor(Date.now() / 1000);
    if (
      url.protocol !== "http:" ||
      !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
      identity.issued_at > now ||
      identity.expires_at <= now ||
      identity.expires_at - identity.issued_at > 60 ||
      identity.expires_at <= identity.issued_at
    )
      return null;
    if (
      source instanceof Request &&
      (identity.url !== source.url || identity.method !== source.method)
    )
      return null;
    return { id: identity.id, email: identity.email };
  } catch {
    return null;
  }
}

```


## src/services/request-identity.ts
SHA-256: d2d3c1be92be2b2b3f0396459961a8b258fb97a14e6614371dee21fd5d37e7a7
```
import { AsyncLocalStorage } from "node:async_hooks";
import { verifiedIdentity } from "./identity";
type Identity = Awaited<ReturnType<typeof verifiedIdentity>>;
// Vinext's server-render and Worker entry can be separate module graphs.
// Share the ALS instance, never a mutable current-user value.
const key = Symbol.for("middle.readiness.request-identity");
const registry = globalThis as typeof globalThis & { [key: symbol]: unknown };
const context = (registry[key] ??=
  new AsyncLocalStorage<Identity>()) as AsyncLocalStorage<Identity>;
export const requestIdentity = () => context.getStore() ?? null;
export async function withRequestIdentity(
  request: Request,
  action: () => Promise<Response>,
) {
  const account = await verifiedIdentity(request);
  return context.run(account, action);
}

```


## worker/index.ts
SHA-256: 0fcdc3070f73bfdd9a1f7daa8588397488804908d0034421700f251aa81fabac
```
/** Cloudflare Worker entry point for the vinext-starter template. */
import {
  handleImageOptimization,
  DEFAULT_DEVICE_SIZES,
  DEFAULT_IMAGE_SIZES,
} from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";
import { withRequestIdentity } from "../src/services/request-identity";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: {
          format: string;
          quality: number;
        }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);
    // This readiness build cannot receive legacy real leads through an alternate CTA.
    // Existing production is unchanged. Keep closed until the separate pilot approval gate.
    if (
      ["/api/leads", "/api/import"].includes(url.pathname) &&
      !["GET", "HEAD"].includes(request.method)
    ) {
      return Response.json(
        {
          error:
            "NO-GO: legacy lead writes are closed in the readiness build. Use the isolated mock journey.",
        },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    if (url.pathname === "/lead-form")
      return Response.redirect(new URL("/pilot", request.url), 307);

    // Preserve the currently published listing homepage when enabling the agent backend.
    if (url.pathname === "/" || url.pathname === "/index.html") {
      return env.ASSETS.fetch(
        new Request(new URL("/current-home.html", request.url), request),
      );
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(
        request,
        {
          fetchAsset: (path) =>
            env.ASSETS.fetch(new Request(new URL(path, request.url))),
          transformImage: async (body, { width, format, quality }) => {
            const result = await env.IMAGES.input(body)
              .transform(width > 0 ? { width } : {})
              .output({ format, quality });
            return result.response();
          },
        },
        allowedWidths,
      );
    }

    return withRequestIdentity(request, () => handler.fetch(request, env, ctx));
  },
};

export default worker;

```


## app/chatgpt-auth.ts
SHA-256: d2c2f2612f2095697f1642a891b5b863edb287dca77fc4da414102bd705b1c70
```
import { requestIdentity } from "@/src/services/request-identity";
import { redirect } from "next/navigation";

export type ChatGPTUser = {
  userId: string;
  displayName: string;
  email: string;
  fullName: string | null;
};

const SIGN_IN_PATH = "/signin-with-chatgpt";
const SIGN_OUT_PATH = "/signout-with-chatgpt";
const CALLBACK_PATH = "/callback";

export async function getChatGPTUser(): Promise<ChatGPTUser | null> {
  const account = requestIdentity();
  const userId = account?.id;
  const email = account?.email;
  if (!userId || !email) return null;

  return {
    userId,
    displayName: email,
    email,
    fullName: null,
  };
}

export async function requireChatGPTUser(
  returnTo: string,
): Promise<ChatGPTUser> {
  const user = await getChatGPTUser();
  if (user) return user;

  redirect(chatGPTSignInPath(returnTo));
}

export function chatGPTSignInPath(returnTo: string): string {
  const safeReturnTo = safeRelativeReturnPath(returnTo);
  return `${SIGN_IN_PATH}?return_to=${encodeURIComponent(safeReturnTo)}`;
}

export function chatGPTSignOutPath(returnTo = "/"): string {
  const safeReturnTo = safeRelativeReturnPath(returnTo);
  return `${SIGN_OUT_PATH}?return_to=${encodeURIComponent(safeReturnTo)}`;
}

function safeRelativeReturnPath(value: string): string {
  if (!value.startsWith("/") || value.startsWith("//")) return "/";

  let url: URL;
  try {
    url = new URL(value, "https://app.local");
  } catch {
    return "/";
  }
  if (url.origin !== "https://app.local") return "/";
  if (isReservedAuthPath(url.pathname)) return "/";

  return `${url.pathname}${url.search}${url.hash}`;
}

function isReservedAuthPath(pathname: string): boolean {
  return (
    pathname === SIGN_IN_PATH ||
    pathname === SIGN_OUT_PATH ||
    pathname === CALLBACK_PATH
  );
}

```


## src/services/platform/auth.ts
SHA-256: 74f01d73bad0f48f0281048c3f36fb18a23be5de42b2116fed0867c8ad7a9d65
```
import { verifiedIdentity } from "../identity";
import {
  profileInput,
  roleSchema,
  type Actor,
  type ProfileInput,
} from "../../domain/platform/contracts";
import { audit, database, event, now, statement } from "./database";
import { ApiError } from "./http";
export async function identity(request: Request) {
  const account = await verifiedIdentity(request);
  if (!account)
    throw new ApiError(401, "UNAUTHENTICATED", "Sign in to continue");
  return account;
}
export async function findActor(id: string): Promise<Actor | null> {
  const row = await statement(
    "SELECT u.id,u.email,u.role,p.display_name AS displayName FROM mp_users u JOIN mp_profiles p ON p.user_id=u.id WHERE u.id=?",
    id,
  ).first<Actor>();
  if (row) roleSchema.parse(row.role);
  return row;
}
export async function actor(request: Request): Promise<Actor> {
  const account = await identity(request);
  const found = await findActor(account.id);
  if (!found)
    throw new ApiError(
      403,
      "PROFILE_REQUIRED",
      "Choose your role before continuing",
    );
  return found;
}
export function requireRole(account: Actor, allowed: readonly Actor["role"][]) {
  if (!allowed.includes(account.role))
    throw new ApiError(
      403,
      "FORBIDDEN",
      "Your role cannot perform this action",
    );
}
export async function saveProfile(request: Request, value: ProfileInput) {
  profileInput.parse(value);
  const account = await identity(request);
  const old = await findActor(account.id);
  if (old)
    throw new ApiError(
      409,
      "PROFILE_EXISTS",
      "Your role is already registered",
    );
  const at = now();
  try {
    await database().batch([
      statement(
        "INSERT INTO mp_users (id,email,role,created_at) VALUES (?,?,?,?)",
        account.id,
        account.email.toLowerCase(),
        value.role,
        at,
      ),
      statement(
        "INSERT INTO mp_profiles (user_id,display_name,updated_at) VALUES (?,?,?)",
        account.id,
        value.displayName,
        at,
      ),
      audit(account.id, "profile.created", account.id, { role: value.role }),
      event(
        account.id,
        "signup_started",
        account.id,
        `signup-start:${account.id}`,
      ),
      event(
        account.id,
        "signup_completed",
        account.id,
        `signup:${account.id}`,
        { role: value.role },
      ),
    ]);
  } catch (error) {
    if (await findActor(account.id))
      throw new ApiError(
        409,
        "PROFILE_EXISTS",
        "Your role is already registered",
      );
    throw error;
  }
  return findActor(account.id);
}

```


## app/api/leads/auth.ts
SHA-256: ec0906cee260c38cb92b8adeeb603d5c8e513256af8b7d35a803fb387c8430ed
```
import { verifiedIdentity } from "@/src/services/identity";
import { env } from "cloudflare:workers";

export async function isAuthenticated(request: Request) {
  // Legacy name retained for API compatibility; this is operator authorization.
  const manager = String(env.LILITH_ADMIN_EMAIL ?? "")
    .trim()
    .toLowerCase();
  const account = await verifiedIdentity(request);
  return Boolean(manager && account?.email.trim().toLowerCase() === manager);
}

export function hasImportToken(request: Request) {
  const expected = String(env.LEAD_IMPORT_TOKEN ?? "").trim();
  if (!expected) return false;

  const bearer = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "")
    .trim();
  const headerToken = request.headers.get("x-lilith-import-token")?.trim();

  return Boolean(
    (bearer && bearer === expected) ||
    (headerToken && headerToken === expected),
  );
}

export async function canImportLeads(request: Request) {
  return (await isAuthenticated(request)) || hasImportToken(request);
}

```


## app/api/leads/route.ts
SHA-256: 5b62b2e15170de05642ee38787a85713f9750f54b23c855eb0e12f4bd1b805a3
```
import { legacyLeadWritesClosed } from "@/src/domain/pilot";
import { isAuthenticated } from "./auth";
import {
  deleteTestLeads,
  ensureLeadSchema,
  insertLead,
  listLeads,
  updateLeadProgress,
} from "./storage";
import {
  monthlyBudgetRange,
  normalizeLead,
  normalizeLeadUpdate,
  purchaseBudgetRange,
  type LeadPayload,
  type LeadUpdatePayload,
} from "./validation";

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, {
    ...init,
    headers: {
      "Cache-Control": "no-store",
      ...(init?.headers ?? {}),
    },
  });
}

export async function GET(request: Request) {
  if (!(await isAuthenticated(request))) {
    return json({ error: "Sign in required" }, { status: 401 });
  }

  await ensureLeadSchema();
  const result = await listLeads();

  return json({ leads: result.results ?? [] });
}

export async function POST(request: Request) {
  if (legacyLeadWritesClosed())
    return Response.json(
      { error: "NO-GO: real lead intake is closed in this readiness build." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  await ensureLeadSchema();
  let payload: LeadPayload;
  try {
    payload = (await request.json()) as LeadPayload;
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  const lead = normalizeLead(payload, await isAuthenticated(request));

  if (lead && "spam" in lead) {
    return json({ accepted: true }, { status: 201 });
  }

  if (!lead) {
    return json(
      {
        error: `Lead must be a valid real estate brief. Rental leads need a 12-month lease and monthly budget of ฿${monthlyBudgetRange.min.toLocaleString("en-US")}-฿${monthlyBudgetRange.max.toLocaleString("en-US")}; purchase/listing leads need THB ${purchaseBudgetRange.min.toLocaleString("en-US")}+ and verified contact details.`,
      },
      { status: 422 },
    );
  }

  const result = await insertLead(lead);

  return json({ lead: result }, { status: 201 });
}

export async function PATCH(request: Request) {
  if (legacyLeadWritesClosed())
    return Response.json(
      { error: "NO-GO: real lead intake is closed in this readiness build." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  if (!(await isAuthenticated(request))) {
    return json({ error: "Sign in required" }, { status: 401 });
  }

  await ensureLeadSchema();
  let payload: LeadUpdatePayload;
  try {
    payload = (await request.json()) as LeadUpdatePayload;
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  const update = normalizeLeadUpdate(payload);
  if (!update) {
    return json({ error: "Invalid lead update" }, { status: 422 });
  }

  const result = await updateLeadProgress(update);

  if (!result) return json({ error: "Lead not found" }, { status: 404 });
  return json({ lead: result });
}

export async function DELETE(request: Request) {
  if (legacyLeadWritesClosed())
    return Response.json(
      { error: "NO-GO: real lead intake is closed in this readiness build." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  if (!(await isAuthenticated(request))) {
    return json({ error: "Sign in required" }, { status: 401 });
  }

  await ensureLeadSchema();
  const scope = new URL(request.url).searchParams.get("scope");
  if (scope !== "tests") {
    return json(
      { error: "Only test lead cleanup is supported" },
      { status: 400 },
    );
  }

  const result = await deleteTestLeads();
  return json({ deleted: result.meta?.changes ?? 0 });
}

```


## app/api/agents/storage.ts
SHA-256: 38a2be9b6db731170181cf16f4207f949aa18b6a2b6aba4ac23416a2cc886800
```
import { verifiedIdentity } from "@/src/services/identity";
import { env } from "cloudflare:workers";
import type { Listing, Member } from "./model";
export const db = () => env.DB;
export const bucket = () => env.AGENT_PHOTOS;
export async function actor(request: Request): Promise<{
  me: Member;
  manager: boolean;
} | null> {
  const account = await verifiedIdentity(request);
  const uid = account?.id;
  const email = account?.email.toLowerCase();
  if (!uid || !email) return null;
  const admin = String(env.LILITH_ADMIN_EMAIL ?? "")
    .trim()
    .toLowerCase();
  if (admin && email === admin)
    return {
      me: {
        id: "M1",
        email,
        team: "M",
        tier: 1,
        score: 0,
        note: "ผู้จัดการระบบ",
      },
      manager: true,
    };
  const me = await db()
    .prepare("SELECT * FROM agent_members WHERE email = ?")
    .bind(email)
    .first<Member>();
  return me ? { me, manager: false } : null;
}
export async function property(id: string) {
  const p = await db()
    .prepare("SELECT * FROM agent_properties WHERE id = ?")
    .bind(id)
    .first<Record<string, unknown>>();
  return p ? ({ ...p, photos: JSON.parse(String(p.photos)) } as Listing) : null;
}
export function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

```


## app/api/import/route.ts
SHA-256: a0568338932f9429e5cbe30ed431a21e1596d1f58f50d737b706611c7cebad23
```
import { legacyLeadWritesClosed } from "@/src/domain/pilot";
import { canImportLeads, isAuthenticated } from "../leads/auth";
import { ensureLeadSchema, insertLead } from "../leads/storage";
import { normalizeImportedLead, type LeadPayload } from "../leads/validation";

const MAX_IMPORT_ROWS = 500;

const fieldAliases: Record<string, keyof LeadPayload> = {
  name: "name",
  client: "name",
  clientname: "name",
  customer: "name",
  customername: "name",
  fullname: "name",
  contact: "contact",
  phone: "contact",
  mobile: "contact",
  email: "contact",
  line: "contact",
  wechat: "wechat",
  weixin: "wechat",
  source: "source",
  channel: "source",
  budget: "budget",
  budgetthb: "budget",
  monthlyrent: "budget",
  monthlyrentthb: "budget",
  purchasebudget: "budget",
  purchasebudgetthb: "budget",
  budgetperiod: "budgetPeriod",
  intent: "dealIntent",
  dealintent: "dealIntent",
  need: "dealIntent",
  country: "customerCountry",
  nationality: "customerCountry",
  customercountry: "customerCountry",
  language: "preferredLanguage",
  preferredlanguage: "preferredLanguage",
  area: "area",
  location: "area",
  zone: "area",
  propertytype: "propertyType",
  type: "propertyType",
  bedrooms: "bedrooms",
  beds: "bedrooms",
  movedate: "moveDate",
  moveindate: "moveDate",
  viewingwindow: "viewingWindow",
  viewingtime: "viewingWindow",
  contractterm: "contractTerm",
  pets: "pets",
  requirements: "requirements",
  notes: "requirements",
  partneragency: "partnerAgency",
  agency: "partnerAgency",
  partneragent: "partnerAgent",
  agent: "partnerAgent",
  partnercontact: "partnerContact",
  agentcontact: "partnerContact",
  externalid: "externalId",
  crm: "externalId",
  importbatch: "importBatch",
  客户姓名: "name",
  姓名: "name",
  电话: "contact",
  手机: "contact",
  微信: "wechat",
  预算: "budget",
  区域: "area",
  需求: "requirements",
  国家: "customerCountry",
  语言: "preferredLanguage",
  中介公司: "partnerAgency",
  中介: "partnerAgent",
};

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, {
    ...init,
    headers: {
      "Cache-Control": "no-store",
      ...(init?.headers ?? {}),
    },
  });
}

function normalizeHeader(header: string) {
  return header
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0E00-\u0E7F\u4E00-\u9FFF]+/g, "");
}

function canonicalField(header: string) {
  return fieldAliases[normalizeHeader(header)];
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"') {
      if (quoted && next === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (char === "," && !quoted) {
      row.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field);
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  row.push(field);
  if (row.some((cell) => cell.trim())) rows.push(row);
  return rows;
}

function rowsToRecords(rows: string[][]) {
  if (rows.length < 2) return [];
  const headers = rows[0].map((header) => canonicalField(header));
  return rows.slice(1).map((row) =>
    row.reduce<Record<string, string>>((record, cell, index) => {
      const field = headers[index];
      if (field) record[field] = cell.trim();
      return record;
    }, {}),
  );
}

function mapRecord(input: unknown, importBatch: string) {
  if (!input || typeof input !== "object") return null;

  const source = input as Record<string, unknown>;
  const mapped: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(source)) {
    const field = canonicalField(key) ?? (key as keyof LeadPayload);
    mapped[field] = value;
  }

  mapped.importBatch = mapped.importBatch || importBatch;
  mapped.source = mapped.source || `api_import / ${importBatch}`;
  mapped.preferredLanguage = mapped.preferredLanguage || "中文 / English";
  mapped.customerCountry = mapped.customerCountry || "China";
  mapped.dealIntent = mapped.dealIntent || "China agent referral";
  mapped.propertyType = mapped.propertyType || "Condo";
  mapped.contractTerm = mapped.contractTerm || "12 months";
  mapped.consent = true;

  if (!mapped.budgetPeriod && mapped.monthlyRent)
    mapped.budgetPeriod = "Monthly rent";
  if (!mapped.budgetPeriod && mapped.purchaseBudget)
    mapped.budgetPeriod = "Purchase budget";

  return mapped as LeadPayload;
}

async function readImportPayload(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const payload = (await request.json()) as {
      leads?: unknown;
      rows?: unknown;
    };
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.leads)) return payload.leads;
    if (Array.isArray(payload?.rows)) return payload.rows;
    return [payload];
  }

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("file");
    if (file instanceof Blob) {
      return rowsToRecords(parseCsv(await file.text()));
    }
    const pasted = String(form.get("csv") ?? "");
    return rowsToRecords(parseCsv(pasted));
  }

  const text = await request.text();
  return rowsToRecords(parseCsv(text));
}

export async function GET(request: Request) {
  if (!(await isAuthenticated(request)))
    return json(
      { error: "Authorized operator access required" },
      { status: 401 },
    );
  return json({
    endpoint: "/api/import",
    auth: "Use ChatGPT sign-in on the dashboard or send x-lilith-import-token / Bearer token after LEAD_IMPORT_TOKEN is configured.",
    formats: ["application/json", "text/csv", "multipart/form-data with file"],
    maxRows: MAX_IMPORT_ROWS,
    csvHeaders:
      "name,contact,wechat,budget,budgetPeriod,dealIntent,customerCountry,preferredLanguage,area,propertyType,bedrooms,moveDate,requirements,partnerAgency,partnerAgent,partnerContact,externalId",
    example: {
      leads: [
        {
          name: "TEST Import",
          contact: "import@example.test",
          wechat: "li-bkk-home",
          budget: 120000,
          budgetPeriod: "Monthly rent",
          dealIntent: "Rent 12-month",
          customerCountry: "China",
          preferredLanguage: "中文 / English",
          area: "Phrom Phong",
          propertyType: "Condo",
          bedrooms: 2,
          moveDate: "2026-10-01",
          requirements: "Near BTS, quiet building, invoice support",
          partnerAgency: "Shanghai Relocation Desk",
        },
      ],
    },
  });
}

export async function POST(request: Request) {
  if (legacyLeadWritesClosed())
    return Response.json(
      { error: "NO-GO: real lead intake is closed in this readiness build." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  if (!(await canImportLeads(request))) {
    return json(
      {
        error:
          "Import requires dashboard sign-in or a valid x-lilith-import-token",
      },
      { status: 401 },
    );
  }

  let incoming: unknown[];
  try {
    incoming = await readImportPayload(request);
  } catch {
    return json(
      { error: "Could not read JSON or CSV import payload" },
      { status: 400 },
    );
  }

  if (!incoming.length)
    return json({ error: "No import rows found" }, { status: 422 });
  if (incoming.length > MAX_IMPORT_ROWS) {
    return json(
      { error: `Import is limited to ${MAX_IMPORT_ROWS} rows per request` },
      { status: 413 },
    );
  }

  const importBatch = `IMPORT-${new Date().toISOString().replace(/[:.]/g, "-")}`;
  const accepted = [];
  const rejected = [];

  await ensureLeadSchema();

  for (const [index, rawRecord] of incoming.entries()) {
    const mapped = mapRecord(rawRecord, importBatch);
    const lead = mapped ? normalizeImportedLead(mapped) : null;

    if (!lead || "spam" in lead) {
      rejected.push({
        row: index + 1,
        reason: "Missing required name/contact/budget/area/property data",
      });
      continue;
    }

    try {
      const saved = await insertLead(lead);
      accepted.push(saved);
    } catch {
      rejected.push({ row: index + 1, reason: "Database insert failed" });
    }
  }

  return json(
    {
      importBatch,
      acceptedCount: accepted.length,
      rejectedCount: rejected.length,
      accepted,
      rejected,
    },
    { status: accepted.length ? 201 : 422 },
  );
}

```


## app/api/profile/route.ts
SHA-256: c74618d94d5e61580ad1f6718ce47355734dc6c985e99ed9061afec3f3ecf5c0
```
import { endpoint, input, json } from "@/src/services/platform/http";
import { findActor, identity, saveProfile } from "@/src/services/platform/auth";
import { profileInput } from "@/src/domain/platform/contracts";
export const GET = (request: Request) =>
  endpoint(async () =>
    json({ profile: await findActor((await identity(request)).id) }),
  );
export const POST = (request: Request) =>
  endpoint(async () =>
    json(await saveProfile(request, await input(request, profileInput)), 201),
  );

```


## src/services/pilot.ts
SHA-256: 2d6c6fb51b830d1a28025ae76831b27cd768efca1445517e478ec1b8d0a957c1
```
import { verifiedIdentity } from "./identity";
import { validImage } from "./pilot-image";
import { env } from "cloudflare:workers";
import { z } from "zod";
import {
  ApiError,
  input,
  assertSameOrigin,
  json,
  endpoint as httpEndpoint,
} from "./platform/http";
import {
  attributionSchema,
  eventNames,
  leadSchema,
  sessionSchema,
} from "../domain/pilot";

export { json };
export const endpoint = (action: () => Promise<Response>) =>
  httpEndpoint(async () => {
    try {
      return await action();
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("PILOT_SESSION_CLOSED")
      )
        throw new ApiError(
          410,
          "SESSION_CLOSED",
          "This test request has expired or was erased. Start again with new consent.",
        );
      throw error;
    }
  });
type Draft = {
  id: string;
  consent_version: string;
  consent_at: string;
  expires_at: string;
};
type Lead = {
  id: string;
  draft_id: string;
  payload_hash: string;
  payload: string;
  status: string;
  viewing_window: string | null;
};
type Photo = {
  id: string;
  position: number;
  content_hash: string;
  mime: string;
  content: string;
};
const settings = () =>
  env as typeof env & {
    MIDDLE_READINESS_MODE?: string;
    MIDDLE_OPERATIONS_USER_IDS?: string;
  };
export function mockOnly() {
  if (settings().MIDDLE_READINESS_MODE !== "mock")
    throw new ApiError(
      503,
      "NO_GO",
      "Real lead intake is closed. This build is for isolated mock testing only.",
    );
}
export async function hash(value: string | Uint8Array) {
  const bytes =
    typeof value === "string" ? new TextEncoder().encode(value) : value;
  const digest = await crypto.subtle.digest("SHA-256", bytes as BufferSource);
  return Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}
async function tokenHash(request: Request) {
  const token = request.headers.get("x-pilot-token") ?? "";
  if (!/^[a-f0-9]{64}$/.test(token))
    throw new ApiError(
      401,
      "SESSION_REQUIRED",
      "Start with consent to continue.",
    );
  return hash(token);
}
export async function operator(request: Request) {
  mockOnly();
  const id = (await verifiedIdentity(request))?.id;
  const ids = (settings().MIDDLE_OPERATIONS_USER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!id || !ids.includes(id))
    throw new ApiError(
      403,
      "OPERATIONS_AUTHORIZATION_REQUIRED",
      "Operations access has not been authorized for this account.",
    );
  return id;
}
export async function draft(request: Request): Promise<Draft> {
  mockOnly();
  const row = await env.DB.prepare(
    "SELECT * FROM pilot_drafts WHERE token_hash = ? AND expires_at > ?",
  )
    .bind(await tokenHash(request), new Date().toISOString())
    .first<Draft>();
  if (!row)
    throw new ApiError(
      401,
      "SESSION_EXPIRED",
      "Your session expired. Start again with consent.",
    );
  return row;
}
export async function createSession(request: Request) {
  mockOnly();
  const body = await input(request, sessionSchema);
  const token = await tokenHash(request);
  const now = new Date();
  await env.DB.prepare(
    "INSERT OR IGNORE INTO pilot_drafts (id, token_hash, consent_version, consent_at, expires_at, mock_data) VALUES (?, ?, ?, ?, ?, 1)",
  )
    .bind(
      body.draft_id,
      token,
      body.consent.version,
      now.toISOString(),
      new Date(now.getTime() + 24 * 3600000).toISOString(),
    )
    .run();
  const row = await draft(request);
  if (row.id !== body.draft_id)
    throw new ApiError(409, "SESSION_CONFLICT", "Start a new test session.");
  return json({
    draft_id: row.id,
    consent_version: row.consent_version,
    consent_at: row.consent_at,
    mock_data: true,
  });
}
async function photos(draftId: string) {
  return (
    (
      await env.DB.prepare(
        "SELECT id, position, content_hash FROM pilot_images WHERE draft_id = ? ORDER BY position, id",
      )
        .bind(draftId)
        .all<Pick<Photo, "id" | "position" | "content_hash">>()
    ).results ?? []
  );
}
export async function readDraft(request: Request) {
  const row = await draft(request);
  const lead = await env.DB.prepare(
    "SELECT * FROM pilot_leads WHERE draft_id = ?",
  )
    .bind(row.id)
    .first<Lead>();
  return json({
    draft_id: row.id,
    consent_version: row.consent_version,
    consent_at: row.consent_at,
    images: await photos(row.id),
    lead: lead
      ? {
          id: lead.id,
          ...JSON.parse(lead.payload),
          status: lead.status,
          viewing_window: lead.viewing_window,
        }
      : null,
  });
}
async function mutable(row: Draft) {
  if (
    await env.DB.prepare("SELECT id FROM pilot_leads WHERE draft_id = ?")
      .bind(row.id)
      .first()
  )
    throw new ApiError(
      409,
      "FINALIZED",
      "This request is already saved; its images cannot be changed.",
    );
}
export async function putImage(request: Request, id: string) {
  const row = await draft(request);
  assertSameOrigin(request);
  z.string().uuid().parse(id);
  const mime = request.headers.get("content-type") ?? "";
  if (!["image/png"].includes(mime))
    throw new ApiError(
      415,
      "IMAGE_TYPE",
      "Choose a synthetic non-interlaced 8-bit PNG image.",
    );
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(422, "EMPTY_IMAGE", "Choose an image.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 131072) {
        await reader.cancel();
        throw new ApiError(
          413,
          "IMAGE_SIZE",
          "Test images must be 128 KB or smaller.",
        );
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  if (!(await validImage(bytes, mime)))
    throw new ApiError(
      422,
      "INVALID_IMAGE",
      "The image file is malformed or does not match its type.",
    );
  const digest = await hash(bytes);
  const existing = await env.DB.prepare(
    "SELECT id, draft_id, content_hash FROM pilot_images WHERE id = ?",
  )
    .bind(id)
    .first<{ id: string; draft_id: string; content_hash: string }>();
  if (existing) {
    if (existing.draft_id !== row.id || existing.content_hash !== digest)
      throw new ApiError(
        409,
        "IMAGE_CONFLICT",
        "That upload ID cannot be reused.",
      );
    return json({ id, mock_data: true });
  }
  await mutable(row);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  try {
    await env.DB.prepare(
      "INSERT INTO pilot_images (id,draft_id,content_hash,mime,content,position,created_at) VALUES (?,?,?,?,?,(SELECT COUNT(*) FROM pilot_images WHERE draft_id = ?),?)",
    )
      .bind(
        id,
        row.id,
        digest,
        mime,
        btoa(binary),
        row.id,
        new Date().toISOString(),
      )
      .run();
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("PILOT_SESSION_CLOSED")
    )
      throw error;
    const saved = await env.DB.prepare(
      "SELECT id FROM pilot_images WHERE id = ? AND draft_id = ? AND content_hash = ?",
    )
      .bind(id, row.id, digest)
      .first();
    if (saved) return json({ id, mock_data: true });
    if ((await photos(row.id)).length >= 4)
      throw new ApiError(
        422,
        "IMAGE_LIMIT",
        "A request can contain at most 4 images.",
      );
    await mutable(row);
    throw new ApiError(
      503,
      "UPLOAD_FAILED",
      "The image was not saved. Retry with the same upload ID.",
    );
  }
  return json({ id, mock_data: true }, 201);
}
export async function getImage(request: Request, id: string) {
  mockOnly();
  z.string().uuid().parse(id);
  let scope: string | null = null;
  if (request.headers.has("x-pilot-token")) scope = (await draft(request)).id;
  else await operator(request);
  const row = await env.DB.prepare(
    `SELECT i.* FROM pilot_images i JOIN pilot_drafts d ON d.id=i.draft_id WHERE i.id = ? AND d.expires_at > ?${scope ? " AND i.draft_id = ?" : ""}`,
  )
    .bind(id, new Date().toISOString(), ...(scope ? [scope] : []))
    .first<Photo>();
  if (!row) throw new ApiError(404, "NOT_FOUND", "Image not found.");
  const bytes = Uint8Array.from(atob(row.content), (c) => c.charCodeAt(0));
  return new Response(bytes, {
    headers: {
      "Content-Type": row.mime,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'",
    },
  });
}
export async function changeImages(request: Request) {
  const row = await draft(request);
  await mutable(row);
  const body = await input(
    request,
    z.object({ image_ids: z.array(z.string().uuid()).max(4) }).strict(),
  );
  const current = await photos(row.id);
  if (
    new Set(body.image_ids).size !== body.image_ids.length ||
    body.image_ids.some((id) => !current.some((p) => p.id === id))
  )
    throw new ApiError(
      422,
      "INVALID_IMAGES",
      "Select only images belonging to this request.",
    );
  const statements = current
    .filter((p) => !body.image_ids.includes(p.id))
    .map((p) =>
      env.DB.prepare(
        "DELETE FROM pilot_images WHERE id = ? AND draft_id = ?",
      ).bind(p.id, row.id),
    );
  body.image_ids.forEach((id, i) =>
    statements.push(
      env.DB.prepare(
        "UPDATE pilot_images SET position = ? WHERE id = ? AND draft_id = ?",
      ).bind(i, id, row.id),
    ),
  );
  if (statements.length) await env.DB.batch(statements);
  return json({ images: await photos(row.id) });
}
export async function saveLead(request: Request) {
  const row = await draft(request);
  const body = await input(request, leadSchema);
  const payload = JSON.stringify(body);
  const digest = await hash(payload);
  const candidate = `MP-${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  // One atomic D1 transaction. UNIQUE(draft_id) is the idempotency boundary.
  await env.DB.batch([
    env.DB.prepare(
      "INSERT OR IGNORE INTO pilot_leads (id,draft_id,payload_hash,payload,created_at,mock_data) VALUES (?,?,?,?,?,1)",
    ).bind(candidate, row.id, digest, payload, now),
    env.DB.prepare(
      "INSERT OR IGNORE INTO pilot_outbox (id,lead_id,destination,status,created_at) SELECT 'notification-' || id,id,'mock://middle-property-operations','generated_mock',? FROM pilot_leads WHERE draft_id = ?",
    ).bind(now, row.id),
    env.DB.prepare(
      "INSERT OR IGNORE INTO pilot_events (id,draft_id,lead_id,name,occurred_at,attribution) SELECT 'submit-' || id,draft_id,id,'form_submit',?,? FROM pilot_leads WHERE draft_id = ?",
    ).bind(now, JSON.stringify(body.attribution), row.id),
  ]);
  const saved = await env.DB.prepare(
    "SELECT * FROM pilot_leads WHERE draft_id = ?",
  )
    .bind(row.id)
    .first<Lead>();
  if (!saved)
    throw new ApiError(503, "SAVE_FAILED", "The request was not saved. Retry.");
  if (saved.payload_hash !== digest)
    throw new ApiError(
      409,
      "ALREADY_SAVED",
      "This request was already saved with different details. Reopen the saved record.",
    );
  return json(
    {
      lead_id: saved.id,
      status: saved.status,
      mock_data: true,
      notification: "generated_mock",
      sent: false,
    },
    saved.id === candidate ? 201 : 200,
  );
}
export async function recordEvent(request: Request) {
  const row = await draft(request);
  const body = await input(
    request,
    z
      .object({
        id: z.string().uuid(),
        name: z
          .enum(eventNames)
          .exclude(["form_submit", "qualified_lead", "viewing_request"]),
        occurred_at: z.string().datetime(),
        attribution: attributionSchema,
      })
      .strict(),
  );
  await env.DB.prepare(
    "INSERT OR IGNORE INTO pilot_events (id,draft_id,lead_id,name,occurred_at,attribution) VALUES (?,?,(SELECT id FROM pilot_leads WHERE draft_id = ?),?,?,?)",
  )
    .bind(
      body.id,
      row.id,
      row.id,
      body.name,
      body.occurred_at,
      JSON.stringify(body.attribution),
    )
    .run();
  return json({ recorded: true, mock_data: true });
}
export async function inbox(request: Request) {
  await operator(request);
  const rows =
    (
      await env.DB.prepare(
        "SELECT l.*,d.consent_version,d.consent_at,o.id AS notification_id,o.destination,o.status AS notification_status FROM pilot_leads l JOIN pilot_drafts d ON d.id=l.draft_id JOIN pilot_outbox o ON o.lead_id=l.id WHERE d.expires_at > ? ORDER BY l.created_at DESC LIMIT 100",
      )
        .bind(new Date().toISOString())
        .all<Lead & Record<string, unknown>>()
    ).results ?? [];
  return json({
    leads: await Promise.all(
      rows.map(async (r) => ({
        ...r,
        payload: JSON.parse(r.payload),
        images: await photos(r.draft_id),
      })),
    ),
    delivery: "mock_only",
    owner_authorization_confirmed: false,
  });
}
export async function progress(request: Request) {
  const actor = await operator(request);
  const body = await input(
    request,
    z
      .object({
        lead_id: z
          .string()
          .uuid()
          .or(z.string().regex(/^MP-[a-f0-9-]{36}$/)),
        status: z.enum(["qualified", "viewing_ready"]),
        viewing_window: z.string().min(5).max(100).optional(),
      })
      .strict(),
  );
  const lead = await env.DB.prepare(
    "SELECT l.* FROM pilot_leads l JOIN pilot_drafts d ON d.id=l.draft_id WHERE l.id = ? AND d.expires_at > ?",
  )
    .bind(body.lead_id, new Date().toISOString())
    .first<Lead>();
  if (!lead) throw new ApiError(404, "NOT_FOUND", "Lead not found.");
  if (
    body.status === "viewing_ready" &&
    (!body.viewing_window ||
      !["qualified", "viewing_ready"].includes(lead.status))
  )
    throw new ApiError(
      422,
      "QUALIFICATION_REQUIRED",
      "Qualify the request and provide a viewing window first.",
    );
  if (lead.status === "viewing_ready" && body.status === "qualified")
    throw new ApiError(
      409,
      "INVALID_TRANSITION",
      "A viewing-ready request cannot return to qualified.",
    );
  const name =
    body.status === "qualified" ? "qualified_lead" : "viewing_request";
  await env.DB.batch([
    env.DB.prepare(
      "UPDATE pilot_leads SET status=?,viewing_window=? WHERE id=? AND status=?",
    ).bind(
      body.status,
      body.viewing_window ?? lead.viewing_window,
      lead.id,
      lead.status,
    ),
    env.DB.prepare(
      "INSERT OR IGNORE INTO pilot_events (id,draft_id,lead_id,name,occurred_at,attribution,actor_id) SELECT ?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM pilot_leads WHERE id=? AND status=?)",
    ).bind(
      `${name}-${lead.id}`,
      lead.draft_id,
      lead.id,
      name,
      new Date().toISOString(),
      JSON.stringify(JSON.parse(lead.payload).attribution),
      actor,
      lead.id,
      body.status,
    ),
  ]);
  const current = await env.DB.prepare(
    "SELECT status FROM pilot_leads WHERE id=?",
  )
    .bind(lead.id)
    .first<{ status: string }>();
  if (current?.status !== body.status)
    throw new ApiError(
      409,
      "STATUS_CHANGED",
      "The request changed. Refresh the inbox before trying again.",
    );
  // Identity is returned only to the authorized operator; no personal fields are logged.
  return json({
    lead_id: lead.id,
    status: body.status,
    actor,
    mock_data: true,
  });
}

type Closure = { draft_id: string; reason: string; closed_at: string };
async function eraseContent(
  ids: string[],
  reason: "withdrawn" | "deleted" | "expired",
) {
  if (!ids.length) return;
  const closedAt = new Date().toISOString();
  // Receipt and every related content row change in one D1 transaction.
  // Delete leads first: finalized-image triggers otherwise reject parent cascade.
  await env.DB.batch(
    ids.flatMap((id) => [
      env.DB.prepare(
        "INSERT OR IGNORE INTO pilot_closures (draft_id,token_hash,reason,closed_at,mock_data) SELECT id,token_hash,?,?,1 FROM pilot_drafts WHERE id=?",
      ).bind(reason, closedAt, id),
      env.DB.prepare(
        "DELETE FROM pilot_leads WHERE draft_id=? AND EXISTS (SELECT 1 FROM pilot_closures WHERE draft_id=?)",
      ).bind(id, id),
      env.DB.prepare(
        "DELETE FROM pilot_drafts WHERE id=? AND EXISTS (SELECT 1 FROM pilot_closures WHERE draft_id=?)",
      ).bind(id, id),
    ]),
  );
}

export async function closeSession(request: Request) {
  mockOnly();
  const body = await input(
    request,
    z
      .object({
        mock_data: z.literal(true),
        reason: z.enum(["withdrawn", "deleted"]),
      })
      .strict(),
  );
  const token = await tokenHash(request);
  const existing = await env.DB.prepare(
    "SELECT id FROM pilot_drafts WHERE token_hash=?",
  )
    .bind(token)
    .first<{ id: string }>();
  if (existing) await eraseContent([existing.id], body.reason);
  const receipt = await env.DB.prepare(
    "SELECT draft_id,reason,closed_at FROM pilot_closures WHERE token_hash=?",
  )
    .bind(token)
    .first<Closure>();
  if (!receipt)
    throw new ApiError(
      401,
      "SESSION_REQUIRED",
      "No test request belongs to this capability.",
    );
  return json({
    receipt_id: `closure-${receipt.draft_id}`,
    reason: receipt.reason,
    closed_at: receipt.closed_at,
    content_erased: true,
    mock_data: true,
  });
}

export async function expireSessions(request: Request) {
  await operator(request);
  await input(request, z.object({ mock_data: z.literal(true) }).strict());
  const due =
    (
      await env.DB.prepare(
        "SELECT id FROM pilot_drafts WHERE expires_at <= ? ORDER BY expires_at LIMIT 100",
      )
        .bind(new Date().toISOString())
        .all<{ id: string }>()
    ).results ?? [];
  await eraseContent(
    due.map((d) => d.id),
    "expired",
  );
  return json({ processed: due.length, batch_limit: 100, mock_data: true });
}

```


## src/components/pilot/journey.tsx
SHA-256: 1524ee1834b1e3e9521685017870cbd43277c0520925891e8114157c141caeef
```
"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  CONTACT,
  CONSENT_VERSION,
  locales,
  type PilotLeadInput,
} from "@/src/domain/pilot";

type Credentials = { token: string; draft_id: string };
type Picture = { id: string; url: string; file?: File; saved: boolean };
type Attribution = PilotLeadInput["attribution"];
const SESSION = "middle-property-mock-session-v1";
const TOUCH = "middle-property-mock-touch-v1";
function credentials(): Credentials {
  return {
    draft_id: crypto.randomUUID(),
    token: Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) =>
      b.toString(16).padStart(2, "0"),
    ).join(""),
  };
}
async function api(
  path: string,
  session: Credentials | null,
  options: RequestInit = {},
) {
  const response = await fetch(`/api/pilot/${path}`, {
    ...options,
    headers: {
      ...(session ? { "x-pilot-token": session.token } : {}),
      ...(options.body && typeof options.body === "string"
        ? { "content-type": "application/json" }
        : {}),
      ...options.headers,
    },
  });
  const body = (await response.json()) as {
    error?: { message?: string };
    data: {
      images: { id: string }[];
      lead: (PilotLeadInput & { id: string; status: string }) | null;
      leads: InboxLead[];
      lead_id: string;
      status: string;
    };
  };
  if (!response.ok)
    throw new Error(body.error?.message ?? "Request failed. Please retry.");
  return body.data;
}
function getTouch() {
  const params = new URLSearchParams(location.search);
  const safe = (name: string, fallback: string) => {
    const value = params.get(name) ?? fallback;
    return /^[\p{L}\p{N}_. -]{0,100}$/u.test(value) ? value : "redacted";
  };
  return {
    source: safe("utm_source", "direct"),
    medium: safe("utm_medium", "none"),
    campaign: safe("utm_campaign", "none"),
    at: new Date().toISOString(),
  };
}
export function PilotJourney() {
  const [language, setLanguage] = useState<PilotLeadInput["language"]>("th");
  const [session, setSession] = useState<Credentials | null>(null);
  const sessionRef = useRef<Credentials | null>(null);
  const [consent, setConsent] = useState(false);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const restoringRef = useRef(true);
  const [restoring, setRestoring] = useState(true);
  const imageProcessingRef = useRef(false);
  const [imageProcessing, setImageProcessing] = useState(false);
  const [pictures, setPictures] = useState<Picture[]>([]);
  const picturesRef = useRef<Picture[]>([]);
  const [active, setActive] = useState(0);
  const [lead, setLead] = useState<{ id: string; status: string } | null>(null);
  const [step, setStep] = useState<"details" | "consent">("details");
  const attribution = useRef<Attribution | null>(null);
  const events = useRef<{ id: string; name: string; occurred_at: string }[]>(
    [],
  );
  const started = useRef(false);
  const flushing = useRef<Promise<void> | null>(null);
  const form = useRef<HTMLFormElement>(null);
  const [debug, setDebug] = useState<string[]>([]);
  const th = language === "th";
  function track(name: string) {
    const event = {
      id: crypto.randomUUID(),
      name,
      occurred_at: new Date().toISOString(),
    };
    events.current.push(event);
    setDebug((old) => [...old, name]);
  }
  function flush(current: Credentials): Promise<void> {
    if (flushing.current) return flushing.current;
    const run = async () => {
      if (!attribution.current) return;
      while (
        events.current.length &&
        sessionRef.current?.token === current.token
      ) {
        const event = events.current[0];
        await api("events", current, {
          method: "POST",
          body: JSON.stringify({ ...event, attribution: attribution.current }),
        });
        events.current = events.current.filter((item) => item.id !== event.id);
      }
    };
    const pending = run().finally(() => {
      if (flushing.current === pending) flushing.current = null;
    });
    flushing.current = pending;
    return pending;
  }
  function showPictures(next: Picture[]) {
    picturesRef.current = next;
    setPictures(next);
  }
  async function reopen(current: Credentials) {
    restoringRef.current = true;
    setRestoring(true);
    const next: Picture[] = [];
    try {
      const saved = await api("draft", current);
      for (const photo of saved.images) {
        const response = await fetch(`/api/pilot/images/${photo.id}`, {
          headers: { "x-pilot-token": current.token },
        });
        if (!response.ok)
          throw new Error("An image could not be reopened. Retry reopening.");
        next.push({
          id: photo.id,
          url: URL.createObjectURL(await response.blob()),
          saved: true,
        });
      }
      picturesRef.current.forEach((p) => URL.revokeObjectURL(p.url));
      showPictures(next);
      setConsent(true);
      setStep("consent");
      if (saved.lead) {
        setLead({ id: saved.lead.id, status: saved.lead.status });
        setLanguage(saved.lead.language);
        Object.entries(saved.lead).forEach(([key, value]) => {
          const control = form.current?.elements.namedItem(key);
          if (
            control instanceof HTMLInputElement ||
            control instanceof HTMLSelectElement ||
            control instanceof HTMLTextAreaElement
          )
            control.value = String(value ?? "");
        });
      }
    } catch (error) {
      next.forEach((p) => URL.revokeObjectURL(p.url));
      throw error;
    } finally {
      restoringRef.current = false;
      setRestoring(false);
    }
  }
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const params = new URLSearchParams(location.search);
      const locale = params.get("lang");
      if (locales.includes(locale as (typeof locales)[number]))
        setLanguage(locale as (typeof locales)[number]);
      const touch = getTouch();
      let previous: Attribution | null = null;
      try {
        previous = JSON.parse(sessionStorage.getItem(TOUCH) ?? "null");
      } catch {
        /* Start fresh. */
      }
      attribution.current = {
        landing_locale: (locale &&
        locales.includes(locale as (typeof locales)[number])
          ? locale
          : "th") as (typeof locales)[number],
        first_touch: previous?.first_touch ?? touch,
        last_touch: touch,
      };
      track("page_view");
      if (params.get("channel") === "line") track("line_click");
      if (params.get("channel") === "call") track("call_click");
      let current: Credentials | null = null;
      try {
        current = JSON.parse(sessionStorage.getItem(SESSION) ?? "null");
      } catch {
        /* No stored session. */
      }
      if (current) {
        sessionRef.current = current;
        setSession(current);
        reopen(current)
          .then(() => flush(current!))
          .catch((error) => setNotice(error.message));
      } else {
        restoringRef.current = false;
        setRestoring(false);
      }
    });
    return () => {
      cancelAnimationFrame(frame);
      picturesRef.current.forEach((p) => URL.revokeObjectURL(p.url));
    };
    // Initial restoration runs once; user changes use explicit handlers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  async function addPictures(files: FileList | null) {
    if (
      !files ||
      imageProcessingRef.current ||
      busyRef.current ||
      restoringRef.current ||
      lead
    )
      return;
    const selectedFiles = Array.from(files);
    imageProcessingRef.current = true;
    setImageProcessing(true);
    try {
      if (picturesRef.current.length + selectedFiles.length > 4) {
        setNotice("Choose at most 4 images.");
        return;
      }
      if (
        selectedFiles.some(
          (f) => !["image/png"].includes(f.type) || f.size > 131072,
        )
      ) {
        setNotice(
          "Use non-interlaced 8-bit PNG test images up to 128 KB each.",
        );
        return;
      }
      for (const file of selectedFiles) {
        const bitmap = await createImageBitmap(file);
        const tooLarge = bitmap.width > 4096 || bitmap.height > 4096;
        bitmap.close();
        if (tooLarge) throw new Error();
      }
      showPictures([
        ...picturesRef.current,
        ...selectedFiles.map((file) => ({
          id: crypto.randomUUID(),
          url: URL.createObjectURL(file),
          file,
          saved: false,
        })),
      ]);
      setNotice("");
    } catch {
      setNotice(
        "This image cannot be decoded. Choose a valid test image no larger than 4096 pixels per side.",
      );
    } finally {
      imageProcessingRef.current = false;
      setImageProcessing(false);
    }
  }
  async function rearrange(index: number, remove: boolean) {
    if (
      busyRef.current ||
      imageProcessingRef.current ||
      restoringRef.current ||
      lead
    )
      return;
    imageProcessingRef.current = true;
    setImageProcessing(true);
    const next = [...picturesRef.current];
    const discarded = remove ? next.splice(index, 1)[0] : null;
    if (!remove && index > 0)
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
    try {
      if (session)
        await api("draft", session, {
          method: "PATCH",
          body: JSON.stringify({
            image_ids: next.filter((p) => p.saved).map((p) => p.id),
          }),
        });
      if (discarded) URL.revokeObjectURL(discarded.url);
      showPictures(next);
      setActive(0);
      setNotice("");
    } catch (error) {
      setNotice((error as Error).message);
    } finally {
      imageProcessingRef.current = false;
      setImageProcessing(false);
    }
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      busyRef.current ||
      imageProcessingRef.current ||
      restoringRef.current ||
      lead
    )
      return;
    if (!form.current?.reportValidity()) return;
    if (step === "details") {
      setStep("consent");
      setNotice("");
      document
        .getElementById("consent-heading")
        ?.scrollIntoView({ block: "center" });
      return;
    }
    if (!consent) {
      setNotice(
        th
          ? "กรุณายินยอมก่อนบันทึก หรือเลือกไม่ยินยอม"
          : "Accept consent to save, or choose Decline.",
      );
      return;
    }
    const values = new FormData(form.current!);
    busyRef.current = true;
    setBusy(true);
    setNotice("");
    try {
      const current = sessionRef.current ?? credentials();
      sessionRef.current = current;
      setSession(current);
      // Retain only the random capability for safe retry/reload, not form data.
      sessionStorage.setItem(SESSION, JSON.stringify(current));
      await api("session", current, {
        method: "POST",
        body: JSON.stringify({
          draft_id: current.draft_id,
          mock_data: true,
          consent: { accepted: true, version: CONSENT_VERSION },
        }),
      });
      sessionStorage.setItem(TOUCH, JSON.stringify(attribution.current));
      const previous = await api("draft", current);
      if (previous.lead) {
        await reopen(current);
        setNotice(
          "Recovered the saved Lead ID after retry. No duplicate was created.",
        );
        return;
      }
      await flush(current);
      const uploaded = [...picturesRef.current];
      for (const picture of uploaded) {
        if (!picture.saved && picture.file) {
          await api(`images/${picture.id}`, current, {
            method: "PUT",
            headers: { "content-type": picture.file.type },
            body: picture.file,
          });
          picture.saved = true;
          showPictures([...uploaded]);
        }
      }
      await api("draft", current, {
        method: "PATCH",
        body: JSON.stringify({ image_ids: uploaded.map((p) => p.id) }),
      });
      const data = {
        mock_data: true,
        name: values.get("name"),
        contact: values.get("contact"),
        category: values.get("category"),
        budget: Number(values.get("budget")),
        area: values.get("area"),
        requirements: values.get("requirements"),
        language,
        attribution: attribution.current,
      };
      const result = await api("leads", current, {
        method: "POST",
        body: JSON.stringify(data),
      });
      setLead({ id: result.lead_id, status: result.status });
      setDebug((old) => [...old, "form_submit"]);
      setNotice(
        th
          ? "บันทึกแล้ว รอทีมตรวจสอบ — การแจ้งเตือนเป็นแบบจำลอง ยังไม่ได้ส่งจริง"
          : "Saved for review. Notification generated in the mock inbox; no message was sent.",
      );
    } catch (error) {
      setNotice((error as Error).message);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  async function contact(
    event: React.MouseEvent<HTMLAnchorElement>,
    kind: "line_click" | "call_click",
  ) {
    event.preventDefault();
    if (busyRef.current || restoringRef.current) return;
    const current = sessionRef.current;
    track(kind);
    if (current)
      try {
        await flush(current);
      } catch {
        if (current !== sessionRef.current || busyRef.current) return;
        setNotice("Event retained for retry.");
      }
    if (current !== sessionRef.current || busyRef.current) return;
    setNotice(
      th
        ? "บันทึกการกดแบบทดสอบแล้ว ไม่มีการโทรหรือส่งข้อความจริง"
        : "Test click recorded. No call or external message was made.",
    );
  }
  function testDetails() {
    if (!form.current) return;
    const data = {
      name: "TEST Pilot Renter",
      contact: "pilot@example.test",
      budget: "50000",
      area: "TEST Bangkok",
      requirements: "TEST quiet synthetic request",
    };
    Object.entries(data).forEach(([key, value]) => {
      const field = form.current!.elements.namedItem(key);
      if (
        field instanceof HTMLInputElement ||
        field instanceof HTMLTextAreaElement
      )
        field.value = value;
    });
    if (!started.current) {
      started.current = true;
      track("form_start");
    }
  }
  function decline() {
    if (
      busyRef.current ||
      imageProcessingRef.current ||
      restoringRef.current ||
      lead
    )
      return;
    if (session) {
      setNotice(
        "This session already recorded consent. Start a new test to decline without saving.",
      );
      return;
    }
    setConsent(false);
    setStep("details");
    pictures.forEach((p) => URL.revokeObjectURL(p.url));
    showPictures([]);
    form.current?.reset();
    events.current = [];
    started.current = false;
    setDebug([]);
    track("page_view");
    setNotice(
      th
        ? "ไม่ยินยอม — ไม่บันทึกข้อมูลและไม่ส่งต่อ"
        : "Declined. No details or images were saved or handed off.",
    );
  }
  async function withdraw() {
    if (
      !session ||
      busyRef.current ||
      restoringRef.current ||
      imageProcessingRef.current
    )
      return;
    busyRef.current = true;
    setBusy(true);
    try {
      await api("session", session, {
        method: "DELETE",
        body: JSON.stringify({ mock_data: true, reason: "withdrawn" }),
      });
      // Clear browser state only after confirmed erasure. A lost response can retry
      // with the same capability and receive the existing closure receipt.
      sessionStorage.removeItem(SESSION);
      sessionStorage.removeItem(TOUCH);
      sessionRef.current = null;
      flushing.current = null;
      setSession(null);
      setLead(null);
      setConsent(false);
      setStep("details");
      picturesRef.current.forEach((p) => URL.revokeObjectURL(p.url));
      showPictures([]);
      form.current?.reset();
      events.current = [];
      const touch = getTouch();
      attribution.current = {
        landing_locale: attribution.current?.landing_locale ?? "th",
        first_touch: touch,
        last_touch: touch,
      };
      started.current = false;
      setDebug([]);
      setActive(0);
      track("page_view");
      setNotice(
        "Consent withdrawn. Test details, images and notification erased. A minimal closure receipt remains until test-database teardown. / ถอนความยินยอมและลบข้อมูลทดสอบแล้ว",
      );
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Erasure failed. Retry with this session.",
      );
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  return (
    <main className="pilot-shell">
      <header className="pilot-nav">
        <Link href="/">{CONTACT.brand}</Link>
        <nav aria-label="Contact">
          <a
            href={CONTACT.lineUrl}
            onClick={(e) => void contact(e, "line_click")}
          >
            LINE {CONTACT.line}
          </a>
          <a
            href={CONTACT.phoneUrl}
            onClick={(e) => void contact(e, "call_click")}
          >
            {CONTACT.phone}
          </a>
        </nav>
      </header>
      <p className="pilot-banner">
        MOCK PREVIEW · NO-GO FOR REAL LEADS · ใช้ข้อมูลจำลองเท่านั้น · Contact
        actions are simulated
      </p>
      <h1>
        {th ? "บอกเราว่าคุณกำลังมองหาอะไร" : "Tell us what you are looking for"}
      </h1>
      <p>
        {th
          ? "ส่งความต้องการให้ทีม Middle Property ตรวจสอบ ก่อนนัดชมทรัพย์"
          : "Share your requirements for the Middle Property team to review before arranging a viewing."}
      </p>
      <div className="pilot-contact">
        <a
          href={CONTACT.lineUrl}
          onClick={(e) => void contact(e, "line_click")}
        >
          Test LINE
        </a>
        <a
          href={CONTACT.phoneUrl}
          onClick={(e) => void contact(e, "call_click")}
        >
          Test call
        </a>
      </div>
      <form
        ref={form}
        onSubmit={(e) => void submit(e)}
        onChange={() => {
          if (!started.current) {
            started.current = true;
            track("form_start");
          }
        }}
      >
        <fieldset
          disabled={busy || imageProcessing || restoring || Boolean(lead)}
        >
          <legend>1. Language / ภาษาและความต้องการ</legend>
          <label>
            Preferred reply language
            <select
              aria-label="Language"
              value={language}
              onChange={(e) => setLanguage(e.target.value as typeof language)}
            >
              {locales.map((code) => (
                <option key={code} value={code}>
                  {
                    {
                      th: "ไทย",
                      en: "English",
                      zh: "中文",
                      ru: "Русский",
                      ja: "日本語",
                      ko: "한국어",
                      vi: "Tiếng Việt",
                    }[code]
                  }
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="secondary" onClick={testDetails}>
            Fill synthetic test details
          </button>
          <div className="pilot-grid">
            <label>
              Category / ประเภท
              <select name="category">
                <option value="rent">Rent / เช่า</option>
                <option value="buy">Buy / ซื้อ</option>
                <option value="list">List / ฝากทรัพย์</option>
              </select>
            </label>
            <label>
              Budget (THB) / งบประมาณ
              <input
                name="budget"
                type="number"
                min="1"
                max="500000000"
                required
              />
            </label>
            <label>
              Test name / ชื่อจำลอง
              <input
                name="name"
                placeholder="TEST Pilot Renter"
                pattern="TEST .+"
                maxLength={100}
                required
              />
            </label>
            <label>
              Test email / อีเมลจำลอง
              <input
                name="contact"
                type="email"
                placeholder="pilot@example.test"
                pattern=".+@example\.test"
                maxLength={150}
                required
              />
            </label>
            <label>
              Area / ทำเล
              <input name="area" minLength={2} maxLength={150} required />
            </label>
            <label>
              Requirements / ความต้องการ
              <textarea name="requirements" maxLength={1000} />
            </label>
          </div>
          <label>
            Test images (optional, maximum 4) / รูปจำลอง
            <input
              aria-label="Test images"
              type="file"
              accept="image/png"
              multiple
              onChange={(e) => {
                void addPictures(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
          <p>
            Non-interlaced 8-bit PNG, up to 128 KB each. Images stay in this
            browser until consent.
          </p>
        </fieldset>
        {pictures.length > 0 && (
          <section className="pilot-gallery" aria-label="Image previews">
            <p>{pictures.length} / 4 images</p>
            <div
              className="pilot-slides"
              onTouchStart={(e) => {
                e.currentTarget.dataset.touchX = String(e.touches[0].clientX);
              }}
              onTouchEnd={(e) => {
                const delta =
                  e.changedTouches[0].clientX -
                  Number(e.currentTarget.dataset.touchX);
                if (Math.abs(delta) > 35)
                  setActive((i) =>
                    Math.min(
                      pictures.length - 1,
                      Math.max(0, i + (delta < 0 ? 1 : -1)),
                    ),
                  );
              }}
            >
              {/* Blob URLs are authorized local previews; never public storage URLs. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pictures[active]?.url ?? pictures[0].url}
                alt={`Synthetic upload ${active + 1}`}
              />
            </div>
            <div className="pilot-actions">
              <button
                type="button"
                disabled={active === 0}
                onClick={() => setActive((i) => i - 1)}
              >
                Previous image
              </button>
              <span aria-live="polite">
                {active + 1} / {pictures.length}
              </span>
              <button
                type="button"
                disabled={active >= pictures.length - 1}
                onClick={() => setActive((i) => i + 1)}
              >
                Next image
              </button>
            </div>
            {
              <ol>
                {pictures.map((p, i) => (
                  <li key={p.id}>
                    Image {i + 1} · {p.saved ? "Uploaded" : "Preview only"}{" "}
                    <button
                      type="button"
                      disabled={
                        busy || imageProcessing || restoring || Boolean(lead)
                      }
                      onClick={() => void rearrange(i, true)}
                    >
                      Remove image {i + 1}
                    </button>{" "}
                    <button
                      type="button"
                      disabled={
                        i === 0 ||
                        busy ||
                        imageProcessing ||
                        restoring ||
                        Boolean(lead)
                      }
                      onClick={() => void rearrange(i, false)}
                    >
                      Move image {i + 1} left
                    </button>
                  </li>
                ))}
              </ol>
            }
          </section>
        )}
        {step === "consent" && (
          <section className="pilot-consent" aria-labelledby="consent-heading">
            <h2 id="consent-heading">
              2. Notice and consent / ข้อตกลงและความยินยอม
            </h2>
            {/* Scrollable policy region must be reachable by keyboard. */}
            <div
              className="pilot-consent-copy"
              // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
              tabIndex={0}
              role="region"
              aria-label="Consent details"
            >
              <p>
                การรับคำขอไม่รับประกันทรัพย์ว่าง ราคา การจอง ผลลัพธ์
                หรือเวลาตอบกลับ ทีมต้องตรวจสอบก่อนนัดชม
              </p>
              <p>
                Submitting a request does not guarantee availability, price, a
                reservation, results or response time. The team must review it
                first.
              </p>
              <p>
                Middle Property จะเก็บชื่อ ช่องทางติดต่อ ความต้องการ รูปที่แนบ
                และแหล่งที่มาของคำขอ เพื่อให้ทีม Operations
                ตรวจสอบและติดต่อกลับตามความยินยอม
              </p>
              <p>
                Middle Property will store your name, contact, requirements,
                selected images and campaign attribution for authorized
                Operations staff to review and follow up. This preview accepts
                synthetic test information only. Notifications stay in the mock
                inbox.
              </p>
              <p>
                ก่อนยินยอม ข้อมูลและรูปที่เลือกจะอยู่ในหน้านี้เท่านั้น
                คุณสามารถไม่ยินยอมและออกจากขั้นตอนได้ ไม่มีการบันทึก Lead
              </p>
              <p>
                Before acceptance, details and images remain in this page only.
                Decline clears the unsaved draft. Test sessions expire after 24
                hours. Expired content is hidden immediately and erased by the
                maintenance sweep in the local test server. You can withdraw consent
                and erase test details and images after saving. A minimal
                receipt keeps the request from being recreated by retries; the
                entire isolated test database is removed when the server stops.
              </p>
            </div>
            <label className="pilot-check">
              <input
                type="checkbox"
                checked={consent}
                disabled={
                  busy || restoring || Boolean(lead) || Boolean(session)
                }
                onChange={(e) => setConsent(e.target.checked)}
              />
              I accept / ฉันยินยอมให้บันทึกข้อมูลตามรายละเอียดข้างต้น
            </label>
            {
              <button
                type="button"
                className="secondary"
                disabled={
                  busy ||
                  imageProcessing ||
                  restoring ||
                  Boolean(session) ||
                  Boolean(lead)
                }
                onClick={decline}
              >
                Decline / ไม่ยินยอม
              </button>
            }
          </section>
        )}
        {
          <button
            className="pilot-submit"
            type="submit"
            disabled={busy || imageProcessing || restoring || Boolean(lead)}
          >
            {lead
              ? "Saved / บันทึกแล้ว"
              : busy
                ? "Saving… / กำลังบันทึก"
                : step === "details"
                  ? "Review consent / อ่านข้อตกลง"
                  : "Save test request / บันทึกคำขอจำลอง"}
          </button>
        }
      </form>
      <p className="pilot-status" role="status" aria-live="polite">
        {restoring
          ? "Restoring saved request and images… / กำลังเปิดข้อมูลและรูปที่บันทึก"
          : notice}
      </p>
      {lead && (
        <section className="pilot-result">
          <h2>Request saved / บันทึกคำขอแล้ว</h2>
          <p>
            Lead ID: <strong data-testid="lead-id">{lead.id}</strong>
          </p>
          <p>Status: {lead.status}</p>
          <p>Notification: generated_mock · sent: false</p>
        </section>
      )}
      {session && (
        <button
          className="secondary"
          disabled={busy || imageProcessing || restoring}
          onClick={() => {
            if (
              busyRef.current ||
              imageProcessingRef.current ||
              restoringRef.current
            )
              return;
            void reopen(session).catch((error) => setNotice(error.message));
          }}
        >
          Reopen saved request
        </button>
      )}
      {session && (
        <button
          className="secondary"
          disabled={busy || imageProcessing || restoring}
          onClick={() => void withdraw()}
        >
          Withdraw consent and delete test data / ถอนความยินยอมและลบข้อมูลทดสอบ
        </button>
      )}
      <button
        className="secondary"
        disabled={busy || imageProcessing || restoring}
        onClick={() => {
          if (
            busyRef.current ||
            imageProcessingRef.current ||
            restoringRef.current
          )
            return;
          sessionStorage.removeItem(SESSION);
          location.reload();
        }}
      >
        Start a new mock request
      </button>
      <details>
        <summary>Test event log (no personal data)</summary>
        <output>{debug.join(" → ")}</output>
        <p>Build SHA: {__READINESS_BUILD_SHA__}</p>
      </details>
      <section id="contact">
        <h2>Contact / ติดต่อ</h2>
        <p>{CONTACT.brand}</p>
        <a
          href={CONTACT.lineUrl}
          onClick={(e) => void contact(e, "line_click")}
        >
          {CONTACT.line}
        </a>{" "}
        ·{" "}
        <a
          href={CONTACT.phoneUrl}
          onClick={(e) => void contact(e, "call_click")}
        >
          {CONTACT.phone}
        </a>
      </section>
      <footer>
        {CONTACT.brand} ·{" "}
        <a
          href={CONTACT.lineUrl}
          onClick={(e) => void contact(e, "line_click")}
        >
          LINE {CONTACT.line}
        </a>{" "}
        ·{" "}
        <a
          href={CONTACT.phoneUrl}
          onClick={(e) => void contact(e, "call_click")}
        >
          {CONTACT.phone}
        </a>{" "}
        · <a href="/pilot/inbox">Operations Inbox</a>
      </footer>
      <nav className="pilot-sticky" aria-label="Mobile contact">
        <a
          href={CONTACT.lineUrl}
          onClick={(e) => void contact(e, "line_click")}
        >
          Test LINE
        </a>
        <a
          href={CONTACT.phoneUrl}
          onClick={(e) => void contact(e, "call_click")}
        >
          Test call
        </a>
      </nav>
    </main>
  );
}

type InboxLead = {
  id: string;
  status: string;
  consent_at: string;
  consent_version: string;
  notification_id: string;
  destination: string;
  notification_status: string;
  payload: PilotLeadInput;
  images: { id: string }[];
};
export function PilotInbox() {
  const [leads, setLeads] = useState<InboxLead[]>([]);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [window, setWindow] = useState("");
  async function refresh() {
    try {
      const result = await api("inbox", null);
      setLeads(result.leads);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    api("inbox", null)
      .then((result) => setLeads(result.leads))
      .catch((error) => setError(error.message));
  }, []);
  async function update(
    lead: InboxLead,
    status: "qualified" | "viewing_ready",
  ) {
    try {
      await api("inbox", null, {
        method: "PATCH",
        body: JSON.stringify({
          lead_id: lead.id,
          status,
          ...(status === "viewing_ready" ? { viewing_window: window } : {}),
        }),
      });
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <main className="pilot-shell">
      <header className="pilot-nav">
        <a href="/pilot">Middle Property</a>
      </header>
      <p className="pilot-banner">
        MOCK OPERATIONS · Real destination authorization pending
      </p>
      <h1>Operations Inbox</h1>
      <button onClick={() => void refresh()}>Refresh inbox</button>
      <p role="alert">{error}</p>
      {leads.map((lead) => (
        <article className="pilot-result" key={lead.id}>
          <button onClick={() => setSelected(lead.id)}>{lead.id}</button>
          <p>{lead.status}</p>
          {selected === lead.id && (
            <>
              <h2>{lead.payload.name}</h2>
              <p>
                {lead.payload.contact} · {lead.payload.area} · THB{" "}
                {lead.payload.budget}
              </p>
              <p>
                Consent: {lead.consent_version} / {lead.consent_at}
              </p>
              <p>
                Notification: {lead.notification_id} → {lead.destination} (
                {lead.notification_status})
              </p>
              <p>Images: {lead.images.length}</p>
              <div className="pilot-inbox-images">
                {lead.images.map((p, i) => (
                  // Private authenticated images must bypass public image optimization.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={p.id}
                    src={`/api/pilot/images/${p.id}`}
                    alt={`Request attachment ${i + 1}`}
                  />
                ))}
              </div>
              <p>
                Attribution: {lead.payload.attribution.first_touch.source} /{" "}
                {lead.payload.attribution.last_touch.campaign}
              </p>
              {lead.status === "pending_review" && (
                <button onClick={() => void update(lead, "qualified")}>
                  Qualify test lead
                </button>
              )}
              {lead.status === "qualified" && (
                <>
                  <label>
                    Viewing window
                    <input
                      value={window}
                      onChange={(e) => setWindow(e.target.value)}
                      placeholder="TEST 2026-10-01 14:00"
                    />
                  </label>
                  <button onClick={() => void update(lead, "viewing_ready")}>
                    Mark viewing-ready
                  </button>
                </>
              )}
            </>
          )}
        </article>
      ))}
    </main>
  );
}

```


## drizzle/0008_readiness.sql
SHA-256: 3e938871cabc1aac8d63af3e9d98b097ee54ada03ced627b166c08acfbde0b3a
```
CREATE TABLE pilot_drafts (
 id TEXT PRIMARY KEY, token_hash TEXT NOT NULL UNIQUE,
 consent_version TEXT NOT NULL, consent_at TEXT NOT NULL,
 expires_at TEXT NOT NULL, mock_data INTEGER NOT NULL CHECK(mock_data = 1)
);
CREATE TABLE pilot_leads (
 id TEXT PRIMARY KEY, draft_id TEXT NOT NULL UNIQUE REFERENCES pilot_drafts(id) ON DELETE CASCADE,
 payload_hash TEXT NOT NULL, payload TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending_review' CHECK(status IN ('pending_review','qualified','viewing_ready')),
 viewing_window TEXT, created_at TEXT NOT NULL,
 mock_data INTEGER NOT NULL CHECK(mock_data = 1)
);
CREATE TABLE pilot_images (
 id TEXT PRIMARY KEY, draft_id TEXT NOT NULL REFERENCES pilot_drafts(id) ON DELETE CASCADE,
 content_hash TEXT NOT NULL, mime TEXT NOT NULL, content TEXT NOT NULL,
 position INTEGER NOT NULL CHECK(position >= 0 AND position < 4),
 created_at TEXT NOT NULL
);
CREATE TRIGGER pilot_image_cap BEFORE INSERT ON pilot_images
WHEN (SELECT COUNT(*) FROM pilot_images WHERE draft_id = NEW.draft_id) >= 4
 AND NOT EXISTS (SELECT 1 FROM pilot_images WHERE id = NEW.id)
BEGIN SELECT RAISE(ABORT, 'PILOT_IMAGE_LIMIT'); END;
CREATE TRIGGER pilot_images_immutable_insert BEFORE INSERT ON pilot_images
WHEN EXISTS (SELECT 1 FROM pilot_leads WHERE draft_id = NEW.draft_id)
BEGIN SELECT RAISE(ABORT, 'PILOT_LEAD_FINALIZED'); END;
CREATE TRIGGER pilot_images_immutable_update BEFORE UPDATE ON pilot_images
WHEN EXISTS (SELECT 1 FROM pilot_leads WHERE draft_id = OLD.draft_id)
BEGIN SELECT RAISE(ABORT, 'PILOT_LEAD_FINALIZED'); END;
CREATE TRIGGER pilot_images_immutable_delete BEFORE DELETE ON pilot_images
WHEN EXISTS (SELECT 1 FROM pilot_leads WHERE draft_id = OLD.draft_id)
BEGIN SELECT RAISE(ABORT, 'PILOT_LEAD_FINALIZED'); END;
CREATE TABLE pilot_outbox (
 id TEXT PRIMARY KEY, lead_id TEXT NOT NULL UNIQUE REFERENCES pilot_leads(id) ON DELETE CASCADE,
 destination TEXT NOT NULL CHECK(destination = 'mock://middle-property-operations'),
 status TEXT NOT NULL CHECK(status = 'generated_mock'), created_at TEXT NOT NULL
);
CREATE TABLE pilot_events (
 id TEXT PRIMARY KEY, draft_id TEXT NOT NULL REFERENCES pilot_drafts(id) ON DELETE CASCADE,
 lead_id TEXT REFERENCES pilot_leads(id) ON DELETE CASCADE,
 name TEXT NOT NULL CHECK(name IN ('page_view','form_start','form_submit','line_click','call_click','qualified_lead','viewing_request')),
 occurred_at TEXT NOT NULL, attribution TEXT NOT NULL, actor_id TEXT
);

CREATE TRIGGER pilot_status_no_downgrade BEFORE UPDATE OF status ON pilot_leads
WHEN OLD.status = 'viewing_ready' AND NEW.status != 'viewing_ready'
BEGIN SELECT RAISE(ABORT, 'PILOT_STATUS_CONFLICT'); END;

```


## drizzle/0009_pilot_lifecycle.sql
SHA-256: e6f471e3ee0d69692f25fd2b8fa036d6b8fe0219b7c3b2918cb0882a0a1efd01
```
-- Mock-only terminal receipts contain no form, image, contact or attribution data.
-- Keep them until isolated test-namespace teardown to prevent replay resurrection.
CREATE TABLE pilot_closures (
 draft_id TEXT PRIMARY KEY, token_hash TEXT NOT NULL UNIQUE,
 reason TEXT NOT NULL CHECK(reason IN ('withdrawn','deleted','expired')),
 closed_at TEXT NOT NULL, mock_data INTEGER NOT NULL CHECK(mock_data = 1)
);
CREATE INDEX pilot_drafts_expiry ON pilot_drafts(expires_at);
CREATE TRIGGER pilot_no_recreated_session BEFORE INSERT ON pilot_drafts
WHEN EXISTS (SELECT 1 FROM pilot_closures WHERE draft_id=NEW.id OR token_hash=NEW.token_hash)
BEGIN SELECT RAISE(ABORT, 'PILOT_SESSION_CLOSED'); END;
CREATE TRIGGER pilot_active_lead_insert BEFORE INSERT ON pilot_leads
WHEN NOT EXISTS (SELECT 1 FROM pilot_drafts WHERE id=NEW.draft_id AND expires_at > strftime('%Y-%m-%dT%H:%M:%fZ','now'))
BEGIN SELECT RAISE(ABORT, 'PILOT_SESSION_CLOSED'); END;
CREATE TRIGGER pilot_active_lead_update BEFORE UPDATE ON pilot_leads
WHEN NOT EXISTS (SELECT 1 FROM pilot_drafts WHERE id=NEW.draft_id AND expires_at > strftime('%Y-%m-%dT%H:%M:%fZ','now'))
BEGIN SELECT RAISE(ABORT, 'PILOT_SESSION_CLOSED'); END;
CREATE TRIGGER pilot_active_image_insert BEFORE INSERT ON pilot_images
WHEN NOT EXISTS (SELECT 1 FROM pilot_drafts WHERE id=NEW.draft_id AND expires_at > strftime('%Y-%m-%dT%H:%M:%fZ','now'))
BEGIN SELECT RAISE(ABORT, 'PILOT_SESSION_CLOSED'); END;
CREATE TRIGGER pilot_active_image_update BEFORE UPDATE ON pilot_images
WHEN NOT EXISTS (SELECT 1 FROM pilot_drafts WHERE id=NEW.draft_id AND expires_at > strftime('%Y-%m-%dT%H:%M:%fZ','now'))
BEGIN SELECT RAISE(ABORT, 'PILOT_SESSION_CLOSED'); END;
CREATE TRIGGER pilot_active_event_insert BEFORE INSERT ON pilot_events
WHEN NOT EXISTS (SELECT 1 FROM pilot_drafts WHERE id=NEW.draft_id AND expires_at > strftime('%Y-%m-%dT%H:%M:%fZ','now'))
BEGIN SELECT RAISE(ABORT, 'PILOT_SESSION_CLOSED'); END;

```


## tests/helpers/worker.mjs
SHA-256: 6e3a7b7be2a1c72039c60b569b65c630ea0130ea3558d982beaf4cbb1e458e36
```
import { createHmac, randomBytes } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { registerHooks } from "node:module";
import { readFileSync } from "node:fs";

// Test-only binding adapter. The product still executes the compiled Worker, SQL,
// authorization, transactions, and the same migrations used in deployment.
export async function createWorkerHarness(filename = ":memory:") {
  const sqlite = new DatabaseSync(filename);
  sqlite.exec("PRAGMA foreign_keys = ON");
  const journal = JSON.parse(
    readFileSync(
      new URL("../../drizzle/meta/_journal.json", import.meta.url),
      "utf8",
    ),
  );
  sqlite.exec(
    "CREATE TABLE IF NOT EXISTS __test_migrations (tag TEXT PRIMARY KEY)",
  );
  for (const migration of journal.entries) {
    if (
      sqlite
        .prepare("SELECT tag FROM __test_migrations WHERE tag=?")
        .get(migration.tag)
    )
      continue;
    sqlite.exec(
      readFileSync(
        new URL(`../../drizzle/${migration.tag}.sql`, import.meta.url),
        "utf8",
      ),
    );
    sqlite
      .prepare("INSERT INTO __test_migrations(tag) VALUES (?)")
      .run(migration.tag);
  }
  let failBatchContaining = null;
  let heldRun = null;
  const DB = {
    prepare(sql) {
      let params = [];
      return {
        sql,
        bind(...values) {
          params = values;
          return this;
        },
        async first() {
          return sqlite.prepare(sql).get(...params) ?? null;
        },
        async all() {
          return { results: sqlite.prepare(sql).all(...params), success: true };
        },
        async run() {
          if (heldRun && sql.includes(heldRun.sql)) {
            const hold = heldRun;
            heldRun = null;
            hold.started();
            await hold.wait;
          }
          return this.runSync();
        },
        runSync() {
          const result = sqlite.prepare(sql).run(...params);
          return {
            results: [],
            success: true,
            meta: {
              changes: Number(result.changes),
              last_row_id: Number(result.lastInsertRowid),
            },
          };
        },
      };
    },
    async batch(statements) {
      sqlite.exec("BEGIN");
      try {
        const output = [];
        for (const statement of statements) {
          if (
            failBatchContaining &&
            statement.sql.includes(failBatchContaining)
          ) {
            failBatchContaining = null;
            throw new Error("TEST injected transaction failure");
          }
          output.push(statement.runSync());
        }
        sqlite.exec("COMMIT");
        return output;
      } catch (error) {
        sqlite.exec("ROLLBACK");
        throw error;
      }
    },
  };
  // D1 executes batches serially. Serialize batches in the adapter to model that
  // guarantee while allowing pre-transaction reads from concurrent requests.
  const rawBatch = DB.batch.bind(DB);
  let queue = Promise.resolve();
  DB.batch = (statements) => {
    const result = queue.then(() => rawBatch(statements));
    queue = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  };
  globalThis.__middleTestEnv ??= {};
  Object.assign(globalThis.__middleTestEnv, {
    DB,
    LILITH_ADMIN_EMAIL: "TEST-manager@example.test",
    MIDDLE_READINESS_MODE: "mock",
    MIDDLE_OPERATIONS_USER_IDS: "TEST-operations",
    MIDDLE_MOCK_IDENTITY_KEY: randomBytes(32).toString("hex"),
  });
  registerHooks({
    resolve(specifier, context, next) {
      if (specifier === "cloudflare:workers")
        return {
          url: "data:text/javascript,export const env = globalThis.__middleTestEnv",
          shortCircuit: true,
        };
      return next(specifier, context);
    },
  });
  const { default: worker } = await import("../../dist/server/index.js");
  const workerEnv = {
    ...globalThis.__middleTestEnv,
    ASSETS: { fetch: () => new Response("Not found", { status: 404 }) },
  };
  const dispatch = (request) =>
    worker.fetch(request, workerEnv, {
      waitUntil() {},
      passThroughOnException() {},
    });
  function signMock(request, account, overrides = {}) {
    const issued_at = Math.floor(Date.now() / 1000);
    const payload = Buffer.from(
      JSON.stringify({
        id: account.id,
        email: account.email,
        method: request.method,
        url: request.url,
        issued_at,
        expires_at: issued_at + 60,
        ...overrides,
      }),
    ).toString("base64url");
    const signature = createHmac(
      "sha256",
      Buffer.from(globalThis.__middleTestEnv.MIDDLE_MOCK_IDENTITY_KEY, "hex"),
    )
      .update(payload)
      .digest("hex");
    const headers = new Headers(request.headers);
    headers.set("x-middle-mock-identity", `${payload}.${signature}`);
    return new Request(request, { headers });
  }
  // Deliberately trusted local simulation. Never use this for spoof-negative tests.
  const dispatchMock = (request) => {
    const id = request.headers.get("oai-authenticated-user-id");
    const email = request.headers.get("oai-authenticated-user-email");
    return dispatch(id && email ? signMock(request, { id, email }) : request);
  };
  async function call(path, account, body, options = {}) {
    const headers = {
      ...(account
        ? {
            "oai-authenticated-user-id": account.id,
            "oai-authenticated-user-email": account.email,
          }
        : {}),
      ...(body !== undefined
        ? { origin: "http://localhost", "content-type": "application/json" }
        : {}),
      ...options.headers,
    };
    const request = new Request("http://localhost" + path, {
      method: options.method ?? (body !== undefined ? "POST" : "GET"),
      headers,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    return dispatch(account ? signMock(request, account) : request);
  }
  return {
    sqlite,
    DB,
    setAssetFetcher: (fetcher) => {
      workerEnv.ASSETS.fetch = fetcher;
    },
    dispatch,
    dispatchMock,
    signMock,
    call,
    injectFailure: (text) => {
      failBatchContaining = text;
    },
    holdNextRun: (sql) => {
      let started, release;
      const paused = new Promise((resolve) => {
        started = resolve;
      });
      const wait = new Promise((resolve) => {
        release = resolve;
      });
      heldRun = { sql, started, wait };
      return { paused, release };
    },
    close: () => sqlite.close(),
  };
}

```


## tests/identity.test.mjs
SHA-256: d9f97d51c2f223b1d8f4954e7852c604073eb5fcb9405ec422d0c8ae5665ed83
```
import test from "node:test";
import assert from "node:assert/strict";
import { createWorkerHarness } from "./helpers/worker.mjs";
let h;
const operator = { id: "TEST-operations", email: "TEST-manager@example.test" };
test.before(async () => {
  h = await createWorkerHarness();
});
test.after(() => h.close());
const raw = (path, options = {}) =>
  new Request(`http://localhost${path}`, {
    headers: {
      "oai-authenticated-user-id": operator.id,
      "oai-authenticated-user-email": operator.email,
    },
    ...options,
  });
test("P0-07 forged identity headers deny every API identity boundary and private image access", async () => {
  for (const path of [
    "/api/pilot/inbox",
    `/api/pilot/images/${crypto.randomUUID()}`,
    "/api/profile",
    "/api/discover",
    "/api/leads",
    "/api/import",
    "/api/agents",
    "/api/agents/photos",
  ]) {
    const response = await h.dispatch(raw(path));
    assert.ok(
      [401, 403].includes(response.status),
      `${path}: ${response.status}`,
    );
    assert.doesNotMatch(
      await response.text(),
      /csvHeaders|maxRows|TEST-manager/,
    );
  }
});
test("P0-07 signatures reject changed identity, URL, method, expiry and non-loopback origins", async () => {
  const request = raw("/api/pilot/inbox");
  assert.equal((await h.dispatch(h.signMock(request, operator))).status, 200);
  const now = Math.floor(Date.now() / 1000);
  for (const claims of [
    { method: "PATCH" },
    { url: "http://localhost/api/profile" },
    { issued_at: now - 120, expires_at: now - 60 },
    { issued_at: now + 60, expires_at: now + 120 },
    { issued_at: now, expires_at: now + 3600 },
  ])
    assert.equal(
      (await h.dispatch(h.signMock(request, operator, claims))).status,
      403,
    );
  const signed = h.signMock(request, operator);
  const assertion = signed.headers.get("x-middle-mock-identity");
  const [claims, signature] = assertion.split(".");
  const altered = Buffer.from(
    JSON.stringify({
      ...JSON.parse(Buffer.from(claims, "base64url")),
      id: "TEST-forged",
    }),
  ).toString("base64url");
  for (const value of [
    `${altered}.${signature}`,
    `${claims}.${"0".repeat(64)}`,
    "malformed",
  ]) {
    const headers = new Headers(request.headers);
    headers.set("x-middle-mock-identity", value);
    assert.equal(
      (await h.dispatch(new Request(request, { headers }))).status,
      403,
    );
  }
  const external = new Request("https://untrusted.invalid/api/pilot/inbox");
  assert.equal((await h.dispatch(h.signMock(external, operator))).status, 403);
});
test("P0-07 mock mode or an allowlist never substitutes for a valid server-only identity key", async () => {
  const request = h.signMock(raw("/api/pilot/inbox"), operator);
  const key = globalThis.__middleTestEnv.MIDDLE_MOCK_IDENTITY_KEY;
  try {
    delete globalThis.__middleTestEnv.MIDDLE_MOCK_IDENTITY_KEY;
    assert.equal((await h.dispatch(request)).status, 403);
    globalThis.__middleTestEnv.MIDDLE_MOCK_IDENTITY_KEY = "f".repeat(64);
    assert.equal((await h.dispatch(request)).status, 403);
    globalThis.__middleTestEnv.MIDDLE_MOCK_IDENTITY_KEY = key;
    globalThis.__middleTestEnv.MIDDLE_READINESS_MODE = "real";
    assert.equal(
      (await h.dispatch(h.signMock(raw("/api/profile"), operator))).status,
      401,
    );
  } finally {
    globalThis.__middleTestEnv.MIDDLE_MOCK_IDENTITY_KEY = key;
    globalThis.__middleTestEnv.MIDDLE_READINESS_MODE = "mock";
  }
});
test("P0-07 SSR identity is verified at Worker ingress and isolated across concurrent requests", async () => {
  const responses = await Promise.all(
    Array.from({ length: 8 }, (_, i) => {
      const request = raw("/agents");
      return h.dispatch(i % 2 ? request : h.signMock(request, operator));
    }),
  );
  for (const [i, response] of responses.entries()) {
    assert.equal(response.status, i % 2 ? 307 : 200);
    if (i % 2)
      assert.match(response.headers.get("location"), /signin-with-chatgpt/);
    await response.text();
  }
});

test("P0-07 signed outsider cannot promote raw headers; forged writes change no rows", async () => {
  const outsider = { id: "TEST-outsider", email: "outsider@example.test" };
  assert.equal(
    (await h.dispatch(h.signMock(raw("/api/pilot/inbox"), outsider))).status,
    403,
  );
  assert.equal(
    (await h.dispatch(h.signMock(raw("/api/leads"), outsider))).status,
    401,
  );
  for (const [path, method, body, table] of [
    ["/api/pilot/maintenance", "POST", { mock_data: true }, "pilot_closures"],
    [
      "/api/pilot/inbox",
      "PATCH",
      { lead_id: `MP-${crypto.randomUUID()}`, status: "qualified" },
      "pilot_events",
    ],
    [
      "/api/profile",
      "POST",
      { role: "OWNER", displayName: "TEST forged" },
      "mp_users",
    ],
  ]) {
    const before = h.sqlite.prepare(`SELECT COUNT(*) n FROM ${table}`).get().n;
    const request = raw(path, {
      method,
      headers: {
        "oai-authenticated-user-id": operator.id,
        "oai-authenticated-user-email": operator.email,
        origin: "http://localhost",
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });
    assert.ok([401, 403].includes((await h.dispatch(request)).status));
    assert.equal(
      h.sqlite.prepare(`SELECT COUNT(*) n FROM ${table}`).get().n,
      before,
    );
  }
});

```


## tests/pilot.test.mjs
SHA-256: cba50ddd58956392adfadde7548ba5f1d08147c3ac7e9e68ecc2dee67c6f70a7
```
import { syntheticPng } from "./helpers/synthetic-image.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createWorkerHarness } from "./helpers/worker.mjs";

const directory = mkdtempSync(join(tmpdir(), "middle-readiness-"));
const file = join(directory, "mock.sqlite");
let h;
const operator = { id: "TEST-operations", email: "operations@example.test" };
const attribution = {
  landing_locale: "th",
  first_touch: {
    source: "test_first",
    medium: "organic",
    campaign: "test_pilot",
    at: "2026-09-13T00:00:00.000Z",
  },
  last_touch: {
    source: "test_last",
    medium: "direct",
    campaign: "test_return",
    at: "2026-09-13T01:00:00.000Z",
  },
};
const payload = () => ({
  mock_data: true,
  name: "TEST Pilot Renter",
  contact: "pilot@example.test",
  category: "rent",
  language: "th",
  budget: 50000,
  area: "TEST Bangkok",
  requirements: "TEST synthetic requirements",
  attribution,
});
const png = syntheticPng();
const count = (table) =>
  h.sqlite.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n;
async function data(response) {
  return (await response.json()).data;
}
async function session() {
  const s = {
    token:
      crypto.randomUUID().replaceAll("-", "") +
      crypto.randomUUID().replaceAll("-", ""),
    draft_id: crypto.randomUUID(),
  };
  const response = await h.call(
    "/api/pilot/session",
    null,
    {
      draft_id: s.draft_id,
      mock_data: true,
      consent: { accepted: true, version: "middle-property-2026-09-13-v1" },
    },
    { headers: { "x-pilot-token": s.token } },
  );
  assert.equal(response.status, 200);
  return s;
}
const call = (s, path, body, options = {}) =>
  h.call(`/api/pilot/${path}`, null, body, {
    ...options,
    headers: { "x-pilot-token": s.token, ...options.headers },
  });
const upload = (s, id = crypto.randomUUID(), bytes = png, mime = "image/png") =>
  h.dispatch(
    new Request(`http://localhost/api/pilot/images/${id}`, {
      method: "PUT",
      headers: {
        origin: "http://localhost",
        "x-pilot-token": s.token,
        "content-type": mime,
      },
      body: bytes,
    }),
  );

test.before(async () => {
  h = await createWorkerHarness(file);
});
test.after(() => {
  h.close();
  rmSync(directory, { recursive: true, force: true });
});

test("P0-01 normal submit commits one unique Lead ID, consent, attribution and correlated outbox", async () => {
  const s = await session();
  const before = count("pilot_leads");
  const response = await call(s, "leads", payload());
  assert.equal(response.status, 201);
  const result = await data(response);
  assert.match(result.lead_id, /^MP-[a-f0-9-]{36}$/);
  assert.equal(result.sent, false);
  assert.equal(count("pilot_leads"), before + 1);
  const reopened = await data(await call(s, "draft"));
  assert.equal(reopened.lead.id, result.lead_id);
  assert.equal(reopened.lead.contact, payload().contact);
  assert.ok(reopened.consent_at);
  assert.equal(reopened.consent_version, "middle-property-2026-09-13-v1");
  const outbox = h.sqlite
    .prepare("SELECT * FROM pilot_outbox WHERE lead_id=?")
    .get(result.lead_id);
  assert.equal(outbox.destination, "mock://middle-property-operations");
  assert.equal(outbox.status, "generated_mock");
  assert.deepEqual(reopened.lead.attribution, attribution);
});
test("P0-01 double click / concurrent retry yields exactly one lead and one notification", async () => {
  const s = await session();
  const before = count("pilot_leads");
  const results = await Promise.all(
    Array.from({ length: 6 }, () => call(s, "leads", payload())),
  );
  assert.ok(results.every((r) => [200, 201].includes(r.status)));
  const ids = await Promise.all(
    results.map(async (r) => (await data(r)).lead_id),
  );
  assert.equal(new Set(ids).size, 1);
  assert.equal(count("pilot_leads"), before + 1);
  assert.equal(
    h.sqlite
      .prepare("SELECT COUNT(*) n FROM pilot_outbox WHERE lead_id=?")
      .get(ids[0]).n,
    1,
  );
  assert.equal(
    (await call(s, "leads", { ...payload(), budget: 60000 })).status,
    409,
  );
});
test("P0-01 lost response and retry preserves Lead ID and does not duplicate", async () => {
  const s = await session();
  const before = count("pilot_leads");
  await call(s, "leads", payload()); // Server commits but caller intentionally discards response.
  const a = await data(await call(s, "draft"));
  const b = await data(await call(s, "leads", payload()));
  assert.equal(a.lead.id, b.lead_id);
  assert.equal(count("pilot_leads"), before + 1);
});
test("P0-01 injected notification/database failure rolls back all writes; retry succeeds once", async () => {
  const s = await session();
  const before = count("pilot_leads");
  h.injectFailure("INSERT OR IGNORE INTO pilot_outbox");
  const failed = await call(s, "leads", payload());
  assert.equal(failed.status, 500);
  assert.equal(count("pilot_leads"), before);
  assert.equal((await data(await call(s, "draft"))).lead, null);
  assert.equal((await call(s, "leads", payload())).status, 201);
  assert.equal(count("pilot_leads"), before + 1);
});
test("P0-01 invalid input, malformed JSON, wrong type, oversized body and hostile origin fail closed", async () => {
  const s = await session();
  const before = count("pilot_leads");
  for (const body of [
    null,
    [],
    { ...payload(), contact: { value: "x" } },
    { ...payload(), budget: "50000" },
    { ...payload(), mock_data: false },
    { ...payload(), contact: "real@invalid.example" },
    { ...payload(), unexpected: "field" },
  ])
    assert.equal((await call(s, "leads", body)).status, 422);
  assert.equal(
    (
      await call(s, "leads", payload(), {
        headers: { origin: "https://outside.invalid" },
      })
    ).status,
    403,
  );
  assert.equal(
    (await call(s, "leads", { ...payload(), requirements: "x".repeat(40000) }))
      .status,
    413,
  );
  const malformed = await h.dispatch(
    new Request("http://localhost/api/pilot/leads", {
      method: "POST",
      headers: {
        origin: "http://localhost",
        "content-type": "application/json",
        "x-pilot-token": s.token,
      },
      body: "{",
    }),
  );
  assert.equal(malformed.status, 400);
  assert.equal(count("pilot_leads"), before);
});
test("P0-02 no consent, false consent and wrong policy version cannot create a session or lead", async () => {
  const before = count("pilot_drafts");
  const token = "a".repeat(64);
  for (const consent of [
    undefined,
    { accepted: false, version: "middle-property-2026-09-13-v1" },
    { accepted: true, version: "old" },
  ]) {
    const r = await h.call(
      "/api/pilot/session",
      operator,
      { mock_data: true, draft_id: crypto.randomUUID(), consent },
      { headers: { "x-pilot-token": token } },
    );
    assert.equal(r.status, 422);
  }
  assert.equal(count("pilot_drafts"), before);
  assert.equal(
    (await h.call("/api/pilot/leads", operator, payload())).status,
    401,
  );
});
test("P0-03 four images persist, retry reuses upload ID, fifth/concurrent extras are rejected", async () => {
  const s = await session();
  const ids = Array.from({ length: 6 }, () => crypto.randomUUID());
  const results = await Promise.all(ids.map((id) => upload(s, id)));
  assert.equal(results.filter((r) => r.status === 201).length, 4);
  assert.equal(results.filter((r) => r.status === 422).length, 2);
  const saved = await data(await call(s, "draft"));
  assert.equal(saved.images.length, 4);
  const first = saved.images[0].id;
  assert.equal((await upload(s, first)).status, 200);
  assert.equal((await data(await call(s, "draft"))).images.length, 4);
  const read = await call(s, `images/${first}`);
  assert.deepEqual(Buffer.from(await read.arrayBuffer()), png);
  await call(s, "leads", payload());
  assert.equal((await data(await call(s, "draft"))).images.length, 4);
  assert.equal(
    (await call(s, "draft", { image_ids: [] }, { method: "PATCH" })).status,
    409,
  );
});
test("P0-03 reorder/removal persist and foreign images cannot be attached; no orphan reference", async () => {
  const a = await session(),
    b = await session();
  const ids = [crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID()];
  for (const id of ids) assert.equal((await upload(a, id)).status, 201);
  assert.equal(
    (
      await call(
        a,
        "draft",
        { image_ids: [ids[2], ids[0]] },
        { method: "PATCH" },
      )
    ).status,
    200,
  );
  assert.deepEqual(
    (await data(await call(a, "draft"))).images.map((i) => i.id),
    [ids[2], ids[0]],
  );
  assert.equal((await call(a, `images/${ids[1]}`)).status, 404);
  assert.equal((await call(b, `images/${ids[0]}`)).status, 404);
  assert.equal(
    (await call(b, "draft", { image_ids: [ids[0]] }, { method: "PATCH" }))
      .status,
    422,
  );
  assert.equal(
    count("pilot_images"),
    h.sqlite
      .prepare(
        "SELECT COUNT(*) n FROM pilot_images i JOIN pilot_drafts d ON d.id=i.draft_id",
      )
      .get().n,
  );
  assert.deepEqual(h.sqlite.prepare("PRAGMA foreign_key_check").all(), []);
});
test("P0-03 invalid and interrupted uploads save no partial image and retry succeeds", async () => {
  const s = await session();
  const id = crypto.randomUUID();
  const before = count("pilot_images");
  assert.equal(
    (await upload(s, id, Buffer.from("not a png image at all"))).status,
    422,
  );
  assert.equal((await upload(s, id, Buffer.alloc(131073))).status, 413);
  assert.equal((await upload(s, id, png, "image/svg+xml")).status, 415);
  const broken = new ReadableStream({
    start(controller) {
      controller.enqueue(png.slice(0, 10));
      controller.error(new Error("TEST network interruption"));
    },
  });
  const response = await h.dispatch(
    new Request(`http://localhost/api/pilot/images/${id}`, {
      method: "PUT",
      headers: {
        origin: "http://localhost",
        "content-type": "image/png",
        "x-pilot-token": s.token,
      },
      body: broken,
      duplex: "half",
    }),
  );
  assert.equal(response.status, 500);
  assert.equal(count("pilot_images"), before);
  assert.equal((await upload(s, id)).status, 201);
});
test("P0-04 authorized mock operator sees correlated record, qualifies and makes it viewing-ready", async () => {
  const s = await session();
  const result = await data(await call(s, "leads", payload()));
  assert.equal((await h.call("/api/pilot/inbox")).status, 403);
  assert.equal(
    (
      await h.call("/api/pilot/inbox", {
        id: "TEST-other",
        email: "other@example.test",
      })
    ).status,
    403,
  );
  const list = await data(await h.call("/api/pilot/inbox", operator));
  const lead = list.leads.find((l) => l.id === result.lead_id);
  assert.ok(lead);
  assert.equal(lead.notification_id, `notification-${lead.id}`);
  assert.equal(list.owner_authorization_confirmed, false);
  assert.equal(
    (
      await h.call(
        "/api/pilot/inbox",
        operator,
        {
          lead_id: lead.id,
          status: "viewing_ready",
          viewing_window: "TEST tomorrow",
        },
        { method: "PATCH" },
      )
    ).status,
    422,
  );
  assert.equal(
    (
      await h.call(
        "/api/pilot/inbox",
        operator,
        { lead_id: lead.id, status: "qualified" },
        { method: "PATCH" },
      )
    ).status,
    200,
  );
  assert.equal(
    (
      await h.call(
        "/api/pilot/inbox",
        operator,
        {
          lead_id: lead.id,
          status: "viewing_ready",
          viewing_window: "TEST 2026-10-01 14:00",
        },
        { method: "PATCH" },
      )
    ).status,
    200,
  );
  assert.equal(
    (await data(await call(s, "draft"))).lead.status,
    "viewing_ready",
  );
  const names = h.sqlite
    .prepare("SELECT name FROM pilot_events WHERE lead_id=?")
    .all(lead.id)
    .map((e) => e.name);
  assert.ok(names.includes("qualified_lead"));
  assert.ok(names.includes("viewing_request"));
});
test("P0-06 debug events retain first/last touch, reject arbitrary PII and prevent forged qualification", async () => {
  const s = await session();
  for (const name of ["page_view", "form_start", "line_click", "call_click"]) {
    const body = {
      id: crypto.randomUUID(),
      name,
      occurred_at: new Date().toISOString(),
      attribution,
    };
    assert.equal((await call(s, "events", body)).status, 200);
    assert.equal((await call(s, "events", body)).status, 200);
  }
  assert.equal(
    h.sqlite
      .prepare("SELECT COUNT(*) n FROM pilot_events WHERE draft_id=?")
      .get(s.draft_id).n,
    4,
  );
  assert.equal(
    (
      await call(s, "events", {
        id: crypto.randomUUID(),
        name: "qualified_lead",
        occurred_at: new Date().toISOString(),
        attribution,
      })
    ).status,
    422,
  );
  assert.equal(
    (
      await call(s, "events", {
        id: crypto.randomUUID(),
        name: "page_view",
        occurred_at: new Date().toISOString(),
        attribution,
        contact: "pilot@example.test",
      })
    ).status,
    422,
  );
});
test("P0-07 no real mode, no authorization default, private image/read tokens and legacy writes closed", async () => {
  const a = await session();
  const id = crypto.randomUUID();
  await upload(a, id);
  assert.equal((await h.call(`/api/pilot/images/${id}`)).status, 403);
  assert.equal((await h.call("/api/pilot/draft", operator)).status, 401);
  assert.equal(
    (
      await h.call("/api/pilot/draft", null, undefined, {
        headers: { "x-pilot-token": "b".repeat(64) },
      })
    ).status,
    401,
  );
  for (const path of [
    "/api/leads",
    "/api/import",
    "/api/leads/",
    "/api/import/",
    "/api/%6ceads",
    "/api/%69mport",
  ])
    assert.ok(
      [404, 503].includes(
        (await h.call(path, operator, { mock_data: true })).status,
      ),
      `${path} must deny writes`,
    );
  const original = globalThis.__middleTestEnv.MIDDLE_OPERATIONS_USER_IDS;
  globalThis.__middleTestEnv.MIDDLE_OPERATIONS_USER_IDS = "";
  assert.equal((await h.call("/api/pilot/inbox", operator)).status, 403);
  globalThis.__middleTestEnv.MIDDLE_OPERATIONS_USER_IDS = original;
  globalThis.__middleTestEnv.MIDDLE_READINESS_MODE = "real";
  assert.equal((await call(a, "draft")).status, 503);
  globalThis.__middleTestEnv.MIDDLE_READINESS_MODE = "mock";
  const response = await call(a, "draft");
  assert.match(response.headers.get("cache-control"), /no-store/);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
});
test("P0-01/P0-03 persistent SQLite survives process binding reopen with identical record and bytes", async () => {
  const s = await session();
  const id = crypto.randomUUID();
  await upload(s, id);
  const lead = await data(await call(s, "leads", payload()));
  // Close the actual file and rebind the compiled Worker to a reopened database.
  h.close();
  h = await createWorkerHarness(file);
  const result = await data(await call(s, "draft"));
  assert.equal(result.lead.id, lead.lead_id);
  assert.equal(result.images[0].id, id);
  assert.equal(result.lead.contact, payload().contact);
  const image = await call(s, `images/${id}`);
  assert.deepEqual(Buffer.from(await image.arrayBuffer()), png);
});

test("P0-04 concurrent qualification retry never downgrades viewing-ready and records operator", async () => {
  const s = await session();
  const result = await data(await call(s, "leads", payload()));
  const update = (body) =>
    h.call(
      "/api/pilot/inbox",
      operator,
      { lead_id: result.lead_id, ...body },
      { method: "PATCH" },
    );
  assert.equal((await update({ status: "qualified" })).status, 200);
  const responses = await Promise.all([
    update({ status: "viewing_ready", viewing_window: "TEST tomorrow 14:00" }),
    update({ status: "qualified" }),
  ]);
  assert.ok(responses.every((r) => [200, 409].includes(r.status)));
  assert.equal(
    (await data(await call(s, "draft"))).lead.status,
    "viewing_ready",
  );
  const events = h.sqlite
    .prepare(
      "SELECT actor_id FROM pilot_events WHERE lead_id=? AND name IN ('qualified_lead','viewing_request')",
    )
    .all(result.lead_id);
  assert.equal(events.length, 2);
  assert.ok(events.every((e) => e.actor_id === operator.id));
});

const erase = (s, reason = "withdrawn", options = {}) =>
  call(
    s,
    "session",
    { mock_data: true, reason },
    { method: "DELETE", ...options },
  );
const contentTables = [
  "pilot_drafts",
  "pilot_leads",
  "pilot_images",
  "pilot_outbox",
  "pilot_events",
];
function assertErased(s, leadId) {
  assert.equal(
    h.sqlite
      .prepare("SELECT COUNT(*) n FROM pilot_drafts WHERE id=?")
      .get(s.draft_id).n,
    0,
  );
  for (const table of ["pilot_leads", "pilot_images", "pilot_events"])
    assert.equal(
      h.sqlite
        .prepare(`SELECT COUNT(*) n FROM ${table} WHERE draft_id=?`)
        .get(s.draft_id).n,
      0,
    );
  if (leadId)
    assert.equal(
      h.sqlite
        .prepare("SELECT COUNT(*) n FROM pilot_outbox WHERE lead_id=?")
        .get(leadId).n,
      0,
    );
  assert.deepEqual(h.sqlite.prepare("PRAGMA foreign_key_check").all(), []);
}
test("P0-02 lifecycle withdrawal atomically erases all content, preserves other leads and deduplicates retries", async () => {
  const a = await session(),
    b = await session();
  const imageId = crypto.randomUUID();
  await upload(a, imageId);
  const lead = await data(await call(a, "leads", payload()));
  const other = await data(await call(b, "leads", payload()));
  const first = await data(await erase(a));
  assert.equal(first.content_erased, true);
  assert.equal(first.reason, "withdrawn");
  assert.deepEqual(await data(await erase(a, "deleted")), first);
  assertErased(a, lead.lead_id);
  assert.equal((await data(await call(b, "draft"))).lead.id, other.lead_id);
  assert.equal((await call(a, "draft")).status, 401);
  assert.equal(
    (await h.call(`/api/pilot/images/${imageId}`, operator)).status,
    404,
  );
  assert.equal((await call(a, "leads", payload())).status, 401);
  const replay = await call(a, "session", {
    draft_id: a.draft_id,
    mock_data: true,
    consent: { accepted: true, version: "middle-property-2026-09-13-v1" },
  });
  assert.equal(replay.status, 410);
  h.close();
  h = await createWorkerHarness(file);
  assert.deepEqual(await data(await erase(a)), first);
  assertErased(a, lead.lead_id);
});
test("P0-02 erasure failure rolls back receipt and content; retry keeps original capability", async () => {
  const s = await session();
  await upload(s);
  const lead = await data(await call(s, "leads", payload()));
  h.injectFailure("DELETE FROM pilot_drafts");
  assert.equal((await erase(s)).status, 500);
  assert.equal(
    h.sqlite
      .prepare("SELECT COUNT(*) n FROM pilot_closures WHERE draft_id=?")
      .get(s.draft_id).n,
    0,
  );
  assert.equal((await data(await call(s, "draft"))).lead.id, lead.lead_id);
  assert.equal((await data(await call(s, "draft"))).images.length, 1);
  assert.equal((await erase(s)).status, 200);
  assertErased(s, lead.lead_id);
});
test("P0-07 erasure requires its own capability, same origin and mock mode; sweep requires operator", async () => {
  const a = await session();
  const before = contentTables.map(count);
  assert.equal(
    (
      await h.call(
        "/api/pilot/session",
        operator,
        { mock_data: true, reason: "deleted" },
        { method: "DELETE" },
      )
    ).status,
    401,
  );
  assert.equal((await erase({ token: "e".repeat(64) })).status, 401);
  assert.equal(
    (
      await erase(a, "deleted", {
        headers: { origin: "https://outside.invalid" },
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await call(
        a,
        "session",
        { mock_data: true, reason: "deleted", draft_id: a.draft_id },
        { method: "DELETE" },
      )
    ).status,
    422,
  );
  assert.equal(
    (await h.call("/api/pilot/maintenance", null, { mock_data: true })).status,
    403,
  );
  globalThis.__middleTestEnv.MIDDLE_READINESS_MODE = "real";
  try {
    assert.equal((await erase(a)).status, 503);
  } finally {
    globalThis.__middleTestEnv.MIDDLE_READINESS_MODE = "mock";
  }
  assert.deepEqual(contentTables.map(count), before);
});
test("P0-07 expired content is hidden from operator and capability; retention sweep erases only due content", async () => {
  const due = await session(),
    fresh = await session();
  const imageId = crypto.randomUUID();
  await upload(due, imageId);
  await upload(fresh);
  const lead = await data(await call(due, "leads", payload()));
  h.sqlite
    .prepare("UPDATE pilot_drafts SET expires_at=? WHERE id=?")
    .run("2000-01-01T00:00:00.000Z", due.draft_id);
  assert.equal((await call(due, "draft")).status, 401);
  assert.equal(
    (await h.call(`/api/pilot/images/${imageId}`, operator)).status,
    404,
  );
  const list = await data(await h.call("/api/pilot/inbox", operator));
  assert.equal(
    list.leads.some((l) => l.id === lead.lead_id),
    false,
  );
  assert.equal(
    (
      await h.call(
        "/api/pilot/inbox",
        operator,
        { lead_id: lead.lead_id, status: "qualified" },
        { method: "PATCH" },
      )
    ).status,
    404,
  );
  const sweep = () =>
    h.call("/api/pilot/maintenance", operator, { mock_data: true });
  assert.equal((await data(await sweep())).processed, 1);
  assert.equal((await data(await sweep())).processed, 0);
  assertErased(due, lead.lead_id);
  assert.equal((await data(await erase(due))).reason, "expired");
  assert.equal((await data(await call(fresh, "draft"))).images.length, 1);
});
test("P0-07 erasure racing save, uploads and progression never leaves content or permits resurrection", async () => {
  for (const saved of [false, true]) {
    const s = await session();
    await upload(s);
    const lead = saved ? await data(await call(s, "leads", payload())) : null;
    const responses = await Promise.all([
      erase(s),
      call(s, "leads", payload()),
      upload(s),
      ...(lead
        ? [
            h.call(
              "/api/pilot/inbox",
              operator,
              { lead_id: lead.lead_id, status: "qualified" },
              { method: "PATCH" },
            ),
          ]
        : []),
    ]);
    assert.equal(responses[0].status, 200);
    for (const response of responses.slice(1))
      assert.ok(
        [200, 201, 401, 404, 409, 410].includes(response.status),
        `Unexpected racing response: ${response.status}`,
      );
    assertErased(s, lead?.lead_id);
    assert.equal((await erase(s)).status, 200);
    assert.equal((await upload(s)).status, 401);
  }
});

test("P0-07 writes authorized before erasure are rejected at SQL execution; mixed identity replays cannot recreate", async () => {
  for (const kind of ["image", "event"]) {
    const s = await session();
    const hold = h.holdNextRun(
      kind === "image"
        ? "INSERT INTO pilot_images"
        : "INSERT OR IGNORE INTO pilot_events",
    );
    const pending =
      kind === "image"
        ? upload(s)
        : call(s, "events", {
            id: crypto.randomUUID(),
            name: "page_view",
            occurred_at: new Date().toISOString(),
            attribution,
          });
    await hold.paused;
    try {
      assert.equal((await erase(s)).status, 200);
    } finally {
      hold.release();
    }
    assert.equal((await pending).status, 410);
    assertErased(s);
    for (const [token, draft_id] of [
      [s.token, crypto.randomUUID()],
      ["a".repeat(64), s.draft_id],
    ]) {
      const response = await h.call(
        "/api/pilot/session",
        null,
        {
          draft_id,
          mock_data: true,
          consent: { accepted: true, version: "middle-property-2026-09-13-v1" },
        },
        { headers: { "x-pilot-token": token } },
      );
      assert.equal(response.status, 410);
    }
  }
});

```


## tests/e2e/server.mjs
SHA-256: cceda63521eb932ee0317fa72a5e20a17d2ba4b2b8f312e58cf5ac7ab975dd34
```
import { createServer } from "node:http";
import { Readable } from "node:stream";
import { mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname, resolve, sep } from "node:path";
import { createWorkerHarness } from "../helpers/worker.mjs";
const directory = mkdtempSync(resolve(tmpdir(), "lilith-e2e-"));
const harness = await createWorkerHarness(resolve(directory, "test.sqlite"));
const assets = resolve("dist/client");
const types = {
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".html": "text/html",
  ".woff2": "font/woff2",
};
harness.setAssetFetcher((request) => {
  const path = resolve(assets, "." + new URL(request.url).pathname);
  if (!path.startsWith(assets + sep))
    return new Response("Not found", { status: 404 });
  try {
    return new Response(readFileSync(path), {
      headers: {
        "Content-Type": types[extname(path)] ?? "application/octet-stream",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
});
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", "http://127.0.0.1:4199");
    const path = resolve(assets, "." + decodeURIComponent(url.pathname));
    if (path.startsWith(assets + sep)) {
      try {
        if (statSync(path).isFile()) {
          response.writeHead(200, {
            "Content-Type": types[extname(path)] ?? "application/octet-stream",
          });
          response.end(readFileSync(path));
          return;
        }
      } catch {
        /* App route, not a static file. */
      }
    }
    const body = ["GET", "HEAD"].includes(request.method ?? "GET")
      ? undefined
      : new Uint8Array(
          await new Response(Readable.toWeb(request)).arrayBuffer(),
        );
    const headers = new Headers();
    for (const [key, value] of Object.entries(request.headers))
      if (value)
        headers.set(key, Array.isArray(value) ? value.join(", ") : value);
    const result = await harness.dispatchMock(
      new Request(url, { method: request.method, headers, body }),
    );
    response.writeHead(result.status, Object.fromEntries(result.headers));
    if (result.body) Readable.fromWeb(result.body).pipe(response);
    else response.end();
  } catch (error) {
    console.error(error);
    response.writeHead(500);
    response.end("Test server error");
  }
});
// The loopback test adapter signs synthetic browser identities with an ephemeral
// key. It is trusted simulation, never hosted identity evidence.
server.listen(4199, "127.0.0.1", () =>
  console.log("TEST Worker available at http://127.0.0.1:4199"),
);
// Mock retention is driven only by this local harness. No hosted scheduler is configured.
let sweeping = false;
async function sweep() {
  if (sweeping) return;
  sweeping = true;
  try {
    const result = await harness.call(
      "/api/pilot/maintenance",
      { id: "TEST-operations", email: "operations@example.test" },
      { mock_data: true },
    );
    if (!result.ok) console.error("TEST retention sweep failed", result.status);
  } catch {
    console.error("TEST retention sweep request failed");
  } finally {
    sweeping = false;
  }
}
const retentionTimer = setInterval(() => void sweep(), 60_000);
void sweep();
function close() {
  clearInterval(retentionTimer);
  server.close();
  harness.close();
  rmSync(directory, { recursive: true, force: true });
  process.exit(0);
}
process.on("SIGTERM", close);
process.on("SIGINT", close);

```


## tests/e2e/readiness.spec.ts
SHA-256: e5609cc9f81bc87bc2f61e1bb38dce62a61447dd2cf1c92e9ba8ea1a2a5e77ee
```
import { syntheticPng } from "../helpers/synthetic-image.mjs";
import { test, expect, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
const images = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    name: `synthetic-${i + 1}.png`,
    mimeType: "image/png",
    buffer: syntheticPng(i),
  }));
const output = "output/playwright/readiness";
test.beforeAll(() => mkdirSync(output, { recursive: true }));
function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
async function details(page: Page) {
  await page.goto(
    "/pilot?utm_source=test_source&utm_medium=organic&utm_campaign=test_pilot&lang=en",
  );
  await page
    .getByRole("button", { name: "Fill synthetic test details" })
    .click();
}
async function consent(page: Page) {
  await page.getByRole("button", { name: /Review consent/ }).click();
  await expect(page.getByRole("checkbox")).not.toBeChecked();
  await page.getByRole("checkbox").check();
}
test("P0 regression: save and restore exclude competing Reopen/New actions without losing images", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await details(page);
  await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
  await page
    .getByLabel("Test images", { exact: true })
    .setInputFiles(images(4));
  await expect(page.getByText("4 / 4 images", { exact: true })).toBeVisible();
  await consent(page);
  const paused = deferred(),
    release = deferred();
  let hold = true,
    puts = 0;
  page.on("request", (request) => {
    if (
      request.method() === "PUT" &&
      request.url().includes("/api/pilot/images/")
    )
      puts++;
  });
  await page.route("**/api/pilot/events", async (route) => {
    if (hold) {
      hold = false;
      paused.resolve();
      await release.promise;
    }
    await route.continue();
  });
  await page.getByRole("button", { name: /Save test request/ }).click();
  await paused.promise;
  try {
    await expect(
      page.getByRole("button", { name: "Reopen saved request", exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByRole("button", {
        name: "Start a new mock request",
        exact: true,
      }),
    ).toBeDisabled();
    await expect(page.getByRole("button", { name: /Decline/ })).toBeDisabled();
    await expect(page.getByText("4 / 4 images", { exact: true })).toBeVisible();
  } finally {
    release.resolve();
  }
  await expect(page.getByTestId("lead-id")).toBeVisible();
  const id = await page.getByTestId("lead-id").innerText();
  expect(puts).toBe(4);
  await page.reload();
  await expect(page.getByTestId("lead-id")).toHaveText(id);
  await expect(page.getByText("4 / 4 images", { exact: true })).toBeVisible();
  const restoring = deferred(),
    restoreRelease = deferred();
  let holdImage = true;
  await page.route("**/api/pilot/images/*", async (route) => {
    if (holdImage && route.request().method() === "GET") {
      holdImage = false;
      restoring.resolve();
      await restoreRelease.promise;
    }
    await route.continue();
  });
  await page
    .getByRole("button", { name: "Reopen saved request", exact: true })
    .click();
  await restoring.promise;
  try {
    await expect(page.getByRole("status")).toContainText(
      "Restoring saved request",
    );
    await expect(
      page.getByRole("button", { name: "Reopen saved request", exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByRole("button", {
        name: "Start a new mock request",
        exact: true,
      }),
    ).toBeDisabled();
  } finally {
    restoreRelease.resolve();
  }
  await expect(
    page.getByRole("button", { name: "Reopen saved request", exact: true }),
  ).toBeEnabled();
  await expect(page.getByTestId("lead-id")).toHaveText(id);
  await expect(page.getByText("4 / 4 images", { exact: true })).toBeVisible();
  await page.screenshot({
    path: `${output}/reopen-race-fixed.png`,
    fullPage: true,
  });
});
test("P0 regression: immediate mobile double-click at 200% preserves four staged images", async ({
  browser,
}) => {
  const context = await browser.newContext({
    baseURL: "http://127.0.0.1:4199",
    viewport: { width: 390, height: 844 },
    hasTouch: true,
  });
  const page = await context.newPage();
  let puts = 0;
  page.on("request", (request) => {
    if (
      request.method() === "PUT" &&
      request.url().includes("/api/pilot/images/")
    )
      puts++;
  });
  await details(page);
  await page
    .getByLabel("Test images", { exact: true })
    .setInputFiles(images(4));
  await expect(page.getByText("4 / 4 images", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Move image 2 left", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Remove image 4", exact: true })
    .click();
  await expect(page.getByText("3 / 4 images", { exact: true })).toBeVisible();
  await page
    .getByLabel("Test images", { exact: true })
    .setInputFiles(images(1));
  await expect(page.getByText("4 / 4 images", { exact: true })).toBeVisible();
  await consent(page);
  await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
  await page.getByRole("button", { name: /Save test request/ }).dblclick();
  await expect(page.getByTestId("lead-id")).toBeVisible();
  const id = await page.getByTestId("lead-id").innerText();
  expect(puts).toBe(4);
  await page.reload();
  await expect(page.getByTestId("lead-id")).toHaveText(id);
  await expect(page.getByText("4 / 4 images", { exact: true })).toBeVisible();
  await page.screenshot({
    path: `${output}/mobile-200-double-click.png`,
    fullPage: true,
  });
  await context.close();
});
for (const device of ["desktop", "mobile"] as const) {
  test(`P0 journey ${device}: consent, images, unique Lead ID, refresh and operations handoff`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      baseURL: "http://127.0.0.1:4199",
      viewport:
        device === "mobile"
          ? { width: 390, height: 844 }
          : { width: 1440, height: 1000 },
      hasTouch: device === "mobile",
    });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await context.route("**/*", (route) => {
      const url = new URL(route.request().url());
      return url.hostname !== "127.0.0.1" ? route.abort() : route.continue();
    });
    await details(page);
    await page
      .getByLabel("Test images", { exact: true })
      .setInputFiles(images(4));
    await expect(page.getByText("4 / 4 images", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Next image", exact: true }).click();
    await expect(
      page.getByAltText("Synthetic upload 2", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Move image 2 left", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Remove image 4", exact: true })
      .click();
    await expect(page.getByText("3 / 4 images", { exact: true })).toBeVisible();
    await page
      .getByLabel("Test images", { exact: true })
      .setInputFiles(images(1));
    await consent(page);
    const copy = page.getByRole("region", { name: "Consent details" });
    await copy.focus();
    await page.keyboard.press("End");
    await expect(copy).toBeVisible();
    await page.screenshot({
      path: `${output}/${device}-consent.png`,
      fullPage: true,
    });
    await page.getByRole("button", { name: /Save test request/ }).dblclick();
    await expect(page.getByTestId("lead-id")).toBeVisible();
    const id = await page.getByTestId("lead-id").innerText();
    await page.screenshot({
      path: `${output}/${device}-saved.png`,
      fullPage: true,
    });
    await page.reload();
    await expect(page.getByTestId("lead-id")).toHaveText(id);
    await expect(page.getByText("4 / 4 images", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Reopen saved request" }).click();
    await expect(page.getByTestId("lead-id")).toHaveText(id);
    await expect(page.locator('input[name="contact"]')).toHaveValue(
      "pilot@example.test",
    );
    await page
      .locator(".pilot-contact")
      .getByRole("link", { name: "Test LINE", exact: true })
      .click();
    await page
      .locator(".pilot-contact")
      .getByRole("link", { name: "Test call", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText(
      "No call or external message",
    );
    await expect(page.locator('a[href*="@themiddleproperty"]')).toHaveCount(0);
    const line = page.locator(
      'a[href="https://line.me/R/ti/p/@middleproperty"]',
    );
    expect(await line.count()).toBeGreaterThanOrEqual(5);
    const phone = page.locator('a[href="tel:+66933888594"]');
    expect(await phone.count()).toBeGreaterThanOrEqual(5);
    const ops = await browser.newContext({
      baseURL: "http://127.0.0.1:4199",
      extraHTTPHeaders: {
        "oai-authenticated-user-id": "TEST-operations",
        "oai-authenticated-user-email": "operations@example.test",
      },
    });
    const inbox = await ops.newPage();
    await inbox.goto("/pilot/inbox");
    await inbox.getByRole("button", { name: id, exact: true }).click();
    const record = inbox
      .locator("article")
      .filter({ has: inbox.getByRole("button", { name: id, exact: true }) });
    await expect(record).toContainText(`notification-${id}`);
    await expect(record).toContainText("mock://middle-property-operations");
    await expect(record).toContainText("Images: 4");
    await record.getByRole("button", { name: "Qualify test lead" }).click();
    await record.getByLabel("Viewing window").fill("TEST 2026-10-01 14:00");
    await record.getByRole("button", { name: "Mark viewing-ready" }).click();
    await expect(record).toContainText("viewing_ready");
    await inbox.screenshot({
      path: `${output}/${device}-operations.png`,
      fullPage: true,
    });
    await page.reload();
    await expect(
      page.getByText("Status: viewing_ready", { exact: true }),
    ).toBeVisible();
    expect(errors).toEqual([]);
    await ops.close();
    await context.close();
  });
}
test("P0-01 lost submit response retries and recovers the same persisted Lead ID", async ({
  page,
}) => {
  await details(page);
  await consent(page);
  let savedId = "";
  let lost = false;
  await page.route("**/api/pilot/leads", async (route) => {
    if (!lost) {
      lost = true;
      const response = await route.fetch();
      savedId = (await response.json()).data.lead_id;
      await route.abort("connectionfailed");
    } else await route.continue();
  });
  await page.getByRole("button", { name: /Save test request/ }).click();
  await expect(page.getByRole("status")).not.toBeEmpty();
  await expect(
    page.getByRole("button", { name: /Save test request/ }),
  ).toBeEnabled();
  await page.getByRole("button", { name: /Save test request/ }).click();
  await expect(page.getByTestId("lead-id")).toHaveText(savedId);
  await page.screenshot({
    path: `${output}/lost-response-recovered.png`,
    fullPage: true,
  });
});
test("P0-01/P0-02 invalid input and declined consent never submit; controls recover", async ({
  page,
}) => {
  let creates = 0;
  page.on("request", (request) => {
    if (request.url().endsWith("/api/pilot/leads")) creates++;
  });
  await details(page);
  await page.locator('input[name="budget"]').fill("0");
  await page.getByRole("button", { name: /Review consent/ }).click();
  await expect(
    page.getByRole("button", { name: /Review consent/ }),
  ).toBeEnabled();
  expect(creates).toBe(0);
  await page.locator('input[name="budget"]').fill("50000");
  await page.getByRole("button", { name: /Review consent/ }).click();
  await page.getByRole("button", { name: /Save test request/ }).click();
  await expect(page.getByRole("status")).toContainText("Accept consent");
  expect(creates).toBe(0);
  await page.getByRole("button", { name: /Decline/ }).click();
  await expect(page.getByRole("status")).toContainText("Declined");
  await expect(page.locator('input[name="name"]')).toHaveValue("");
  expect(creates).toBe(0);
});
test("P0-01 offline failure is visible and retry succeeds without a duplicate", async ({
  page,
  context,
}) => {
  await details(page);
  await consent(page);
  await context.setOffline(true);
  await page.getByRole("button", { name: /Save test request/ }).click();
  await expect(page.getByRole("status")).not.toBeEmpty();
  await context.setOffline(false);
  await page.getByRole("button", { name: /Save test request/ }).click();
  await expect(page.getByTestId("lead-id")).toBeVisible();
});
test("P0-03 failed upload retains preview, reports error, and retries the same image ID", async ({
  page,
}) => {
  await details(page);
  await page
    .getByLabel("Test images", { exact: true })
    .setInputFiles(images(1));
  await consent(page);
  let failed = false;
  const attempts: string[] = [];
  await page.route("**/api/pilot/images/*", async (route) => {
    if (route.request().method() === "PUT") {
      attempts.push(route.request().url());
      if (!failed) {
        failed = true;
        return route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({
            error: { message: "TEST upload interrupted; retry" },
          }),
        });
      }
    }
    return route.continue();
  });
  await page.getByRole("button", { name: /Save test request/ }).click();
  await expect(page.getByRole("status")).toContainText("upload interrupted");
  await expect(
    page.getByAltText("Synthetic upload 1", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Save test request/ }).click();
  await expect(page.getByTestId("lead-id")).toBeVisible();
  expect(attempts.length).toBe(2);
  expect(attempts[0]).toBe(attempts[1]);
});
test("P0-05/P0-06 landing contact routes preserve source and simulate canonical contact", async ({
  page,
}) => {
  await page.goto(
    "/pilot?channel=line&utm_source=test_header&utm_medium=organic&utm_campaign=test_contact&lang=en",
  );
  await page.getByText("Test event log (no personal data)").click();
  await expect(page.locator("output")).toContainText("line_click");
  await page
    .getByRole("button", { name: "Fill synthetic test details" })
    .click();
  await consent(page);
  await page.getByRole("button", { name: /Save test request/ }).click();
  await expect(page.getByTestId("lead-id")).toBeVisible();
});
test("P0-02 mobile 200% text remains scrollable with unobstructed consent controls", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await details(page);
  await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
  await consent(page);
  await expect(page.getByRole("checkbox")).toBeChecked();
  await page.getByRole("button", { name: /Save test request/ }).click();
  await expect(page.getByTestId("lead-id")).toBeVisible();
  await page.screenshot({
    path: `${output}/mobile-200-percent.png`,
    fullPage: true,
  });
});

test("P0-05 actual Landing preserves canonical contacts and UTM into requirement flow", async ({
  page,
}) => {
  await page.route("**/*", (route) =>
    new URL(route.request().url()).hostname !== "127.0.0.1"
      ? route.abort()
      : route.continue(),
  );
  await page.goto(
    "/?utm_source=test_landing&utm_medium=organic&utm_campaign=test_header",
  );
  await expect(
    page.getByText("MOCK PREVIEW", { exact: false }).first(),
  ).toBeVisible();
  await expect(
    page.locator('a[href="tel:+66933888594"]').first(),
  ).toBeVisible();
  await expect(page.locator('a[href*="@themiddleproperty"]')).toHaveCount(0);
  await page.screenshot({ path: `${output}/landing.png`, fullPage: true });
  await page.locator('a[href="tel:+66933888594"]').first().click();
  await expect(page).toHaveURL(
    /pilot\?.*utm_source=test_landing.*channel=call/,
  );
  await page.getByText("Test event log (no personal data)").click();
  await expect(page.locator("output")).toContainText("call_click");
});

test("P0-03 saving waits for slow image decoding instead of silently dropping selected files", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = window.createImageBitmap.bind(window);
    window.createImageBitmap = (async (
      ...args: Parameters<typeof createImageBitmap>
    ) => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return original(...args);
    }) as typeof createImageBitmap;
  });
  await details(page);
  await consent(page);
  await page
    .getByLabel("Test images", { exact: true })
    .setInputFiles(images(2));
  await expect(
    page.getByRole("button", { name: /Save test request/ }),
  ).toBeDisabled();
  await expect(page.getByText("2 / 4 images", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /Save test request/ }).click();
  await expect(page.getByTestId("lead-id")).toBeVisible();
  await page.reload();
  await expect(page.getByText("2 / 4 images", { exact: true })).toBeVisible();
});

for (const width of [390, 1440]) {
  test(`P0 lifecycle: withdraw ${width}px erases four images, retries lost response and starts with new consent`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await details(page);
    await page
      .getByLabel("Test images", { exact: true })
      .setInputFiles(images(4));
    await consent(page);
    await page.getByRole("button", { name: /Save test request/ }).click();
    const leadId = await page.getByTestId("lead-id").textContent();
    await expect(page.getByTestId("lead-id")).toBeVisible();
    let lost = false;
    await page.route("**/api/pilot/session", async (route) => {
      if (route.request().method() === "DELETE" && !lost) {
        lost = true;
        const response = await route.fetch();
        expect(response.status()).toBe(200);
        await route.abort("failed");
      } else await route.continue();
    });
    const withdraw = page.getByRole("button", {
      name: /Withdraw consent and delete test data/,
    });
    await withdraw.click();
    await expect(page.getByRole("status").first()).toContainText(
      /fetch|Failed|failed/,
    );
    await expect(withdraw).toBeEnabled();
    await withdraw.click();
    await expect(page.getByRole("status").first()).toContainText(
      "Consent withdrawn",
    );
    await expect(page.getByTestId("lead-id")).toHaveCount(0);
    await page.screenshot({
      path: `${output}/withdrawal-${width}.png`,
      fullPage: true,
    });
    await page.reload();
    await expect(
      page.getByRole("button", { name: "Reopen saved request", exact: true }),
    ).toHaveCount(0);
    await page
      .getByRole("button", { name: "Fill synthetic test details" })
      .click();
    await consent(page);
    await page.getByRole("button", { name: /Save test request/ }).click();
    await expect(page.getByTestId("lead-id")).toBeVisible();
    expect(await page.getByTestId("lead-id").textContent()).not.toBe(leadId);
  });
}

test("P0 lifecycle: a delayed contact event cannot overwrite withdrawal or poison the next request", async ({
  page,
}) => {
  await details(page);
  await consent(page);
  await page.getByRole("button", { name: /Save test request/ }).click();
  await expect(page.getByTestId("lead-id")).toBeVisible();
  const oldId = await page.getByTestId("lead-id").textContent();
  const paused = deferred(),
    release = deferred();
  let held = false;
  await page.route("**/api/pilot/events", async (route) => {
    if (!held) {
      held = true;
      paused.resolve();
      await release.promise;
    }
    await route.continue();
  });
  await page
    .locator("#contact")
    .getByRole("link", { name: "@middleproperty", exact: true })
    .click();
  await paused.promise;
  await page
    .getByRole("button", { name: /Withdraw consent and delete test data/ })
    .click();
  await expect(page.getByRole("status").first()).toContainText(
    "Consent withdrawn",
  );
  release.resolve();
  await page
    .getByRole("button", { name: "Fill synthetic test details" })
    .click();
  await consent(page);
  await page.getByRole("button", { name: /Save test request/ }).click();
  await expect(page.getByTestId("lead-id")).toBeVisible();
  expect(await page.getByTestId("lead-id").textContent()).not.toBe(oldId);
});

```


## scripts/verify-readiness.mjs
SHA-256: c23691ba86185eafe1139a7c901cc6f3743acff9497a9df94b33f48e2fd907b3
```
import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  copyFileSync,
} from "node:fs";
import { resolve, join } from "node:path";
import { createHash } from "node:crypto";
const git = (...args) => {
  const result = spawnSync("git", args, { encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr);
  return result.stdout.trim();
};
if (git("status", "--porcelain", "--untracked-files=no"))
  throw new Error("Commit source changes before exact-SHA verification.");
const untracked = git("ls-files", "--others", "--exclude-standard")
  .split("\n")
  .filter(Boolean);
if (untracked.some((path) => !path.startsWith("output/")))
  throw new Error(
    "Untracked files outside the evidence output directory invalidate source verification.",
  );
const sha = git("rev-parse", "HEAD"),
  directory = resolve("output/readiness", sha);
mkdirSync(directory, { recursive: true });
const manifest = {
  repository: "https://github.com/arithachboss-cmyk/lilith",
  branch: git("branch", "--show-current"),
  source_sha: sha,
  started_at: new Date().toISOString(),
  mock_data: true,
  production_published: false,
  real_leads_enabled: false,
  paid_traffic: false,
  google_ads: false,
  node: process.version,
  browser_channel: process.env.PLAYWRIGHT_CHANNEL ?? "chromium",
  steps: [],
  artifacts: [],
};
for (const [label, args] of [
  ["typecheck", ["typecheck"]],
  ["lint", ["lint"]],
  ["unit", ["test:unit"]],
  ["build", ["build"]],
  ["integration", ["test:integration"]],
  ["browser", ["test:e2e"]],
]) {
  const started = new Date().toISOString();
  console.log(`RUN ${label} ${sha}`);
  const result = spawnSync("pnpm", args, {
    env: { ...process.env, MIDDLE_BUILD_SHA: sha },
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
  const log = `Command: pnpm ${args.join(" ")}\nSource SHA: ${sha}\nStarted: ${started}\n${result.stdout ?? ""}\n${result.stderr ?? ""}\nExit code: ${result.status}\n`;
  writeFileSync(join(directory, `${label}.log`), log);
  manifest.steps.push({
    label,
    command: `pnpm ${args.join(" ")}`,
    exit_code: result.status,
    log: `${label}.log`,
    sha256: createHash("sha256").update(log).digest("hex"),
  });
  console.log(`${result.status === 0 ? "PASS" : "REVISE"} ${label}`);
  if (result.status !== 0) {
    manifest.completed_at = new Date().toISOString();
    writeFileSync(
      join(directory, "manifest.json"),
      JSON.stringify(manifest, null, 2),
    );
    console.error(log);
    process.exit(1);
  }
}
for (const name of readdirSync("output/playwright/readiness")) {
  if (!name.endsWith(".png")) continue;
  const bytes = readFileSync(join("output/playwright/readiness", name));
  copyFileSync(
    join("output/playwright/readiness", name),
    join(directory, name),
  );
  manifest.artifacts.push({
    file: name,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    mock_data: true,
  });
}
manifest.completed_at = new Date().toISOString();
manifest.result = "PASS — Codex local mock verification only";
writeFileSync(
  join(directory, "manifest.json"),
  JSON.stringify(manifest, null, 2) + "\n",
);
console.log(
  JSON.stringify({
    source_sha: sha,
    evidence: directory,
    result: manifest.result,
  }),
);

```


## docs/READINESS_ARCHITECTURE.md
SHA-256: a0975cd76ad2019c2aeec49b97ae8feb2619e48f35d07fc66ea2e5c986d4c000
```
# Middle Property — readiness implementation contract

Owner: Arithach. Brand: Middle Property. LINE OA: `@middleproperty`. Business telephone `0933888594` was supplied by the Owner in this execution session. Neither the telephone nor OA handle authorizes a notification recipient or an operator identity.

## Scope and inherited baseline

The dedicated branch snapshots the existing uncommitted application as baseline commit `1fdae50`; `READINESS_BASELINE.json` identifies inherited files. Readiness changes are a separate subsequent commit. The original workspace and production were not modified. The inherited matching application continues to have regression coverage.

The existing Landing is `public/current-home.html`, served by the Worker at `/`. Its contact paths now use canonical contacts and preserve UTM into `/pilot`. `/lead-form` redirects to the mock requirement journey. `/pilot/inbox` is its Operations surface. This is a separate, reviewable `pilot_*` data namespace, not a certification of the legacy lead/import or agent-photo implementation.

## No real data or delivery path

- Pilot APIs return 503 unless the server binding is exactly `MIDDLE_READINESS_MODE=mock`.
- Requests require literal `mock_data:true`, synthetic `TEST ` names and `@example.test` email addresses. There is no mode that enables real lead intake in this build.
- All legacy lead writes/imports are closed both at Worker ingress and inside route handlers; alternate URL spellings are covered.
- LINE/call clicks in this preview are simulated. Canonical hrefs are inspectable, but click handlers do not contact the number or OA.
- No notification network client exists. Outbox destination is database-constrained to `mock://middle-property-operations`. `sent:false` is explicit. Owner authorization remains false.
- No publishing, DNS, domain, email, billing or paid-traffic operation belongs to this change.

## Persistence and idempotency

Migration `drizzle/0008_readiness.sql` is an additive, manually authored SQL migration registered in the ordered migration journal. Its SQL constraints and triggers are authoritative; the existing Drizzle ORM schema/snapshot does not model these new raw-SQL tables. Do not regenerate or replace the migration without reviewing this distinction.

`pilot_drafts` binds one UUID to a SHA-256 hash of a random 256-bit browser capability, versioned affirmative consent, consent time, expiry and `mock_data=1`. The capability is stored only in same-tab sessionStorage, never in a URL or log. Before consent, form values and image previews remain in memory; analytics events also remain in memory.

`pilot_leads` has a unique draft foreign key and a separate random `MP-UUID` Lead ID. A strict, normalized payload hash detects changed-payload retries. One D1 batch commits the lead, its one unique outbox item and the server-side submit event. Lost responses return the original Lead ID; rollback leaves no partial lead/outbox. The public capability can reopen only its own draft. Lead IDs alone grant no access.

`pilot_images` stores private image bytes and metadata in the same database, capped at 4 rows per draft by a database trigger. Bytes and references cannot become separated across external storage writes. Upload IDs are stable across retries; different content cannot reuse an ID. Images are immutable after lead creation; order and removal before finalization are transactional. Images are limited to 128 KiB each in this mock preview. Only non-interlaced 8-bit PNG is supported in this test cycle. Browser decoding plus server PNG CRC and bounded zlib scanline validation reject malformed inputs, invalid filters and decompression-size overflow. JPEG, WebP, SVG and HTML are rejected. Production media storage/scanning is not certified by this implementation.

## Authorization and operations

The mock harness supplies the synthetic `TEST-operations` identity and allowlist. Product code contains no default allowed identity. The inbox requires a nonempty server-side `MIDDLE_OPERATIONS_USER_IDS` allowlist and trusted authenticated ingress. Mutations additionally require same-origin requests. No Owner account is inferred from a phone, OA, GitHub login or self-selected platform role.

Hosted header integrity, direct-Worker ingress exclusion, actual operator IDs and the approved notification destination remain unverified. Those are release blockers. This leadership round removes raw-header trust from all five readers: pilot Operations, matching platform identity, legacy lead authorization, agent/photo authorization and SSR. `src/services/identity.ts` accepts only a request-bound HMAC assertion in mock mode on an HTTP loopback URL with a runtime ephemeral key. The test helper signs these assertions; raw `dispatch()` never signs. The browser test adapter deliberately signs synthetic header identities and is not hosted authentication evidence. `src/services/request-identity.ts` provides AsyncLocalStorage context verified at Worker ingress; SSR never derives authorization from request headers. No production identity adapter is enabled. Even legitimate Sites users remain unauthorized by this source until the separate adapter is implemented and verified.

Sites authentication documentation describes dispatcher-provided identity headers but supplies no verifiable assertion format in this environment. A hostname or trust flag alone is insufficient. `READINESS_HOSTING_SNAPSHOT.json` records a read-only observation of the existing public Site at version 14. It does not associate that deployment with this readiness source or prove ingress integrity. Existing Site access and deployment were not changed.

Operators move requests from pending review to qualified to viewing-ready, supplying a viewing window. Compare-and-set updates plus a database trigger prevent stale concurrent downgrade. Milestone events persist the operator identity and lead correlation. Viewing-ready means a mock request is prepared for follow-up; no property availability, appointment or real booking is guaranteed.

## Attribution and privacy

Allowlisted events: page_view, form_start, form_submit, line_click, call_click, qualified_lead, viewing_request. They are alternative/branching user actions, not a claim that every customer must click both LINE and Call. Events preserve source, medium, campaign, landing locale, first touch and last touch. They store no arbitrary event metadata or raw URL/query. Client contact clicks cannot forge server-generated qualification/viewing milestones. Repeated event IDs deduplicate; a single serialized browser flush prevents queue loss.

Capability and mock-content access expire in 24 hours. `0009_pilot_lifecycle.sql` adds terminal receipts and database triggers preventing writes against expired or erased drafts. The capability-scoped DELETE session endpoint records withdrawal/deletion and erases lead, outbox, events and images atomically. It deletes the lead before the draft to preserve the finalized-image immutability rules. A minimal receipt retains the draft UUID, capability hash, reason and time until isolated test-namespace teardown; it contains no form, image, contact or attribution content. It prevents retries from recreating the erased request, including old-token/new-ID and old-ID/new-token variants. Receipts are metadata, not anonymous data, and their production retention remains undecided.

The authorized mock maintenance endpoint processes up to 100 expired drafts per batch. The loopback test server invokes it on startup and every 60 seconds; the entire temporary database is removed on shutdown. Operator inbox/image/progression queries hide expired content immediately. No hosted retention scheduler is configured or claimed. UI withdrawal retains the capability after failure so a lost-response retry can retrieve the existing receipt, then clears browser content after confirmed erasure.

Same-tab refresh/reopen is supported; closing the browser/tab removes the session capability. Authorized Operations can reopen the persisted record separately. Local verification uses temporary SQLite files removed when the test server exits, including staged test images. The mock lifecycle implementation does not approve real-data retention periods, receipt retention, identity recovery, backup erasure, rate limits, abuse protection or hosted storage controls; these remain release requirements.

Saving, image processing and record restoration exclude competing Reopen/New actions with both immediate handler guards and disabled controls. Consent/image controls keep their layout during submission so a rapid second click cannot land on an action shifted into the Save button's position. Restoration has an explicit loading state until all image bodies and record fields are ready. This closes two independently reproduced races in source `8bd0e3d7`: a concurrent empty draft reopen could replace staged images before upload, or a delayed reopen response could hide images after a successful save. Previous evidence for that source remains historical; the fixed source requires its own exact-SHA verification.

## Reproduce

Use Node 24 and the committed pnpm lockfile. On a clean checkout run `pnpm install --frozen-lockfile`, then `node scripts/verify-readiness.mjs`. Install Playwright Chromium first; on this Mac `PLAYWRIGHT_CHANNEL=chrome` selects installed Chrome. The script builds with the exact commit SHA and writes logs, screenshots and checksums under `output/readiness/<SHA>/`.

`GET /api/pilot/build` exposes the baked source SHA and closed real-lead/traffic flags. Local preview: after building, run `node tests/e2e/server.mjs` and open `http://127.0.0.1:4199/pilot`; stop the server to delete the test database. It is bound to loopback only and is not an externally reachable preview. Never forward this test ingress to the internet because its synthetic identity signing is intentionally test-only.

Manus must independently reproduce the exact SHA and report PASS/REVISE/BLOCKED with artifacts. Claude must return APPROVE/REVISE/BLOCK with source references. Internal Codex reviews do not count as either reviewer.

```


## docs/READINESS_HOSTING_SNAPSHOT.json
SHA-256: 0222734f40b8e97680f0fb30ea7009dae25faf348bb258e271cf738e248eeb2d
```
{
  "observed_at": "2026-09-12T22:13:42Z",
  "source_tool": "Sites get_site (read-only)",
  "project_id": "appgprj_6a8856b74a948191bd05a5ca442a8941",
  "current_user_role": "owner",
  "access_mode": "public",
  "current_live_url": "https://lilith-renter-leads.yacht369.chatgpt.site",
  "latest_version_number": 14,
  "auth_client_configured": true,
  "allowed_account_count": 1,
  "external_visitor_count": 0,
  "identity_integrity_proven": false,
  "operations_authorization_inferred": false,
  "publication_performed": false,
  "redactions": "Credential, bypass token, signed screenshot URL, account identifiers and email addresses intentionally omitted."
}

```


## OWNER_DECISION_PACKET.md
SHA-256: 2e5d96d20f760e4d212642e926debea6f54c78305f9d15ef7d5a8d8da9fe8e76
```
# Middle Property — decisions for the Owner

Current recommendation: **NO-GO FOR REAL LEADS**. This packet is a proposal, not approval or activation.

Confirmed contacts: **Middle Property**, LINE OA **@middleproperty**, business phone **0933888594**. The phone has already been supplied; it is not being requested again. It does not identify a notification transport or grant an Operations account access.

## 1. Operations destination and people

Recommended initial scope: Arithach as the only pilot operator, with one destination controlled by the Owner. Additional operators can be named explicitly. No account has been authorized or configured by inference.

Owner to specify:

- Where the generated lead notice should arrive: the exact controlled LINE destination, business inbox, or another named destination. A LINE OA handle is a contact path; an outbound messaging destination and its credentials still need verified integration.
- Which actual accounts may open the lead record, and whether each can only read or also qualify and prepare a viewing.

Implementation follows these decisions: verify the identity provider and site-scoped account IDs; enforce the approved role list; build the approved notification transport; verify the same Lead ID from creation to the authorized record. Credentials belong in server-managed runtime storage, never in chat, Git or browser code. Mock tests continue until authorization is complete.

## 2. Real-data lifecycle policy

Owner to specify the permitted retention period for lead details, images and attribution; the retention of consent/erasure receipts; the person responsible for withdrawal/deletion requests; and any required exceptions and backup/log handling. These are business/governance decisions, not invented legal requirements.

The current **test-only** policy is concrete: hide content at the 24-hour draft deadline; erase due content through the local maintenance sweep; allow capability-scoped withdrawal or deletion; retain only a minimal replay-prevention receipt until the isolated test database is destroyed. The test policy does not become a real-data policy automatically. No hosted retention scheduler is configured.

## 3. Pilot approval — request only after the gates pass

The proposed later pilot remains 5–10 real leads through Organic / Direct / Owner-controlled traffic, after all P0 evidence passes, Manus passes the exact source, Claude has no BLOCK, the approved destination and operators are verified, and the Owner explicitly approves activation.

`PAID_TRAFFIC:false` · `GOOGLE_ADS:false` · `MASS_CAMPAIGN:false`

Do not approve activation based on this packet alone. The final technical report and independent reviews must be available first. Existing public hosting was observed read-only; no publication, access policy, DNS/domain/email configuration or real customer interaction was performed in this round.

```
