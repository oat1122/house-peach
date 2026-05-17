import 'server-only';
import { desc, eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import { posts } from '@/lib/db/schema/posts';
import { works } from '@/lib/db/schema/works';
import { env } from '@/env';
import { resolveRoomTypeLabel } from '@/lib/utils/workLabels';

/**
 * llms.txt — proposed standard (https://llmstxt.org/) for guiding LLM agents
 * to the most relevant pages on a site. Curated index, NOT a full dump.
 *
 * Cache strategy mirrors sitemap.ts: hourly safety-net revalidation plus
 * explicit `revalidatePath('/llms.txt')` from bumpPostPaths/bumpWorkPaths in
 * lib/cache-tags.ts so admins see freshly published content within one request.
 *
 * The full-content companion lives at /llms-full.txt — admins can paste either
 * URL into Claude / ChatGPT / Cursor to onboard the assistant in one shot.
 */
export const revalidate = 3600;

export async function GET() {
  const origin = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');

  const [workRows, postRows] = await Promise.all([
    db
      .select({
        slug: works.slug,
        title: works.title,
        summary: works.summary,
        roomType: works.roomType,
        style: works.style,
      })
      .from(works)
      .where(eq(works.status, 'published'))
      .orderBy(desc(works.publishedAt))
      .limit(200),
    db
      .select({
        slug: posts.slug,
        title: posts.title,
        excerpt: posts.excerpt,
      })
      .from(posts)
      .where(eq(posts.status, 'published'))
      .orderBy(desc(posts.publishedAt))
      .limit(500),
  ]);

  const lines: string[] = [];

  // ── Required header (H1 + blockquote summary, per spec) ──────────────────────
  lines.push('# house-peach');
  lines.push('');
  lines.push(
    '> Studio ตกแต่งบ้านสไตล์ warm-tone minimalist — โชว์ผลงาน (portfolio) และบทความเทคนิคตกแต่งบ้าน (blog).',
  );
  lines.push(
    '> Bilingual TH/EN, mobile-first, SEO-first, content-first. ไม่ใช่ e-commerce — ไม่มีตะกร้า / checkout / สมัครสมาชิก.',
  );
  lines.push('');
  lines.push(
    'Stack: Next.js 16 (App Router + RSC) · Tailwind v4 · shadcn/ui · Drizzle/MariaDB · NextAuth v5 · next-mdx-remote.',
  );
  lines.push('');

  // ── Top-level pages ──────────────────────────────────────────────────────────
  lines.push('## Pages');
  lines.push('');
  lines.push(`- [Home](${origin}/): หน้าแรก — hero + ผลงานเด่น + บทความล่าสุด`);
  lines.push(
    `- [Works · ผลงาน](${origin}/works): พอร์ตโฟลิโอผลงานตกแต่งบ้าน — กรองตามห้อง / สไตล์ / แท็ก`,
  );
  lines.push(
    `- [Blog · บทความ](${origin}/blog): บทความเทคนิค how-to + แรงบันดาลใจสำหรับการตกแต่งบ้าน`,
  );
  lines.push(`- [About · เกี่ยวกับเรา](${origin}/about): เรื่องราวสตูดิโอ + ทีมงาน + ปรัชญาการออกแบบ`);
  lines.push(`- [Contact · ติดต่อ](${origin}/contact): แบบฟอร์มสอบถามโปรเจกต์ + รายละเอียดการติดต่อ`);
  lines.push('');

  // ── Portfolio works ──────────────────────────────────────────────────────────
  if (workRows.length > 0) {
    lines.push('## Portfolio works · ผลงาน');
    lines.push('');
    for (const w of workRows) {
      const url = `${origin}/works/${encodeURIComponent(w.slug)}`;
      const meta = [resolveRoomTypeLabel(w.roomType), w.style].filter(Boolean).join(' · ');
      const summary = truncate(w.summary, 120);
      lines.push(`- [${w.title}](${url}): ${summary}${meta ? ` (${meta})` : ''}`);
    }
    lines.push('');
  }

  // ── Blog posts ───────────────────────────────────────────────────────────────
  if (postRows.length > 0) {
    lines.push('## Blog posts · บทความ');
    lines.push('');
    for (const p of postRows) {
      const url = `${origin}/blog/${encodeURIComponent(p.slug)}`;
      lines.push(`- [${p.title}](${url}): ${truncate(p.excerpt, 120)}`);
    }
    lines.push('');
  }

  // ── Optional ─────────────────────────────────────────────────────────────────
  lines.push('## Optional');
  lines.push('');
  lines.push(
    `- [llms-full.txt](${origin}/llms-full.txt): Full content dump — body MDX ของทุก post และ work รวมในไฟล์เดียว สำหรับ AI โหลดทีเดียวจบ`,
  );
  lines.push(`- [sitemap.xml](${origin}/sitemap.xml): รายการ URL ทั้งหมดที่ index ได้สำหรับ search engine`);
  lines.push(`- [robots.txt](${origin}/robots.txt): Crawler directives`);
  lines.push('');

  return new Response(lines.join('\n'), {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}

/** Trim a string to `max` characters, replacing overflow with ellipsis. */
function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1).trimEnd()}…`;
}
