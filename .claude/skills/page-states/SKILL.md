---
name: page-states
description: Templates for all the non-happy-path UI states in house-peach — loading (Suspense + Skeleton), empty (no posts / no works / no search results), error (form error, 404, 500), success (toast). Use this skill whenever a new page or feature is built, before considering it "done". Trigger on phrases like "loading state", "skeleton", "empty state", "error boundary", "404 page", "toast", "page is missing fallback", "what happens when there's no data".
---

# Page states — loading / empty / error / success

A page is not done until all 4 non-happy-path states are designed. This skill is the copy-paste-ready template set.

## When to use

- New page added — before marking it done
- Existing page bug report: "spinner forever" / "blank page" / "user confused" / "what happens when..."
- Reviewing a PR — check for missing fallback

## The 4 states

| State | When | UI pattern |
|---|---|---|
| **Loading** | data fetching, image streaming, route transition | Skeleton (preferred) or Spinner |
| **Empty** | data fetched, but length=0 (e.g., no posts in tag, no search results) | EmptyState component (icon + msg + CTA) |
| **Error** | fetch failed, form invalid, route not found | Error component (icon + msg + retry) |
| **Success** | mutation succeeded, action completed | Toast (sonner, auto-dismiss) |

Plus an implicit 5th: **Default** (happy path) — what you already wrote

---

## 1. Loading — Skeleton via Suspense

### RSC + Suspense pattern (preferred)

```tsx
// src/app/(public)/blog/page.tsx
import { Suspense } from 'react';
import { PostListSkeleton } from '@/components/public/PostListSkeleton';
import { PostList } from '@/components/public/PostList';

export default async function BlogPage({ searchParams }) {
  const { tag } = await searchParams;
  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-4xl font-serif mb-8">Journal · บทความ</h1>
      <Suspense fallback={<PostListSkeleton />} key={tag ?? 'all'}>
        <PostList tag={tag} />
      </Suspense>
    </main>
  );
}
```

> **Why `key`?** เปลี่ยน filter (เช่น tag) — `key` แตก = Suspense re-show skeleton. ถ้าไม่มี key, React จะถือว่า component เดิม + ไม่ remount

### loading.tsx (route-level fallback)

```tsx
// src/app/(public)/blog/loading.tsx
import { PostListSkeleton } from '@/components/public/PostListSkeleton';
export default function Loading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <div className="h-10 w-48 bg-bg2 animate-pulse rounded mb-8" />
      <PostListSkeleton />
    </main>
  );
}
```

### Skeleton component

```tsx
// src/components/public/PostListSkeleton.tsx
import { Skeleton } from '@/components/ui/skeleton';

export function PostListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <article key={i} aria-busy="true" aria-label="กำลังโหลดบทความ">
          <Skeleton className="aspect-[16/10] w-full rounded-md" />
          <div className="p-4 space-y-3">
            <Skeleton className="h-4 w-20 rounded-full" />          {/* tag chip */}
            <Skeleton className="h-6 w-full rounded" />              {/* title line 1 */}
            <Skeleton className="h-6 w-3/4 rounded" />               {/* title line 2 */}
            <Skeleton className="h-4 w-full rounded" />              {/* excerpt */}
            <Skeleton className="h-3 w-32 rounded" />                {/* meta */}
          </div>
        </article>
      ))}
    </div>
  );
}
```

Skeleton ต้องตรงกับ shape ของจริง — สูง ความกว้าง อัตราส่วน — ไม่งั้น CLS เด้งเวลา content โผล่

### Spinner (fallback ตอนที่ skeleton ไม่ make sense)

```tsx
import { Loader2 } from 'lucide-react';
<Loader2 className="animate-spin text-accent" aria-label="กำลังโหลด" />
```

ใช้สำหรับ inline action (submit button) เท่านั้น — ห้ามเป็น page-level fallback (ใช้ skeleton แทน)

---

## 2. Empty state

```tsx
// src/components/public/EmptyState.tsx
import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

type Props = {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div role="status" className="text-center py-16">
      <Icon size={48} className="text-muted mx-auto mb-4" aria-hidden />
      <h2 className="text-xl font-semibold text-ink">{title}</h2>
      {description && <p className="text-sm text-muted mt-2 max-w-md mx-auto">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
```

### Usage examples

```tsx
import { SearchX, FileText, Image } from 'lucide-react';
import Link from 'next/link';

// No posts in tag
<EmptyState
  icon={SearchX}
  title="ยังไม่มีบทความในหมวดนี้"
  description="ลองเปลี่ยนตัวกรอง หรือเริ่มอ่านจากบทความทั้งหมด"
  action={<Link href="/blog" className="text-accent underline underline-offset-4">ดูบทความทั้งหมด</Link>}
/>

// No works in admin
<EmptyState
  icon={FileText}
  title="ยังไม่มีผลงาน"
  description="เริ่มต้นโดยสร้างผลงานชิ้นแรก"
  action={<Link href="/admin/works/new" className="btn">เพิ่มผลงาน</Link>}
/>

// Search returned nothing
<EmptyState
  icon={SearchX}
  title={`ไม่พบผลลัพธ์สำหรับ "${query}"`}
  description="ลองค้นด้วยคำที่สั้นกว่า หรือเปลี่ยนหมวดหมู่"
/>
```

---

## 3. Error state — 3 sub-types

### 3a. Form error (inline)

```tsx
<input
  id="email"
  aria-invalid={!!errors.email}
  aria-describedby={errors.email ? 'email-error' : 'email-help'}
  className={errors.email ? 'border-danger' : 'border-line'}
/>
<p id="email-help" className="text-xs text-muted">เราจะใช้สำหรับติดต่อกลับเท่านั้น</p>
{errors.email && (
  <p id="email-error" role="alert" className="text-xs text-danger flex items-center gap-1">
    <AlertCircle size={14} aria-hidden /> {errors.email.message}
  </p>
)}
```

### 3b. Route-level error.tsx

```tsx
// src/app/(public)/blog/error.tsx
'use client';
import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <main className="mx-auto max-w-md text-center py-24 px-4">
      <AlertTriangle size={48} className="text-danger mx-auto mb-4" aria-hidden />
      <h1 className="text-2xl font-semibold">เกิดข้อผิดพลาด</h1>
      <p className="text-sm text-muted mt-2">ลองรีเฟรชหน้าใหม่ ถ้ายังเจอข้อผิดพลาด แจ้งทีมได้ที่ /contact</p>
      <button onClick={reset} className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-accent text-bg">
        ลองอีกครั้ง
      </button>
    </main>
  );
}
```

ห้ามแสดง `error.message` ดิบ ๆ ให้ผู้ใช้ — info disclosure. log server-side, แสดง generic message

### 3c. not-found.tsx (404)

```tsx
// src/app/(public)/not-found.tsx
import Link from 'next/link';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="mx-auto max-w-md text-center py-24 px-4">
      <FileQuestion size={48} className="text-muted mx-auto mb-4" aria-hidden />
      <h1 className="text-2xl font-semibold">ไม่พบหน้าที่ค้นหา</h1>
      <p className="text-sm text-muted mt-2">หน้านี้อาจถูกย้ายหรือถูกลบไปแล้ว</p>
      <Link href="/" className="inline-block mt-6 text-accent underline underline-offset-4">
        กลับหน้าแรก
      </Link>
    </main>
  );
}
```

ใน detail page (post/work) call `notFound()` จาก `next/navigation` เมื่อ `getBySlug` คืน null — Next จะ render `not-found.tsx` อัตโนมัติ

### 3d. global-error.tsx (last resort)

```tsx
// src/app/global-error.tsx — สำหรับเมื่อ root layout เอง error
'use client';
export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html><body>
      <h1>Something went wrong</h1>
      <button onClick={reset}>Try again</button>
    </body></html>
  );
}
```

---

## 4. Success — toast

ใช้ shadcn `sonner` (ติดตั้งผ่าน `npx shadcn add sonner`):

### Mount once at root

```tsx
// src/app/layout.tsx
import { Toaster } from '@/components/ui/sonner';
export default function RootLayout({ children }) {
  return (
    <html><body>
      {children}
      <Toaster richColors position="bottom-center" />
    </body></html>
  );
}
```

### Call from anywhere

```tsx
'use client';
import { toast } from 'sonner';

async function onSubmit(data) {
  const r = await createPost(data);
  if (r.ok) {
    toast.success('บันทึกบทความแล้ว');
    router.push(`/admin/posts/${r.id}/edit`);
  } else {
    toast.error('เกิดข้อผิดพลาด ลองอีกครั้ง');
  }
}
```

**Don'ts:**
- ห้าม toast สำหรับ form validation error — แสดง inline ใต้ field
- ห้าม toast สำคัญที่หายไปก่อน user เห็น (`duration: Infinity` + close button ถ้าจำเป็น)
- ห้ามใช้ toast bombarding (3 ตัวพร้อมกัน) — เลือกเฉพาะตัวสำคัญ

---

## Checklist — มี state ครบทุก page

ก่อนปิด PR ใหม่ ของหน้าที่มี data:

- [ ] **Loading**: Suspense + Skeleton (หรือ `loading.tsx`)
- [ ] **Empty**: EmptyState component when data length === 0
- [ ] **Error**: `error.tsx` ที่ scope ของ route
- [ ] **404**: `not-found.tsx` ที่ root ของ public (หนึ่งครั้งพอ)
- [ ] **Form error**: inline `aria-describedby` + `role="alert"`
- [ ] **Success**: toast หลัง mutation

ทุก state ใช้ theme tokens ครบ + a11y semantics (role status / alert / aria-busy / aria-hidden) ครบ

## Don'ts

- ห้ามใช้ generic "Loading..." text — ผู้ใช้รู้อยู่แล้ว ใช้ skeleton ที่บอกโครงข้างใน
- ห้ามแสดง raw error ของ DB / backend ให้ผู้ใช้เห็น — log + แสดง generic message
- ห้าม blank screen ระหว่างโหลด — ต้องมี skeleton หรือ spinner เสมอ (CLS guard)
- ห้ามใช้ alert/confirm dialog ของ browser (`window.confirm`) — ใช้ shadcn `<AlertDialog>` แทน
- ห้าม empty state ที่ไม่มี CTA — ถ้าไม่มีอะไรให้คลิก อย่างน้อยใส่ link กลับหน้าก่อน
