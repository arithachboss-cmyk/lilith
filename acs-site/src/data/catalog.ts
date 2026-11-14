import overrides from './catalog.overrides.json';
import source from './catalog.source.json';
import images from './product-images.json';
import notes from './product-notes.json';
import type { ProductImage } from '../rules/images';

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

/** Recorded Owner statements about a product. Checked and filtered in rules/notes.ts. */
export const productNotes: ReadonlyArray<{ productId: string; text: string; statedBy: string; statedOn: string; basis: string }> = notes.notes;

/** Photographs ACS has supplied. Empty until it supplies some. */
export const productImages: readonly ProductImage[] = images.images as ProductImage[];

export const SOURCE_URL: string = source._source;
export const SOURCE_FETCHED: readonly string[] = source._fetched;

export const categories: readonly Category[] = source.categories as Category[];
/** The catalogue exactly as the live site served it. Never edited. */
export const sourceProducts: readonly Product[] = source.products as Product[];

/** A line the Owner decided to show differently from the snapshot. */
export interface FeatureOverride {
  productId: string;
  /** The snapshot's line, exactly. */
  from: string;
  /** What the site shows instead. */
  to: string;
  decision: string;
  decidedBy: string;
  decidedOn: string;
  reason: string;
}

export const featureOverrides: readonly FeatureOverride[] = overrides.features;

/**
 * Applies recorded Owner decisions on top of the snapshot. An override that
 * does not match a snapshot line exactly is an error, not a no-op: a silent
 * miss would leave the old line on the site with nobody the wiser.
 */
export function applyOverrides(list: readonly Product[], changes: readonly FeatureOverride[]): Product[] {
  for (const o of changes) {
    const product = list.find((p) => p.id === o.productId);
    if (!product || product.features.filter((f) => f === o.from).length !== 1) {
      throw new Error(`catalogue override matches no line: ${o.productId} "${o.from}"`);
    }
  }
  return list.map((p) => ({
    ...p,
    features: p.features.map((f) => changes.find((o) => o.productId === p.id && o.from === f)?.to ?? f),
  }));
}

/** What the site is built from: the snapshot, with the Owner's recorded decisions applied. */
export const products: readonly Product[] = applyOverrides(sourceProducts, featureOverrides);

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
