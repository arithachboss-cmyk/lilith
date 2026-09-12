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
