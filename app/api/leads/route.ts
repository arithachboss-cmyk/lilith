import { env } from "cloudflare:workers";
import { normalizeLead, type LeadPayload } from "./validation";

const createTableSql = `
CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  contact TEXT,
  source TEXT NOT NULL,
  budget INTEGER NOT NULL,
  area TEXT NOT NULL,
  property_type TEXT,
  bedrooms INTEGER,
  move_date TEXT,
  viewing_window TEXT,
  contract_term TEXT,
  preferred_language TEXT,
  pets TEXT,
  requirements TEXT,
  consent_at TEXT,
  spam_signal TEXT,
  stage TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;

const optionalColumns = [
  ["contact", "ALTER TABLE leads ADD COLUMN contact TEXT"],
  ["property_type", "ALTER TABLE leads ADD COLUMN property_type TEXT"],
  ["bedrooms", "ALTER TABLE leads ADD COLUMN bedrooms INTEGER"],
  ["viewing_window", "ALTER TABLE leads ADD COLUMN viewing_window TEXT"],
  ["contract_term", "ALTER TABLE leads ADD COLUMN contract_term TEXT"],
  ["preferred_language", "ALTER TABLE leads ADD COLUMN preferred_language TEXT"],
  ["pets", "ALTER TABLE leads ADD COLUMN pets TEXT"],
  ["requirements", "ALTER TABLE leads ADD COLUMN requirements TEXT"],
  ["consent_at", "ALTER TABLE leads ADD COLUMN consent_at TEXT"],
  ["spam_signal", "ALTER TABLE leads ADD COLUMN spam_signal TEXT"],
] as const;

const createCreatedAtIndexSql = `
CREATE INDEX IF NOT EXISTS idx_leads_created_at
ON leads(created_at)`;

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, {
    ...init,
    headers: {
      "Cache-Control": "no-store",
      ...(init?.headers ?? {}),
    },
  });
}

function isAuthenticated(request: Request) {
  return Boolean(
    request.headers.get("oai-authenticated-user-id") &&
      request.headers.get("oai-authenticated-user-email"),
  );
}

async function ensureSchema() {
  await env.DB.batch([
    env.DB.prepare(createTableSql),
    env.DB.prepare(createCreatedAtIndexSql),
  ]);
  for (const [columnName, sql] of optionalColumns) {
    await addColumnIfMissing(columnName, sql);
  }
}

async function addColumnIfMissing(columnName: string, sql: string) {
  const existing = await env.DB.prepare("PRAGMA table_info(leads)").all();
  const hasColumn = (existing.results ?? []).some(
    (column) => String(column.name) === columnName,
  );
  if (!hasColumn) await env.DB.prepare(sql).run();
}

export async function GET(request: Request) {
  if (!isAuthenticated(request)) {
    return json({ error: "Sign in required" }, { status: 401 });
  }

  await ensureSchema();
  const result = await env.DB.prepare(
    `SELECT id, name, contact, source, budget, area,
            property_type AS propertyType, bedrooms, move_date AS moveDate,
            viewing_window AS viewingWindow, contract_term AS contractTerm,
            preferred_language AS preferredLanguage, pets, requirements,
            consent_at AS consentAt, stage, created_at AS createdAt
     FROM leads
     ORDER BY created_at DESC
     LIMIT 200`,
  ).all();

  return json({ leads: result.results ?? [] });
}

export async function POST(request: Request) {
  await ensureSchema();
  let payload: LeadPayload;
  try {
    payload = (await request.json()) as LeadPayload;
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  const lead = normalizeLead(payload, isAuthenticated(request));

  if (lead && "spam" in lead) {
    return json({ accepted: true }, { status: 201 });
  }

  if (!lead) {
    return json(
      { error: "Lead must match a 12-month lease and a monthly budget of ฿50,000-฿250,000" },
      { status: 422 },
    );
  }

  const result = await env.DB.prepare(
    `INSERT INTO leads (
       name, contact, source, budget, area, property_type, bedrooms, move_date,
       viewing_window, contract_term, preferred_language, pets, requirements,
       consent_at, stage
     )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
     RETURNING id, name, contact, source, budget, area,
       property_type AS propertyType, bedrooms, move_date AS moveDate,
       viewing_window AS viewingWindow, contract_term AS contractTerm,
       preferred_language AS preferredLanguage, pets, requirements,
       consent_at AS consentAt, stage, created_at AS createdAt`,
  )
    .bind(
      lead.name,
      lead.contact,
      lead.source,
      lead.budget,
      lead.area,
      lead.propertyType,
      lead.bedrooms,
      lead.moveDate,
      lead.viewingWindow,
      lead.contractTerm,
      lead.preferredLanguage,
      lead.pets,
      lead.requirements,
      lead.stage,
    )
    .first();

  return json({ lead: result }, { status: 201 });
}

export async function DELETE(request: Request) {
  if (!isAuthenticated(request)) {
    return json({ error: "Sign in required" }, { status: 401 });
  }

  await ensureSchema();
  await env.DB.prepare("DELETE FROM leads").run();
  return json({ leads: [] });
}
