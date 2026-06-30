import type { ReactNode } from 'react';

type Props = {
  body: ReactNode;
};

/**
 * Wraps the rendered post body in the `.prose-post` CSS namespace.
 * Does NOT use dangerouslySetInnerHTML — `body` is a React element tree built
 * server-side by `renderTiptap()` from the stored Tiptap JSON, through the
 * whitelisted node/mark map.
 *
 * `id="post-content"` is the skip-link target per a11y.md §11.
 * `scroll-margin-top` is handled in .prose-post h2/h3 via CSS (themes.css §12).
 */
export function PostContent({ body }: Props) {
  return (
    <article id="post-content" className="prose-post max-w-none">
      {body}
    </article>
  );
}
