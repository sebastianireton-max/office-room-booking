/**
 * The Clockroom lockup. Deliberately NOT an image: it is the site's own
 * lowercase-italic + CAPS headline pattern (see page.tsx) applied to the
 * name, so the wordmark is the typography rather than a picture of it.
 * That keeps it crisp at any size, recolourable by token, selectable as
 * text, and readable by screen readers without alt-text duplication.
 *
 * The square mark (src/app/icon.svg, same geometry) is the favicon/avatar
 * form for the square crops a wordmark cannot fill.
 */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display tracking-[-0.015em] text-text-primary ${className}`}>
      <span className="lowercase italic">clock</span>
      <span className="font-semibold uppercase">room</span>
    </span>
  );
}
