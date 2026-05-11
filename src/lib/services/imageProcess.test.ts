import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import sharp from 'sharp';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

const TMP_ROOT = path.join(os.tmpdir(), 'house-peach-test-' + Date.now());

vi.mock('@/env', () => ({
  env: {
    DATABASE_URL: 'mysql://test',
    DB_POOL_SIZE: 1,
    AUTH_SECRET: 'x'.repeat(32),
    NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
    NODE_ENV: 'test',
    UPLOAD_DIR: TMP_ROOT,
  },
}));

const { processAndStoreImage, UploadValidationError, LIBRARY_PREFIX } =
  await import('./imageProcess');

async function makeJpeg(width: number, height: number) {
  return await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 240, g: 200, b: 170 },
    },
  })
    .jpeg({ quality: 90 })
    .toBuffer();
}

describe('processAndStoreImage', () => {
  beforeAll(async () => {
    await fs.mkdir(TMP_ROOT, { recursive: true });
  });
  afterAll(async () => {
    await fs.rm(TMP_ROOT, { recursive: true, force: true }).catch(() => undefined);
  });

  it('produces 3 webp variants under library/<uuid>/', async () => {
    const jpeg = await makeJpeg(1200, 900);
    const result = await processAndStoreImage(jpeg);

    expect(result.uuid).toMatch(/^[0-9a-f-]{36}$/i);
    expect(result.mime).toBe('image/jpeg');
    expect(result.width).toBe(1200);
    expect(result.height).toBe(900);
    expect(result.bytes).toBeGreaterThan(0);
    expect(result.paths.original).toBe(`/uploads/${LIBRARY_PREFIX}/${result.uuid}/original.webp`);
    expect(result.paths.w800).toBe(`/uploads/${LIBRARY_PREFIX}/${result.uuid}/800.webp`);
    expect(result.paths.w400).toBe(`/uploads/${LIBRARY_PREFIX}/${result.uuid}/400.webp`);

    for (const filename of ['original.webp', '800.webp', '400.webp']) {
      const onDisk = path.join(TMP_ROOT, LIBRARY_PREFIX, result.uuid, filename);
      const stat = await fs.stat(onDisk);
      expect(stat.size).toBeGreaterThan(0);
      const head = await fs.readFile(onDisk);
      expect(head.subarray(8, 12).toString('ascii')).toBe('WEBP');
    }
  });

  it('shrinks the 800 variant within 800px longest edge', async () => {
    const jpeg = await makeJpeg(1600, 1200);
    const result = await processAndStoreImage(jpeg);
    const meta = await sharp(
      path.join(TMP_ROOT, LIBRARY_PREFIX, result.uuid, '800.webp'),
    ).metadata();
    expect(meta.width).toBeLessThanOrEqual(800);
    expect(meta.height).toBeLessThanOrEqual(800);
  });

  it('rejects oversized buffers before decoding', async () => {
    const huge = Buffer.alloc(6 * 1024 * 1024, 0xff);
    await expect(processAndStoreImage(huge)).rejects.toMatchObject({
      name: 'UploadValidationError',
      code: 'too_large',
    });
  });

  it('rejects non-image bytes via magic-byte sniff', async () => {
    const txt = Buffer.from('this is not an image at all');
    await expect(processAndStoreImage(txt)).rejects.toMatchObject({
      name: 'UploadValidationError',
      code: 'unsupported_type',
    });
  });

  it('rejects empty buffers', async () => {
    await expect(processAndStoreImage(Buffer.alloc(0))).rejects.toMatchObject({
      code: 'empty',
    });
  });

  it('UploadValidationError is the class thrown', async () => {
    expect.assertions(1);
    try {
      await processAndStoreImage(Buffer.alloc(0));
    } catch (err) {
      expect(err).toBeInstanceOf(UploadValidationError);
    }
  });
});
