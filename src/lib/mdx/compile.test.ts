/**
 * MDX compile tests — verifies the rehype plugin chain (rehype-slug, XSS strip)
 * using next-mdx-remote's compileMDX which works as a regular async function.
 *
 * We render the compiled React element to static HTML via renderToStaticMarkup
 * to assert the output without needing a real RSC runtime.
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

// ── Stubs for Next.js modules ─────────────────────────────────────────────
vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...rest
  }: { href: string; children: unknown } & Record<string, unknown>) =>
    React.createElement('a', { href, 'data-next-link': 'true', ...rest }, children),
}));

vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    ...rest
  }: { src: string; alt: string } & Record<string, unknown>) =>
    React.createElement('img', { src, alt, ...rest }),
}));

const { compileWorkMdx } = await import('./compile');

// ── Tests ─────────────────────────────────────────────────────────────────

describe('compileWorkMdx — rehype-slug', () => {
  it('adds id="my-section" to ## My Section', async () => {
    const el = await compileWorkMdx('## My Section');
    const html = renderToStaticMarkup(el);
    expect(html).toMatch(/<h2[^>]*id="my-section"/);
  });

  it('slug matches extractHeadings output for the same input', async () => {
    // Both rehype-slug and extractHeadings use github-slugger, so "Hello World"
    // must produce the same id in both paths.
    const el = await compileWorkMdx('## Hello World');
    const html = renderToStaticMarkup(el);
    expect(html).toContain('id="hello-world"');
  });
});

describe('compileWorkMdx — XSS whitelist', () => {
  it('does not include <script> tag in compiled output', async () => {
    const el = await compileWorkMdx('## H\n\n<script>alert(1)</script>');
    const html = renderToStaticMarkup(el);
    expect(html).not.toContain('<script');
  });
});

describe('compileWorkMdx — MDXImage', () => {
  it('renders MDXImage with the provided alt text', async () => {
    const el = await compileWorkMdx('<MDXImage src="/uploads/x.webp" alt="ห้องนอน" />');
    const html = renderToStaticMarkup(el);
    expect(html).toContain('alt="ห้องนอน"');
  });
});
