/**
 * Client-side image crop config. Ported from `E:\tiers-list/src/lib/image-upload-config.ts`
 * with two changes:
 *   - removed square-only IMAGE_TARGET_SIZE / RECOMMENDED constants
 *   - added CROP_PRESETS keyed by use case
 *
 * Constraints (kept):
 *   - 5MB cap matches server MAX_UPLOAD_BYTES
 *   - webp 0.92 output matches server allowlist (`image/webp`)
 *   - jpeg/png/webp input matches server allowlist
 */

export const IMAGE_UPLOAD_LIMIT_BYTES = 5 * 1024 * 1024;
export const IMAGE_CROP_PREVIEW_SIZE = 320;
export const IMAGE_CROP_MIN_ZOOM = 1;
export const IMAGE_CROP_MAX_ZOOM = 4;
export const IMAGE_OUTPUT_MIME = 'image/webp';
export const IMAGE_OUTPUT_EXTENSION = 'webp';
export const IMAGE_OUTPUT_QUALITY = 0.92;

export const CROPPABLE_IMAGE_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;
export type CroppableMime = (typeof CROPPABLE_IMAGE_MIME)[number];

export type CropPresetConfig = {
  id: string;
  label: string;
  ratioLabel: string;
  /** null = no crop, upload original */
  width: number | null;
  height: number | null;
};

export const CROP_PRESETS = {
  square: {
    id: 'square',
    label: 'Square',
    ratioLabel: '1:1',
    width: 1080,
    height: 1080,
  },
  post: {
    id: 'post',
    label: 'Post cover',
    ratioLabel: '16:10',
    width: 1600,
    height: 1000,
  },
  work: {
    id: 'work',
    label: 'Work cover',
    ratioLabel: '3:2',
    width: 1500,
    height: 1000,
  },
  workHero: {
    id: 'workHero',
    label: 'Work hero',
    ratioLabel: '2:1',
    width: 2000,
    height: 1000,
  },
  free: {
    id: 'free',
    label: 'ไม่ครอป',
    ratioLabel: '—',
    width: null,
    height: null,
  },
} as const satisfies Record<string, CropPresetConfig>;

export type CropPresetId = keyof typeof CROP_PRESETS;

export function isCropAspectPreset(
  preset: CropPresetConfig,
): preset is CropPresetConfig & { width: number; height: number } {
  return preset.width !== null && preset.height !== null;
}
