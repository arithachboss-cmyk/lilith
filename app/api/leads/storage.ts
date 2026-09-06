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
