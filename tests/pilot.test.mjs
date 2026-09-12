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
