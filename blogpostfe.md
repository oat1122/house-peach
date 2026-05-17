# Blog Post Detail — UI/Style Spec (for Next.js port)

> Source: [src/views/BlogDetailView.vue](src/views/BlogDetailView.vue)
> Scope: **UI + style เท่านั้น** — ไม่รวม fetch/scroll-spy/share function
> Route: `/blog/[slug]`
> Stack คาดหวังของ Next.js: App Router + CSS Modules (หรือ Tailwind) + next/image

## 2. Page Layout (Bird's eye)

```
┌─────────────────────────────────────────────────────────┐
│ Reading Progress Bar (fixed top, 3px, brand gradient)   │
├─────────────────────────────────────────────────────────┤
│  ┌─── HERO ────────────────────────────────────────┐   │
│  │  [breadcrumb]                                    │   │
│  │  [category badge] • [date] • [reading time]     │   │
│  │  H1 Title (clamp 1.9-3rem, balance)              │   │
│  │  Excerpt (clamp 1-1.15rem)                       │   │
│  │  [Cover image 16:9, rounded]                     │   │
│  │  (background: white + 2 blurred radial geo blobs)│   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─ BODY (grid 1fr | 320px, gap 60px) ──────────────┐  │
│  │ ┌─ Main ──────────────┐  ┌─ Sidebar (sticky) ─┐  │  │
│  │ │ <article prose>     │  │ ┌─ TOC (200px,    │  │  │
│  │ │  - h2 with red bar  │  │ │   expandable)  │  │  │
│  │ │  - h3               │  │ └────────────────┘  │  │
│  │ │  - p / a / strong   │  │ ┌─ Related Service│  │  │
│  │ │  - img (rounded 16) │  │ │   OR CTA card   │  │  │
│  │ │  - blockquote       │  │ └────────────────┘  │  │
│  │ │  - code / pre       │  │ ┌─ Recent Posts   │  │  │
│  │ │  - ul/ol/table      │  │ └────────────────┘  │  │
│  │ │  - .pna-file-block  │  └─────────────────────┘  │
│  │ └─────────────────────┘                          │  │
│  │ ┌─ Share row + Back link                       ┐ │  │
│  │ └───────────────────────────────────────────────┘ │  │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─ RELATED (bg gradient grey, top border) ─────────┐  │
│  │  [h2 "บทความที่คุณอาจสนใจ"]                       │  │
│  │  Grid: auto-fill minmax(280px, 1fr), gap 24       │  │
│  │  [rel-card] [rel-card] [rel-card] [rel-card]      │  │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  [Back to top FAB] (fixed bottom-right, show after 15%) │
└─────────────────────────────────────────────────────────┘
```

Responsive: ≤1024px → sidebar เลื่อนลงล่าง (1 column). ≤768px → padding ลด, share row stack vertical

---

## 3. Component Tree (Next.js suggestion)

```
app/blog/[slug]/page.tsx
├─ <ReadingProgress />          (client, scroll listener → scaleX bar)
├─ <PostHero post={...} />
│   ├─ <Breadcrumb items={[...]} />
│   ├─ <PostMetaRow date, readingTime, category />
│   ├─ <PostTitle />
│   ├─ <PostExcerpt />
│   └─ <HeroCover image, alt />     (next/image, priority)
├─ <PostBody>
│   ├─ <PostMain>
│   │   ├─ <PostContent html={processedHtml} />   ← server-render HTML
│   │   └─ <PostFooter>
│   │       ├─ <ShareRow slug, title />
│   │       └─ <BackLink />
│   └─ <PostSidebar>
│       ├─ <TableOfContents tree={...} />          (client, scroll-spy)
│       ├─ <RelatedServiceCard service />          OR
│       └─ <CtaCard />
│       └─ <RecentPostsCard posts />
├─ <RelatedSection posts={...} />
└─ <BackToTopButton />
```

---

## 4. Section-by-section spec

### 4.1 Reading Progress Bar

```css
.read-progress {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: linear-gradient(90deg, #ef4235, #ff6b35);
  transform-origin: left;
  transform: scaleX(0); /* drive 0→1 via JS scrollY/maxScroll */
  z-index: 100;
  transition: transform 0.1s linear;
}
```

### 4.2 Hero

```css
.post-hero {
  position: relative;
  padding: 130px 0 40px; /* @ ≤768px → 100px 0 30px */
  overflow: hidden;
  background: #ffffff;
}

/* 2 blurred radial blobs (decorative) */
.hero-geo {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}
.geo {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.18;
}
.geo-a {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, #ef4235 0%, transparent 70%);
  top: -180px;
  right: -150px;
}
.geo-b {
  width: 380px;
  height: 380px;
  background: radial-gradient(circle, #ff8c00 0%, transparent 70%);
  top: 120px;
  left: -100px;
  opacity: 0.12;
}

.hero-inner {
  position: relative;
  max-width: 880px;
}
```

### 4.3 Breadcrumb

```css
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: #6b7280;
  margin-bottom: 24px;
  flex-wrap: wrap;
}
.breadcrumb a {
  color: #6b7280;
  text-decoration: none;
  transition: color 0.15s;
}
.breadcrumb a:hover {
  color: #ef4235;
}
.bc-sep {
  opacity: 0.4;
} /* "/" separator */
.bc-current {
  color: #1a1a1a;
  font-weight: 600;
}
```

HTML pattern:

```html
<nav class="breadcrumb">
  <a href="/">หน้าแรก</a>
  <span class="bc-sep">/</span>
  <a href="/blog">บทความ</a>
  <span class="bc-sep">/</span>
  <span class="bc-current">{category}</span>
</nav>
```

### 4.4 Post Meta Row (category badge + dot + items)

```css
.post-meta-top {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 18px;
}
.cat-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: rgba(239, 66, 53, 0.08);
  color: #ef4235;
  border-radius: 100px;
  font-size: 0.82rem;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.18s;
}
.cat-badge:hover {
  background: #ef4235;
  color: #fff;
}
.cat-badge .icon {
  font-size: 16px;
}
.meta-dot {
  color: #d1d5db;
}
.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.85rem;
  color: #6b7280;
}
.meta-item .icon {
  font-size: 16px;
}
```

### 4.5 Title + Excerpt

```css
.post-title {
  font-size: clamp(1.9rem, 4vw, 3rem);
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.02em;
  text-wrap: balance;
  color: #1a1a1a;
  margin: 0 0 20px;
}
.post-excerpt {
  font-size: clamp(1rem, 1.4vw, 1.15rem);
  color: #6b7280;
  line-height: 1.7;
  margin: 0 0 36px;
  max-width: 720px;
}
```

### 4.6 Hero Cover

```css
.hero-cover {
  border-radius: clamp(16px, 2vw, 24px);
  overflow: hidden;
  aspect-ratio: 16 / 9;
  background: #f3f4f6;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
  margin-top: 12px;
}
.hero-cover img {
  width: 100%;
  height: 100%;
  object-fit: contain; /* ⚠️ contain ไม่ใช่ cover */
  display: block;
}
```

Next.js: `<Image src={cover} alt={title} width={1200} height={630} priority />` ใน wrapper ที่มี style ข้างบน — ตั้ง `style={{ objectFit: 'contain' }}` หรือ `className="object-contain"`

### 4.7 Body grid layout

```css
.post-container {
  padding: 50px 0 120px;
} /* ≤768px → 30px 0 60px */

.post-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 60px;
  align-items: start;
}
@media (max-width: 1024px) {
  .post-layout {
    grid-template-columns: 1fr;
    gap: 40px;
  }
}
.post-main {
  min-width: 0;
} /* กัน text overflow ใน grid */
```

---

## 5. Content prose (rich text from HTML)

ใช้กับ `<article dangerouslySetInnerHTML={{ __html: processedHtml }} />` ใน Next.js

Base:

```css
.post-content {
  font-size: 1.08rem; /* ≤768px → 1rem */
  line-height: 1.85; /* ≤768px → 1.8 */
  color: #2a2a2a;
  letter-spacing: 0.005em;
}
```

**Headings** (h2 มี red bar เป็น signature — ห้ามขาด)

```css
.prose h2 {
  font-size: clamp(1.4rem, 2.4vw, 1.85rem);
  font-weight: 700;
  letter-spacing: -0.01em;
  margin: 2.2em 0 0.7em;
  scroll-margin-top: 110px; /* offset เผื่อ sticky header */
  position: relative;
  padding-left: 18px;
}
.prose h2::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0.25em;
  bottom: 0.25em;
  width: 4px;
  background: linear-gradient(180deg, #ef4235, #ff6b35);
  border-radius: 4px;
}
.prose h3 {
  font-size: clamp(1.15rem, 1.8vw, 1.35rem);
  font-weight: 700;
  margin: 1.8em 0 0.6em;
  scroll-margin-top: 110px;
  color: #1a1a1a;
}
.prose h4 {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 1.5em 0 0.5em;
}
```

**Inline**

```css
.prose p {
  margin: 0 0 1.3em;
}
.prose a {
  color: #ef4235;
  text-decoration: none;
  background-image: linear-gradient(
    transparent 65%,
    rgba(239, 66, 53, 0.18) 0
  ); /* highlighter underline */
  transition: color 0.15s;
}
.prose a:hover {
  color: #c8361d;
}
.prose strong {
  font-weight: 700;
  color: #1a1a1a;
}
.prose em {
  font-style: italic;
}
```

**Image**

```css
.prose img {
  border-radius: 16px;
  margin: 1.8em 0;
  width: 100%;
  display: block;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);
}
```

**Blockquote**

```css
.prose blockquote {
  margin: 1.8em 0;
  padding: 18px 24px;
  background: linear-gradient(
    135deg,
    rgba(239, 66, 53, 0.05),
    rgba(255, 140, 0, 0.03)
  );
  border-left: 4px solid #ef4235;
  border-radius: 0 14px 14px 0;
  font-style: italic;
  color: #4b5563;
}
.prose blockquote p:last-child {
  margin-bottom: 0;
}
```

**Lists**

```css
.prose ul,
.prose ol {
  margin: 0 0 1.4em;
  padding-left: 1.6em;
}
.prose li {
  margin-bottom: 0.5em;
}
.prose ul li::marker {
  color: #ef4235;
}
```

**Code**

```css
.prose code {
  background: #f3f4f6;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 0.92em;
  color: #ef4235;
  font-family: "JetBrains Mono", ui-monospace, monospace;
}
.prose pre {
  background: #1a1a1a;
  color: #f3f4f6;
  padding: 20px;
  border-radius: 14px;
  overflow-x: auto;
  margin: 1.8em 0;
  font-size: 0.9em;
  line-height: 1.6;
}
.prose pre code {
  background: transparent;
  color: inherit;
  padding: 0;
  border-radius: 0;
}
```

**Divider**

```css
.prose hr {
  border: none;
  height: 1px;
  background: linear-gradient(90deg, transparent, #e5e7eb, transparent);
  margin: 2.5em 0;
}
```

**Table**

```css
.prose table {
  width: 100%;
  border-collapse: collapse;
  margin: 1.8em 0;
  font-size: 0.95em;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}
.prose th,
.prose td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #f1f1f0;
}
.prose th {
  background: #fafafa;
  font-weight: 700;
  color: #1a1a1a;
}
```

**File attachment block** (custom .pna-file-block)

```css
.prose .pna-file-block {
  margin: 1.8em 0;
  padding: 20px;
  background: linear-gradient(135deg, #fff, #fdf6f4);
  border: 1px solid rgba(239, 66, 53, 0.15);
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 18px;
  transition: all 0.25s;
}
.prose .pna-file-block:hover {
  border-color: #ef4235;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(239, 66, 53, 0.1);
}
.prose .pna-download-btn {
  background: #ef4235 !important;
  color: #fff !important;
  transition: 0.25s;
}
.prose .pna-download-btn:hover {
  background: #c8361d !important;
  transform: translateY(-1px);
}
```

> 💡 Next.js tip: ห่อ prose style ใน `.prose` namespace แล้วใช้ child selector — เลี่ยง global rule ที่ leak ออกหน้าอื่น

---

## 6. Footer (share + back)

```css
.post-footer {
  margin-top: 56px;
  padding-top: 32px;
  border-top: 1px solid #f1f1f0;
}

.share-row {
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 28px;
}
/* ≤768px → flex-direction: column; align-items: flex-start */

.share-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1.5px solid rgba(239, 66, 53, 0.18);
  border-radius: 100px;
  background: rgba(239, 66, 53, 0.06);
  padding: 9px 14px;
  font-size: 0.92rem;
  font-weight: 700;
  color: #1a1a1a;
  cursor: pointer;
  transition:
    background 0.18s,
    border-color 0.18s,
    color 0.18s,
    transform 0.18s;
}
.share-label .icon {
  font-size: 18px;
  color: #ef4235;
}
.share-label:hover {
  background: #ef4235;
  border-color: #ef4235;
  color: #fff;
  transform: translateY(-1px);
}
.share-label:hover .icon {
  color: #fff;
}

.share-btns {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.share-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 14px;
  border-radius: 100px;
  border: 1.5px solid #e5e7eb;
  background: #fff;
  color: #4b5563;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.share-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
}
.share-btn.fb:hover {
  background: #1877f2;
  border-color: #1877f2;
  color: #fff;
}
.share-btn.x:hover {
  background: #000;
  border-color: #000;
  color: #fff;
}
.share-btn.line:hover {
  background: #06c755;
  border-color: #06c755;
  color: #fff;
}
.share-btn.line .line-mark {
  font-weight: 800;
  letter-spacing: 0.05em;
  font-size: 0.78rem;
}
.share-btn.copy.ok {
  background: #ef4235;
  border-color: #ef4235;
  color: #fff;
}
.share-btn .icon {
  font-size: 18px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #6b7280;
  text-decoration: none;
  transition:
    color 0.18s,
    gap 0.18s;
}
.back-link:hover {
  color: #ef4235;
  gap: 10px;
}
```

Brand colors ของปุ่ม share:

- Facebook hover: `#1877f2`
- X (Twitter) hover: `#000`
- LINE hover: `#06c755`
- Copy success: `#ef4235`

---

## 7. Sidebar

### 7.1 Sidebar wrapper

```css
.post-sidebar {
  position: sticky;
  top: 110px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-self: start;
  max-height: calc(100vh - 130px);
  min-height: 0;
}
@media (max-width: 1024px) {
  .post-sidebar {
    position: static;
    max-height: none;
    gap: 20px;
  }
}
```

### 7.2 Side card (base)

```css
.side-card {
  background: #fff;
  padding: 20px;
  border-radius: 18px;
  border: 1px solid #f1f1f0;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.025);
  flex-shrink: 0;
  transition:
    opacity 0.25s,
    transform 0.25s;
}
.side-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.92rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 16px;
  letter-spacing: 0.01em;
}
.side-title .icon {
  font-size: 18px;
  color: #ef4235;
}
```

### 7.3 Table of Contents (collapsible, scroll-spy ready)

ส่วนซับซ้อนสุด — มี collapsed (200px) / expanded (เต็มข้าง) states + vertical progress rail + hierarchical h2/h3

```css
.toc-card {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 0 0 auto;
  height: 200px;
  overflow: hidden;
  transition: box-shadow 0.25s;
}
.toc-card.is-expanded {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: calc(100vh - 130px);
  max-height: calc(100vh - 130px);
  min-height: 320px;
  z-index: 10;
  background: #fff;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.12);
  animation: tocExpand 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: top center;
}
@keyframes tocExpand {
  from {
    transform: scaleY(0.92);
  }
  to {
    transform: scaleY(1);
  }
}
/* ตอน TOC expand → fade card อื่นๆ ใน sidebar */
.toc-card.is-expanded ~ .side-card {
  opacity: 0;
  transform: scale(0.98);
  pointer-events: none;
  transition:
    opacity 0.2s,
    transform 0.25s;
}

/* @ ≤1024px: TOC ไม่ collapse — height auto, max-height 60vh */
@media (max-width: 1024px) {
  .toc-card,
  .toc-card.is-expanded {
    position: relative;
    height: auto;
    max-height: 60vh;
    min-height: 0;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.025);
  }
  .toc-chevron {
    display: none;
  }
  .toc-title-btn {
    cursor: default;
  }
}

/* Title button */
.toc-title-btn {
  width: 100%;
  background: none;
  border: none;
  padding: 0;
  margin: 0 0 14px;
  cursor: pointer;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.92rem;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: 0.01em;
  transition: color 0.18s;
}
.toc-title-btn:hover {
  color: #ef4235;
}
.toc-title-btn .icon-leading {
  font-size: 18px;
  color: #ef4235;
}

.toc-chevron {
  margin-left: auto;
  font-size: 20px;
  color: #9ca3af;
  transition:
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    color 0.18s;
}
.toc-card.is-expanded .toc-chevron {
  transform: rotate(180deg);
  color: #ef4235;
}

.toc-count {
  font-size: 0.7rem;
  font-weight: 700;
  color: #ef4235;
  background: rgba(239, 66, 53, 0.08);
  padding: 2px 9px;
  border-radius: 100px;
  letter-spacing: 0.02em;
}

/* Scroll area + fade bottom hint */
.toc-scroll {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}
.toc-scroll::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 24px;
  background: linear-gradient(180deg, transparent, #fff);
  pointer-events: none;
  z-index: 2;
}

/* Vertical progress rail (left side) */
.toc-progress {
  position: absolute;
  left: 13px; /* center @ x=14 */
  top: 8px;
  bottom: 8px;
  width: 2px;
  background: #f1f1f0;
  border-radius: 2px;
  pointer-events: none;
  z-index: 0;
}
.toc-progress-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  background: linear-gradient(180deg, #ef4235, #ff6b35);
  border-radius: 2px;
  transition: height 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 0 8px rgba(239, 66, 53, 0.4);
  /* style.height set via JS to 0%-100% */
}

/* List */
.toc-list {
  list-style: none;
  padding: 4px 6px 28px 28px;
  margin: 0;
  position: relative;
  height: 100%;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: #e5e7eb transparent;
}
.toc-list::-webkit-scrollbar {
  width: 6px;
}
.toc-list::-webkit-scrollbar-track {
  background: transparent;
}
.toc-list::-webkit-scrollbar-thumb {
  background: #e5e7eb;
  border-radius: 4px;
  border: 1px solid #fff;
}
.toc-list::-webkit-scrollbar-thumb:hover {
  background: #ef4235;
}

.toc-section {
  position: relative;
}
.toc-section + .toc-section {
  margin-top: 2px;
}

.toc-link {
  position: relative;
  display: block;
  padding: 6px 8px 6px 4px;
  font-size: 0.86rem;
  color: #6b7280;
  text-decoration: none;
  line-height: 1.5;
  border-radius: 8px;
  transition: all 0.2s;
}
.toc-link:hover {
  color: #ef4235;
  background: rgba(239, 66, 53, 0.04);
}

.toc-text {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* H2 bullet on rail */
.toc-h2 {
  font-weight: 600;
  color: #4b5563;
}
.toc-bullet {
  position: absolute;
  left: -18px;
  top: 11px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #fff;
  border: 2px solid #d1d5db;
  transition: all 0.25s;
  z-index: 1;
}
.toc-section.active .toc-bullet,
.toc-section.has-active-child .toc-bullet {
  border-color: #ef4235;
  background: #ef4235;
  box-shadow: 0 0 0 4px rgba(239, 66, 53, 0.15);
  transform: scale(1.15);
}
.toc-section.active > .toc-link,
.toc-section.has-active-child > .toc-link {
  color: #1a1a1a;
  font-weight: 700;
}

/* H3 sublist (collapsed when parent inactive) */
.toc-sub {
  list-style: none;
  padding: 0 0 0 14px;
  margin: 0;
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transition:
    max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.25s,
    margin 0.25s;
}
.toc-section.active .toc-sub,
.toc-section.has-active-child .toc-sub {
  max-height: 800px;
  opacity: 1;
  margin: 4px 0 8px;
}

.toc-subitem {
  position: relative;
}
.toc-h3 {
  padding: 5px 10px 5px 22px;
  font-size: 0.82rem;
}
.toc-h3::before {
  content: "";
  position: absolute;
  left: 0;
  top: 50%;
  width: 6px;
  height: 1px;
  background: #d1d5db;
  transform: translateY(-50%);
  transition:
    background 0.2s,
    width 0.2s;
}
.toc-subitem.active .toc-h3 {
  color: #ef4235;
  font-weight: 700;
  background: rgba(239, 66, 53, 0.06);
}
.toc-subitem.active .toc-h3::before {
  background: #ef4235;
  width: 10px;
}
```

HTML pattern:

```html
<aside class="toc-card" :class="{ 'is-expanded': open }">
  <button class="toc-title-btn">
    <i class="icon-leading">format_list_bulleted</i>
    <span>สารบัญ</span>
    <span class="toc-count">{count}</span>
    <i class="toc-chevron">expand_more</i>
  </button>
  <div class="toc-scroll">
    <div class="toc-progress">
      <div class="toc-progress-bar" style="height: {progress}%" />
    </div>
    <ul class="toc-list">
      <li class="toc-section" :class="{ active, has-active-child }">
        <a class="toc-link toc-h2" href="#h2-id">
          <span class="toc-bullet"></span>
          <span class="toc-text">{h2 text}</span>
        </a>
        <ul class="toc-sub">
          <li class="toc-subitem" :class="{ active }">
            <a class="toc-link toc-h3" href="#h3-id">
              <span class="toc-text">{h3 text}</span>
            </a>
          </li>
        </ul>
      </li>
    </ul>
  </div>
</aside>
```

### 7.4 Related Service card

```css
.service-card {
  background: linear-gradient(135deg, #fff, #fdf6f4);
}
.mini-service {
  text-align: left;
}
.service-icon {
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(239, 66, 53, 0.08);
  border-radius: 12px;
  color: #ef4235;
  margin-bottom: 12px;
}
.service-icon svg {
  width: 24px;
  height: 24px;
}

.mini-service h4 {
  font-size: 1rem;
  font-weight: 700;
  margin: 0 0 6px;
  color: #1a1a1a;
}
.mini-service p {
  font-size: 0.85rem;
  color: #6b7280;
  line-height: 1.55;
  margin: 0 0 16px;
}

.btn-service {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 9px 16px;
  background: #ef4235;
  color: #fff;
  border-radius: 100px;
  text-decoration: none;
  font-weight: 700;
  font-size: 0.85rem;
  transition: all 0.2s;
}
.btn-service:hover {
  background: #c8361d;
  gap: 8px;
} /* gap เพิ่ม → icon shift */
.btn-service .icon {
  font-size: 16px;
}
```

### 7.5 CTA Card (fallback when no related service) — dark with animated glow

```css
.cta-card {
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #1a1a1a 0%, #2a1410 100%);
  color: #fff;
  border: none;
  padding: 26px 22px;
}

/* Animated radial glow */
.cta-glow {
  position: absolute;
  top: -50%;
  left: -20%;
  width: 240px;
  height: 240px;
  background: radial-gradient(
    circle,
    rgba(239, 66, 53, 0.55) 0%,
    transparent 70%
  );
  filter: blur(30px);
  pointer-events: none;
  animation: ctaGlow 6s ease-in-out infinite;
}
@keyframes ctaGlow {
  0%,
  100% {
    transform: translate(0, 0);
    opacity: 0.7;
  }
  50% {
    transform: translate(40px, 30px);
    opacity: 1;
  }
}

/* Decorative orbs */
.cta-orbs {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}
.orb {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
}
.orb-1 {
  width: 80px;
  height: 80px;
  top: 20%;
  right: -30px;
}
.orb-2 {
  width: 50px;
  height: 50px;
  bottom: 30%;
  left: -20px;
}
.orb-3 {
  width: 30px;
  height: 30px;
  top: 60%;
  right: 30%;
  background: rgba(239, 66, 53, 0.18);
}

/* Icon */
.cta-icon {
  position: relative;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #ef4235, #ff8c00);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
  box-shadow: 0 8px 24px rgba(239, 66, 53, 0.4);
}
.cta-icon .icon {
  font-size: 22px;
  color: #fff;
  animation: sparkle 2.5s ease-in-out infinite;
}
@keyframes sparkle {
  0%,
  100% {
    transform: rotate(0deg) scale(1);
  }
  50% {
    transform: rotate(15deg) scale(1.12);
  }
}

.cta-kicker {
  position: relative;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: #ff8c00;
  margin-bottom: 8px;
}
.cta-title {
  position: relative;
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1.4;
  margin: 0 0 10px;
  color: #fff;
  letter-spacing: -0.01em;
}
.cta-desc {
  position: relative;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.65);
  line-height: 1.55;
  margin: 0 0 18px;
}

.cta-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 11px 18px;
  background: #fff;
  color: #1a1a1a;
  border-radius: 100px;
  text-decoration: none;
  font-weight: 700;
  font-size: 0.9rem;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}
.cta-btn:hover {
  background: linear-gradient(135deg, #ef4235, #ff6b35);
  color: #fff;
  transform: translateY(-2px);
  box-shadow: 0 8px 22px rgba(239, 66, 53, 0.4);
}
.cta-btn .icon {
  font-size: 18px;
  transition: transform 0.25s;
}
.cta-btn:hover .icon {
  transform: translateX(3px);
}

/* Stats footer */
.cta-stats {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
.stat {
  text-align: center;
}
.stat strong {
  display: block;
  font-size: 1.2rem;
  font-weight: 800;
  background: linear-gradient(135deg, #ef4235, #ff8c00);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1.1;
}
.stat span {
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.55);
  letter-spacing: 0.02em;
}
.stat-divider {
  width: 1px;
  height: 24px;
  background: rgba(255, 255, 255, 0.1);
}
```

### 7.6 Recent Posts card

```css
.mini-posts {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.mini-post {
  display: flex;
  gap: 12px;
  text-decoration: none;
  color: inherit;
  padding: 8px;
  margin: -8px;
  border-radius: 12px;
  transition: background 0.18s;
}
.mini-post:hover {
  background: #fafafa;
}
.mini-post:hover h5 {
  color: #ef4235;
}

.mini-thumb {
  width: 60px;
  height: 60px;
  border-radius: 10px;
  background-size: cover;
  background-position: center;
  background-color: #f3f4f6;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.mini-thumb .icon {
  color: #d1d5db;
  font-size: 22px;
} /* fallback when no image */

.mini-info {
  min-width: 0;
}
.mini-info h5 {
  font-size: 0.88rem;
  font-weight: 600;
  margin: 0 0 4px;
  line-height: 1.4;
  color: #1a1a1a;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 0.18s;
}
.mini-info span {
  font-size: 0.75rem;
  color: #9ca3af;
}
```

---

## 8. Related Section

```css
.related-section {
  padding: 70px 0 90px;
  background: linear-gradient(180deg, #fafafa, #fdfdfc);
  border-top: 1px solid #f1f1f0;
}
.rel-head {
  text-align: center;
  margin-bottom: 40px;
}
.rel-head h2 {
  font-size: clamp(1.6rem, 3vw, 2.2rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 0 0 8px;
  color: #1a1a1a;
}
.rel-head p {
  color: #6b7280;
  font-size: 0.95rem;
  margin: 0;
}

.rel-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.rel-card {
  background: #fff;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid #f1f1f0;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
  text-decoration: none;
  color: inherit;
  display: flex;
  flex-direction: column;
  transition:
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.3s;
}
.rel-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 14px 36px rgba(0, 0, 0, 0.08);
}
.rel-card:hover h3 {
  color: #ef4235;
}

.rel-thumb {
  aspect-ratio: 16/9;
  background-size: cover;
  background-position: center;
  background-color: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
}
.rel-thumb .icon {
  color: #d1d5db;
  font-size: 40px;
} /* fallback */

.rel-body {
  padding: 18px 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}
.rel-cat {
  font-size: 0.72rem;
  font-weight: 700;
  color: #ef4235;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.rel-body h3 {
  font-size: 1.05rem;
  font-weight: 700;
  margin: 0;
  line-height: 1.4;
  color: #1a1a1a;
  transition: color 0.18s;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.rel-body p {
  font-size: 0.88rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.55;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}
.rel-date {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.78rem;
  color: #9ca3af;
  margin-top: 6px;
}
.rel-date .icon {
  font-size: 14px;
}
```

---

## 9. Back-to-top FAB

```css
.to-top {
  position: fixed;
  bottom: 28px;
  right: 28px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: #1a1a1a;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  z-index: 50;
  transition: all 0.2s;
}
.to-top:hover {
  background: #ef4235;
  transform: translateY(-3px);
  box-shadow: 0 12px 28px rgba(239, 66, 53, 0.35);
}
.to-top .icon {
  font-size: 20px;
}

@media (max-width: 768px) {
  .to-top {
    bottom: 20px;
    right: 20px;
    width: 40px;
    height: 40px;
  }
}
```

Visibility: แสดงเมื่อ scroll progress > 15%

---

## 10. State screens (loading / not found)

```css
.state-screen {
  min-height: 70vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
  font-family: "LINESeedSansTH", sans-serif;
}
.state-screen h2 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 8px;
  color: #1a1a1a;
}
.state-screen p {
  color: #6b7280;
  margin: 0 0 24px;
}

.empty-icon {
  width: 80px;
  height: 80px;
  border-radius: 24px;
  background: rgba(239, 66, 53, 0.07);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.2rem;
}
.empty-icon .icon {
  font-size: 36px;
  color: #ef4235;
}

.spinner {
  width: 44px;
  height: 44px;
  border: 3px solid rgba(239, 66, 53, 0.15);
  border-top-color: #ef4235;
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
  margin-bottom: 16px;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 22px;
  background: #ef4235;
  color: #fff;
  border-radius: 100px;
  text-decoration: none;
  font-weight: 700;
  font-size: 0.9rem;
  transition: all 0.2s;
}
.btn-back:hover {
  background: #c8361d;
  gap: 10px;
}
.btn-back .icon {
  font-size: 18px;
}
```

---

## 11. Responsive Breakpoints (สรุป)

| Breakpoint | Effect                                                                                                                                                   |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `≤1024px`  | sidebar → static (ใต้ main), TOC ไม่ collapse (max-height 60vh), grid → 1 column                                                                         |
| `≤768px`   | hero padding ลดเหลือ `100px 0 30px`, post-container `30px 0 60px`, post-content `1rem / 1.8`, share-row → column, to-top → 40px (bottom 20px right 20px) |

---

## 12. Icons

ใช้ **Material Symbols Rounded** (Google Fonts) — ต้องโหลด stylesheet:

```html
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,300..700,0..1,-50..200"
/>
```

Icon ที่ใช้:

- `label` — category badge
- `calendar_today` — date
- `schedule` — reading time
- `share` — share button
- `link` / `check` — copy state
- `arrow_back` / `arrow_forward` / `arrow_upward`
- `format_list_bulleted` — TOC title
- `expand_more` — TOC chevron
- `workspace_premium` — related service title
- `auto_awesome` — CTA icon (with sparkle animation)
- `trending_up` — recent posts title
- `article` — image fallback

Class hint: `<span class="material-symbols-rounded">icon_name</span>` — set `font-size` directly to control size

Next.js alternative: ใช้ `lucide-react` หรือ SVG component แทน (ลด external dep)

---

## 13. Next.js Migration Checklist

- [ ] `next/font/local` สำหรับ LINESeedSansTH (โหลด weights 400/600/700/800)
- [ ] Material Symbols ผ่าน Google Fonts link หรือเปลี่ยนเป็น `lucide-react`
- [ ] `next/image` สำหรับ hero cover (`priority` + `fetchPriority="high"`)
- [ ] `next/image` สำหรับ related/recent thumbs — แต่ที่นี่ใช้ `background-image` ของ div; ถ้าจะใช้ next/image ต้องเปลี่ยน structure เป็น `<Image fill className="object-cover" />` ใน wrapper
- [ ] Reading progress + scroll-spy + share + TOC active state = client components (`'use client'`)
- [ ] Prose content — server-render (`dangerouslySetInnerHTML`) + sanitize ก่อนด้วย DOMPurify หรือ rehype
- [ ] Set `scroll-margin-top` ทุก h2/h3 = `110px` (เผื่อ sticky header)
- [ ] global `:root` design tokens ใน `app/globals.css` หรือ Tailwind config theme
- [ ] กัน CLS — กำหนด width/height ของรูปทุกใบ, aspect-ratio container สำหรับ hero/thumbs
- [ ] `text-wrap: balance` บน h1 (Next.js ใหม่รองรับ native)
- [ ] Test mobile breakpoints 768 + 1024 ให้ตรง

---

## 14. Tailwind config snippet (ถ้าใช้ Tailwind)

```js
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        brand: {
          red: "#ef4235",
          "red-dark": "#c8361d",
          orange: "#ff6b35",
          "orange-soft": "#ff8c00",
        },
        ink: {
          900: "#1a1a1a",
          700: "#2a2a2a",
          500: "#4b5563",
          400: "#6b7280",
          300: "#9ca3af",
          200: "#d1d5db",
          100: "#e5e7eb",
          50: "#f1f1f0",
        },
        surface: {
          page: "#fdfdfc",
          card: "#ffffff",
          soft: "#fafafa",
          tint: "#fdf6f4",
        },
      },
      fontFamily: {
        sans: ["var(--font-line-seed)", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      backgroundImage: {
        "brand-h": "linear-gradient(90deg, #ef4235, #ff6b35)",
        "brand-v": "linear-gradient(180deg, #ef4235, #ff6b35)",
        "brand-diag": "linear-gradient(135deg, #ef4235, #ff8c00)",
        "cta-dark": "linear-gradient(135deg, #1a1a1a 0%, #2a1410 100%)",
      },
      boxShadow: {
        card: "0 4px 16px rgba(0,0,0,0.025)",
        "card-hover": "0 14px 36px rgba(0,0,0,0.08)",
        hero: "0 12px 40px rgba(0,0,0,0.08)",
      },
      borderRadius: {
        "2.5xl": "18px",
        pill: "100px",
      },
    },
  },
};
```

---

## 15. สรุป design language

PNA blog post = **editorial + warm + branded red accent** ที่ผูกกันด้วย:

1. **Red `#ef4235` เป็น signature** — bullet active, h2 red bar, link hover, badge — ทุกจุด interactive
2. **Soft cards** — radius 18, shadow ละมุน `rgba(0,0,0,0.025)`, border `#f1f1f0`
3. **Pill buttons** — `border-radius: 100px` หมด (ปุ่ม, badge, share)
4. **Hover micro-interaction** — `translateY(-2px)` + shadow ขึ้น (ไม่ใช่ scale)
5. **Geometric decoration** — blurred radial blob ใน hero + orb ใน CTA card (subtle, not distracting)
6. **Smooth easing** — `cubic-bezier(.4, 0, .2, 1)` หรือ linear sharp 0.18s
7. **Typography** — Title `clamp + text-wrap: balance + letter-spacing -0.02em`, body `line-height: 1.85`, h2 มี red bar เสมอ
8. **CTA card เป็น dark theme** ตัวเดียวในหน้า — สร้าง contrast ดึง attention

ทุกอย่างเป็น CSS ปกติ ไม่มี library พิเศษ ย้ายไป Next.js ได้ตรงๆ แค่เปลี่ยน scoped CSS เป็น CSS Module หรือ Tailwind utility
