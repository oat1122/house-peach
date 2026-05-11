---
name: seo-page-checklist
description: Complete SEO checklist + templates for any public storefront page in house-peach — generateMetadata, Open Graph, Twitter card, JSON-LD structured data (Product, Offer, BreadcrumbList), sitemap inclusion, canonical URLs. Use this skill whenever you're creating or modifying a public route, launching a new template, or auditing pages before they go live. Trigger on phrases like "SEO this page", "add metadata", "structured data", "JSON-LD for products", "Open Graph tags", "make this indexable".
---

# SEO page checklist

This skill is the canonical template + verification list for any public route in house-peach. The goal: every shipped page passes Google Rich Results, Open Graph debuggers, and Lighthouse SEO ≥ 95.

## When to use

- Creating a new public route under `app/(storefront)/`
- Modifying metadata on an existing public page
- Auditing a page before phase close
- Translating a design template that doesn't yet have SEO

## The checklist

For every page, in order:

```
[ ] export metadata or generateMetadata
[ ] title: "<page subject> — house-peach"
[ ] description: 80-160 chars, descriptive, no stuffing
[ ] alternates.canonical: set, points to self
[ ] openGraph.title / description / images / type
[ ] twitter.card: 'summary_large_image' (for product / article)
[ ] images use next/image with descriptive alt
[ ] LCP image has priority
[ ] one h1 per page; heading hierarchy doesn't skip
[ ] JSON-LD <script type="application/ld+json"> for post (BlogPosting) / work (CreativeWork) / breadcrumb
[ ] route in app/sitemap.ts (or intentionally excluded)
[ ] app/robots.ts allows route
[ ] old slug 301-redirected (if URL changed)
```

## Templates

### 1. Static page metadata

```ts
// src/app/(storefront)/shop/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shop — house-peach',
  description: 'Shop the house-peach collection. Minimalist warm-tone essentials in linen, cotton, and wool.',
  alternates: { canonical: '/shop' },
  openGraph: {
    title: 'Shop — house-peach',
    description: 'Minimalist warm-tone essentials.',
    type: 'website',
    images: [{ url: '/og/shop.jpg', width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image' },
};
```

### 2. Dynamic page metadata

```ts
import type { Metadata } from 'next';
import { getPostBySlug } from '@/lib/services/post';
import { env } from '@/env';

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: 'ไม่พบบทความ — house-peach', robots: { index: false } };

  const description = post.excerpt;
  const ogImage = post.coverImage
    ? `${env.NEXT_PUBLIC_SITE_URL}${post.coverImage.path}`
    : `${env.NEXT_PUBLIC_SITE_URL}/og/default.jpg`;

  return {
    title: `${post.title} — house-peach`,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description,
      type: 'article',
      images: [{ url: ogImage, width: 1200, height: 630 }],
      publishedTime: post.publishedAt?.toISOString(),
      authors: [post.author.name],
    },
    twitter: { card: 'summary_large_image' },
  };
}
```

### 3. JSON-LD: BlogPosting (Article)

```tsx
import { env } from '@/env';

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: post.title,
  description: post.excerpt,
  image: post.coverImage ? [`${env.NEXT_PUBLIC_SITE_URL}${post.coverImage.path}`] : [],
  datePublished: post.publishedAt,
  dateModified: post.updatedAt,
  author: { '@type': 'Person', name: post.author.name },
  publisher: {
    '@type': 'Organization',
    name: 'house-peach',
    logo: { '@type': 'ImageObject', url: `${env.NEXT_PUBLIC_SITE_URL}/og/logo.png` },
  },
  mainEntityOfPage: { '@type': 'WebPage', '@id': `${env.NEXT_PUBLIC_SITE_URL}/blog/${post.slug}` },
  timeRequired: post.readingTimeMin ? `PT${post.readingTimeMin}M` : undefined,
};

return (
  <>
    <script type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
    />
    {/* page body */}
  </>
);
```

### 3b. JSON-LD: CreativeWork (portfolio work)

```tsx
const workJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CreativeWork',
  name: work.title,
  description: work.summary,
  image: work.images.map(i => `${env.NEXT_PUBLIC_SITE_URL}${i.path}`),
  creator: { '@type': 'Organization', name: 'house-peach' },
  dateCreated: work.yearCompleted ? `${work.yearCompleted}-01-01` : undefined,
  contentLocation: work.location ? { '@type': 'Place', name: work.location } : undefined,
  keywords: work.tags.map(t => t.name).join(', '),
  about: work.roomType,
};
```

### 4. JSON-LD: BreadcrumbList

```tsx
const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'หน้าแรก', item: env.NEXT_PUBLIC_SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Blog', item: `${env.NEXT_PUBLIC_SITE_URL}/blog` },
    { '@type': 'ListItem', position: 3, name: post.title },
  ],
};
```

### 5. Sitemap

```ts
// src/app/sitemap.ts
import type { MetadataRoute } from 'next';
import { listPublishedPosts } from '@/lib/services/post';
import { listPublishedWorks } from '@/lib/services/work';
import { env } from '@/env';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.NEXT_PUBLIC_SITE_URL;
  const [posts, works] = await Promise.all([listPublishedPosts(), listPublishedWorks()]);
  return [
    { url: `${base}/`, changeFrequency: 'daily', priority: 1.0 },
    { url: `${base}/blog`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/works`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/about`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/contact`, changeFrequency: 'monthly', priority: 0.5 },
    ...posts.map(p => ({
      url: `${base}/blog/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...works.map(w => ({
      url: `${base}/works/${w.slug}`,
      lastModified: w.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ];
}
```

### 6. Robots

```ts
// src/app/robots.ts
import type { MetadataRoute } from 'next';
import { env } from '@/env';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/admin', '/api'] },
    ],
    sitemap: `${env.NEXT_PUBLIC_SITE_URL}/sitemap.xml`,
  };
}
```

## Verify

After adding metadata + JSON-LD:

```bash
# Validate JSON-LD parses
node -e "JSON.parse(\`<paste your JSON-LD here>\`)"

# Crawl your dev URL
curl -s http://localhost:3000/blog/<slug> | grep -E 'application/ld\+json|og:title|<h1'
```

When deployed:
- Google Rich Results Test: https://search.google.com/test/rich-results
- Open Graph debugger (Facebook, LinkedIn)
- Lighthouse SEO ≥ 95

## Common pitfalls

- `description` empty → fall back to `${title}, ${primary tag name}` — never empty
- `image` URL relative → must be absolute; prepend `env.NEXT_PUBLIC_SITE_URL`
- JSON-LD `datePublished` in ISO 8601 format (`new Date().toISOString()`) — not unix timestamp
- Forgetting `alternates.canonical` → search engine sees query-string variants as duplicate content
- `robots: { index: false }` left in by accident on a page that should be indexed (most common bug after staging deploy)

## Don'ts

- Don't include data in JSON-LD that isn't visible on the page (Google penalizes "misleading structured data")
- Don't stuff keywords in title/description
- Don't use the same `og:image` for every page
