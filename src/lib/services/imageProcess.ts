import 'server-only';
import { randomUUID } from 'node:crypto';

import sharp from 'sharp';
import { fileTypeFromBuffer } from 'file-type';

import { imageStore } from './image';

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB

export const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

/**
 * Storage namespace for the unified media library. Both posts and works
 * pull from this single folder via `media_assets`.
 */
export const LIBRARY_PREFIX = 'library';

export type ImageVariants = {
  uuid: string;
  /** Public path (leading slash) of the 800-wide variant — the canonical entry point. */
  path: string;
  paths: {
    original: string;
    w800: string;
    w400: string;
  };
  width: number;
  height: number;
  mime: 'image/jpeg' | 'image/png' | 'image/webp';
  bytes: number;
};

export class UploadValidationError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'too_large'
      | 'unsupported_type'
      | 'corrupt'
      | 'empty',
  ) {
    super(message);
    this.name = 'UploadValidationError';
  }
}

/**
 * Validate buffer + resize to 3 webp variants + persist via ImageStore.
 *
 * Re-encoding through sharp protects against polyglot files (e.g. a GIF with
 * an embedded script payload): even if magic bytes claim image/jpeg, sharp's
 * decode-then-encode strips anything that isn't pixel data.
 */
export async function processAndStoreImage(
  buf: Buffer,
): Promise<ImageVariants> {
  if (buf.length === 0) {
    throw new UploadValidationError('Empty file', 'empty');
  }
  if (buf.length > MAX_UPLOAD_BYTES) {
    throw new UploadValidationError('File exceeds 5MB', 'too_large');
  }

  const bytes = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  const detected = await fileTypeFromBuffer(bytes);
  if (!detected || !ALLOWED_MIME.has(detected.mime)) {
    throw new UploadValidationError(
      `Unsupported mime: ${detected?.mime ?? 'unknown'}`,
      'unsupported_type',
    );
  }

  let meta: sharp.Metadata;
  try {
    meta = await sharp(buf, { failOn: 'error' }).rotate().metadata();
  } catch {
    throw new UploadValidationError('Corrupt image', 'corrupt');
  }
  if (!meta.width || !meta.height) {
    throw new UploadValidationError('Image has no dimensions', 'corrupt');
  }

  const uuid = randomUUID();
  const keyFor = (filename: string) => `${LIBRARY_PREFIX}/${uuid}/${filename}`;

  const [originalBuf, w800Buf, w400Buf] = await Promise.all([
    sharp(buf).rotate().webp({ quality: 90 }).toBuffer(),
    sharp(buf)
      .rotate()
      .resize({ width: 800, height: 800, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 86 })
      .toBuffer(),
    sharp(buf)
      .rotate()
      .resize({ width: 400, height: 400, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer(),
  ]);

  const [originalPath, w800Path, w400Path] = await Promise.all([
    imageStore.put(originalBuf, keyFor('original.webp')),
    imageStore.put(w800Buf, keyFor('800.webp')),
    imageStore.put(w400Buf, keyFor('400.webp')),
  ]);

  return {
    uuid,
    path: w800Path,
    paths: { original: originalPath, w800: w800Path, w400: w400Path },
    width: meta.width,
    height: meta.height,
    mime: detected.mime as ImageVariants['mime'],
    bytes: originalBuf.length,
  };
}

export async function deleteStoredImage(uuid: string): Promise<void> {
  if (!/^[0-9a-f-]{36}$/i.test(uuid)) {
    throw new Error('Invalid uuid');
  }
  await imageStore.deleteFolder(`${LIBRARY_PREFIX}/${uuid}`);
}
