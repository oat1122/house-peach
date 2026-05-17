'use client';

import Image from 'next/image';
import { ExternalLink, Eye, EyeOff, Info } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { readingTime } from '@/lib/utils/readingTime';
import type { ContentStatus } from '@/lib/validation/post';

type Props = {
  title: string;
  slug: string;
  excerpt: string;
  bodyMdx: string;
  coverPath: string | null;
  coverAlt: string | null;
  status: ContentStatus;
  tagNames: string[];
  authorName: string | null;
};

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '');

/**
 * Read-only preview of the metadata that will ship when this post is rendered
 * publicly. Mirrors `buildPostMetadata` (server-side) on the client so admins
 * can see — while still editing — exactly what search engines, OG cards, and
 * the JSON-LD Article block will receive.
 *
 * Everything updates live as the admin types in the Content tab; this panel
 * just consumes form values via the parent and renders.
 */
export function PostSeoPreview({
  title,
  slug,
  excerpt,
  bodyMdx,
  coverPath,
  coverAlt,
  status,
  tagNames,
  authorName,
}: Props) {
  const safeTitle = title.trim() || '(ยังไม่มีหัวข้อ)';
  const safeSlug = slug.trim() || '(ยังไม่มี slug)';
  const description = padDescription(excerpt);
  const canonical = slug
    ? `${SITE_URL}/blog/${encodeURIComponent(slug)}`
    : `${SITE_URL}/blog/${safeSlug}`;
  const ogImage = coverPath ? `${SITE_URL}${coverPath}` : null;
  const readMin = readingTime(bodyMdx);
  const robots = robotsFromStatus(status);
  const fullTitle = `${safeTitle} — house-peach`;

  const titleLen = safeTitle.length;
  const descLen = description.length;
  const titleHint = lengthHint(titleLen, 50, 60);
  const descHint = lengthHint(descLen, 80, 160);

  const jsonLd = buildArticleJsonLd({
    title: safeTitle,
    description,
    canonical,
    ogImage,
    authorName,
    tagNames,
  });

  return (
    <div className="space-y-5">
      <p className="flex items-start gap-2 rounded-md border border-border bg-bg2/40 px-3 py-2 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>
          metadata นี้สร้างอัตโนมัติจาก fields ใน tab “เนื้อหา” — แก้ที่ tab นั้น
          แล้วค่าจะอัปเดตที่นี่ทันที. ไม่มีการ override ต่อบทความ.
        </span>
      </p>

      <PreviewSection label="หัวข้อสำหรับ search">
        <p className="break-words text-base font-medium text-foreground">
          {fullTitle}
        </p>
        <Meter
          value={titleLen}
          ideal="50–60"
          tone={titleHint.tone}
          note={titleHint.label}
          unit="ตัวอักษร"
        />
      </PreviewSection>

      <PreviewSection label="คำอธิบาย (meta description)">
        <p className="break-words text-sm text-foreground">{description}</p>
        <Meter
          value={descLen}
          ideal="80–160"
          tone={descHint.tone}
          note={descHint.label}
          unit="ตัวอักษร"
        />
      </PreviewSection>

      <PreviewSection label="Canonical URL">
        <a
          href={canonical}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 break-all text-sm text-accent underline-offset-4 hover:underline"
        >
          {canonical}
          <ExternalLink className="size-3" aria-hidden />
        </a>
      </PreviewSection>

      <Separator />

      <PreviewSection label="การ index ของ search engine">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant={robots.index ? 'default' : 'secondary'}>
            {robots.index ? (
              <Eye aria-hidden />
            ) : (
              <EyeOff aria-hidden />
            )}
            {robots.label}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{robots.detail}</p>
      </PreviewSection>

      <PreviewSection label="รูปสำหรับ social share (OG image · 1200×630)">
        {ogImage && coverPath ? (
          <div className="relative aspect-[1200/630] w-full max-w-md overflow-hidden rounded-md border border-border bg-bg2">
            <Image
              src={coverPath}
              alt={coverAlt || safeTitle}
              fill
              className="object-cover"
              sizes="(min-width: 768px) 480px, 100vw"
            />
          </div>
        ) : (
          <p className="rounded-md border border-dashed border-border bg-bg2/40 px-3 py-4 text-center text-xs text-muted-foreground">
            ยังไม่ได้เลือกรูปหน้าปก — social card จะใช้ default OG image ของไซต์
          </p>
        )}
      </PreviewSection>

      <Separator />

      <PreviewSection label="แท็ก / ผู้เขียน">
        <div className="space-y-2 text-xs text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">ผู้เขียน:</span>{' '}
            {authorName ?? '—'}
          </p>
          <div className="flex flex-wrap items-baseline gap-1.5">
            <span className="font-medium text-foreground">แท็ก:</span>{' '}
            {tagNames.length > 0 ? (
              tagNames.map((name) => (
                <Badge key={name} variant="outline">
                  {name}
                </Badge>
              ))
            ) : (
              <span>—</span>
            )}
          </div>
          <p>
            <span className="font-medium text-foreground">เวลาอ่าน:</span>{' '}
            {readMin} นาที (คำนวณจาก body)
          </p>
        </div>
      </PreviewSection>

      <details className="rounded-md border border-border bg-bg2/40 px-3 py-2 text-xs">
        <summary className="cursor-pointer font-medium text-foreground">
          JSON-LD Article (preview)
        </summary>
        <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-all text-[11px] leading-relaxed text-muted-foreground">
          {JSON.stringify(jsonLd, null, 2)}
        </pre>
      </details>
    </div>
  );
}

function PreviewSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-1.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      {children}
    </section>
  );
}

function Meter({
  value,
  ideal,
  tone,
  note,
  unit,
}: {
  value: number;
  ideal: string;
  tone: 'ok' | 'warn' | 'danger';
  note: string;
  unit: string;
}) {
  // Map tone semantics onto shadcn Badge variants. There is no neutral "ok"
  // success colour in the variant set, so we use `default` (brand) for ok,
  // `secondary` for warn (muted), and `destructive` for danger.
  const variant: 'default' | 'secondary' | 'destructive' =
    tone === 'ok' ? 'default' : tone === 'warn' ? 'secondary' : 'destructive';
  return (
    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
      <Badge variant={variant}>{note}</Badge>
      <span>
        {value} {unit} — แนะนำ {ideal}
      </span>
    </div>
  );
}

function lengthHint(
  len: number,
  min: number,
  max: number,
): { tone: 'ok' | 'warn' | 'danger'; label: string } {
  if (len === 0) return { tone: 'danger', label: 'ว่าง' };
  if (len < min) return { tone: 'warn', label: 'สั้นไป' };
  if (len > max) return { tone: 'warn', label: 'ยาวไป — อาจถูกตัด' };
  return { tone: 'ok', label: 'ดี' };
}

function padDescription(excerpt: string): string {
  const trimmed = excerpt.trim();
  if (trimmed.length === 0) return '(ยังไม่มี excerpt — ใส่อย่างน้อย 80 ตัวอักษร)';
  if (trimmed.length >= 80) return trimmed;
  // Same padding string as buildPostMetadata so preview matches what ships.
  const padding = ' · บทความเกี่ยวกับการตกแต่งบ้านโดย house-peach';
  return (trimmed + padding).slice(0, 160);
}

function robotsFromStatus(status: ContentStatus): {
  index: boolean;
  label: string;
  detail: string;
} {
  if (status === 'published') {
    return {
      index: true,
      label: 'index, follow',
      detail: 'หน้าจะปรากฏใน search + sitemap',
    };
  }
  if (status === 'archived') {
    return {
      index: false,
      label: 'noindex, follow',
      detail: 'URL เก่ายังเปิดได้ แต่ไม่ถูก index — กันลิงก์ภายนอกที่ link มาที่นี่เสีย',
    };
  }
  return {
    index: false,
    label: 'noindex, nofollow',
    detail: 'draft — ไม่อยู่ใน sitemap, search engine มองไม่เห็น',
  };
}

function buildArticleJsonLd(params: {
  title: string;
  description: string;
  canonical: string;
  ogImage: string | null;
  authorName: string | null;
  tagNames: string[];
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: params.title,
    description: params.description,
    ...(params.ogImage ? { image: [params.ogImage] } : {}),
    mainEntityOfPage: { '@type': 'WebPage', '@id': params.canonical },
    ...(params.authorName
      ? { author: { '@type': 'Person', name: params.authorName } }
      : {}),
    publisher: {
      '@type': 'Organization',
      name: 'house-peach',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/og/logo.png` },
    },
    ...(params.tagNames.length > 0 ? { keywords: params.tagNames.join(', ') } : {}),
  };
}
