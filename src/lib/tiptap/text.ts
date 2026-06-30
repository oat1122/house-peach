/**
 * Isomorphic helpers over a Tiptap (ProseMirror) JSON doc string.
 *
 * Used by validation (min-length), reading-time / word-count, the admin SEO
 * preview, the work hero drop-cap check, and llms-full.txt. No `server-only`
 * / DB imports — these must run in the browser bundle (RHF + SEO preview) too.
 */

export type TiptapMark = { type: string; attrs?: Record<string, unknown> };

export type TiptapNode = {
  type: string;
  content?: TiptapNode[];
  text?: string;
  marks?: TiptapMark[];
  attrs?: Record<string, unknown>;
};

/** Empty Tiptap doc — the form default before the editor mounts. */
export const EMPTY_TIPTAP_DOC = '{"type":"doc","content":[{"type":"paragraph"}]}';

/** Parse a Tiptap JSON doc string; returns null on malformed / non-doc input. */
export function parseTiptapDoc(
  json: string | null | undefined,
): TiptapNode | null {
  if (!json) return null;
  try {
    const doc = JSON.parse(json) as TiptapNode;
    return doc && doc.type === 'doc' ? doc : null;
  } catch {
    return null;
  }
}

// Block nodes get a newline appended after their text so reading-time and
// word-count don't fuse adjacent paragraphs/headings into one run-on token.
const BLOCK_TYPES = new Set([
  'paragraph',
  'heading',
  'blockquote',
  'listItem',
  'codeBlock',
]);

/** Flatten a Tiptap doc to plain text (block nodes separated by newlines). */
export function tiptapToText(json: string | null | undefined): string {
  const doc = parseTiptapDoc(json);
  if (!doc) return '';
  const out: string[] = [];
  const walk = (node: TiptapNode) => {
    if (node.text) out.push(node.text);
    node.content?.forEach(walk);
    if (BLOCK_TYPES.has(node.type)) out.push('\n');
  };
  doc.content?.forEach(walk);
  return out.join('').replace(/\n{2,}/g, '\n').trim();
}

/** Concatenated text of a single node's descendants (used for heading slugs). */
export function nodeText(node: TiptapNode): string {
  let s = '';
  const walk = (n: TiptapNode) => {
    if (n.text) s += n.text;
    n.content?.forEach(walk);
  };
  walk(node);
  return s.trim();
}
