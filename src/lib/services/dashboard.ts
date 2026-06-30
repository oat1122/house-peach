import 'server-only';
import { count, desc, eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import { mediaAssets } from '@/lib/db/schema/mediaAssets';
import { posts } from '@/lib/db/schema/posts';
import { works } from '@/lib/db/schema/works';
import {
  contentStatusValues,
  type ContentStatus,
} from '@/lib/db/schema/posts';
import { countInquiriesByStatus } from '@/lib/services/contact';

export type StatusCounts = Record<ContentStatus, number> & { total: number };

export type RecentItem = {
  id: number;
  kind: 'post' | 'work';
  title: string;
  slug: string;
  status: ContentStatus;
  updatedAt: Date;
  coverPath: string | null;
};

export type StatusBar = {
  status: ContentStatus;
  label: string;
  count: number;
  pct: number;
};

export type AdminDashboardStats = {
  posts: StatusCounts;
  works: StatusCounts;
  inquiries: Awaited<ReturnType<typeof countInquiriesByStatus>>;
  mediaCount: number;
  recent: RecentItem[];
  statusBars: StatusBar[];
};

export type AdminNavCounts = {
  draftPosts: number;
  draftWorks: number;
  newInquiries: number;
};

/** Cheap counts for the sidebar nav badges (draft drafts + new inquiries). */
export async function getAdminNavCounts(): Promise<AdminNavCounts> {
  const [draftPostRows, draftWorkRows, inquiries] = await Promise.all([
    db.select({ c: count() }).from(posts).where(eq(posts.status, 'draft')),
    db.select({ c: count() }).from(works).where(eq(works.status, 'draft')),
    countInquiriesByStatus(),
  ]);
  return {
    draftPosts: Number(draftPostRows[0]?.c ?? 0),
    draftWorks: Number(draftWorkRows[0]?.c ?? 0),
    newInquiries: inquiries.new,
  };
}

const STATUS_BAR_LABEL: Record<ContentStatus, string> = {
  published: 'เผยแพร่',
  draft: 'ฉบับร่าง',
  archived: 'เก็บเข้าคลัง',
};

const RECENT_LIMIT = 6;

function emptyCounts(): StatusCounts {
  return { draft: 0, published: 0, archived: 0, total: 0 };
}

function foldCounts(rows: { status: ContentStatus; c: number }[]): StatusCounts {
  const acc = emptyCounts();
  for (const r of rows) {
    const n = Number(r.c ?? 0);
    acc[r.status] = n;
    acc.total += n;
  }
  return acc;
}

/**
 * Single aggregate query set powering the admin dashboard. Counts posts/works
 * by status (GROUP BY), reuses `countInquiriesByStatus`, counts media assets,
 * and builds a merged recent-activity feed (posts + works by updatedAt — admin
 * needs drafts too, so this does NOT reuse the published-only `listRecentPosts`).
 */
export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const [
    postCountRows,
    workCountRows,
    inquiries,
    mediaCountRows,
    recentPosts,
    recentWorks,
  ] = await Promise.all([
    db
      .select({ status: posts.status, c: count() })
      .from(posts)
      .groupBy(posts.status),
    db
      .select({ status: works.status, c: count() })
      .from(works)
      .groupBy(works.status),
    countInquiriesByStatus(),
    db.select({ c: count() }).from(mediaAssets),
    db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        status: posts.status,
        updatedAt: posts.updatedAt,
        coverPath: mediaAssets.path,
      })
      .from(posts)
      .leftJoin(mediaAssets, eq(mediaAssets.id, posts.coverMediaAssetId))
      .orderBy(desc(posts.updatedAt))
      .limit(RECENT_LIMIT),
    db
      .select({
        id: works.id,
        title: works.title,
        slug: works.slug,
        status: works.status,
        updatedAt: works.updatedAt,
        coverPath: mediaAssets.path,
      })
      .from(works)
      .leftJoin(mediaAssets, eq(mediaAssets.id, works.coverMediaAssetId))
      .orderBy(desc(works.updatedAt))
      .limit(RECENT_LIMIT),
  ]);

  const postCounts = foldCounts(postCountRows);
  const workCounts = foldCounts(workCountRows);

  const recent: RecentItem[] = [
    ...recentPosts.map((r) => ({ ...r, kind: 'post' as const })),
    ...recentWorks.map((r) => ({ ...r, kind: 'work' as const })),
  ]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, RECENT_LIMIT);

  const contentTotal = postCounts.total + workCounts.total;
  const statusBars: StatusBar[] = contentStatusValues.map((status) => {
    const c = postCounts[status] + workCounts[status];
    return {
      status,
      label: STATUS_BAR_LABEL[status],
      count: c,
      pct: contentTotal > 0 ? Math.round((c / contentTotal) * 100) : 0,
    };
  });

  return {
    posts: postCounts,
    works: workCounts,
    inquiries,
    mediaCount: Number(mediaCountRows[0]?.c ?? 0),
    recent,
    statusBars,
  };
}
