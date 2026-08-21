import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
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
          first: async () => null,
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

test("server-renders the Lilith acquisition system", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /Tenant acquisition control room/);
  assert.match(html, /Public lead capture/);
  assert.match(html, /ส่งเข้าระบบ Lilith/);
  assert.match(html, /\/script\.js/);
  assert.doesNotMatch(html, /Your site is taking shape|codex-preview|react-loading-skeleton/);
});
