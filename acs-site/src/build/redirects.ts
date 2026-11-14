import plan from '../data/redirect-plan.json';

/**
 * Addresses that moved. Each one answers 301 to its target in a single hop,
 * whichever way it is spelled (`/why-acs`, `/why-acs/`, `/why-acs.html`).
 *
 * Keys and values are canonical page addresses: a leading and trailing slash.
 * The host that serves the site has to apply the same list; the build writes
 * it to dist/build-report.json for that purpose.
 */
export type PlanStatus = 'approved' | 'proposed' | 'no_equivalent';

export interface PlanRow {
  /** The old site's address, in canonical form. */
  from: string;
  oldClass: string;
  oldType: string;
  to: string | null;
  status: PlanStatus;
  reason: string;
}

/** Every dead address of the old site, with what should happen to it. */
export const redirectPlan: readonly PlanRow[] = plan.rows as PlanRow[];

/** Addresses of earlier builds of this site. Never part of the old site. */
const OWN_MOVES: Readonly<Record<string, string>> = {
  '/company/': '/about/',
};

/**
 * What is actually applied: the approved rows of the plan, and this site's
 * own moves. A proposed row redirects nothing until the Owner approves it.
 */
export function activeRedirects(rows: readonly PlanRow[] = redirectPlan): Record<string, string> {
  const active: Record<string, string> = { ...OWN_MOVES };
  for (const row of rows) if (row.status === 'approved' && row.to) active[row.from] = row.to;
  return active;
}

export const REDIRECTS: Readonly<Record<string, string>> = activeRedirects();

/** Problems that would make the list lie: a loop, a chain, a missing target, a shadowed page. */
export function redirectProblems(redirects: Readonly<Record<string, string>>, routes: readonly string[]): string[] {
  const pages = new Set(routes);
  const problems: string[] = [];
  for (const [from, to] of Object.entries(redirects)) {
    if (!/^\/([^/]+\/)+$/.test(from)) problems.push(`${from}: a source must look like /name/`);
    if (pages.has(from)) problems.push(`${from}: is a real page, so it cannot also redirect`);
    if (!pages.has(to)) problems.push(`${from}: target ${to} is not a page`);
    if (to in redirects) problems.push(`${from}: target ${to} redirects again (a chain)`);
  }
  return problems;
}

/** Problems in the plan itself, approved or not. */
export function planProblems(rows: readonly PlanRow[], routes: readonly string[]): string[] {
  const pages = new Set(routes);
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    if (seen.has(row.from)) problems.push(`${row.from}: listed twice`);
    seen.add(row.from);
    if (!/^\/([^/]+\/)+$/.test(row.from)) problems.push(`${row.from}: a source must look like /name/`);
    if (pages.has(row.from)) problems.push(`${row.from}: is a page of the new site`);
    if (!row.reason.trim()) problems.push(`${row.from}: gives no reason`);
    if (row.status === 'no_equivalent' ? row.to !== null : !row.to) problems.push(`${row.from}: status ${row.status} does not fit target ${row.to}`);
    if (row.to && !pages.has(row.to)) problems.push(`${row.from}: target ${row.to} is not a page`);
  }
  return problems;
}

export function planCounts(rows: readonly PlanRow[] = redirectPlan): Record<PlanStatus, number> {
  const counts: Record<PlanStatus, number> = { approved: 0, proposed: 0, no_equivalent: 0 };
  for (const row of rows) counts[row.status] += 1;
  return counts;
}
