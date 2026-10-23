#!/usr/bin/env node
/**
 * Cannibalisation gate — Tier 3 of 03_QA_CHECKLIST.md, as a command.
 *
 * Run it BEFORE writing a package, never after. Writing the article first and finding the
 * collision afterwards is the single most expensive mistake available here: it produces
 * work that may have to be thrown away.
 *
 *   node cannibalisation-check.mjs "<target intent>" [--url /proposed-path] [--json]
 *
 * Exit codes: 0 proceed · 1 HOLD (the cluster has no canonical owner) · 2 bad usage.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parseArgs } from "./argv.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const clusterFile = JSON.parse(readFileSync(join(here, "../data/clusters.json"), "utf8"));
const clusters = clusterFile.clusters;
const decisionsNeeded = clusterFile.decisions_needed ?? [];
const real = JSON.parse(readFileSync(join(here, "../data/real-inventory.json"), "utf8"));

/**
 * The inventory is built from what the site actually serves, plus the product URLs the
 * Owner has decided on but which are not built yet. The distinction matters: clashing
 * with a live page means enrich it, clashing with a planned one means two packages are
 * being aimed at the same future URL.
 *
 * It used to read live-inventory.json, 81 of whose 82 paths return 404. See
 * 06_CRAWL_RECONCILIATION.md.
 */
const inventory = [
  ...real.live.flatMap((p) => p.addresses.map((path) => ({ path, cls: "LIVE", page: p.page }))),
  ...(real.live_but_not_public ?? []).map((p) => ({ path: p.path, cls: "NON_PUBLIC", page: p.path })),
  ...[...new Set(clusters.flatMap((c) => c.planned_urls ?? []))].map((path) => ({
    path, cls: "PLANNED", page: path,
  })),
];

const { has, values, positional } = parseArgs(process.argv.slice(2), ["url"]);
const asJson = has("json");
const proposedUrl = values.url ?? null;
const intent = positional.join(" ").trim();

if (!intent) {
  console.error('usage: node cannibalisation-check.mjs "<target intent>" [--url /path] [--json]');
  process.exit(2);
}

const norm = (s) => s.toLowerCase().replace(/[-_/]+/g, " ").replace(/\s+/g, " ").trim();
const haystack = norm(intent);

/** A cluster matches when any of its terms appears in the proposed intent. */
const clusterHits = clusters
  .map((c) => ({ cluster: c, matched: c.terms.filter((t) => haystack.includes(norm(t))) }))
  .filter((h) => h.matched.length > 0);

/** A URL matches when enough of its slug words appear in the intent. */
const words = haystack.split(" ").filter((w) => w.length > 1);
const urlHits = inventory
  .map((p) => {
    const slug = norm(p.path);
    const slugWords = slug.split(" ").filter((w) => w.length > 1);
    if (!slugWords.length) return null;
    const shared = slugWords.filter((w) => words.includes(w));
    const overlap = shared.length / slugWords.length;
    return overlap >= 0.6 ? { path: p.path, cls: p.cls, overlap: Math.round(overlap * 100), shared } : null;
  })
  .filter(Boolean)
  .sort((a, b) => b.overlap - a.overlap);

const exactUrlClash = proposedUrl
  ? inventory.find((p) => norm(p.path) === norm(proposedUrl))
  : null;

let verdict, reason, action;
if (exactUrlClash && exactUrlClash.cls === "PLANNED") {
  verdict = "HOLD";
  reason = `The proposed URL is already claimed by a planned product page: ${exactUrlClash.path}`;
  action = "That URL is spoken for by the product-URL decision of 2026-10-23. Pick another, or fold this package into that page's content (see packages/site-fixes/PRODUCT_URL_SPEC.md).";
} else if (exactUrlClash) {
  verdict = "HOLD";
  reason = `The proposed URL already exists and serves a ${exactUrlClash.cls === "NON_PUBLIC" ? "non-public" : "live"} page: ${exactUrlClash.path} (${exactUrlClash.page})`;
  action = "ENRICH the existing page, or choose a different URL.";
} else if (clusterHits.some((h) => !h.cluster.canonical_owner)) {
  const open = clusterHits.filter((h) => !h.cluster.canonical_owner);
  const blockers = [...new Set(open.map((h) => h.cluster.blocked_by).filter(Boolean))];
  verdict = "HOLD";
  reason = `Intent falls in ${open.map((h) => h.cluster.id).join(", ")}, and no canonical owner is recorded for ${open.length > 1 ? "those clusters" : "that cluster"}.`;
  const pending = decisionsNeeded.filter((d) => blockers.includes(d.id));
  action = pending.length
    ? `Blocked on Owner decision ${pending.map((d) => d.id).join(", ")}: ${pending.map((d) => d.question).join(" | ")} Do not write yet.`
    : "The Owner names the canonical owner first. Do not write yet.";
} else if (clusterHits.length) {
  verdict = "PROCEED_WITH_CANONICAL";
  reason = `Intent falls in ${clusterHits.map((h) => `${h.cluster.id} (owner: ${h.cluster.canonical_owner})`).join(", ")}.`;
  action = "Write it as a modifier page. State in brief.md what this page owns and what the canonical owner keeps.";
} else if (urlHits.length) {
  verdict = "REVIEW";
  reason = "No cluster matched, but existing URLs overlap the intent.";
  action = "Check the overlapping URLs below. ENRICH one of them unless this is genuinely a different question.";
} else {
  verdict = "PROCEED";
  reason = "No cluster and no overlapping live URL.";
  action = "Proceed. Record the gate result in brief.md.";
}

if (asJson) {
  console.log(JSON.stringify({ intent, proposedUrl, verdict, reason, action, clusters: clusterHits.map((h) => ({ id: h.cluster.id, label: h.cluster.label, canonical_owner: h.cluster.canonical_owner, matched_terms: h.matched, urls: h.cluster.urls })), overlapping_urls: urlHits }, null, 2));
} else {
  console.log(`intent: ${JSON.stringify(intent)}${proposedUrl ? `\nurl:    ${proposedUrl}` : ""}`);
  console.log(`\nVERDICT: ${verdict}`);
  console.log(`  ${reason}`);
  console.log(`  → ${action}`);
  for (const h of clusterHits) {
    console.log(`\n${h.cluster.id} — ${h.cluster.label}`);
    console.log(`  matched: ${h.matched.join(", ")}`);
    console.log(`  canonical owner: ${h.cluster.canonical_owner ?? "NOT SET"}`);
    if (h.cluster.blocked_by) console.log(`  blocked by: ${h.cluster.blocked_by}`);
    console.log(`  live URLs in this cluster (${h.cluster.urls.length}):`);
    for (const u of h.cluster.urls) console.log(`    ${u}`);
    const planned = h.cluster.planned_urls ?? [];
    if (planned.length) {
      console.log(`  planned, not built (${planned.length}):`);
      for (const u of planned) console.log(`    ${u}`);
    }
    if (h.cluster.risk) console.log(`  risk: ${h.cluster.risk}`);
  }
  if (urlHits.length) {
    console.log(`\noverlapping URLs:`);
    for (const u of urlHits.slice(0, 8)) console.log(`  ${String(u.overlap).padStart(3)}%  ${u.path}  [${u.cls}]`);
  }
}

process.exit(verdict === "HOLD" ? 1 : 0);
