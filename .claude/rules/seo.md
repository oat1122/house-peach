# SEO rules

ทุก public route ต้องผ่าน SEO baseline — ลูกค้าค้น Google ไม่เจอ ไม่มีคนรู้จัก ไม่มี lead

## Every public page needs metadata

ทุกไฟล์ใน `src/app/(public)/**/page.tsx` ต้อง export `metadata` (static) หรือ `generateMetadata` (dynamic):

```ts
// static
export const metadata: Metadata = {
  title: 'Blog — house-peach',
  description: 'แรงบันดาลใจ + how-to ตกแต่งบ้านสไตล์อบอุ่นแบบเรียบง่าย',
  alternates: { canonical: '/blog' },
};

// dynamic
export async function generateMetadata({ params }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: 'ไม่พบบทความ — house-peach', robots: { index: false } };
  return {
    title: `${post.title} — house-peach`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      images: post.coverImage ? [`${env.NEXT_PUBLIC_SITE_URL}${post.coverImage.path}`] : [],
      publishedTime: post.publishedAt?.toISOString(),
      authors: [post.author.name],
    },
    twitter: { card: 'summary_large_image' },
    alternates: { canonical: `/blog/${post.slug}` },
  };
}
```

ถ้าหน้านั้น admin / draft ที่ไม่ควร index ให้ใส่:
```ts
robots: { index: false, follow: false }
```

## Title format

`<Page-specific> — house-peach` — brand name อยู่หลัง — เพื่อ SEO weight ลง content จริงก่อน

ตัวอย่าง:
- `5 เทคนิคตกแต่งห้องนอนสไตล์ Japandi — house-peach`
- `Works — house-peach`
- `Blog — house-peach`
- `About — house-peach`

ห้ามใช้ `house-peach — Home`, `house-peach | Blog` หรือ format อื่น

## Description constraint

- ความยาว 80-160 ตัวอักษร
- ห้าม keyword stuffing
- ใส่ key info: หัวข้อ, สไตล์, room type (สำหรับ work), หรือคีย์เวิร์ดที่คนค้น
- ถ้าไม่มี description ใน DB → fall back เป็น `${title}, ${category หรือ tag.label}` — ห้าม empty / undefined

## Structured data — JSON-LD

### Blog post → `BlogPosting` / `Article`

```tsx
<script type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify({
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
  })}}
/>
```

### Portfolio work → `CreativeWork`

```tsx
<script type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify({
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
  })}}
/>
```

### Home → `Organization`

ครั้งเดียวที่ root layout (ไม่ใช่ทุกหน้า):

```tsx
{
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'house-peach',
  url: env.NEXT_PUBLIC_SITE_URL,
  logo: `${env.NEXT_PUBLIC_SITE_URL}/og/logo.png`,
  sameAs: [
    'https://www.facebook.com/...',
    'https://www.instagram.com/...',
    'https://www.pinterest.com/...',
  ],
}
```

### `BreadcrumbList` ใส่ทุกหน้าที่ลึกกว่า home

`/blog` → `/blog/[slug]`, `/works` → `/works/[slug]`

**ห้าม**: ใส่ JSON-LD ที่ไม่ตรงกับเนื้อหาจริง (Google ลงโทษ misleading structured data)

## Sitemap & robots

- `app/sitemap.ts` query posts + works ทั้งหมด — output `<loc>` + `<lastmod>` (เฉพาะ status=published)
- `app/robots.ts` disallow `/admin`, `/api`, allow ที่เหลือ
- ทุก slug change ต้องอัปเดต redirect (301) ใน `next.config.ts` `redirects()` — ห้าม 404 URL เก่า

## Canonical URLs

- ทุกหน้าใส่ `alternates.canonical` ที่ชี้ self
- Filter / sort params (`?room=living&style=japandi`) → canonical ชี้ base URL ไม่มี params (กัน duplicate content)

## Image SEO

- ใช้ `next/image` ทุก post/work cover และ gallery
- `alt` ต้อง descriptive — `${work.title} — ${work.roomType}, สไตล์ ${work.style}` ไม่ใช่ `'image'` หรือ filename
- LCP image (hero, first card) ใส่ `priority` — รูปอื่น lazy
- ใน MDX body, custom `<MDXImage>` component บังคับใส่ `alt`

## Performance = SEO

Core Web Vitals คือ ranking factor:
- LCP < 2.5s
- INP < 200ms
- CLS < 0.1

ใช้ skill `perf-audit` ตรวจก่อนปิด phase

## Ranking-friendly content

### Blog post
- หัวข้อชัดเจน คีย์เวิร์ดอยู่ใน h1
- intro paragraph 1-2 ประโยค สรุปว่าจะได้อะไร
- heading h2/h3 มีโครงสร้าง — ใส่ `rehype-slug` + `rehype-autolink-headings` อยู่แล้ว → anchor #
- internal link ไปยัง related post / work
- estimated reading time แสดงหัวบทความ
- เพิ่ม alt text descriptive ทุกรูป

### Portfolio work
- summary 1-2 ประโยคใน hero (สำหรับ snippet)
- ระบุ style, room type, location (long-tail keywords)
- before/after รูปคู่กัน — เรียก attention และ social share สูง
- link ไปยัง blog post ที่อธิบาย method ของงานนี้

### Home page
- hero มี value proposition ชัดเจน + CTA
- featured works section
- latest posts section
- brand story สั้น ๆ + link ไป /about

## OG image strategy

V1: ใช้ cover image ของ post/work เป็น og:image ตรง ๆ
V2 (Phase 7): generate OG image dynamic ผ่าน `next/og` `ImageResponse` — ปรับขนาด 1200×630 + overlay title + brand mark
