/**
 * Static build. Renders every page to dist/ as plain HTML, so product text is
 * in the server response and never depends on JavaScript.
 */
import { build as esbuild } from 'esbuild';
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderSite } from '../src/build/site';
import { isIndexable, statusConfig } from '../src/config/status';
import { evidenceGaps, evidenceLog, evidenceProblems, evidenceRecords } from '../src/data/evidence';
import { draftBlockers } from '../src/rules/evidence';
import { featureOverrides } from '../src/data/catalog';
import { overrideProblems } from '../src/rules/overrides';
import versions from '../src/data/page-versions.json';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const asOf = new Date().toISOString().slice(0, 10);

const overrideIssues = overrideProblems(featureOverrides);
if (overrideIssues.length) throw new Error(`catalogue overrides are wrong: ${overrideIssues.join('; ')}`);
if (evidenceProblems.length) throw new Error(`evidence approvals are wrong: ${evidenceProblems.join('; ')}`);
const site = renderSite(statusConfig, evidenceRecords, asOf, versions);

rmSync(dist, { recursive: true, force: true });
mkdirSync(join(dist, 'assets'), { recursive: true });
for (const [file, content] of site.files) {
  const target = join(dist, file);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, content);
}

cpSync(join(root, 'src/styles/site.css'), join(dist, 'assets/site.css'));
await esbuild({
  entryPoints: [join(root, 'src/client/main.ts')],
  bundle: true,
  format: 'esm',
  target: 'es2022',
  minify: true,
  outfile: join(dist, 'assets/app.js'),
  logLevel: 'warning',
});

// The build says exactly which figures it held back, and which pages it opened to crawlers.
const report = {
  builtOn: asOf,
  system: statusConfig.system,
  indexable: isIndexable(),
  routes: site.pages.map((p) => p.route),
  indexableRoutes: site.pages.filter((p) => p.indexable).map((p) => p.route),
  activeEvidenceRecords: evidenceRecords.filter((r) => r.status === 'active').length,
  omittedFigures: site.omittedFigures,
  // Drafts wait for a named person other than their author. `blockedBy` is empty when only that is missing.
  evidenceDrafts: evidenceRecords.filter((r) => r.status === 'draft').map((r) => ({ id: r.id, productId: r.subject.productId, feature: r.subject.feature, source: r.sourceUrl, blockedBy: draftBlockers(r).map((c) => c.name) })),
  figuresWithNoDraft: evidenceGaps,
  // Lines shown differently from the catalogue snapshot, each by a recorded Owner decision.
  catalogueOverrides: featureOverrides,
  evidenceDecisions: evidenceLog.entries().map((e) => ({ at: e.at, recordId: e.recordId, action: e.action, actor: e.actor })),
  // Addresses that moved. Whichever host serves dist/ has to answer each with a 301.
  redirects: site.redirects,
};
writeFileSync(join(dist, 'build-report.json'), JSON.stringify(report, null, 2) + '\n');

console.log(
  `built ${site.pages.length} pages · system=${statusConfig.system} · indexable=${report.indexableRoutes.length} · omitted figures=${site.omittedFigures.length}`,
);
