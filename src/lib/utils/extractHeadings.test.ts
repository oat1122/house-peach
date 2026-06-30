import { describe, it, expect } from 'vitest';

import { extractHeadings } from './extractHeadings';
import type { TiptapNode } from '@/lib/tiptap/text';

// ── Tiptap doc builders ─────────────────────────────────────────────────────
const h = (level: number, ...content: TiptapNode[]): TiptapNode => ({
  type: 'heading',
  attrs: { level },
  content,
});
const t = (text: string, marks?: { type: string }[]): TiptapNode =>
  marks ? { type: 'text', text, marks } : { type: 'text', text };
const p = (text: string): TiptapNode => ({ type: 'paragraph', content: [t(text)] });
const doc = (...nodes: TiptapNode[]): string =>
  JSON.stringify({ type: 'doc', content: nodes });

describe('extractHeadings', () => {
  it('returns empty array for empty / malformed input', () => {
    expect(extractHeadings('')).toEqual([]);
    expect(extractHeadings('not json')).toEqual([]);
  });

  it('returns a single h2 node for a single heading', () => {
    const result = extractHeadings(doc(h(2, t('Introduction'))));
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: 'introduction', text: 'Introduction', level: 2 });
  });

  it('nests h3 under preceding h2', () => {
    const result = extractHeadings(doc(h(2, t('H2')), h(3, t('H3'))));
    expect(result).toHaveLength(1);
    expect(result[0].children).toHaveLength(1);
    expect(result[0].children![0]).toMatchObject({ id: 'h3', text: 'H3', level: 3 });
  });

  it('returns multiple h2s in document order', () => {
    const result = extractHeadings(
      doc(h(2, t('Alpha')), p('some text'), h(2, t('Beta')), h(2, t('Gamma'))),
    );
    expect(result.map((n) => n.text)).toEqual(['Alpha', 'Beta', 'Gamma']);
  });

  it('drops h3 that appears before any h2 (malformed input)', () => {
    const result = extractHeadings(doc(h(3, t('Orphan')), h(2, t('Parent'))));
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe('Parent');
    expect(result[0].children).toBeUndefined();
  });

  it('ignores heading levels outside 2–3 (page owns h1)', () => {
    const result = extractHeadings(
      doc(h(1, t('Page Title')), h(2, t('Real')), h(4, t('Too Deep'))),
    );
    expect(result.map((n) => n.text)).toEqual(['Real']);
  });

  it('flattens marked text to plain heading text', () => {
    const result = extractHeadings(doc(h(2, t('Bold '), t('Title', [{ type: 'bold' }]))));
    expect(result[0].text).toBe('Bold Title');
    expect(result[0].id).toBe('bold-title');
  });

  it('generates unique slugs for duplicate heading text via github-slugger', () => {
    const result = extractHeadings(doc(h(2, t('Foo')), h(2, t('Foo'))));
    expect(result.map((n) => n.id)).toEqual(['foo', 'foo-1']);
  });

  it('resets slug counter between calls (separate documents)', () => {
    const input = doc(h(2, t('Foo')), h(2, t('Foo')));
    expect(extractHeadings(input)[1].id).toBe('foo-1');
    expect(extractHeadings(input)[1].id).toBe('foo-1');
  });
});
