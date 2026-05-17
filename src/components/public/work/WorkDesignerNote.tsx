import { FadeUp } from '@/components/motion/FadeUp';

type Props = {
  note: string | null;
};

/**
 * RSC — Designer's note (spec §S18, §11).
 *
 * Returns `null` when `note` is null — the section is skipped entirely.
 *
 * `<aside>` is semantically correct: this is supplementary commentary on
 * the main article content, not the primary narrative (spec §11, §20).
 *
 * Plain text rendered with `whitespace-pre-line` to honour line breaks
 * that the admin may have added. No MDX parsing — raw text only.
 *
 * Attribution is the fixed constant "— ทีม house-peach" per `content.md`
 * (works have no per-person author; the organisation is always the creator).
 */
export function WorkDesignerNote({ note }: Props) {
  if (!note) return null;

  return (
    <FadeUp>
      <aside
        aria-label="หมายเหตุจากนักออกแบบ"
        className="max-w-2xl mx-auto mt-24 bg-bg2 rounded-xl p-6 md:p-8"
      >
        {/* sr-only heading lets AT users navigating by heading landmark jump
             here; visual rendering is unchanged. */}
        <h3 className="sr-only">หมายเหตุจากนักออกแบบ</h3>
        <p className="font-sans text-base leading-[1.75] text-ink italic whitespace-pre-line">
          {note}
        </p>
        <p className="text-xs text-muted-brand text-right mt-3">
          — ทีม house-peach
        </p>
      </aside>
    </FadeUp>
  );
}
