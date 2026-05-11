---
name: component-anatomy
description: Copy-paste-ready templates for the major UI building blocks in house-peach — Hero, PostCard, WorkCard, listing grid with filter, detail page, AppHeader (top nav + mobile bottom tab), Footer, contact form. Use this skill when building a new screen or refactoring an existing one to match the design language. Trigger on phrases like "build the home hero", "post card design", "work listing", "header layout", "contact form", "footer", "what does X component look like".
---

# Component anatomy — templates

Copy-paste templates for every major UI block. Each block follows the design language in `.claude/rules/uxui.md` and a11y baseline in `.claude/rules/accessibility.md`.

## When to use

- Building a new screen from scratch
- Existing component doesn't match the design language — use these as the reference
- Onboarding a new agent to the project

## Templates

### 1. Page hero (home)

```tsx
// src/components/public/Hero.tsx
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export function Hero() {
  return (
    <section className="relative">
      <div className="aspect-[16/9] md:aspect-[21/9] relative overflow-hidden">
        <Image
          src="/og/hero.jpg"
          alt="ห้องนั่งเล่นโทนพีชอบอุ่น"
          fill priority
          sizes="100vw"
          className="object-cover"
        />
      </div>
      <div className="mx-auto max-w-5xl px-4 pt-12 pb-16 md:pt-24 md:pb-32 text-center">
        <p className="text-xs uppercase tracking-widest text-muted">house-peach studio</p>
        <h1 className="mt-4 text-5xl md:text-7xl font-serif tracking-tight text-ink">
          บ้านที่อบอุ่นเหมือนกอด
        </h1>
        <p className="mt-6 text-lg text-muted max-w-xl mx-auto">
          studio ตกแต่งบ้านสไตล์ warm-tone minimalist — ออกแบบให้สงบ ใช้ชีวิตง่าย
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-md bg-accent text-bg font-medium focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            เริ่มโปรเจกต์ <ArrowRight size={18} />
          </Link>
          <Link href="/works" className="text-ink underline underline-offset-4">
            ดูผลงาน
          </Link>
        </div>
      </div>
    </section>
  );
}
```

### 2. PostCard (blog listing)

```tsx
// src/components/public/PostCard.tsx
import Image from 'next/image';
import Link from 'next/link';
import type { PostPublic } from '@/lib/validation/post';

export function PostCard({ post, priority = false }: { post: PostPublic; priority?: boolean }) {
  return (
    <article className="group">
      <Link href={`/blog/${post.slug}`} className="block focus-visible:ring-2 focus-visible:ring-accent rounded-md">
        <div className="aspect-[16/10] overflow-hidden rounded-md">
          {post.coverImage && (
            <Image
              src={post.coverImage.path}
              alt={post.coverImage.alt}
              width={800} height={500}
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              priority={priority}
              className="object-cover w-full h-full transition group-hover:scale-105"
            />
          )}
        </div>
        <div className="pt-4">
          {post.tags[0] && (
            <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-bg2 text-muted">
              {post.tags[0].name}
            </span>
          )}
          <h3 className="mt-2 text-xl font-semibold text-ink line-clamp-2 group-hover:text-accent transition">
            {post.title}
          </h3>
          <p className="mt-2 text-sm text-muted line-clamp-2">{post.excerpt}</p>
          <p className="mt-3 text-xs text-muted">
            {post.publishedAt?.toLocaleDateString('th-TH', { dateStyle: 'medium' })}
            {' · '}
            อ่าน {post.readingTimeMin} นาที
          </p>
        </div>
      </Link>
    </article>
  );
}
```

### 3. WorkCard (portfolio listing)

```tsx
// src/components/public/WorkCard.tsx
import Image from 'next/image';
import Link from 'next/link';
import type { WorkPublic } from '@/lib/validation/work';

const roomLabels = {
  living: 'ห้องนั่งเล่น', bedroom: 'ห้องนอน', kitchen: 'ครัว',
  bathroom: 'ห้องน้ำ', office: 'ห้องทำงาน', outdoor: 'พื้นที่กลางแจ้ง',
  full_house: 'ทั้งหลัง', other: 'อื่น ๆ',
} as const;

export function WorkCard({ work, priority = false }: { work: WorkPublic; priority?: boolean }) {
  return (
    <article className="group">
      <Link href={`/works/${work.slug}`} className="block focus-visible:ring-2 focus-visible:ring-accent rounded-md">
        <div className="aspect-[3/2] overflow-hidden rounded-md relative">
          {work.coverImage && (
            <Image
              src={work.coverImage.path}
              alt={work.coverImage.alt}
              width={900} height={600}
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              priority={priority}
              className="object-cover w-full h-full transition duration-500 group-hover:scale-105"
            />
          )}
          {/* Desktop hover overlay */}
          <div className="hidden md:flex absolute inset-0 bg-ink/0 group-hover:bg-ink/30 transition items-end p-4">
            <h3 className="text-bg font-serif text-2xl opacity-0 group-hover:opacity-100 transition">
              {work.title}
            </h3>
          </div>
        </div>
        {/* Mobile meta */}
        <div className="pt-3 md:hidden">
          <h3 className="text-lg font-semibold text-ink line-clamp-1">{work.title}</h3>
          <p className="text-xs text-muted mt-1">
            {roomLabels[work.roomType]} · {work.style}
            {work.location && ` · ${work.location}`}
          </p>
        </div>
      </Link>
    </article>
  );
}
```

### 4. Listing grid + filter bar

```tsx
// src/components/public/PostList.tsx (RSC)
import { listPublishedPosts } from '@/lib/services/post';
import { PostCard } from './PostCard';
import { EmptyState } from './EmptyState';
import { SearchX } from 'lucide-react';
import Link from 'next/link';

export async function PostList({ tag }: { tag?: string }) {
  const posts = await listPublishedPosts({ tagSlug: tag });
  if (!posts.length) {
    return (
      <EmptyState
        icon={SearchX}
        title="ยังไม่มีบทความในหมวดนี้"
        action={<Link href="/blog" className="text-accent underline">ดูบทความทั้งหมด</Link>}
      />
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
      {posts.map((p, i) => <PostCard key={p.id} post={p} priority={i < 3} />)}
    </div>
  );
}

// src/components/public/FilterBar.tsx ('use client')
'use client';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export function FilterBar({ tags }: { tags: { slug: string; name: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const active = params.get('tag');

  function setTag(slug: string | null) {
    const p = new URLSearchParams(params);
    if (slug) p.set('tag', slug); else p.delete('tag');
    router.push(`${pathname}?${p}`);
  }

  return (
    <nav aria-label="กรองตามหมวด" className="sticky top-0 z-10 -mx-4 px-4 py-3 bg-bg/80 backdrop-blur border-b border-line mb-8">
      <div className="flex gap-2 overflow-x-auto">
        <Chip active={!active} onClick={() => setTag(null)}>ทั้งหมด</Chip>
        {tags.map(t => (
          <Chip key={t.slug} active={active === t.slug} onClick={() => setTag(t.slug)}>{t.name}</Chip>
        ))}
      </div>
    </nav>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 px-3 py-1.5 rounded-full text-sm border transition focus-visible:ring-2 focus-visible:ring-accent ${
        active ? 'bg-ink text-bg border-ink' : 'bg-bg2 text-ink border-line hover:border-ink'
      }`}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}
```

### 5. Detail page (post)

```tsx
// src/app/(public)/blog/[slug]/page.tsx
import { compileMdxToReact } from '@/lib/mdx/compile';
import { getPostBySlug } from '@/lib/services/post';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export const revalidate = 60;

export default async function PostPage({ params }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();
  const mdx = await compileMdxToReact(post.bodyMdx);

  return (
    <main>
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mx-auto max-w-3xl px-4 pt-8 text-sm text-muted">
        <Link href="/" className="hover:text-ink">หน้าแรก</Link>
        <span className="mx-2">/</span>
        <Link href="/blog" className="hover:text-ink">Blog</Link>
        <span className="mx-2">/</span>
        <span className="text-ink line-clamp-1">{post.title}</span>
      </nav>

      <article className="mx-auto max-w-3xl px-4 py-8">
        {post.tags[0] && (
          <p className="text-xs uppercase tracking-widest text-muted">{post.tags[0].name}</p>
        )}
        <h1 className="mt-3 text-4xl md:text-5xl font-serif tracking-tight text-ink">{post.title}</h1>
        <p className="mt-4 text-sm text-muted">
          {post.publishedAt?.toLocaleDateString('th-TH', { dateStyle: 'long' })}
          {' · '}อ่าน {post.readingTimeMin} นาที
          {' · '}โดย {post.author.name}
        </p>

        {post.coverImage && (
          <div className="mt-8 aspect-[3/2] overflow-hidden rounded-xl">
            <Image
              src={post.coverImage.path}
              alt={post.coverImage.alt}
              width={1200} height={800}
              sizes="(max-width: 768px) 100vw, 768px"
              priority
              className="object-cover w-full h-full"
            />
          </div>
        )}

        <div className="prose prose-stone max-w-prose mt-12 mx-auto">
          {mdx}
        </div>
      </article>
    </main>
  );
}
```

### 6. AppHeader (top nav desktop + mobile menu)

```tsx
// src/components/public/AppHeader.tsx
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ThemeSwitcher } from './ThemeSwitcher';

const nav = [
  { href: '/works', label: 'Works · ผลงาน' },
  { href: '/blog', label: 'Journal · บทความ' },
  { href: '/about', label: 'About · เกี่ยวกับเรา' },
  { href: '/contact', label: 'Contact' },
];

export function AppHeader() {
  return (
    <header className="sticky top-0 z-20 bg-bg/80 backdrop-blur border-b border-line">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-serif text-xl">house-peach</Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm" aria-label="หลัก">
          {nav.map(n => <Link key={n.href} href={n.href} className="hover:text-accent transition">{n.label}</Link>)}
        </nav>

        <div className="hidden md:block"><ThemeSwitcher /></div>

        {/* Mobile menu */}
        <Sheet>
          <SheetTrigger asChild>
            <button className="md:hidden p-2.5 rounded-md hover:bg-bg2 focus-visible:ring-2 focus-visible:ring-accent" aria-label="เปิดเมนู">
              <Menu size={20} />
            </button>
          </SheetTrigger>
          <SheetContent side="right">
            <nav aria-label="หลัก" className="flex flex-col gap-4 mt-8">
              {nav.map(n => <Link key={n.href} href={n.href} className="text-lg">{n.label}</Link>)}
            </nav>
            <div className="mt-8"><ThemeSwitcher /></div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
```

### 7. Footer

```tsx
// src/components/public/Footer.tsx
import Link from 'next/link';
import { Instagram, Facebook, Music2 } from 'lucide-react';   // Music2 ≈ Pinterest

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-bg2 mt-24 py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-4 grid grid-cols-1 md:grid-cols-3 gap-12">
        <section>
          <p className="font-serif text-xl">house-peach</p>
          <p className="mt-3 text-sm text-muted max-w-sm">
            studio ตกแต่งบ้านสไตล์ warm-tone minimalist เน้น material ธรรมชาติและการใช้แสง
          </p>
        </section>
        <nav aria-label="footer" className="grid grid-cols-2 gap-6 text-sm">
          <ul className="space-y-2">
            <li><Link href="/works" className="hover:text-accent">Works</Link></li>
            <li><Link href="/blog" className="hover:text-accent">Journal</Link></li>
          </ul>
          <ul className="space-y-2">
            <li><Link href="/about" className="hover:text-accent">About</Link></li>
            <li><Link href="/contact" className="hover:text-accent">Contact</Link></li>
          </ul>
        </nav>
        <section>
          <p className="text-xs uppercase tracking-widest text-muted">Follow</p>
          <div className="mt-3 flex gap-4 text-muted">
            <a href="#" aria-label="Instagram" className="hover:text-accent"><Instagram size={20} /></a>
            <a href="#" aria-label="Facebook" className="hover:text-accent"><Facebook size={20} /></a>
            <a href="#" aria-label="Pinterest" className="hover:text-accent"><Music2 size={20} /></a>
          </div>
        </section>
      </div>
      <div className="mx-auto max-w-6xl px-4 mt-12 pt-6 border-t border-line text-xs text-muted flex flex-wrap justify-between gap-2">
        <span>© {year} house-peach</span>
        <div className="flex gap-4">
          <Link href="/privacy">นโยบายความเป็นส่วนตัว</Link>
          <Link href="/terms">เงื่อนไข</Link>
        </div>
      </div>
    </footer>
  );
}
```

### 8. Contact form

```tsx
// src/components/public/ContactForm.tsx
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ContactInquiry } from '@/lib/validation/contact';
import { submitContact } from '@/lib/actions/contact';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export function ContactForm() {
  const form = useForm<ContactInquiry>({
    resolver: zodResolver(ContactInquiry),
    defaultValues: { contactName: '', contactEmail: '', contactPhone: '',
                     serviceType: 'consultation', projectDescription: '' },
  });
  const isBusy = form.formState.isSubmitting;

  async function onSubmit(data: ContactInquiry) {
    const r = await submitContact(data);
    if (!r.ok) {
      toast.error('ส่งไม่สำเร็จ ลองใหม่อีกครั้ง');
      return;
    }
    toast.success('ส่งข้อความแล้ว เราจะติดต่อกลับภายใน 24 ชม.');
    form.reset();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-xl">
      <Field name="contactName" label="ชื่อ" form={form} required />
      <Field name="contactEmail" label="อีเมล" type="email" form={form} required
             help="เราจะใช้สำหรับติดต่อกลับเท่านั้น" />
      <Field name="contactPhone" label="เบอร์โทร (ไม่บังคับ)" form={form} />
      {/* serviceType select ... */}
      <Field name="projectDescription" label="เล่าเกี่ยวกับโปรเจกต์ของคุณ" type="textarea" form={form} required />

      <button
        type="submit"
        disabled={isBusy}
        className="inline-flex items-center gap-2 px-5 py-3 rounded-md bg-accent text-bg font-medium disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      >
        {isBusy && <Loader2 size={18} className="animate-spin" aria-hidden />}
        {isBusy ? 'กำลังส่ง...' : 'ส่งข้อความ'}
      </button>
    </form>
  );
}

function Field({ name, label, type = 'text', form, required, help }: any) {
  const error = form.formState.errors[name];
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-ink">
        {label}{required && <span className="text-accent ml-1" aria-hidden>*</span>}
      </label>
      {type === 'textarea' ? (
        <textarea
          id={name} rows={5}
          aria-required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : help ? `${name}-help` : undefined}
          className={`mt-2 w-full px-3 py-2 rounded-md border bg-card text-ink ${error ? 'border-danger' : 'border-line'} focus-visible:ring-2 focus-visible:ring-accent outline-none`}
          {...form.register(name)}
        />
      ) : (
        <input
          id={name} type={type}
          aria-required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : help ? `${name}-help` : undefined}
          className={`mt-2 w-full px-3 py-2 rounded-md border bg-card text-ink ${error ? 'border-danger' : 'border-line'} focus-visible:ring-2 focus-visible:ring-accent outline-none`}
          {...form.register(name)}
        />
      )}
      {help && !error && <p id={`${name}-help`} className="text-xs text-muted mt-1">{help}</p>}
      {error && <p id={`${name}-error`} role="alert" className="text-xs text-danger mt-1">{error.message as string}</p>}
    </div>
  );
}
```

---

## How to use these templates

1. Copy the relevant block
2. Adapt props/data shape to your service contract
3. Verify the design against `.claude/rules/uxui.md` (spacing, radius, color)
4. Run a11y self-check (`.claude/skills/a11y-review`)
5. Test on all 4 themes (peach/cream/sage/ink) + on mobile 390×844 + desktop 1280×800

## Don'ts

- Don't deviate from these templates "to be unique" — consistency = brand
- Don't add extra wrapping `<div>` — kills accessibility tree
- Don't replace shadcn primitives with hand-rolled — focus management + a11y lost
- Don't hardcode color — use tokens; test on all 4 themes
- Don't skip aspect ratio container on images — CLS hit
