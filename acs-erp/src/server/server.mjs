// Local HTTP surface for the internal console.
//
// Boundaries this file exists to hold:
//   - one route family, /admin/erp-mock, and /robots.txt. Nothing else answers.
//   - server-side session and RBAC before any ERP byte is produced. An
//     unauthenticated or non-console request is answered with a bare 404/403
//     that carries no ERP content, no fixture value and no module name.
//   - noindex,nofollow on the header and in the document, and no sitemap.
//   - GET only. There is no public form, CTA, API, checkout, payment, email,
//     analytics or lead capture, and no mutating endpoint at all.
//   - binds to the loopback interface.

import { createServer } from 'node:http';
import { MODULES, MODULE_TITLES, PROTOTYPE_LABELS } from '../domain/constants.mjs';
import { createErp } from '../domain/erp.mjs';
import { BASE, page } from './render.mjs';
import { MODULE_VIEWS, auditView, overview, permissions, workflowView } from './views.mjs';

const MODULE_BY_SLUG = Object.fromEntries(
  Object.values(MODULES).map((module) => [module.toLowerCase(), module]),
);

function sessionToken(req) {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) return auth.slice(7).trim();
  const cookie = req.headers.cookie;
  if (!cookie) return null;
  for (const part of cookie.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === 'erp_mock_session') return rest.join('=');
  }
  return null;
}

function baseHeaders() {
  return {
    'content-type': 'text/html; charset=utf-8',
    // Robots directives ride on the response itself, not only in the document,
    // so a non-HTML fetch of this route is covered too.
    'x-robots-tag': 'noindex, nofollow, noarchive, nosnippet',
    'cache-control': 'no-store, max-age=0',
    'referrer-policy': 'no-referrer',
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
    'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'none'; frame-ancestors 'none'",
  };
}

// Deliberately bare: no ERP wording, no module name, no fixture value.
function notFound(res) {
  res.writeHead(404, { ...baseHeaders(), 'content-type': 'text/plain; charset=utf-8' });
  res.end('Not Found\n');
}

function forbidden(res) {
  res.writeHead(403, { ...baseHeaders(), 'content-type': 'text/plain; charset=utf-8' });
  res.end('Forbidden\n');
}

export function createErpServer({ erp = createErp() } = {}) {
  return createServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    const path = url.pathname.replace(/\/+$/, '') || '/';

    if (path === '/robots.txt') {
      res.writeHead(200, {
        ...baseHeaders(),
        'content-type': 'text/plain; charset=utf-8',
      });
      res.end('User-agent: *\nDisallow: /admin/\nDisallow: /admin/erp-mock\n');
      return;
    }

    if (path !== BASE && !path.startsWith(`${BASE}/`)) {
      notFound(res);
      return;
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      // No mutating verb is served at all; the console is read-only over HTTP.
      res.writeHead(405, { ...baseHeaders(), allow: 'GET, HEAD', 'content-type': 'text/plain; charset=utf-8' });
      res.end('Method Not Allowed\n');
      return;
    }

    // Session first. An unauthenticated request is answered as if the route did
    // not exist, before any ERP work is done.
    const actor = erp.store.findActorByToken(sessionToken(req));
    if (!actor) {
      notFound(res);
      return;
    }
    if (actor.console_access !== true) {
      forbidden(res);
      return;
    }

    const rest = path === BASE ? '' : path.slice(BASE.length + 1);
    let title = 'Overview';
    let body;

    if (rest === '') {
      body = overview(erp, actor);
    } else if (rest === 'permissions') {
      title = 'Permission matrix';
      body = permissions(erp);
    } else if (rest === 'workflow') {
      title = 'Fixture workflow';
      body = workflowView();
    } else if (rest === 'audit') {
      title = 'Audit log';
      body = auditView(erp);
    } else if (MODULE_BY_SLUG[rest]) {
      const module = MODULE_BY_SLUG[rest];
      title = MODULE_TITLES[module];
      body = MODULE_VIEWS[module](erp, actor);
    } else {
      notFound(res);
      return;
    }

    const html = page({ title, actor, path, body });
    res.writeHead(200, baseHeaders());
    res.end(req.method === 'HEAD' ? undefined : html);
  });
}

export function startErpServer({ port = 4180, host = '127.0.0.1' } = {}) {
  const erp = createErp();
  const server = createErpServer({ erp });
  server.listen(port, host, () => {
    const actors = erp.store.actors
      .filter((actor) => actor.console_access)
      .map((actor) => `  ${actor.role.padEnd(9)} ${actor.actor_id}  token=${actor.mock_token}`)
      .join('\n');
    process.stdout.write(
      `${PROTOTYPE_LABELS.data} · ${PROTOTYPE_LABELS.scope}\n` +
        `local only: http://${host}:${port}${BASE}\n` +
        `send a session token as "Authorization: Bearer <token>" or cookie erp_mock_session=<token>\n` +
        `${actors}\n`,
    );
  });
  return { server, erp };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.ERP_MOCK_PORT || 4180);
  startErpServer({ port });
}
