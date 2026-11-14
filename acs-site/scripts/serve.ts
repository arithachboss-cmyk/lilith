/**
 * Preview server for dist/. It applies the one-address rule in
 * src/build/address.ts, so what the tests see here is the behaviour the
 * production host is required to reproduce. It is a preview tool, not a
 * production server.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { createServer, type IncomingMessage } from 'node:http';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveAddress } from '../src/build/address';
import { REDIRECTS } from '../src/build/redirects';
import { handleEnquiry, MAX_BODY_BYTES, RateLimiter } from '../src/server/enquiry-handler';
import { FileEnquiryStore } from '../src/server/file-store';

const arg = (name: string) => {
  const at = process.argv.indexOf(name);
  return at > -1 ? process.argv[at + 1] : undefined;
};
const project = join(dirname(fileURLToPath(import.meta.url)), '..');
// `--root dist-slice --api <data-dir>` serves the enquiry slice with its test store.
const root = join(project, arg('--root') ?? 'dist');
const port = arg('--port') !== undefined ? Number(arg('--port')) : 4173;
const apiData = arg('--api');

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
};

function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? listFiles(full) : [relative(root, full).split('\\').join('/')];
  });
}

const files = new Set(listFiles(root));

const limiter = new RateLimiter(20, 60_000);
const store = apiData ? new FileEnquiryStore(resolve(apiData)) : null;

const readBody = (req: IncomingMessage): Promise<string> => new Promise((done) => {
  let size = 0;
  const chunks: Buffer[] = [];
  req.on('data', (chunk: Buffer) => {
    size += chunk.length;
    // Stop collecting past the limit; the handler answers 413 on the oversized marker.
    if (size <= MAX_BODY_BYTES + 1) chunks.push(chunk);
  });
  req.on('end', () => done(Buffer.concat(chunks).toString('utf8')));
  req.on('error', () => done(''));
});

const server = createServer(async (req, res) => {
  res.setHeader('X-ACS-Preview', '1');
  if (store && (req.url ?? '').split('?')[0] === '/api/enquiries') {
    const address = server.address();
    const origin = `http://127.0.0.1:${typeof address === 'object' && address ? address.port : port}`;
    const headers = Object.fromEntries(Object.entries(req.headers).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
    const out = await handleEnquiry(
      { method: req.method ?? 'GET', headers, body: await readBody(req), client: req.socket.remoteAddress ?? 'unknown' },
      { store, allowedOrigin: origin, environment: 'preview', now: () => new Date().toISOString(), limiter },
    );
    res.writeHead(out.status, out.headers);
    res.end(out.body);
    return;
  }
  const result = resolveAddress(req.url ?? '/', files, REDIRECTS);
  if (result.status === 301) {
    const query = (req.url ?? '').includes('?') ? `?${(req.url ?? '').split('?')[1]}` : '';
    res.writeHead(301, { Location: result.location + query });
    res.end();
    return;
  }
  if (result.status === 404) {
    res.writeHead(404, { 'Content-Type': TYPES['.html'] });
    res.end(files.has('404.html') ? readFileSync(join(root, '404.html')) : 'Not found');
    return;
  }
  res.writeHead(200, { 'Content-Type': TYPES[extname(result.file)] ?? 'application/octet-stream' });
  res.end(readFileSync(join(root, result.file)));
});

// A port already in use must stop the run, not leave a caller talking to
// whatever else is listening there.
server.on('error', (error) => {
  console.error(`preview server failed: ${error.message}`);
  process.exit(1);
});
// `--port 0` asks the system for a free port; the line below reports the real one.
server.listen(port, '127.0.0.1', () => {
  const address = server.address();
  const actual = typeof address === 'object' && address ? address.port : port;
  console.log(`preview: http://127.0.0.1:${actual}/ (${files.size} files${store ? ', enquiry api on a test store' : ''})`);
});
