import { NextResponse, type NextRequest } from 'next/server';

import { auth } from '@/lib/auth';
import { log } from '@/lib/log';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { createMediaAsset } from '@/lib/services/media';
import {
  MAX_UPLOAD_BYTES,
  UploadValidationError,
} from '@/lib/services/imageProcess';

export const runtime = 'nodejs';

const RATE_LIMIT = { limit: 20, windowMs: 5 * 60 * 1000 }; // 20 req / 5 min / IP

function jsonError(message: string, status: number) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

/**
 * POST /api/upload — single file upload to the media library.
 *
 * Body (multipart/form-data):
 *  - file: File (required, ≤ 5MB, jpeg/png/webp)
 *  - title: string (optional)
 *  - alt: string (optional)
 *
 * Returns { ok: true, asset } where `asset` is the inserted media_assets row.
 *
 * Linking to a post/work is a separate concern handled by post/work forms.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  const role = session?.user?.role;
  const uid = session?.user?.id ? Number(session.user.id) : null;
  if (!role || (role !== 'admin' && role !== 'editor')) {
    return jsonError('Forbidden', 403);
  }

  const ip = clientIp(req.headers);
  const rl = rateLimit(`upload:${ip}`, RATE_LIMIT.limit, RATE_LIMIT.windowMs);
  if (!rl.allowed) {
    return jsonError('Too many requests', 429);
  }

  const lenHeader = req.headers.get('content-length');
  if (lenHeader && Number(lenHeader) > MAX_UPLOAD_BYTES + 4096) {
    return jsonError('File too large', 413);
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return jsonError('Malformed multipart body', 400);
  }

  const file = formData.get('file');
  const title = String(formData.get('title') ?? '').trim().slice(0, 180);
  const alt = String(formData.get('alt') ?? '').trim().slice(0, 255);

  if (!(file instanceof File)) return jsonError('Missing file', 400);
  if (file.size > MAX_UPLOAD_BYTES) return jsonError('File too large', 413);

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const fallbackTitle =
      title || file.name.replace(/\.[^.]+$/, '').slice(0, 180);
    const asset = await createMediaAsset({
      buffer,
      title: fallbackTitle,
      alt,
      createdById: Number.isFinite(uid) ? uid : null,
    });
    return NextResponse.json({ ok: true, asset });
  } catch (err) {
    if (err instanceof UploadValidationError) {
      const status =
        err.code === 'too_large'
          ? 413
          : err.code === 'unsupported_type'
            ? 415
            : 400;
      return jsonError(err.message, status);
    }
    const e = err as Error & { code?: string; errno?: number };
    log.error(
      { message: e.message, code: e.code, errno: e.errno },
      'upload failed',
    );
    return jsonError('Upload failed', 500);
  }
}
