'use client';

/**
 * Ported from `E:\tiers-list/src/components/common/image-crop-dialog.tsx`.
 *
 * Changes from source:
 *   - takes `preset: CropPresetId` instead of raw targetWidth/Height; the
 *     preset is resolved against CROP_PRESETS inside.
 *   - shadcn neutral tokens (bg-card, text-muted-foreground, …) used as-is
 *     since `shadcn init` registered them on globals.css.
 *   - SquareCropState renamed to CropState (matches processing.ts).
 *   - When preset has no width/height ("free"), the dialog short-circuits to
 *     null — the caller is expected to skip mounting it in that case.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Crop, Loader2, ZoomIn, ZoomOut } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  CROP_PRESETS,
  IMAGE_CROP_MAX_ZOOM,
  IMAGE_CROP_MIN_ZOOM,
  IMAGE_CROP_PREVIEW_SIZE,
  isCropAspectPreset,
  type CropPresetId,
} from '@/lib/imageCrop/config';
import {
  clampCropState,
  createCroppedImageFile,
  getCenteredCropState,
  getCropBounds,
  loadImageMetrics,
  nextCropStateForZoom,
  type CropState,
  type LoadedImageMetrics,
} from '@/lib/imageCrop/processing';

const KEY_NUDGE_STEP = 10;
const KEY_NUDGE_SHIFT_STEP = 50;
const KEY_ZOOM_STEP = 0.1;

interface ImageCropDialogProps {
  open: boolean;
  file: File | null;
  /** Initial aspect preset; user can switch inside the dialog. */
  preset: CropPresetId;
  onCancel: () => void;
  /** Called with the cropped file + the preset that was active at confirm. */
  onConfirm: (file: File, preset: CropPresetId) => Promise<void> | void;
}

interface DragState {
  pointerId: number;
  startX: number;
  startY: number;
  originOffsetX: number;
  originOffsetY: number;
}

type ImageMetricsHandlers = {
  setImageMetrics: (v: LoadedImageMetrics | null) => void;
  setIsPreparing: (v: boolean) => void;
  setErrorMessage: (v: string | null) => void;
};

function runImageMetricsLoad(file: File, handlers: ImageMetricsHandlers) {
  let cancelled = false;
  handlers.setIsPreparing(true);
  handlers.setErrorMessage(null);

  void loadImageMetrics(file)
    .then((metrics) => {
      if (cancelled) {
        URL.revokeObjectURL(metrics.src);
        return;
      }
      handlers.setImageMetrics(metrics);
    })
    .catch(() => {
      if (!cancelled) {
        handlers.setErrorMessage('ไม่สามารถโหลดรูปภาพเพื่อครอปได้');
      }
    })
    .finally(() => {
      if (!cancelled) handlers.setIsPreparing(false);
    });

  return () => {
    cancelled = true;
  };
}

function useImageMetricsState() {
  const [imageMetrics, setImageMetrics] = useState<LoadedImageMetrics | null>(null);
  const [crop, setCrop] = useState<CropState | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  return {
    imageMetrics,
    setImageMetrics,
    crop,
    setCrop,
    isPreparing,
    setIsPreparing,
    errorMessage,
    setErrorMessage,
  };
}

function useImageMetricsLoader(params: {
  open: boolean;
  file: File | null;
  targetWidth: number;
  targetHeight: number;
}) {
  const { open, file, targetWidth, targetHeight } = params;
  const s = useImageMetricsState();

  // Load metrics only when file/open change — target changes just re-center.
  useEffect(() => {
    if (!open || !file) {
      s.setImageMetrics(null);
      s.setCrop(null);
      s.setErrorMessage(null);
      return;
    }

    return runImageMetricsLoad(file, {
      setImageMetrics: s.setImageMetrics,
      setIsPreparing: s.setIsPreparing,
      setErrorMessage: s.setErrorMessage,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, open]);

  // Re-center the crop whenever metrics or target changes. This is the only
  // path that touches `crop` from this hook — drag/keyboard/zoom mutate it
  // via setCrop from inside the dialog.
  const targetSignature = `${targetWidth}x${targetHeight}`;
  useEffect(() => {
    const metrics = s.imageMetrics;
    if (!metrics) return;
    s.setCrop(
      getCenteredCropState(metrics.width, metrics.height, 1, targetWidth, targetHeight),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.imageMetrics, targetSignature]);

  useEffect(() => {
    return () => {
      if (s.imageMetrics?.src) URL.revokeObjectURL(s.imageMetrics.src);
    };
  }, [s.imageMetrics]);

  const {
    imageMetrics,
    crop,
    setCrop,
    isPreparing,
    errorMessage,
    setErrorMessage,
  } = s;

  return {
    imageMetrics,
    crop,
    setCrop,
    isPreparing,
    errorMessage,
    setErrorMessage,
  };
}

function usePreviewGeometry(params: {
  imageMetrics: LoadedImageMetrics | null;
  crop: CropState | null;
  targetWidth: number;
  targetHeight: number;
}) {
  const { imageMetrics, crop, targetWidth, targetHeight } = params;

  const bounds = useMemo(() => {
    if (!imageMetrics || !crop) return null;
    return getCropBounds(
      imageMetrics.width,
      imageMetrics.height,
      crop.zoom,
      targetWidth,
      targetHeight,
    );
  }, [crop, imageMetrics, targetHeight, targetWidth]);

  const previewViewport = useMemo(() => {
    const scale = Math.min(
      IMAGE_CROP_PREVIEW_SIZE / Math.max(targetWidth, targetHeight),
      1,
    );
    return { width: targetWidth * scale, height: targetHeight * scale };
  }, [targetHeight, targetWidth]);

  const previewScale = bounds ? previewViewport.width / bounds.cropWidth : 1;

  const previewStyle = useMemo(() => {
    if (!imageMetrics || !crop) return undefined;
    return {
      width: imageMetrics.width * previewScale,
      height: imageMetrics.height * previewScale,
      left: -(crop.offsetX * previewScale),
      top: -(crop.offsetY * previewScale),
    };
  }, [crop, imageMetrics, previewScale]);

  return { previewViewport, previewScale, previewStyle };
}

interface CropCanvasProps {
  previewViewport: { width: number; height: number };
  previewStyle: React.CSSProperties | undefined;
  imageMetrics: LoadedImageMetrics | null;
  isPreparing: boolean;
  dragState: DragState | null;
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerEnd: (event: React.PointerEvent<HTMLDivElement>) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  canvasRef: React.RefObject<HTMLDivElement | null>;
}

function CropCanvasContent({
  imageMetrics,
  previewStyle,
  isPreparing,
}: {
  imageMetrics: LoadedImageMetrics | null;
  previewStyle: React.CSSProperties | undefined;
  isPreparing: boolean;
}) {
  if (isPreparing || !previewStyle || !imageMetrics) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageMetrics.src}
        alt="Crop preview"
        className="pointer-events-none absolute max-w-none select-none"
        style={previewStyle}
        draggable={false}
      />
      <div className="pointer-events-none absolute inset-0 ring-1 ring-white/60" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/35" />
      <div className="pointer-events-none absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-white/35" />
    </>
  );
}

function CropCanvas(props: CropCanvasProps) {
  const {
    previewViewport,
    previewStyle,
    imageMetrics,
    isPreparing,
    dragState,
    onPointerDown,
    onPointerMove,
    onPointerEnd,
    onKeyDown,
    canvasRef,
  } = props;

  return (
    <div
      ref={canvasRef}
      role="application"
      aria-label="กรอบครอป — ลากด้วยเมาส์ หรือใช้ลูกศรเลื่อน, +/− ซูม"
      tabIndex={0}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border bg-muted shadow-inner touch-none outline-none',
        'focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring',
        dragState ? 'cursor-grabbing' : 'cursor-grab',
      )}
      style={previewViewport}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onKeyDown={onKeyDown}
    >
      <CropCanvasContent
        imageMetrics={imageMetrics}
        previewStyle={previewStyle}
        isPreparing={isPreparing}
      />
    </div>
  );
}

function ZoomControl({
  zoom,
  onChange,
}: {
  zoom: number | undefined;
  onChange: (zoom: number) => void;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-background/60 p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">Zoom</span>
        <span className="text-muted-foreground">{zoom?.toFixed(2)}x</span>
      </div>
      <div className="flex items-center gap-3">
        <ZoomOut className="size-4 text-muted-foreground" aria-hidden />
        <input
          type="range"
          min="1"
          max="4"
          step="0.05"
          value={zoom ?? 1}
          onChange={(event) => onChange(Number(event.target.value))}
          className="flex-1 accent-primary"
          aria-label="ระดับซูม"
        />
        <ZoomIn className="size-4 text-muted-foreground" aria-hidden />
      </div>
    </div>
  );
}

function CropSidebar({
  sizeLabel,
  ratioLabel,
  crop,
  onZoomChange,
  onCancel,
  onConfirm,
  isPreparing,
  isSaving,
}: {
  sizeLabel: string;
  ratioLabel: string;
  crop: CropState | null;
  onZoomChange: (zoom: number) => void;
  onCancel: () => void;
  onConfirm: () => void;
  isPreparing: boolean;
  isSaving: boolean;
}) {
  return (
    <div className="w-full max-w-sm space-y-5">
      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <p className="text-sm font-semibold text-foreground">ผลลัพธ์ที่จะได้</p>
        <p className="mt-1 text-sm text-muted-foreground">
          รูปปลายทาง {sizeLabel} อัตราส่วน {ratioLabel} · บันทึกเป็น WEBP
        </p>
      </div>

      <ZoomControl zoom={crop?.zoom} onChange={onZoomChange} />

      <div className="rounded-xl border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
        <p>คำแนะนำ</p>
        <p className="mt-1">
          รูปต้นฉบับควรใหญ่พอสำหรับสัดส่วนที่เลือก เพื่อให้ภาพหลังครอปยังคมชัด
        </p>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={isSaving}>
          ยกเลิก
        </Button>
        <Button onClick={onConfirm} disabled={isPreparing || isSaving}>
          {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
          ใช้รูปนี้
        </Button>
      </div>
    </div>
  );
}

function computeDragCrop(
  dragState: DragState,
  event: React.PointerEvent<HTMLDivElement>,
  params: {
    imageMetrics: LoadedImageMetrics;
    crop: CropState;
    previewScale: number;
    targetWidth: number;
    targetHeight: number;
  },
): CropState {
  const deltaX = (event.clientX - dragState.startX) / params.previewScale;
  const deltaY = (event.clientY - dragState.startY) / params.previewScale;
  return clampCropState(
    params.imageMetrics.width,
    params.imageMetrics.height,
    {
      zoom: params.crop.zoom,
      offsetX: dragState.originOffsetX - deltaX,
      offsetY: dragState.originOffsetY - deltaY,
    },
    params.targetWidth,
    params.targetHeight,
  );
}

function makePointerDown(
  crop: CropState | null,
  setDragState: (v: DragState | null) => void,
) {
  return (event: React.PointerEvent<HTMLDivElement>) => {
    if (!crop) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragState({
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originOffsetX: crop.offsetX,
      originOffsetY: crop.offsetY,
    });
  };
}

function usePointerDrag(params: {
  imageMetrics: LoadedImageMetrics | null;
  crop: CropState | null;
  setCrop: (value: CropState) => void;
  previewScale: number;
  targetWidth: number;
  targetHeight: number;
}) {
  const { imageMetrics, crop, setCrop } = params;
  const [dragState, setDragState] = useState<DragState | null>(null);

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState || !crop || !imageMetrics) return;
    setCrop(
      computeDragCrop(dragState, event, {
        imageMetrics,
        crop,
        previewScale: params.previewScale,
        targetWidth: params.targetWidth,
        targetHeight: params.targetHeight,
      }),
    );
  };

  const handlePointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragState?.pointerId === event.pointerId) {
      setDragState(null);
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return {
    dragState,
    handlePointerDown: makePointerDown(crop, setDragState),
    handlePointerMove,
    handlePointerEnd,
  };
}

/**
 * Keyboard-driven crop adjustment when the canvas is focused.
 *   - Arrow keys      → nudge offset by 10px (image-space)
 *   - Shift+Arrow     → nudge by 50px
 *   - +/=             → zoom in
 *   - -/_             → zoom out
 *   - 0               → reset to centered, zoom 1
 *
 * Mirrors the pointer-drag math but bypasses preview scaling — the steps are
 * already in source-image pixels, so they feel consistent regardless of zoom.
 */
function useKeyboardCropNudge(params: {
  imageMetrics: LoadedImageMetrics | null;
  crop: CropState | null;
  setCrop: (value: CropState) => void;
  targetWidth: number;
  targetHeight: number;
}) {
  const { imageMetrics, crop, setCrop, targetWidth, targetHeight } = params;

  return (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!imageMetrics || !crop) return;

    const arrowStep = event.shiftKey ? KEY_NUDGE_SHIFT_STEP : KEY_NUDGE_STEP;
    let dx = 0;
    let dy = 0;
    let nextZoom = crop.zoom;
    let handled = true;

    switch (event.key) {
      case 'ArrowLeft':
        dx = -arrowStep;
        break;
      case 'ArrowRight':
        dx = arrowStep;
        break;
      case 'ArrowUp':
        dy = -arrowStep;
        break;
      case 'ArrowDown':
        dy = arrowStep;
        break;
      case '+':
      case '=':
        nextZoom = Math.min(IMAGE_CROP_MAX_ZOOM, crop.zoom + KEY_ZOOM_STEP);
        break;
      case '-':
      case '_':
        nextZoom = Math.max(IMAGE_CROP_MIN_ZOOM, crop.zoom - KEY_ZOOM_STEP);
        break;
      case '0':
        setCrop(
          getCenteredCropState(
            imageMetrics.width,
            imageMetrics.height,
            1,
            targetWidth,
            targetHeight,
          ),
        );
        event.preventDefault();
        return;
      default:
        handled = false;
    }

    if (!handled) return;
    event.preventDefault();

    if (nextZoom !== crop.zoom) {
      setCrop(
        nextCropStateForZoom(
          imageMetrics.width,
          imageMetrics.height,
          crop,
          nextZoom,
          targetWidth,
          targetHeight,
        ),
      );
      return;
    }

    setCrop(
      clampCropState(
        imageMetrics.width,
        imageMetrics.height,
        {
          zoom: crop.zoom,
          offsetX: crop.offsetX + dx,
          offsetY: crop.offsetY + dy,
        },
        targetWidth,
        targetHeight,
      ),
    );
  };
}

function useCropConfirm(params: {
  file: File | null;
  crop: CropState | null;
  targetWidth: number;
  targetHeight: number;
  onConfirm: (file: File) => Promise<void> | void;
  setErrorMessage: (message: string | null) => void;
}) {
  const [isSaving, setIsSaving] = useState(false);

  const handleConfirm = async () => {
    const { file, crop, targetWidth, targetHeight, onConfirm, setErrorMessage } =
      params;
    if (!file || !crop) return;
    setIsSaving(true);
    setErrorMessage(null);
    try {
      const processedFile = await createCroppedImageFile({
        file,
        crop,
        targetWidth,
        targetHeight,
      });
      await onConfirm(processedFile);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'ไม่สามารถครอปรูปภาพได้',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return { isSaving, handleConfirm };
}

/** Adapt the public `(file, preset)` callback into the inner `(file)` form. */
function bindPresetToOnConfirm(
  onConfirm: (file: File, preset: CropPresetId) => Promise<void> | void,
  preset: CropPresetId,
) {
  return (file: File) => onConfirm(file, preset);
}

interface ImageCropDialogBodyProps {
  sizeLabel: string;
  ratioLabel: string;
  errorMessage: string | null;
  previewViewport: { width: number; height: number };
  previewStyle: React.CSSProperties | undefined;
  imageMetrics: LoadedImageMetrics | null;
  isPreparing: boolean;
  drag: ReturnType<typeof usePointerDrag>;
  crop: CropState | null;
  onZoomChange: (zoom: number) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  aspectButtons: React.ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
  isSaving: boolean;
}

function ImageCropHeading({
  sizeLabel,
  ratioLabel,
}: {
  sizeLabel: string;
  ratioLabel: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Crop className="size-4" />
        ครอปรูปก่อนใช้งาน
      </div>
      <p className="text-sm text-muted-foreground">
        เลื่อนภาพเพื่อเลือกตำแหน่งที่ต้องการแสดง · ผลลัพธ์ {sizeLabel} อัตราส่วน {ratioLabel}
      </p>
    </div>
  );
}

function CropCanvasWithHint(
  props: Pick<
    ImageCropDialogBodyProps,
    | 'previewViewport'
    | 'previewStyle'
    | 'imageMetrics'
    | 'isPreparing'
    | 'drag'
    | 'onKeyDown'
    | 'canvasRef'
  >,
) {
  const {
    previewViewport,
    previewStyle,
    imageMetrics,
    isPreparing,
    drag,
    onKeyDown,
    canvasRef,
  } = props;
  return (
    <div className="flex flex-col items-center gap-4">
      <CropCanvas
        canvasRef={canvasRef}
        previewViewport={previewViewport}
        previewStyle={previewStyle}
        imageMetrics={imageMetrics}
        isPreparing={isPreparing}
        dragState={drag.dragState}
        onPointerDown={drag.handlePointerDown}
        onPointerMove={drag.handlePointerMove}
        onPointerEnd={drag.handlePointerEnd}
        onKeyDown={onKeyDown}
      />
      <p className="text-[11px] text-muted-foreground">
        ลากเมาส์เพื่อเลื่อน · โฟกัสกรอบแล้วใช้ลูกศรเลื่อน (Shift = ก้าวใหญ่), +/− ซูม, 0 รีเซ็ต
      </p>
    </div>
  );
}

function ImageCropDialogMain(
  props: Pick<
    ImageCropDialogBodyProps,
    | 'sizeLabel'
    | 'ratioLabel'
    | 'errorMessage'
    | 'previewViewport'
    | 'previewStyle'
    | 'imageMetrics'
    | 'isPreparing'
    | 'drag'
    | 'onKeyDown'
    | 'canvasRef'
    | 'aspectButtons'
  >,
) {
  return (
    <div className="flex-1 space-y-4">
      <ImageCropHeading sizeLabel={props.sizeLabel} ratioLabel={props.ratioLabel} />
      <div className="space-y-1.5">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          สัดส่วน
        </p>
        {props.aspectButtons}
      </div>
      {props.errorMessage ? (
        <p
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {props.errorMessage}
        </p>
      ) : null}
      <CropCanvasWithHint
        canvasRef={props.canvasRef}
        previewViewport={props.previewViewport}
        previewStyle={props.previewStyle}
        imageMetrics={props.imageMetrics}
        isPreparing={props.isPreparing}
        drag={props.drag}
        onKeyDown={props.onKeyDown}
      />
    </div>
  );
}

function ImageCropDialogBody(props: ImageCropDialogBodyProps) {
  return (
    <div className="relative z-10 flex w-full max-w-4xl flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-2xl lg:flex-row">
      <ImageCropDialogMain
        sizeLabel={props.sizeLabel}
        ratioLabel={props.ratioLabel}
        errorMessage={props.errorMessage}
        previewViewport={props.previewViewport}
        previewStyle={props.previewStyle}
        imageMetrics={props.imageMetrics}
        isPreparing={props.isPreparing}
        drag={props.drag}
        onKeyDown={props.onKeyDown}
        canvasRef={props.canvasRef}
        aspectButtons={props.aspectButtons}
      />
      <CropSidebar
        sizeLabel={props.sizeLabel}
        ratioLabel={props.ratioLabel}
        crop={props.crop}
        onZoomChange={props.onZoomChange}
        onCancel={props.onCancel}
        onConfirm={props.onConfirm}
        isPreparing={props.isPreparing}
        isSaving={props.isSaving}
      />
    </div>
  );
}

function useImageCropDialogState(params: {
  open: boolean;
  file: File | null;
  targetWidth: number;
  targetHeight: number;
  onConfirm: (file: File) => Promise<void> | void;
}) {
  const { open, file, targetWidth, targetHeight, onConfirm } = params;
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const metrics = useImageMetricsLoader({
    open,
    file,
    targetWidth,
    targetHeight,
  });
  const { previewViewport, previewScale, previewStyle } = usePreviewGeometry({
    imageMetrics: metrics.imageMetrics,
    crop: metrics.crop,
    targetWidth,
    targetHeight,
  });
  const drag = usePointerDrag({
    imageMetrics: metrics.imageMetrics,
    crop: metrics.crop,
    setCrop: metrics.setCrop,
    previewScale,
    targetWidth,
    targetHeight,
  });
  const handleKeyDown = useKeyboardCropNudge({
    imageMetrics: metrics.imageMetrics,
    crop: metrics.crop,
    setCrop: metrics.setCrop,
    targetWidth,
    targetHeight,
  });
  const confirm = useCropConfirm({
    file,
    crop: metrics.crop,
    targetWidth,
    targetHeight,
    onConfirm,
    setErrorMessage: metrics.setErrorMessage,
  });
  return {
    metrics,
    previewViewport,
    previewStyle,
    drag,
    handleKeyDown,
    canvasRef,
    confirm,
  };
}

function makeZoomChangeHandler(params: {
  metrics: ReturnType<typeof useImageMetricsLoader>;
  targetWidth: number;
  targetHeight: number;
}) {
  const { metrics, targetWidth, targetHeight } = params;
  return (nextZoom: number) => {
    if (!metrics.imageMetrics || !metrics.crop) return;
    metrics.setCrop(
      nextCropStateForZoom(
        metrics.imageMetrics.width,
        metrics.imageMetrics.height,
        metrics.crop,
        nextZoom,
        targetWidth,
        targetHeight,
      ),
    );
  };
}

/** Aspect presets shown as toggle buttons inside the dialog header. */
const ASPECT_PRESETS = [
  { id: 'square', label: '1:1' },
  { id: 'workHero', label: '2:1' },
  { id: 'work', label: '3:2' },
  { id: 'post', label: '16:10' },
] as const satisfies readonly { id: CropPresetId; label: string }[];

function AspectButtons({
  value,
  onChange,
  disabled,
}: {
  value: CropPresetId;
  onChange: (id: CropPresetId) => void;
  disabled?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="สัดส่วนการครอป"
      className="flex flex-wrap gap-1.5"
    >
      {ASPECT_PRESETS.map((p) => {
        const active = p.id === value;
        return (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(p.id)}
            className={cn(
              'h-8 rounded-md border px-3 text-xs font-medium transition outline-none',
              'focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring',
              'disabled:pointer-events-none disabled:opacity-50',
              active
                ? 'border-foreground bg-foreground text-background'
                : 'border-border bg-background text-foreground hover:bg-muted',
            )}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}

export function ImageCropDialog({
  open,
  file,
  preset: initialPreset,
  onCancel,
  onConfirm,
}: ImageCropDialogProps) {
  // The preset prop seeds initial state; the user can switch between aspect
  // ratios inside the dialog via the AspectButtons toggle group.
  const [activePreset, setActivePreset] = useState<CropPresetId>(() =>
    isCropAspectPreset(CROP_PRESETS[initialPreset]) ? initialPreset : 'post',
  );

  // If the caller re-opens the dialog with a different preset, reset state.
  const [lastInitialPreset, setLastInitialPreset] = useState<CropPresetId>(initialPreset);
  if (lastInitialPreset !== initialPreset) {
    setLastInitialPreset(initialPreset);
    setActivePreset(
      isCropAspectPreset(CROP_PRESETS[initialPreset]) ? initialPreset : 'post',
    );
  }

  const presetConfig = CROP_PRESETS[activePreset];
  const hasAspect = isCropAspectPreset(presetConfig);
  const targetWidth = hasAspect ? presetConfig.width : 1080;
  const targetHeight = hasAspect ? presetConfig.height : 1080;

  const {
    metrics,
    previewViewport,
    previewStyle,
    drag,
    handleKeyDown,
    canvasRef,
    confirm,
  } = useImageCropDialogState({
    open,
    file,
    targetWidth,
    targetHeight,
    onConfirm: bindPresetToOnConfirm(onConfirm, activePreset),
  });

  // Focus the canvas once the image is loaded so arrow keys work immediately.
  useEffect(() => {
    if (open && metrics.imageMetrics && !metrics.isPreparing) {
      canvasRef.current?.focus({ preventScroll: true });
    }
  }, [open, metrics.imageMetrics, metrics.isPreparing, canvasRef]);

  if (!open || !file || !hasAspect) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="ครอปรูปภาพ"
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
      />
      <ImageCropDialogBody
        sizeLabel={`${targetWidth}×${targetHeight}`}
        ratioLabel={presetConfig.ratioLabel}
        errorMessage={metrics.errorMessage}
        previewViewport={previewViewport}
        previewStyle={previewStyle}
        imageMetrics={metrics.imageMetrics}
        isPreparing={metrics.isPreparing}
        drag={drag}
        canvasRef={canvasRef}
        onKeyDown={handleKeyDown}
        crop={metrics.crop}
        onZoomChange={makeZoomChangeHandler({
          metrics,
          targetWidth,
          targetHeight,
        })}
        aspectButtons={
          <AspectButtons
            value={activePreset}
            onChange={setActivePreset}
            disabled={confirm.isSaving}
          />
        }
        onCancel={onCancel}
        onConfirm={() => void confirm.handleConfirm()}
        isSaving={confirm.isSaving}
      />
    </div>,
    document.body,
  );
}
