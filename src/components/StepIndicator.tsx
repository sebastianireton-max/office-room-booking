/**
 * Checkout progress, display only (steps are not links). Labels stay in the
 * accessibility tree at every width; below sm they are visually hidden so the
 * bar fits a phone. aria-current marks the step, the live region announces moves.
 */

export interface Step {
  label: string;
}

export function StepIndicator({ steps, currentIndex }: { steps: Step[]; currentIndex: number }) {
  return (
    <nav aria-label="Checkout progress">
      <ol className="flex items-center gap-2 sm:gap-3">
        {steps.map((step, i) => {
          const state = i < currentIndex ? "completed" : i === currentIndex ? "current" : "upcoming";
          return (
            <li key={step.label} aria-current={state === "current" ? "step" : undefined} className="flex items-center gap-2 sm:gap-3">
              <span
                aria-hidden="true"
                className={[
                  "tabular flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                  state === "completed" && "bg-success text-on-success",
                  state === "current" && "bg-accent text-on-accent",
                  state === "upcoming" && "border border-border-default bg-surface text-text-secondary",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {state === "completed" ? "✓" : i + 1}
              </span>
              <span className={`sr-only text-sm sm:not-sr-only ${state === "upcoming" ? "text-text-secondary" : "text-text-primary"}`}>
                {step.label}
                {state === "completed" && <span className="sr-only"> (done)</span>}
              </span>
              {i < steps.length - 1 && <span aria-hidden="true" className="h-px w-5 shrink-0 bg-border-default sm:w-6" />}
            </li>
          );
        })}
      </ol>
      <p className="sr-only" role="status" aria-live="polite">
        Step {currentIndex + 1} of {steps.length}: {steps[currentIndex]?.label}
      </p>
    </nav>
  );
}
