# Motion rules

หลักการสำหรับ animation library `motion` (https://motion.dev/docs) — ใช้ตลอดโปรเจกต์

> **อ่านควบคู่:**
> - `stack.md` § Motion budget (high-level)
> - `accessibility.md` § Reduced motion
> - `uxui.md` § 14 (motion language: 4 keyframes + duration constraint)
> - Skill [`motion-patterns`](../skills/motion-patterns/SKILL.md) (templates + procedure)

ไฟล์นี้ = **invariants** (ห้ามผิด). Skill = **procedure** (วิธีทำ)

---

## Library + import

โปรเจกต์ใช้ `motion` v12 — successor ของ `framer-motion` (เปลี่ยนชื่อแล้ว):

```ts
// ✓ ใช้
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';

// ✗ ห้าม — ไม่มี dependency นี้
import { motion } from 'framer-motion';
```

- npm package: `motion` (อยู่ใน `package.json` แล้ว)
- import path: `motion/react` สำหรับ React (มี `motion/react-client` ถ้าจะ tree-shake แต่ default พอ)
- Docs: https://motion.dev/docs

ถ้าต้อง animate แบบ JS imperative (rare) → `import { animate } from 'motion'` (vanilla, ไม่มี React)

---

## Where motion lives

**ทุก wrapper อยู่ใน `src/components/motion/`** — ห้าม inline `motion.div` กระจัดกระจาย

```
src/components/motion/
├─ FadeUp.tsx          ✓ existing wrapper
├─ Stagger.tsx
├─ SlideUpSheet.tsx
├─ FadeSwap.tsx
└─ <NewWrapper>.tsx    เพิ่มเมื่อมี pattern ใหม่ที่ใช้ ≥ 3 จุด (per clean-code.md § 2)
```

**Rule:** ถ้าหน้าใดต้อง animation ที่ wrapper ปัจจุบันไม่ครอบ — ตัวเลือกตามลำดับ:
1. Extend wrapper เดิม (props ใหม่)
2. ใช้ shadcn primitive ที่มี animation built-in (Sheet, Dialog, Accordion, etc.)
3. สร้าง wrapper ใหม่ใน `components/motion/`
4. **ทางเลือกสุดท้าย**: inline `motion.div` — ต้องเหตุผลใน PR

---

## Critical invariants — ห้ามผิด

### 1. ทุก motion call site ต้อง check `useReducedMotion()`

```tsx
'use client';
import { motion, useReducedMotion } from 'motion/react';

export function FadeIn({ children }) {
  const reduce = useReducedMotion();
  if (reduce) return <>{children}</>;       // pattern A: short-circuit
  return <motion.div animate={{ opacity: 1 }}>{children}</motion.div>;
}
```

หรือ pattern B (zero duration):
```tsx
const reduce = useReducedMotion();
<motion.div transition={reduce ? { duration: 0 } : { duration: 0.35 }} />
```

ห้ามมี wrapper / inline motion ที่ไม่มี `useReducedMotion()` — **ทุกที่ ไม่มียกเว้น**

### 2. Animate `transform` + `opacity` เท่านั้น

```tsx
// ✓ GPU-accelerated
animate={{ x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 }}

// ✗ layout thrash → janky
animate={{ width: 200, height: 100, top: 0, left: 0, margin: 16 }}
```

ยกเว้น `layout` prop ของ motion (มัน optimize ให้แล้ว — ดูส่วน Layout animations ใน skill)

### 3. Duration ≤ 0.5s

UI animation ต้องจบเร็ว — user รอไม่ได้:
- Section enter: 0.35s
- Sheet open: 0.3s
- Image swap: 0.2s
- Toast: 0.2s in / 0.2s out

ยกเว้น decorative ที่ user ไม่ต้องรอ (e.g., ambient gradient background) — แต่ต้อง pause ได้

### 4. `whileInView` ต้องมี `once: true`

```tsx
// ✓ animate ครั้งเดียวตอน scroll เข้า
whileInView={{ opacity: 1 }}
viewport={{ once: true, margin: '-10% 0px' }}

// ✗ rerun ทุกครั้งที่ scroll ผ่าน — รำคาญ
whileInView={{ opacity: 1 }}
viewport={{ margin: '-10% 0px' }}
```

### 5. `'use client'` directive

ไฟล์ที่ import `motion/react` ต้องเป็น client component:

```tsx
'use client';   // ← required at top
import { motion } from 'motion/react';
```

RSC ไม่รัน motion ได้ — เพราะ motion ต้อง browser API (RAF, IntersectionObserver)

---

## API quick reference

| Need | API | Docs |
|---|---|---|
| Basic animate | `<motion.div animate={...} initial={...} />` | https://motion.dev/docs/react-animation |
| Reduced motion | `useReducedMotion()` | https://motion.dev/docs/react-use-reduced-motion |
| Enter/exit | `<AnimatePresence>` | https://motion.dev/docs/react-animate-presence |
| Scroll-triggered | `whileInView` + `viewport={{ once: true }}` | https://motion.dev/docs/react-scroll-animations |
| Scroll-linked progress | `useScroll` + `useTransform` | https://motion.dev/docs/react-scroll-animations#useScroll |
| Hover / tap | `whileHover` / `whileTap` | https://motion.dev/docs/react-gestures |
| Drag | `drag` + `dragConstraints` | https://motion.dev/docs/react-gestures#drag |
| Layout shift | `layout` / `layoutId` | https://motion.dev/docs/react-layout-animations |
| Variants | `variants={...}` + `initial="..."` `animate="..."` | https://motion.dev/docs/react-variants |
| Stagger children | `staggerChildren` in container variant | https://motion.dev/docs/react-variants#orchestration |
| Imperative | `useAnimate()` | https://motion.dev/docs/react-use-animate |
| Motion values | `useMotionValue` / `useTransform` / `useSpring` | https://motion.dev/docs/react-motion-value |

---

## When motion is allowed vs banned

### ✓ Allowed (purposeful)

- **Section enter on scroll** — `FadeUp` (subtle, signals new content)
- **List items entering** — `Stagger` (≤ 6 items)
- **Sheet/modal open** — shadcn primitive (already has anim) or `SlideUpSheet`
- **Image swap in gallery** — `FadeSwap`
- **State change feedback** — checkmark on toggle, badge pop on count change
- **Drag-to-reorder** in admin gallery (uses `motion` `drag` + Radix DnD)
- **Hover lift on card** (desktop) — `whileHover={{ y: -2 }}` หรือ Tailwind `hover:-translate-y-0.5` (Tailwind ดีกว่าถ้าไม่ต้องการ motion features)

### ✗ Banned

- **Decorative motion** — "looks cool" without communicating state
- **Auto-playing loops** — pulse, breathe, ambient float — ดึงสายตา รบกวน reading
- **Carousel auto-rotate** — user lose control
- **Page transition** — Next 16 streaming handles it; เพิ่ม motion ที่ layout level ทำให้ TTFB ช้า
- **Hover effects on touch** — touch ไม่มี hover; ใช้ active state แทน
- **Animation on admin panel UI** — admin ต้องการเร็ว ไม่ต้องการสวย (ยกเว้น state feedback: toast, drag handle)

---

## Performance constraints

1. **`will-change: transform`** — ใส่เฉพาะตอน animation รัน, remove หลังจบ (motion handle ให้ใน v12 — ไม่ต้องคิด)
2. **เลี่ยง `filter: blur()` animations** — สั่นบน mobile, GPU-expensive
3. **`useScroll` กับ `useTransform` ใน scroll-linked** ต้อง throttle / lazy — อย่า attach กับ heavy DOM
4. **AnimatePresence + key change** ทำให้ unmount/mount — child state จะหาย, ใช้กับ leaf component เท่านั้น
5. **Layout animations (`layout` prop)** = re-measure DOM, ใช้ sparingly — รับมือดี กับ list reorder / accordion expand ไม่ดีกับ tree ใหญ่
6. **Stagger > 6 items = total > 0.5s** — ถ้ามี 12 cards, fade ทั้ง grid แทน

---

## Reduced motion — system + CSS fallback

นอกจาก `useReducedMotion()` ของ motion ใส่ใน `globals.css` ด้วย (กัน Tailwind anim + shadcn data-state transitions):

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## Testing checklist (ทุก component ที่มี motion)

1. **Reduced motion off** — animation ทำงานปกติ
2. **Reduced motion on** (DevTools → Rendering → Emulate CSS media `prefers-reduced-motion: reduce`) — element แสดงทันที, ไม่มี animation
3. **Slow CPU 4×** (DevTools → Performance) — ไม่ janky ≥ 30fps
4. **Mobile** (iPhone simulation) — animation ลื่น
5. **Keyboard test** — focus state ยัง visible ระหว่าง animation
6. **Lighthouse mobile perf** ≥ 90 หลังเพิ่ม motion

---

## Don'ts (รวมจากทุก rule + skill)

- ห้าม `framer-motion` (เปลี่ยนชื่อเป็น `motion` แล้ว)
- ห้าม `motion.div` inline ในไฟล์ที่ไม่ใช่ `components/motion/`
- ห้าม animation > 0.5s
- ห้าม loop animation ที่ไม่มีจบ (ยกเว้น loading spinner)
- ห้าม animate layout properties (`width`, `height`, `top`, `left`, `margin`, `padding`)
- ห้าม `whileInView` ที่ไม่มี `once: true`
- ห้าม motion โดยไม่เช็ค `useReducedMotion()`
- ห้าม motion บน admin panel chrome (header, table row, button hover) — เฉพาะ state feedback
- ห้าม page-level transition (Next 16 streaming ดูแลแล้ว)
- ห้ามใช้ `transition: { type: 'tween' }` ที่ duration > 0.4s — ใช้ `spring` ดีกว่า สำหรับ "natural" feel

---

## When in doubt

- ใช้ skill [`motion-patterns`](../skills/motion-patterns/SKILL.md) — มี wrapper templates + gesture examples
- ถ้า animation รู้สึก "ขัด" — ลด duration ลง 0.1s หรือเปลี่ยน easing (`easeOut` กว่า `linear`)
- ถ้า ผู้ใช้บ่นเวียนหัว — ทำ reduced-motion test, ถ้า on แล้วยัง animate = bug
- ถ้า bundle size บวม จาก motion — ใช้ Tailwind transition class แทนสำหรับ trivial animation (hover lift, fade)
