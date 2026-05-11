import 'server-only';
import { promises as fs } from 'node:fs';
import path from 'node:path';

import { env } from '@/env';

/**
 * Pluggable image storage interface.
 * V1 default: LocalImageStore writes to `public/uploads/<key>`.
 * Swap to S3ImageStore / CDN-backed adapter without touching callers.
 */
export interface ImageStore {
  put(buf: Buffer, key: string): Promise<string>;
  delete(key: string): Promise<void>;
  deleteFolder(key: string): Promise<void>;
}

export class LocalImageStore implements ImageStore {
  constructor(private readonly rootDir: string = env.UPLOAD_DIR) {}

  async put(buf: Buffer, key: string): Promise<string> {
    assertSafeKey(key);
    const target = path.join(this.rootDir, key);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, buf);
    return toPublicPath(key);
  }

  async delete(key: string): Promise<void> {
    assertSafeKey(key);
    const target = path.join(this.rootDir, key);
    await fs.rm(target, { force: true });
  }

  /** Removes the folder for an upload uuid — used when deleting an image row. */
  async deleteFolder(key: string): Promise<void> {
    assertSafeKey(key);
    const target = path.join(this.rootDir, key);
    await fs.rm(target, { recursive: true, force: true });
  }
}

function assertSafeKey(key: string) {
  if (!key || key.includes('..') || path.isAbsolute(key)) {
    throw new Error('Invalid storage key');
  }
}

function toPublicPath(key: string): string {
  return `/${path.posix.join('uploads', key.split(path.sep).join('/'))}`;
}

export const imageStore: ImageStore = new LocalImageStore();
