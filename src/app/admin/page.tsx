import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require";
import { adminStats, bookingsOnDate, listBookings } from "@/lib/db/bookings-repository";
import { ROOMS, getRoomById } from "@/lib/rooms-data";
import { SITE, SITE_URL } from "@/lib/site-config";
import { formatTime12h, formatUsd, formatDateLong, nowInZone } from "@/lib/format";
import { isStripeConfigured } from "@/lib/stripe";
import { isEmailConfigured } from "@/lib/email";
import { BOOKING_CONFIG } from "@/types/domain";
import { StatusPill } from "./ui";

export const metadata = { title: "Today" };

function setupChecks() {
  const env = process.env;
  return [
    { ok: isStripeConfigured() && Boolean(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY), label: "Stripe keys", fix: "Set STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY. Without them nobody can pay." },
    { ok: Boolean(env.STRIPE_WEBHOOK_SECRET), label: "Stripe webhook", fix: `Add a webhook to ${SITE_URL}/api/webhooks/stripe (payment_intent.succeeded, payment_intent.payment_failed, payment_intent.canceled, charge.refunded) and set STRIPE_WEBHOOK_SECRET. Without it no booking ever confirms.` },
    { ok: isEmailConfigured(), label: "Confirmation email", fix: "Set RESEND_API_KEY and EMAIL_FROM (a sender on a domain verified in Resend). Customers get no confirmation email until then." },
    { ok: !SITE_URL.includes("localhost"), label: "Public site URL", fix: "Set NEXT_PUBLIC_SITE_URL to the real https domain. Canonical links, the sitemap and Google sign-in all use it." },
    { ok: Boolean(env.GOOGLE_SITE_VERIFICATION), label: "Google Search Console", fix: "Add the site in Search Console, choose the HTML tag method, and put the content value in GOOGLE_SITE_VERIFICATION. Then submit /sitemap.xml." },
    { ok: !SITE.contactEmail.endsWith(".example") && !SITE.phone.includes("000-0000"), label: "Business contact details", fix: "Replace the placeholder email, phone and address in src/lib/site-config.ts. They also feed Google's business listing data." },
  ];
}

export default async function AdminHome() {
  await requireAdmin();
  const today = nowInZone(SITE.timeZone).date;
  const stats = adminStats(today);
  const todays = bookingsOnDate(today);
  const issues = listBookings({ status: "issue" }, 20);
  const checks = setupChecks();
  const failing = checks.filter((c) => !c.ok);
  const hours = Array.from({ length: BOOKING_CONFIG.operatingEndHour - BOOKING_CONFIG.operatingStartHour }, (_, i) => BOOKING_CONFIG.operatingStartHour + i);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-4xl font-semibold text-text-primary">Today</h1>
        <p className="text-text-secondary">{formatDateLong(today)}</p>
      </div>

      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-token-md border border-border-subtle bg-border-subtle lg:grid-cols-4">
        {[
          ["Booked today", String(stats.todayCount)],
          ["Upcoming", String(stats.upcomingCount)],
          ["Revenue this month", formatUsd(stats.monthRevenueCents)],
          ["Need a refund", String(stats.issueCount)],
        ].map(([k, v]) => (
          <div key={k} className="flex flex-col gap-1 bg-surface p-5">
            <dt className="text-sm text-text-secondary">{k}</dt>
            <dd className={`tabular text-3xl font-semibold ${k === "Need a refund" && v !== "0" ? "text-error" : "text-text-primary"}`}>{v}</dd>
          </div>
        ))}
      </dl>

      {issues.length > 0 && (
        <section className="flex flex-col gap-3 rounded-token-md border border-error p-5">
          <h2 className="font-semibold text-error">Charged but not booked</h2>
          <p className="text-sm text-text-secondary">
            These customers paid after their hold ran out, so the slot was not given to them. Refund or rebook each one.
          </p>
          <ul className="flex flex-col divide-y divide-border-subtle">
            {issues.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-4 py-2 text-sm">
                <span>{b.customerName} · {getRoomById(b.roomId)?.name} · {b.date}</span>
                <Link href={`/admin/bookings/${b.id}`} className="font-medium text-text-accent hover:underline">Resolve</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-semibold text-text-primary">Schedule</h2>
          <Link href={`/admin/bookings?from=${today}`} className="text-sm font-medium text-text-accent hover:underline">All upcoming</Link>
        </div>
        <div className="overflow-x-auto rounded-token-md border border-border-subtle">
          <table className="w-full min-w-[56rem] border-collapse text-sm">
            <thead>
              <tr className="bg-surface">
                <th className="w-44 border-b border-border-subtle p-3 text-left font-medium text-text-secondary">Room</th>
                {hours.map((h) => (
                  <th key={h} className="tabular border-b border-l border-border-subtle p-2 text-left text-xs font-normal text-text-secondary">
                    {formatTime12h(`${String(h).padStart(2, "0")}:00`).replace(":00", "")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROOMS.filter((r) => r.active).map((room) => {
                const cells = hours.map((h) => {
                  const hhmm = `${String(h).padStart(2, "0")}:00`;
                  return todays.find((b) => b.roomId === room.id && b.startTime <= hhmm && b.endTime > hhmm);
                });
                return (
                  <tr key={room.id}>
                    <th scope="row" className="border-b border-border-subtle p-3 text-left font-medium text-text-primary">{room.name}</th>
                    {cells.map((b, i) => (
                      <td key={i} className="h-12 border-b border-l border-border-subtle p-0.5">
                        {b && (
                          <Link
                            href={`/admin/bookings/${b.id}`}
                            title={`${b.customerName}, ${formatTime12h(b.startTime)} to ${formatTime12h(b.endTime)}`}
                            className={`block h-full truncate rounded-[6px] px-1.5 py-1 text-xs ${b.status === "confirmed" ? "bg-accent text-on-accent" : "bg-surface-raised text-text-secondary"}`}
                          >
                            {b.startTime === `${String(hours[i]).padStart(2, "0")}:00` ? b.customerName.split(" ")[0] : ""}
                          </Link>
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {todays.length > 0 && (
          <ul className="flex flex-col divide-y divide-border-subtle border-y border-border-subtle">
            {todays.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <span className="tabular w-40 text-text-primary">{formatTime12h(b.startTime)} to {formatTime12h(b.endTime)}</span>
                <span className="flex-1 text-text-primary">{getRoomById(b.roomId)?.name} · {b.customerName}</span>
                <StatusPill status={b.status} />
                <Link href={`/admin/bookings/${b.id}`} className="font-medium text-text-accent hover:underline">Open</Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-text-primary">
          Setup {failing.length === 0 ? "complete" : `· ${failing.length} of ${checks.length} still to do`}
        </h2>
        <ul className="flex flex-col divide-y divide-border-subtle border-y border-border-subtle">
          {checks.map((c) => (
            <li key={c.label} className="flex gap-4 py-3 text-sm">
              <span className={`tabular w-10 shrink-0 font-semibold ${c.ok ? "text-text-accent" : "text-error"}`}>{c.ok ? "OK" : "TODO"}</span>
              <div className="flex flex-col gap-0.5">
                <span className="font-medium text-text-primary">{c.label}</span>
                {!c.ok && <span className="text-text-secondary">{c.fix}</span>}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
