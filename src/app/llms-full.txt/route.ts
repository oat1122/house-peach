import 'server-only';
import { desc, eq, inArray } from 'drizzle-orm';

import { db } from '@/lib/db';
import { posts, postTags } from '@/lib/db/schema/posts';
import { tags as tagsTable } from '@/lib/db/schema/tags';
import { users } from '@/lib/db/schema/users';
import { works, workTags } from '@/lib/db/schema/works';
import { env } from '@/env';
import { resolveBudgetLabel, resolveRoomTypeLabel } from '@/lib/utils/workLabels';
import { tiptapToText } from '@/lib/tiptap/text';

/**
 * llms-full.txt — companion to /llms.txt that ships the body text of every
 * published work + post so AI agents (Claude, ChatGPT, Cursor) can ingest the
 * full site content in a single fetch instead of crawling each detail page.
 *
 * Bodies are stored as Tiptap JSON; we flatten them to plain text via
 * `tiptapToText()` — that's what LLMs prefer over raw JSON or HTML.
 *
 * Cache invariant: /llms-full.txt is wired into bumpPostPaths/bumpWorkPaths
 * (lib/cache-tags.ts) so it stays in sync with publish/unpublish events.
 */
export const revalidate = 3600;

export async function GET() {
  const origin = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');

  const [workRows, postRows] = await Promise.all([
    db
      .select({
        id: works.id,
        slug: works.slug,
        title: works.title,
        summary: works.summary,
        body: works.body,
        roomType: works.roomType,
        style: works.style,
        yearCompleted: works.yearCompleted,
        location: works.location,
        areaSqm: works.areaSqm,
        budgetRange: works.budgetRange,
        durationDays: works.durationDays,
        clientName: works.clientName,
        publishedAt: works.publishedAt,
        updatedAt: works.updatedAt,
      })
      .from(works)
      .where(eq(works.status, 'published'))
      .orderBy(desc(works.publishedAt)),
    db
      .select({
        id: posts.id,
        slug: posts.slug,
        title: posts.title,
        excerpt: posts.excerpt,
        body: posts.body,
        readingTimeMin: posts.readingTimeMin,
        publishedAt: posts.publishedAt,
        updatedAt: posts.updatedAt,
        authorName: users.name,
      })
      .from(posts)
      .leftJoin(users, eq(users.id, posts.authorId))
      .where(eq(posts.status, 'published'))
      .orderBy(desc(posts.publishedAt)),
  ]);

  // Bulk-fetch tag names per entity to avoid N+1.
  const workIds = workRows.map((w) => w.id);
  const postIds = postRows.map((p) => p.id);

  const [workTagRows, postTagRows] = await Promise.all([
    workIds.length > 0
      ? db
          .select({ workId: workTags.workId, name: tagsTable.name })
          .from(workTags)
          .innerJoin(tagsTable, eq(tagsTable.id, workTags.tagId))
          .where(inArray(workTags.workId, workIds))
      : Promise.resolve<{ workId: number; name: string }[]>([]),
    postIds.length > 0
      ? db
          .select({ postId: postTags.postId, name: tagsTable.name })
          .from(postTags)
          .innerJoin(tagsTable, eq(tagsTable.id, postTags.tagId))
          .where(inArray(postTags.postId, postIds))
      : Promise.resolve<{ postId: number; name: string }[]>([]),
  ]);

  const tagsByWorkId = groupNames(workTagRows, 'workId');
  const tagsByPostId = groupNames(postTagRows, 'postId');

  const lines: string[] = [];

  // ── Header ───────────────────────────────────────────────────────────────────
  lines.push('# house-peach — full content');
  lines.push('');
  lines.push(
    '> Studio ตกแต่งบ้านสไตล์ warm-tone minimalist. ไฟล์นี้รวมเนื้อหา MDX ของทุก published portfolio work',
  );
  lines.push(
    '> และ blog post ในไฟล์เดียว สำหรับ AI agents โหลดทีเดียวจบ. ดัชนีที่กระชับกว่าอยู่ที่ /llms.txt',
  );
  lines.push('');
  lines.push(`- Site: ${origin}`);
  lines.push(`- Generated: ${new Date().toISOString()}`);
  lines.push(`- Works: ${workRows.length} · Posts: ${postRows.length}`);
  lines.push('');

  // ── Portfolio works ──────────────────────────────────────────────────────────
  if (workRows.length > 0) {
    lines.push('---');
    lines.push('');
    lines.push('# Portfolio works · ผลงาน');
    lines.push('');

    for (const w of workRows) {
      const url = `${origin}/works/${encodeURIComponent(w.slug)}`;
      const tagNames = tagsByWorkId.get(w.id) ?? [];
      const roomLabel = resolveRoomTypeLabel(w.roomType);
      const budgetLabel = resolveBudgetLabel(w.budgetRange);

      lines.push(`## ${w.title}`);
      lines.push('');
      lines.push(`- URL: ${url}`);
      lines.push(`- Room: ${roomLabel} · Style: ${w.style}`);
      if (w.yearCompleted) lines.push(`- Year completed: ${w.yearCompleted}`);
      if (w.location) lines.push(`- Location: ${w.location}`);
      if (w.areaSqm) lines.push(`- Area: ${w.areaSqm} sqm`);
      if (budgetLabel) lines.push(`- Budget: ${budgetLabel}`);
      if (w.durationDays) lines.push(`- Duration: ${w.durationDays} days`);
      if (w.clientName) lines.push(`- Client: ${w.clientName}`);
      if (tagNames.length > 0) lines.push(`- Tags: ${tagNames.join(', ')}`);
      if (w.publishedAt) lines.push(`- Published: ${w.publishedAt.toISOString().slice(0, 10)}`);
      lines.push('');
      lines.push(`**Summary:** ${w.summary}`);
      lines.push('');
      lines.push('### Body');
      lines.push('');
      lines.push(tiptapToText(w.body));
      lines.push('');
    }
  }

  // ── Blog posts ───────────────────────────────────────────────────────────────
  if (postRows.length > 0) {
    lines.push('---');
    lines.push('');
    lines.push('# Blog posts · บทความ');
    lines.push('');

    for (const p of postRows) {
      const url = `${origin}/blog/${encodeURIComponent(p.slug)}`;
      const tagNames = tagsByPostId.get(p.id) ?? [];

      lines.push(`## ${p.title}`);
      lines.push('');
      lines.push(`- URL: ${url}`);
      if (p.authorName) lines.push(`- Author: ${p.authorName}`);
      if (p.readingTimeMin) lines.push(`- Reading time: ${p.readingTimeMin} min`);
      if (tagNames.length > 0) lines.push(`- Tags: ${tagNames.join(', ')}`);
      if (p.publishedAt) lines.push(`- Published: ${p.publishedAt.toISOString().slice(0, 10)}`);
      lines.push('');
      lines.push(`**Excerpt:** ${p.excerpt}`);
      lines.push('');
      lines.push('### Body');
      lines.push('');
      lines.push(tiptapToText(p.body));
      lines.push('');
    }
  }

  return new Response(lines.join('\n'), {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}

/**
 * Group `{ <idKey>, name }` rows into `Map<id, names[]>`. Pulled out of both
 * call sites because the same shape is used for work + post tag joins.
 */
function groupNames<K extends string>(
  rows: Array<Record<K, number> & { name: string }>,
  idKey: K,
): Map<number, string[]> {
  const map = new Map<number, string[]>();
  for (const row of rows) {
    const id = row[idKey];
    const arr = map.get(id) ?? [];
    arr.push(row.name);
    map.set(id, arr);
  }
  return map;
}
