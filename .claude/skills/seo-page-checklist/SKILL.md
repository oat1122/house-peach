---
name: seo-page-checklist
description: Complete SEO + GEO (Generative Engine Optimization for AI Overviews) checklist + templates for any public storefront page in house-peach — generateMetadata, Open Graph, Twitter card, JSON-LD structured data (Article, CreativeWork, FAQPage, HowTo, BreadcrumbList, Person/E-E-A-T), answer-first content, answer capsules, question H2/H3, multi-modal content, sitemap inclusion, canonical URLs. Use this skill whenever you're creating or modifying a public route, writing a blog post, launching a new template, or auditing pages before they go live. Trigger on phrases like "SEO this page", "GEO check", "add metadata", "structured data", "JSON-LD", "FAQ schema", "AI Overview", "answer capsule", "Open Graph tags", "make this indexable".
---

# SEO + GEO page checklist

This skill is the canonical template + verification list for any public route in house-peach. The goal: every shipped page passes Google Rich Results, Open Graph debuggers, Lighthouse SEO ≥ 95, AND has a real chance of being cited in Google AI Overviews / Bing Chat / Perplexity / ChatGPT search.

> **Why GEO matters (Feb 2026):** AI Overviews appear on ~48% of SERPs. 47% of AI Overview citations come from pages ranked lower than #5 in traditional results. CTR for rank #1 drops 34.5% when an AI Overview appears — but pages cited in the overview see CTR up by 35%. **The goal is no longer just "rank top 10" — it's "be the source the AI cites".**

## When to use

- Creating a new public route under `app/(storefront)/`
- Modifying metadata on an existing public page
- Auditing a page before phase close
- Translating a design template that doesn't yet have SEO

## The checklist

For every page, in order:

### A. Metadata + indexing (traditional SEO)

```
[ ] export metadata or generateMetadata
[ ] title: "<long-tail question phrase> — house-peach"
[ ] description: 80-160 chars, descriptive, no stuffing
[ ] alternates.canonical: set, points to self
[ ] openGraph.title / description / images / type
[ ] twitter.card: 'summary_large_image' (for product / article)
[ ] images use next/image with descriptive alt
[ ] LCP image has priority
[ ] one h1 per page; heading hierarchy doesn't skip
[ ] route in app/sitemap.ts (or intentionally excluded)
[ ] app/robots.ts allows route
[ ] old slug 301-redirected (if URL changed)
```

### B. Structured data (JSON-LD)

```
[ ] BlogPosting / CreativeWork / Organization (page-appropriate)
[ ] BreadcrumbList for any page deeper than home
[ ] Article schema has author with sameAs[] + jobTitle (E-E-A-T)
[ ] FAQPage schema when page has a FAQ section
[ ] HowTo schema when page is step-by-step (with visible steps + step images)
[ ] All schema data exactly matches visible content (Google penalises mismatches)
[ ] dateModified auto-fills from row.updatedAt
```

### C. GEO content shape (informational pages — blog, services, FAQ)

```
[ ] Title is a long-tail question, not a noun phrase
[ ] First paragraph (≤200 words) contains the direct answer to the H1 query
[ ] No filler intro ("ในยุคที่...", "ปัจจุบันนี้...", brand history dump)
[ ] Each H2 is a standalone question, not a label
[ ] Every H2 has a 40-60 word "answer capsule" immediately under it
[ ] FAQ section (3-7 Q&A pairs) near bottom of page + FAQPage JSON-LD
[ ] Content has ≥2 of: original photo / video embed / structured data beyond Article
[ ] Internal links to ≥2 related post/work
```

### D. Freshness

```
[ ] dateModified visible in JSON-LD reflects today's edit (verify in browser DevTools)
[ ] If editing an old post: keep slug stable (slug change = lost rank)
[ ] Post age >6 months: review for outdated stats / images / advice
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

### 3. JSON-LD: BlogPosting (Article) — with E-E-A-T author

```tsx
import { env } from '@/env';

const origin = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: post.title,
  description: post.excerpt,
  image: post.coverImage ? [`${origin}${post.coverImage.path}`] : [`${origin}/og/logo.png`],
  datePublished: post.publishedAt,
  dateModified: post.updatedAt,
  // E-E-A-T: link author to verifiable identity. `sameAs[]` is the proof.
  // Without sameAs, AI engines treat the author as unverified.
  author: {
    '@type': 'Person',
    name: post.author.name,
    url: `${origin}/about#${post.author.handle}`,
    sameAs: [
      post.author.linkedin,
      post.author.instagram,
      post.author.facebook,
    ].filter(Boolean),                          // drop nulls
    jobTitle: post.author.jobTitle ?? 'Interior Design Consultant',
  },
  publisher: {
    '@type': 'Organization',
    name: 'house-peach',
    logo: { '@type': 'ImageObject', url: `${origin}/og/logo.png` },
  },
  mainEntityOfPage: { '@type': 'WebPage', '@id': `${origin}/blog/${post.slug}` },
  timeRequired: post.readingTimeMin ? `PT${post.readingTimeMin}M` : undefined,
  wordCount: post.wordCount ?? undefined,       // freshness signal
  inLanguage: 'th-TH',
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

> Add `users.linkedin`, `users.instagram`, `users.facebook`, `users.handle`, `users.jobTitle` columns when wiring E-E-A-T for the first time. See [`drizzle-add-table`](../drizzle-add-table/SKILL.md) for migration procedure.

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

### 3c. JSON-LD: FAQPage (any page with a FAQ section)

```tsx
type Faq = { question: string; answer: string };

const faqJsonLd = (faqs: Faq[]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({
    '@type': 'Question',
    name: f.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: f.answer,
    },
  })),
});

// Render — must mirror the visible FAQ section 1:1
const faqs: Faq[] = [
  {
    question: 'ตกแต่งห้องนอน minimalist ใช้งบเท่าไหร่?',
    answer: 'เริ่มต้นที่ 50,000 บาท สำหรับห้อง 20 ตรม. ครอบคลุมเตียง + โต๊ะข้างเตียง + พรม + โคมไฟ. งบ 100,000-150,000 จะรวม built-in wardrobe และผ้าม่าน custom ได้',
  },
  // ...
];

return (
  <>
    <script type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(faqs)) }}
    />
    <section>
      <h2>คำถามที่พบบ่อย</h2>
      {faqs.map((f) => (
        <details key={f.question}>
          <summary>{f.question}</summary>
          <p>{f.answer}</p>
        </details>
      ))}
    </section>
  </>
);
```

**Invariant:** every Q/A pair in the JSON-LD MUST appear verbatim on the page. Pasting answers from a draft into the schema but not the visible HTML → Google penalises misleading structured data.

> Suggested follow-up: create an MDX block `<FAQ items={[...]} />` that emits both visible content + JSON-LD from one source — wires through `lib/mdx/components.tsx` whitelist. See [`mdx-component-add`](../mdx-component-add/SKILL.md).

### 3d. JSON-LD: HowTo (step-by-step guides)

```tsx
const howToJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: post.title,
  description: post.excerpt,
  image: post.coverImage ? `${origin}${post.coverImage.path}` : undefined,
  totalTime: 'P14D',                            // ISO 8601 duration — 14 days
  estimatedCost: {
    '@type': 'MonetaryAmount',
    currency: 'THB',
    value: '80000',
  },
  supply: [
    { '@type': 'HowToSupply', name: 'เตียง low-profile' },
    { '@type': 'HowToSupply', name: 'พรมขนสั้น' },
  ],
  tool: [
    { '@type': 'HowToTool', name: 'ตลับเมตร' },
    { '@type': 'HowToTool', name: 'ระดับน้ำ' },
  ],
  step: steps.map((s, i) => ({
    '@type': 'HowToStep',
    position: i + 1,
    name: s.title,
    text: s.body,
    image: s.imageUrl,                          // must be absolute URL
    url: `${origin}/blog/${post.slug}#step-${i + 1}`,
  })),
};
```

**Required:** each step in JSON-LD must have a matching `<h3 id="step-N">` + image in the rendered MDX body. HowTo schema without visible steps → Google rejects entirely.

### 3e. JSON-LD: VideoObject (when embedding video)

```tsx
const videoJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'VideoObject',
  name: 'Before/After: ห้องนอน Japandi 25 ตรม.',
  description: 'ทัวร์ห้องก่อน-หลังตกแต่ง 14 วัน งบ 80,000 บาท',
  thumbnailUrl: `${origin}/uploads/posts/<uuid>/800.webp`,
  uploadDate: '2026-02-15',
  duration: 'PT45S',                            // 45 seconds
  contentUrl: 'https://www.youtube.com/watch?v=...',
  embedUrl: 'https://www.youtube.com/embed/...',
};
```

Multi-modal content (text + image + video + schema) has 317% higher AI Overview selection rate — VideoObject is the missing piece most house-peach posts skip.

### 3f. JSON-LD: Person (author profile on /about)

```tsx
// app/(public)/about/page.tsx — emit one Person per author
const authorJsonLd = (author: Author) => ({
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: author.name,
  url: `${origin}/about#${author.handle}`,
  image: author.avatar ? `${origin}${author.avatar}` : undefined,
  jobTitle: author.jobTitle,
  worksFor: {
    '@type': 'Organization',
    name: 'house-peach',
    url: origin,
  },
  sameAs: [
    author.linkedin,
    author.instagram,
    author.facebook,
  ].filter(Boolean),
  knowsAbout: ['Interior Design', 'Minimalism', 'Japandi', 'Warm-tone aesthetic'],
});
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

## GEO content shape templates

### Blog post body — answer-first skeleton

Every informational blog post follows this MDX skeleton:

```mdx
{/* H1 is rendered by the page shell from post.title — do NOT add # h1 in body */}

ห้องนอน minimalist สำเร็จในงบ 50,000-150,000 บาท สำหรับห้อง 20-30 ตรม.
เริ่มที่เตียง low-profile + โต๊ะข้างเตียง + พรม + โคมไฟ 2 จุด เลือกวัสดุไม้
oak/walnut + ผ้า linen สีเอิร์ธโทน — นี่คือสูตรพื้นฐานที่ใช้ได้กับห้องนอน
คอนโดส่วนใหญ่ในประเทศไทย

{/* ↑ Answer-first paragraph: 200 words MAX, contains direct answer to H1 */}

## ตกแต่งห้องนอน minimalist เริ่มจากตรงไหน?

เริ่มที่ floor plan และ traffic flow — วัดขนาดห้อง วาง layout เตียงและตู้ก่อน
แล้วค่อยเลือก palette สี (เน้น warm neutral 2-3 โทน) วัสดุ และเฟอร์นิเจอร์
ตามลำดับ. ห้ามเริ่มจากการเลือกของก่อน — จะเหลือของที่วางไม่ลงเสมอ

{/* ↑ 40-60 word answer capsule */}

[ขยายรายละเอียดต่อ — bullet list / sub-headings / รูป ฯลฯ]

## เลือกเฟอร์นิเจอร์ minimalist ยังไงให้ไม่เปลือง?

[capsule + expansion...]

<MDXImage src="/uploads/posts/<uuid>/800.webp" alt="ห้องนอน Japandi 25 ตรม. — before tone setting" />

## คำถามที่พบบ่อย

<FAQ items={[
  { question: '...', answer: '...' },
  { question: '...', answer: '...' },
]} />

{/* ↑ FAQ component emits both visible details + JSON-LD */}
```

### H2/H3 question generation — quick recipe

1. ใส่ keyword หลักของ post ใน Google → copy "People Also Ask" 5-7 คำถาม
2. เช็คเพิ่มใน AlsoAsked.com / AnswerThePublic
3. ตัดคำถามที่ผู้ตอบบอกว่า "depends" — เน้นคำถามที่ตอบเป็นตัวเลข/ขั้นตอนได้
4. ใช้คำถาม 3-7 ข้อเป็น H2/H3 ของ post (ลำดับจากกว้าง→แคบ)
5. คำถามที่ใช้ไม่หมด → ใส่เป็น FAQPage section ด้านล่าง

### Anti-patterns ที่เห็นบ่อยใน blog draft

| Bad | Why bad | Fix |
|---|---|---|
| H1: "5 เทคนิคตกแต่งห้องนอน" | noun phrase, no specific query intent | "ตกแต่งห้องนอน minimalist 25 ตรม. งบ 80,000 ทำได้ไหม?" |
| Intro: "ในยุคที่ผู้คนหันมาให้ความสำคัญกับ..." | filler, AI crawler bounces | ขึ้นต้นด้วย direct answer + ตัวเลขจริง |
| H2: "เฟอร์นิเจอร์" | label, not query | "ห้องนอนเล็กควรเลือกเฟอร์นิเจอร์อะไรก่อน?" |
| H2 ไม่มี capsule | ไม่มี extractable answer | เพิ่ม 40-60 word capsule ใต้ H2 ทันที |
| FAQ section ไม่มี JSON-LD | เสีย 3.2× citation chance | เพิ่ม `<FAQ>` block ที่ emit JSON-LD ด้วย |

## Verify

### Local checks (before commit)

```bash
# Validate JSON-LD parses
node -e "JSON.parse(\`<paste your JSON-LD here>\`)"

# Crawl your dev URL — confirm structured data + heading hierarchy
curl -s http://localhost:3000/blog/<slug> | grep -E 'application/ld\+json|og:title|<h1|<h2'

# Word-count the first paragraph — must be ≤200 words
# (manual: open the post in editor, select the intro paragraph)

# Verify every H2 has a capsule
curl -s http://localhost:3000/blog/<slug> \
  | grep -A 3 '<h2' \
  | head -40
```

### After deploy

| Tool | URL | What to check |
|---|---|---|
| Google Rich Results Test | https://search.google.com/test/rich-results | All JSON-LD blocks parse + recognised types (Article, FAQPage, HowTo, BreadcrumbList) |
| Schema.org Validator | https://validator.schema.org/ | Catches `@type` mismatches that Rich Results misses |
| Open Graph debugger | https://developers.facebook.com/tools/debug/ | OG title/description/image render |
| LinkedIn Post Inspector | https://www.linkedin.com/post-inspector/ | OG renders for LinkedIn |
| Lighthouse | DevTools → Lighthouse → SEO | ≥ 95 |
| Manual AI test | claude.ai / chatgpt.com / perplexity.ai | Paste your post URL, ask "What does this article say about X?" — confirm extraction is accurate |

### Monitoring (post-launch)

- Google Search Console → Performance → filter by **Search Appearance > AI Overviews** (when GSC ships the report — currently in rollout)
- Bing Webmaster → "AI search insights" (already live)
- Track citation rate per post via manual sampling (run 10-20 long-tail queries weekly, note which Citation appears)

## Common pitfalls

- `description` empty → fall back to `${title}, ${primary tag name}` — never empty
- `image` URL relative → must be absolute; prepend `env.NEXT_PUBLIC_SITE_URL`
- JSON-LD `datePublished` in ISO 8601 format (`new Date().toISOString()`) — not unix timestamp
- Forgetting `alternates.canonical` → search engine sees query-string variants as duplicate content
- `robots: { index: false }` left in by accident on a page that should be indexed (most common bug after staging deploy)
- FAQ answers in JSON-LD that don't match visible page text (Google penalises misleading structured data)
- HowTo schema without `<h3 id="step-N">` matching anchors in body (Google rejects schema entirely)
- Refreshing a post but changing the slug — accumulated rank/citations all reset
- Author JSON-LD with no `sameAs[]` — counts as unverified identity in AI engines
- Stuffing `keywords[]` on every schema with the same brand keywords (no-op; Google ignores)

## Don'ts

- Don't include data in JSON-LD that isn't visible on the page (Google penalises "misleading structured data")
- Don't stuff keywords in title/description
- Don't use the same `og:image` for every page
- Don't write filler intros ("ในยุคที่...", "ปัจจุบันนี้...") — AI crawler bounces at first 200 non-answer words
- Don't write H2 as noun phrases on informational pages — write as questions
- Don't ship a post without at least 2 of: original photo, video embed, FAQ section, HowTo steps
- Don't create a new post that overlaps a topic of an existing post — refresh the existing one (preserve slug + accumulated citations)
- Don't fake author credentials in `sameAs[]` — link only to real profiles you control
