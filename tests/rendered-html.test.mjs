import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  return fetchWorker("/");
}

async function fetchWorker(path, init = {}) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
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

test("server-renders the public Lilith lead form", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /หาห้องเช่ากรุงเทพที่ตรงงบ/);
  assert.match(html, /ส่งข้อมูลให้ Lilith/);
  assert.match(html, /เวลาสะดวกดูห้อง/);
  assert.match(html, /publicWebsite/);
  assert.match(html, /\/capture\.js/);
  assert.doesNotMatch(html, /Tenant acquisition control room|Export CSV|Clear/);
  assert.doesNotMatch(html, /Your site is taking shape|codex-preview|react-loading-skeleton/);
});

test("keeps lead reads private while accepting public inquiries", async () => {
  const route = await readFile(new URL("../app/api/leads/route.ts", import.meta.url), "utf8");
  assert.match(route, /export async function GET\(request: Request\)/);
  assert.match(route, /export async function DELETE\(request: Request\)/);
  assert.match(route, /if \(!isAuthenticated\(request\)\)/);
  assert.match(route, /return json\(\{ error: "Sign in required" \}, \{ status: 401 \}\)/);
  assert.match(route, /export async function POST\(request: Request\)/);
  assert.match(route, /viewingWindow/);
  assert.match(route, /Public capture URL/);
  assert.match(route, /spamSignal|website/);
  const postRoute = route.match(
    /export async function POST\(request: Request\) \{[\s\S]*?\n\}/,
  )?.[0] ?? "";
  assert.doesNotMatch(postRoute, /isAuthenticated\(request\)/);
});

test("tracks launch channels through inquiry source", async () => {
  const [captureScript, launchPack] = await Promise.all([
    readFile(new URL("../public/capture.js", import.meta.url), "utf8"),
    readFile(new URL("../LAUNCH_TODAY.md", import.meta.url), "utf8"),
  ]);

  assert.match(captureScript, /utm_source/);
  assert.match(captureScript, /utm_campaign/);
  assert.match(captureScript, /utm_content/);
  assert.match(captureScript, /publicViewingWindow/);
  assert.match(captureScript, /publicWebsite/);
  assert.match(launchPack, /utm_source=facebook_marketplace/);
  assert.match(launchPack, /utm_source=line_oa/);
  assert.match(launchPack, /utm_source=expat_post/);
});

test("uses viewing windows in dashboard follow-up tools", async () => {
  const dashboardScript = await readFile(new URL("../public/script.js", import.meta.url), "utf8");

  assert.match(dashboardScript, /viewingWindowText/);
  assert.match(dashboardScript, /viewingWindow/);
  assert.match(dashboardScript, /ยังไม่ระบุเวลาดูห้อง/);
  assert.match(dashboardScript, /"viewingWindow"/);
  assert.match(dashboardScript, /LINE closing script/);
});

test("summarizes sources and viewing demand for channel decisions", async () => {
  const [dashboardScript, styles] = await Promise.all([
    readFile(new URL("../public/script.js", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(dashboardScript, /renderAcquisitionSummary/);
  assert.match(dashboardScript, /Top sources/);
  assert.match(dashboardScript, /Viewing demand/);
  assert.match(dashboardScript, /Next push/);
  assert.match(styles, /source-summary/);
  assert.match(styles, /summary-pills/);
});
