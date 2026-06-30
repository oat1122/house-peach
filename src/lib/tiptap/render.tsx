import 'server-only';
import { Fragment, type ComponentProps, type ReactElement, type ReactNode } from 'react';
import Link from 'next/link';
import GithubSlugger from 'github-slugger';

import { MDXImage } from '@/components/mdx/MDXImage';
import { parseTiptapDoc, nodeText, type TiptapNode } from './text';

/**
 * Render a Tiptap (ProseMirror) JSON doc to a React tree, server-side.
 *
 * This replaces the old next-mdx-remote + remark/rehype pipeline. A Tiptap doc
 * is structured JSON — there is no raw-HTML node type, so the stored-XSS surface
 * of MDX (raw `<script>` blocks slipping through) does not exist here. We still
 * apply a strict whitelist as defence in depth:
 *
 *   - Node types not in the switch below render NOTHING (default → null).
 *   - Mark types not handled render as plain text (the text survives, the mark
 *     is dropped).
 *   - Heading levels are clamped to h2/h3 — the page owns the single H1.
 *   - Links go through `next/link` (internal) and an explicit URL-scheme
 *     allowlist (external) so `javascript:` payloads degrade to plain text.
 *   - Images render via `<MDXImage>` (forces alt + next/image, CLS-safe).
 *
 * Heading ids are slugged with github-slugger in document order so they match
 * `extractHeadings()` exactly (shared TOC anchor contract).
 */

const SAFE_SCHEME = /^(https?|mailto|tel):/i;

function MdxLink({ href, children, ...rest }: ComponentProps<'a'>) {
  if (!href) return <span>{children}</span>;
  const isInternalPath = href.startsWith('/') || href.startsWith('#');
  if (!isInternalPath && !SAFE_SCHEME.test(href)) {
    return <span>{children}</span>;
  }
  if (/^https?:\/\//i.test(href)) {
    return (
      <a href={href} rel="noopener noreferrer" target="_blank" {...rest}>
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

function applyMark(type: string, attrs: Record<string, unknown> | undefined, child: ReactNode): ReactNode {
  switch (type) {
    case 'bold':
      return <strong>{child}</strong>;
    case 'italic':
      return <em>{child}</em>;
    case 'strike':
      return <s>{child}</s>;
    case 'code':
      return (
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.9em]">
          {child}
        </code>
      );
    case 'link':
      return <MdxLink href={String(attrs?.href ?? '')}>{child}</MdxLink>;
    default:
      // Unknown mark — drop the formatting, keep the text.
      return child;
  }
}

function renderText(node: TiptapNode, key: number): ReactNode {
  let el: ReactNode = node.text ?? '';
  for (const mark of node.marks ?? []) {
    el = applyMark(mark.type, mark.attrs, el);
  }
  return <Fragment key={key}>{el}</Fragment>;
}

function anchorWrap(id: string | undefined, children: ReactNode): ReactNode {
  if (!id) return children;
  return (
    <a href={`#${id}`} className="no-underline hover:underline">
      {children}
    </a>
  );
}

function renderNodes(nodes: TiptapNode[], slugger: GithubSlugger): ReactNode[] {
  return nodes.map((node, i) => renderNode(node, i, slugger));
}

function renderNode(node: TiptapNode, key: number, slugger: GithubSlugger): ReactNode {
  switch (node.type) {
    case 'text':
      return renderText(node, key);

    case 'paragraph':
      return (
        <p key={key} className="my-4 leading-relaxed text-foreground">
          {renderNodes(node.content ?? [], slugger)}
        </p>
      );

    case 'heading': {
      const level = Number(node.attrs?.level) === 3 ? 3 : 2;
      const text = nodeText(node);
      const id = text ? slugger.slug(text) : undefined;
      const children = anchorWrap(id, renderNodes(node.content ?? [], slugger));
      return level === 3 ? (
        <h3 key={key} id={id} className="mt-8 mb-2 text-xl font-semibold text-foreground">
          {children}
        </h3>
      ) : (
        <h2 key={key} id={id} className="mt-10 mb-3 text-2xl font-semibold text-foreground">
          {children}
        </h2>
      );
    }

    case 'bulletList':
      return (
        <ul key={key} className="my-4 list-disc pl-6">
          {renderNodes(node.content ?? [], slugger)}
        </ul>
      );

    case 'orderedList':
      return (
        <ol key={key} className="my-4 list-decimal pl-6">
          {renderNodes(node.content ?? [], slugger)}
        </ol>
      );

    case 'listItem':
      return (
        <li key={key} className="my-1">
          {renderNodes(node.content ?? [], slugger)}
        </li>
      );

    case 'blockquote':
      return (
        <blockquote
          key={key}
          className="my-6 border-l-2 border-accent pl-4 italic text-muted-foreground"
        >
          {renderNodes(node.content ?? [], slugger)}
        </blockquote>
      );

    case 'hardBreak':
      return <br key={key} />;

    case 'horizontalRule':
      return <hr key={key} className="my-8 border-line" />;

    case 'image':
      return (
        <MDXImage
          key={key}
          src={String(node.attrs?.src ?? '')}
          alt={String(node.attrs?.alt ?? '')}
        />
      );

    default:
      // Whitelist: unknown node types render nothing.
      return null;
  }
}

/** Render a stored Tiptap JSON doc string to a React element tree. */
export function renderTiptap(json: string | null | undefined): ReactElement {
  const doc = parseTiptapDoc(json);
  if (!doc || !doc.content?.length) return <></>;
  const slugger = new GithubSlugger();
  return <>{renderNodes(doc.content, slugger)}</>;
}
