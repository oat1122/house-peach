# Housify – Real Estate Landing Page Design Spec

เอกสารนี้สรุปดีไซน์ของหน้า Landing Page "Housify" สำหรับ Claude Code นำไป implement
แนวทาง: **Modern Minimalist Real Estate** — สะอาด, มี whitespace เยอะ, ใช้สีส้มอบอุ่นเป็น accent, รูปบ้านเป็น hero ของหน้า

---

## 1. Tech Stack แนะนำ

- **Framework**: Next.js 14+ (App Router) หรือ React + Vite
- **Styling**: Tailwind CSS 3.4+
- **Icons**: `lucide-react` (Heart, ArrowUpRight, Search, ChevronDown, MapPin)
- **Fonts**:
  - Display/Heading: `Plus Jakarta Sans` หรือ `Manrope` (weight 700–800)
  - Body: เดียวกันกับ heading ก็ได้ (weight 400–500)
- **Optional**: `framer-motion` สำหรับ scroll reveal / hover animation

---

## 2. Design Tokens

### 2.1 Colors

```css
:root {
  /* Base */
  --bg-page: #EFEEEA;          /* พื้นหลังนอก card สีครีม-เทาอ่อน */
  --bg-card: #FFFFFF;          /* card สีขาว */
  --bg-dark: #1A1A1A;          /* dark section (About Us) */
  --bg-dark-soft: #232323;

  /* Accent (ส้มอบอุ่น/น้ำตาลทอง) */
  --accent: #C8743A;           /* CTA, ตัวเลข stats, heading highlight */
  --accent-hover: #B0632F;
  --accent-soft: #E8B98A;

  /* Text */
  --text-primary: #1A1A1A;
  --text-secondary: #6B6B6B;
  --text-muted: #9A9A9A;
  --text-on-dark: #FFFFFF;
  --text-on-dark-muted: #B5B5B5;

  /* Border / Divider */
  --border: #E5E3DD;
}
```

### 2.2 Typography Scale

| Token | Size | Weight | Use |
|---|---|---|---|
| `text-hero` | 56–72px / `text-6xl lg:text-7xl` | 800 | "Find Your Dream Home Today" |
| `text-h2` | 40–48px / `text-4xl lg:text-5xl` | 700 | "Discover Your Perfect", "Property Showcase" |
| `text-h3` | 28–32px / `text-2xl lg:text-3xl` | 700 | "Who We Are?", "About Us" |
| `text-stat` | 28–36px / `text-3xl` | 700 | "80+", "500+", "2K+" |
| `text-body` | 14–16px / `text-sm` to `text-base` | 400 | paragraph |
| `text-label` | 12–13px / `text-xs` | 500 | "Premium House", "Sq Ft", "Beds" |

หมายเหตุ: leading ตึงๆ สำหรับ heading (`leading-tight` หรือ `leading-[1.1]`)

### 2.3 Spacing & Radius

- Section padding: `py-20 lg:py-28`
- Container max-width: `max-w-7xl` (~1280px) จัดกลางด้วย `mx-auto px-6`
- Card radius หลัก: `rounded-3xl` (24px)
- Card radius เล็ก: `rounded-2xl` (16px)
- Pill button: `rounded-full`
- Image radius ใน card: `rounded-2xl`

### 2.4 Shadow

ใช้ shadow บางมาก เน้น clean look:
```css
--shadow-card: 0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04);
--shadow-float: 0 10px 30px rgba(0,0,0,0.08);
```

---

## 3. Layout Overview

หน้าแบ่งเป็น 5 sections เรียงจากบนลงล่าง โดยทั้งหน้าอยู่บน `--bg-page` (สีครีม) และมี card สีขาว/ดำซ้อนทับเป็น sections

```
┌─────────────────────────────────────┐
│  Navbar (sticky, transparent→white) │
├─────────────────────────────────────┤
│  Hero (full-width image card)       │
│  └ floating "Who We Are?" card      │
├─────────────────────────────────────┤
│  Discover Your Perfect Property     │
│  └ heading + property gallery grid  │
├─────────────────────────────────────┤
│  About Us (dark card + image)       │
├─────────────────────────────────────┤
│  Property Showcase (carousel)       │
└─────────────────────────────────────┘
```

---

## 4. Section Specs

### 4.1 Navbar

- **Position**: sticky top, `bg-white/80 backdrop-blur` หรือ solid `bg-white`
- **Height**: ~72px (`h-18`)
- **Layout**: `flex items-center justify-between max-w-7xl mx-auto px-6`
- **Logo**: text "HOUSIFY" — uppercase, tracking-wider, weight 700, size ~18px
- **Nav links** (ตรงกลาง): About Us, Properties, Services, More ▾
  - text-sm, weight 500, color text-secondary, hover → text-primary
  - gap-8
- **CTA Button** (ขวา): `Contact Us`
  - `bg-[--accent] text-white rounded-full px-6 py-2.5 text-sm font-medium`
  - hover: `bg-[--accent-hover]`

### 4.2 Hero Section

**Structure**:
```jsx
<section className="px-6 pt-6">
  <div className="relative max-w-7xl mx-auto rounded-3xl overflow-hidden h-[560px]">
    {/* Background image */}
    <Image src="/hero-living-room.jpg" fill className="object-cover" />
    
    {/* Dark gradient overlay */}
    <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
    
    {/* Content (left) */}
    <div className="relative z-10 p-12 lg:p-16 max-w-2xl h-full flex flex-col justify-center">
      <h1 className="text-5xl lg:text-7xl font-extrabold text-white leading-[1.05]">
        Find Your Dream<br/>Home Today
      </h1>
      <p className="mt-5 text-white/85 text-base max-w-md">
        Welcome to our real estate agency, where your dream home awaits.
        Browse our listings and find the perfect property for you.
      </p>
      <div className="mt-8 flex gap-3">
        <button className="rounded-full bg-white text-black px-7 py-3 text-sm font-medium">View</button>
        <button className="rounded-full border border-white/70 text-white px-7 py-3 text-sm">Learn More</button>
      </div>
    </div>
    
    {/* Floating "Who We Are?" card (bottom-right) */}
    <div className="absolute bottom-6 right-6 bg-white rounded-2xl p-6 w-[340px] shadow-[--shadow-float]">
      <h3 className="text-xl font-bold">Who We Are?</h3>
      <p className="text-sm text-[--text-secondary] mt-2">
        We offer a range of services including buying, selling, and property management.
      </p>
      <div className="grid grid-cols-3 gap-3 mt-5">
        <Stat value="80+" label="Premium House" />
        <Stat value="500+" label="Agent House" />
        <Stat value="2K+" label="Happy Clients" />
      </div>
    </div>
  </div>
</section>
```

**Stat component**:
```jsx
<div>
  <div className="text-2xl font-bold text-[--accent]">80+</div>
  <div className="text-xs text-[--text-muted] mt-1">Premium House</div>
</div>
```

**สิ่งที่ต้องสังเกต**:
- รูป hero มี gradient overlay จากซ้าย → ทำให้ตัวหนังสือขาวอ่านง่าย
- มุมทั้ง section โค้ง `rounded-3xl`
- Card "Who We Are?" ลอย overlap ออกมาจาก hero ที่มุมล่างขวา (ใช้ absolute position)

### 4.3 Discover Your Perfect Property Match

**Layout**:
```jsx
<section className="py-20 px-6">
  <div className="max-w-7xl mx-auto">
    {/* Header row: 2 columns */}
    <div className="grid lg:grid-cols-2 gap-12 mb-12">
      <h2 className="text-4xl lg:text-5xl font-extrabold leading-tight">
        Discover Your Perfect<br/>
        <span className="text-[--accent]">Property Match</span>
      </h2>
      <p className="text-sm text-[--text-secondary] leading-relaxed lg:pt-3">
        Discover Your Perfect Property Match with our expert team, dedicated to
        finding the ideal home or investment in California, San Francisco, and
        Miami. We combine deep market knowledge with personalized service to
        ensure a seamless real estate experience tailored to your needs. Trust
        us to guide you every step of the way.
      </p>
    </div>

    {/* Gallery grid */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Left: featured big card */}
      <PropertyCardLarge />
      
      {/* Right: 2x2 minus 1 = 3 small cards */}
      <div className="grid grid-cols-2 gap-4">
        <PropertyCardSmall src="..." />
        <PropertyCardSmall src="..." />
        <PropertyCardSmall src="..." className="col-span-2" />  {/* รูปล่างยาวเต็มสองคอลัมน์ */}
      </div>
    </div>
  </div>
</section>
```

> หมายเหตุ grid: จากภาพคือ ซ้ายเป็น card ใหญ่ 1 ใบ, ขวาเป็น grid 2x2 ที่มี 3 รูป (รูปล่างกว้าง 2 คอลัมน์)

**PropertyCardLarge** (featured):
```jsx
<div className="relative rounded-3xl overflow-hidden bg-white aspect-[4/5] lg:aspect-auto lg:h-[520px]">
  <Image src="..." fill className="object-cover" />
  
  {/* Heart icon top-right */}
  <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 grid place-items-center">
    <Heart className="w-4 h-4" />
  </button>

  {/* Info card bottom (glassmorphism) */}
  <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur rounded-2xl p-5 flex items-center justify-between gap-4">
    <div>
      <div className="text-2xl font-bold">$930,000</div>
      <div className="text-xs text-[--text-secondary] mt-1">
        789 Lombard Street,<br/>San Francisco, CA 94133
      </div>
    </div>
    <div className="flex items-center gap-4 text-xs">
      <Spec value="2,225" label="Sq Ft" />
      <Spec value="3" label="Beds" />
      <Spec value="2" label="Baths" />
    </div>
    <button className="w-10 h-10 rounded-full bg-[--accent] grid place-items-center text-white">
      <ArrowUpRight className="w-4 h-4" />
    </button>
  </div>
</div>
```

**PropertyCardSmall**: รูปอย่างเดียว + heart icon มุมขวาบน, `rounded-2xl overflow-hidden`

### 4.4 About Us (Dark Card)

```jsx
<section className="py-12 px-6">
  <div className="max-w-7xl mx-auto rounded-3xl overflow-hidden grid lg:grid-cols-2 bg-[--bg-dark]">
    {/* Left: dark text */}
    <div className="p-10 lg:p-14 text-white">
      <h2 className="text-4xl lg:text-5xl font-extrabold">
        About <span className="text-[--accent]">Us</span>
      </h2>
      <div className="mt-6 space-y-4 text-sm text-[--text-on-dark-muted] leading-relaxed">
        <p>Housify your trusted partner in the world of real estate...</p>
        <p>Our agency specializes in finding the perfect homes...</p>
        <p>Our team of experienced agents is committed to guiding you...</p>
      </div>
    </div>
    
    {/* Right: image */}
    <div className="relative min-h-[400px]">
      <Image src="/realtor-handshake.jpg" fill className="object-cover" />
    </div>
  </div>
</section>
```

### 4.5 Property Showcase

**Structure**:
```jsx
<section className="py-20 px-6">
  <div className="max-w-7xl mx-auto">
    {/* Heading centered */}
    <h2 className="text-4xl lg:text-5xl font-extrabold text-center">
      Property Showcase
    </h2>

    {/* Filter + Search row */}
    <div className="mt-8 flex items-center justify-center gap-3">
      {/* Tabs */}
      <div className="flex items-center gap-2 bg-white rounded-full p-1">
        <button className="px-5 py-2 rounded-full bg-[--accent] text-white text-sm">Buy</button>
        <button className="px-5 py-2 rounded-full text-sm text-[--text-secondary]">Rent</button>
        <button className="px-5 py-2 rounded-full text-sm text-[--text-secondary]">Sold</button>
      </div>
      {/* Search */}
      <div className="flex items-center bg-white rounded-full px-5 py-2 w-80">
        <input placeholder="Enter City or Zip Code" className="flex-1 bg-transparent text-sm outline-none" />
        <Search className="w-4 h-4 text-[--text-muted]" />
      </div>
    </div>

    {/* Carousel */}
    <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4">
      <ShowcaseCard city="Atlanta, GA" sqft="3,126" beds="5" baths="3" />
      <ShowcaseCard city="San Francisco, CA" sqft="2,225" beds="3" baths="2" />
      <ShowcaseCard city="Boston, MA" sqft="3,120" beds="5" baths="3" />
      {/* ... */}
    </div>

    {/* Pagination dots */}
    <div className="mt-8 flex justify-center gap-2">
      <span className="w-2 h-2 rounded-full bg-[--accent]" />
      <span className="w-2 h-2 rounded-full bg-[--border]" />
      <span className="w-2 h-2 rounded-full bg-[--border]" />
      <span className="w-2 h-2 rounded-full bg-[--border]" />
      <span className="w-2 h-2 rounded-full bg-[--border]" />
    </div>
  </div>
</section>
```

**ShowcaseCard**:
```jsx
<div className="relative rounded-3xl overflow-hidden h-[280px]">
  <Image src="..." fill className="object-cover" />
  <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur rounded-2xl p-3 flex items-center justify-between">
    <div className="text-sm font-bold">{city}</div>
    <div className="flex items-center gap-3 text-[10px]">
      <Spec value={sqft} label="Sq Ft" />
      <Spec value={beds} label="Beds" />
      <Spec value={baths} label="Baths" />
    </div>
  </div>
</div>
```

---

## 5. Reusable Components

### 5.1 `<Stat>` — ตัวเลข + label สั้นๆ
```jsx
function Stat({ value, label }) {
  return (
    <div>
      <div className="text-2xl font-bold text-[--accent]">{value}</div>
      <div className="text-xs text-[--text-muted] mt-1">{label}</div>
    </div>
  );
}
```

### 5.2 `<Spec>` — ใช้ในรายการบ้าน (Sq Ft / Beds / Baths)
```jsx
function Spec({ value, label }) {
  return (
    <div className="text-center px-2 border-l border-[--border] first:border-l-0">
      <div className="text-sm font-semibold">{value}</div>
      <div className="text-[10px] text-[--text-muted]">{label}</div>
    </div>
  );
}
```

### 5.3 `<PillButton>` 2 variants
```jsx
// primary (orange)
<button className="rounded-full bg-[--accent] hover:bg-[--accent-hover] text-white px-6 py-2.5 text-sm font-medium transition">
// ghost (border)
<button className="rounded-full border border-current/70 px-6 py-2.5 text-sm transition hover:bg-white/10">
```

---

## 6. Responsive Behavior

| Breakpoint | Behavior |
|---|---|
| `< 640px` mobile | Hero text ลดเป็น `text-4xl`, "Who We Are?" card ย้ายลงล่างเป็น stack, gallery เป็น single column, Property Showcase 1 column carousel |
| `640–1024px` tablet | Gallery 2 column, Hero "Who We Are?" ยังลอยได้แต่ขยับลงล่าง |
| `≥ 1024px` desktop | ตามภาพ |

จุดที่ต้องระวังบน mobile:
- Floating card "Who We Are?" ห้ามบดบัง heading → ให้กลายเป็น card ปกติใต้ hero
- Nav links ซ่อนเป็น hamburger menu

---

## 7. Animation / Micro-interaction (Optional แต่ทำให้ดีขึ้น)

- Hero text: fade-up + stagger on mount (`framer-motion` หรือ CSS animation-delay)
- Property cards: `hover:scale-[1.02] transition` + image `group-hover:scale-105`
- Heart icon: เปลี่ยนเป็น filled สีแดงตอนกด
- CTA arrow button: `group-hover:translate-x-0.5 group-hover:-translate-y-0.5` (arrow ขยับเฉียง)
- Showcase carousel: drag/swipe ด้วย `embla-carousel-react` หรือ `keen-slider`

---

## 8. Image Requirements

ต้องเตรียมรูป (แนะนำใช้ Unsplash หรือ AI gen):

| Slot | ขนาดแนะนำ | Subject |
|---|---|---|
| Hero | 1600×900 | Modern living room interior, warm tones |
| Featured property | 800×1000 | Modern house exterior, daytime |
| Small gallery (×3) | 600×600 + 1 ใบ 1200×600 | Interior shots: kitchen, bedroom, dining |
| About Us | 800×800 | Realtor handing keys to couple |
| Showcase (×4–5) | 600×500 | Modern houses, ต่างมุม/สไตล์ |

---

## 9. Implementation Order (แนะนำ)

1. ตั้ง CSS variables + Tailwind theme extension ใน `tailwind.config.js`
2. สร้าง `<Navbar>` + page wrapper พื้นหลังครีม
3. Hero section + floating Who We Are card (จัด layout ก่อน แล้วใส่รูป)
4. Discover section grid (ทำ `<PropertyCardLarge>` และ `<PropertyCardSmall>`)
5. About Us dark card
6. Property Showcase + filter tabs + carousel
7. Responsive pass: ไล่จาก mobile → desktop
8. Animation pass: เพิ่ม motion เฉพาะจุดที่จำเป็น

---

## 10. Tailwind Config Snippet

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        page: '#EFEEEA',
        accent: { DEFAULT: '#C8743A', hover: '#B0632F', soft: '#E8B98A' },
        ink: { DEFAULT: '#1A1A1A', soft: '#232323' },
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        float: '0 10px 30px rgba(0,0,0,0.08)',
      },
    },
  },
};
```

---

## หมายเหตุ Style Direction

- **อย่าใช้** สี purple/blue gradient — อันนั้น generic เกินไป
- **อย่าใช้** Inter font — เลือกอะไรที่มี character เช่น Plus Jakarta Sans, Manrope, Satoshi
- **เน้น** whitespace เยอะระหว่าง section (อย่าให้แน่น)
- **เน้น** รูปบ้านคุณภาพดี (real estate ขายด้วยรูปเป็นหลัก)
- **เน้น** corner radius ใหญ่ (`rounded-3xl`) สม่ำเสมอทั้งหน้า — เป็นจุดที่ทำให้ design นี้ดู modern
