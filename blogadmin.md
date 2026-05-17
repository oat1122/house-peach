# Blog Admin Editor — UI/Style Spec (for Next.js port)

> Source: [src/views/partner/PartnerBlogEditView.vue](src/views/partner/PartnerBlogEditView.vue)
> Scope: **UI + style เท่านั้น** — admin Post editor (create / edit) ที่ login แล้วเข้ามาใช้
> ไม่รวม: Login page, post list, navigation shell, auth/fetch logic
> Route: `/admin/blog/new`, `/admin/blog/[id]/edit`
> Stack คาดหวังของ Next.js: App Router + Tailwind CSS + lucide-react (หรือ Material Symbols) + Quill / Tiptap editor

---

## 1. Design Tokens (ต่อยอดจาก blogpostfe.md)

### Brand colors (เหมือนกับ public site)

```css
--brand-red: #ef4235;
--brand-red-hover: #c8361d;
--brand-orange: #ff6b35;
--brand-orange-soft: #ff8c00;
```

### Admin-specific surface tokens (warm cream theme)

| Token | Value | Usage |
|---|---|---|
| `--surface-card` | `#ffffff` | Panel/card background |
| `--surface-input` | `#fffdfc` | Input background (warm white, off-white) |
| `--surface-soft` | `#fffbf9` | Editor wrapper, sticky toolbar |
| `--surface-tint` | `#fff7f4` | Hover bg, AI banner |
| `--surface-tint-2` | `#fdf2f0` | AI button hover, close hover |
| `--surface-tint-3` | `#fff4f0` | Banner gradient end |
| `--surface-warm-bg` | `#faf6f4` | Image placeholder bg |
| `--border-warm` | `#ead9d5` | Default input border |
| `--border-warm-light` | `#f1e4de` | Card/panel divider |
| `--border-warm-soft` | `#f1dfda` | Soft border |
| `--border-warm-pink` | `#f3dfdb` | Tab divider |
| `--skeleton-bg` | `#f5e8e2` | AI skeleton bar |
| `--skeleton-fill` | `#f0c9c2` | AI fillable border |

### Ink (text) palette (admin variants)

Already in blogpostfe.md tokens. Add:
```css
--ink:   #1a1a1a;          /* main text — Tailwind: text-ink */
--ink-2: #4b5563;          /* sub text — Tailwind: text-ink2 */
--ink-3: #6b7280;          /* muted — Tailwind: text-ink3 */
--ink-4: #9ca3af;          /* hint, placeholder — Tailwind: text-ink4 */
```

### Status colors

```css
--success: #06c755;        /* publish published */
--warn:    #ff8c00;
--danger:  #dc2626;        /* JSON validation error */
--danger-soft: #ffe4e4;    /* error bg */
--info:    #1877f2;
```

### Gradients (admin-specific)

```css
--gradient-ai-banner: linear-gradient(135deg, #fffbf9 0%, #fff4f0 100%);
--gradient-skeleton: linear-gradient(110deg, #fff4f1 8%, #ffe6df 18%, #fff7f4 33%);
--gradient-shimmer: linear-gradient(90deg, transparent, rgba(255,255,255,0.76), transparent);
```

### Radius scale (admin uses bigger radii than public)

```
8  → small chip
12 → icon container, modal close
16 → form input, code box
18 → card (consistent)
20 → input (when bigger)
24 → featured-image-box, modal
28 → AI dialog modal (28px = unique)
999/100px → pill, badge
```

### Shadow

```css
--shadow-card:      0 4px 16px rgba(0,0,0,0.025);
--shadow-modal:     0 14px 34px rgba(31,41,55,0.14);
--shadow-toolbar:   0 14px 34px rgba(31,41,55,0.14), 0 0 0 1px rgba(239,66,53,0.08);
--shadow-modal-2:   0 25px 50px -12px rgba(0,0,0,0.25);     /* shadow-2xl */
--shadow-brand-btn: 0 10px 15px -3px rgba(239,66,53,0.2);   /* shadow-lg shadow-brand/20 */
--shadow-brand-cta: 0 20px 25px -5px rgba(239,66,53,0.25);  /* shadow-xl */
```

---

## 2. Page Layout (Bird's eye)

```
┌──────────────────────────────────────────────────────────────────────┐
│ <PartnerPageHeader>                                                  │
│ ┌──────────────────────────────────┬─────────────────────────────┐   │
│ │ Title: เขียนบทความใหม่           │ [AI เขียนบทความ] [AI สร้างรูป]│   │
│ │ Subtitle: เริ่มสร้างเนื้อหาฯ      │ [บันทึกแบบร่าง] [เผยแพร่]   │   │
│ └──────────────────────────────────┴─────────────────────────────┘   │
├──────────────────────────────────────────────────────────────────────┤
│ Tab Bar (sticky red underline)                                       │
│ [📝 เนื้อหา] [🔍 SEO] [⚙️ ตั้งค่า]                                   │
├──────────────────────────────────────────────────────────────────────┤
│ Grid: lg:grid-cols-12, gap-8                                         │
│  ┌─ Main (col-span-8) ────────────┐  ┌─ Sidebar (col-span-4) ────┐  │
│  │                                  │  │                            │  │
│  │ Content Tab:                     │  │ ┌─ Panel: การจัดกลุ่ม ───┐ │  │
│  │  ┌─ Panel: เนื้อหาหลัก ──────┐ │  │ │  - หมวดหมู่              │ │  │
│  │  │  Title input (big bold)    │ │  │ │  - บริการที่เกี่ยวข้อง   │ │  │
│  │  │  Quill editor              │ │  │ └────────────────────────┘ │  │
│  │  │   (sticky toolbar top)     │ │  │                            │  │
│  │  │   (markdown mode toggle)   │ │  │ ┌─ Panel: รูปหน้าปก ────┐ │  │
│  │  │  Short description ta      │ │  │ │  [Featured image box   │ │  │
│  │  └──────────────────────────┘ │  │ │   24px dashed border,   │ │  │
│  │                                  │  │ │   aspect-video,         │ │  │
│  │ SEO Tab:                         │  │ │   AI button overlay]    │ │  │
│  │  ┌─ Panel: SEO & Marketing ──┐ │  │ │  [Gen w/AI] [Upload]   │ │  │
│  │  │  [AI auto-fill banner]    │ │  │ └────────────────────────┘ │  │
│  │  │  Sub-tabs:                 │ │  │                            │  │
│  │  │   [Meta][Indexing]         │ │  │ ┌─ Card: ไฟล์แนบ ────────┐ │  │
│  │  │   [Social][Schema]         │ │  │ │  Gradient + icon       │ │  │
│  │  │  Per-field with AI button  │ │  │ │  [Upload button]       │ │  │
│  │  │  Char counters             │ │  │ └────────────────────────┘ │  │
│  │  └──────────────────────────┘ │  │                            │  │
│  │                                  │  │                            │  │
│  │ Settings Tab:                    │  │                            │  │
│  │  Slug, Status, Date, Featured    │  │                            │  │
│  └──────────────────────────────────┘  └────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘

Modals (z-1000, backdrop blur):
  - AI generate blog dialog (max-w-760px)
  - AI cover image dialog
  - Image insert dialog
  - Video insert dialog
  - Category manage dialog
```

Responsive: `≤lg` (1024px) → grid → 1 column, sidebar drops below main

---

## 3. Component Tree (Next.js)

```
app/admin/blog/[id]/edit/page.tsx          (server: fetch post + categories)
└─ <BlogEditClient post={...} />            (client wrapper)
    ├─ <PageHeader title, subtitle>
    │   └─ <ActionBar>                      (AI/save/publish buttons)
    ├─ <TabNav tabs activeTab onChange />   (sticky underline)
    └─ <div className="grid lg:grid-cols-12 gap-8">
        ├─ <MainArea className="col-span-8">
        │   ├─ <ContentTab v-if="...">
        │   │   ├─ <Panel title subtitle>
        │   │   │   ├─ <TitleInput />          (big bold)
        │   │   │   ├─ <EditorWrapper>
        │   │   │   │   ├─ <QuillEditor />     (sticky toolbar)
        │   │   │   │   ├─ <MarkdownMode />    (toggle textarea)
        │   │   │   │   ├─ <AiSkeleton />      (overlay during gen)
        │   │   │   │   └─ <ImageResizer />    (absolute overlay)
        │   │   │   └─ <ShortDescription />
        │   ├─ <SeoTab v-if="...">
        │   │   ├─ <AiAutoFillBanner />
        │   │   ├─ <SubTabs items=[Meta,Indexing,Social,Schema] />
        │   │   ├─ <SeoMetaPanel />            (title/desc/keywords + AI per field)
        │   │   ├─ <SeoIndexingPanel />        (canonical/robots/noindex)
        │   │   ├─ <SeoSocialPanel />          (OG + Twitter)
        │   │   └─ <SeoSchemaPanel />          (JSON-LD textareas)
        │   └─ <SettingsTab v-if="...">
        │       ├─ <SlugInput prefix />
        │       ├─ <StatusSelect /> + <DateTimePicker />
        │       └─ <FeaturedToggle />
        └─ <Sidebar className="col-span-4">
            ├─ <CategoryServicePanel />
            ├─ <FeaturedImagePanel />
            └─ <AttachmentCard />
    
    Modals (mounted at body):
      <AiBlogDialog open />
      <AiCoverImageDialog open />
      <ImageInsertDialog open />
      <VideoInsertDialog open />
      <CategoryManageDialog open />
```

---

## 4. Page Header + Action Bar

### Layout

```html
<header class="partner-blog-edit px-6 lg:px-10 pb-20">
  <PartnerPageHeader title subtitle>
    <ActionBar class="flex gap-3">
      <button class="btn-primary">AI เขียนบทความ</button>
      <button class="btn-secondary">AI สร้างรูปปก</button>
      <button class="btn-secondary">บันทึกแบบร่าง</button>
      <button class="btn-primary">เผยแพร่บทความ</button>
    </ActionBar>
  </PartnerPageHeader>
```

### Button system (CSS using @apply or pure Tailwind)

```css
.btn-primary {
  display: flex; align-items: center; gap: 8px;
  border-radius: 16px;
  background: #EF4235;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  color: white;
  box-shadow: 0 10px 15px -3px rgba(239,66,53,0.2);
  transition: all 0.18s;
}
.btn-primary:hover { transform: scale(1.05); }
.btn-primary:active { transform: scale(0.95); }
.btn-primary:disabled {
  cursor: not-allowed;
  background: #d1d5db;
  color: #6b7280;
  box-shadow: none;
  transform: none;
}

.btn-secondary {
  display: flex; align-items: center; gap: 8px;
  border-radius: 16px;
  background: white;
  border: 1px solid #ead9d5;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  transition: all 0.18s;
}
.btn-secondary:hover { border-color: #EF4235; color: #EF4235; }
.btn-secondary:disabled {
  cursor: not-allowed;
  border-color: #e5e7eb;
  background: #f3f4f6;
  color: #9ca3af;
}

.btn-danger {                                  /* cancel during AI gen */
  display: flex; align-items: center; gap: 8px;
  border-radius: 16px;
  background: #EF4235;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  color: white;
  box-shadow: 0 10px 15px -3px rgba(239,66,53,0.2);
}

.btn-outline-white {
  display: flex; align-items: center; justify-content: center;
  border-radius: 16px;
  background: rgba(255,255,255,0.8);
  border: 1px solid #f1e4de;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  transition: all 0.18s;
}
.btn-outline-white:hover {
  background: white;
  border-color: #EF4235;
  color: #EF4235;
}

.btn-primary-sm {
  display: flex; align-items: center; gap: 4px;
  border-radius: 12px;
  background: #EF4235;
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 600;
  color: white;
  transition: all 0.18s;
}
.btn-primary-sm:hover { transform: scale(1.05); }

.btn-icon {
  display: flex;
  align-items: center; justify-content: center;
  width: 32px; height: 32px;
  border-radius: 8px;
  border: 1px solid #ead9d5;
  background: white;
  color: #9ca3af;
  transition: all 0.18s;
}
.btn-icon:hover { border-color: #EF4235; color: #EF4235; }

.ai-btn {                                       /* per-field AI button (text only) */
  display: inline-flex; align-items: center; gap: 3px;
  font-size: 11px;
  font-weight: 700;
  color: #ef4235;
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  transition: transform 0.15s;
}
.ai-btn:hover:not(:disabled) { transform: scale(1.06); }
.ai-btn:disabled { opacity: 0.4; cursor: not-allowed; }
```

> 💡 Default button behavior: **scale on hover/active** (not translate). Brand red shadow that matches button color.

---

## 5. Tab Navigation (3 main tabs)

```html
<div class="mt-8 flex gap-2 border-b border-[#f1e4de] pb-px">
  <button v-for="tab" class="group relative flex items-center gap-2 px-6 py-4 text-sm font-semibold"
          :class="active ? 'text-[#EF4235]' : 'text-ink4 hover:text-ink'">
    <span class="material-symbols-rounded text-[20px]">{{ tab.icon }}</span>
    {{ tab.name }}
    <div v-if="active" class="absolute bottom-0 left-0 h-1 w-full rounded-t-full bg-[#EF4235]"></div>
  </button>
</div>
```

Tab items (3):
- `content` — icon `edit_note` — "เนื้อหา"
- `seo` — icon `search` — "SEO"
- `settings` — icon `settings` — "ตั้งค่า"

Active state: 1px-tall full-width red underline + red text. Inactive: ink4 muted → hover ink

---

## 6. Panel (PartnerPanel — base card)

ทุก section ใหญ่ wrap ด้วย Panel component:

```html
<section class="panel">
  <header class="panel__header">
    <h3 class="panel__title">เนื้อหาหลัก</h3>
    <p class="panel__subtitle">จัดการหัวข้อและเนื้อหาของบทความ</p>
  </header>
  <div class="panel__body space-y-6">
    <!-- children -->
  </div>
</section>
```

```css
.panel {
  border-radius: 24px;
  background: white;
  border: 1px solid #f1e4de;
  box-shadow: 0 4px 16px rgba(0,0,0,0.025);
  overflow: hidden;
}
.panel__header {
  padding: 20px 24px;
  border-bottom: 1px solid #f1e4de;
}
.panel__title {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a1a;
}
.panel__subtitle {
  margin-top: 4px;
  font-size: 12px;
  color: #6b7280;
}
.panel__body {
  padding: 24px;
}
```

> ⚠️ Exception: `blog-editor-panel` ต้อง `overflow: visible !important` (เพื่อ Quill sticky toolbar ยื่นออกนอก panel ได้)

---

## 7. Content Tab

### 7.1 Title Input (big & bold)

```css
.title-input {
  width: 100%;
  border-radius: 16px;
  border: 1px solid #ead9d5;
  background: #fffdfc;
  padding: 16px 20px;
  font-size: 20px;          /* text-xl */
  font-weight: 700;
  color: #1a1a1a;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.title-input:focus {
  border-color: #EF4235;
  box-shadow: 0 0 0 4px rgba(239,66,53,0.1);
}
.title-input::placeholder { color: #9ca3af; }
```

Label pattern (sit above input):
```html
<label class="mb-2 block text-sm font-semibold text-ink">หัวข้อบทความ (Title)</label>
```

### 7.2 Quill / Rich text editor wrapper

```css
.quill-wrapper {
  position: relative;
  border-radius: 16px;
  border: 1px solid #ead9d5;
  background: white;
  overflow: visible !important;          /* sticky toolbar ต้องยื่นได้ */
}

/* Quill toolbar — sticky + glassmorphism */
.ql-toolbar {
  position: sticky;
  top: 0;
  z-index: 120;
  border: none;
  border-bottom: 1px solid #f1e4de;
  background: rgba(255,253,252,0.96);
  padding: 12px 20px;
  border-radius: 16px 16px 0 0;
  box-shadow: 0 14px 34px rgba(31,41,55,0.14), 0 0 0 1px rgba(239,66,53,0.08);
  backdrop-filter: blur(12px);
}

/* Quill content area */
.ql-container {
  font-size: 17.6px;        /* 1.1rem */
  min-height: 500px;
  font-family: 'Noto Sans Thai', sans-serif;
  border: none;
  overflow: hidden;
  border-radius: 0 0 16px 16px;
}
.ql-editor { padding: 30px; }
```

### 7.3 Markdown mode bar (toggle to view markdown source)

```css
.markdown-mode-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid #f1e4de;
  background: #fffdfc;
  padding: 12px 20px;
}
.markdown-mode-bar__label {
  display: inline-flex; align-items: center; gap: 8px;
  font-size: 12px;
  font-weight: 800;
  color: #5b6472;
}
.markdown-mode-bar__button {
  display: inline-flex; align-items: center; gap: 8px;
  font-size: 12px;
  font-weight: 800;
  border: 1px solid #ead9d5;
  border-radius: 12px;
  background: white;
  color: #ef4235;
  padding: 8px 12px;
  transition: all 0.15s;
}
.markdown-mode-bar__button:hover {
  border-color: #ef4235;
  background: #fff4ee;
  transform: translateY(-1px);
}

/* Markdown textarea (when in MD mode) */
.markdown-textarea {
  width: 100%;
  min-height: 400px;
  padding: 32px;
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 14px;
  border: 0;
  outline: none;
  background: #fffbf9;
  color: #475569;
}
```

### 7.4 Custom Quill button (`code` for markdown toggle)

```css
.ql-markdown {
  width: 40px;
  display: flex; align-items: center; justify-content: center;
  position: relative;
}
.ql-markdown::before {
  content: 'code';
  font-family: 'Material Symbols Rounded';
  font-size: 20px;
  color: #444;
}
.ql-markdown.ql-active {
  background: #EF4235;
  border-radius: 4px;
}
.ql-markdown.ql-active::before { color: #fff; }
```

### 7.5 Image resizer overlay (custom drag/align)

```html
<div class="absolute pointer-events-none z-50 border border-dashed border-[#EF4235]"
     :style="resizerStyle">
  <!-- Resize handle (bottom-right corner) -->
  <div class="absolute -bottom-2 -right-2 h-4 w-4 cursor-nwse-resize bg-white
              border-2 border-[#EF4235] pointer-events-auto rounded-full shadow-md"
       @mousedown="startResize" />

  <!-- Floating alignment toolbar (above image) -->
  <div class="absolute -top-14 left-1/2 -translate-x-1/2 flex items-center gap-1
              rounded-full bg-white/90 backdrop-blur-md p-1.5 shadow-2xl
              border border-[#EF4235]/20 pointer-events-auto">
    <!-- align left / center / right + regenerate buttons (h-8 w-8 rounded-full) -->
  </div>
</div>
```

Floating toolbar buttons:
```css
.float-tool-btn {
  display: flex; align-items: center; justify-content: center;
  width: 32px; height: 32px;
  border-radius: 9999px;
  color: #475569;
  transition: all 0.18s;
}
.float-tool-btn:hover {
  background: rgba(239,66,53,0.1);
  color: #EF4235;
}
.float-tool-btn:disabled { opacity: 0.5; cursor: not-allowed; }
```

### 7.6 AI editor skeleton (overlay during article gen)

```css
.ai-editor-skeleton {
  position: absolute; inset: 0;
  z-index: 70;
  overflow: auto;
  background: white;
  padding: 28px 32px;
}

/* Status pill at top */
.ai-skel-status {
  display: inline-flex; align-items: center; gap: 8px;
  margin-bottom: 24px;
  border-radius: 9999px;
  background: #fff7f4;
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 800;
  color: #8a6d66;
}

/* Skeleton bars */
.ai-editor-skeleton__line {
  position: relative;
  overflow: hidden;
  height: 16px;
  max-width: 780px;
  margin: 12px 0;
  border-radius: 999px;
  background: #f5e8e2;
}
.ai-editor-skeleton__line::after {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.76), transparent);
  animation: pna-ai-shimmer 1.3s infinite;
  transform: translateX(-100%);
}

.ai-editor-skeleton__title       { width: 82%; height: 34px; border-radius: 16px; }
.ai-editor-skeleton__title-short { width: 52%; height: 34px; border-radius: 16px; }
.ai-editor-skeleton__medium      { width: 72%; }
.ai-editor-skeleton__short       { width: 46%; }

@keyframes pna-ai-shimmer {
  to { transform: translateX(100%); }
}
```

### 7.7 Short description textarea

```html
<div class="ai-fillable" :data-skel-h="92">
  <textarea v-model="shortDescription" rows="3"
            placeholder="สรุปเนื้อหาบทความสั้นๆ เพื่อแสดงในหน้ารวม..."
            class="w-full rounded-2xl border border-[#ead9d5] bg-[#fffdfc] px-4 py-3
                   text-sm text-ink outline-none focus:border-[#EF4235]
                   focus:ring-4 focus:ring-[#EF4235]/10" />
</div>
```

---

## 8. SEO Tab

### 8.1 AI auto-fill banner (top of SEO panel)

```html
<div class="flex flex-col gap-3 rounded-2xl border border-[#f1dfda]
            bg-[linear-gradient(135deg,#fffbf9_0%,#fff4f0_100%)] p-4
            sm:flex-row sm:items-center sm:justify-between">
  <div class="flex items-start gap-3">
    <span class="material-symbols-rounded mt-0.5 text-[#EF4235]">auto_awesome</span>
    <div>
      <p class="text-sm font-bold text-ink">AI สร้าง SEO ใหม่ทั้งชุด</p>
      <p class="text-[11px] text-ink3">วิเคราะห์เนื้อหาจริง...</p>
    </div>
  </div>
  <button class="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-[#ef4235]
                 px-4 py-2.5 text-sm font-bold text-white shadow disabled:opacity-50">
    <span class="material-symbols-rounded text-[18px]">auto_fix</span>
    รีเจน SEO ใหม่ทั้งชุด
  </button>
</div>
```

### 8.2 Sub-tabs (Meta / Indexing / Social / Schema)

```html
<div class="flex flex-wrap gap-1 border-b border-[#f3dfdb]">
  <button v-for="tab" class="-mb-px border-b-2 px-3 py-2 text-[12px] font-bold"
          :class="active ? 'border-[#ef4235] text-[#ef4235]'
                          : 'border-transparent text-ink3 hover:text-ink2'">
    {{ tab.label }}
  </button>
</div>
```

Same red-underline pattern as main tabs but smaller font (12px) and thinner padding (px-3 py-2)

### 8.3 Field row pattern (label + AI button + input + counter)

This is the **signature** SEO field pattern — repeats for every field:

```html
<div class="space-y-2">
  <div class="flex items-center justify-between">
    <label class="block text-[12px] font-bold text-ink">
      SEO Title
      <span class="font-normal text-ink4">(แท็ก &lt;title&gt;)</span>
    </label>
    <button class="ai-btn">
      <span class="material-symbols-rounded text-[14px]">auto_fix</span>
      AI
    </button>
  </div>
  <div class="ai-fillable">
    <input class="form-input" maxlength="70" />
  </div>
  <p class="text-[10px] text-ink4">{{ length }}/70 — แนะนำ 50–60</p>
</div>
```

### 8.4 form-input (shared across SEO + Settings)

```css
.form-input {
  width: 100%;
  border-radius: 16px;
  border: 1px solid #ead9d5;
  background: #fffdfc;
  padding: 10px 14px;
  font-size: 13px;
  color: #1f2937;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
}
.form-input:focus {
  outline: none;
  border-color: #ef4235;
  box-shadow: 0 0 0 4px rgba(239,66,53,0.08);
  background: white;
}
.form-input::placeholder { color: #9ca3af; }

/* JSON editor variant */
.form-input.json-textarea {
  resize: vertical;
  font-family: 'SF Mono', monospace;
  font-size: 11px;
  line-height: 1.65;
}
.form-input.json-textarea.has-error {
  border-color: #dc2626;
}
```

### 8.5 ai-fillable wrapper (shimmer skeleton during AI gen)

This is the **most distinctive admin pattern** — wrap any input that AI can fill, and shows shimmer when loading:

```css
.ai-fillable { position: relative; }

/* Hide actual input, show skeleton bg */
.ai-fillable.is-loading > * {
  visibility: hidden !important;
}
.ai-fillable.is-loading {
  min-height: 44px;
  border-radius: 16px;
  background: linear-gradient(110deg, #fff4f1 8%, #ffe6df 18%, #fff7f4 33%);
  background-size: 200% 100%;
  animation: pna-ai-shimmer 1.4s linear infinite;
  border: 1px solid #f0c9c2;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.6);
  pointer-events: none;
}

/* Height presets via data attribute */
.ai-fillable.is-loading[data-skel-h="40"]  { min-height: 40px; border-radius: 12px; }
.ai-fillable.is-loading[data-skel-h="56"]  { min-height: 56px; }
.ai-fillable.is-loading[data-skel-h="64"]  { min-height: 64px; border-radius: 18px; }
.ai-fillable.is-loading[data-skel-h="76"]  { min-height: 76px; }
.ai-fillable.is-loading[data-skel-h="92"]  { min-height: 92px; }
.ai-fillable.is-loading[data-skel-h="130"] { min-height: 130px; }
.ai-fillable.is-loading[data-skel-h="200"] { min-height: 200px; }

@keyframes pna-ai-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### 8.6 Section divider (between OG and Twitter inside Social tab)

```html
<div class="h-px bg-[#f1e4de]"></div>
```

### 8.7 Section sub-heading (small caps)

```html
<h4 class="mb-4 text-[11px] font-bold uppercase tracking-widest text-ink3">
  Facebook / Line — Open Graph
</h4>
```

### 8.8 OG/Twitter image preview row

```html
<div class="flex items-center gap-3 rounded-2xl border border-[#ead9d5] bg-[#fffdfc] p-3">
  <div class="h-14 w-24 flex-shrink-0 overflow-hidden rounded-lg
              border border-[#f1e4de] bg-[#faf6f4]">
    <img v-if="img" :src="img" class="h-full w-full object-cover" />
    <div v-else class="flex h-full w-full items-center justify-center text-ink4">
      <span class="material-symbols-rounded text-[20px]">image</span>
    </div>
  </div>
  <div class="min-w-0 flex-1">
    <p class="text-[12px] font-semibold text-ink">ใช้รูปหน้าปกอัตโนมัติ</p>
    <p class="text-[10px] text-ink4">sync ตามรูปปกบทความ</p>
  </div>
</div>
```

### 8.9 Checkbox card (Indexing / Featured / etc.)

```html
<label class="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#f1dfda]
              bg-[#fffdfc] p-4">
  <input type="checkbox" class="mt-1 accent-[#ef4235]" />
  <div>
    <span class="block text-sm font-bold text-ink">No-Index</span>
    <span class="text-[11px] text-ink4">เปิดใช้เพื่อบล็อก search engines...</span>
  </div>
</label>
```

`accent-[#ef4235]` ทำให้ checkbox เป็นสีแบรนด์โดยไม่ต้อง custom

---

## 9. Settings Tab

### 9.1 Slug input (with prefix host)

```html
<div class="form-group">
  <label class="mb-2 block text-sm font-semibold text-ink">Slug (URL Path)</label>
  <div class="flex items-center gap-2">
    <span class="text-sm text-ink4">new.pnadigital.dev/blog/</span>
    <div class="ai-fillable flex-1" data-skel-h="40">
      <input class="w-full rounded-xl border border-[#ead9d5] bg-[#fffdfc]
                    px-4 py-2 text-sm text-ink outline-none focus:border-[#EF4235]" />
    </div>
  </div>
  <p class="mt-1 text-[11px] text-ink3 italic">เว้นว่างไว้เพื่อสร้างอัตโนมัติ...</p>
</div>
```

### 9.2 Status + Date row (grid 2 col)

```html
<div class="grid grid-cols-2 gap-6">
  <div>
    <label class="mb-2 block text-sm font-semibold text-ink">สถานะบทความ</label>
    <PartnerSelect v-model="status" :options="statusOptions" icon="auto_awesome" />
  </div>
  <div>
    <label class="mb-2 block text-sm font-semibold text-ink">วันที่เผยแพร่</label>
    <input type="datetime-local"
           class="w-full rounded-2xl border border-[#ead9d5] bg-[#fffdfc]
                  px-4 py-3 text-sm text-ink outline-none focus:border-[#EF4235]" />
  </div>
</div>
```

---

## 10. Sidebar (right column)

### 10.1 Category + Service panel

Just two `<PartnerSelect>` stacked with section header "จัดการหมวดหมู่" link (text-only red)

### 10.2 Featured image box (signature component)

```html
<div class="featured-image-box group relative aspect-video cursor-pointer
            overflow-hidden rounded-[24px] border-2 border-dashed border-[#ead9d5]
            bg-[#fffdfc] transition-all
            hover:border-[#EF4235] hover:bg-[#fdf2f0]"
     @click="upload">
  <!-- When image set -->
  <img v-if="img" :src="img"
       class="h-full w-full object-cover transition-transform duration-500
              group-hover:scale-110" />

  <!-- Empty state -->
  <div v-else class="flex h-full flex-col items-center justify-center text-ink4
                     transition-colors group-hover:text-[#EF4235]">
    <span class="material-symbols-rounded text-4xl">add_a_photo</span>
    <p class="mt-2 text-xs font-semibold">คลิกเพื่ออัปโหลดรูปหน้าปก</p>
  </div>

  <!-- Hover overlay (edit pencil) -->
  <div v-if="img" class="absolute inset-0 flex items-center justify-center
                          bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
    <span class="material-symbols-rounded text-white">edit</span>
  </div>

  <!-- Floating AI button (always visible, bottom) -->
  <button class="absolute bottom-3 left-3 right-3 z-10 inline-flex items-center
                  justify-center gap-2 rounded-2xl bg-[#EF4235] px-4 py-2.5
                  text-xs font-bold text-white shadow-xl shadow-[#EF4235]/25
                  transition-all hover:scale-[1.02] disabled:opacity-60">
    <span class="material-symbols-rounded text-[16px]">auto_awesome</span>
    AI สร้างรูปหน้าปก
  </button>
</div>

<!-- Action buttons below -->
<div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
  <button class="btn-primary justify-center">
    <span class="material-symbols-rounded text-sm">auto_awesome</span>
    สร้างด้วย AI
  </button>
  <button class="btn-outline-white justify-center">
    <span class="material-symbols-rounded text-sm">upload_file</span>
    อัปโหลดรูปเอง
  </button>
</div>
```

AI loading state on featured image:
```css
.featured-image-box.is-ai-loading {
  cursor: wait !important;
  border-style: solid !important;
  border-color: #f0c9c2 !important;
  background: linear-gradient(110deg, #fff4f1 8%, #ffe6df 18%, #fff7f4 33%) !important;
  background-size: 200% 100% !important;
  animation: pna-ai-shimmer 1.4s linear infinite !important;
}
.ai-cover-skeleton {
  background: rgba(255,255,255,0.55);
  backdrop-filter: blur(2px);
}
```

### 10.3 Attachment card (gradient + icon CTA)

```html
<div class="rounded-[24px] border border-[#f1e4de]
            bg-[linear-gradient(135deg,#fffbf9_0%,#fff4f0_100%)] p-6">
  <div class="mb-4 flex items-center gap-3">
    <div class="flex h-10 w-10 items-center justify-center rounded-xl
                bg-white shadow-sm">
      <span class="material-symbols-rounded text-[#EF4235]">attach_file</span>
    </div>
    <div>
      <h4 class="text-sm font-semibold text-ink">ไฟล์แนบเสริม</h4>
      <p class="text-[10px] text-ink3">อัปโหลด PDF, Docs ให้ลูกค้า</p>
    </div>
  </div>
  <button class="btn-outline-white w-full">อัปโหลดไฟล์ใหม่</button>
</div>
```

---

## 11. Modal (AI dialog, image dialog, etc.)

### 11.1 Modal shell pattern

```html
<div v-if="open"
     class="fixed inset-0 z-[1000] flex items-center justify-center
            bg-black/45 px-4 backdrop-blur-sm"
     @click.self="close">
  <div class="w-full max-w-[760px] overflow-hidden rounded-[28px]
              border border-white/70 bg-white shadow-2xl">

    <!-- Header -->
    <div class="flex items-start justify-between border-b border-[#f1e4de]
                bg-[#fffdfc] px-6 py-5">
      <div>
        <div class="flex items-center gap-2">
          <span class="material-symbols-rounded text-[#EF4235]">auto_awesome</span>
          <h3 class="text-lg font-bold text-ink">AI เขียนบทความ</h3>
        </div>
        <p class="mt-1 text-xs text-ink3">เลือกหมวดหมู่/บริการ...</p>
      </div>
      <button class="flex h-9 w-9 items-center justify-center rounded-full
                     text-ink4 transition-all
                     hover:bg-[#fdf2f0] hover:text-[#EF4235]"
              @click="close">
        <span class="material-symbols-rounded text-[20px]">close</span>
      </button>
    </div>

    <!-- Body -->
    <div class="space-y-5 p-6">
      <!-- form fields -->
    </div>

    <!-- Footer actions -->
    <div class="flex items-center justify-end gap-3 px-6 py-5 border-t border-[#f1e4de]">
      <button class="btn-secondary">ยกเลิก</button>
      <button class="btn-primary">สร้างบทความ</button>
    </div>
  </div>
</div>
```

**Modal token values:**
- Backdrop: `bg-black/45` + `backdrop-blur-sm`
- Z-index: `1000` (above sticky toolbar at 120)
- Max width: `760px` (AI dialog) / `560px` (video dialog)
- Border radius: `28px` (modal) / `9999px` (close button)
- Header bg: `#fffdfc` (warm) + border-bottom `#f1e4de`

### 11.2 Field label (uppercase tracking-wide style)

```html
<label class="mb-2 block text-xs font-bold uppercase tracking-wide text-ink3">
  Brief / Keyword / สิ่งที่อยากเล่า
</label>
```

### 11.3 AI topic suggestion card

```html
<div class="rounded-2xl border border-[#f1dfda] bg-[#fffdfc] p-4">
  <div class="mb-3 flex items-center justify-between gap-3">
    <div>
      <p class="text-sm font-bold text-ink">หัวข้อที่ AI คิดให้</p>
      <p class="text-[11px] text-ink3">เลือกหัวข้อที่ชอบ...</p>
    </div>
    <button class="text-[11px] font-bold text-[#EF4235]">ล้าง</button>
  </div>

  <!-- Custom select dropdown -->
  <div class="relative">
    <button class="flex w-full items-center gap-3 rounded-2xl border border-[#ead9d5]
                    bg-white px-4 py-3 text-left transition-all hover:border-[#EF4235]">
      <span class="material-symbols-rounded text-[#EF4235]">tips_and_updates</span>
      <span class="min-w-0 flex-1">
        <span class="block truncate text-sm font-bold text-ink">{{ title }}</span>
        <span class="block truncate text-[11px] text-ink4">{{ brief }}</span>
      </span>
      <span class="material-symbols-rounded text-ink4">expand_more</span>
    </button>

    <!-- Dropdown menu -->
    <div class="absolute left-0 right-0 top-[calc(100%+8px)] z-[1002]
                max-h-[320px] overflow-y-auto rounded-2xl border border-[#ead9d5]
                bg-white p-2 shadow-[0_22px_70px_rgba(30,15,5,0.16)]">
      <button v-for="idea" class="flex w-full items-start gap-3 rounded-xl
                                   px-3 py-3 text-left transition-colors
                                   hover:bg-[#fff7f4]"
              :class="selected ? 'bg-[#fff7f4]' : ''">
        <span class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center
                     rounded-lg bg-[#fdf2f0] text-[11px] font-bold text-[#EF4235]">
          {{ index + 1 }}
        </span>
        <span class="min-w-0 flex-1">
          <span class="block text-sm font-bold leading-snug text-ink">{{ title }}</span>
          <span class="mt-1 block text-[11px] leading-relaxed text-ink3">{{ brief }}</span>
        </span>
      </button>
    </div>
  </div>
</div>
```

### 11.4 Status / error pill inside modal

```html
<div class="rounded-2xl border border-[#f1e4de] bg-[#fffdfc] px-4 py-3">
  <p class="text-xs font-semibold text-ink3">{{ status }}</p>
  <p v-if="error" class="mt-1 text-xs font-semibold text-red-600">{{ error }}</p>
</div>
```

### 11.5 Video upload dropzone (max-w-560px modal)

```html
<div class="rounded-[24px] border-2 border-dashed bg-[#fffdfc] p-6 text-center
            transition-all"
     :class="dragActive ? 'border-[#EF4235] bg-[#fdf2f0]'
                         : 'border-[#ead9d5] hover:border-[#EF4235]'"
     @drop.prevent="handleDrop">
  <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl
              bg-white shadow-sm">
    <span class="material-symbols-rounded text-3xl text-[#EF4235]">cloud_upload</span>
  </div>
  <p class="mt-3 text-sm font-bold text-ink">ลากไฟล์มาวาง หรือคลิกเพื่อเลือก</p>
  <p class="mt-1 text-xs text-ink3">รองรับการ paste/copy ด้วย</p>
  <button class="btn-outline-white mx-auto mt-4 w-auto px-5">
    เลือกไฟล์
  </button>

  <!-- Upload progress bar -->
  <div v-if="uploading" class="mt-5 overflow-hidden rounded-full bg-[#f1e4de]">
    <div class="h-2 rounded-full bg-[#EF4235] transition-all"
         :style="{ width: `${progress}%` }"></div>
  </div>
</div>
```

---

## 12. Editor Prose Style (Quill content rendering)

Inside `.ql-editor` (admin preview matches public site):

```css
.ql-editor h1 { font-size: 2rem;    font-weight: 800; line-height: 1.25; margin: 1.4em 0 0.6em; color: #18181b; }
.ql-editor h2 { font-size: 1.55rem; font-weight: 800; line-height: 1.3;  margin: 1.3em 0 0.55em; color: #18181b; }
.ql-editor h3 { font-size: 1.25rem; font-weight: 700; line-height: 1.35; margin: 1.2em 0 0.5em; color: #1f1f23; }
.ql-editor h4 { font-size: 1.1rem;  font-weight: 700; line-height: 1.4;  margin: 1.1em 0 0.4em; color: #1f1f23; }
.ql-editor h5 { font-size: 1rem;    font-weight: 700; line-height: 1.4;  margin: 1em 0 0.4em;   color: #1f1f23; }
.ql-editor h6 {
  font-size: 0.92rem; font-weight: 700; line-height: 1.4;
  margin: 1em 0 0.4em; color: #4b4b52;
  text-transform: uppercase; letter-spacing: 0.04em;
}

.ql-editor p { margin: 0.55em 0; line-height: 1.75; color: #2a2a30; }
.ql-editor ul, .ql-editor ol { padding-left: 1.4em; margin: 0.55em 0; }
.ql-editor li { margin: 0.25em 0; }

.ql-editor blockquote {
  border-left: 4px solid #ef4235;
  background: #fff7f4;
  padding: 0.6em 1em;
  margin: 1em 0;
  color: #5a3f3a;
  border-radius: 0 12px 12px 0;
  font-style: italic;
}

.ql-editor code {
  background: #fdf2f0;
  color: #c0392b;
  padding: 0.12em 0.4em;
  border-radius: 6px;
  font-size: 0.9em;
  font-family: 'SF Mono', Monaco, Menlo, Consolas, monospace;
}
.ql-editor pre {
  background: #1f1f23;
  color: #f4f4f5;
  padding: 1em 1.2em;
  border-radius: 12px;
  overflow-x: auto;
  font-family: 'SF Mono', Monaco, Menlo, Consolas, monospace;
  font-size: 0.88em;
  line-height: 1.6;
  margin: 1em 0;
}

.ql-editor hr {
  border: none;
  border-top: 2px dashed #ead9d5;
  margin: 1.6em 0;
}

.ql-editor table {
  width: 100%;
  border-collapse: collapse;
  margin: 1em 0;
  font-size: 0.92em;
  border: 1px solid #ead9d5;
  border-radius: 12px;
  overflow: hidden;
}
.ql-editor table th, .ql-editor table td {
  border: 1px solid #ead9d5;
  padding: 0.55em 0.8em;
  text-align: left;
}
.ql-editor table th {
  background: #fff7f4;
  font-weight: 700;
  color: #1f1f23;
}
.ql-editor table tr:nth-child(even) td { background: #fffdfc; }

.ql-editor a { color: #ef4235; text-decoration: underline; text-underline-offset: 2px; }
.ql-editor strong { font-weight: 700; }
.ql-editor em { font-style: italic; }

/* Embedded video */
.ql-editor .ql-video,
.ql-editor .pna-video-file {
  display: block;
  width: 100%;
  max-width: 720px;
  aspect-ratio: 16 / 9;
  min-height: 220px;
  margin: 20px auto;
  border: 0;
  border-radius: 24px;
  background: #111;
  box-shadow: 0 18px 45px rgba(17,17,17,0.12);
}
```

---

## 13. AI image skeleton (inline in article)

ระหว่าง AI gen รูปแต่ละใบใน article body:

```css
.pna-ai-image-skeleton {
  position: relative;
  display: flex;
  width: 100%;
  max-width: 720px;
  aspect-ratio: 16 / 9;
  min-height: 220px;
  margin: 24px auto;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid #ead9d5;
  border-radius: 24px;
  background: #fff7f4;
  color: #8a6d66;
  font-size: 13px;
  font-weight: 700;
}

/* Variants by aspect ratio */
.pna-ai-image-skeleton[data-ai-ratio="1:1"]  { aspect-ratio: 1/1;  max-width: 560px; }
.pna-ai-image-skeleton[data-ai-ratio="4:3"]  { aspect-ratio: 4/3; }
.pna-ai-image-skeleton[data-ai-ratio="3:2"]  { aspect-ratio: 3/2; }
.pna-ai-image-skeleton[data-ai-ratio="9:16"] { aspect-ratio: 9/16; max-width: 420px; }

/* Shimmer overlay */
.pna-ai-image-shimmer {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.75), transparent);
  animation: pna-ai-shimmer 1.3s infinite;
  transform: translateX(-100%);
}

/* Label pill */
.pna-ai-image-label {
  position: relative;
  z-index: 1;
  border-radius: 9999px;
  background: rgba(255,255,255,0.82);
  padding: 8px 14px;
}

/* Failed state */
.pna-ai-image-skeleton--failed {
  background: #fff1f1;
  color: #b42318;
}

/* Generated image (final) */
.pna-ai-generated-image {
  display: block;
  width: 100%;
  max-width: 720px;
  margin: 24px auto;
  border-radius: 24px;
  box-shadow: 0 18px 45px rgba(17,17,17,0.12);
}
.pna-ai-generated-image[data-ai-image-fallback="true"] {
  border: 1px dashed #f0b6b0;
  cursor: pointer;
}
```

---

## 14. Tailwind config snippet (for Next.js)

```ts
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#EF4235',
          red:     '#EF4235',
          'red-dark': '#c8361d',
          orange:  '#ff6b35',
        },
        ink:  '#1a1a1a',
        ink2: '#4b5563',
        ink3: '#6b7280',
        ink4: '#9ca3af',
        warm: {
          input:   '#fffdfc',
          soft:    '#fffbf9',
          tint:    '#fff7f4',
          tint2:   '#fdf2f0',
          tint3:   '#fff4f0',
          bg:      '#faf6f4',
          border:  '#ead9d5',
          'border-light': '#f1e4de',
          'border-soft':  '#f1dfda',
          'border-pink':  '#f3dfdb',
        },
      },
      borderRadius: {
        '2.5xl': '20px',
        '3xl':   '24px',
        '4xl':   '28px',
      },
      boxShadow: {
        'card':       '0 4px 16px rgba(0,0,0,0.025)',
        'modal':      '0 14px 34px rgba(31,41,55,0.14)',
        'brand-btn':  '0 10px 15px -3px rgba(239,66,53,0.2)',
        'brand-xl':   '0 20px 25px -5px rgba(239,66,53,0.25)',
        'dropdown':   '0 22px 70px rgba(30,15,5,0.16)',
      },
      backgroundImage: {
        'ai-banner':  'linear-gradient(135deg, #fffbf9 0%, #fff4f0 100%)',
        'ai-skeleton':'linear-gradient(110deg, #fff4f1 8%, #ffe6df 18%, #fff7f4 33%)',
      },
      animation: {
        'ai-shimmer': 'ai-shimmer 1.4s linear infinite',
      },
      keyframes: {
        'ai-shimmer': {
          '0%':   { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
    },
  },
}
```

---

## 15. Component dependencies needed (Next.js)

| Vue component used | Next.js equivalent suggestion |
|---|---|
| `PartnerPageHeader` | Custom — `<PageHeader title subtitle actions={children} />` |
| `PartnerPanel` | Custom `<Panel title subtitle>` (section 6) |
| `PartnerSelect` | shadcn/ui `<Select>` or Radix Select + brand colors |
| `PartnerKeywordsInput` | Custom — tag input with comma split + AI button |
| Quill editor | [`react-quilljs`](https://www.npmjs.com/package/react-quilljs) or migrate to **Tiptap** (recommended for Next.js) |
| `marked` | Same `marked` npm package (server-render safe) |
| `turndown` | Same `turndown` npm package |
| Material Symbols | Add Google Fonts link OR migrate to `lucide-react` |
| `useDialog` (confirm/alert) | shadcn/ui `<AlertDialog>` |
| `accept` checkbox color | Tailwind: `accent-brand` after config |

---

## 16. Responsive Breakpoints

| Breakpoint | Effect |
|---|---|
| `lg` (≥1024px) | Grid main 8 / sidebar 4 |
| `< lg` | Stack vertical (sidebar drops below) |
| `< md` (768px) | Action bar wraps, SEO sub-tabs wrap, status+date stays 2-col |
| `< sm` (640px) | AI banner stacks (icon+text above button) |

---

## 17. Z-index map (สำคัญสำหรับ layered editor)

| Layer | Z-index | Component |
|---|---|---|
| Quill toolbar (sticky) | 120 | `.ql-toolbar` |
| Image resizer overlay | 50 | (inside editor) |
| AI skeleton overlay | 70 | `.ai-editor-skeleton` |
| Modal backdrop | 1000 | `[fixed inset-0 z-[1000]]` |
| Dropdown inside modal | 1002 | AI topic dropdown |

---

## 18. สรุป design language (admin variant)

PNA admin editor = **warm cream + red accent + AI-first** — แตกต่างจาก public ที่:

1. **Warm cream surfaces** (`#fffdfc`, `#fffbf9`, `#fff7f4`) แทน pure white — รู้สึกอุ่น ไม่ clinical
2. **Border radius ใหญ่กว่า** — input 16, card 24, modal 28 (public ใช้ 12-18)
3. **`ai-fillable` shimmer pattern** — input ทุกตัวที่ AI fill ได้มี skeleton state — เป็น signature
4. **Per-field AI button** (`ai-btn`) — สีแดง 11px ที่มุมขวาบนของ label — scale hover
5. **Button = scale hover** (1.05) — ไม่ใช่ translateY ของ public site
6. **Shadow ของ brand button มีสีแดง** (`shadow-[#EF4235]/25`) — ทำให้ปุ่มดูลอย/พรีเมียม
7. **Sticky Quill toolbar** มี backdrop-blur — รู้สึก native macOS
8. **Modal radius 28px** ใหญ่กว่า card — เด้งออกมา feel important
9. **Status pill** สีอ่อนเสมอ (`#fff7f4` + `#8a6d66`) — ไม่ใช่ pure red
10. **Tab underline 1px full-width** ที่ขอบล่าง — minimal markers, ไม่ใส่ pill

ทุกอย่างใช้ Tailwind utility (เกือบทั้งหมด) — port ไป Next.js เร็วมาก ส่วน CSS scoped (Quill, skeleton) ก็ลอกเข้า `globals.css` หรือ CSS module ได้ตรงๆ
