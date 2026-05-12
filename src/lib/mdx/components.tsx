import 'server-only';
import type { ComponentProps } from 'react';
import Link from 'next/link';

import { MDXImage } from '@/components/mdx/MDXImage';

/**
 * MDX whitelist — only these tags / components render. Anything else from
 * MDX source is treated as plain text (next-mdx-remote strips unmapped tags
 * by default in RSC mode).
 *
 * Security invariants ([`.claude/rules/security.md` § XSS]):
 *   - never include `<script>`, `<iframe>`, `<style>`, `<form>`, `<input>`
 *   - never accept raw HTML attributes that can carry URLs (we'd need to
 *     allowlist origins); custom components only accept primitive props
 *   - `<a>` is replaced with `next/link` so internal URLs go through the
 *     router (external links default to noreferrer)
 *
 * Per-work components (BeforeAfter etc.) are injected at the call site via
 * `composeWorkMdxComponents()` — they need closure over the page's data.
 */
function MdxLink({
  href,
  children,
  ...rest
}: ComponentProps<'a'>) {
  if (!href) return <span>{children}</span>;
  const isExternal = /^https?:\/\//i.test(href);
  if (isExternal) {
    return (
      <a
        href={href}
        rel="noopener noreferrer"
        target="_blank"
        {...rest}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={href} {...rest}>
      {children}
    </Link>
  );
}

function MdxHeading2(props: ComponentProps<'h2'>) {
  return (
    <h2
      {...props}
      className={
        'mt-10 mb-3 text-2xl font-semibold text-foreground ' +
        (props.className ?? '')
      }
    />
  );
}

function MdxHeading3(props: ComponentProps<'h3'>) {
  return (
    <h3
      {...props}
      className={
        'mt-8 mb-2 text-xl font-semibold text-foreground ' +
        (props.className ?? '')
      }
    />
  );
}

function MdxParagraph(props: ComponentProps<'p'>) {
  return (
    <p
      {...props}
      className={
        'my-4 leading-relaxed text-foreground ' + (props.className ?? '')
      }
    />
  );
}

function MdxBlockquote(props: ComponentProps<'blockquote'>) {
  return (
    <blockquote
      {...props}
      className={
        'my-6 border-l-2 border-accent pl-4 italic text-muted-foreground ' +
        (props.className ?? '')
      }
    />
  );
}

function MdxUl(props: ComponentProps<'ul'>) {
  return (
    <ul {...props} className={'my-4 list-disc pl-6 ' + (props.className ?? '')} />
  );
}

function MdxOl(props: ComponentProps<'ol'>) {
  return (
    <ol {...props} className={'my-4 list-decimal pl-6 ' + (props.className ?? '')} />
  );
}

function MdxLi(props: ComponentProps<'li'>) {
  return <li {...props} className={'my-1 ' + (props.className ?? '')} />;
}

function MdxCode(props: ComponentProps<'code'>) {
  return (
    <code
      {...props}
      className={
        'rounded bg-muted px-1.5 py-0.5 font-mono text-[0.9em] ' +
        (props.className ?? '')
      }
    />
  );
}

function MdxPre(props: ComponentProps<'pre'>) {
  return (
    <pre
      {...props}
      className={
        'my-6 overflow-x-auto rounded-lg bg-muted p-4 font-mono text-xs ' +
        (props.className ?? '')
      }
    />
  );
}

/**
 * Base components shared by every MDX render. Augment with per-page entries
 * (e.g. `BeforeAfter`) via spread before passing to `compileMDX`.
 */
export const baseMdxComponents = {
  a: MdxLink,
  // Map `# heading` (h1) → MdxHeading2. The page itself owns the single H1
  // (the work title). Without this map, `# foo` in the MDX body would
  // render as a native <h1> and create a second H1 on the page, breaking
  // the document outline + SEO (see .claude/rules/seo.md § Single H1).
  h1: MdxHeading2,
  h2: MdxHeading2,
  h3: MdxHeading3,
  p: MdxParagraph,
  blockquote: MdxBlockquote,
  ul: MdxUl,
  ol: MdxOl,
  li: MdxLi,
  code: MdxCode,
  pre: MdxPre,
  img: MDXImage,
  MDXImage,
};
