/**
 * Addresses that moved. Each one answers 301 to its target in a single hop,
 * whichever way it is spelled (`/why-acs`, `/why-acs/`, `/why-acs.html`).
 *
 * Keys and values are canonical page addresses: a leading and trailing slash.
 * The host that serves the site has to apply the same list; the build writes
 * it to dist/build-report.json for that purpose.
 */
export const REDIRECTS: Readonly<Record<string, string>> = {
  // D-11 (Owner, 2026-11-13): the company page lives at /about/.
  '/why-acs/': '/about/', // its address on the old site, where it now returns 404
  '/company/': '/about/', // its address in earlier builds of this site
};

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
