# Claude supplemental evidence — same immutable source 8bd0e3d7a223db392e55c5f2533451bff716a464
No product code changed. CI controller commit 188293234bfa1004233b36871e10d0e51e88020e checks out and tests source8bd. Origin CI passed: https://github.com/arithachboss-cmyk/lilith/actions/runs/34720524952


## src/services/platform/http.ts
SHA256: 629ec140b8820c7bb2de780bd1f962f5908162922720f70f3287967adee2177e
```
import { z } from "zod";
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}
export const json = (data: unknown, status = 200) =>
  Response.json(
    { data },
    {
      status,
      headers: {
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        Vary: "Cookie, oai-authenticated-user-id",
      },
    },
  );
export async function endpoint(
  action: () => Promise<Response>,
): Promise<Response> {
  const requestId = crypto.randomUUID();
  try {
    return await action();
  } catch (error) {
    const known = error instanceof ApiError;
    const validation = error instanceof z.ZodError;
    if (!known && !validation)
      console.error("platform_request_failed", {
        requestId,
        type: error instanceof Error ? error.name : "UnknownError",
      });
    return Response.json(
      {
        error: {
          code: known
            ? error.code
            : validation
              ? "VALIDATION_ERROR"
              : "INTERNAL_ERROR",
          message: known
            ? error.message
            : validation
              ? "Please check the submitted fields"
              : "The request could not be completed. Please retry.",
          requestId,
          ...(validation
            ? {
                fields: error.issues.map((issue) => ({
                  path: issue.path.join("."),
                  message: issue.message,
                })),
              }
            : {}),
        },
      },
      {
        status: known ? error.status : validation ? 422 : 500,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
export function assertSameOrigin(request: Request): void {
  // Browser-only session mutations require Origin. Non-browser trusted callers must supply it too.
  if (
    request.headers.get("origin") !== new URL(request.url).origin ||
    request.headers.get("sec-fetch-site") === "cross-site"
  ) {
    throw new ApiError(
      403,
      "INVALID_ORIGIN",
      "This action must be submitted from this site",
    );
  }
}
const MAX_JSON_BYTES = 32768;
export async function input<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<T> {
  assertSameOrigin(request);
  if (
    request.headers.get("content-type")?.split(";")[0].trim() !==
    "application/json"
  )
    throw new ApiError(415, "CONTENT_TYPE", "Send application/json");
  if (!request.body)
    throw new ApiError(400, "INVALID_JSON", "A JSON body is required");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_JSON_BYTES) {
        await reader.cancel();
        throw new ApiError(413, "BODY_TOO_LARGE", "The request is too large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const buffer = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.length;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder().decode(buffer));
  } catch {
    throw new ApiError(400, "INVALID_JSON", "The request is not valid JSON");
  }
  return schema.parse(parsed);
}

```


## src/services/platform/auth.ts
SHA256: a7728ee6ad633901b16b22850c10d7daf91ff82f0e44771c4d1482d1c6618b39
```
import { z } from "zod";
import {
  profileInput,
  roleSchema,
  type Actor,
  type ProfileInput,
} from "../../domain/platform/contracts";
import { audit, database, event, now, statement } from "./database";
import { ApiError } from "./http";
const identitySchema = z.object({
  id: z.string().min(1).max(200),
  email: z.email().max(254),
});
/** Only trust these headers behind the Sites dispatcher. No direct public Worker ingress. */
export function identity(request: Request) {
  const parsed = identitySchema.safeParse({
    id: request.headers.get("oai-authenticated-user-id"),
    email: request.headers.get("oai-authenticated-user-email"),
  });
  if (!parsed.success)
    throw new ApiError(401, "UNAUTHENTICATED", "Sign in to continue");
  return parsed.data;
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
  const account = identity(request);
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
  const account = identity(request);
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
SHA256: ed086838021295b39750e89f4321614f945c70c0572810d5208d9b063e4a7b0f
```
import { env } from "cloudflare:workers";

export function isAuthenticated(request: Request) {
  // Legacy name retained for API compatibility; this is operator authorization.
  const manager = String(env.LILITH_ADMIN_EMAIL ?? "").trim().toLowerCase();
  return Boolean(
    manager &&
    request.headers.get("oai-authenticated-user-id") &&
      request.headers.get("oai-authenticated-user-email")?.trim().toLowerCase() === manager,
  );
}

export function hasImportToken(request: Request) {
  const expected = String(env.LEAD_IMPORT_TOKEN ?? "").trim();
  if (!expected) return false;

  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  const headerToken = request.headers.get("x-lilith-import-token")?.trim();

  return Boolean((bearer && bearer === expected) || (headerToken && headerToken === expected));
}

export function canImportLeads(request: Request) {
  return isAuthenticated(request) || hasImportToken(request);
}

```


## app/api/leads/storage.ts
SHA256: 6f168f3ddda223f9718413442d40894c43bb8333036730b0cf3f7a39e0404e4c
```
import { env } from "cloudflare:workers";
import type { LeadUpdatePayload, NormalizedLead } from "./validation";

const createTableSql = `
CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  contact TEXT,
  source TEXT NOT NULL,
  budget INTEGER NOT NULL,
  budget_period TEXT,
  area TEXT NOT NULL,
  property_type TEXT,
  bedrooms INTEGER,
  move_date TEXT,
  viewing_window TEXT,
  contract_term TEXT,
  preferred_language TEXT,
  customer_country TEXT,
  deal_intent TEXT,
  wechat TEXT,
  partner_agency TEXT,
  partner_agent TEXT,
  partner_contact TEXT,
  external_id TEXT,
  import_batch TEXT,
  pets TEXT,
  requirements TEXT,
  consent_at TEXT,
  spam_signal TEXT,
  stage TEXT NOT NULL,
  next_follow_up_at TEXT,
  updated_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;

const optionalColumns = [
  ["contact", "ALTER TABLE leads ADD COLUMN contact TEXT"],
  ["budget_period", "ALTER TABLE leads ADD COLUMN budget_period TEXT"],
  ["property_type", "ALTER TABLE leads ADD COLUMN property_type TEXT"],
  ["bedrooms", "ALTER TABLE leads ADD COLUMN bedrooms INTEGER"],
  ["viewing_window", "ALTER TABLE leads ADD COLUMN viewing_window TEXT"],
  ["contract_term", "ALTER TABLE leads ADD COLUMN contract_term TEXT"],
  ["preferred_language", "ALTER TABLE leads ADD COLUMN preferred_language TEXT"],
  ["customer_country", "ALTER TABLE leads ADD COLUMN customer_country TEXT"],
  ["deal_intent", "ALTER TABLE leads ADD COLUMN deal_intent TEXT"],
  ["wechat", "ALTER TABLE leads ADD COLUMN wechat TEXT"],
  ["partner_agency", "ALTER TABLE leads ADD COLUMN partner_agency TEXT"],
  ["partner_agent", "ALTER TABLE leads ADD COLUMN partner_agent TEXT"],
  ["partner_contact", "ALTER TABLE leads ADD COLUMN partner_contact TEXT"],
  ["external_id", "ALTER TABLE leads ADD COLUMN external_id TEXT"],
  ["import_batch", "ALTER TABLE leads ADD COLUMN import_batch TEXT"],
  ["pets", "ALTER TABLE leads ADD COLUMN pets TEXT"],
  ["requirements", "ALTER TABLE leads ADD COLUMN requirements TEXT"],
  ["consent_at", "ALTER TABLE leads ADD COLUMN consent_at TEXT"],
  ["spam_signal", "ALTER TABLE leads ADD COLUMN spam_signal TEXT"],
  ["next_follow_up_at", "ALTER TABLE leads ADD COLUMN next_follow_up_at TEXT"],
  ["updated_at", "ALTER TABLE leads ADD COLUMN updated_at TEXT"],
] as const;

const createCreatedAtIndexSql = `
CREATE INDEX IF NOT EXISTS idx_leads_created_at
ON leads(created_at)`;

const createExternalIdIndexSql = `
CREATE INDEX IF NOT EXISTS idx_leads_external_id
ON leads(external_id)`;

export const leadSelectColumns = `
  id, name, contact, source, budget, budget_period AS budgetPeriod, area,
  property_type AS propertyType, bedrooms, move_date AS moveDate,
  viewing_window AS viewingWindow, contract_term AS contractTerm,
  preferred_language AS preferredLanguage, customer_country AS customerCountry,
  deal_intent AS dealIntent, wechat, partner_agency AS partnerAgency,
  partner_agent AS partnerAgent, partner_contact AS partnerContact,
  external_id AS externalId, import_batch AS importBatch, pets, requirements,
  consent_at AS consentAt, stage, next_follow_up_at AS nextFollowUpAt,
  updated_at AS updatedAt, created_at AS createdAt`;

export async function ensureLeadSchema() {
  await env.DB.batch([
    env.DB.prepare(createTableSql),
    env.DB.prepare(createCreatedAtIndexSql),
  ]);
  for (const [columnName, sql] of optionalColumns) {
    await addColumnIfMissing(columnName, sql);
  }
  await env.DB.prepare(createExternalIdIndexSql).run();
}

async function addColumnIfMissing(columnName: string, sql: string) {
  const existing = await env.DB.prepare("PRAGMA table_info(leads)").all();
  const hasColumn = (existing.results ?? []).some(
    (column) => String(column.name) === columnName,
  );
  if (!hasColumn) await env.DB.prepare(sql).run();
}

function nullable(value: string | number | null | undefined) {
  return value === undefined ? null : value;
}

export async function listLeads(limit = 200) {
  return env.DB.prepare(
    `SELECT ${leadSelectColumns}
     FROM leads
     ORDER BY created_at DESC
     LIMIT ?`,
  )
    .bind(limit)
    .all();
}

export async function insertLead(lead: NormalizedLead) {
  return env.DB.prepare(
    `INSERT INTO leads (
       name, contact, source, budget, budget_period, area, property_type, bedrooms,
       move_date, viewing_window, contract_term, preferred_language,
       customer_country, deal_intent, wechat, partner_agency, partner_agent,
       partner_contact, external_id, import_batch, pets, requirements,
       consent_at, stage, created_at, updated_at
     )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     RETURNING ${leadSelectColumns}`,
  )
    .bind(
      lead.name,
      lead.contact,
      lead.source,
      lead.budget,
      lead.budgetPeriod,
      lead.area,
      lead.propertyType,
      nullable(lead.bedrooms),
      nullable(lead.moveDate),
      nullable(lead.viewingWindow),
      lead.contractTerm,
      lead.preferredLanguage,
      nullable(lead.customerCountry),
      lead.dealIntent,
      nullable(lead.wechat),
      nullable(lead.partnerAgency),
      nullable(lead.partnerAgent),
      nullable(lead.partnerContact),
      nullable(lead.externalId),
      nullable(lead.importBatch),
      nullable(lead.pets),
      nullable(lead.requirements),
      lead.stage,
    )
    .first();
}

export async function updateLeadProgress(update: Required<LeadUpdatePayload>) {
  return env.DB.prepare(
    `UPDATE leads
     SET stage = ?, next_follow_up_at = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?
     RETURNING ${leadSelectColumns}`,
  )
    .bind(update.stage, update.nextFollowUpAt, update.id)
    .first();
}

export async function deleteTestLeads() {
  return env.DB.prepare(
    "DELETE FROM leads WHERE name LIKE 'TEST%' OR source LIKE '%smoke%' OR import_batch LIKE 'TEST%'",
  ).run();
}

```


## app/api/leads/validation.ts
SHA256: 6f2b11f4fa35da38ada0e827c3b8b9d52a9ede0aa0f9cb656c9b7062fd2ab9c6
```
export type LeadPayload = {
  name?: string;
  contact?: string;
  source?: string;
  budget?: number | string;
  budgetPeriod?: string;
  area?: string;
  propertyType?: string;
  bedrooms?: number | string;
  moveDate?: string;
  viewingWindow?: string;
  contractTerm?: string;
  preferredLanguage?: string;
  customerCountry?: string;
  dealIntent?: string;
  wechat?: string;
  partnerAgency?: string;
  partnerAgent?: string;
  partnerContact?: string;
  externalId?: string;
  importBatch?: string;
  pets?: string;
  requirements?: string;
  consent?: boolean;
  website?: string;
  stage?: string;
};

export type NormalizedLead = {
  name: string;
  contact: string;
  source: string;
  budget: number;
  budgetPeriod: string;
  area: string;
  propertyType: string;
  bedrooms: number | null;
  moveDate: string | null;
  viewingWindow: string | null;
  contractTerm: string;
  preferredLanguage: string;
  customerCountry: string | null;
  dealIntent: string;
  wechat: string | null;
  partnerAgency: string | null;
  partnerAgent: string | null;
  partnerContact: string | null;
  externalId: string | null;
  importBatch: string | null;
  pets: string | null;
  requirements: string | null;
  stage: string;
};

export const monthlyBudgetRange = {
  min: 30000,
  max: 250000,
} as const;

export const purchaseBudgetRange = {
  min: 1000000,
  max: 250000000,
} as const;

export const listingValueRange = {
  min: 1000000,
  max: 500000000,
} as const;

export const leadStages = [
  "New inquiry",
  "Qualified",
  "Shortlist sent",
  "Viewing booked",
  "Offer submitted",
  "Deposit pending",
  "Won",
  "Lost",
] as const;

export const leadIntents = [
  "Rent 12-month",
  "Buy condo",
  "Sell/List property",
  "China agent referral",
] as const;

export const budgetPeriods = [
  "Monthly rent",
  "Purchase budget",
  "Listing value",
] as const;

export type LeadUpdatePayload = {
  id?: number | string;
  stage?: string;
  nextFollowUpAt?: string | null;
};

function normalizeStage(value: unknown) {
  const stage = String(value ?? "New inquiry").trim();
  return leadStages.includes(stage as (typeof leadStages)[number]) ? stage : null;
}

function clean(value: unknown, maxLength: number) {
  return String(value ?? "").trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function optional(value: unknown, maxLength: number) {
  return clean(value, maxLength) || null;
}

function normalizedNeedle(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeDealIntent(value: unknown) {
  const intent = clean(value, 80);
  const key = intent.toLowerCase();

  if (
    key.includes("buy") ||
    key.includes("purchase") ||
    key.includes("invest") ||
    key.includes("ซื้อ") ||
    key.includes("买") ||
    key.includes("购买") ||
    key.includes("куп")
  ) {
    return "Buy condo";
  }

  if (
    key.includes("sell") ||
    key.includes("list") ||
    key.includes("owner") ||
    key.includes("ขาย") ||
    key.includes("业主") ||
    key.includes("прод")
  ) {
    return "Sell/List property";
  }

  if (
    key.includes("china") ||
    key.includes("chinese") ||
    key.includes("broker") ||
    key.includes("agent referral") ||
    key.includes("wechat") ||
    key.includes("จีน") ||
    key.includes("中国") ||
    key.includes("中介")
  ) {
    return "China agent referral";
  }

  if (intent && !key.includes("rent") && !key.includes("lease") && !key.includes("เช่า")) {
    return null;
  }

  return "Rent 12-month";
}

function normalizeBudgetPeriod(value: unknown, dealIntent: string, budget: number) {
  const key = normalizedNeedle(value);

  if (
    key.includes("listing") ||
    key.includes("sale value") ||
    key.includes("asset") ||
    key.includes("ประกาศขาย") ||
    key.includes("ขาย")
  ) {
    return "Listing value";
  }

  if (
    key.includes("purchase") ||
    key.includes("buy") ||
    key.includes("investment") ||
    key.includes("total") ||
    key.includes("ซื้อ")
  ) {
    return "Purchase budget";
  }

  if (
    key.includes("month") ||
    key.includes("rent") ||
    key.includes("lease") ||
    key.includes("เช่า") ||
    key.includes("เดือน") ||
    key.includes("月")
  ) {
    return "Monthly rent";
  }

  if (dealIntent === "Buy condo") return "Purchase budget";
  if (dealIntent === "Sell/List property") return "Listing value";
  if (dealIntent === "China agent referral" && budget >= purchaseBudgetRange.min) {
    return "Purchase budget";
  }
  return "Monthly rent";
}

function normalizeContractTerm(value: unknown, budgetPeriod: string) {
  const term = clean(value, 40);
  if (budgetPeriod !== "Monthly rent") return term || "Not applicable";
  if (!term || term === "1 year" || term === "one year" || term === "12 month") {
    return "12 months";
  }
  return term;
}

function budgetInRange(budget: number, budgetPeriod: string) {
  if (!Number.isFinite(budget)) return false;
  if (budgetPeriod === "Listing value") {
    return budget >= listingValueRange.min && budget <= listingValueRange.max;
  }
  if (budgetPeriod === "Purchase budget") {
    return budget >= purchaseBudgetRange.min && budget <= purchaseBudgetRange.max;
  }
  return budget >= monthlyBudgetRange.min && budget <= monthlyBudgetRange.max;
}

function normalizeBedrooms(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  const bedrooms = Number(value);
  if (!Number.isInteger(bedrooms) || bedrooms < 0 || bedrooms > 8) return null;
  return bedrooms;
}

function normalizeLeadCore(payload: LeadPayload, trustedSource: boolean) {
  const spamSignal = clean(payload.website, 120);
  if (spamSignal) return { spam: true } as const;

  const name = clean(payload.name, 120);
  const contact = clean(payload.contact, 160);
  const source = clean(payload.source ?? "Public capture URL", 140);
  const area = clean(payload.area, 140);
  const propertyType = clean(payload.propertyType, 60);
  const preferredLanguage = clean(payload.preferredLanguage, 50);
  const customerCountry = optional(payload.customerCountry, 80);
  const dealIntent = normalizeDealIntent(payload.dealIntent);
  const stage = trustedSource ? normalizeStage(payload.stage) : "New inquiry";
  const budget = Number(payload.budget);
  const budgetPeriod = dealIntent
    ? normalizeBudgetPeriod(payload.budgetPeriod, dealIntent, budget)
    : null;
  const contractTerm = budgetPeriod
    ? normalizeContractTerm(payload.contractTerm, budgetPeriod)
    : "";
  const bedrooms = normalizeBedrooms(payload.bedrooms);
  const wechat = optional(payload.wechat, 80);
  const partnerContact = optional(payload.partnerContact, 160);
  const primaryContact = contact || wechat || partnerContact || "";

  if (
    name.length < 2 ||
    primaryContact.length < 3 ||
    source.length < 2 ||
    area.length < 2 ||
    !propertyType ||
    !preferredLanguage ||
    !dealIntent ||
    !budgetPeriod ||
    !budgetInRange(budget, budgetPeriod) ||
    (budgetPeriod === "Monthly rent" && contractTerm !== "12 months") ||
    (!trustedSource && payload.consent !== true) ||
    !stage
  ) {
    return null;
  }

  return {
    name,
    contact: primaryContact,
    source,
    budget: Math.round(budget),
    budgetPeriod,
    area,
    propertyType,
    bedrooms,
    moveDate: optional(payload.moveDate, 20),
    viewingWindow: optional(payload.viewingWindow, 80),
    contractTerm,
    preferredLanguage,
    customerCountry,
    dealIntent,
    wechat,
    partnerAgency: optional(payload.partnerAgency, 120),
    partnerAgent: optional(payload.partnerAgent, 120),
    partnerContact,
    externalId: optional(payload.externalId, 120),
    importBatch: optional(payload.importBatch, 120),
    pets: optional(payload.pets, 80),
    requirements: optional(payload.requirements, 800),
    stage,
  } satisfies NormalizedLead;
}

export function normalizeLead(payload: LeadPayload, authenticated: boolean) {
  return normalizeLeadCore(payload, authenticated);
}

export function normalizeImportedLead(payload: LeadPayload) {
  return normalizeLeadCore(payload, true);
}

export function normalizeLeadUpdate(payload: LeadUpdatePayload) {
  const id = Number(payload.id);
  const stage = normalizeStage(payload.stage);
  const nextFollowUpAt = String(payload.nextFollowUpAt ?? "").trim().slice(0, 32) || null;

  if (
    !Number.isInteger(id) ||
    id < 1 ||
    !stage ||
    (nextFollowUpAt && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(nextFollowUpAt))
  ) {
    return null;
  }

  return { id, stage, nextFollowUpAt };
}

```


## tests/helpers/synthetic-image.mjs
SHA256: 256ed812dad2a7c5bb01fe6e32f44295ba220763163e96c91a1b2caa43fed283
```
import { deflateSync } from "node:zlib";
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const b of bytes) {
    crc ^= b;
    for (let k = 0; k < 8; k++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, bytes) {
  const label = Buffer.from(type),
    length = Buffer.alloc(4),
    crc = Buffer.alloc(4);
  length.writeUInt32BE(bytes.length);
  crc.writeUInt32BE(crc32(Buffer.concat([label, bytes])));
  return Buffer.concat([length, label, bytes, crc]);
}
// Synthetic 8×8 RGB swatches; no real photograph, person, address or property.
export function syntheticPng(color = 0) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(8, 0);
  header.writeUInt32BE(8, 4);
  header[8] = 8;
  header[9] = 2;
  const pixels = Buffer.alloc(8 * (1 + 8 * 3));
  for (let row = 0; row < 8; row++)
    for (let col = 0; col < 8; col++) {
      const i = row * 25 + 1 + col * 3;
      pixels[i] = (40 + color * 71) % 256;
      pixels[i + 1] = (90 + color * 47) % 256;
      pixels[i + 2] = (160 + color * 23) % 256;
    }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(pixels)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

```


## app/api/pilot/build/route.ts
SHA256: e44ab52feee721f6e826b768c341e8cafd642fc9f9daa38b18669c1c77fcb728
```
export function GET() {
  return Response.json(
    {
      project: "Middle Property",
      source_sha: __READINESS_BUILD_SHA__,
      mode: "mock-only",
      real_leads: false,
      paid_traffic: false,
      google_ads: false,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

```


## playwright.config.ts
SHA256: ca9c930fdc5e662a8ab79cba06b68a56ff068d276fe9e1c20df8a44e545c67d1
```
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  expect: { timeout: 10000 },
  use: {
    baseURL: "http://127.0.0.1:4199",
    ...(process.env.PLAYWRIGHT_CHANNEL
      ? { channel: process.env.PLAYWRIGHT_CHANNEL }
      : {}),
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "node tests/e2e/server.mjs",
    url: "http://127.0.0.1:4199/middle",
    reuseExistingServer: false,
    timeout: 30000,
  },
});

```


## package.json
SHA256: 3809342c4d83e473e09acd2b4a6e5925b2deed722076352542fe89c4dcebffed
```
{
  "name": "site-creator-vinext-starter",
  "version": "0.1.0",
  "private": true,
  "engines": {
    "node": ">=22.13.0"
  },
  "scripts": {
    "dev": "WRANGLER_LOG_PATH=.wrangler/wrangler.log vinext dev",
    "build": "WRANGLER_LOG_PATH=.wrangler/wrangler.log vinext build",
    "start": "WRANGLER_LOG_PATH=.wrangler/wrangler.log vinext start",
    "test": "pnpm test:unit && pnpm build && pnpm test:integration",
    "lint": "eslint . --ignore-pattern dist --ignore-pattern .next",
    "db:generate": "drizzle-kit generate",
    "typecheck": "tsc --noEmit",
    "test:unit": "vitest run",
    "test:integration": "node --test tests/*.test.mjs",
    "test:e2e": "playwright test",
    "check": "pnpm typecheck && pnpm lint && pnpm test && pnpm test:e2e"
  },
  "dependencies": {
    "drizzle-orm": "0.45.2",
    "react": "19.2.6",
    "react-dom": "19.2.6",
    "zod": "^4.5.4"
  },
  "devDependencies": {
    "@cloudflare/vite-plugin": "1.37.1",
    "@eslint/js": "9.39.4",
    "@next/eslint-plugin-next": "16.2.6",
    "@playwright/test": "^1.63.0",
    "@tailwindcss/postcss": "4.2.1",
    "@testing-library/jest-dom": "^7.0.1",
    "@testing-library/react": "^16.3.3",
    "@types/node": "22.19.19",
    "@types/react": "19.2.14",
    "@types/react-dom": "19.2.3",
    "@vitejs/plugin-react": "6.0.2",
    "@vitejs/plugin-rsc": "0.5.26",
    "drizzle-kit": "0.31.10",
    "eslint": "9.39.4",
    "eslint-plugin-jsx-a11y": "6.10.2",
    "eslint-plugin-react": "7.37.5",
    "eslint-plugin-react-hooks": "7.1.1",
    "globals": "16.4.0",
    "jsdom": "^30.0.1",
    "prettier": "^3.9.6",
    "react-server-dom-webpack": "19.2.6",
    "tailwindcss": "4.2.1",
    "typescript": "5.9.3",
    "typescript-eslint": "8.59.3",
    "vinext": "1.0.0-beta.2",
    "vite": "8.0.13",
    "vitest": "^5.0.0",
    "wrangler": "4.92.0"
  },
  "type": "module"
}

```


## Full tests directory listing from exact SHA
```
tests/agents.test.mjs
tests/connect/explorer.test.tsx
tests/e2e/readiness.spec.ts
tests/e2e/server.mjs
tests/e2e/vertical-slice.spec.ts
tests/helpers/synthetic-image.mjs
tests/helpers/worker.mjs
tests/pilot.test.mjs
tests/platform.test.mjs
tests/rendered-html.test.mjs
tests/unit/connect.test.ts
tests/unit/domain.test.ts
tests/unit/property-card.test.tsx
```


## CI unit.log
SHA256: e5d2a54399599fcde47dd9db803df1f0a06350cf2dc552d32f1e8657c95846d4
```
Command: pnpm test:unit
Source SHA: 8bd0e3d7a223db392e55c5f2533451bff716a464
Started: 2026-09-12T21:39:16.266Z

[1m[30m[46m RUN [49m[39m[22m [36mv5.0.0 [39m[90m/home/runner/work/lilith/lilith[39m

 [32m✓[39m tests/unit/domain.test.ts [2m([22m[2m17 tests[22m[2m)[22m[32m 20[2mms[22m[39m
 [32m✓[39m tests/unit/connect.test.ts [2m([22m[2m7 tests[22m[2m)[22m[32m 81[2mms[22m[39m
 [32m✓[39m tests/unit/property-card.test.tsx [2m([22m[2m2 tests[22m[2m)[22m[32m 168[2mms[22m[39m

[2m Test Files [22m [1m[32m3 passed[39m[22m[90m (3)[39m
[2m      Tests [22m [1m[32m26 passed[39m[22m[90m (26)[39m
[2m   Start at [22m 21:39:17
[2m   Duration [22m 1.27s[2m (environment 45%, transform 21%, import 18%, tests 16%, worker 1%)[22m


$ vitest run

Exit code: 0

```


## CI integration.log
SHA256: 31437c9b3181b332104db588768fa18c28fa9aeab8b66500118c8a661a22b048
```
Command: pnpm test:integration
Source SHA: 8bd0e3d7a223db392e55c5f2533451bff716a464
Started: 2026-09-12T21:39:24.843Z
✔ validates levels and rejects malformed inventory (1.33568ms)
✔ persistent agent API enforces memberships, ownership, tier and photo access (156.622078ms)
✔ P0-01 normal submit commits one unique Lead ID, consent, attribution and correlated outbox (166.656247ms)
✔ P0-01 double click / concurrent retry yields exactly one lead and one notification (63.213033ms)
✔ P0-01 lost response and retry preserves Lead ID and does not duplicate (15.82175ms)
platform_request_failed { requestId: '6fea5489-3e83-4332-ace0-c61743291207', type: 'Error' }
✔ P0-01 injected notification/database failure rolls back all writes; retry succeeds once (14.957864ms)
✔ P0-01 invalid input, malformed JSON, wrong type, oversized body and hostile origin fail closed (34.197892ms)
✔ P0-02 no consent, false consent and wrong policy version cannot create a session or lead (10.629759ms)
✔ P0-03 four images persist, retry reuses upload ID, fifth/concurrent extras are rejected (65.930596ms)
✔ P0-03 reorder/removal persist and foreign images cannot be attached; no orphan reference (27.536369ms)
platform_request_failed { requestId: '2d334edc-f18c-4da1-bbbc-0f1b43c4bd41', type: 'Error' }
✔ P0-03 invalid and interrupted uploads save no partial image and retry succeeds (13.547024ms)
✔ P0-04 authorized mock operator sees correlated record, qualifies and makes it viewing-ready (23.597884ms)
✔ P0-06 debug events retain first/last touch, reject arbitrary PII and prevent forged qualification (25.018339ms)
✔ P0-07 no real mode, no authorization default, private image/read tokens and legacy writes closed (89.560923ms)
✔ P0-01/P0-03 persistent SQLite survives process binding reopen with identical record and bytes (12.702854ms)
✔ P0-04 concurrent qualification retry never downgrades viewing-ready and records operator (14.283601ms)
platform_request_failed { requestId: '925c5472-c6a7-4f00-a4a2-baa850dc8a6a', type: 'Error' }
platform_request_failed { requestId: 'd900fca6-450b-4e7b-9a81-57dbc8bf71de', type: 'Error' }
✔ real Worker + SQLite: complete slice, authorization, concurrency and rollback (496.550914ms)
✔ legacy lead form routes into the mock-only Middle Property consent journey (245.862562ms)
✔ validates rental, buyer and China agent referral briefs (2.574939ms)
✔ keeps lead reads private while accepting public inquiries (7.273322ms)
✔ protects import API and documents JSON/CSV ingestion (8.144021ms)
✔ validates protected pipeline progress updates (0.607627ms)
✔ tracks acquisition channels, import tools and multilingual reply scripts (7.854423ms)
✔ ships the D1 migrations for import and partner fields (1.906638ms)
✔ keeps public capture friendly to foreign referral leads (2.909009ms)
ℹ tests 25
ℹ suites 0
ℹ pass 25
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 899.057777

$ node --test tests/*.test.mjs

Exit code: 0

```


## CI browser.log
SHA256: 851ba5eb532d17e966bbb0723a70138f39ce860a0187230578b4a20107f7b874
```
Command: pnpm test:e2e
Source SHA: 8bd0e3d7a223db392e55c5f2533451bff716a464
Started: 2026-09-12T21:39:26.259Z

Running 12 tests using 1 worker
············
  12 passed (17.5s)

$ playwright test

Exit code: 0

```
