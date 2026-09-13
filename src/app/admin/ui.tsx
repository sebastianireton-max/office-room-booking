import type { BookingStatus } from "@/types/domain";

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
  if (issue) return <span className="rounded-token-full bg-error px-2.5 py-0.5 text-xs font-semibold text-on-success">Needs refund</span>;
  const tone =
    status === "confirmed"
      ? "bg-success text-on-success"
      : status === "pending_payment"
        ? "bg-warning text-on-success"
        : "border border-border-default text-text-secondary";
  return <span className={`rounded-token-full px-2.5 py-0.5 text-xs font-semibold ${tone}`}>{LABEL[status]}</span>;
}

export const inputClass =
  "min-h-11 rounded-token-sm border border-border-default bg-surface px-3 text-sm text-text-primary";
export const primaryButton =
  "inline-flex min-h-11 items-center justify-center rounded-token-full bg-accent px-5 text-sm font-semibold text-on-accent hover:bg-accent-hover";
export const secondaryButton =
  "inline-flex min-h-11 items-center justify-center rounded-token-full border border-border-default bg-surface px-5 text-sm font-semibold text-text-primary hover:border-border-accent";
