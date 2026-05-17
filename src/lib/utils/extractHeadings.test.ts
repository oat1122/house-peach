import { describe, it, expect } from 'vitest';

import { extractHeadings } from './extractHeadings';

describe('extractHeadings', () => {
  it('returns empty array for empty input', () => {
    expect(extractHeadings('')).toEqual([]);
  });

  it('returns single h2 node for a single ## heading', () => {
    const result = extractHeadings('## Introduction');
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: 'introduction', text: 'Introduction', level: 2 });
  });

  it('nests h3 under preceding h2', () => {
    const mdx = '## H2\n### H3';
    const result = extractHeadings(mdx);
    expect(result).toHaveLength(1);
    expect(result[0].children).toHaveLength(1);
    expect(result[0].children![0]).toMatchObject({ id: 'h3', text: 'H3', level: 3 });
  });

  it('returns multiple h2s in document order', () => {
    const mdx = '## Alpha\n\nsome text\n\n## Beta\n\n## Gamma';
    const result = extractHeadings(mdx);
    expect(result).toHaveLength(3);
    expect(result[0].text).toBe('Alpha');
    expect(result[1].text).toBe('Beta');
    expect(result[2].text).toBe('Gamma');
  });

  it('drops h3 that appears before any h2 (malformed input)', () => {
    const mdx = '### Orphan\n## Parent';
    const result = extractHeadings(mdx);
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe('Parent');
    expect(result[0].children).toBeUndefined();
  });

  it('ignores headings inside backtick fenced code blocks', () => {
    const mdx = '## Real Heading\n\n```\n## Fake Inside Fence\n```\n\n## After Fence';
    const result = extractHeadings(mdx);
    expect(result).toHaveLength(2);
    expect(result[0].text).toBe('Real Heading');
    expect(result[1].text).toBe('After Fence');
  });

  it('ignores headings inside tilde fenced code blocks', () => {
    const mdx = '## Real\n\n~~~\n## Hidden\n~~~\n\n## Also Real';
    const result = extractHeadings(mdx);
    expect(result).toHaveLength(2);
    expect(result[0].text).toBe('Real');
    expect(result[1].text).toBe('Also Real');
  });

  it('strips bold markdown from heading text', () => {
    const result = extractHeadings('## **Bold Title**');
    expect(result[0].text).toBe('Bold Title');
  });

  it('collapses [link](url) in heading to link text only', () => {
    const result = extractHeadings('## Read [the docs](https://example.com) here');
    expect(result[0].text).toBe('Read the docs here');
  });

  it('generates unique slugs for duplicate heading text via github-slugger', () => {
    const mdx = '## Foo\n\n## Foo';
    const result = extractHeadings(mdx);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('foo');
    expect(result[1].id).toBe('foo-1');
  });

  it('slug matches what rehype-slug would emit for a known case', () => {
    // rehype-slug uses github-slugger; "My Section" → "my-section"
    const result = extractHeadings('## My Section');
    expect(result[0].id).toBe('my-section');
  });

  it('resets slug counter between calls (separate documents)', () => {
    const first = extractHeadings('## Foo\n## Foo');
    const second = extractHeadings('## Foo\n## Foo');
    expect(first[1].id).toBe('foo-1');
    expect(second[1].id).toBe('foo-1');
  });
});
