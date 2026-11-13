import { SITE } from '../config/site';
import { isIndexable, statusConfig, systemBadgeText, type StatusConfig } from '../config/status';
import { esc } from './html';
import { jsonLdScript, type JsonLd } from './structured';

export interface PageMeta {
  path: string;
  title: string;
  description: string;
  /** Marks the current item in the main navigation. */
  nav?: 'products' | 'basket' | 'enquiry' | 'company' | 'status';
  /** Loads the client bundle. Pages that work without it leave this off. */
  script?: boolean;
  /**
   * False for pages that must never be indexed even on a live system: the
   * basket, the status page, the error page, a placeholder. Defaults to true.
   */
  index?: boolean;
  /** Structured data describing the page. Emitted as JSON-LD in the head. */
  jsonLd?: JsonLd[];
}

const NAV: Array<{ key: NonNullable<PageMeta['nav']>; href: string; label: string }> = [
  { key: 'products', href: '/products/', label: 'สินค้า' },
  { key: 'basket', href: '/basket/', label: 'รายการขอราคา' },
  { key: 'enquiry', href: '/enquiry/', label: 'ขอราคา / ติดต่อ' },
  { key: 'company', href: '/about/', label: 'เกี่ยวกับ ACS' },
  { key: 'status', href: '/status/', label: 'สถานะระบบ' },
];

/** A page is indexable only when the system is live AND the page itself allows it. */
export function pageIsIndexable(meta: PageMeta, config: StatusConfig = statusConfig): boolean {
  return isIndexable(config) && meta.index !== false;
}

export function layout(meta: PageMeta, main: string, config: StatusConfig = statusConfig): string {
  const indexable = pageIsIndexable(meta, config);
  // Exactly one of the two: an indexable page names its one address, any other page says noindex.
  const robots = indexable
    ? `<link rel="canonical" href="${esc(SITE.origin + meta.path)}">`
    : '<meta name="robots" content="noindex,nofollow">';
  const nav = NAV.map(
    (item) =>
      `<li><a href="${item.href}"${meta.nav === item.key ? ' aria-current="page"' : ''}>${esc(item.label)}</a></li>`,
  ).join('');
  return `<!doctype html>
<html lang="${SITE.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(meta.title)}</title>
<meta name="description" content="${esc(meta.description)}">
${robots}
<meta name="theme-color" content="#07376b">
<link rel="stylesheet" href="/assets/site.css">
${meta.script ? '<script type="module" src="/assets/app.js"></script>' : ''}
${(meta.jsonLd ?? []).map(jsonLdScript).join('\n')}
</head>
<body>
<a class="skip-link" href="#main">ข้ามไปยังเนื้อหา</a>
<div class="utility">
  <div class="wrap utility-inner">
    <span class="utility-name">ASIAN CODING SYSTEMS</span>
    <a class="status-badge status-${config.system}" href="/status/" data-system-status="${config.system}">${esc(systemBadgeText(config))}</a>
  </div>
</div>
<header class="site-header">
  <div class="wrap header-inner">
    <a class="brand" href="/"><span class="brand-mark" aria-hidden="true">ACS</span><span class="brand-text">Asian Coding Systems</span></a>
    <nav aria-label="เมนูหลัก"><ul class="main-nav">${nav}</ul></nav>
  </div>
</header>
<main id="main" tabindex="-1">
${main}
</main>
<footer class="site-footer">
  <div class="wrap footer-inner">
    <p class="footer-name">${esc(SITE.name)}</p>
    <ul class="footer-links">
      <li><a href="${SITE.phoneHref}">${esc(SITE.phoneDisplay)}</a></li>
      <li><a href="mailto:${esc(SITE.salesEmail)}">${esc(SITE.salesEmail)}</a></li>
      <li><a href="/enquiry/">ขอราคา / ติดต่อ</a></li>
      <li><a href="/status/">สถานะระบบ</a></li>
    </ul>
    <p class="footer-note">${esc(SITE.city)}</p>
  </div>
</footer>
</body>
</html>
`;
}
