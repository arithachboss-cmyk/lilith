import { SITE } from '../config/site';
import { isIndexable, type StatusConfig } from '../config/status';
import type { Versions } from './versions';
import { categories, categoryPath, productPath, products } from '../data/catalog';
import { REDIRECTS, redirectProblems } from './redirects';
import { splitFeatures, type EvidenceRecord } from '../rules/evidence';
import {
  aboutPage, basketPage, categoryPage, cataloguePage, enquiryPage, homePage, notFoundPage, productPage, statusPage,
} from '../render/pages';

export interface PageInfo {
  route: string;
  file: string;
  /** Read back from the rendered HTML, so it cannot drift from what is served. */
  indexable: boolean;
}

export interface OmittedFigure {
  productId: string;
  feature: string;
}

export interface RenderedSite {
  /** Path relative to the site root → file content. */
  files: Map<string, string>;
  pages: PageInfo[];
  omittedFigures: OmittedFigure[];
  /** Moved addresses → where each now lives. The host must apply these too. */
  redirects: Readonly<Record<string, string>>;
}

const routeToFile = (route: string) => (route === '/' ? 'index.html' : `${route.slice(1)}index.html`);

/** A page is indexable exactly when its own HTML does not say noindex. */
export function htmlIsIndexable(html: string): boolean {
  return !/<meta name="robots" content="[^"]*noindex/.test(html);
}

export function canonicalOf(html: string): string[] {
  return [...html.matchAll(/<link rel="canonical" href="([^"]*)">/g)].map((m) => m[1] ?? '');
}

export function absoluteUrl(route: string): string {
  return `${SITE.origin}${route}`;
}

function sitemapXml(routes: readonly string[], versions: Versions): string {
  const urls = routes
    .map((r) => {
      const lastmod = versions[r]?.lastmod;
      return `  <url><loc>${absoluteUrl(r)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

/**
 * Renders the whole site in memory. Pure: same inputs, same files. The build
 * script writes the result to disk; the tests inspect it directly, including
 * for a `live` config that is never written to dist/.
 */
export function renderSite(
  config: StatusConfig,
  records: readonly EvidenceRecord[],
  asOf: string,
  versions: Versions = {},
): RenderedSite {
  const files = new Map<string, string>();
  const pages: PageInfo[] = [];
  const page = (route: string, html: string) => {
    const file = routeToFile(route);
    files.set(file, html);
    pages.push({ route, file, indexable: htmlIsIndexable(html) });
  };

  page('/', homePage(config));
  page('/products/', cataloguePage(config));
  for (const c of categories) page(categoryPath(c.id), categoryPage(c, config));
  for (const p of products) page(productPath(p.id), productPage(p, records, asOf, config));
  page('/basket/', basketPage(config));
  page('/enquiry/', enquiryPage(config));
  page('/about/', aboutPage(config));
  page('/status/', statusPage(config));
  files.set('404.html', notFoundPage(config));

  const indexable = pages.filter((p) => p.indexable).map((p) => p.route);
  if (isIndexable(config)) {
    // The sitemap lists exactly the pages whose HTML is indexable, nothing else.
    files.set('sitemap.xml', sitemapXml(indexable, versions));
    files.set('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${absoluteUrl('/sitemap.xml')}\n`);
  } else {
    // A build that is not live is closed to crawlers wherever it ends up hosted,
    // and ships no sitemap at all.
    files.set('robots.txt', 'User-agent: *\nDisallow: /\n');
  }

  const omittedFigures = products.flatMap((p) =>
    splitFeatures(p.id, p.features, records, asOf).omitted.map((feature) => ({ productId: p.id, feature })),
  );
  const problems = redirectProblems(REDIRECTS, pages.map((p) => p.route));
  if (problems.length) throw new Error(`redirect list is wrong: ${problems.join('; ')}`);
  return { files, pages, omittedFigures, redirects: REDIRECTS };
}
