import type { CSSProperties } from 'react';

/**
 * RSC — Work meta definition list, responsive to context:
 * - Mobile: horizontal scrolling strip (`block md:hidden`)
 * - Desktop: sticky sidebar panel (`hidden md:block`)
 *
 * Single component, Tailwind breakpoint classes control which DOM subtree is
 * visible. The page renders this component once for each slot:
 *  - `slot="mobile"` — strip between summary and hero (visible mobile only)
 *  - `slot="desktop"` — sidebar in the two-column grid (visible desktop only)
 *
 * This avoids two fully separate files while preserving correct DOM ordering
 * for both breakpoints.
 *
 * Returns null when every meta field is null/empty — the page can then
 * collapse the two-column grid to single-column.
 *
 * Per spec § WorkMetaSidebar.
 */

type Props = {
  roomTypeLabel: string;
  style: string | null;
  yearCompleted: number | null;
  location: string | null;
  areaSqm: number | string | null;
  budgetLabel: string | null;
  tagNames: string[];
  /**
   * Which rendering slot to produce.
   * - `'mobile'`  → horizontal scroll strip, `block md:hidden`
   * - `'desktop'` → sticky sidebar card, `hidden md:block`
   * Default `'desktop'`.
   */
  slot?: 'mobile' | 'desktop';
};

type MetaEntry = { label: string; value: string };

function buildEntries(props: Props): MetaEntry[] {
  const entries: MetaEntry[] = [];
  entries.push({ label: 'ประเภทห้อง', value: props.roomTypeLabel });
  if (props.style) entries.push({ label: 'สไตล์', value: props.style });
  if (props.yearCompleted)
    entries.push({ label: 'ปีที่เสร็จ', value: String(props.yearCompleted) });
  if (props.location) entries.push({ label: 'สถานที่', value: props.location });
  if (props.areaSqm != null)
    entries.push({ label: 'พื้นที่ (ตร.ม.)', value: `${props.areaSqm} ตร.ม.` });
  if (props.budgetLabel)
    entries.push({ label: 'งบประมาณ (บาท)', value: props.budgetLabel });
  return entries;
}

export function WorkMetaSidebar(props: Props) {
  const { slot = 'desktop' } = props;
  const entries = buildEntries(props);
  const hasMeta = entries.length > 0 || props.tagNames.length > 0;
  if (!hasMeta) return null;

  if (slot === 'mobile') {
    return (
      <div
        role="region"
        aria-label="ข้อมูลโปรเจกต์"
        className="overflow-x-auto bg-bg2 px-4 py-3"
        style={{ WebkitOverflowScrolling: 'touch' } as CSSProperties}
      >
        <dl className="flex min-w-max gap-6">
          {entries.map((e) => (
            <span
              key={e.label}
              className="inline-flex flex-shrink-0 items-baseline gap-1 text-xs"
            >
              <dt className="text-muted-brand">{e.label}:</dt>
              <dd className="font-medium text-ink">{e.value}</dd>
            </span>
          ))}
        </dl>
      </div>
    );
  }

  // ── Desktop sidebar ────────────────────────────────────────────────────────
  return (
    <aside
      aria-label="ข้อมูลโปรเจกต์"
      className="w-64 rounded-xl bg-bg2 p-5 sticky top-24 self-start"
    >
      <dl className="space-y-4">
        {entries.map((e) => (
          <div key={e.label}>
            <dt className="text-xs text-muted-brand">{e.label}</dt>
            <dd className="mt-0.5 text-sm font-medium text-ink">{e.value}</dd>
          </div>
        ))}
      </dl>

      {props.tagNames.length > 0 && (
        <>
          <hr className="my-4 border-line" />
          <ul className="flex flex-wrap gap-2" aria-label="แท็ก">
            {props.tagNames.map((name) => (
              <li
                key={name}
                className="rounded-full bg-bg px-2.5 py-1 text-xs text-ink"
              >
                #{name}
              </li>
            ))}
          </ul>
        </>
      )}
    </aside>
  );
}
