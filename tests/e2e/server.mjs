import { createServer } from "node:http";
import { Readable } from "node:stream";
import { mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname, resolve, sep } from "node:path";
import { createWorkerHarness } from "../helpers/worker.mjs";
const directory = mkdtempSync(resolve(tmpdir(), "lilith-e2e-"));
const harness = await createWorkerHarness(resolve(directory, "test.sqlite"));
const assets = resolve("dist/client");
const types = {
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".html": "text/html",
  ".woff2": "font/woff2",
};
harness.setAssetFetcher((request) => {
  const path = resolve(assets, "." + new URL(request.url).pathname);
  if (!path.startsWith(assets + sep))
    return new Response("Not found", { status: 404 });
  try {
    return new Response(readFileSync(path), {
      headers: {
        "Content-Type": types[extname(path)] ?? "application/octet-stream",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
});
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", "http://127.0.0.1:4199");
    const path = resolve(assets, "." + decodeURIComponent(url.pathname));
    if (path.startsWith(assets + sep)) {
      try {
        if (statSync(path).isFile()) {
          response.writeHead(200, {
            "Content-Type": types[extname(path)] ?? "application/octet-stream",
          });
          response.end(readFileSync(path));
          return;
        }
      } catch {
        /* App route, not a static file. */
      }
    }
    const body = ["GET", "HEAD"].includes(request.method ?? "GET")
      ? undefined
      : new Uint8Array(
          await new Response(Readable.toWeb(request)).arrayBuffer(),
        );
    const headers = new Headers();
    for (const [key, value] of Object.entries(request.headers))
      if (value)
        headers.set(key, Array.isArray(value) ? value.join(", ") : value);
    const result = await harness.dispatchMock(
      new Request(url, { method: request.method, headers, body }),
    );
    response.writeHead(result.status, Object.fromEntries(result.headers));
    if (result.body) Readable.fromWeb(result.body).pipe(response);
    else response.end();
  } catch (error) {
    console.error(error);
    response.writeHead(500);
    response.end("Test server error");
  }
});
// The loopback test adapter signs synthetic browser identities with an ephemeral
// key. It is trusted simulation, never hosted identity evidence.
server.listen(4199, "127.0.0.1", () =>
  console.log("TEST Worker available at http://127.0.0.1:4199"),
);
// Mock retention is driven only by this local harness. No hosted scheduler is configured.
let sweeping = false;
async function sweep() {
  if (sweeping) return;
  sweeping = true;
  try {
    const result = await harness.call(
      "/api/pilot/maintenance",
      { id: "TEST-operations", email: "operations@example.test" },
      { mock_data: true },
    );
    if (!result.ok) console.error("TEST retention sweep failed", result.status);
  } catch {
    console.error("TEST retention sweep request failed");
  } finally {
    sweeping = false;
  }
}
const retentionTimer = setInterval(() => void sweep(), 60_000);
void sweep();
function close() {
  clearInterval(retentionTimer);
  server.close();
  harness.close();
  rmSync(directory, { recursive: true, force: true });
  process.exit(0);
}
process.on("SIGTERM", close);
process.on("SIGINT", close);
