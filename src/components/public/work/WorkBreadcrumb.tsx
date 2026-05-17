import Link from 'next/link';

type Props = {
  /** Work title for the current-page leaf. Falls back to listing label. */
  workTitle?: string;
};

/**
 * Semantic breadcrumb navigation for work detail pages.
 * Structure: หน้าแรก / ผลงาน / [work title]. JSON-LD BreadcrumbList in
 * lib/seo/jsonld.ts mirrors this exact path — visible and structured data
 * must agree (Google guidelines).
 *
 * Mirrors PostBreadcrumb visual treatment so blog + work read as one family.
 */
export function WorkBreadcrumb({ workTitle }: Props) {
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

        {workTitle ? (
          <>
            <li>
              <Link href="/works" className="hover:text-ink transition-colors">
                ผลงาน
              </Link>
            </li>
            <li aria-hidden="true" className="text-muted-brand select-none">
              /
            </li>
            <li
              aria-current="page"
              className="text-ink font-semibold truncate max-w-[60vw] md:max-w-md min-w-0"
            >
              {workTitle}
            </li>
          </>
        ) : (
          <li aria-current="page" className="text-ink font-semibold">
            ผลงาน
          </li>
        )}
      </ol>
    </nav>
  );
}
