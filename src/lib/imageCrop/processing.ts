/**
 * Pure image-crop math + canvas helpers. Ported from `E:\tiers-list/src/lib/image-processing.ts`.
 *
 * Changes from source:
 *   - removed default values for targetWidth/targetHeight — callers must
 *     supply an explicit preset (use-case dictates aspect)
 *   - mime allowlist + 5MB cap come from `./config`
 *   - quality moved to config as IMAGE_OUTPUT_QUALITY
 *
 * All functions here are framework-agnostic; the dialog component owns React state.
 */

import {
  CROPPABLE_IMAGE_MIME,
  IMAGE_CROP_MAX_ZOOM,
  IMAGE_CROP_MIN_ZOOM,
  IMAGE_OUTPUT_EXTENSION,
  IMAGE_OUTPUT_MIME,
  IMAGE_OUTPUT_QUALITY,
  IMAGE_UPLOAD_LIMIT_BYTES,
} from './config';

export interface LoadedImageMetrics {
  src: string;
  width: number;
  height: number;
}

export interface CropState {
  zoom: number;
  offsetX: number;
  offsetY: number;
}

function getImageBaseName(fileName: string) {
  return fileName.replace(/\.[^.]+$/, '') || 'cropped-image';
}

function createObjectUrl(file: File) {
  return URL.createObjectURL(file);
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('ไม่สามารถโหลดรูปภาพได้'));
    image.src = src;
  });
}

export function isCroppableImageType(file: File) {
  return (CROPPABLE_IMAGE_MIME as readonly string[]).includes(file.type);
}

/**
 * Compute the size of the source-image rectangle that the crop frame covers at
 * a given zoom level, plus the maximum offsets the frame can sit at.
 */
export function getCropBounds(
  width: number,
  height: number,
  zoom: number,
  targetWidth: number,
  targetHeight: number,
) {
  const clampedZoom = Math.min(
    IMAGE_CROP_MAX_ZOOM,
    Math.max(IMAGE_CROP_MIN_ZOOM, zoom),
  );
  const targetAspect = targetWidth / targetHeight;
  const imageAspect = width / height;
  const baseCropWidth =
    imageAspect > targetAspect ? height * targetAspect : width;
  const baseCropHeight =
    imageAspect > targetAspect ? height : width / targetAspect;
  const cropWidth = baseCropWidth / clampedZoom;
  const cropHeight = baseCropHeight / clampedZoom;

  return {
    zoom: clampedZoom,
    cropWidth,
    cropHeight,
    maxOffsetX: Math.max(width - cropWidth, 0),
    maxOffsetY: Math.max(height - cropHeight, 0),
  };
}

export function clampCropState(
  width: number,
  height: number,
  crop: CropState,
  targetWidth: number,
  targetHeight: number,
): CropState {
  const bounds = getCropBounds(width, height, crop.zoom, targetWidth, targetHeight);

  return {
    zoom: bounds.zoom,
    offsetX: Math.min(Math.max(crop.offsetX, 0), bounds.maxOffsetX),
    offsetY: Math.min(Math.max(crop.offsetY, 0), bounds.maxOffsetY),
  };
}

export function getCenteredCropState(
  width: number,
  height: number,
  zoom: number,
  targetWidth: number,
  targetHeight: number,
): CropState {
  const bounds = getCropBounds(width, height, zoom, targetWidth, targetHeight);

  return {
    zoom: bounds.zoom,
    offsetX: bounds.maxOffsetX / 2,
    offsetY: bounds.maxOffsetY / 2,
  };
}

export async function loadImageMetrics(
  file: File,
): Promise<LoadedImageMetrics> {
  const src = createObjectUrl(file);

  try {
    const image = await loadImage(src);

    return {
      src,
      width: image.naturalWidth,
      height: image.naturalHeight,
    };
  } catch (error) {
    URL.revokeObjectURL(src);
    throw error;
  }
}

/**
 * Adjust the crop offset so that the visual center of the frame stays fixed
 * as zoom changes — feels intuitive when the user pulls the zoom slider.
 */
export function nextCropStateForZoom(
  width: number,
  height: number,
  crop: CropState,
  nextZoom: number,
  targetWidth: number,
  targetHeight: number,
) {
  const currentBounds = getCropBounds(
    width,
    height,
    crop.zoom,
    targetWidth,
    targetHeight,
  );
  const nextBounds = getCropBounds(
    width,
    height,
    nextZoom,
    targetWidth,
    targetHeight,
  );
  const centerX = crop.offsetX + currentBounds.cropWidth / 2;
  const centerY = crop.offsetY + currentBounds.cropHeight / 2;

  return clampCropState(
    width,
    height,
    {
      zoom: nextBounds.zoom,
      offsetX: centerX - nextBounds.cropWidth / 2,
      offsetY: centerY - nextBounds.cropHeight / 2,
    },
    targetWidth,
    targetHeight,
  );
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('ไม่สามารถสร้างไฟล์รูปหลังครอปได้'));
          return;
        }
        resolve(blob);
      },
      type,
      quality,
    );
  });
}

function drawCroppedImage(
  image: HTMLImageElement,
  crop: CropState,
  targetWidth: number,
  targetHeight: number,
) {
  const normalizedCrop = clampCropState(
    image.naturalWidth,
    image.naturalHeight,
    crop,
    targetWidth,
    targetHeight,
  );
  const bounds = getCropBounds(
    image.naturalWidth,
    image.naturalHeight,
    normalizedCrop.zoom,
    targetWidth,
    targetHeight,
  );
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('ไม่สามารถเริ่มต้นพื้นที่ครอปภาพได้');
  }

  context.drawImage(
    image,
    normalizedCrop.offsetX,
    normalizedCrop.offsetY,
    bounds.cropWidth,
    bounds.cropHeight,
    0,
    0,
    targetWidth,
    targetHeight,
  );

  return canvas;
}

export async function createCroppedImageFile(params: {
  file: File;
  crop: CropState;
  targetWidth: number;
  targetHeight: number;
}) {
  const src = createObjectUrl(params.file);

  try {
    const image = await loadImage(src);
    const canvas = drawCroppedImage(
      image,
      params.crop,
      params.targetWidth,
      params.targetHeight,
    );
    const blob = await canvasToBlob(canvas, IMAGE_OUTPUT_MIME, IMAGE_OUTPUT_QUALITY);
    if (blob.size > IMAGE_UPLOAD_LIMIT_BYTES) {
      throw new Error('ไฟล์หลังครอปต้องไม่เกิน 5MB');
    }

    return new File(
      [blob],
      `${getImageBaseName(params.file.name)}.${IMAGE_OUTPUT_EXTENSION}`,
      { type: IMAGE_OUTPUT_MIME },
    );
  } finally {
    URL.revokeObjectURL(src);
  }
}
