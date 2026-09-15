import type { InputHTMLAttributes } from "react";
import { useId } from "react";

/**
 * Mirrors the Figma Input Field component (node 7:31). Error state renders
 * the message as text, not color alone (design package Section 8.6 #4), and
 * every input has a programmatically associated <label> (Section 8.6 #3).
 */
interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export function InputField({ label, error, hint, id, className = "", ...rest }: InputFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-text-primary">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
        className={[
          "min-h-11 rounded-token-sm bg-surface px-3.5 py-2.5 text-base text-text-primary placeholder:text-text-secondary",
          "border transition-colors focus-visible:outline-none",
          error ? "border-error" : "border-border-default focus:border-border-accent",
          className,
        ].join(" ")}
        {...rest}
      />
      {hint && !error && (
        <p id={hintId} className="text-xs text-text-secondary">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs text-error">
          {error}
        </p>
      )}
    </div>
  );
}
