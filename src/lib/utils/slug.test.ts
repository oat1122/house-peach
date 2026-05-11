import { describe, it, expect } from 'vitest';

import { slugify } from './slug';

describe('slugify', () => {
  it('lowercases and dashes spaces', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('strips punctuation and collapses dashes', () => {
    expect(slugify('Five  Tips!! For Living Rooms')).toBe('five-tips-for-living-rooms');
  });

  it('truncates to the requested max length without trailing dashes', () => {
    expect(slugify('a-b-c-d-e', 5)).toBe('a-b-c');
  });

  it('falls back to "untitled" on empty-equivalent input', () => {
    expect(slugify('!!!')).toBe('untitled');
    expect(slugify('')).toBe('untitled');
  });

  it('drops Thai characters since slugs are ASCII-only', () => {
    expect(slugify('บ้าน peach studio')).toBe('peach-studio');
  });
});
