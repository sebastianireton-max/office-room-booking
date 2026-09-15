import type { BookingStatus } from "@/types/domain";
import { ISSUE_LABEL } from "./filters";

export function Flash({ sp }: { sp: Record<string, string | string[] | undefined> }) {
  const notice = typeof sp.notice === "string" ? sp.notice : null;
  const error = typeof sp.error === "string" ? sp.error : null;
  if (!notice && !error) return null;
  return (
    <p
      role={error ? "alert" : "status"}
      className={`mb-6 rounded-token-sm border px-4 py-3 text-sm ${error ? "border-error text-error" : "border-border-default bg-surface text-text-primary"}`}
    >
      {error ?? notice}
    </p>
  );
}

const LABEL: Record<BookingStatus, string> = {
  confirmed: "Confirmed",
  pending_payment: "Awaiting payment",
  cancelled: "Cancelled",
  completed: "Completed",
  expired: "Expired",
};

export function StatusPill({ status, issue }: { status: BookingStatus; issue?: string | null }) {
  const pill = "whitespace-nowrap rounded-token-full px-2.5 py-0.5 text-xs font-semibold";
  if (issue) return <span className={`${pill} bg-error text-on-status`}>{ISSUE_LABEL}</span>;
  const tone =
    status === "confirmed"
      ? "bg-success text-on-status"
      : status === "pending_payment"
        ? "bg-warning text-on-status"
        : "border border-border-default text-text-secondary";
  return <span className={`${pill} ${tone}`}>{LABEL[status]}</span>;
}

// Placeholder uses text-secondary: preflight's 50% ink measured 3.23:1 on surface.
export const inputClass =
  "min-h-11 rounded-token-sm border border-border-default bg-surface px-3 text-sm text-text-primary placeholder:text-text-secondary";
