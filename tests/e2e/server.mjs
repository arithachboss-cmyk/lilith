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
    const result = await harness.dispatch(
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
// Trusted identity headers are injected by the test browser context. This test
// ingress is loopback-only and is never included in the product Worker.
server.listen(4199, "127.0.0.1", () =>
  console.log("TEST Worker available at http://127.0.0.1:4199"),
);
function close() {
  server.close();
  harness.close();
  rmSync(directory, { recursive: true, force: true });
  process.exit(0);
}
process.on("SIGTERM", close);
process.on("SIGINT", close);
