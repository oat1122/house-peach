# UX/UI rules — design language

หลักการ visual + interaction ของ house-peach — เติมส่วนที่ `stack.md` / `accessibility.md` / `seo.md` / `content.md` ยังไม่ได้ระบุ

> **อ่านควบคู่กัน:**
> - `stack.md` — theme tokens + mobile-first basics + motion budget (high-level)
> - `accessibility.md` — focus, contrast, keyboard, reduced motion
> - ไฟล์นี้ — design language (typography, spacing, color usage, component anatomy, state types, brand voice)

---

## 1. Brand feel

| คำสำคัญ | คำตรงข้าม (อย่าทำ) |
|---|---|
| warm, calm, observational | cold, hyper, sales-y |
| content-first | chrome-first |
| handcrafted, intimate | corporate, faceless |
| generous whitespace | dense, cramped |
| natural light · soft shadows | flat, harsh contrasts |

ทุก design decision ผ่าน "filter" นี้ก่อน — ถ้าทำให้รู้สึก aggressive / busy / spammy → ทำใหม่

---

## 2. Typography scale

ใช้ **2 family** เท่านั้น (ผ่าน `next/font/google`):
- `--font-sans` = DM Sans (subset latin + thai) → body, UI, label
- `--font-serif` = DM Serif Display (subset latin + thai) → hero headline, post title H1

Tailwind v4 class | px | line-height | use case
---|---|---|---
`text-xs` | 12 | 1.4 | caption, meta, small label
`text-sm` | 14 | 1.5 | secondary body, helper text
`text-base` | 16 | 1.65 | **body default** (อ่านสบายตา)
`text-lg` | 18 | 1.5 | lead paragraph, post intro
`text-xl` | 20 | 1.4 | card title, section subtitle
`text-2xl` | 24 | 1.3 | h3
`text-3xl` | 30 | 1.25 | h2
`text-4xl` | 36 | 1.2 | h1 (default)
`text-5xl` | 48 | 1.1 | hero h1 mobile
`text-7xl` | 72 | 1.0 | hero h1 desktop (`md:text-7xl`)

**Weight:**
- `font-normal` (400) — body
- `font-medium` (500) — emphasis ใน body, button label
- `font-semibold` (600) — h3/h4
- `font-bold` (700) — h1/h2 hero
- Serif (`font-serif`) — ใช้กับ h1 hero + post title เท่านั้น; ห้ามใส่ใน body

**Tracking (letter-spacing):**
- Headline ≥ 36px → `tracking-tight` (-0.02em)
- All-caps eyebrow label → `tracking-widest uppercase text-xs`

**Thai-specific:**
- Thai font ต้อง line-height ≥ 1.5 (มี vowel ทั้งบนล่าง — เผื่อพื้นที่)
- ห้าม `tracking-tight` กับ body ภาษาไทย (อ่านยาก)

---

## 3. Spacing scale (Tailwind defaults — ใช้แค่ subset)

ใช้แค่ค่าเหล่านี้ — ไม่ใช้ค่าแปลก ๆ:

| token | px | use |
|---|---|---|
| `1` | 4 | tight inline (badge padding) |
| `2` | 8 | small gap (icon + label) |
| `3` | 12 | inline-block padding |
| `4` | 16 | **default** padding/gap |
| `6` | 24 | between paragraphs, card padding |
| `8` | 32 | section gap (mobile) |
| `12` | 48 | section gap (desktop) |
| `16` | 64 | section gap large (hero → next section) |
| `24` | 96 | hero vertical padding desktop |

**Container:**
- Mobile: `px-4` (16px gutter)
- ≥ md: `px-6 mx-auto max-w-6xl` (1152px content width)
- Article body (post detail): `max-w-prose` (~65ch) — readable line length

**Grid:**
- Listing grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8`
- หน้า detail: `mx-auto max-w-3xl` (~768px) — เก็บโฟกัส

---

## 4. Radii (border-radius)

| class | px | use |
|---|---|---|
| `rounded-sm` | 2 | input, small button |
| `rounded-md` | 6 | **default** card / button / input |
| `rounded-xl` | 12 | large card / sheet / dialog |
| `rounded-2xl` | 16 | hero card / featured work |
| `rounded-full` | 9999 | avatar, pill chip, icon button |

ห้ามผสม radius หลายค่าใน component เดียว (เช่น card `rounded-2xl` + image ข้างใน `rounded-md`) — เลือกค่าเดียวต่อ component family

---

## 5. Shadows — ใช้น้อย, ใช้แทนได้ด้วย border

shadow บน warm-tone palette มักดูสกปรก. แทนที่ด้วย:
- `border border-line` + `bg-card` — แยก layer แบบเรียบ
- `bg-bg2` — layer แบบใช้สี
- `shadow-sm` — ใช้เฉพาะ sticky bar / hover card lift

**ห้าม** `shadow-lg`, `shadow-2xl` แบบ Material — ผิด aesthetic
**Hover state** = `hover:shadow-sm` + `hover:-translate-y-0.5` (เล็กน้อย) เท่านั้น

---

## 6. Color usage rules

มี 4 preset (peach / cream / sage / ink) ใช้ tokens 7 ตัว: `--bg`, `--bg2`, `--card`, `--ink`, `--muted`, `--line`, `--accent`

### When to use which

| Token | When |
|---|---|
| `bg-bg` | page background (default) |
| `bg-bg2` | section ที่ต้องการเน้นแยกจาก bg (alternating sections) |
| `bg-card` | card surface (ยกขึ้นจาก bg เล็กน้อย) |
| `text-ink` | body text default |
| `text-muted` | secondary text (date, byline, meta) — ห้ามใช้กับ key info |
| `border-line` | borders, divider, input border |
| `text-accent` / `bg-accent` | CTA primary, hover state, brand emphasis — **อย่าใช้พร่ำเพรื่อ** (เกิน 2 จุดต่อ viewport = noisy) |

### Semantic color (error, success, warning)

ใช้ผ่าน CSS var ใน `themes.css` (ปรับให้ลงตัวกับทุก preset):
- `--success` — warm green
- `--warning` — warm amber
- `--danger` — warm red

ห้าม `text-red-500` / `bg-green-500` ตรง ๆ — ผ่าน token ทุกสี

---

## 7. Imagery — aspect ratios + treatments

| Context | Aspect | Reason |
|---|---|---|
| Post cover (card) | **16:10** | wider than 4:3, less crop on featured |
| Post cover (OG image) | **1.91:1** (1200×630) | FB/Twitter required |
| Work cover (card) | **3:2** | landscape rooms look natural |
| Work hero (detail page) | **3:2** mobile, **2:1** desktop | wider on desktop |
| Work gallery thumbnail | **1:1** | grid uniformity |
| Author avatar | **1:1** rounded-full | profile |

**Treatments:**
- ทุก cover ใส่ `object-cover` + aspect container (กัน CLS)
- ห้าม filter ที่เปลี่ยน hue (sepia, grayscale) — ให้สีรูปจริงพูดเอง
- Lightbox tap ใน gallery → fullscreen view (Phase 5 add yet-another-react-lightbox if needed)

**Alt text:**
- Cover: `${title} — ${roomType / category}`
- Gallery: `${title} — ${kind}: ${descriptive}`
- Decorative: `alt=""` (empty, ไม่ละ alt)

---

## 8. Iconography (lucide-react)

ขนาด:
- Inline ใน body text: `size={16}`
- Button + UI icon: `size={20}` (default)
- Section header eyebrow: `size={20}` + spacing 8
- Hero / feature: `size={32}` หรือใหญ่กว่า

**Stroke:** lucide default 2 — ห้ามแก้เป็น 1 (เบาเกินไป) หรือ 3 (หนาเกินไป)
**Color:** `text-ink` หรือ `text-muted` — `text-accent` เฉพาะ icon ที่อยู่กับ CTA

**Icon-only button** ต้อง:
1. `aria-label` (required per `accessibility.md`)
2. Padding ≥ `p-2.5` (= 10px → hit area 36px + 20 icon = 56px ใหญ่กว่า 44px ✓)

---

## 9. Component anatomy — public site

### 9.1 Page hero (home)

```
[ image — full-width, aspect 16:9 mobile / 21:9 desktop ]
[ eyebrow label (text-xs uppercase tracking-widest text-muted) ]
[ headline (h1, serif, 5xl→7xl) ]
[ lead (text-lg text-muted, max 2 lines) ]
[ CTA button (primary, accent) + secondary text-link ]
```

vertical spacing: `pt-12 pb-16 md:pt-24 md:pb-32`

### 9.2 PostCard (blog listing)

```
[ cover image — aspect 16:10, rounded-md ]
[ tag chip(s) — pill, bg-bg2, text-xs ]
[ title (text-xl font-semibold text-ink line-clamp-2) ]
[ excerpt (text-sm text-muted line-clamp-2) ]
[ meta row: date · reading-time-min · author (text-xs text-muted) ]
```

card padding: `p-4`. hover: `hover:-translate-y-0.5 transition` + `hover:shadow-sm`

### 9.3 WorkCard (portfolio listing)

```
[ cover image — aspect 3:2, rounded-md ]
[ overlay on hover: title + room type + style ] (desktop)
[ on mobile: meta below image ]
  - title (text-lg font-semibold)
  - room type · style · location (text-xs text-muted)
```

### 9.4 Listing page

```
[ page heading (h1 4xl) + subtitle ]
[ filter bar — sticky top-0 z-10 bg-bg/80 backdrop-blur ]
  - chips for room/style/tag
  - sort dropdown (latest / featured)
[ grid (col-1 / md:col-2 / lg:col-3) gap-6 ]
[ pagination — load more button OR numbered (admin choice) ]
```

### 9.5 Detail page (post / work)

```
[ breadcrumb (text-sm text-muted) — Home / Blog / <title> ]
[ h1 — serif, 4xl→5xl, max-w-3xl ]
[ meta row — date · reading time · author (post) | room · style · location (work) ]
[ cover image full-width, aspect 3:2 or 2:1 desktop ]
[ article body (prose, max-w-prose) — MDX rendered ]
[ tags row (chips) at bottom ]
[ related — 2-3 cards of related post/work ]
```

### 9.6 Header (public)

Desktop (≥md): top horizontal nav
- left: logo (text or mark)
- center: links (Works · ผลงาน, Blog · บทความ, About · เกี่ยวกับเรา, Contact)
- right: theme switcher + locale switcher

Mobile (<md): top bar + sticky bottom tab bar
- top: logo + hamburger trigger (opens Sheet)
- bottom tab: 4 items (Home / Works / Blog / Menu)

### 9.7 Footer

```
[ section 1: brand statement (1 short paragraph) ]
[ section 2: nav columns ] (sitemap, services, about, contact)
[ section 3: social icons (text-muted, hover:text-accent) ]
[ bottom bar: © year · privacy · terms (text-xs text-muted) ]
```

bg: `bg-bg2`. padding: `py-12 md:py-16`.

---

## 10. State types — every component should handle all 9

| State | Visual |
|---|---|
| default | base style |
| hover | subtle elevation + accent shift (desktop only) |
| focus-visible | ring-2 ring-accent ring-offset-2 ring-offset-bg |
| active | scale-95 + bg-accent/10 |
| disabled | opacity-50 cursor-not-allowed pointer-events-none |
| loading | Skeleton/spinner (see `skills/page-states`) |
| empty | empty-state component (illustration + message + CTA) |
| error | red border + icon + message + retry CTA |
| success | toast via sonner (auto-dismiss 3s) |

Default + focus-visible + disabled ต้องครบ **ทุก interactive element** — ไม่มียกเว้น

---

## 11. Density

| Surface | Density |
|---|---|
| Public pages (home, blog, works) | **generous** — `py-12+`, ระยะการ์ดห่าง `gap-6+` |
| Admin pages | **tight** — `py-4`, ระยะ `gap-3` ก็พอ, ใช้ table แทน card |

อย่าผสมความหนาแน่นใน page เดียว — public รุ่ย admin หนา. ผู้ใช้รู้สึกว่ามาคนละโลก = ถูกแล้ว

---

## 12. Forms

### Public form (contact)

- Spacing โปร่ง: `space-y-6` ระหว่าง field
- Label อยู่บน input (ไม่ใช่ inside floating)
- Help text (`text-xs text-muted`) ใต้ input
- Error: `text-xs text-danger` + `aria-describedby`
- Submit button: full-width mobile, auto desktop

### Admin form (post/work editor)

- Spacing หนา: `space-y-4`
- 2-column layout บน desktop ถ้า field สั้น: `grid grid-cols-2 gap-4`
- Inline validation (debounce 300ms) — แสดง error ทันทีที่ blur
- Sticky bottom action bar: Save Draft · Publish · Discard

ใช้ shadcn `<Form>` + RHF + zodResolver ทุกฟอร์ม — ห้ามทำเอง

---

## 13. Motion — language

อ้างอิง `stack.md` "Motion budget" + เพิ่ม specifics:

| Effect | Trigger | Duration |
|---|---|---|
| `fadeUp` | section enter on scroll (IntersectionObserver) | 0.35s ease-out, y: 8→0, opacity 0→1 |
| `slideUp` | sheet open | 0.3s ease-out spring |
| `pop` | badge / count change | spring stiffness 400 damping 12 |
| `fade` | image swap (gallery) | 0.2s linear |

**ทุก animation:**
- ต้องเช็ค `useReducedMotion()` (ดู `skills/motion-patterns`)
- ห้ามเกิน 0.5s (ผู้ใช้เริ่มอึดอัด)
- ห้าม animate `width` / `height` / `top` / `left` (layout thrash) — ใช้ `transform` แทน

**Hover** บน touch device ไม่มี — ใช้ tap state แทน

---

## 14. Brand voice (copy)

ภาษาไทยเป็นหลัก — ตึงสั้น อ่อนโยน ไม่อวด

**Do:**
- "ห้องนั่งเล่นที่อบอุ่นเหมือนกอด"
- "เริ่มต้นบทสนทนากับเรา"
- "เห็นผลงานล่าสุด"

**Don't:**
- "พลิกโฉมบ้านของคุณวันนี้!" (sales-y)
- "BEST INTERIOR DESIGN STUDIO 🔥" (loud)
- ใช้ emoji ใน body / button (เก็บไว้สำหรับ admin UI ภายในเท่านั้น)

CTA button: 2-3 คำ, verb-first:
- "เริ่มโปรเจกต์" ✓ ไม่ใช่ "คลิกที่นี่"
- "อ่านบทความ" ✓ ไม่ใช่ "เพิ่มเติม"

EN copy ใช้ sentence case (ไม่ใช่ Title Case ทุกคำ) ยกเว้น brand name + proper noun

---

## 15. Empty/error illustration

ห้ามใช้ stock illustration / cartoon — ใช้:
- ไอคอน lucide-react ขนาดใหญ่ (`size={48}`, `text-muted`)
- ข้อความ TH สั้น + CTA แนะนำขั้นต่อไป

```tsx
<div className="text-center py-16">
  <SearchX size={48} className="text-muted mx-auto mb-4" />
  <h2 className="text-xl font-semibold">ยังไม่มีบทความในหมวดนี้</h2>
  <p className="text-sm text-muted mt-2">ลองเปลี่ยนตัวกรอง หรือ <Link className="text-accent underline">ดูทั้งหมด</Link></p>
</div>
```

---

## 16. When in doubt

- Visual feels off → switch theme ผ่าน 4 preset ดูว่ายัง balance หรือเปล่า — ถ้าแตกเฉพาะ `ink` (dark) คือ contrast bug
- Layout feels cramped → เพิ่ม spacing 1 step (4 → 6 → 8)
- Component looks busy → ลบ shadow / ลด accent / เพิ่ม whitespace
- Copy ดูแข็ง → อ่านออกเสียง — ถ้ารู้สึก "ขายของ" แก้ใหม่
- Motion รบกวน → ตัดออก. motion ที่ดีไม่มีใครสังเกต
