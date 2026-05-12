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

  it('keeps Thai characters and dashes spaces', () => {
    expect(slugify('บ้าน peach studio')).toBe('บ้าน-peach-studio');
  });

  it('strips Latin diacritics but keeps Thai vowel marks', () => {
    // "Café à Bangkok" → diacritics stripped; "ห้องนั่งเล่น" — Thai vowel/tone
    // marks live inside the Thai block so they survive.
    expect(slugify('Café à Bangkok')).toBe('cafe-a-bangkok');
    expect(slugify('ห้องนั่งเล่น')).toBe('ห้องนั่งเล่น');
  });

  it('collapses mixed Thai + ASCII gaps into single dashes', () => {
    expect(slugify('แต่งห้อง!! Japandi style')).toBe('แต่งห้อง-japandi-style');
  });
});
