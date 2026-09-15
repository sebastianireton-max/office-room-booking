import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require";
import { getBookingById } from "@/lib/db/bookings-repository";
import { getRoomById } from "@/lib/rooms-data";
import { formatDateLong, formatTime12h, formatUsd } from "@/lib/format";
import { isStripeConfigured } from "@/lib/stripe";
import { cancelBookingAction, dismissIssueAction, refundIssueAction, resendConfirmationAction } from "../../actions";
import { buttonClass } from "@/components/Button";
import { Flash, StatusPill, inputClass } from "../../ui";
import { ISSUE_LABEL } from "../../filters";

export const metadata = { title: "Booking" };

export default async function AdminBookingDetail(props: PageProps<"/admin/bookings/[id]">) {
  const { id } = await props.params;
  await requireAdmin(`/admin/bookings/${id}`);
  const sp = await props.searchParams;
  const b = getBookingById(id);
  if (!b) notFound();
  const room = getRoomById(b.roomId);
  const cancellable = b.status === "confirmed" || b.status === "pending_payment";
  const canRefund = Boolean(b.stripePaymentIntentId) && isStripeConfigured() && !b.stripeRefundId;
  const dashboard = b.stripePaymentIntentId ? `https://dashboard.stripe.com/payments/${b.stripePaymentIntentId}` : null;

  const rows: [string, React.ReactNode][] = [
    ["Room", room?.name ?? b.roomId],
    ["When", `${formatDateLong(b.date)}, ${formatTime12h(b.startTime)} to ${formatTime12h(b.endTime)}`],
    ["Total", formatUsd(b.priceCents)],
    ["Customer", b.customerName],
    ["Email", <a key="e" href={`mailto:${b.customerEmail}`} className="text-text-accent hover:underline">{b.customerEmail}</a>],
    ["Phone", b.customerPhone ?? "Not given"],
    ["Signed in", b.userId ? "Yes (Google)" : "No, guest"],
    ["Confirmation email", b.confirmationSentAt ? `Sent ${new Date(b.confirmationSentAt).toLocaleString("en-US")}` : "Not sent"],
    ["Stripe payment", dashboard ? <a key="s" href={dashboard} target="_blank" rel="noopener noreferrer" className="text-text-accent hover:underline">{b.stripePaymentIntentId}</a> : "None"],
    ["Refund", b.stripeRefundId ?? "None"],
    ["Reference", <span key="r" className="tabular">{b.id}</span>],
    ["Created", new Date(b.createdAt).toLocaleString("en-US")],
  ];

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <Link href="/admin/bookings" className="text-sm text-text-secondary hover:text-text-primary">← All bookings</Link>
      <Flash sp={sp} />
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="font-display text-4xl font-semibold text-text-primary">{b.customerName}</h1>
        <StatusPill status={b.status} issue={b.paymentIssue} />
      </div>

      {b.paymentIssue && (
        <section className="flex flex-col gap-4 rounded-token-md border border-error p-5">
          <h2 className="font-semibold text-error">{ISSUE_LABEL}</h2>
          <p className="text-sm text-text-secondary">{b.paymentIssue} Refund them, or check the room is still free and rebook them by hand.</p>
          <div className="flex flex-wrap gap-3">
            {canRefund && (
              <form action={refundIssueAction}>
                <input type="hidden" name="id" value={b.id} />
                <button className={buttonClass("danger")}>
                  Refund {formatUsd(b.priceCents)}
                </button>
              </form>
            )}
            <form action={dismissIssueAction} className="flex flex-wrap gap-2">
              <input type="hidden" name="id" value={b.id} />
              <input name="note" placeholder="How it was handled (optional)" aria-label="Note" className={inputClass} />
              <button className={buttonClass("secondary")}>Mark handled</button>
            </form>
          </div>
        </section>
      )}

      <dl className="grid grid-cols-1 border-t border-border-subtle sm:grid-cols-[12rem_1fr]">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="border-b border-border-subtle py-3 text-sm text-text-secondary sm:pr-4">{k}</dt>
            <dd className="border-b border-border-subtle py-3 text-sm text-text-primary break-all">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-col gap-6">
        {b.status === "confirmed" && (
          <form action={resendConfirmationAction}>
            <input type="hidden" name="id" value={b.id} />
            <button className={buttonClass("secondary")}>Resend confirmation email</button>
          </form>
        )}

        {cancellable && (
          <form action={cancelBookingAction} className="flex flex-col gap-3 rounded-token-md border border-border-default p-5">
            <input type="hidden" name="id" value={b.id} />
            <h2 className="font-semibold text-text-primary">Cancel this booking</h2>
            <p className="text-sm text-text-secondary">The slot opens for other customers straight away. The customer is not emailed automatically.</p>
            {canRefund && b.status === "confirmed" && (
              <label className="flex min-h-11 items-center gap-3 text-sm text-text-primary">
                <input type="checkbox" name="refund" defaultChecked className="h-5 w-5 accent-[var(--color-bg-accent)]" />
                Also refund {formatUsd(b.priceCents)} in full through Stripe
              </label>
            )}
            <button className={`${buttonClass("danger-outline")} w-fit`}>
              Cancel booking
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
