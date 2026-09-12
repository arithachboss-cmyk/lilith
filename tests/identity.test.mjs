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
