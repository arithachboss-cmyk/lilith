import { env } from "cloudflare:workers";

type LeadPayload = {
  name?: string;
  source?: string;
  budget?: number | string;
  area?: string;
  moveDate?: string;
  stage?: string;
};

const createTableSql = `
CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  source TEXT NOT NULL,
  budget INTEGER NOT NULL,
  area TEXT NOT NULL,
  move_date TEXT,
  stage TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;

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
}

function normalizeLead(payload: LeadPayload) {
  const name = String(payload.name ?? "").trim().slice(0, 120);
  const source = String(payload.source ?? "Public capture URL").trim().slice(0, 80);
  const area = String(payload.area ?? "").trim().slice(0, 120);
  const stage = String(payload.stage ?? "New inquiry").trim().slice(0, 80);
  const moveDate = String(payload.moveDate ?? "").trim().slice(0, 20) || null;
  const budget = Number(payload.budget);

  if (!name || !area || !Number.isFinite(budget) || budget < 3000) {
    return null;
  }

  return {
    name,
    source,
    budget: Math.round(budget),
    area,
    moveDate,
    stage,
  };
}

export async function GET(request: Request) {
  if (!isAuthenticated(request)) {
    return json({ error: "Sign in required" }, { status: 401 });
  }

  await ensureSchema();
  const result = await env.DB.prepare(
    `SELECT id, name, source, budget, area, move_date AS moveDate, stage, created_at AS createdAt
     FROM leads
     ORDER BY created_at DESC
     LIMIT 200`,
  ).all();

  return json({ leads: result.results ?? [] });
}

export async function POST(request: Request) {
  await ensureSchema();
  const lead = normalizeLead((await request.json()) as LeadPayload);

  if (!lead) {
    return json({ error: "Missing required lead fields" }, { status: 400 });
  }

  const result = await env.DB.prepare(
    `INSERT INTO leads (name, source, budget, area, move_date, stage)
     VALUES (?, ?, ?, ?, ?, ?)
     RETURNING id, name, source, budget, area, move_date AS moveDate, stage, created_at AS createdAt`,
  )
    .bind(lead.name, lead.source, lead.budget, lead.area, lead.moveDate, lead.stage)
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
