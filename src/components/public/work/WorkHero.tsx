import Image from 'next/image';

/**
 * RSC — Renders the work cover image as the LCP hero element.
 *
 * v1 defaults: mobile `aspect-[3/2]` · desktop `aspect-[2/1]` · `rounded-2xl`
 * v2 override: pass `aspectClass="aspect-[16/9] md:aspect-[21/9]"` and
 *   `className="rounded-none"` for the editorial cinematic hero (spec §S5).
 *
 * Aspect is overridden by CSS; stored width/height are only for
 * `next/image` srcset generation (passed via `fill`'s sizes attribute).
 */
type Props = {
  src: string;
  /** Stored asset alt; falls back to work title so alt is never empty. */
  alt: string;
  /**
   * Tailwind aspect + margin-top classes.
   * Default: `"aspect-[3/2] md:aspect-[2/1] md:mt-10"` (v1 behaviour).
   * v2 page passes `"aspect-[16/9] md:aspect-[21/9] md:mt-0"`.
   */
  aspectClass?: string;
  className?: string;
};

export function WorkHero({
  src,
  alt,
  aspectClass = 'aspect-[3/2] md:aspect-[2/1] md:mt-10',
  className,
}: Props) {
  return (
    <div
      className={
        'relative mt-6 w-full overflow-hidden rounded-2xl bg-bg2 ' +
        aspectClass +
        ' ' +
        (className ?? '')
      }
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 100vw, 1280px"
        className="object-cover"
        priority
        unoptimized
      />
    </div>
  );
}
