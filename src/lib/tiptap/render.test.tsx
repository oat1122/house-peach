import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { renderTiptap } from './render';
import { tiptapToText, type TiptapNode } from './text';

const doc = (...content: TiptapNode[]): string =>
  JSON.stringify({ type: 'doc', content });
const text = (t: string, marks?: { type: string; attrs?: Record<string, unknown> }[]): TiptapNode =>
  marks ? { type: 'text', text: t, marks } : { type: 'text', text: t };

function html(json: string): string {
  return renderToStaticMarkup(renderTiptap(json));
}

describe('renderTiptap', () => {
  it('renders a heading with a slug id matching extractHeadings', () => {
    const out = html(doc({ type: 'heading', attrs: { level: 2 }, content: [text('My Section')] }));
    expect(out).toMatch(/<h2[^>]*id="my-section"/);
  });

  it('renders bold + italic marks', () => {
    const out = html(
      doc({
        type: 'paragraph',
        content: [text('a', [{ type: 'bold' }]), text('b', [{ type: 'italic' }])],
      }),
    );
    expect(out).toContain('<strong>a</strong>');
    expect(out).toContain('<em>b</em>');
  });

  it('renders an image via MDXImage with its alt', () => {
    const out = html(doc({ type: 'image', attrs: { src: '/uploads/x.webp', alt: 'ห้องนอน' } }));
    expect(out).toContain('alt="ห้องนอน"');
    expect(out).toContain('<img');
  });

  it('drops unknown node types (whitelist)', () => {
    const out = html(
      doc(
        { type: 'paragraph', content: [text('keep')] },
        // A node type the whitelist does not handle — must not render.
        { type: 'script', content: [text('alert(1)')] } as TiptapNode,
      ),
    );
    expect(out).toContain('keep');
    expect(out).not.toContain('alert(1)');
  });

  it('degrades a javascript: link to plain text', () => {
    const out = html(
      doc({
        type: 'paragraph',
        content: [text('click', [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }])],
      }),
    );
    expect(out).toContain('click');
    expect(out).not.toContain('javascript:');
    expect(out).not.toContain('href="javascript');
  });

  it('renders empty for a malformed doc', () => {
    expect(html('not json')).toBe('');
  });
});

describe('tiptapToText', () => {
  it('flattens block text with newline separators', () => {
    const out = tiptapToText(
      doc(
        { type: 'heading', attrs: { level: 2 }, content: [text('Title')] },
        { type: 'paragraph', content: [text('Body line.')] },
      ),
    );
    expect(out).toBe('Title\nBody line.');
  });

  it('returns empty string for malformed input', () => {
    expect(tiptapToText('nope')).toBe('');
  });
});
