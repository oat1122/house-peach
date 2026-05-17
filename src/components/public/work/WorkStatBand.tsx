import { formatDuration } from '@/lib/utils/formatDuration';
import { resolveBudgetLabel } from '@/lib/utils/workLabels';
import { FadeUp } from '@/components/motion/FadeUp';

type Props = {
  areaSqm: number | null;
  durationDays: number | null;
  budgetRange: string | null;
  yearCompleted: number | null;
};

/**
 * RSC — Full-bleed stat band showing up to 4 project metrics (spec §S6, §8).
 *
 * Each cell is independently conditional — null cells are omitted entirely,
 * never shown as placeholder dashes. The grid collapses gracefully from 4-up
 * to 1-up via `repeat(auto-fit, minmax(80px, 1fr))`.
 *
 * Returns `null` when all four values are null (hides the entire band).
 *
 * Stat numbers use `text-ink` (NOT `text-accent`) for ≥7:1 contrast across
 * all 4 theme presets — locked decision per spec §18 and §2 Pillar 2.
 */
export function WorkStatBand({
  areaSqm,
  durationDays,
  budgetRange,
  yearCompleted,
}: Props) {
  const budgetLabel = resolveBudgetLabel(budgetRange);

  // Return null if all fields are absent so no empty band appears
  if (
    areaSqm == null &&
    durationDays == null &&
    budgetLabel == null &&
    yearCompleted == null
  ) {
    return null;
  }

  return (
    <FadeUp>
      {/* Full-bleed: -mx-4 md:-mx-6 breaks out of the page gutter */}
      <section
        aria-label="ข้อมูลโปรเจกต์"
        className="-mx-4 md:-mx-6 bg-bg2 py-6 md:py-8 px-4 md:px-6 mt-6"
      >
        <div
          className="grid gap-4 md:gap-6 max-w-3xl mx-auto"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(70px, 1fr))' }}
        >
          {areaSqm != null && (
            <StatCell
              value={`${areaSqm}`}
              unit="ตร.ม."
              label="พื้นที่"
            />
          )}
          {durationDays != null && (
            <StatCell
              value={formatDuration(durationDays)}
              label="ระยะเวลา"
            />
          )}
          {budgetLabel != null && (
            <StatCell
              value={budgetLabel}
              label="งบประมาณ"
              compact
            />
          )}
          {yearCompleted != null && (
            <StatCell
              value={`${yearCompleted}`}
              label="ปีที่เสร็จ"
            />
          )}
        </div>
      </section>
    </FadeUp>
  );
}

function StatCell({
  value,
  unit,
  label,
  compact = false,
}: {
  value: string;
  unit?: string;
  label: string;
  compact?: boolean;
}) {
  return (
    <div className="text-center min-w-0">
      <p
        className={
          'font-sans font-bold tracking-tight text-ink break-words ' +
          (compact
            ? 'text-lg md:text-2xl leading-tight'
            : 'text-2xl md:text-5xl')
        }
      >
        {value}
        {unit && (
          <span className="ml-1 text-sm md:text-lg font-normal">{unit}</span>
        )}
      </p>
      <p className="text-[10px] uppercase tracking-widest text-muted-brand mt-1">
        {label}
      </p>
    </div>
  );
}
