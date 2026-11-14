/** One product photograph supplied by ACS. */
export interface ProductImage {
  productId: string;
  /** File name inside src/assets/products/. */
  file: string;
  /** Real pixel size, so the page reserves the space and nothing shifts. */
  width: number;
  height: number;
  /** What is in the picture, for someone who cannot see it. */
  alt: string;
  suppliedBy: string;
  suppliedOn: string;
}

export function imageFor(productId: string, images: readonly ProductImage[]): ProductImage | undefined {
  return images.find((i) => i.productId === productId);
}

/** Problems that would put a broken or mislabelled picture on a page. */
export function imageProblems(
  images: readonly ProductImage[],
  productIds: readonly string[],
  filesPresent: readonly string[],
): string[] {
  const problems: string[] = [];
  for (const image of images) {
    const label = `${image.productId} (${image.file})`;
    if (!productIds.includes(image.productId)) problems.push(`${label}: names no product`);
    if (images.filter((other) => other.productId === image.productId).length > 1) problems.push(`${label}: product has more than one image`);
    if (!/^[a-z0-9][a-z0-9._-]*\.(?:jpe?g|png|webp|avif)$/.test(image.file)) problems.push(`${label}: file name must be lower-case and end in jpg, png, webp or avif`);
    else if (!filesPresent.includes(image.file)) problems.push(`${label}: file is not in src/assets/products/`);
    if (!Number.isInteger(image.width) || !Number.isInteger(image.height) || image.width <= 0 || image.height <= 0) problems.push(`${label}: width and height must be the image's pixel size`);
    if (!image.alt.trim()) problems.push(`${label}: needs alt text`);
    if (!image.suppliedBy.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(image.suppliedOn)) problems.push(`${label}: must say who supplied it and when`);
  }
  return [...new Set(problems)];
}
