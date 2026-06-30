import 'dotenv/config';
import { eq, inArray } from 'drizzle-orm';

import { db, pool } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { tags } from '@/lib/db/schema/tags';
import { categories } from '@/lib/db/schema/categories';
import { mediaAssets } from '@/lib/db/schema/mediaAssets';
import { posts, postImages, postTags } from '@/lib/db/schema/posts';
import { works, workImages, workTags } from '@/lib/db/schema/works';
import { readingTime } from '@/lib/utils/readingTime';
import { tiptapToText, type TiptapNode } from '@/lib/tiptap/text';

// Minimal Tiptap (ProseMirror) doc builders so seed content stays readable.
const para = (text: string): TiptapNode => ({
  type: 'paragraph',
  content: [{ type: 'text', text }],
});
const h2 = (text: string): TiptapNode => ({
  type: 'heading',
  attrs: { level: 2 },
  content: [{ type: 'text', text }],
});
const doc = (...nodes: TiptapNode[]): string =>
  JSON.stringify({ type: 'doc', content: nodes });

type Tag = { slug: string; name: string; kind: 'post' | 'work' | 'both' };

const SEED_TAGS: Tag[] = [
  { slug: 'japandi', name: 'Japandi', kind: 'both' },
  { slug: 'minimalist', name: 'Minimalist', kind: 'both' },
  { slug: 'warm-tone', name: 'Warm tone', kind: 'both' },
  { slug: 'living-room', name: 'ห้องนั่งเล่น', kind: 'work' },
  { slug: 'bedroom', name: 'ห้องนอน', kind: 'work' },
  { slug: 'kitchen', name: 'ห้องครัว', kind: 'work' },
  { slug: 'how-to', name: 'How-to', kind: 'post' },
  { slug: 'inspiration', name: 'Inspiration', kind: 'post' },
];

type Category = {
  slug: string;
  name: string;
  kind: 'post' | 'work' | 'both';
  color: string;
  summary: string;
};

const SEED_CATEGORIES: Category[] = [
  {
    slug: 'inspiration',
    name: 'แรงบันดาลใจ',
    kind: 'both',
    color: '#b89b7a',
    summary: 'ไอเดียและแรงบันดาลใจในการแต่งบ้านโทนอบอุ่น',
  },
  {
    slug: 'how-to',
    name: 'ฮาวทู',
    kind: 'post',
    color: '#7a8bb0',
    summary: 'คู่มือและเทคนิคจัดบ้านทำเองได้ อธิบายเป็นขั้นตอน',
  },
  {
    slug: 'case-study',
    name: 'รีวิวงานจริง',
    kind: 'work',
    color: '#8fa088',
    summary: 'เจาะลึกเบื้องหลังโปรเจกต์จริง ตั้งแต่โจทย์จนถึงผลลัพธ์',
  },
];

const POSTS = [
  {
    slug: '5-tips-japandi-bedroom',
    categorySlug: 'how-to',
    title: '5 เทคนิคแต่งห้องนอนสไตล์ Japandi',
    excerpt:
      'รวมเทคนิคที่ใช้ได้จริงในการแต่งห้องนอนสไตล์ Japandi — เลือกวัสดุ ทอนสี และจัดแสงให้ผ่อนคลายแบบบ้านญี่ปุ่นผสมสแกนดิเนเวีย',
    body: doc(
      para(
        'Japandi คือการผสมผสานของความเรียบง่ายแบบสแกนดิเนเวียกับงานคราฟต์ของญี่ปุ่น',
      ),
      h2('1. เริ่มจากการเลือกโทนสีพื้นฐาน'),
      para('ใช้ palette ที่ warm + natural — ครีม, เบจอ่อน, สีไม้โอ๊ค'),
    ),
    tagSlugs: ['japandi', 'how-to', 'bedroom'],
    status: 'published' as const,
  },
  {
    slug: 'warm-minimalist-living-room',
    title: 'Warm Minimalist Living Room — จะอบอุ่นแต่ไม่รก ทำได้',
    excerpt:
      'minimalism ไม่ได้แปลว่าเย็นชา — เลือกพรม wool หนา ๆ, sofa สีเบจ, และไม้ทอนสี เพื่อให้ห้องดูเรียบแต่อบอุ่นรับลูกค้าได้',
    body: doc(
      para('ลูกค้าหลายคนคิดว่า minimalist = cold + sterile แต่ความจริงไม่ใช่'),
    ),
    tagSlugs: ['minimalist', 'warm-tone', 'inspiration', 'living-room'],
    status: 'published' as const,
  },
  {
    slug: 'choose-warm-paint-color',
    title: 'วิธีเลือกสีทาผนังโทนอุ่นที่ไม่ยาก',
    excerpt:
      'การเลือกสีทาผนังโทนอุ่นที่เข้ากับห้องในไทยมีรายละเอียดมากกว่าที่คิด — undertone, ทิศของแสง และพื้นที่จริง',
    body: doc(
      para('เลือกสีผนังจากบนตัวอย่างใน showroom ไม่เคยตรงกับห้องจริง'),
    ),
    tagSlugs: ['how-to', 'warm-tone'],
    status: 'published' as const,
  },
];

const WORKS = [
  {
    slug: 'minimal-japandi-bedroom-bkk',
    title: 'Japandi Bedroom — คอนโดย่านอารีย์',
    summary:
      'คอนโด 32 ตร.ม. รีโนเวทห้องนอนหลักให้เป็น sanctuary ส่วนตัวสไตล์ Japandi โทนอุ่น',
    body: doc(para('เริ่มจากห้องนอนเดิมที่ปูพื้นกระเบื้องลายหินเย็น ๆ')),
    roomType: 'bedroom' as const,
    style: 'japandi',
    yearCompleted: 2025,
    location: 'อารีย์, กรุงเทพฯ',
    areaSqm: '18.50',
    budgetRange: '300k_700k' as const,
    tone: '#f5d6c0',
    accent: '#a87856',
    tagSlugs: ['japandi', 'warm-tone', 'bedroom'],
    status: 'published' as const,
  },
  {
    slug: 'warm-living-room-thonglor',
    title: 'Warm Living Room — บ้านทาวน์โฮม ทองหล่อ',
    summary:
      'รีโนเวทห้องนั่งเล่นทาวน์โฮม 3 ชั้นให้เป็น warm minimalist สำหรับครอบครัวเล็ก',
    body: doc(para('เจ้าของบ้านเป็นคู่รักรุ่นใหม่ ทำงาน creative')),
    roomType: 'living' as const,
    style: 'minimalist',
    yearCompleted: 2025,
    location: 'ทองหล่อ, กรุงเทพฯ',
    areaSqm: '38.00',
    budgetRange: '700k_1.5m' as const,
    tone: '#faeee2',
    accent: '#c97c5e',
    tagSlugs: ['minimalist', 'warm-tone', 'living-room'],
    status: 'published' as const,
  },
  {
    slug: 'kitchen-makeover-chiangmai',
    title: 'Kitchen Makeover — บ้านเดี่ยว เชียงใหม่',
    summary:
      'รีโนเวทครัวขนาด 16 ตร.ม. ในเชียงใหม่ ให้รับแสงธรรมชาติเต็มที่',
    body: doc(para('บ้านเก่าอายุ 20 ปี ครัวเดิมมืดและคับแคบ')),
    roomType: 'kitchen' as const,
    style: 'modern-rustic',
    yearCompleted: 2024,
    location: 'แม่ริม, เชียงใหม่',
    areaSqm: '16.00',
    budgetRange: '300k_700k' as const,
    tone: '#ebe1d0',
    accent: '#7d8a73',
    tagSlugs: ['warm-tone', 'kitchen'],
    status: 'published' as const,
  },
];

async function ensureAdmin() {
  const [admin] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, 'admin'))
    .limit(1);
  if (!admin) {
    throw new Error(
      'ไม่มี admin ใน users table — รัน `npm run admin:create` ก่อน seed',
    );
  }
  return admin.id;
}

async function upsertTags() {
  for (const t of SEED_TAGS) {
    const [existing] = await db
      .select({ id: tags.id })
      .from(tags)
      .where(eq(tags.slug, t.slug))
      .limit(1);
    if (existing) {
      await db
        .update(tags)
        .set({ name: t.name, kind: t.kind })
        .where(eq(tags.id, existing.id));
    } else {
      await db.insert(tags).values(t);
    }
  }
  const rows = await db
    .select({ id: tags.id, slug: tags.slug })
    .from(tags)
    .where(
      inArray(
        tags.slug,
        SEED_TAGS.map((t) => t.slug),
      ),
    );
  return new Map(rows.map((r) => [r.slug, r.id]));
}

async function seedPosts(authorId: number, tagIdBySlug: Map<string, number>) {
  for (const p of POSTS) {
    const [existing] = await db
      .select({ id: posts.id })
      .from(posts)
      .where(eq(posts.slug, p.slug))
      .limit(1);
    if (existing) {
      console.log(`post "${p.slug}" exists, skipping`);
      continue;
    }
    await db.transaction(async (tx) => {
      const result = await tx.insert(posts).values({
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt,
        body: p.body,
        status: p.status,
        publishedAt: new Date(),
        authorId,
        readingTimeMin: readingTime(tiptapToText(p.body)),
      });
      const postId = (result as unknown as { insertId?: number }[])[0]?.insertId;
      if (!postId) throw new Error(`failed to insert post ${p.slug}`);

      const tagIds = p.tagSlugs
        .map((s) => tagIdBySlug.get(s))
        .filter((id): id is number => typeof id === 'number');
      if (tagIds.length > 0) {
        await tx.insert(postTags).values(
          tagIds.map((tagId) => ({ postId, tagId })),
        );
      }
    });
    console.log(`seeded post: ${p.slug}`);
  }
}

async function seedWorks(tagIdBySlug: Map<string, number>) {
  for (const w of WORKS) {
    const [existing] = await db
      .select({ id: works.id })
      .from(works)
      .where(eq(works.slug, w.slug))
      .limit(1);
    if (existing) {
      console.log(`work "${w.slug}" exists, skipping`);
      continue;
    }
    await db.transaction(async (tx) => {
      const result = await tx.insert(works).values({
        slug: w.slug,
        title: w.title,
        summary: w.summary,
        body: w.body,
        roomType: w.roomType,
        style: w.style,
        yearCompleted: w.yearCompleted,
        location: w.location,
        areaSqm: w.areaSqm,
        budgetRange: w.budgetRange,
        tone: w.tone,
        accent: w.accent,
        status: w.status,
        publishedAt: new Date(),
      });
      const workId = (result as unknown as { insertId?: number }[])[0]?.insertId;
      if (!workId) throw new Error(`failed to insert work ${w.slug}`);

      const tagIds = w.tagSlugs
        .map((s) => tagIdBySlug.get(s))
        .filter((id): id is number => typeof id === 'number');
      if (tagIds.length > 0) {
        await tx.insert(workTags).values(
          tagIds.map((tagId) => ({ workId, tagId })),
        );
      }
    });
    console.log(`seeded work: ${w.slug}`);
  }
}

async function main() {
  const authorId = await ensureAdmin();
  const tagIdBySlug = await upsertTags();
  console.log(`tags ready (${tagIdBySlug.size})`);
  await seedPosts(authorId, tagIdBySlug);
  await seedWorks(tagIdBySlug);

  // Quiet usage hints — silence unused imports until media seeding is added.
  void mediaAssets;
  void postImages;
  void workImages;

  console.log('seed done. note: media_assets is empty — อัปโหลดผ่าน /admin/media');
}

main()
  .then(async () => {
    await pool.end();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error(err);
    await pool.end().catch(() => {});
    process.exit(1);
  });
