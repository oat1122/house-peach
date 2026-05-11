# Validation rules — shared zod (BE/FE)

หลักการสำหรับ validation layer — schema เดียวใช้ทั้ง frontend (RHF) และ backend (server actions / API)

## Where schemas live

ทุก zod schema อยู่ใน `src/lib/validation/` — แบ่งไฟล์ตาม domain

```
src/lib/validation/
├─ post.ts         # PostInsert, PostUpdate, PostSelect
├─ work.ts         # WorkInsert, WorkUpdate, WorkSelect
├─ tag.ts
├─ contact.ts      # ContactInquiry (lead form)
├─ image.ts        # ImageUploadInput
└─ common.ts       # shared brand types: Slug, HexColor, EmailLower
```

## Isomorphic constraint — สำคัญ

ไฟล์ใน `lib/validation/` **ห้าม import**:
- `'server-only'`
- `@/lib/db` หรือ schema files
- Node-only modules (`fs`, `crypto.randomUUID` ใน Node — ใช้ Web Crypto API ถ้าจำเป็น)

ต้องใช้งานได้ทั้งใน browser bundle (RHF) และ server (action). ถ้าจำเป็นต้อง verify อะไรที่ต้องใช้ DB
ให้แยกเป็น schema 2 ชุด: pre-validation (zod isomorphic) + business rule check (server-only)

## Naming convention

ใช้ suffix สื่อความหมาย:
- `PostInsert` — schema สำหรับสร้างใหม่ (ไม่มี id, timestamps)
- `ProductUpdate` — schema สำหรับแก้ (id required, อื่น optional)
- `ProductSelect` — shape ที่อ่านออกมา (มี id, timestamps)
- `ProductPublic` — shape ที่ส่งให้ client (กรอง field ที่ไม่ควรเห็น เช่น cost)

```ts
export const PostInsert = z.object({ /* ... */ });
export type PostInsert = z.infer<typeof PostInsert>;
```

`type` ชื่อเดียวกับ schema เพื่อ import ใช้ง่าย

## Brand types สำหรับ value ที่มี constraint

ใช้ `.brand<>()` สำหรับ value ที่ต้อง validate รูปแบบเฉพาะ — slug, hex color, email lowercased:

```ts
// src/lib/validation/common.ts
export const Slug = z.string().regex(/^[a-z0-9-]+$/).brand<'Slug'>();
export type Slug = z.infer<typeof Slug>;

export const HexColor = z.string().regex(/^#[0-9a-f]{6}$/i).brand<'HexColor'>();
export type HexColor = z.infer<typeof HexColor>;
```

เหตุผล: type system จะกัน mix ระหว่าง `string` ทั่วไป กับ `Slug` — ส่ง slug ที่ยัง validate ไม่ครบเข้า
function ที่ expect `Slug` จะ compile-time error

## Error messages — ภาษาไทย user-facing

Schema ที่ user เห็น error (form validation) ใส่ Thai message:

```ts
export const ContactInquiry = z.object({
  contactName: z.string().min(2, 'กรุณากรอกชื่ออย่างน้อย 2 ตัวอักษร'),
  contactEmail: z.string().email('รูปแบบอีเมลไม่ถูกต้อง'),
  projectDescription: z.string().min(20, 'อธิบายโปรเจกต์อย่างน้อย 20 ตัวอักษร').max(2000),
});
```

Schema ภายใน (ที่ user ไม่เห็น เช่น `ImageStorageKey`) ใส่ default message ภาษาอังกฤษพอ

## Use schema everywhere it's needed

### Frontend — React Hook Form

```ts
import { zodResolver } from '@hookform/resolvers/zod';
import { PostInsert } from '@/lib/validation/post';

const form = useForm<PostInsert>({
  resolver: zodResolver(PostInsert),
  defaultValues: { /* ... */ },
});
```

### Backend — Server Action

```ts
'use server';
import { PostInsert } from '@/lib/validation/post';

export async function createPost(input: unknown) {
  const data = PostInsert.parse(input);   // throws ZodError ถ้าผิด
  // ... drizzle insert
}
```

### Backend — Route Handler

```ts
export async function POST(req: Request) {
  const body = await req.json();
  const data = PostInsert.safeParse(body);
  if (!data.success) {
    return Response.json({ errors: data.error.flatten() }, { status: 400 });
  }
  // ... use data.data
}
```

## Coercion for query params / form data

URL search params และ FormData ทุกอย่างเป็น string — ใช้ `z.coerce.*` แทน `z.*`:

```ts
const ProductFilter = z.object({
  page: z.coerce.number().int().min(1).default(1),
  categoryId: z.coerce.number().int().positive().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
});
```

## ห้ามทำ

- ห้าม validate ทั้ง FE และ BE ด้วย schema คนละชุด — schema เดียว ใช้ทุกที่
- ห้าม trust input ที่ยังไม่ผ่าน schema — แม้จะมาจาก typed RHF (user แก้ DOM ส่งอะไรก็ได้)
- ห้าม `.parse()` แล้วไม่ catch ใน route handler — caller ต้อง handle ZodError ออกมาเป็น 400 response

## When schema gets too big

ถ้า schema ของ table หนึ่งเกิน ~80 บรรทัด → แตกเป็น sub-schema:

```ts
const ProductMeta = z.object({ /* tone, accent, status */ });
const ProductPricing = z.object({ /* basePrice */ });
const ProductVariants = z.array(/* ... */);

export const PostInsert = ProductMeta.merge(ProductPricing).extend({
  variants: ProductVariants,
});
```
