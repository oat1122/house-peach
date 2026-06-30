import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Pencil } from 'lucide-react';

import { StatusBadge } from '@/components/admin/StatusBadge';
import { requireRole } from '@/lib/auth-guard';
import { getMediaAssetById, listMediaAssetUsage } from '@/lib/services/media';
import type { ContentStatus } from '@/lib/validation/post';

export const dynamic = 'force-dynamic';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function MediaDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  await requireRole();
  const { id } = await props.params;
  const numId = Number(id);
  if (!Number.isFinite(numId) || numId <= 0) notFound();

  const [asset, usageRows] = await Promise.all([
    getMediaAssetById(numId),
    listMediaAssetUsage(numId),
  ]);
  if (!asset) notFound();

  const fmt = new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium' });
  const format = asset.mime.split('/')[1] ?? asset.mime;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-8">
      {/* Back link */}
      <Link
        href="/admin/media"
        className="inline-flex items-center gap-1.5 text-sm text-muted-brand transition-colors hover:text-ink"
      >
        <ArrowLeft size={16} aria-hidden />
        กลับไปที่คลังมีเดีย
      </Link>

      {/* Header row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h1 className="font-serif text-2xl leading-tight text-ink md:text-3xl">
            {asset.title || asset.alt || `media-${asset.id}`}
          </h1>
          <p className="truncate font-mono text-xs text-muted-brand">{asset.path}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/admin/media"
            className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-sm text-bg transition-opacity hover:opacity-90"
          >
            <Pencil size={14} aria-hidden />
            ครอป/แก้ไข
          </Link>
          {/* Delete is intentionally a non-destructive link — admin must use
              the media library to confirm deletion to avoid accidental loss. */}
          <Link
            href="/admin/media"
            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm text-danger transition-colors hover:bg-bg2"
          >
            ลบ
          </Link>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main column — full-size preview */}
        <div className="space-y-5">
          <div className="overflow-hidden rounded-2xl border border-line bg-brand-card">
            <div
              className="relative w-full"
              style={{
                aspectRatio:
                  asset.width > 0 && asset.height > 0
                    ? `${asset.width}/${asset.height}`
                    : '16/9',
              }}
            >
              <Image
                src={asset.path}
                alt={asset.alt || asset.title || `media-${asset.id}`}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          </div>

          {asset.alt && (
            <section className="rounded-2xl border border-line bg-brand-card p-4">
              <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-brand">
                Alt text
              </h2>
              <p className="text-sm text-ink">{asset.alt}</p>
            </section>
          )}
        </div>

        {/* Side column */}
        <aside className="sticky top-4 space-y-4">
          {/* File info */}
          <section className="rounded-2xl border border-line bg-brand-card p-4">
            <h2 className="mb-3 text-sm font-semibold text-muted-brand">ข้อมูลไฟล์</h2>
            <dl className="space-y-2.5 text-sm">
              <div className="flex items-start justify-between gap-2">
                <dt className="shrink-0 text-muted-brand">รูปแบบ</dt>
                <dd className="font-mono text-ink uppercase">{format}</dd>
              </div>
              <div className="flex items-start justify-between gap-2">
                <dt className="shrink-0 text-muted-brand">ขนาด</dt>
                <dd className="text-ink">{formatBytes(asset.bytes)}</dd>
              </div>
              <div className="flex items-start justify-between gap-2">
                <dt className="shrink-0 text-muted-brand">ความละเอียด</dt>
                <dd className="text-ink">
                  {asset.width} × {asset.height} px
                </dd>
              </div>
              <div className="flex items-start justify-between gap-2">
                <dt className="shrink-0 text-muted-brand">อัพโหลดเมื่อ</dt>
                <dd className="text-ink">{fmt.format(asset.createdAt)}</dd>
              </div>
            </dl>
          </section>

          {/* Usage list */}
          <section className="rounded-2xl border border-line bg-brand-card p-4">
            <h2 className="mb-3 text-sm font-semibold text-muted-brand">
              ถูกใช้ในเนื้อหา
              {usageRows.length > 0 && (
                <span className="ml-1.5 tabular-nums text-ink">({usageRows.length})</span>
              )}
            </h2>
            {usageRows.length === 0 ? (
              <p className="text-sm text-muted-brand">ยังไม่ถูกใช้งาน</p>
            ) : (
              <ul className="space-y-2">
                {usageRows.map((item) => {
                  const href =
                    item.kind === 'post'
                      ? `/admin/posts/${item.id}`
                      : `/admin/works/${item.id}`;
                  return (
                    <li key={`${item.kind}:${item.id}`}>
                      <Link
                        href={href}
                        className="flex items-start gap-2.5 rounded-lg p-2 transition-colors hover:bg-bg2"
                      >
                        {/* Thumbnail using the asset itself as a visual anchor */}
                        <div className="relative size-10 shrink-0 overflow-hidden rounded-md border border-line">
                          <Image
                            src={asset.path}
                            alt=""
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-ink">
                            {item.title}
                          </p>
                          <div className="mt-0.5 flex items-center gap-1.5">
                            <span className="rounded-full bg-bg2 px-2 py-0.5 text-[10px] text-muted-brand">
                              {item.kind === 'post' ? 'บทความ' : 'ผลงาน'}
                            </span>
                            <StatusBadge
                              status={item.status as ContentStatus}
                              className="text-[10px]"
                            />
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
