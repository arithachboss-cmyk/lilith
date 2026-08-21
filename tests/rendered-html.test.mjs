import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { normalizeLead } from "../app/api/leads/validation.ts";

async function fetchWorker(path, init = {}) {
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
          first: async () => ({ id: 1 }),
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
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the premium 12-month rental brief", async () => {
  const response = await fetchWorker("/");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /บ้านและคอนโดเช่าระดับพรีเมียม/);
  assert.match(html, /50,000–250,000/);
  assert.match(html, /สัญญา 1 ปี/);
  assert.match(html, /ขอรับ Private Shortlist/);
  assert.match(html, /publicContact/);
  assert.match(html, /publicPropertyType/);
  assert.match(html, /publicBedrooms/);
  assert.match(html, /publicConsent/);
  assert.match(html, /publicWebsite/);
  assert.match(html, /\/capture\.js/);
  assert.doesNotMatch(html, /Tenant acquisition control room|Export CSV|Remove examples/);
  assert.doesNotMatch(html, /Your site is taking shape|codex-preview|react-loading-skeleton/);
});

test("accepts only qualified premium 12-month briefs", async () => {
  const validPayload = {
    name: "Test Premium Renter",
    contact: "test@example.com",
    source: "test / premium_12m / valid",
    budget: 100000,
    area: "Phrom Phong",
    propertyType: "Condo",
    bedrooms: 2,
    moveDate: "2026-09-15",
    viewingWindow: "วันธรรมดา",
    contractTerm: "12 months",
    preferredLanguage: "English",
    pets: "ไม่มี",
    requirements: "Quiet unit",
    consent: true,
  };

  const validLead = normalizeLead(validPayload, false);
  assert.ok(validLead && !("spam" in validLead));
  assert.equal(validLead.budget, 100000);
  assert.equal(validLead.contractTerm, "12 months");
  assert.equal(validLead.stage, "New inquiry");

  assert.equal(normalizeLead({ ...validPayload, budget: 49000 }, false), null);
  assert.equal(normalizeLead({ ...validPayload, budget: 250001 }, false), null);
  assert.equal(normalizeLead({ ...validPayload, contractTerm: "6 months" }, false), null);
  assert.equal(normalizeLead({ ...validPayload, consent: false }, false), null);

  const authenticatedLead = normalizeLead(
    { ...validPayload, stage: "Viewing booked" },
    true,
  );
  assert.ok(authenticatedLead && !("spam" in authenticatedLead));
  assert.equal(authenticatedLead.stage, "Viewing booked");
});

test("keeps lead reads private while accepting public inquiries", async () => {
  const [route, validation] = await Promise.all([
    readFile(new URL("../app/api/leads/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/leads/validation.ts", import.meta.url), "utf8"),
  ]);
  assert.match(route, /export async function GET\(request: Request\)/);
  assert.match(route, /export async function DELETE\(request: Request\)/);
  assert.match(route, /if \(!isAuthenticated\(request\)\)/);
  assert.match(route, /return json\(\{ error: "Sign in required" \}, \{ status: 401 \}\)/);
  assert.match(route, /export async function POST\(request: Request\)/);
  const postRoute = route.match(
    /export async function POST\(request: Request\) \{[\s\S]*?\n\}/,
  )?.[0] ?? "";
  assert.doesNotMatch(postRoute, /if \(!isAuthenticated\(request\)\)/);
  assert.match(validation, /budget < 50000/);
  assert.match(validation, /budget > 250000/);
  assert.match(validation, /contractTerm !== "12 months"/);
  assert.match(validation, /payload\.consent !== true/);
  assert.match(route, /contact/);
  assert.match(route, /propertyType/);
  assert.match(route, /preferredLanguage/);
});

test("tracks premium acquisition channels through inquiry source", async () => {
  const [captureScript, dashboardScript, launchPack] = await Promise.all([
    readFile(new URL("../public/capture.js", import.meta.url), "utf8"),
    readFile(new URL("../public/script.js", import.meta.url), "utf8"),
    readFile(new URL("../LAUNCH_TODAY.md", import.meta.url), "utf8"),
  ]);

  assert.match(captureScript, /utm_source/);
  assert.match(captureScript, /utm_campaign/);
  assert.match(captureScript, /utm_content/);
  assert.match(captureScript, /publicContractTerm/);
  assert.match(captureScript, /publicConsent/);
  assert.match(dashboardScript, /premium_12m/);
  assert.match(launchPack, /utm_campaign=premium_12m/);
});

test("uses the full premium brief in dashboard follow-up tools", async () => {
  const dashboardScript = await readFile(new URL("../public/script.js", import.meta.url), "utf8");

  assert.match(dashboardScript, /viewingWindowText/);
  assert.match(dashboardScript, /contractTerm/);
  assert.match(dashboardScript, /propertyType/);
  assert.match(dashboardScript, /bedrooms/);
  assert.match(dashboardScript, /preferredLanguage/);
  assert.match(dashboardScript, /requirements/);
  assert.match(dashboardScript, /Private Shortlist/);
  assert.match(dashboardScript, /Top demand areas/);
});

test("ships the D1 migration for premium qualification fields", async () => {
  const migration = await readFile(
    new URL("../drizzle/0002_premium-lead-brief.sql", import.meta.url),
    "utf8",
  );

  assert.match(migration, /ADD `contact` text/);
  assert.match(migration, /ADD `property_type` text/);
  assert.match(migration, /ADD `bedrooms` integer/);
  assert.match(migration, /ADD `contract_term` text/);
  assert.match(migration, /ADD `preferred_language` text/);
  assert.match(migration, /ADD `consent_at` text/);
});
