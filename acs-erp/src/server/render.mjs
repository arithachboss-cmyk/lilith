// Server-rendered HTML for the internal console. No client framework, no
// external asset, no analytics, no form posting anywhere.

import { MODULES, MODULE_TITLES, PROTOTYPE_LABELS, VERDICT } from '../domain/constants.mjs';

const BASE = '/admin/erp-mock';

export function escapeHtml(value) {
  return String(value === null || value === undefined ? '—' : value).replace(
    /[&<>"']/g,
    (char) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char],
  );
}

const NAV = [
  ['', 'Overview'],
  ...Object.values(MODULES).map((module) => [`/${module.toLowerCase()}`, MODULE_TITLES[module]]),
  ['/permissions', 'Permission matrix'],
  ['/workflow', 'Fixture workflow'],
  ['/audit', 'Audit log'],
];

export function page({ title, actor, path, body }) {
  const nav = NAV.map(
    ([href, label]) =>
      `<a class="nav${path === BASE + href ? ' on' : ''}" href="${BASE}${href}">${escapeHtml(label)}</a>`,
  ).join('');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow,noarchive,nosnippet">
<meta name="googlebot" content="noindex,nofollow,noarchive,nosnippet">
<meta name="referrer" content="no-referrer">
<title>${escapeHtml(title)} — ACS ERP ${PROTOTYPE_LABELS.data}</title>
<style>
:root{color-scheme:light dark;--bg:#0f1115;--panel:#171a21;--line:#2a2f3a;--ink:#e6e8ec;--muted:#98a0ae;--warn:#f0b429;--bad:#e2564d;--ok:#4caf7d;--pend:#8b7ae0}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:14px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace}
.banner{background:repeating-linear-gradient(45deg,#3a2a00,#3a2a00 12px,#2e2200 12px,#2e2200 24px);border-bottom:2px solid var(--warn);padding:10px 16px;font-weight:700;letter-spacing:.04em}
.banner span{color:var(--warn)}
.banner .scope{display:block;color:#d9c07a;font-weight:600;font-size:12px;letter-spacing:.06em}
header{display:flex;flex-wrap:wrap;gap:12px;align-items:baseline;padding:14px 16px;border-bottom:1px solid var(--line)}
h1{font-size:16px;margin:0}
.who{color:var(--muted);font-size:12px}
nav{display:flex;flex-wrap:wrap;gap:2px;padding:8px 12px;border-bottom:1px solid var(--line);background:var(--panel)}
a.nav{color:var(--muted);text-decoration:none;padding:5px 9px;border-radius:4px;font-size:12px}
a.nav:hover{background:#222733;color:var(--ink)}
a.nav.on{background:#222733;color:var(--ink);box-shadow:inset 0 -2px 0 var(--warn)}
main{padding:16px;max-width:1100px}
h2{font-size:14px;margin:22px 0 8px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em}
table{border-collapse:collapse;width:100%;margin-bottom:18px;font-size:12.5px}
th,td{border:1px solid var(--line);padding:6px 8px;text-align:left;vertical-align:top}
th{background:var(--panel);color:var(--muted);font-weight:600}
.tag{display:inline-block;padding:1px 6px;border-radius:3px;font-size:11px;font-weight:700}
.ALLOW,.EVIDENCE_PRESENT,.OK{background:#14301f;color:var(--ok)}
.DENY,.BLOCKED_EVIDENCE_MISSING,.BLOCKED_SOURCE_UNAVAILABLE,.PERMISSION_DENIED,.ERROR{background:#33181a;color:var(--bad)}
.OWNER_DECISION_PENDING,.NOT_ATTEMPTED,.OBSERVED{background:#241f3a;color:var(--pend)}
.note{color:var(--muted);margin:0 0 14px;max-width:70ch}
footer{padding:14px 16px;border-top:1px solid var(--line);color:var(--muted);font-size:11.5px}
</style>
</head>
<body>
<div class="banner"><span>${PROTOTYPE_LABELS.data}</span>
<span class="scope">${PROTOTYPE_LABELS.scope}</span></div>
<header>
  <h1>ACS Online Business ERP</h1>
  <div class="who">signed in as ${escapeHtml(actor.actor_id)} · role ${escapeHtml(actor.role)} · local mock session</div>
</header>
<nav>${nav}</nav>
<main>${body}</main>
<footer>${PROTOTYPE_LABELS.data} · ${PROTOTYPE_LABELS.scope} · provider mode LOCAL_MOCK · route is noindex,nofollow and is in no sitemap · no external network call is made by this process</footer>
</body>
</html>`;
}

export function tag(value) {
  return `<span class="tag ${escapeHtml(value)}">${escapeHtml(value)}</span>`;
}

export function table(columns, rows) {
  const head = columns.map((column) => `<th>${escapeHtml(column)}</th>`).join('');
  const body = rows
    .map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`)
    .join('');
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

export function blocked(error) {
  return `<p class="note">${tag(error.code || 'ERROR')} ${escapeHtml(error.message)}</p>`;
}

export { BASE, VERDICT };
