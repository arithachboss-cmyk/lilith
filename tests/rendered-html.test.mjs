import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  budgetPeriods,
  leadIntents,
  leadStages,
  monthlyBudgetRange,
  normalizeImportedLead,
  normalizeLead,
  normalizeLeadUpdate,
  purchaseBudgetRange,
} from "../app/api/leads/validation.ts";

async function fetchWorker(path, init = {}, envOverrides = {}) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${Math.random()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, init),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
      DB: {
        batch: async () => [],
        prepare: () => ({
          all: async () => ({ results: [] }),
          bind() {
            return this;
          },
          first: async () => ({ id: 1, name: "Imported Lead" }),
          run: async () => ({}),
        }),
      },
      IMAGES: {
        input: () => ({
          transform: () => ({
            output: async () => ({
              response: () => new Response(""),
            }),
          }),
        }),
      },
      ...envOverrides,
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("legacy lead form routes into the mock-only Middle Property consent journey", async () => {
  const legacy = await fetchWorker("/lead-form");
  assert.equal(legacy.status,307);
  assert.equal(legacy.headers.get("location"),"http://localhost/pilot");
  const response=await fetchWorker("/pilot");
  assert.equal(response.status,200);
  const html=await response.text();
  assert.match(html,/Middle Property/);
  assert.match(html,/NO-GO FOR REAL LEADS/);
  assert.match(html,/@middleproperty/);
  assert.match(html,/0933888594/);
  assert.match(html,/Fill synthetic test details/);
  assert.doesNotMatch(html,/@themiddleproperty|tel:0812345678/);
});

test("validates rental, buyer and China agent referral briefs", () => {
  const validRental = {
    name: "Test Premium Renter",
    contact: "test@example.com",
    source: "test / premium_12m / valid",
    budget: 100000,
    budgetPeriod: "Monthly rent",
    area: "Phrom Phong",
    propertyType: "Condo",
    bedrooms: 2,
    moveDate: "2026-09-15",
    viewingWindow: "วันธรรมดา",
    contractTerm: "12 months",
    preferredLanguage: "English",
    customerCountry: "United States",
    dealIntent: "Rent 12-month",
    pets: "ไม่มี",
    requirements: "Quiet unit",
    consent: true,
  };

  const rentalLead = normalizeLead(validRental, false);
  assert.ok(rentalLead && !("spam" in rentalLead));
  assert.equal(rentalLead.budget, 100000);
  assert.equal(rentalLead.budgetPeriod, "Monthly rent");
  assert.equal(rentalLead.contractTerm, "12 months");
  assert.equal(rentalLead.stage, "New inquiry");

  const buyerLead = normalizeLead(
    {
      ...validRental,
      budget: 8000000,
      budgetPeriod: "Purchase budget",
      contractTerm: "Not applicable",
      dealIntent: "Buy condo",
      preferredLanguage: "中文 / English",
      customerCountry: "China",
    },
    false,
  );
  assert.ok(buyerLead && !("spam" in buyerLead));
  assert.equal(buyerLead.budgetPeriod, "Purchase budget");
  assert.equal(buyerLead.dealIntent, "Buy condo");
  assert.equal(purchaseBudgetRange.min, 1000000);

  const chinaReferral = normalizeImportedLead({
    name: "Ms. Li",
    wechat: "li-bkk-home",
    budget: 120000,
    budgetPeriod: "Monthly rent",
    area: "Thong Lo",
    propertyType: "Condo",
    preferredLanguage: "中文 / English",
    dealIntent: "China agent referral",
    partnerAgency: "Shanghai Relocation Desk",
    partnerContact: "chen-wechat",
    source: "api_import / TEST",
  });
  assert.ok(chinaReferral && !("spam" in chinaReferral));
  assert.equal(chinaReferral.contact, "li-bkk-home");
  assert.equal(chinaReferral.stage, "New inquiry");

  assert.equal(normalizeLead({ ...validRental, budget: 29999 }, false), null);
  assert.equal(normalizeLead({ ...validRental, budget: 250001 }, false), null);
  assert.equal(normalizeLead({ ...validRental, contractTerm: "6 months" }, false), null);
  assert.equal(normalizeLead({ ...validRental, consent: false }, false), null);

  assert.deepEqual(leadIntents, [
    "Rent 12-month",
    "Buy condo",
    "Sell/List property",
    "China agent referral",
  ]);
  assert.deepEqual(budgetPeriods, ["Monthly rent", "Purchase budget", "Listing value"]);
  assert.equal(monthlyBudgetRange.min, 30000);
  assert.equal(monthlyBudgetRange.max, 250000);
});

test("keeps lead reads private while accepting public inquiries", async () => {
  const [route, validation, storage] = await Promise.all([
    readFile(new URL("../app/api/leads/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/leads/validation.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/leads/storage.ts", import.meta.url), "utf8"),
  ]);
  assert.match(route, /export async function GET\(request: Request\)/);
  assert.match(route, /export async function DELETE\(request: Request\)/);
  assert.match(route, /if \(!isAuthenticated\(request\)\)/);
  assert.match(route, /return json\(\{ error: "Sign in required" \}, \{ status: 401 \}\)/);
  assert.match(route, /export async function POST\(request: Request\)/);
  assert.match(route, /export async function PATCH\(request: Request\)/);
  const postRoute = route.match(
    /export async function POST\(request: Request\) \{[\s\S]*?\n\}/,
  )?.[0] ?? "";
  assert.doesNotMatch(postRoute, /if \(!isAuthenticated\(request\)\)/);
  assert.match(validation, /budgetInRange/);
  assert.match(validation, /contractTerm !== "12 months"/);
  assert.match(validation, /payload\.consent !== true/);
  assert.match(storage, /customer_country/);
  assert.match(storage, /partner_agency/);
  assert.match(storage, /external_id/);
  assert.match(storage, /import_batch/);
});

test("protects import API and documents JSON/CSV ingestion", async () => {
  const [importRoute, auth] = await Promise.all([
    readFile(new URL("../app/api/import/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/leads/auth.ts", import.meta.url), "utf8"),
  ]);

  assert.match(importRoute, /export async function POST\(request: Request\)/);
  assert.match(importRoute, /if \(!canImportLeads\(request\)\)/);
  assert.match(importRoute, /x-lilith-import-token/);
  assert.match(importRoute, /application\/json/);
  assert.match(importRoute, /text\/csv/);
  assert.match(importRoute, /multipart\/form-data/);
  assert.match(importRoute, /parseCsv/);
  assert.match(importRoute, /rowsToRecords/);
  assert.match(importRoute, /acceptedCount/);
  assert.match(importRoute, /rejectedCount/);
  assert.match(auth, /LEAD_IMPORT_TOKEN/);
  assert.match(auth, /authorization/);
  assert.match(auth, /Bearer/);
});

test("validates protected pipeline progress updates", () => {
  assert.deepEqual(leadStages, [
    "New inquiry",
    "Qualified",
    "Shortlist sent",
    "Viewing booked",
    "Offer submitted",
    "Deposit pending",
    "Won",
    "Lost",
  ]);

  assert.deepEqual(
    normalizeLeadUpdate({
      id: 7,
      stage: "Viewing booked",
      nextFollowUpAt: "2026-08-22T10:30",
    }),
    { id: 7, stage: "Viewing booked", nextFollowUpAt: "2026-08-22T10:30" },
  );
  assert.equal(normalizeLeadUpdate({ id: 0, stage: "Qualified" }), null);
  assert.equal(normalizeLeadUpdate({ id: 7, stage: "Invented stage" }), null);
  assert.equal(
    normalizeLeadUpdate({ id: 7, stage: "Qualified", nextFollowUpAt: "tomorrow" }),
    null,
  );
});

test("tracks acquisition channels, import tools and multilingual reply scripts", async () => {
  const [captureScript, dashboardScript, dashboardPage, launchPack] = await Promise.all([
    readFile(new URL("../public/capture.js", import.meta.url), "utf8"),
    readFile(new URL("../public/script.js", import.meta.url), "utf8"),
    readFile(new URL("../app/dashboard/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../LAUNCH_TODAY.md", import.meta.url), "utf8"),
  ]);

  assert.match(captureScript, /utm_source/);
  assert.match(captureScript, /international_property/);
  assert.match(captureScript, /publicDealIntent/);
  assert.match(captureScript, /publicWechat/);
  assert.match(dashboardScript, /sendImportPayload/);
  assert.match(dashboardScript, /\/api\/import/);
  assert.match(dashboardScript, /China broker \/ WeChat push/);
  assert.match(dashboardScript, /Русский/);
  assert.match(dashboardScript, /中文/);
  assert.match(dashboardScript, /renderDataFlow/);
  assert.match(dashboardPage, /Send data/);
  assert.match(dashboardPage, /Receive data/);
  assert.match(dashboardPage, /Filtered queue/);
  assert.match(launchPack, /utm_campaign=premium_12m/);
});

test("ships the D1 migrations for import and partner fields", async () => {
  const [premiumMigration, workflowMigration, importMigration] = await Promise.all([
    readFile(new URL("../drizzle/0002_premium-lead-brief.sql", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0003_lead-follow-up-workflow.sql", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0004_black_stick.sql", import.meta.url), "utf8"),
  ]);

  assert.match(premiumMigration, /ADD `contact` text/);
  assert.match(premiumMigration, /ADD `property_type` text/);
  assert.match(premiumMigration, /ADD `preferred_language` text/);
  assert.match(workflowMigration, /ADD `next_follow_up_at` text/);
  assert.match(workflowMigration, /ADD `updated_at` text/);
  assert.match(importMigration, /ADD `budget_period` text/);
  assert.match(importMigration, /ADD `customer_country` text/);
  assert.match(importMigration, /ADD `deal_intent` text/);
  assert.match(importMigration, /ADD `wechat` text/);
  assert.match(importMigration, /ADD `partner_agency` text/);
  assert.match(importMigration, /ADD `external_id` text/);
  assert.match(importMigration, /ADD `import_batch` text/);
});

test("keeps public capture friendly to foreign referral leads", async () => {
  const [publicPage, captureScript, storage] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../public/capture.js", import.meta.url), "utf8"),
    readFile(new URL("../app/api/leads/storage.ts", import.meta.url), "utf8"),
  ]);

  const contactInput = publicPage.slice(
    publicPage.indexOf('id="publicContact"'),
    publicPage.indexOf('id="publicWechat"'),
  );
  assert.match(publicPage, /id="publicLeadForm" noValidate/);
  assert.doesNotMatch(contactInput, /required/);
  assert.match(captureScript, /function validatePublicLead/);
  assert.match(captureScript, /lead\.contact, lead\.wechat, lead\.partnerContact/);
  assert.match(captureScript, /ช่องทางติดต่ออย่างน้อยหนึ่งช่อง/);
  assert.match(captureScript, /โจทย์เช่าต้องเป็นสัญญา 12 เดือน/);

  const ensureSchemaStart = storage.indexOf("export async function ensureLeadSchema()");
  const addColumnStart = storage.indexOf("async function addColumnIfMissing", ensureSchemaStart);
  const ensureSchemaBody = storage.slice(ensureSchemaStart, addColumnStart);
  const firstBatch = ensureSchemaBody.slice(0, ensureSchemaBody.indexOf("]);") + 3);
  assert.doesNotMatch(firstBatch, /createExternalIdIndexSql/);
  assert.ok(
    ensureSchemaBody.indexOf("for (const [columnName, sql] of optionalColumns)") <
      ensureSchemaBody.indexOf("env.DB.prepare(createExternalIdIndexSql).run()"),
  );
});
