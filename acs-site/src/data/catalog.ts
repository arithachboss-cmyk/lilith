import source from './catalog.source.json';

export type CategoryId = 'printers' | 'scanners' | 'labels' | 'ribbons' | 'rfid' | 'mobile';
export type ProductKind = 'model' | 'family' | 'solution' | 'supplies';
/** The live catalogue's own provenance marking. Kept, not replaced. */
export type EvidenceMark = 'acs_named_model' | 'manufacturer_reference' | 'acs_named_family';

export interface Category {
  id: CategoryId;
  title: string;
  thai: string;
  image: string;
}

export interface Product {
  id: string;
  brand: string;
  name: string;
  category: CategoryId;
  image: string;
  description: string;
  tag: string;
  keywords: string;
  features: string[];
  url: string;
  thaiTitle: string;
  thaiDescription: string;
  kind: ProductKind;
  referenceLabel: string;
  featured?: boolean;
  acsUrl?: string;
  evidence?: EvidenceMark;
}

export const SOURCE_URL: string = source._source;
export const SOURCE_FETCHED: readonly string[] = source._fetched;

export const categories: readonly Category[] = source.categories as Category[];
export const products: readonly Product[] = source.products as Product[];

export function productById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function categoryById(id: string): Category | undefined {
  return categories.find((c) => c.id === id);
}

export function productPath(id: string): string {
  return `/products/${id}/`;
}

/**
 * Category pages (decision D-09, Owner, 2026-11-13). They sit outside
 * `/products/` because two catalogue entries are named `labels` and `rfid`,
 * the same as their categories.
 */
export function categoryPath(id: CategoryId): string {
  return `/categories/${id}/`;
}

export function productsIn(id: CategoryId): Product[] {
  return products.filter((p) => p.category === id);
}

/**
 * A manufacturer page is a reference worth linking. An asiancoding.com URL in
 * this data is not: on 2026-10-23 and again on 2026-11-13 every one of them
 * returned 404, so the build never renders one. `acsUrl` is never rendered.
 */
export function referenceLink(product: Product): string | null {
  let host: string;
  try {
    host = new URL(product.url).hostname;
  } catch {
    return null;
  }
  if (host === 'asiancoding.com' || host.endsWith('.asiancoding.com')) return null;
  return product.url;
}
