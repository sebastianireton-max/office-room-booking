/**
 * Mirrors the Figma Step Indicator Dot component (node 7:18), composed into
 * a full step bar. Decided NOT interactive (design package Section 7 open
 * question, resolved here): steps are a pure status display, so the 32×32
 * dot size does not need touch-target padding (design package Section 8.5).
 * An ARIA live region announces step changes for screen readers — Section 8.6 #7.
 */

export interface Step {
  label: string;
}

export function StepIndicator({ steps, currentIndex }: { steps: Step[]; currentIndex: number }) {
  return (
    <nav aria-label="Checkout progress">
      <ol className="flex items-center gap-2 sm:gap-4">
        {steps.map((step, i) => {
          const state = i < currentIndex ? "completed" : i === currentIndex ? "current" : "upcoming";
          return (
            <li key={step.label} className="flex items-center gap-2 sm:gap-4">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={[
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium",
                    state === "completed" && "bg-success text-on-success",
                    state === "current" && "bg-accent text-on-accent",
                    state === "upcoming" && "bg-surface border border-border-default text-text-secondary",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {state === "completed" ? "✓" : i + 1}
                </div>
                <span
                  className={`hidden text-xs sm:block ${
                    state === "upcoming" ? "text-text-secondary" : "text-text-primary"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && <div className="h-px w-6 shrink-0 bg-border-default sm:w-10" />}
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
