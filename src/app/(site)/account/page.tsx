import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/Button";
import { requireUser } from "@/lib/auth/require";
import { isAdmin } from "@/lib/auth/session";
import { listBookingsForUser } from "@/lib/db/bookings-repository";
import { getRoomById } from "@/lib/rooms-data";
import { SITE } from "@/lib/site-config";
import { formatDateLong, formatUsd, nowInZone, timeRange } from "@/lib/format";
import { googleCalendarUrl } from "@/lib/calendar";
import { signOut } from "@/app/actions/auth";

export const metadata: Metadata = { title: "Your bookings", robots: { index: false, follow: false } };

const STATUS: Record<string, string> = { confirmed: "Confirmed", completed: "Completed", cancelled: "Cancelled" };
const rowLink = "inline-flex min-h-11 items-center text-text-accent underline underline-offset-4 hover:text-text-primary";

export default async function AccountPage(props: PageProps<"/account">) {
  const user = await requireUser("/account");
  const denied = (await props.searchParams).denied === "1";
  const bookings = listBookingsForUser(user.id, user.email);
  const today = nowInZone(SITE.timeZone).date;
  const upcoming = bookings.filter((b) => b.status === "confirmed" && b.date >= today).reverse();
  const past = bookings.filter((b) => !upcoming.includes(b));

  return (
    <main className="flex-1 px-6 pb-20 pt-12 sm:pb-24 sm:pt-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <div className="flex max-w-3xl flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
            <h1 className="type-page text-text-primary">Your bookings</h1>
            <div className="flex items-baseline gap-5 text-sm font-medium">
              {isAdmin(user) && (
                <Link href="/admin" className={rowLink}>
                  Admin
                </Link>
              )}
              <form action={signOut}>
                <button className="inline-flex min-h-11 items-center text-text-secondary underline underline-offset-4 hover:text-text-primary">
                  Sign out
                </button>
              </form>
            </div>
          </div>
          <p className="text-text-secondary">Signed in as {user.email}</p>
        </div>

        {denied && (
          <p role="alert" className="max-w-3xl rounded-token-sm border border-border-default bg-surface px-4 py-3 text-sm text-text-primary">
            That area is for studio staff. Your account doesn&rsquo;t have access.
          </p>
        )}

        <section className="flex max-w-3xl flex-col gap-4">
          <h2 className="type-subhead text-text-primary">Upcoming</h2>
          {upcoming.length === 0 ? (
            <div className="flex flex-col items-start gap-4">
              <p className="text-text-secondary">No upcoming bookings. Bookings made with {user.email} show up here.</p>
              <Button href="/#rooms">Find a room</Button>
            </div>
          ) : (
            <ul className="flex flex-col divide-y divide-border-subtle border-y border-border-subtle">
              {upcoming.map((b) => {
                const room = getRoomById(b.roomId);
                return (
                  <li key={b.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                    <div className="flex min-w-0 flex-col gap-1">
                      <p className="font-semibold text-text-primary">{room?.name ?? b.roomId}</p>
                      <p className="text-sm text-text-secondary">
                        {formatDateLong(b.date)}, <span className="tabular">{timeRange(b.startTime, b.endTime)}</span>
                      </p>
                      <p className="text-xs text-text-secondary">
                        Reference <span className="tabular break-all">{b.id}</span>
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-x-5 text-sm font-medium">
                      {room && (
                        <a href={googleCalendarUrl(b, room)} className={rowLink} target="_blank" rel="noopener noreferrer">
                          Google Calendar
                        </a>
                      )}
                      <a href={`/api/bookings/${b.id}/calendar`} className={rowLink}>
                        .ics
                      </a>
                      <Link href={`/confirmation/${b.id}`} className={rowLink}>
                        Details
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {past.length > 0 && (
          <section className="flex max-w-3xl flex-col gap-4">
            <h2 className="type-subhead text-text-primary">Past and cancelled</h2>
            <ul className="flex flex-col divide-y divide-border-subtle border-y border-border-subtle">
              {past.map((b) => (
                <li key={b.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3 text-sm">
                  <span className="text-text-primary">
                    {getRoomById(b.roomId)?.name ?? b.roomId} · {formatDateLong(b.date)}
                  </span>
                  <span className="text-text-secondary">
                    {STATUS[b.status] ?? b.status} · <span className="tabular">{formatUsd(b.priceCents)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="text-sm text-text-secondary">
          Need to change or cancel?{" "}
          <Link href="/contact" className="text-text-accent underline underline-offset-4">
            Contact the studio
          </Link>{" "}
          with your booking reference.
        </p>
      </div>
    </main>
  );
}
