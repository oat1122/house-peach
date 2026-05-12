import Image from 'next/image';

/**
 * MDX image renderer used inside whitelisted post/work bodies.
 *
 * Constraints (from `.claude/rules/seo.md` § Image SEO):
 *   - `alt` is required (caller can pass empty for decorative, but never undefined)
 *   - render via `next/image` with explicit width/height (kept CLS-safe)
 *   - default sizes hint targets typical article body width (~768px max)
 *
 * Authors write either `![alt](src)` (markdown → maps via whitelist) or
 * `<MDXImage src=... alt=... width=... height=... />` for full control.
 */
type Props = {
  src?: string;
  alt?: string;
  width?: number | string;
  height?: number | string;
  caption?: string;
  className?: string;
};

const DEFAULT_WIDTH = 1200;
const DEFAULT_HEIGHT = 800;

export function MDXImage({
  src,
  alt,
  width,
  height,
  caption,
  className,
}: Props) {
  if (!src) return null;
  const w = typeof width === 'string' ? Number(width) : (width ?? DEFAULT_WIDTH);
  const h =
    typeof height === 'string' ? Number(height) : (height ?? DEFAULT_HEIGHT);

  return (
    <figure className={'my-6 ' + (className ?? '')}>
      <Image
        src={src}
        alt={alt ?? ''}
        width={w}
        height={h}
        sizes="(max-width: 768px) 100vw, 768px"
        className="h-auto w-full rounded-lg object-cover"
        unoptimized
      />
      {caption && (
        <figcaption className="mt-2 text-center text-xs text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
