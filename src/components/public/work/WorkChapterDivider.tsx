/**
 * RSC — Chapter divider with flanking hairlines + bilingual label.
 *
 * Renders a semantic `<h2>` whose accessible label comes from `aria-label`
 * (number — th · en). The inner `<span>` is `aria-hidden` because the visual
 * decoration (hairlines, separator) would read redundantly to screen readers.
 *
 * CSS classes `.chapter-divider` and `.chapter-divider__line` are defined in
 * `src/styles/themes.css` (flex row + hairline rules).
 *
 * Per spec §7 and §25: the `number` prop stays fixed ("01"–"05") regardless
 * of which chapters are skipped — stable numbering is intentional.
 *
 * `id` is the scroll-spy target consumed by WorkChaptersNav (IntersectionObserver
 * + hash navigation). Defaults to `chapter-{number}` so callers can simply pass
 * number without thinking about it. `scroll-margin-top: 7rem` matches the
 * sticky-header offset used by the prose-post heading rules in themes.css.
 */
type Props = {
  /** Fixed chapter number string, e.g. "01" "02" */
  number: string;
  /** Thai chapter label, e.g. "โจทย์" */
  th: string;
  /** English chapter label, e.g. "The Brief" */
  en: string;
  /** Override the auto-derived heading id (`chapter-{number}` default). */
  id?: string;
};

export function WorkChapterDivider({ number, th, en, id }: Props) {
  const headingId = id ?? `chapter-${number}`;
  return (
    <h2
      id={headingId}
      aria-label={`${number} — ${th} · ${en}`}
      className="px-4 md:px-0 scroll-mt-28"
    >
      <span aria-hidden="true" className="chapter-divider">
        <span className="chapter-divider__line" />
        <span className="text-xs font-sans text-muted-brand">{number}</span>
        <span className="text-xs font-sans text-muted-brand">/</span>
        <span className="text-xs font-sans text-muted-brand">{th}</span>
        <span className="text-xs font-sans text-muted-brand">— {en}</span>
        <span className="chapter-divider__line" />
      </span>
    </h2>
  );
}
