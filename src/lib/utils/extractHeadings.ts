// github-slugger is a transitive dependency of rehype-slug (which is in
// package.json) — guaranteed to be present without a direct install.
// It MUST be the same slugger used by rehype-slug so that anchor hrefs
// generated here match the `id` attributes rendered in the HTML.
import GithubSlugger from 'github-slugger';

export type HeadingNode = {
  id: string;
  text: string;
  level: 2 | 3;
  children?: HeadingNode[];
};

/** Strip inline markdown syntax to recover plain text. */
function stripInlineMarkdown(raw: string): string {
  return (
    raw
      // Bold/italic — **text**, __text__, *text*, _text_
      .replace(/(\*\*|__)(.*?)\1/g, '$2')
      .replace(/(\*|_)(.*?)\1/g, '$2')
      // Inline code — `code`
      .replace(/`([^`]+)`/g, '$1')
      // Links — [text](url)
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .trim()
  );
}

/**
 * Extract h2/h3 headings from an MDX source string and build a nested
 * heading tree suitable for a table of contents.
 *
 * Contract:
 * - Only `## ` (level 2) and `### ` (level 3) are recognised.
 * - Content inside fenced code blocks (``` … ```) is ignored.
 * - Inline markdown within heading text is stripped.
 * - IDs are generated with `github-slugger` in document order so they match
 *   the `id` attributes produced by the `rehype-slug` plugin during MDX
 *   compilation. The slugger instance is reset per call (one document).
 * - Level-3 headings before any level-2 heading are dropped (malformed input;
 *   inventing a synthetic root would produce incorrect TOC structure).
 *
 * @param mdxSource Raw MDX body string (no frontmatter — we store metadata in
 *                  DB columns, not frontmatter per content.md § Frontmatter).
 */
export function extractHeadings(mdxSource: string): HeadingNode[] {
  const slugger = new GithubSlugger();
  const lines = mdxSource.split('\n');

  const flat: Array<{ id: string; text: string; level: 2 | 3 }> = [];

  let inFence = false;
  for (const line of lines) {
    // Track fenced code block boundaries. Both ```` ``` ```` and `~~~` are
    // valid GFM fence delimiters (remark-gfm recognises both). Missing the
    // tilde form would let `## foo` inside `~~~` slip into the TOC even
    // though it doesn't render as <h2> — broken anchor.
    const trimmed = line.trimStart();
    if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const h2 = line.match(/^## (.+)/);
    if (h2) {
      const text = stripInlineMarkdown(h2[1]);
      flat.push({ id: slugger.slug(text), text, level: 2 });
      continue;
    }

    const h3 = line.match(/^### (.+)/);
    if (h3) {
      const text = stripInlineMarkdown(h3[1]);
      flat.push({ id: slugger.slug(text), text, level: 3 });
    }
  }

  // Build tree: h3s nest under the most recent h2.
  // h3s that appear before any h2 are dropped (malformed input).
  const tree: HeadingNode[] = [];
  let currentH2: HeadingNode | null = null;

  for (const node of flat) {
    if (node.level === 2) {
      currentH2 = { id: node.id, text: node.text, level: 2 };
      tree.push(currentH2);
    } else {
      // node.level === 3
      if (!currentH2) continue; // drop orphaned h3
      currentH2.children ??= [];
      currentH2.children.push({ id: node.id, text: node.text, level: 3 });
    }
  }

  return tree;
}
