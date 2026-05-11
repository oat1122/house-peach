---
name: image-upload-pipeline
description: How to implement and use the image upload pipeline in house-peach — multipart parsing, mime sniffing, sharp resizing into 3 webp variants (400/800/original), saving to public/uploads/{posts|works}/<uuid>/, recording in post_images or work_images, swappable ImageStore interface. Use this skill when implementing the upload route, the admin image uploader UX, or when changing how images are stored/served. Trigger on phrases like "image upload", "post cover", "work gallery", "upload route", "sharp resize", "image variants".
---

# Image upload pipeline

This skill is the procedure for safely uploading and storing post cover / work gallery images in house-peach. The pipeline is designed to be:

- **Safe** against polyglot files, oversize attacks, path traversal
- **Fast** to render (3 webp variants per image)
- **Swappable** to S3/R2 in V2 without changing callers

## When to use

- Building `POST /api/upload`
- Building the `<ImageUploader>` component in admin
- Adding additional image-bearing entities (e.g., author avatars, OG fallbacks)
- Migrating storage backend (V2)

## Architecture

```
Browser
   │ multipart/form-data POST
   ▼
/api/upload  ──── auth + role check
   │                                 (be-auth-api owns this)
   ▼
mime sniff (file-type)
   │  reject if not jpeg/png/webp
   │  reject if > 5MB
   ▼
sharp resize → 3 webp variants
   │  original.webp (q=90)
   │  800.webp      (longest edge 800)
   │  400.webp      (longest edge 400)
   ▼
imageStore.put(buf, key)
   │  LocalImageStore writes to public/uploads/{posts|works}/<uuid>/
   │  (V2: swap to S3ImageStore)
   ▼
db insert post_images OR work_images (based on entity field)
   │  path = '/uploads/{posts|works}/<uuid>/800.webp'
   ▼
return { id, path, original, w800, w400 }
```

## ImageStore interface

```ts
// src/lib/services/image.ts
import 'server-only';

export interface UploadedImage {
  original: string;       // public path or URL
  w800: string;
  w400: string;
}

export interface ImageStore {
  put(input: { buf: Buffer; uuid: string; entity: 'post' | 'work' }): Promise<UploadedImage>;
  delete(input: { uuid: string; entity: 'post' | 'work' }): Promise<void>;
}
```

## Local implementation (V1)

```ts
// src/lib/services/image-local.ts
import 'server-only';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import type { ImageStore, UploadedImage } from './image';

export class LocalImageStore implements ImageStore {
  constructor(private uploadDir: string) {}

  async put({ buf, uuid, entity }: { buf: Buffer; uuid: string; entity: 'post' | 'work' }): Promise<UploadedImage> {
    const folder = entity === 'post' ? 'posts' : 'works';
    const dir = path.join(this.uploadDir, folder, uuid);
    await mkdir(dir, { recursive: true });

    // Re-encode original as webp (defeats polyglot files)
    const original = sharp(buf).webp({ quality: 90 });
    const w800 = sharp(buf).resize({ width: 800, height: 800, fit: 'inside' }).webp({ quality: 80 });
    const w400 = sharp(buf).resize({ width: 400, height: 400, fit: 'inside' }).webp({ quality: 75 });

    const [oBuf, b800, b400] = await Promise.all([original.toBuffer(), w800.toBuffer(), w400.toBuffer()]);

    await Promise.all([
      writeFile(path.join(dir, 'original.webp'), oBuf),
      writeFile(path.join(dir, '800.webp'), b800),
      writeFile(path.join(dir, '400.webp'), b400),
    ]);

    return {
      original: `/uploads/${folder}/${uuid}/original.webp`,
      w800: `/uploads/${folder}/${uuid}/800.webp`,
      w400: `/uploads/${folder}/${uuid}/400.webp`,
    };
  }

  async delete({ uuid, entity }: { uuid: string; entity: 'post' | 'work' }) {
    const folder = entity === 'post' ? 'posts' : 'works';
    const dir = path.join(this.uploadDir, folder, uuid);
    await rm(dir, { recursive: true, force: true });
  }
}

export const imageStore: ImageStore = new LocalImageStore(env.UPLOAD_DIR);
```

## Route handler

```ts
// src/app/api/upload/route.ts
import { auth } from '@/lib/auth';
import { fileTypeFromBuffer } from 'file-type';
import { imageStore } from '@/lib/services/image';
import { db } from '@/lib/db';
import { postImages, workImages } from '@/lib/db/schema';
import { rateLimit } from '@/lib/rate-limit';

const ALLOW = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_SIZE = 5 * 1024 * 1024;     // 5MB

export async function POST(req: Request) {
  // Rate limit
  const rl = await rateLimit(req, { id: 'upload', limit: 10, windowMs: 5 * 60 * 1000 });
  if (!rl.ok) return new Response('Too many requests', { status: 429 });

  // Auth — admin or editor only
  const session = await auth();
  if (session?.user?.role !== 'admin' && session?.user?.role !== 'editor') {
    return new Response('Forbidden', { status: 403 });
  }

  const form = await req.formData();
  const files = form.getAll('file').filter((f): f is File => f instanceof File);
  const entity = form.get('entity');     // 'post' | 'work'
  const parentId = Number(form.get('parentId'));
  if (entity !== 'post' && entity !== 'work') {
    return Response.json({ error: 'entity must be post or work' }, { status: 400 });
  }
  if (!Number.isFinite(parentId)) {
    return Response.json({ error: 'parentId required' }, { status: 400 });
  }

  const out = [];
  for (const file of files) {
    if (file.size > MAX_SIZE) return Response.json({ error: `File too large: ${file.name}` }, { status: 413 });

    const buf = Buffer.from(await file.arrayBuffer());

    // Mime sniff (don't trust file.type)
    const sniffed = await fileTypeFromBuffer(buf);
    if (!sniffed || !ALLOW.has(sniffed.mime)) {
      return Response.json({ error: `Unsupported type: ${file.name}` }, { status: 415 });
    }

    const uuid = crypto.randomUUID();
    const stored = await imageStore.put({ buf, uuid, entity });

    // Persist row in the right table
    const table = entity === 'post' ? postImages : workImages;
    const idCol = entity === 'post' ? { postId: parentId } : { workId: parentId };
    const [{ id }] = await db.insert(table).values({
      ...idCol,
      path: stored.w800,
      alt: file.name.replace(/\.[^.]+$/, ''),
      sort: 0,
      isCover: false,
    }).$returningId();

    out.push({ id, ...stored });
  }

  return Response.json(out);
}
```

## Admin uploader UX

```tsx
'use client';
import { useState } from 'react';

type Props = {
  entity: 'post' | 'work';
  parentId: number;
  onUploaded: (imgs: UploadedImage[]) => void;
};

export function ImageUploader({ entity, parentId, onUploaded }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFiles(files: FileList) {
    setBusy(true); setError(null);
    const fd = new FormData();
    fd.set('entity', entity);
    fd.set('parentId', String(parentId));
    for (const f of Array.from(files)) fd.append('file', f);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    if (!res.ok) {
      setError((await res.json()).error ?? 'Upload failed');
    } else {
      onUploaded(await res.json());
    }
    setBusy(false);
  }

  return (
    <div>
      <label>
        <input type="file" multiple accept="image/jpeg,image/png,image/webp"
               onChange={e => e.target.files && onFiles(e.target.files)} />
      </label>
      {busy && <p>Uploading...</p>}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
```

For drag-drop UX, wrap with `react-dropzone` or build your own with `onDragOver` / `onDrop`.

## Rendering uploaded images

In storefront, use `next/image` with the path returned:

```tsx
<Image
  src={image.path}             // "/uploads/{posts|works}/<uuid>/800.webp"
  alt={image.alt}
  width={800}
  height={800}
  sizes="(min-width: 768px) 50vw, 100vw"
  priority={isLcp}
/>
```

`next/image` will further optimize / resize as needed.

## Deletion

When admin deletes an image:

```ts
export async function deletePostImage(imageId: number) {
  const [img] = await db.select().from(postImages).where(eq(postImages.id, imageId));
  if (!img) return { ok: false };

  // Extract uuid from path "/uploads/posts/<uuid>/800.webp"
  const m = img.path.match(/\/uploads\/posts\/([^/]+)\//);
  if (m) await imageStore.delete({ uuid: m[1], entity: 'post' });

  await db.delete(postImages).where(eq(postImages.id, imageId));
  revalidateTag(`post:${img.postId}`);
  return { ok: true };
}

// Similar for work images — same shape, different table + entity
```

## V2: swap to S3

Implement `S3ImageStore` with same interface:

```ts
import { S3Client, PutObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3';

export class S3ImageStore implements ImageStore {
  constructor(private s3: S3Client, private bucket: string, private cdnBase: string) {}
  async put({ buf, uuid, entity }) { /* ... PutObjectCommand for each variant, key prefix = entity ... */ }
  async delete({ uuid, entity }: { uuid: string; entity: 'post' | 'work' }) { /* ... DeleteObjectsCommand ... */ }
}

export const imageStore: ImageStore = new S3ImageStore(/* ... */);
```

Callers don't change.

## Don'ts

- Don't trust `file.type` — sniff bytes
- Don't use user-supplied filename in path
- Don't store the original without re-encoding
- Don't skip rate limit — upload endpoints are favorite targets
- Don't commit `public/uploads/` to git — gitignore it (keep `.gitkeep`)
- Don't resize on every render — variants are pre-generated

---

## Optional client-side crop (preprocessing)

For admin who wants to crop **before** upload — saves bandwidth on tall portrait sources, lets admin frame the image.

**Modules** (in `src/lib/imageCrop/` + `src/components/admin/media/`):

- `config.ts` — `CROP_PRESETS` map (square 1:1 / post 16:10 / work 3:2 / workHero 2:1 / free) + output mime/quality/size constraints
- `processing.ts` — pure math: `getCropBounds`, `clampCropState`, `getCenteredCropState`, `nextCropStateForZoom`, `createCroppedImageFile` (canvas draw + `toBlob('image/webp', 0.92)`)
- `ImageCropDialog.tsx` — portal-based modal with pointer-drag canvas + zoom slider 1×–4×. Takes `preset: CropPresetId` prop; resolves target width/height from `CROP_PRESETS` internally. Returns `File` (webp, ≤5MB).

**Integration pattern in `MediaUploadDialog`:**

1. Each row in upload queue has its own `preset: CropPresetId` (default `'post'`)
2. If preset is an aspect preset (not `'free'`): "ครอป" button opens `<ImageCropDialog>`
3. On confirm: dialog returns cropped `File` → store in `row.croppedFile` + create blob URL for thumbnail preview
4. On submit: send `row.croppedFile ?? row.file` to `/api/upload`
5. Server pipeline runs unchanged — sharp re-encodes whatever bytes arrive into 3 variants

**Blob URL lifecycle (must revoke to avoid memory leak):**

- when admin re-crops (replace `croppedPreviewUrl`)
- when admin removes the row from queue
- when admin changes preset (different aspect invalidates the crop)
- on `MediaUploadDialog` unmount

**GIF handling:** `MediaUploadDialog.addFiles` checks `file.type` against `CROPPABLE_IMAGE_MIME`. Non-matches (gif, avif, etc.) land with `status: 'rejected'` and don't go to the server — the allowlist there is jpeg/png/webp only.

**Why not server-side crop?** Cropping client-side means the admin sees exactly what they'll get + the bytes sent already match the desired aspect. Server-side crop would need round-trips for preview. Server still controls **variant resizing** (3 widths) regardless.
