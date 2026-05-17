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

---

## Generative Engine Optimization (GEO) — for AI Overviews

ทุกหน้า content (blog post, work detail, about, services) ต้องเขียนให้ AI search engines เลือก cite ได้ ไม่ใช่แค่ติดอันดับ traditional SERP. **AI Overview มี logic ของตัวเอง — เว็บเล็กก็ติดได้ ถ้าเขียนถูกแบบ.**

ตัวเลขที่ขับเคลื่อน rule นี้ (Feb 2026):
- AI Overviews ขึ้นบนผลค้นหา ~48% ของ queries
- 47% ของ citations มาจากเพจที่ rank ต่ำกว่าอันดับ 5 ใน traditional SERP
- CTR ของอันดับ 1 ลดเฉลี่ย 34.5% เมื่อมี AI Overview — แต่เพจที่ถูก cite ใน AI Overview เห็น CTR เพิ่มได้ถึง 35%

> "การถูก cite คือ ranking แบบใหม่" — goal คือเป็น "ตัวที่ AI เลือกอ้างอิง" ไม่ใช่แค่ติด top 10

### Invariant 1 — Answer-first paragraph

200 คำแรกของทุก blog post / informational page ต้องมี **คำตอบหลัก** ของหัวข้อ ห้ามขึ้นต้นด้วย:
- ❌ "ในยุคที่..."  · "ปัจจุบันนี้..." · "ก่อนอื่นเราต้องเข้าใจว่า..." — intro filler
- ❌ Story ยาวก่อนถึงประเด็น

ทำได้:
- ✅ ขึ้นต้นด้วย direct answer ของ H1 query → แล้วค่อยขยาย

**Why:** AI crawler หยุดอ่านถ้า 200 คำแรกไม่มี value. Passage extraction algorithm มองหา self-contained answer ขนาด 134-167 คำ ที่ตอบ query ได้สมบูรณ์ในตัวเอง

### Invariant 2 — Answer capsule ใต้ทุก H2

ทุก `<h2>` ใน blog post body MDX ต้องมี **answer capsule 40-60 คำ** ทันทีใต้ heading ก่อนเข้าเนื้อหาขยาย:

```mdx
## ตกแต่งห้องนอน minimalist ใช้งบเท่าไหร่?

ห้องนอน minimalist สำเร็จในงบ 50,000-150,000 บาท สำหรับห้อง 20-30 ตรม.
เริ่มที่เตียง low-profile + โต๊ะข้างเตียง + พรม + โคมไฟ 2 จุด เลือกวัสดุไม้
oak/walnut + ผ้า linen สีเอิร์ธโทน. งบเกิน 150,000 ใช้กับ built-in
wardrobe + curtains custom + เครื่องนอน premium

[ขยายรายละเอียดแยกเป็นย่อหน้า / bullet ต่อไป...]
```

**Why:** AI ให้ priority กับ passages ที่ตอบ query ได้สมบูรณ์ในตัวเอง — content ที่ได้ semantic completeness 8.5/10+ มีโอกาส cite สูงกว่า 4.2 เท่า

### Invariant 3 — H2/H3 เป็นคำถาม (informational content)

สำหรับ blog post / how-to / FAQ content, ทุก H2 และ H3 ต้องเขียนเป็น **คำถาม standalone** ไม่ใช่ noun phrase:

| ❌ Noun phrase | ✅ คำถาม |
|---|---|
| "ขั้นตอนการตกแต่งบ้าน" | "ตกแต่งบ้านสไตล์ minimalist เริ่มจากตรงไหน?" |
| "การเลือกเฟอร์นิเจอร์" | "ห้องนอนเล็กควรเลือกเฟอร์นิเจอร์แบบไหน?" |
| "งบประมาณ" | "ตกแต่งห้องนอน 20 ตรม. ใช้งบเท่าไหร่?" |

**Why:** AI Overviews match query intent. คำถามใน H2 = ตรงกับ user query → AI extract section นั้นโดยตรง. แหล่งหา query: Google "People Also Ask", AlsoAsked.com, AnswerThePublic

ยกเว้น: portfolio work detail (H2 เป็น section label เช่น "Before & After", "Materials" ได้ — ไม่ใช่ informational query content)

### Invariant 4 — Long-tail question keywords

อย่าสู้กับ keyword สั้นโลกใบใหญ่ ("ตกแต่งบ้าน", "interior design") — เป้าหมายคือ **long-tail question** ที่ตรงเป้า:

| ❌ Broad | ✅ Long-tail question |
|---|---|
| ตกแต่งบ้าน | ตกแต่งห้องนอนคอนโด 30 ตรม. สไตล์ Japandi งบ 80,000 |
| Japandi style | Japandi กับ Scandinavian ต่างกันยังไง |
| Living room | ห้องนั่งเล่นทาวน์เฮาส์แคบ ๆ จัดยังไงให้ดูกว้าง |

หัวข้อ post + URL slug ต้องสอดคล้อง:
- Title: `ตกแต่งห้องนอนคอนโด 30 ตรม. สไตล์ Japandi งบ 80,000 — house-peach`
- Slug: `japandi-condo-bedroom-30sqm-budget-80k`

### Invariant 5 — Multi-modal content

หน้า content ที่อยากให้ AI cite ต้องรวมอย่างน้อย 3 จาก 4:
- ✓ Text (answer-first + capsules)
- ✓ Original images (before/after, process, detail) — ห้ามใช้ stock photo
- ✓ Video (YouTube embed / short clip 30-60 วินาที)
- ✓ Structured data (JSON-LD ตรงกับเนื้อหา)

**Why:** หน้าที่รวม 4 component นี้มี selection rate ใน AI Overviews สูงกว่า 317%. YouTube เป็นแหล่ง cite อันดับ 2 โดย LLMs

สำหรับ house-peach: before/after image + clip TikTok/YouTube 30 วินาที + embed กลับมาในเพจ = สูตรเข้า AI Overview

### Invariant 6 — Author E-E-A-T

ทุก blog post ต้องมี Article JSON-LD ที่ link author ไปยัง verifiable identity:

```ts
author: {
  '@type': 'Person',
  name: post.author.name,
  url: `${origin}/about#${post.author.handle}`,    // author profile page
  sameAs: [                                         // external verification
    'https://www.linkedin.com/in/...',
    'https://www.instagram.com/...',
  ],
  jobTitle: 'Interior Design Consultant',
}
```

**Why:** การพิสูจน์ตัวตน = link building แบบใหม่ ปี 2026. AI engines ใช้ author trust signals ตัดสินว่าจะ cite หรือไม่

ต้องการ:
- หน้า /about ที่มี anchor #per-author (about page H2 = ชื่อ author, มี bio + credentials)
- `users` table มี field `linkedin`, `instagram`, `jobTitle` (เพิ่ม column ถ้ายังไม่มี)
- ห้าม fake credentials — Google penalize misleading E-E-A-T

### Invariant 7 — Freshness > new

มากกว่า 50% ของ citations ใน AI search มาจาก content ที่ publish ใน 12-18 เดือนล่าสุด. นโยบาย:

- ทุก blog post ที่อายุ ≥ 6 เดือน → ตรวจ + refresh (อัปเดต stat, เพิ่ม section ใหม่, update รูป) ทุก quarter
- Refresh **เก็บ canonical URL เดิม** เสมอ — สะสม credibility signal ที่ AI จดจำ
- แตะ `updatedAt` (drizzle ทำให้แล้ว) → JSON-LD `dateModified` อัปเดตอัตโนมัติ
- **อย่า** สร้าง post ใหม่ที่ทับ topic เดิม — refresh post เดิมแทน

ห้าม:
- ห้าม refresh แล้วเปลี่ยน slug (URL เก่าจะหลุด rank)
- ห้าม refresh แบบเขียนใหม่หมด — ต้องเก็บ section ที่ AI เคย cite ไว้

### Invariant 8 — Brand mentions (off-page signal)

AI engines เก็บ brand mentions ไปเป็น signal **แม้ไม่มี backlink**. ทุก content marketing initiative ควร target:
- Pantip threads (interior design forum)
- Facebook groups (กลุ่มตกแต่งบ้าน, คอนโด*)
- Google Business Profile (มี post + photo upload เป็นประจำ)
- Industry blog / press release
- Featured in interior design publications

ห้าม: ซื้อ link / spam mention — Google detect ได้ + AI engines weight ต่ำลง

## Additional structured data — FAQ + HowTo

นอกเหนือจาก Article + CreativeWork + BreadcrumbList ที่มีอยู่แล้ว ต้องเพิ่ม:

### FAQPage schema — ทุกหน้าที่มี FAQ section

```tsx
const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
};
```

**Why:** เพจที่ใช้ FAQPage schema มีโอกาสปรากฏใน AI Overviews สูงกว่าไม่มี structured data **3.2 เท่า** และ citation rate สูงกว่า 28%

**Invariant:** schema ต้องตรง content ที่ render จริงในเพจ — Q&A pair ใน JSON-LD ต้องเขียนตรงกับ visible HTML ทุก field. Google penalize misleading structured data หนัก

ดู template ใน skill [`seo-page-checklist`](../skills/seo-page-checklist/SKILL.md) § FAQ

### HowTo schema — ทุกหน้าที่เป็นขั้นตอน step-by-step

```tsx
const howToJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'วิธีจัดห้องนอน Japandi งบ 80,000 บาท',
  description: post.excerpt,
  totalTime: 'P14D',   // 14 days
  estimatedCost: {
    '@type': 'MonetaryAmount',
    currency: 'THB',
    value: '80000',
  },
  step: [
    {
      '@type': 'HowToStep',
      position: 1,
      name: 'วัดและวาง layout',
      text: '...',
      image: `${origin}/uploads/posts/<uuid>/800.webp`,
    },
    // ...
  ],
};
```

**Required:** เพจต้องมี visible steps H2/H3 + รูปประกอบทุก step. HowTo schema ที่ไม่มี visible step → Google reject

### Page-type → schema decision table

| Page kind | Required schemas |
|---|---|
| Blog post (how-to/guide) | Article + FAQPage (ถ้ามี FAQ) + HowTo (ถ้าเป็น step) + BreadcrumbList |
| Blog post (opinion/story) | Article + BreadcrumbList |
| Portfolio work | CreativeWork + BreadcrumbList + (Image/VideoObject ถ้ามี) |
| Service page | Service + FAQPage + BreadcrumbList |
| Home | Organization + WebSite (with `potentialAction` for search) |
| About | Person (per author) + Organization |
| Contact | Organization + LocalBusiness (ถ้ามี physical office) |

## GEO content checklist — every blog post + service page

ใช้ก่อน publish ทุกครั้ง:

```
[ ] Title is a long-tail question phrase
[ ] First paragraph (≤200 words) contains the direct answer
[ ] Every H2 has a 40-60 word answer capsule directly underneath
[ ] H2/H3 are questions, not noun phrases (informational content)
[ ] FAQ section (3-7 Q&A) at bottom + FAQPage JSON-LD
[ ] At least 2 of: original image / video embed / structured data beyond Article
[ ] Author JSON-LD with sameAs links + jobTitle
[ ] Internal links to ≥2 related post/work
[ ] No "ในยุคที่..." / generic intro filler
[ ] dateModified auto-updates via drizzle (verify in JSON-LD output)
```
