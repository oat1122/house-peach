# Security rules

หลักการสำหรับ auth, secrets, input handling, file upload, headers

## Authorization checks — defense in depth

ห้าม trust แค่ middleware. ทุก mutation ที่ admin/editor-only ต้องมี explicit check ใน server action / route handler:

```ts
'use server';
import { auth } from '@/lib/auth';

export async function deletePost(id: number) {
  const session = await auth();
  if (session?.user?.role !== 'admin' && session?.user?.role !== 'editor') {
    throw new Error('Forbidden');
  }
  // ... delete
}
```

เหตุผล: middleware กัน route แต่ server action ถูกเรียกตรงๆ ผ่าน RSC payload ได้ — ถ้าไม่ check
ใน action เอง คนรู้ endpoint จะ bypass ได้

## No public register

หาก register flow ไม่มีใน V1 — ห้าม implement `signUp` action / `/register` route โดยไม่ได้รับอนุญาต
admin ใหม่เพิ่มผ่าน script `scripts/create-admin.ts` เท่านั้น

## Never log secrets

ห้าม `console.log` ของ:
- `process.env.AUTH_SECRET`, `DATABASE_URL`, API keys ทุกตัว
- `session.user.password` (ถ้ามี — ปกติไม่ควรมี)
- Tokens, cookies

ก่อน log ให้ถาม: "ถ้า log นี้ไป production console / Sentry มีคนอื่นเห็นได้ไหม?"

ใช้ structured logging (`pino`) แทน `console.log` ในโค้ด production — กรอง field ที่ sensitive ออก
อัตโนมัติได้

## Password handling

- Hash ด้วย `bcryptjs` rounds ≥ 10 (เราใช้ 12) — ห้าม store plaintext ห้าม MD5/SHA-1
- ห้าม include password ใน schema ที่ส่งกลับ client — `users` select query ต้อง strip `passwordHash`
- Login flow: dummy bcrypt compare เมื่อ email ไม่เจอ — กัน timing-based user enumeration

## File upload (สำคัญ)

จุดอ่อนของ feature upload — verify ทุกชั้น:

1. **Mime sniffing — ห้าม trust `Content-Type` header**
   - ใช้ `file-type` package อ่าน magic bytes จริงจาก buffer
   - Allowlist: `image/jpeg`, `image/png`, `image/webp` เท่านั้น
2. **Size cap — ตรวจก่อนอ่าน body เต็ม**
   - `Content-Length` header + stream truncation ที่ 5MB
3. **Path traversal**
   - ห้ามใช้ filename จาก user เป็น path component
   - Generate ด้วย `crypto.randomUUID()` แล้ว save เป็น `<entity>/<uuid>/<size>.webp`
   - `<entity>` = `posts` หรือ `works` ระบุจาก request body field
4. **Re-encode ทุกไฟล์**
   - sharp อ่าน → encode ใหม่เป็น webp — กัน polyglot file (e.g., GIF89a + JS payload)
5. **Auth check**
   - admin/editor role เท่านั้น upload ได้

## SQL injection — gone via Drizzle

Drizzle parameterize อัตโนมัติ. ห้ามใช้:
- `sql.raw('SELECT * FROM users WHERE name = ' + name)` ❌
- ใช้ `sql\`SELECT * FROM users WHERE name = ${name}\`` ✓ (drizzle parameterize)

ถ้าเลี่ยง `sql.raw()` ไม่ได้ ต้องอธิบายใน comment + escape เอง — เหตุผลใน PR description

## XSS — RSC default safe + MDX sanitize

- React escape ค่า `{...}` อยู่แล้ว — ปลอดภัย
- ห้าม `dangerouslySetInnerHTML` ยกเว้น content ที่ trust 100% (e.g., JSON-LD ที่เรา serialize เอง)
- **MDX content ของ blog post** ต้อง:
  - compile ที่ build/ISR time (server) ผ่าน `next-mdx-remote/rsc` — ไม่ใช่ runtime client
  - whitelist component ใน `lib/mdx/components.tsx` — รับเฉพาะ `<MDXImage>`, `<Quote>`, `<Aside>`, `<Gallery>`, `<CodeBlock>` ที่เราเขียนเอง
  - ห้ามรับ `<script>`, `<iframe>` ฯลฯ จาก MDX — ถ้าเปิดให้ใส่ จะกลายเป็น XSS vector ทันที
  - rehype plugin chain (rehype-pretty-code, rehype-slug, rehype-autolink-headings) — strict mode

## CSRF — server actions รวม built-in

Next.js server actions มี CSRF protection สำหรับ origin check. ห้ามปิดด้วย `experimental.serverActions.allowedOrigins`
แบบ `*`.

ระวังเฉพาะ:
- Route handlers (`api/*`) ที่ accept POST จาก browser — ตรวจ `Origin` / `Referer` header เอง

## Cookies

- ทุก auth cookie: `httpOnly: true`, `secure: true` (production), `sameSite: 'lax'`
- ห้าม store JWT ใน `localStorage` — ใช้ httpOnly cookie เท่านั้น (NextAuth ทำให้แล้ว)
- Cookie ที่ไม่ sensitive (e.g., theme preference) ใส่ `sameSite: 'lax'`, `secure` ใน production

## CSP header

ตั้งใน `next.config.ts` headers():

```ts
'Content-Security-Policy':
  "default-src 'self'; " +
  "img-src 'self' data: blob:; " +
  "font-src 'self' fonts.gstatic.com; " +
  "style-src 'self' 'unsafe-inline' fonts.googleapis.com; " +
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +  // Next runtime ต้องการ
  "connect-src 'self'; " +
  "frame-ancestors 'none';"
```

`unsafe-eval` จำเป็นสำหรับ Next dev. ใน production server action ใช้ nonce-based ดีกว่า (Phase 9 hardening)

## Rate limiting

- `/api/*` ทุกตัวต้องมี rate limit — ใช้ in-memory (Map keyed by IP) ใน V1
- `/api/upload`: 10 req / 5 นาที / IP
- `/api/auth/*`: 20 req / 5 นาที / IP (กัน brute force)
- Server actions ที่เป็น write: 30 req / นาที / session
- Contact form (`createContactInquiry`): 5 req / 10 นาที / IP (กัน spam)

V2 (ตอนตัดสินใจ deploy serverless): swap เป็น `@upstash/ratelimit` + Redis — interface เดียวกัน

## Environment validation

ทุก env var ผ่าน zod schema ใน `src/env.ts` — runtime ที่ load env ตอน boot ถ้า var ขาดต้อง throw

```ts
export const env = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
}).parse(process.env);
```

## When unsure

ถ้าเขียน feature ที่ involve auth, file upload, MDX content, หรือ external input — เรียก `security-auditor`
agent มา review ก่อน merge. ดีกว่าเจอ vuln ใน production
