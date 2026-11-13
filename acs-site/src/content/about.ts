import source from './about.json';
import { esc } from '../render/html';

/**
 * The company copy, approved by the Owner on the date in about.json.
 *
 * It is a verbatim copy of the governed package draft, and this file only
 * knows how to turn that draft's small Markdown subset into HTML: one `#`
 * heading, paragraphs separated by blank lines, and `**bold**`.
 */
export const ABOUT_APPROVAL = source.approval;
export const ABOUT_MARKDOWN: string = source.markdown;

export interface AboutContent {
  heading: string;
  /** Paragraphs as safe HTML. */
  paragraphs: string[];
}

const inline = (text: string) => esc(text).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

export function parseAbout(markdown: string = ABOUT_MARKDOWN): AboutContent {
  const blocks = markdown.trim().split(/\n\s*\n/).map((block) => block.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean);
  const first = blocks[0] ?? '';
  if (!first.startsWith('# ')) throw new Error('about copy must start with a "# " heading');
  const rest = blocks.slice(1);
  const unsupported = rest.find((block) => /^(#|>|-|\d+\.|<|\|)/.test(block));
  if (unsupported) throw new Error(`about copy uses Markdown this renderer does not support: ${unsupported.slice(0, 40)}`);
  return { heading: first.slice(2).trim(), paragraphs: rest.map(inline) };
}
