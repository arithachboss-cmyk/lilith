import assert from "node:assert/strict";
import test from "node:test";
import { createWorkerHarness } from "./helpers/worker.mjs";
const owner = { id: "TEST-owner", email: "owner@example.test" };
const agent = { id: "TEST-agent", email: "agent@example.test" };
const outsider = { id: "TEST-outsider", email: "outsider@example.test" };
const listing = {
  name: "TEST ONLY — Sukhumvit Condo",
  description: "Synthetic test fixture; not an active listing",
  transactionType: "RENT",
  propertyType: "CONDO",
  price: "45000.00",
  currency: "THB",
  location: "Sukhumvit",
  bedrooms: 2,
  areaSqm: 80,
  facilities: ["pool", "gym"],
};
const brief = {
  title: "TEST ONLY — Client Requirement",
  description: "Synthetic test fixture",
  transactionType: "RENT",
  propertyType: "CONDO",
  budgetMax: "50000.00",
  currency: "THB",
  locations: ["Sukhumvit"],
  minBedrooms: 2,
  facilities: ["pool", "gym"],
  hardBudget: true,
  hardLocation: true,
  clientConsent: true,
};
test("real Worker + SQLite: complete slice, authorization, concurrency and rollback", async (t) => {
  const h = await createWorkerHarness();
  t.after(() => h.close());
  async function data(path, account, body, status = 200, options) {
    const response = await h.call(path, account, body, options);
    const payload = await response.json();
    assert.equal(response.status, status, JSON.stringify(payload));
    return payload.data ?? payload.error;
  }
  assert.equal((await h.call("/api/discover")).status, 401);
  assert.equal((await h.call("/api/properties", owner, listing)).status, 403);
  await data(
    "/api/profile",
    owner,
    { displayName: "TEST Owner", role: "ADMIN" },
    422,
  );
  for (const [account, role] of [
    [owner, "OWNER"],
    [agent, "AGENT"],
    [outsider, "AGENT"],
  ])
    await data("/api/profile", account, { displayName: account.id, role }, 201);
  await data(
    "/api/profile",
    owner,
    { displayName: "New name", role: "AGENT" },
    409,
  );
  await data("/api/properties", agent, listing, 403);
  for (const price of ["banana", "-1", "99999999999999", "0", "1.001"])
    await data("/api/properties", owner, { ...listing, price }, 422);
  await data(
    "/api/properties",
    owner,
    { ...listing, ownerId: outsider.id },
    422,
  );
  await data("/api/properties", owner, listing, 403, {
    headers: { origin: "https://evil.example" },
  });
  await data(
    "/api/requirements",
    agent,
    { ...brief, clientConsent: false },
    422,
  );
  const property = await data("/api/properties", owner, listing, 201);
  const requirement = await data("/api/requirements", agent, brief, 201);
  await data(`/api/requirements/${requirement.id}`, outsider, undefined, 404);
  await data(
    "/api/matches/generate",
    outsider,
    { kind: "requirement", id: requirement.id },
    404,
  );
  await data("/api/matches/generate", agent, {
    kind: "requirement",
    id: requirement.id,
  });
  await data("/api/matches/generate", agent, {
    kind: "requirement",
    id: requirement.id,
  });
  const discovery = await data("/api/discover", agent);
  assert.equal(discovery.items.length, 1);
  const match = discovery.items[0];
  assert.equal(match.property.id, property.id);
  assert.equal(match.result.score, 100);
  assert.equal(
    h.sqlite.prepare("SELECT COUNT(*) n FROM mp_matches").get().n,
    1,
  );
  assert.equal(
    h.sqlite
      .prepare("SELECT COUNT(*) n FROM mp_events WHERE name='match_generated'")
      .get().n,
    1,
  );
  await data(
    `/api/matches/${match.id}/interests`,
    outsider,
    { decision: "INTERESTED" },
    404,
  );
  await data("/api/deals", agent, { matchId: match.id }, 409);
  const first = await data(`/api/matches/${match.id}/interests`, agent, {
    decision: "SUPER_MATCH",
  });
  assert.equal(first.mutual, false);
  h.injectFailure("INSERT INTO mp_deal_participants");
  await data(
    `/api/matches/${match.id}/interests`,
    owner,
    { decision: "INTERESTED" },
    500,
  );
  assert.equal(
    h.sqlite.prepare("SELECT COUNT(*) n FROM mp_deal_rooms").get().n,
    0,
  );
  assert.equal(
    h.sqlite
      .prepare("SELECT COUNT(*) n FROM mp_interests WHERE actor_id=?")
      .get(owner.id).n,
    0,
  );
  const concurrent = await Promise.all([
    data(`/api/matches/${match.id}/interests`, owner, {
      decision: "INTERESTED",
    }),
    data(`/api/matches/${match.id}/interests`, owner, {
      decision: "INTERESTED",
    }),
    data(`/api/matches/${match.id}/interests`, agent, {
      decision: "SUPER_MATCH",
    }),
  ]);
  const roomId = concurrent[0].roomId;
  assert.ok(roomId);
  assert.equal(
    h.sqlite.prepare("SELECT COUNT(*) n FROM mp_deal_rooms").get().n,
    1,
  );
  assert.equal(
    h.sqlite.prepare("SELECT COUNT(*) n FROM mp_deal_participants").get().n,
    2,
  );
  for (const event of ["mutual_match", "deal_room_opened"])
    assert.equal(
      h.sqlite
        .prepare("SELECT COUNT(*) n FROM mp_events WHERE name=?")
        .get(event).n,
      1,
    );
  await data(
    `/api/matches/${match.id}/interests`,
    owner,
    { decision: "PASS" },
    409,
  );
  for (const path of [`/api/deals/${roomId}`, `/api/deals/${roomId}/timeline`])
    await data(path, outsider, undefined, 404);
  await data(
    `/api/deals/${roomId}/transitions`,
    agent,
    { to: "DEAL_CLOSED", reason: "Skip states" },
    422,
  );
  await data(
    `/api/deals/${roomId}/transitions`,
    agent,
    { to: "VIEWING_COMPLETED", reason: "Skip states" },
    409,
  );
  const viewing = {
    scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    notes: "TEST viewing",
    requestId: crypto.randomUUID(),
  };
  await data(`/api/deals/${roomId}/viewings`, outsider, viewing, 404);
  await data(
    `/api/deals/${roomId}/viewings`,
    agent,
    { ...viewing, scheduledAt: "2020-01-01T00:00:00Z" },
    422,
  );
  h.injectFailure("INSERT INTO mp_viewings");
  await data(`/api/deals/${roomId}/viewings`, agent, viewing, 500);
  assert.equal(
    h.sqlite.prepare("SELECT state FROM mp_deal_rooms WHERE id=?").get(roomId)
      .state,
    "DEAL_ROOM_OPENED",
  );
  const viewings = await Promise.all([
    data(`/api/deals/${roomId}/viewings`, agent, viewing, 201),
    data(`/api/deals/${roomId}/viewings`, agent, viewing, 201),
  ]);
  assert.equal(viewings[0].id, viewings[1].id);
  assert.equal(
    h.sqlite.prepare("SELECT COUNT(*) n FROM mp_viewings").get().n,
    1,
  );
  await data(
    `/api/deals/${roomId}/viewings`,
    agent,
    { ...viewing, notes: "Different payload" },
    409,
  );
  await data(
    `/api/deals/${roomId}/transitions`,
    agent,
    { to: "VIEWING_CONFIRMED", reason: "Self confirmation" },
    409,
  );
  await data(`/api/deals/${roomId}/transitions`, owner, {
    to: "VIEWING_CONFIRMED",
    reason: "Confirmed by owner",
  });
  await data(
    `/api/deals/${roomId}/transitions`,
    owner,
    { to: "VIEWING_COMPLETED", reason: "Too early" },
    409,
  );
  const message = {
    body: "TEST message: see you at the viewing",
    requestId: crypto.randomUUID(),
  };
  const sent = await data(`/api/deals/${roomId}/messages`, agent, message, 201);
  assert.equal(sent.body, message.body);
  await data(`/api/deals/${roomId}/messages`, agent, message, 201);
  assert.equal(
    h.sqlite.prepare("SELECT COUNT(*) n FROM mp_messages").get().n,
    1,
  );
  await data(`/api/deals/${roomId}/messages`, outsider, message, 404);
  const room = await data(`/api/deals/${roomId}`, owner);
  assert.equal(room.state, "VIEWING_CONFIRMED");
  assert.equal(room.messages.length, 1);
  const analytics = await data("/api/analytics", agent);
  assert.equal(analytics.deals, 1);
  assert.equal(analytics.requirements, 1);
  assert.equal(analytics.properties, 0);
  assert.ok((await data("/api/notifications", owner)).items.length >= 2);
  for (const path of ["/api/leads", "/api/import"])
    assert.equal(
      (
        await h.call(
          path,
          agent,
          path.includes("import") ? { rows: [] } : undefined,
        )
      ).status,
      path.includes("import") ? 503 : 401,
    );
  await data(`/api/deals/${roomId}/transitions`, owner, {
    to: "CANCELLED",
    reason: "TEST cancellation",
  });
  await data(
    `/api/deals/${roomId}/messages`,
    agent,
    { ...message, requestId: crypto.randomUUID() },
    409,
  );
  const log = h.sqlite
    .prepare("SELECT action FROM mp_audit_logs WHERE actor_id=?")
    .all(agent.id)
    .map((row) => row.action);
  for (const action of [
    "profile.created",
    "requirement.created",
    "match.generated",
    "interest.recorded",
    "viewing.requested",
    "message.sent",
  ])
    assert.ok(log.includes(action), action);

  // Both sides respond concurrently; a globally reused viewing key must not
  // advance the second deal or return an internal database error.
  const roomIds = [];
  for (const label of ["A", "B"]) {
    const extra = await data(
      "/api/properties",
      owner,
      { ...listing, name: `TEST ONLY — Extra ${label}` },
      201,
    );
    await data("/api/matches/generate", owner, {
      kind: "property",
      id: extra.id,
    });
    const pair = h.sqlite
      .prepare("SELECT id FROM mp_matches WHERE property_id=?")
      .get(extra.id);
    const interests = await Promise.all([
      data(`/api/matches/${pair.id}/interests`, owner, {
        decision: "INTERESTED",
      }),
      data(`/api/matches/${pair.id}/interests`, agent, {
        decision: "INTERESTED",
      }),
    ]);
    roomIds.push(interests.find((result) => result.roomId).roomId);
  }
  const reusedKey = { ...viewing, requestId: crypto.randomUUID() };
  const conflicting = await Promise.all(
    roomIds.map((id) => h.call(`/api/deals/${id}/viewings`, agent, reusedKey)),
  );
  assert.deepEqual(
    conflicting.map((result) => result.status).sort(),
    [201, 409],
  );
  const conflict = await conflicting
    .find((result) => result.status === 409)
    .json();
  assert.equal(conflict.error.code, "IDEMPOTENCY_CONFLICT");
  assert.equal(
    h.sqlite
      .prepare("SELECT COUNT(*) n FROM mp_viewings WHERE request_id=?")
      .get(reusedKey.requestId).n,
    1,
  );
  const states = roomIds
    .map(
      (id) =>
        h.sqlite.prepare("SELECT state FROM mp_deal_rooms WHERE id=?").get(id)
          .state,
    )
    .sort();
  assert.deepEqual(states, ["DEAL_ROOM_OPENED", "VIEWING_REQUESTED"]);
  const viewKey = { requestId: crypto.randomUUID() };
  await data(`/api/matches/${match.id}/view`, agent, viewKey);
  await data(`/api/matches/${match.id}/view`, agent, viewKey);
  assert.equal(
    h.sqlite
      .prepare(
        "SELECT COUNT(*) n FROM mp_events WHERE kind='ANALYTICS' AND name='match_viewed'",
      )
      .get().n,
    1,
  );
});
