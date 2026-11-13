import type { FeatureOverride } from '../data/catalog';
import { extractFigures } from './figures';

/**
 * An override exists to say LESS than the catalogue, on the Owner's decision.
 * It may drop words; it may not add any, and above all it may not add a figure.
 */
export function overrideProblems(overrides: readonly FeatureOverride[]): string[] {
  const problems: string[] = [];
  for (const o of overrides) {
    const label = `${o.productId}: "${o.from}"`;
    if (!o.decidedBy.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(o.decidedOn) || !o.reason.trim() || !o.decision.trim()) {
      problems.push(`${label} must say who decided, when, under which decision, and why`);
    }
    if (o.to === o.from) problems.push(`${label} changes nothing`);
    // Every character of the replacement appears in the original, in order: nothing was added.
    let at = 0;
    for (const ch of o.to) {
      at = o.from.indexOf(ch, at);
      if (at === -1) break;
      at += ch.length;
    }
    if (at === -1 || !o.to.trim()) problems.push(`${label} adds text the catalogue does not have`);
    const before = extractFigures(o.from);
    const added = extractFigures(o.to).filter((figure) => !before.includes(figure));
    if (added.length) problems.push(`${label} adds a figure: ${added.join(', ')}`);
  }
  return problems;
}
