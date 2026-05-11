# Loading states rules — Skeleton & Spinner

หลักการสำหรับการแสดง loading state ที่ทำให้ UX รู้สึก **เร็ว + คาดเดาได้ + ไม่หลอก**

> **อ่านควบคู่:**
> - `uxui.md` § 10 — state types (loading เป็น 1 ใน 9 state)
> - `accessibility.md` § Live regions + ARIA
> - `motion.md` — reduced-motion enforcement (skeleton/spinner pulse/spin ต้องเคารพ)
> - Skill [`page-states`](../skills/page-states/SKILL.md) — templates + procedure

ไฟล์นี้ = **invariants** (เลือก skeleton/spinner ไหน + a11y + UX). Skill = วิธีทำ.

---

## Components available

ทั้ง 2 ตัวอยู่ใน `src/components/ui/` แล้ว — **ห้ามทำเอง**:

| Component | File | Source |
|---|---|---|
| `<Skeleton>` | `src/components/ui/skeleton.tsx` | shadcn — `animate-pulse rounded-md bg-muted` |
| `<Spinner>` | `src/components/ui/spinner.tsx` | shadcn — `Loader2Icon` + `animate-spin` + `role="status"` |

ถ้าต้องการ progress ที่บอกเปอร์เซ็นต์ → install shadcn `Progress` (`npx shadcn@latest add progress`) ตอนต้องการใช้จริง

---

## Skeleton vs Spinner — เลือกตัวไหน

### Skeleton (default — preferred)

ใช้เมื่อ:
- **รู้ shape ของ content** ที่กำลังจะโผล่ (post grid, card list, article body, form fields)
- **โหลด > 200ms** — page-level data fetch, image streaming, route transition
- ต้องการ **กัน CLS** — placeholder ต้องตรง dimension กับของจริง

### Spinner

ใช้เมื่อ:
- **ไม่รู้ shape** ของผลลัพธ์ (e.g., search box, autocomplete dropdown ที่อาจ 1 หรือ 20 results)
- **Inline / button action** — submit button, save button, refresh icon
- **Short async** ที่ skeleton overkill (< 500ms expected)
- **Overlay** บน element ที่มีอยู่แล้ว (e.g., disabled form ระหว่าง submit)

### ห้ามใช้

- ❌ Spinner สำหรับ **page-level** initial load → ใช้ Skeleton เสมอ
- ❌ Skeleton สำหรับ **button submit** → ใช้ Spinner ใน button
- ❌ Skeleton ที่ shape ไม่ตรงของจริง — เด้ง CLS ตอน content โผล่ = bad UX
- ❌ Spinner + Skeleton พร้อมกันใน scope เดียวกัน

---

## Critical invariants

### 1. Skeleton dimension ต้องตรงกับของจริง

```tsx
// ✓ ตรง aspect + height + spacing ของ PostCard จริง
<article aria-busy="true" aria-label="กำลังโหลดบทความ">
  <Skeleton className="aspect-[16/10] w-full rounded-md" />
  <div className="p-4 space-y-3">
    <Skeleton className="h-4 w-20 rounded-full" />     {/* tag chip */}
    <Skeleton className="h-6 w-full rounded" />         {/* title line 1 */}
    <Skeleton className="h-6 w-3/4 rounded" />         {/* title line 2 */}
    <Skeleton className="h-4 w-full rounded" />        {/* excerpt */}
    <Skeleton className="h-3 w-32 rounded" />          {/* meta */}
  </div>
</article>

// ✗ generic block — content โผล่ขนาดต่าง → CLS
<Skeleton className="h-64 w-full" />
```

**Test:** เปิด DevTools → Performance → record → load page. CLS score ต้อง < 0.1 (Core Web Vitals)

### 2. ทุก loading scope ต้องมี a11y attribute

| Element | Attribute | Why |
|---|---|---|
| Skeleton wrapper | `aria-busy="true"` | screen reader บอก user ว่า region กำลัง update |
| Skeleton wrapper | `aria-label="กำลังโหลด<content>"` | บอกว่าอะไรกำลังโหลด |
| `<Spinner>` | `role="status"` + `aria-label="Loading"` | built-in ใน shadcn spinner แล้ว — ไม่ต้องเพิ่ม |
| Toast region (success/error) | `aria-live="polite"` | built-in ใน sonner Toaster แล้ว |
| Live result region (after load) | `aria-live="polite"` | บอกผลลัพธ์เมื่อโหลดเสร็จ |

```tsx
// ✓ aria-busy ระหว่าง loading, ถอดออกเมื่อเสร็จ
<section aria-busy={isLoading} aria-label={isLoading ? 'กำลังโหลดบทความ' : undefined}>
  {isLoading ? <PostListSkeleton /> : <PostList posts={posts} />}
</section>
```

### 3. Reduced motion — skeleton pulse + spinner spin ต้องหยุด

`animate-pulse` (Tailwind) + `animate-spin` ต้องเคารพ `prefers-reduced-motion`. ใส่ใน `globals.css` (อยู่แล้วใน `motion.md` § Reduced motion):

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

> Spinner ที่หยุดหมุนยังคงเห็น (icon static) — OK สำหรับ a11y. ผู้ใช้ที่ ไวต่อ motion ไม่ต้องเห็นมันหมุน

### 4. Defer skeleton — กัน flash บน fast networks

ถ้า data โหลด < 200ms — แสดง skeleton แล้วหายทันทีดู janky. ใช้ "delayed loading" pattern:

```tsx
'use client';
import { useState, useEffect } from 'react';

export function useDeferredLoading(isLoading: boolean, delay = 200): boolean {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!isLoading) { setShow(false); return; }
    const t = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(t);
  }, [isLoading, delay]);
  return show;
}

// usage
const showSkeleton = useDeferredLoading(isLoading, 200);
return showSkeleton ? <PostListSkeleton /> : null;
```

**Default:** RSC Suspense + skeleton — Next handles timing. ใช้ pattern นี้เฉพาะ client-side fetch ที่อาจเร็วมาก

### 5. Minimum display time — กัน flash บน fast networks (advanced)

ถ้าโชว์ skeleton แล้วหายภายใน < 300ms รู้สึก jarring. options:
- เลือก skeleton **เฉพาะ** initial page load (RSC Suspense) — pattern นี้ Next handle ให้
- ถ้าเป็น client refetch — ใช้ optimistic UI แทน skeleton

> Don't fake-delay loading just to "feel real" — ผู้ใช้รู้สึกช้า

---

## Where to use each pattern

### Public site

| Surface | Loading state |
|---|---|
| Home, blog, works listing | RSC + `<Suspense fallback={<ListSkeleton />}>` + `loading.tsx` route fallback |
| Post / work detail | `loading.tsx` ที่ scope `[slug]` — skeleton ของ header + body + gallery |
| Image streaming (`next/image`) | `placeholder="blur"` ถ้ามี blurDataURL, ไม่งั้น aspect-ratio container กัน CLS |
| Filter / search (client) | `<Skeleton>` ใน result area + retain filter chips |
| Contact form submit | `<Button disabled aria-busy><Spinner /> กำลังส่ง</Button>` |
| Pagination "load more" | Button → `<Spinner />` ระหว่างโหลด |

### Admin

| Surface | Loading state |
|---|---|
| Post / work list table | `loading.tsx` route fallback + table row skeletons (`<tr>` × N) |
| Editor (CodeMirror) page initial | Skeleton header + skeleton field + skeleton editor box |
| MDX preview rendering | Spinner overlay บน preview pane ระหว่าง compile |
| Image upload progress | `<Progress>` bar (install ตอนใช้) + cancel button |
| Save / publish action | `<Button disabled><Spinner /> บันทึก</Button>` |
| Optimistic delete | row fade-out 0.2s ก่อน DB confirm; rollback ถ้า error |

---

## Inline Spinner patterns

### Submit button (most common)

```tsx
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';

<Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
  {isSubmitting ? (
    <>
      <Spinner className="size-4" />
      <span>กำลังส่ง</span>
    </>
  ) : (
    'ส่งข้อความ'
  )}
</Button>
```

**Required combo:**
- `disabled={isSubmitting}` — กัน double-submit
- `aria-busy={isSubmitting}` — screen reader feedback
- Visible label change ("ส่งข้อความ" → "กำลังส่ง") — ไม่ใช่แค่ spinner

### Icon refresh button

```tsx
<button onClick={handleRefresh} disabled={isRefreshing} aria-label="รีเฟรช">
  {isRefreshing ? <Spinner /> : <RefreshCw size={16} />}
</button>
```

### Inline data load (no submit)

```tsx
{isLoading ? (
  <div className="flex items-center gap-2 text-sm text-muted">
    <Spinner /> <span>กำลังโหลด...</span>
  </div>
) : (
  <Results data={data} />
)}
```

> ใช้เฉพาะกรณีไม่รู้ shape — ปกติเลือก skeleton

---

## Skeleton placement patterns

### Page-level (Next App Router)

ใช้ `loading.tsx` ที่ระดับ route segment — Next render อัตโนมัติระหว่าง RSC stream:

```
app/(public)/blog/
├── page.tsx
└── loading.tsx          ← Skeleton ของทั้ง /blog
```

### Suspense boundary (component-level)

แตก boundary เมื่อ data ส่วน A เร็ว, ส่วน B ช้า:

```tsx
<main>
  <Hero />                                          {/* static */}
  <Suspense fallback={<FeaturedSkeleton />}>
    <FeaturedWorks />                                {/* fast query */}
  </Suspense>
  <Suspense fallback={<PostListSkeleton />}>
    <LatestPosts />                                  {/* slower query */}
  </Suspense>
</main>
```

> ทุก `<Suspense>` boundary ต้องมี fallback — undefined fallback = ห้าม

### key prop — re-trigger skeleton on filter change

```tsx
<Suspense fallback={<PostListSkeleton />} key={tag ?? 'all'}>
  <PostList tag={tag} />
</Suspense>
```

เปลี่ยน tag → key เปลี่ยน → Suspense remount → skeleton re-show

---

## Anti-patterns — ห้ามทำ

- ❌ **"Loading..." text** เปล่า ๆ — ใช้ skeleton ที่บอก shape แทน. user รู้อยู่แล้วว่ามันโหลด
- ❌ **Blank screen** ระหว่างโหลด — CLS bomb + ดู broken
- ❌ **Spinner page-level** — ดูเหมือนแอป desktop ยุค 90; ใช้ skeleton
- ❌ **Skeleton ที่ shape ไม่ตรง** ของจริง — content โผล่แล้วเด้ง = bug CLS
- ❌ **Loading state ไม่มี a11y** — `aria-busy`, `role="status"` ต้องมี
- ❌ **Fake-delay** ("await sleep(500)") เพื่อให้ดูเหมือนทำงานหนัก — slow UX
- ❌ **Toast 'กำลังโหลด...'** — toast ใช้สำหรับ result (success/error) เท่านั้น
- ❌ **`window.alert()` / `confirm()`** ขณะรอ — ใช้ shadcn AlertDialog
- ❌ **Spinner + Skeleton พร้อมกัน** ใน scope เดียว — เลือกอย่างใดอย่างหนึ่ง
- ❌ **Disabled form ไม่มี visual feedback** — disabled อย่างเดียวไม่พอ ต้อง spinner + label

---

## Testing checklist

ก่อนปิด PR ที่มี loading state:

1. **Slow network** (DevTools → Network → "Slow 3G") — skeleton เห็นชัด, layout ไม่กระโดด
2. **Fast network** — ไม่มี skeleton flash จาก-หาย-เร็วเกิน (deferred loading ถ้าจำเป็น)
3. **CLS measurement** — Lighthouse Performance, CLS < 0.1
4. **Reduced motion** (DevTools → Rendering → Emulate `prefers-reduced-motion`) — pulse/spin หยุด, content ยังเห็น
5. **Screen reader** — `aria-busy` announce ว่ากำลังโหลด, content โผล่หลังโหลดเสร็จ
6. **Button submit** — กดแล้วเปลี่ยนเป็น loading ทันที, กดซ้ำไม่ได้, spinner + label visible

---

## When to install Progress

ถ้า task มี:
- File upload ที่ track byte progress
- Bulk operation ที่รู้จำนวน item ทั้งหมด
- Multi-step wizard ที่บอก step ปัจจุบัน

→ install: `npx shadcn@latest add progress`

ไม่ install ก่อนใช้ — ตาม `stack.md` § Component sourcing: install เมื่อต้องการ ไม่เก็บไว้เผื่อ
