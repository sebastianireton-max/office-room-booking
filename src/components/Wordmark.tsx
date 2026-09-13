/**
 * The Clockroom lockup, set in type rather than an image so it stays crisp,
 * selectable and screen-reader friendly. Inherits colour from its context.
 * The square mark lives in src/app/icon.svg.
 */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display tracking-[-0.015em] ${className}`}>
      <span className="font-normal lowercase">clock</span>
      <span className="font-extrabold uppercase">room</span>
    </span>
  );
}
