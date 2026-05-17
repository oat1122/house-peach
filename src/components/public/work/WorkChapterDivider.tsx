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
 */
type Props = {
  /** Fixed chapter number string, e.g. "01" "02" */
  number: string;
  /** Thai chapter label, e.g. "โจทย์" */
  th: string;
  /** English chapter label, e.g. "The Brief" */
  en: string;
};

export function WorkChapterDivider({ number, th, en }: Props) {
  return (
    <h2 aria-label={`${number} — ${th} · ${en}`} className="px-4 md:px-0">
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
