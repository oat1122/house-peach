import Link from 'next/link';

type Props = {
  /** Post title for the current-page leaf. Falls back to listing label. */
  postTitle?: string;
};

/**
 * Semantic breadcrumb navigation for blog post detail pages.
 * Structure: หน้าแรก / บทความ / [post title]. JSON-LD BreadcrumbList in
 * lib/seo/jsonld.ts mirrors this exact path — visible and structured data
 * must agree (Google guidelines).
 */
export function PostBreadcrumb({ postTitle }: Props) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-1.5 flex-wrap text-sm text-muted-brand">
        <li>
          <Link href="/" className="hover:text-ink transition-colors">
            หน้าแรก
          </Link>
        </li>

        <li aria-hidden="true" className="text-muted-brand select-none">
          /
        </li>

        {postTitle ? (
          <>
            <li>
              <Link
                href="/blog"
                className="hover:text-ink transition-colors"
              >
                บทความ
              </Link>
            </li>
            <li aria-hidden="true" className="text-muted-brand select-none">
              /
            </li>
            <li
              aria-current="page"
              className="text-ink font-semibold line-clamp-1 max-w-[60vw] md:max-w-md"
            >
              {postTitle}
            </li>
          </>
        ) : (
          <li aria-current="page" className="text-ink font-semibold">
            บทความ
          </li>
        )}
      </ol>
    </nav>
  );
}
