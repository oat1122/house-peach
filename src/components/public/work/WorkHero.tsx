import Image from 'next/image';

/**
 * RSC — Renders the work cover image as the LCP hero element.
 * Mobile: `aspect-[3/2]` · Desktop (md+): `aspect-[2/1]`
 * Aspect is overridden by CSS; stored width/height are only for
 * `next/image` srcset generation (passed via `fill`'s sizes attribute).
 */
type Props = {
  src: string;
  /** Stored asset alt; falls back to work title so alt is never empty. */
  alt: string;
  className?: string;
};

export function WorkHero({ src, alt, className }: Props) {
  return (
    <div
      className={
        'relative mt-6 w-full overflow-hidden rounded-2xl bg-bg2 ' +
        'aspect-[3/2] md:aspect-[2/1] md:mt-10 ' +
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
