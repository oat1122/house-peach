import { describe, expect, it } from 'vitest';

import {
  clampCropState,
  getCenteredCropState,
  getCropBounds,
  isCroppableImageType,
  nextCropStateForZoom,
} from './processing';

/**
 * Pure-math suite. `loadImageMetrics` and `createCroppedImageFile` rely on the
 * browser Image/canvas APIs and are exercised through the integration/E2E
 * flow instead.
 */
describe('getCropBounds', () => {
  it('uses full height when image is wider than target aspect (1:1, landscape source)', () => {
    // 2000×1500, target 1:1 — crop should be 1500×1500 at zoom 1
    const b = getCropBounds(2000, 1500, 1, 1080, 1080);
    expect(b.cropWidth).toBe(1500);
    expect(b.cropHeight).toBe(1500);
    expect(b.maxOffsetX).toBe(500);
    expect(b.maxOffsetY).toBe(0);
  });

  it('uses full width when image is taller than target aspect (1:1, portrait source)', () => {
    // 1500×2000, target 1:1 — crop should be 1500×1500
    const b = getCropBounds(1500, 2000, 1, 1080, 1080);
    expect(b.cropWidth).toBe(1500);
    expect(b.cropHeight).toBe(1500);
    expect(b.maxOffsetX).toBe(0);
    expect(b.maxOffsetY).toBe(500);
  });

  it('honors a non-square target aspect (16:10 post cover)', () => {
    // 2000×1500 source, target 16:10 — wide-source path → height-bound
    // baseCropWidth = 1500 * (16/10) = 2400 → capped by width
    // Actually: imageAspect = 2000/1500 = 1.33, targetAspect = 1.6
    // imageAspect < targetAspect → use width: baseCropWidth=2000, baseCropHeight=2000/1.6=1250
    const b = getCropBounds(2000, 1500, 1, 1600, 1000);
    expect(b.cropWidth).toBe(2000);
    expect(b.cropHeight).toBe(1250);
    expect(b.maxOffsetY).toBe(250);
    expect(b.maxOffsetX).toBe(0);
  });

  it('shrinks crop window proportionally at zoom 2', () => {
    const z1 = getCropBounds(2000, 1500, 1, 1080, 1080);
    const z2 = getCropBounds(2000, 1500, 2, 1080, 1080);
    expect(z2.cropWidth).toBeCloseTo(z1.cropWidth / 2);
    expect(z2.cropHeight).toBeCloseTo(z1.cropHeight / 2);
  });

  it('clamps zoom to the configured 1–4 range', () => {
    expect(getCropBounds(1000, 1000, 0.5, 1080, 1080).zoom).toBe(1);
    expect(getCropBounds(1000, 1000, 10, 1080, 1080).zoom).toBe(4);
  });
});

describe('clampCropState', () => {
  it('keeps offsets inside [0, maxOffset]', () => {
    const c = clampCropState(
      2000,
      1500,
      { zoom: 1, offsetX: -50, offsetY: 9999 },
      1080,
      1080,
    );
    expect(c.offsetX).toBe(0);
    expect(c.offsetY).toBe(0); // maxOffsetY = 0 for this aspect/source
  });

  it('clamps zoom when out of range', () => {
    const c = clampCropState(
      1000,
      1000,
      { zoom: 99, offsetX: 0, offsetY: 0 },
      1080,
      1080,
    );
    expect(c.zoom).toBe(4);
  });
});

describe('getCenteredCropState', () => {
  it('centers the crop window over the source', () => {
    const c = getCenteredCropState(2000, 1500, 1, 1080, 1080);
    expect(c.offsetX).toBe(250); // (2000-1500)/2
    expect(c.offsetY).toBe(0);
  });
});

describe('nextCropStateForZoom', () => {
  it('keeps the visual center fixed when zooming in', () => {
    // start centered at zoom 1
    const start = getCenteredCropState(2000, 1500, 1, 1080, 1080);
    const startBounds = getCropBounds(2000, 1500, 1, 1080, 1080);
    const startCenterX = start.offsetX + startBounds.cropWidth / 2;
    const startCenterY = start.offsetY + startBounds.cropHeight / 2;

    const next = nextCropStateForZoom(2000, 1500, start, 2, 1080, 1080);
    const nextBounds = getCropBounds(2000, 1500, 2, 1080, 1080);
    const nextCenterX = next.offsetX + nextBounds.cropWidth / 2;
    const nextCenterY = next.offsetY + nextBounds.cropHeight / 2;

    expect(nextCenterX).toBeCloseTo(startCenterX);
    expect(nextCenterY).toBeCloseTo(startCenterY);
    expect(next.zoom).toBe(2);
  });
});

describe('isCroppableImageType', () => {
  it.each([
    ['image/jpeg', true],
    ['image/png', true],
    ['image/webp', true],
    ['image/gif', false],
    ['image/avif', false],
    ['application/pdf', false],
    ['', false],
  ])('mime %s → %s', (mime, expected) => {
    const file = new File([new Uint8Array([0])], 'x', { type: mime });
    expect(isCroppableImageType(file)).toBe(expected);
  });
});
