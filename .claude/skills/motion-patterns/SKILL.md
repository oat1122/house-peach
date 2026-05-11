---
name: motion-patterns
description: Templates for motion in house-peach — FadeUp/Stagger wrappers, SlideUpSheet, image swap, gestures (hover/tap/drag), layout animations, scroll-linked progress, useAnimate hook, reduced-motion enforcement, page transition. Use this skill when adding any animation to a component or screen, or when reviewing existing motion for performance/a11y compliance. Trigger on phrases like "animate the section", "fade in", "stagger children", "motion budget", "reduced motion", "page transition", "scroll-triggered animation", "drag handle", "layout animation", "hover lift".
---

# Motion patterns

This skill is the playbook for `motion/react` (https://motion.dev/docs) in house-peach. Pairs with [`.claude/rules/motion.md`](../../rules/motion.md) — read that first for invariants.

Every animation must be:
1. **purposeful** — communicates state change, not decorative noise
2. **fast** — ≤ 0.5s
3. **reduced-motion-safe** — respects `prefers-reduced-motion`
4. **performance-safe** — animate `transform` / `opacity` only

## When to use

- Adding any animation to a new component
- Translating a design that has motion specified
- Reviewing existing motion for performance / a11y compliance

## When NOT to use

- Decorative animation with no purpose ("looks cool") — ลบออก
- Animations > 0.5s ที่ผู้ใช้ต้องรอ — ลด duration หรือ ลบ
- Auto-playing animation (carousel, video) — ผู้ใช้ควรควบคุม
- Loop animations — ดึงดูดสายตา รบกวน

## The 4 core wrappers

Build wrappers in `src/components/motion/`. Each wrapper:
- Calls `useReducedMotion()` ภายใน — ห้าม inline `motion.div` ทั่ว codebase
- มี `'use client'` directive
- ใช้ `transform` + `opacity` เท่านั้น

### 1. `<FadeUp>` — section enter on scroll

```tsx
// src/components/motion/FadeUp.tsx
'use client';
import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  delay?: number;
  className?: string;
  /** trigger ทันทีที่ mount แทน scroll into view */
  immediate?: boolean;
};

export function FadeUp({ children, delay = 0, className, immediate = false }: Props) {
  const reduce = useReducedMotion();
  const initial = reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 };
  const animate = { opacity: 1, y: 0 };
  return (
    <motion.div
      initial={initial}
      whileInView={immediate ? undefined : animate}
      animate={immediate ? animate : undefined}
      viewport={immediate ? undefined : { once: true, margin: '-10% 0px' }}
      transition={reduce ? { duration: 0 } : { duration: 0.35, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
```

**Usage:**
```tsx
import { FadeUp } from '@/components/motion/FadeUp';

<section>
  <FadeUp><h2 className="text-3xl">Featured Works</h2></FadeUp>
  <FadeUp delay={0.1}><WorkGrid /></FadeUp>
</section>
```

`whileInView` + `once: true` = animate ครั้งเดียวตอน scroll เข้า viewport แล้วค้างที่ animated state — ไม่ rerun ตอน scroll ออก-เข้า

### 2. `<Stagger>` — list children animate ลำดับ

```tsx
// src/components/motion/Stagger.tsx
'use client';
import { motion, useReducedMotion, type Variants } from 'motion/react';
import type { ReactNode } from 'react';

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

export function Stagger({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-10% 0px' }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children }: { children: ReactNode }) {
  return <motion.div variants={item}>{children}</motion.div>;
}
```

**Usage:**
```tsx
import { Stagger, StaggerItem } from '@/components/motion/Stagger';

<Stagger className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {posts.map(p => (
    <StaggerItem key={p.id}>
      <PostCard post={p} />
    </StaggerItem>
  ))}
</Stagger>
```

> **Don't** stagger > 6 items — รวมเวลา > 0.5s ผู้ใช้รู้สึกช้า. ถ้ามี 12 cards, ใช้ `FadeUp` ทั้ง grid แทน

### 3. `<SlideUpSheet>` — replaces or wraps shadcn `<Sheet>`

shadcn `<Sheet side="bottom">` มี slide-up built-in อยู่แล้ว — ใช้ตรง ๆ:

```tsx
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

<Sheet>
  <SheetTrigger asChild><button>Filter</button></SheetTrigger>
  <SheetContent side="bottom" className="rounded-t-xl">
    {/* filter content */}
  </SheetContent>
</Sheet>
```

ถ้าต้องการ slide-up แบบ custom (เช่น confirmation drawer ที่ไม่ใช่ shadcn shape):

```tsx
// src/components/motion/SlideUpSheet.tsx
'use client';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useEffect } from 'react';

type Props = { open: boolean; onClose: () => void; children: React.ReactNode };

export function SlideUpSheet({ open, onClose, children }: Props) {
  const reduce = useReducedMotion();

  // Esc key
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-ink/50 z-30"
            initial={reduce ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            role="dialog" aria-modal="true"
            className="fixed bottom-0 inset-x-0 z-40 bg-card rounded-t-xl p-4 pb-[env(safe-area-inset-bottom)] max-h-[85vh] overflow-auto"
            initial={reduce ? { y: 0 } : { y: '100%' }}
            animate={{ y: 0 }}
            exit={reduce ? { y: 0 } : { y: '100%' }}
            transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 350, damping: 30 }}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

> Prefer shadcn `<Sheet>` (handles focus trap + a11y for you). Build custom only when shadcn shape doesn't fit

### 4. Image swap (gallery)

```tsx
// src/components/motion/FadeSwap.tsx
'use client';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import Image from 'next/image';

export function FadeSwap({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={src}
        initial={reduce ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0 }}
        transition={{ duration: 0.2 }}
        className={className}
      >
        <Image src={src} alt={alt} fill className="object-cover" sizes="(max-width: 768px) 100vw, 768px" />
      </motion.div>
    </AnimatePresence>
  );
}
```

Use case: WorkGallery thumbnail click → swap hero image

---

## Gesture patterns (motion.dev/docs/react-gestures)

### `whileHover` + `whileTap` — card lift / button press

**Rule:** ถ้า hover effect เป็น `translate` หรือ `scale` ตรง ๆ → Tailwind class ดีกว่า (`hover:-translate-y-0.5`) — ใช้ motion เฉพาะเมื่อต้อง spring physics หรือ orchestrate กับ children

```tsx
'use client';
import { motion, useReducedMotion } from 'motion/react';

export function HoverLiftCard({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  if (reduce) return <div>{children}</div>;
  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="rounded-md bg-card border border-line"
    >
      {children}
    </motion.div>
  );
}
```

**Touch-aware**: `whileHover` ไม่ trigger บน touch device — ใช้ `whileTap` สำหรับ touch feedback

### `drag` — admin gallery reorder handle

```tsx
'use client';
import { motion, useReducedMotion } from 'motion/react';

export function DragHandle({ children, onDragEnd }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.2}
      whileDrag={reduce ? {} : { scale: 1.02, cursor: 'grabbing' }}
      onDragEnd={onDragEnd}
      className="cursor-grab active:cursor-grabbing touch-none"
    >
      {children}
    </motion.div>
  );
}
```

> Pair with Radix `@radix-ui/react-*` for keyboard reorder a11y — drag alone is **not** a11y-compliant
> ดู `uxui.md` § 11 "Drag-handle" pattern (มี `aria-label` + keyboard fallback)

---

## Layout animations (motion.dev/docs/react-layout-animations)

ใช้ `layout` prop เพื่อ animate การเปลี่ยน position/size แบบ **อัตโนมัติ** — motion วัด DOM ก่อน/หลัง แล้ว animate ระหว่าง

### `layout` — accordion expand, filter chip toggle

```tsx
'use client';
import { motion, useReducedMotion } from 'motion/react';

export function ExpandableCard({ expanded, children }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      layout={!reduce}
      transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 30 }}
      className="rounded-md bg-card border border-line p-4"
    >
      {children}
    </motion.div>
  );
}
```

### `layoutId` — shared element transition (rare, expensive)

ใช้สำหรับ "magic move" ระหว่าง 2 components (e.g., card → detail page). ระวัง: ต้อง mount/unmount พร้อมกัน + ทำงานเฉพาะใน `<AnimatePresence>`

```tsx
// list page
<motion.img layoutId={`cover-${post.id}`} src={post.cover} />

// detail page (only if both mount simultaneously — rare in Next router)
<motion.img layoutId={`cover-${post.id}`} src={post.cover} />
```

> **Caution:** Next App Router unmount ทั้ง tree ตอน route change — `layoutId` ใช้ได้เฉพาะ in-page transitions, ไม่ใช่ cross-page

---

## Scroll-linked animation (motion.dev/docs/react-scroll-animations)

### `useScroll` + `useTransform` — progress bar / parallax

```tsx
'use client';
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react';

export function ReadingProgress() {
  const { scrollYProgress } = useScroll();
  const reduce = useReducedMotion();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  if (reduce) return null;
  return (
    <motion.div
      style={{ scaleX, transformOrigin: 'left' }}
      className="fixed top-0 inset-x-0 h-0.5 bg-accent z-50"
    />
  );
}
```

**Use sparingly** — scroll-linked = listener every frame, drains battery บน mobile. เลือกใช้บน hero parallax / reading progress เท่านั้น ไม่ใส่ทั่วทุก section

### `whileInView` (preferred for most cases)

ดู `<FadeUp>` ด้านบน — `whileInView` + `once: true` ใช้ IntersectionObserver (cheap), trigger ครั้งเดียว

---

## `useAnimate` — imperative API (motion.dev/docs/react-use-animate)

ใช้เมื่อ animation **ไม่** map กับ component state เช่น sequence ที่ trigger จาก callback

```tsx
'use client';
import { useAnimate, useReducedMotion } from 'motion/react';

export function ShakeButton({ children, onError }) {
  const [scope, animate] = useAnimate();
  const reduce = useReducedMotion();

  async function handleError() {
    if (reduce) { onError(); return; }
    await animate(scope.current, { x: [0, -6, 6, -4, 4, 0] }, { duration: 0.3 });
    onError();
  }

  return <button ref={scope} onClick={handleError}>{children}</button>;
}
```

ใช้กับ: error shake, success checkmark draw, focus pulse

---

## Spring vs tween — เลือกอันไหน

| Animation | Use | Config |
|---|---|---|
| Section enter, fade | `tween` ease-out | `{ duration: 0.35, ease: 'easeOut' }` |
| Image swap | `tween` linear (short) | `{ duration: 0.2 }` |
| Sheet open, modal | `spring` stiff | `{ type: 'spring', stiffness: 350, damping: 30 }` |
| Hover lift, tap | `spring` bouncy | `{ type: 'spring', stiffness: 400, damping: 25 }` |
| Badge pop, count change | `spring` snappy | `{ type: 'spring', stiffness: 500, damping: 15 }` |
| Drag end snap | `spring` natural | default (`type: 'spring'`) |

> rule of thumb: physical objects (sheet, badge, drag) = spring. abstract transitions (fade, slide) = tween

---

## Reduced motion — enforcement

**Every** motion call site ต้อง `useReducedMotion()` — ไม่มียกเว้น

### Pattern A: short-circuit

```tsx
const reduce = useReducedMotion();
if (reduce) return <div>{children}</div>;   // render static
return <motion.div animate={...}>{children}</motion.div>;
```

### Pattern B: zero duration

```tsx
const reduce = useReducedMotion();
return (
  <motion.div
    animate={{ y: 0, opacity: 1 }}
    transition={reduce ? { duration: 0 } : { duration: 0.35 }}
  >...</motion.div>
);
```

### CSS fallback (สำหรับ Tailwind animations อย่าง `animate-pulse`, `animate-spin`)

ใส่ใน `globals.css`:

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

shadcn primitives จะรับ media query นี้อัตโนมัติ (พวก `data-state` transitions)

---

## Page transition (Next 16)

Next 16 App Router มี streaming + transition built-in — ไม่ต้องทำ page-level motion เอง. ส่วน hero/section animation ใน destination page รัน automatically เมื่อ component mount

ถ้าอยาก orchestrate fade-out → fade-in ระดับ page (rare), wrap layout ใน `<motion.div key={pathname}>` แต่ระวัง: เพิ่ม JS + delay TTFB

**คำแนะนำ:** อย่าเพิ่ม page transition จนกว่าจะมี user research บอกว่าเปลี่ยน page รู้สึก jarring

---

## Performance rules

1. **Animate `transform` + `opacity` เท่านั้น** — `width`, `height`, `top`, `left`, `margin` ทำให้ browser reflow → janky
2. **`will-change: transform`** — ใส่เฉพาะตอน animation จะรัน, remove หลังจบ. มากเกินจะกิน GPU memory
3. **เลี่ยง animate `filter: blur(...)`** — สั่นบน mobile
4. **เลี่ยง heavy keyframes ขณะ scroll** — ใช้ `whileInView` + `once: true` ดีกว่า observer-on-every-frame

---

## How to use this skill

1. ระบุ motion ที่ต้องการ (อยู่ใน 4 ประเภทไหน — fadeUp / stagger / sheet / fade)
2. ใช้ wrapper component ที่มีอยู่ — อย่า inline `motion.div`
3. ถ้าต้อง wrapper ใหม่ ใส่ใน `src/components/motion/` + เช็ค `useReducedMotion()`
4. ทดสอบ:
   - Chrome DevTools → "Rendering" → "Emulate CSS media feature `prefers-reduced-motion`" → reduce — verify ไม่มี animation
   - Slow CPU throttling 4× — verify ไม่ janky
5. Lighthouse mobile perf ≥ 90 หลังเพิ่ม motion

---

## Don'ts

- ห้าม `motion.div` inline ทั่ว codebase — wrapper ใน `motion/` เท่านั้น
- ห้าม animation > 0.5s
- ห้าม animation ที่ pulse / loop ไม่มีจบ (ยกเว้น loading spinner)
- ห้าม animate `width` / `height` / `top` / `left` — ใช้ `transform`
- ห้าม `whileInView` ไม่มี `once: true` — animation rerun ทุกครั้งที่ scroll ผ่าน = น่ารำคาญ
- ห้ามใส่ motion โดยไม่เช็ค `useReducedMotion()` — exclude vestibular-sensitive users
- ห้าม `motion` ที่หรู ๆ บน admin panel — admin ต้องการเร็ว, ไม่ต้องการสวย
