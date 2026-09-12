import { createHmac, randomBytes } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { registerHooks } from "node:module";
import { readFileSync } from "node:fs";

// Test-only binding adapter. The product still executes the compiled Worker, SQL,
// authorization, transactions, and the same migrations used in deployment.
export async function createWorkerHarness(filename = ":memory:") {
  const sqlite = new DatabaseSync(filename);
  sqlite.exec("PRAGMA foreign_keys = ON");
  const journal = JSON.parse(
    readFileSync(
      new URL("../../drizzle/meta/_journal.json", import.meta.url),
      "utf8",
    ),
  );
  sqlite.exec(
    "CREATE TABLE IF NOT EXISTS __test_migrations (tag TEXT PRIMARY KEY)",
  );
  for (const migration of journal.entries) {
    if (
      sqlite
        .prepare("SELECT tag FROM __test_migrations WHERE tag=?")
        .get(migration.tag)
    )
      continue;
    sqlite.exec(
      readFileSync(
        new URL(`../../drizzle/${migration.tag}.sql`, import.meta.url),
        "utf8",
      ),
    );
    sqlite
      .prepare("INSERT INTO __test_migrations(tag) VALUES (?)")
      .run(migration.tag);
  }
  let failBatchContaining = null;
  let heldRun = null;
  const DB = {
    prepare(sql) {
      let params = [];
      return {
        sql,
        bind(...values) {
          params = values;
          return this;
        },
        async first() {
          return sqlite.prepare(sql).get(...params) ?? null;
        },
        async all() {
          return { results: sqlite.prepare(sql).all(...params), success: true };
        },
        async run() {
          if (heldRun && sql.includes(heldRun.sql)) {
            const hold = heldRun;
            heldRun = null;
            hold.started();
            await hold.wait;
          }
          return this.runSync();
        },
        runSync() {
          const result = sqlite.prepare(sql).run(...params);
          return {
            results: [],
            success: true,
            meta: {
              changes: Number(result.changes),
              last_row_id: Number(result.lastInsertRowid),
            },
          };
        },
      };
    },
    async batch(statements) {
      sqlite.exec("BEGIN");
      try {
        const output = [];
        for (const statement of statements) {
          if (
            failBatchContaining &&
            statement.sql.includes(failBatchContaining)
          ) {
            failBatchContaining = null;
            throw new Error("TEST injected transaction failure");
          }
          output.push(statement.runSync());
        }
        sqlite.exec("COMMIT");
        return output;
      } catch (error) {
        sqlite.exec("ROLLBACK");
        throw error;
      }
    },
  };
  // D1 executes batches serially. Serialize batches in the adapter to model that
  // guarantee while allowing pre-transaction reads from concurrent requests.
  const rawBatch = DB.batch.bind(DB);
  let queue = Promise.resolve();
  DB.batch = (statements) => {
    const result = queue.then(() => rawBatch(statements));
    queue = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  };
  globalThis.__middleTestEnv ??= {};
  Object.assign(globalThis.__middleTestEnv, {
    DB,
    LILITH_ADMIN_EMAIL: "TEST-manager@example.test",
    MIDDLE_READINESS_MODE: "mock",
    MIDDLE_OPERATIONS_USER_IDS: "TEST-operations",
    MIDDLE_MOCK_IDENTITY_KEY: randomBytes(32).toString("hex"),
  });
  registerHooks({
    resolve(specifier, context, next) {
      if (specifier === "cloudflare:workers")
        return {
          url: "data:text/javascript,export const env = globalThis.__middleTestEnv",
          shortCircuit: true,
        };
      return next(specifier, context);
    },
  });
  const { default: worker } = await import("../../dist/server/index.js");
  const workerEnv = {
    ...globalThis.__middleTestEnv,
    ASSETS: { fetch: () => new Response("Not found", { status: 404 }) },
  };
  const dispatch = (request) =>
    worker.fetch(request, workerEnv, {
      waitUntil() {},
      passThroughOnException() {},
    });
  function signMock(request, account, overrides = {}) {
    const issued_at = Math.floor(Date.now() / 1000);
    const payload = Buffer.from(
      JSON.stringify({
        id: account.id,
        email: account.email,
        method: request.method,
        url: request.url,
        issued_at,
        expires_at: issued_at + 60,
        ...overrides,
      }),
    ).toString("base64url");
    const signature = createHmac(
      "sha256",
      Buffer.from(globalThis.__middleTestEnv.MIDDLE_MOCK_IDENTITY_KEY, "hex"),
    )
      .update(payload)
      .digest("hex");
    const headers = new Headers(request.headers);
    headers.set("x-middle-mock-identity", `${payload}.${signature}`);
    return new Request(request, { headers });
  }
  // Deliberately trusted local simulation. Never use this for spoof-negative tests.
  const dispatchMock = (request) => {
    const id = request.headers.get("oai-authenticated-user-id");
    const email = request.headers.get("oai-authenticated-user-email");
    return dispatch(id && email ? signMock(request, { id, email }) : request);
  };
  async function call(path, account, body, options = {}) {
    const headers = {
      ...(account
        ? {
            "oai-authenticated-user-id": account.id,
            "oai-authenticated-user-email": account.email,
          }
        : {}),
      ...(body !== undefined
        ? { origin: "http://localhost", "content-type": "application/json" }
        : {}),
      ...options.headers,
    };
    const request = new Request("http://localhost" + path, {
      method: options.method ?? (body !== undefined ? "POST" : "GET"),
      headers,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    return dispatch(account ? signMock(request, account) : request);
  }
  return {
    sqlite,
    DB,
    setAssetFetcher: (fetcher) => {
      workerEnv.ASSETS.fetch = fetcher;
    },
    dispatch,
    dispatchMock,
    signMock,
    call,
    injectFailure: (text) => {
      failBatchContaining = text;
    },
    holdNextRun: (sql) => {
      let started, release;
      const paused = new Promise((resolve) => {
        started = resolve;
      });
      const wait = new Promise((resolve) => {
        release = resolve;
      });
      heldRun = { sql, started, wait };
      return { paused, release };
    },
    close: () => sqlite.close(),
  };
}
