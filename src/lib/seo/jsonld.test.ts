import { describe, it, expect, vi } from 'vitest';

vi.mock('@/env', () => ({
  env: {
    DATABASE_URL: 'mysql://test',
    DB_POOL_SIZE: 1,
    AUTH_SECRET: 'x'.repeat(32),
    NEXT_PUBLIC_SITE_URL: 'https://house-peach.example',
    NODE_ENV: 'test',
    UPLOAD_DIR: '/tmp/uploads',
  },
}));

const mockConfig = {
  phone: null as string | null,
  socials: [] as string[],
};

vi.mock('@/lib/config', () => ({
  getActivePhone: () => mockConfig.phone,
  getActiveSocials: () => mockConfig.socials,
}));

const { buildBlogPostingLd, buildPostBreadcrumbLd, buildSiteGraphLd } = await import('./jsonld');

// Minimal PostRow fixture — only the fields used by the builders.
function makePost(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    slug: 'my-post',
    title: 'My Post',
    excerpt: 'A short excerpt for the post.',
    bodyMdx: '## Hello',
    status: 'published' as const,
    publishedAt: new Date('2024-06-01T00:00:00Z'),
    updatedAt: new Date('2024-06-02T00:00:00Z'),
    readingTimeMin: 5,
    viewCount: 0,
    authorId: 1,
    coverMediaAssetId: null,
    createdAt: new Date('2024-06-01T00:00:00Z'),
    ...overrides,
  };
}

describe('buildBlogPostingLd', () => {
  it('always includes image — uses cover URL when provided', () => {
    const ld = buildBlogPostingLd({
      post: makePost(),
      coverUrl: 'https://house-peach.example/uploads/posts/abc/original.webp',
      url: 'https://house-peach.example/blog/my-post',
    });
    expect(Array.isArray(ld.image)).toBe(true);
    expect((ld.image as string[])[0]).toContain('/uploads/posts/abc/original.webp');
  });

  it('falls back to brand logo when coverUrl is null', () => {
    const ld = buildBlogPostingLd({
      post: makePost(),
      coverUrl: null,
      url: 'https://house-peach.example/blog/my-post',
    });
    expect(Array.isArray(ld.image)).toBe(true);
    expect((ld.image as string[])[0]).toBe('https://house-peach.example/og/logo.png');
  });

  it('falls back to brand logo when coverUrl is undefined', () => {
    const ld = buildBlogPostingLd({
      post: makePost(),
      url: 'https://house-peach.example/blog/my-post',
    });
    expect((ld.image as string[])[0]).toBe('https://house-peach.example/og/logo.png');
  });

  it('always includes datePublished — uses publishedAt when set', () => {
    const ld = buildBlogPostingLd({
      post: makePost({ publishedAt: new Date('2024-06-01T00:00:00Z') }),
      url: 'https://house-peach.example/blog/my-post',
    });
    expect(ld.datePublished).toBe('2024-06-01T00:00:00.000Z');
  });

  it('falls back datePublished to updatedAt when publishedAt is null', () => {
    const ld = buildBlogPostingLd({
      post: makePost({ publishedAt: null, updatedAt: new Date('2024-06-02T00:00:00Z') }),
      url: 'https://house-peach.example/blog/my-post',
    });
    expect(ld.datePublished).toBe('2024-06-02T00:00:00.000Z');
  });

  it('includes wordCount when passed', () => {
    const ld = buildBlogPostingLd({
      post: makePost(),
      url: 'https://house-peach.example/blog/my-post',
      wordCount: 350,
    });
    expect(ld.wordCount).toBe(350);
  });

  it('omits wordCount when not passed', () => {
    const ld = buildBlogPostingLd({
      post: makePost(),
      url: 'https://house-peach.example/blog/my-post',
    });
    expect(ld.wordCount).toBeUndefined();
  });

  it('omits wordCount when null', () => {
    const ld = buildBlogPostingLd({
      post: makePost(),
      url: 'https://house-peach.example/blog/my-post',
      wordCount: null,
    });
    expect(ld.wordCount).toBeUndefined();
  });

  it('includes timeRequired in ISO-8601 PT format when readingTimeMin is set', () => {
    const ld = buildBlogPostingLd({
      post: makePost({ readingTimeMin: 7 }),
      url: 'https://house-peach.example/blog/my-post',
    });
    expect(ld.timeRequired).toBe('PT7M');
  });

  it('omits timeRequired when readingTimeMin is null', () => {
    const ld = buildBlogPostingLd({
      post: makePost({ readingTimeMin: null }),
      url: 'https://house-peach.example/blog/my-post',
    });
    expect(ld.timeRequired).toBeUndefined();
  });
});

describe('buildPostBreadcrumbLd', () => {
  it('emits 3 ListItems with consecutive positions', () => {
    const ld = buildPostBreadcrumbLd({ title: 'My Post', slug: 'my-post' });
    expect(ld.itemListElement).toHaveLength(3);
    expect((ld.itemListElement as Array<{ position: number }>).map(i => i.position)).toEqual([1, 2, 3]);
  });

  it('position 1 is the home page', () => {
    const ld = buildPostBreadcrumbLd({ title: 'My Post', slug: 'my-post' });
    const home = (ld.itemListElement as Array<{ position: number; name: string; item: string }>)[0];
    expect(home.name).toBe('หน้าแรก');
    expect(home.item).toBe('https://house-peach.example/');
  });

  it('position 2 is the blog listing', () => {
    const ld = buildPostBreadcrumbLd({ title: 'My Post', slug: 'my-post' });
    const blog = (ld.itemListElement as Array<{ position: number; name: string; item: string }>)[1];
    expect(blog.name).toBe('บทความ');
    expect(blog.item).toBe('https://house-peach.example/blog');
  });

  it('position 3 leaf has post title as name', () => {
    const ld = buildPostBreadcrumbLd({ title: 'My Post', slug: 'my-post' });
    const leaf = (ld.itemListElement as Array<{ position: number; name: string; item: string }>)[2];
    expect(leaf.name).toBe('My Post');
  });

  it('position 3 item URL contains encoded slug', () => {
    const ld = buildPostBreadcrumbLd({ title: 'Some Post', slug: 'some-post' });
    const leaf = (ld.itemListElement as Array<{ item: string }>)[2];
    expect(leaf.item).toBe('https://house-peach.example/blog/some-post');
  });

  it('encodes special characters in slug for position 3 URL', () => {
    // Slug with Thai chars should be percent-encoded in the URL
    const ld = buildPostBreadcrumbLd({ title: 'บ้าน', slug: 'บ้าน-peach' });
    const leaf = (ld.itemListElement as Array<{ item: string }>)[2];
    expect(leaf.item).toContain(encodeURIComponent('บ้าน-peach'));
  });
});

describe('buildSiteGraphLd', () => {
  it('builds bare WebSite and Organization nodes in graph', () => {
    mockConfig.phone = null;
    mockConfig.socials = [];
    const ld = buildSiteGraphLd() as {
      '@context': string;
      '@graph': Array<{
        '@type': string;
        '@id': string;
        contactPoint?: { telephone?: string };
        sameAs?: string[];
        publisher?: { '@id': string };
      }>;
    };
    expect(ld['@context']).toBe('https://schema.org');
    expect(ld['@graph']).toHaveLength(2);

    const [org, site] = ld['@graph'];
    expect(org['@type']).toBe('Organization');
    expect(org['@id']).toContain('/#organization');
    expect(org.contactPoint?.telephone).toBeUndefined();
    expect(org.sameAs).toBeUndefined();

    expect(site['@type']).toBe('WebSite');
    expect(site['@id']).toContain('/#website');
    expect(site.publisher?.['@id']).toBe(org['@id']);
  });

  it('includes telephone when phone is active', () => {
    mockConfig.phone = '+66 81 234 5678';
    mockConfig.socials = [];
    const ld = buildSiteGraphLd() as {
      '@graph': Array<{
        contactPoint?: { telephone?: string };
      }>;
    };
    const [org] = ld['@graph'];
    expect(org.contactPoint?.telephone).toBe('+66 81 234 5678');
  });

  it('includes sameAs when socials are active', () => {
    mockConfig.phone = null;
    mockConfig.socials = ['https://instagram.com/housepeach'];
    const ld = buildSiteGraphLd() as {
      '@graph': Array<{
        sameAs?: string[];
      }>;
    };
    const [org] = ld['@graph'];
    expect(org.sameAs).toEqual(['https://instagram.com/housepeach']);
  });
});
