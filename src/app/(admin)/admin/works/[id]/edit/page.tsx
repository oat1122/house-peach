import { notFound } from 'next/navigation';

import { requireRole } from '@/lib/auth-guard';
import { WorkForm } from '@/components/admin/works/WorkForm';
import {
  WorkGalleryEditor,
  type GalleryRow,
} from '@/components/admin/works/WorkGalleryEditor';
import type {
  PickerAsset,
  PickerPair,
} from '@/components/admin/media/MediaPicker';
import { listMediaAssets, listMediaPairs } from '@/lib/services/media';
import { listWorkImages } from '@/lib/services/workImage';
import { getWorkById, listWorkTagOptions } from '@/lib/services/work';
import type { WorkInsert } from '@/lib/validation/work';

export const dynamic = 'force-dynamic';

export default async function EditWorkPage(props: {
  params: Promise<{ id: string }>;
}) {
  await requireRole();
  const { id } = await props.params;
  const numId = Number(id);
  if (!Number.isFinite(numId) || numId <= 0) notFound();

  const [work, tagOptions, galleryRowsRaw, libraryAssetsRaw, libraryPairsRaw] =
    await Promise.all([
      getWorkById(numId),
      listWorkTagOptions(),
      listWorkImages(numId),
      listMediaAssets({ limit: 500 }),
      listMediaPairs(500),
    ]);
  if (!work) notFound();

  // Map DB row → WorkInsert-shaped defaults. `areaSqm` is varchar in DB
  // (decimal string) — coerce to number for the form input.
  const defaultValues: Partial<WorkInsert> & { id: number } = {
    id: work.id,
    title: work.title,
    slug: work.slug as WorkInsert['slug'],
    summary: work.summary,
    bodyMdx: work.bodyMdx,
    roomType: work.roomType,
    style: work.style,
    yearCompleted: work.yearCompleted ?? null,
    location: work.location ?? null,
    areaSqm: work.areaSqm != null ? Number(work.areaSqm) : null,
    budgetRange: work.budgetRange ?? null,
    coverMediaAssetId: work.coverMediaAssetId ?? null,
    tone: work.tone as WorkInsert['tone'],
    accent: work.accent as WorkInsert['accent'],
    tagIds: work.tagIds,
    status: work.status,
    publishedAt: work.publishedAt ?? null,
    // v2.2 editorial fields — DB → form. `materials` is normalised to an
    // array by normalizeWorkRow() in the service layer (MariaDB returns
    // JSON columns as strings; Drizzle's $type<>() is compile-time only).
    durationDays: work.durationDays ?? null,
    clientQuote: work.clientQuote ?? null,
    clientName: work.clientName ?? null,
    designerNote: work.designerNote ?? null,
    // Cast: WorkRow.materials uses plain string for colorHex, but WorkInsert
    // uses the HexColor brand. Same pattern as tone/accent above.
    materials: (work.materials ?? null) as WorkInsert['materials'],
  };

  const galleryRows: GalleryRow[] = galleryRowsRaw.map((r) => ({
    mediaAssetId: r.mediaAssetId,
    kind: r.kind,
    pairId: r.pairId,
    caption: r.caption,
    sort: r.sort,
    isCover: r.isCover,
    isFeatured: r.isFeatured,
    asset: {
      path: r.asset.path,
      alt: r.asset.alt,
      title: r.asset.title,
      width: r.asset.width,
      height: r.asset.height,
    },
  }));

  const libraryAssets: PickerAsset[] = libraryAssetsRaw.map((row) => ({
    id: row.asset.id,
    title: row.asset.title,
    alt: row.asset.alt,
    path: row.asset.path,
    width: row.asset.width,
    height: row.asset.height,
  }));

  const libraryPairs: PickerPair[] = libraryPairsRaw.map((p) => ({
    id: p.id,
    label: p.label,
    before: { id: p.before.id, path: p.before.path, alt: p.before.alt },
    after: { id: p.after.id, path: p.after.path, alt: p.after.alt },
  }));

  return (
    <WorkForm
      mode="edit"
      defaultValues={defaultValues}
      tagOptions={tagOptions}
      slotRight={
        <WorkGalleryEditor
          workId={work.id}
          initialRows={galleryRows}
          libraryAssets={libraryAssets}
          libraryPairs={libraryPairs}
        />
      }
    />
  );
}
