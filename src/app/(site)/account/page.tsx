import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth/require";
import { isAdmin } from "@/lib/auth/session";
import { listBookingsForUser } from "@/lib/db/bookings-repository";
import { getRoomById } from "@/lib/rooms-data";
import { SITE } from "@/lib/site-config";
import { formatDateLong, formatTime12h, formatUsd, nowInZone } from "@/lib/format";
import { googleCalendarUrl } from "@/lib/calendar";
import { signOut } from "@/app/actions/auth";

export const metadata: Metadata = { title: "Your bookings", robots: { index: false, follow: false } };

const STATUS: Record<string, string> = { confirmed: "Confirmed", completed: "Completed", cancelled: "Cancelled" };

export default async function AccountPage(props: PageProps<"/account">) {
  const user = await requireUser("/account");
  const denied = (await props.searchParams).denied === "1";
  const bookings = listBookingsForUser(user.id, user.email);
  const today = nowInZone(SITE.timeZone).date;
  const upcoming = bookings.filter((b) => b.status === "confirmed" && b.date >= today).reverse();
  const past = bookings.filter((b) => !upcoming.includes(b));

  return (
    <main className="flex-1 px-6 py-14">
      <div className="mx-auto flex max-w-3xl flex-col gap-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="font-display text-5xl font-semibold text-text-primary">Your bookings</h1>
            <p className="text-text-secondary">Signed in as {user.email}</p>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin(user) && (
              <Link href="/admin" className="inline-flex min-h-11 items-center rounded-token-full border border-border-default px-5 text-sm font-medium text-text-primary hover:border-border-accent">
                Admin
              </Link>
            )}
            <form action={signOut}>
              <button className="inline-flex min-h-11 items-center px-3 text-sm font-medium text-text-secondary underline underline-offset-4 hover:text-text-primary">
                Sign out
              </button>
            </form>
          </div>
        </div>

        {denied && (
          <p role="alert" className="rounded-token-sm border border-border-default bg-surface px-4 py-3 text-sm text-text-primary">
            That area is for studio staff. Your account doesn&apos;t have access.
          </p>
        )}

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-text-primary">Upcoming</h2>
          {upcoming.length === 0 ? (
            <div className="flex flex-col items-start gap-3 rounded-token-md bg-surface p-6">
              <p className="text-text-secondary">Nothing booked yet. Bookings made with {user.email} show up here.</p>
              <Link href="/#find" className="inline-flex min-h-11 items-center rounded-token-full bg-accent px-5 text-sm font-semibold text-on-accent hover:bg-accent-hover">
                Find a room
              </Link>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {upcoming.map((b) => {
                const room = getRoomById(b.roomId);
                return (
                  <li key={b.id} className="flex flex-col gap-3 rounded-token-md border border-border-subtle bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col gap-1">
                      <p className="font-semibold text-text-primary">{room?.name ?? b.roomId}</p>
                      <p className="tabular text-sm text-text-secondary">
                        {formatDateLong(b.date)}, {formatTime12h(b.startTime)} to {formatTime12h(b.endTime)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm font-medium">
                      {room && (
                        <a href={googleCalendarUrl(b, room)} className="text-text-accent hover:underline" target="_blank" rel="noopener noreferrer">
                          Google Calendar
                        </a>
                      )}
                      <a href={`/api/bookings/${b.id}/calendar`} className="text-text-accent hover:underline">
                        .ics
                      </a>
                      <Link href={`/confirmation/${b.id}`} className="text-text-accent hover:underline">
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
          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-text-primary">Past and cancelled</h2>
            <ul className="flex flex-col divide-y divide-border-subtle border-y border-border-subtle">
              {past.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                  <span className="text-text-primary">
                    {getRoomById(b.roomId)?.name ?? b.roomId} · {formatDateLong(b.date)}
                  </span>
                  <span className="tabular text-text-secondary">
                    {STATUS[b.status] ?? b.status} · {formatUsd(b.priceCents)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="text-sm text-text-secondary">
          Need to change or cancel? <Link href="/contact" className="text-text-accent hover:underline">Contact the studio</Link> with the room and date.
        </p>
      </div>
    </main>
  );
}
