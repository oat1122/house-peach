import 'server-only';
import type { ReactElement } from 'react';
import { compileMDX } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { visit, SKIP } from 'unist-util-visit';
import type { Root, Element } from 'hast';

import { baseMdxComponents } from './components';

/**
 * Strip script/style/iframe/etc. nodes from the hast tree before render.
 *
 * CommonMark treats `<script>...</script>` as a "type 1 raw HTML block" — its
 * content passes through the parser verbatim. By the time `compileMDX` reaches
 * the components map, the script is already a hast `element` node with its
 * text inside, and React happily renders `<script>{children}</script>` as a
 * live script tag in the page. The components-map override (`script: () => null`)
 * does NOT catch this because the node is rendered as a hast element, not a
 * JSX element dispatched through the components map.
 *
 * This plugin walks the hast tree, removes nodes whose tag is in the deny
 * list, and is the only chokepoint that reliably blocks stored XSS via
 * raw-HTML script injection. Pair with the components-map overrides for
 * defence-in-depth — both layers must remain.
 */
const FORBIDDEN_TAGS = new Set([
  'script', 'iframe', 'style', 'form', 'input',
  'object', 'embed', 'link', 'meta', 'base',
]);
// Raw HTML often arrives as a hast `raw` node (a string) when remark-rehype
// runs with `allowDangerousHtml`. Strip the dangerous opening tag and any
// matching closing tag from the raw value — drops the offending element
// before React/jsx-runtime turns it into a live DOM node.
const RAW_TAG_PATTERN = new RegExp(
  `<\\/?(?:${Array.from(FORBIDDEN_TAGS).join('|')})\\b[^>]*>[\\s\\S]*?<\\/(?:${Array.from(FORBIDDEN_TAGS).join('|')})\\s*>|<\\/?(?:${Array.from(FORBIDDEN_TAGS).join('|')})\\b[^>]*\\/?>`,
  'gi',
);

function rehypeStripDangerous() {
  return (tree: Root) => {
    // Pass 1 — drop element + mdxJsx* nodes whose tag is in the deny list.
    visit(
      tree,
      (node) =>
        node.type === 'element' ||
        node.type === 'mdxJsxFlowElement' ||
        node.type === 'mdxJsxTextElement',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (node: any, index, parent) => {
        const name = node.tagName ?? node.name;
        if (
          parent &&
          typeof index === 'number' &&
          typeof name === 'string' &&
          FORBIDDEN_TAGS.has(name.toLowerCase())
        ) {
          parent.children.splice(index, 1);
          return [SKIP, index];
        }
      },
    );

    // Pass 2 — strip dangerous markup from any remaining `raw` text nodes
    // (CommonMark "type 1 raw HTML block" path).
    visit(
      tree,
      'raw' as 'element',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (node: any) => {
        if (typeof node.value === 'string') {
          node.value = node.value.replace(RAW_TAG_PATTERN, '');
        }
      },
    );
  };
}

// next-mdx-remote's `components` map accepts arbitrary react element types —
// the runtime is responsible for dispatch. We avoid `React.ComponentType` so
// per-component prop shapes don't leak into a single contravariant constraint.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Components = Record<string, React.ComponentType<any>>;

/**
 * Compile an MDX source string in the RSC layer with the project plugin chain.
 *   - remark-gfm  — task lists, tables, strikethrough
 *   - rehype-slug + rehype-autolink-headings  — anchor links on h2/h3 (SEO)
 *
 * Components default to the project whitelist. Pass additional entries via
 * `extraComponents` for page-scoped widgets (e.g. `BeforeAfter` for work
 * detail pages that need closure over the work's pair data).
 */
export async function compileWorkMdx(
  source: string,
  extraComponents: Components = {},
): Promise<ReactElement> {
  const components: Components = {
    ...baseMdxComponents,
    ...extraComponents,
  };
  const { content } = await compileMDX({
    source,
    components,
    options: {
      parseFrontmatter: false,
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          // Run sanitiser FIRST — drop dangerous nodes before slug/anchor
          // plugins iterate the tree.
          rehypeStripDangerous,
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: 'wrap' }],
        ],
      },
    },
  });
  return content;
}
