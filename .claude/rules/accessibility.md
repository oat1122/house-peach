# Accessibility (a11y) rules

มาตรฐาน WCAG 2.1 AA เป็น baseline — ทุกหน้าต้องผ่าน

## Semantic HTML

ใช้ landmark element ตามความหมาย — ห้ามแทนด้วย `<div>` ทุกอย่าง

| ตำแหน่ง | Element |
|---|---|
| header ของ page | `<header>` |
| navigation | `<nav>` |
| main content | `<main>` (หนึ่งต่อ page) |
| section ที่มี heading | `<section>` พร้อม heading |
| footer | `<footer>` |
| form | `<form>` (ห้ามแทนด้วย div + onSubmit) |

## Heading hierarchy

หนึ่ง `<h1>` ต่อ page เท่านั้น (ปกติคือชื่อ post / ชื่อ work / ชื่อหน้า)
ห้ามข้าม level — `<h2>` แล้วต่อด้วย `<h2>` หรือ `<h3>` เท่านั้น ห้าม `<h2>` → `<h4>`

## Interactive elements

- ปุ่ม = `<button>` (ไม่ใช่ `<div onClick>`) — keyboard + screen reader ทำงานทันที
- Link = `<a href>` (ไม่ใช่ `<button onClick={() => router.push}>`) — ผู้ใช้ middle-click เปิด tab ใหม่ได้
- ทุก interactive element ต้องมี **focus ring** — ห้าม `outline-none` แบบโดดๆ ใส่ `focus-visible:ring` ทดแทน

## Aria labels

ปุ่มที่มีแต่ icon ต้องมี `aria-label`:

```tsx
<button aria-label="เพิ่มลงตะกร้า"><Icon.Bag /></button>
```

Form input ต้องมี `<label>` ผูกกัน — ห้าม placeholder แทน label

```tsx
<label htmlFor="email">อีเมล</label>
<input id="email" type="email" />
```

ถ้า label ซ่อน visual (จำเป็น) ใช้ `sr-only`:

```tsx
<label htmlFor="search" className="sr-only">ค้นหา</label>
<input id="search" placeholder="Search posts..." />
```

## Color contrast

- Text ปกติ: ratio ≥ **4.5:1** (`var(--ink)` บน `var(--bg)`)
- Large text (≥ 18px / 14px bold): ratio ≥ **3:1**
- UI components และ icon: ≥ **3:1**

ทุก theme preset (peach/cream/sage/ink) ต้องผ่าน — เช็คด้วย browser devtools หรือ
[WebAIM contrast checker](https://webaim.org/resources/contrastchecker/)

ห้ามใช้แค่ color เพื่อสื่อความหมาย — เพิ่ม icon / text label ด้วย (e.g., error ไม่ใช่แค่แดง — ต้องมี ⚠️ + ข้อความ)

## Reduced motion

ทุก animation ใน `motion/react` ต้องเช็ค `useReducedMotion()`:

```tsx
const reduce = useReducedMotion();
<motion.div animate={reduce ? {} : { y: 0, opacity: 1 }} />
```

หรือใน CSS:
```css
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

ระยะเวลา animation > 5s ต้องมีปุ่ม pause / disable

## Forms

- ทุก field มี `<label>` ที่ associated
- Error message ต้องอยู่ใต้ field (visually) + `aria-describedby` ผูก field กับ error
- Required field ใส่ `aria-required="true"` + visual indicator (asterisk + tooltip)

```tsx
<input
  id="email"
  type="email"
  aria-required="true"
  aria-invalid={!!errors.email}
  aria-describedby={errors.email ? 'email-error' : undefined}
/>
{errors.email && <span id="email-error" role="alert">{errors.email.message}</span>}
```

## Keyboard navigation

ทุก flow ต้อง complete ได้ด้วย keyboard เท่านั้น — ลอง `Tab`, `Shift+Tab`, `Enter`, `Space`, `Esc`

- Modal / Sheet ต้อง trap focus (shadcn `<Dialog>`/`<Sheet>` ทำให้แล้ว) + close ด้วย `Esc`
- Custom dropdown ใช้ `<Combobox>` ของ shadcn / Radix — อย่าทำเอง
- Skip link "ข้ามไปยังเนื้อหา" ที่ต้นทุก page

## Touch target

- Min 44×44 px (Apple HIG)
- ปุ่มในตาราง / list ต้อง padding ขยาย hit area

## Screen reader testing

อย่างน้อยเช็ค flows สำคัญด้วย NVDA (Windows) หรือ VoiceOver (Mac):
- เปิด blog post → อ่าน → submit contact form
- Login flow

## Live regions

Toast / notification ใช้ `aria-live="polite"` (สำคัญ) หรือ `assertive` (urgent)

```tsx
<div role="status" aria-live="polite">เพิ่มในตะกร้าแล้ว</div>
```

## Audit checklist

ก่อนปิด phase รัน:
- Lighthouse a11y ≥ 95
- WAVE browser extension — 0 critical errors
- axe DevTools — 0 violations
- Manual keyboard test ของ user flow หลัก
- Screen reader test 1 flow

## When in doubt

เรียก `a11y-reviewer` agent — จะตรวจ component / PR ให้ตามมาตรฐาน WCAG
