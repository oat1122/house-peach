import type { ReactNode } from 'react';

type Props = {
  compiledMdx: ReactNode;
};

/**
 * Wraps compiled MDX content in the `.prose-post` CSS namespace.
 * Does NOT use dangerouslySetInnerHTML — the MDX is a React element tree
 * compiled server-side via compileWorkMdx() + the baseMdxComponents whitelist.
 *
 * `id="post-content"` is the skip-link target per a11y.md §11.
 * `scroll-margin-top` is handled in .prose-post h2/h3 via CSS (themes.css §12).
 */
export function PostContent({ compiledMdx }: Props) {
  return (
    <article id="post-content" className="prose-post max-w-none">
      {compiledMdx}
    </article>
  );
}
