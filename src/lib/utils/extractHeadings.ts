// github-slugger is a transitive dependency of rehype-slug (still in
// package.json) — guaranteed present. It MUST be the same slugger the Tiptap
// renderer (lib/tiptap/render.tsx) uses so anchor hrefs here match the `id`
// attributes rendered into the heading elements.
import GithubSlugger from 'github-slugger';

import { parseTiptapDoc, nodeText, type TiptapNode } from '@/lib/tiptap/text';

export type HeadingNode = {
  id: string;
  text: string;
  level: 2 | 3;
  children?: HeadingNode[];
};

/**
 * Extract h2/h3 headings from a Tiptap JSON doc string and build a nested
 * heading tree for a table of contents.
 *
 * Contract:
 * - Only heading nodes with `attrs.level` 2 or 3 are recognised (the editor
 *   restricts authoring to those two levels — the page owns the single H1).
 * - IDs are generated with `github-slugger` in document order so they match
 *   the ids rendered by `renderTiptap()` (same library, same order, same
 *   dedupe counter).
 * - Level-3 headings before any level-2 heading are dropped (malformed input).
 */
export function extractHeadings(bodyJson: string): HeadingNode[] {
  const doc = parseTiptapDoc(bodyJson);
  if (!doc) return [];

  const slugger = new GithubSlugger();
  const tree: HeadingNode[] = [];
  let currentH2: HeadingNode | null = null;

  const visit = (node: TiptapNode) => {
    if (node.type === 'heading') {
      const level = Number(node.attrs?.level);
      if (level === 2 || level === 3) {
        const text = nodeText(node);
        if (text) {
          const id = slugger.slug(text);
          if (level === 2) {
            currentH2 = { id, text, level: 2 };
            tree.push(currentH2);
          } else if (currentH2) {
            (currentH2.children ??= []).push({ id, text, level: 3 });
          }
        }
        return; // headings don't nest headings
      }
    }
    node.content?.forEach(visit);
  };

  doc.content?.forEach(visit);
  return tree;
}
