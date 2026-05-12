import 'server-only';
import type { ReactElement } from 'react';
import { compileMDX } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';

import { baseMdxComponents } from './components';

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
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: 'wrap' }],
        ],
      },
    },
  });
  return content;
}
