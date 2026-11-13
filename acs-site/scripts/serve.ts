/**
 * Preview server for dist/. It applies the one-address rule in
 * src/build/address.ts, so what the tests see here is the behaviour the
 * production host is required to reproduce. It is a preview tool, not a
 * production server.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveAddress } from '../src/build/address';
import { REDIRECTS } from '../src/build/redirects';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const portArg = process.argv.indexOf('--port');
const port = portArg > -1 ? Number(process.argv[portArg + 1]) : 4173;

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? listFiles(full) : [relative(root, full).split('\\').join('/')];
  });
}

const files = new Set(listFiles(root));

const server = createServer((req, res) => {
  res.setHeader('X-ACS-Preview', '1');
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
  console.log(`preview: http://127.0.0.1:${actual}/ (${files.size} files)`);
});
