import Image from 'next/image';

import { FadeUp } from '@/components/motion/FadeUp';
import { Stagger, StaggerItem } from '@/components/motion/Stagger';

type ProcessImage = {
  mediaAssetId: number;
  sort: number;
  caption: string | null;
  asset: {
    path: string;
    alt: string;
    title: string;
    width: number;
    height: number;
  };
};

type Props = {
  images: ProcessImage[];
  workTitle: string;
};

/**
 * RSC — Responsive process timeline (spec §S15, §12).
 *
 * Mobile: vertical stack with left badge + connector line per step.
 * Desktop: horizontal flex row inside `overflow-x-auto` (film-strip pacing).
 *   Each step is `w-48 flex-none`; horizontal scroll is intentional editorial
 *   pacing — no scroll-jacking, native browser scroll.
 *
 * Motion (spec §19):
 * - ≤ 6 steps: `<Stagger>` wrapper (0.06s per step, max 0.36s total — under budget)
 * - > 6 steps: single `<FadeUp>` on the whole `<ol>` (stagger > 6 exceeds 0.5s)
 *
 * No per-step lightbox / cursor-pointer (spec §12 red-line: process images
 * are documentary, not interactive).
 *
 * Step numbers: plain ASCII digits in a styled circle — no Unicode circled
 * digit characters (uneven rendering across fonts/OS).
 */
export function WorkProcessTimeline({ images, workTitle }: Props) {
  if (images.length === 0) return null;

  const useStagger = images.length <= 6;

  const steps = images.map((img, index) => ({
    ...img,
    stepNumber: index + 1,
    aspectRatio:
      img.asset.width && img.asset.height
        ? img.asset.width / img.asset.height
        : 4 / 3,
    altText:
      img.asset.alt ||
      img.asset.title ||
      `ภาพกระบวนการ — ${workTitle}`,
  }));

  if (useStagger) {
    return (
      <>
        {/* Mobile: vertical stagger list */}
        <Stagger as="ol" className="flex flex-col gap-0 md:hidden">
          {steps.map((step, idx) => (
            <StaggerItem as="li" key={step.mediaAssetId}>
              <StepContent step={step} isLast={idx === steps.length - 1} />
            </StaggerItem>
          ))}
        </Stagger>
        {/* Desktop: horizontal stagger list — tabIndex={0} makes the scroll
             container keyboard-reachable; browsers natively handle arrow-key
             scrolling on focused scrollable elements. */}
        <Stagger
          as="ol"
          className="hidden md:flex flex-row gap-8 overflow-x-auto pb-4"
          tabIndex={0}
          aria-label="ลำดับกระบวนการ — เลื่อนซ้ายขวาด้วยปุ่มลูกศร"
        >
          {steps.map((step) => (
            <StaggerItem as="li" key={step.mediaAssetId} className="w-48 flex-none">
              <DesktopStepContent step={step} />
            </StaggerItem>
          ))}
        </Stagger>
      </>
    );
  }

  // > 6 steps: FadeUp wrapping whole list
  return (
    <>
      <FadeUp>
        <ol className="flex flex-col gap-0 md:hidden">
          {steps.map((step, idx) => (
            <li key={step.mediaAssetId}>
              <StepContent step={step} isLast={idx === steps.length - 1} />
            </li>
          ))}
        </ol>
      </FadeUp>
      <FadeUp>
        {/* tabIndex={0} makes the horizontal scroll container keyboard-reachable */}
        <ol
          className="hidden md:flex flex-row gap-8 overflow-x-auto pb-4"
          tabIndex={0}
          aria-label="ลำดับกระบวนการ — เลื่อนซ้ายขวาด้วยปุ่มลูกศร"
        >
          {steps.map((step) => (
            <li key={step.mediaAssetId} className="w-48 flex-none">
              <DesktopStepContent step={step} />
            </li>
          ))}
        </ol>
      </FadeUp>
    </>
  );
}

// ── Mobile step (vertical layout) ────────────────────────────────────────────

type StepData = {
  mediaAssetId: number;
  stepNumber: number;
  aspectRatio: number;
  altText: string;
  caption: string | null;
  asset: {
    path: string;
    alt: string;
    title: string;
    width: number;
    height: number;
  };
};

function StepContent({
  step,
  isLast,
}: {
  step: StepData;
  isLast: boolean;
}) {
  return (
    <div className="flex gap-3">
      {/* Left column: badge + vertical connector */}
      <div className="flex flex-col items-center flex-none w-8">
        <div className="w-8 h-8 rounded-full bg-bg2 flex items-center justify-center text-ink font-bold text-sm flex-none">
          {step.stepNumber}
        </div>
        {!isLast && (
          <div className="w-0.5 flex-1 bg-line mt-1 min-h-[2rem]" />
        )}
      </div>

      {/* Right column: image + caption */}
      <div className="flex-1 pb-6">
        <div
          className="relative w-full overflow-hidden rounded-md bg-bg2"
          style={{ aspectRatio: `${step.aspectRatio}` }}
        >
          <Image
            src={step.asset.path}
            alt={step.altText}
            fill
            sizes="(max-width: 768px) calc(100vw - 2rem), 192px"
            className="object-cover"
            unoptimized
          />
        </div>
        {step.caption && (
          <p className="text-sm text-muted-brand mt-2 leading-snug break-words">
            {step.caption}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Desktop step (vertical within horizontal scroll) ─────────────────────────

function DesktopStepContent({ step }: { step: StepData }) {
  return (
    <div>
      {/* Badge above the image */}
      <div className="w-8 h-8 rounded-full bg-bg2 flex items-center justify-center text-ink font-bold text-sm mb-3">
        {step.stepNumber}
      </div>
      <div
        className="relative w-full overflow-hidden rounded-md bg-bg2"
        style={{ aspectRatio: `${step.aspectRatio}` }}
      >
        <Image
          src={step.asset.path}
          alt={step.altText}
          fill
          sizes="192px"
          className="object-cover"
          unoptimized
        />
      </div>
      {step.caption && (
        <p className="text-sm text-muted-brand mt-2 leading-snug">
          {step.caption}
        </p>
      )}
    </div>
  );
}
