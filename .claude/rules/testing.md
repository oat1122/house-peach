# Testing rules

หลัก: test ที่จำเป็น ไม่ over-test, focus invariants ที่ break ได้แล้วเสียหายแรง

## Test hierarchy

| Layer | Tool | Target coverage |
|---|---|---|
| Unit (zod, utils, slug, readingTime) | Vitest | 80% |
| Service (lib/services/*) | Vitest + testcontainers MariaDB | flows หลัก |
| Component | Vitest + Testing Library | smoke เฉพาะ component ที่มี logic |
| MDX render | Vitest + RSC compile | render เพื่อยืนยัน whitelist + plugin chain ทำงาน |
| E2E | Playwright | smoke 1 path/feature สำคัญ |

## What to test

### ต้อง test (ห้ามผ่อน)

1. **ทุก zod schema** ใน `src/lib/validation/*` — happy path + edge case (empty, oversize, malformed)
2. **ทุก function ใน `src/lib/services/*` ที่ทำ mutation** — โดยเฉพาะ post/work publish flow
3. **Auth guard** ของ admin server action — verify role check ทำงาน (admin/editor only)
4. **File upload** mime sniff + path traversal + size cap
5. **MDX render** — yake content ตัวอย่าง compile แล้ว verify:
   - whitelist component ถูก render
   - non-whitelist tag (e.g., `<script>`) ถูก strip / reject
   - rehype-slug ใส่ id ให้ heading
6. **Contact form submit** — zod validation + rate limit (mock IP) + insert row

### ไม่จำเป็น (ปล่อยได้)

- Pure presentational component (ที่ไม่มี logic, แค่ render props)
- shadcn UI primitives (test แล้วใน upstream)
- Style / layout (ใช้ visual regression แทนถ้าจำเป็น)

## File location

- Unit / service test: ติดข้างไฟล์ source — `post.ts` + `post.test.ts` ใน folder เดียวกัน
- E2E test: `tests/e2e/<feature>.spec.ts`
- Test fixture / mock data: `tests/fixtures/`
- MDX render test fixture: `tests/fixtures/mdx/*.mdx`

## Naming convention

```ts
describe('createPost', () => {
  it('inserts post + tags in single transaction', () => { /* ... */ });
  it('rejects insert when slug duplicate', () => { /* ... */ });
  it('rolls back if tag link fails', () => { /* ... */ });
  it('revalidates posts and post:<id> tags on publish', () => { /* ... */ });
});
```

ชื่อ describe = function / module ที่ test
ชื่อ it = behavior (verb เริ่มต้น) — ไม่ใช่ "should ..."

## Test database — ห้ามชน data จริง

- ใช้ **testcontainers** spawn MariaDB container ใหม่ต่อ test suite
- หรือ docker-compose service `mariadb-test` แยกจาก dev DB
- ห้ามใช้ DB เดียวกับ dev/prod — ลบหายแน่ๆ

```ts
// tests/setup.ts
beforeAll(async () => {
  container = await new MySqlContainer('mariadb:11').start();
  process.env.DATABASE_URL = container.getConnectionUri();
  await migrate(db, { migrationsFolder: './src/lib/db/migrations' });
});
```

## MDX render test pattern

```ts
import { compileMdxToReact } from '@/lib/mdx/compile';
import { renderToStaticMarkup } from 'react-dom/server';

describe('MDX compile', () => {
  it('renders whitelisted MDXImage component', async () => {
    const source = '<MDXImage src="/img.webp" alt="hero" />';
    const node = await compileMdxToReact(source);
    const html = renderToStaticMarkup(node);
    expect(html).toContain('<img');
    expect(html).toContain('alt="hero"');
  });

  it('strips script tags from MDX source', async () => {
    const source = '# Hello\n\n<script>alert(1)</script>';
    const node = await compileMdxToReact(source);
    const html = renderToStaticMarkup(node);
    expect(html).not.toContain('<script');
  });

  it('adds id to h2 via rehype-slug', async () => {
    const source = '## My Section';
    const node = await compileMdxToReact(source);
    const html = renderToStaticMarkup(node);
    expect(html).toMatch(/<h2[^>]*id="my-section"/);
  });
});
```

## Auth guard test pattern

```ts
import { vi } from 'vitest';
import * as authMod from '@/lib/auth';
import { deletePost } from '@/lib/services/post';

describe('deletePost authorization', () => {
  it('rejects unauthenticated requests', async () => {
    vi.spyOn(authMod, 'auth').mockResolvedValue(null);
    await expect(deletePost(1)).rejects.toThrow('Forbidden');
  });
  it('rejects customer role (if exists)', async () => {
    vi.spyOn(authMod, 'auth').mockResolvedValue({ user: { role: 'customer' } } as never);
    await expect(deletePost(1)).rejects.toThrow('Forbidden');
  });
  it('allows admin', async () => {
    vi.spyOn(authMod, 'auth').mockResolvedValue({ user: { role: 'admin' } } as never);
    // seed a post first, then verify deletePost succeeds
  });
});
```

## E2E smoke

อย่างน้อย 1 flow ต่อ feature สำคัญ:
- Public reader: เปิด `/` → คลิก featured post → อ่านจบ → คลิก related work → ดู gallery
- Contact form: ไปที่ `/contact` → กรอกฟอร์ม → submit → see thank-you page
- Admin: login → create draft post → upload cover image → publish → ดู post ที่ `/blog/[slug]`

ไม่ต้อง test ทุก variant — แค่ verify wiring ทำงาน

## CI gating

- PR ที่แตะ `lib/services/*` หรือ `lib/db/*` — รัน unit + integration ก่อน merge
- PR ที่แตะ `app/api/*` หรือ `middleware.ts` — รัน E2E auth flow
- PR ที่แตะ `lib/mdx/*` — รัน MDX compile tests
- ก่อนปิด phase: รัน full suite + Playwright

## What `qa-tester` agent does

`qa-tester` agent (ดู `.claude/agents/qa-tester.md`) จะ:
1. อ่าน diff ของ PR
2. เลือก test ที่ขาด ตาม guideline ข้างบน
3. เขียน test
4. รัน + verify ผ่าน
5. รายงาน gap ที่ตัดสินใจไม่ test (พร้อมเหตุผล)

ไม่ต้องเขียน test เองทุกครั้ง — เรียก agent ตอนใกล้ปิด feature
