"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/Button";
import { formatDateShort, formatUsd, timeRange, zoneAbbrev, zoneLabel } from "@/lib/format";
import { googleCalendarUrl, outlookCalendarUrl } from "@/lib/calendar-links";
import { SITE } from "@/lib/site-config";
import type { PublicBooking } from "@/lib/public-booking";
import type { BookingStatus, Room } from "@/types/domain";

type Status = "loading" | "processing" | "slow" | "not-found" | "error" | Exclude<BookingStatus, "pending_payment">;

export default function ConfirmationPage(props: PageProps<"/confirmation/[bookingId]">) {
  const { bookingId } = use(props.params);
  const [status, setStatus] = useState<Status>("loading");
  const [booking, setBooking] = useState<PublicBooking | null>(null);
  const [room, setRoom] = useState<Room | null>(null);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    async function poll() {
      attempts += 1;
      try {
        const res = await fetch(`/api/bookings/${bookingId}`);
        if (cancelled) return;
        if (res.status === 404) return setStatus("not-found");
        if (!res.ok) throw new Error("failed");
        const data = await res.json();
        if (cancelled) return;
        setBooking(data.booking);
        setRoom(data.room);

        if (data.booking.status === "pending_payment") {
          if (attempts < 12) {
            setStatus("processing");
            setTimeout(poll, 1500);
          } else setStatus("slow");
          return;
        }
        setStatus(data.booking.status);
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  const ref = bookingId.slice(0, 8);
  const shell = (children: React.ReactNode) => (
    <main className="flex flex-1 justify-center px-4 pt-12 pb-20 sm:px-6 sm:pt-16 sm:pb-24">
      <div className="flex w-full max-w-xl flex-col gap-5">{children}</div>
    </main>
  );
  const contact = (
    <a href={`mailto:${SITE.contactEmail}?subject=Booking ${ref}`} className="font-medium text-text-accent underline underline-offset-4">
      {SITE.contactEmail}
    </a>
  );
  const message = (title: string, body: React.ReactNode, cta = true) =>
    shell(
      <>
        <h1 className="type-page text-text-primary [text-wrap:balance]">{title}</h1>
        <p className="max-w-[62ch] text-text-secondary">{body}</p>
        {cta && (
          <Button href="/#rooms" size="lg" className="w-fit">
            See open times
          </Button>
        )}
      </>
    );

  if (status === "loading" || status === "processing") {
    // Skeleton in the shape of the confirmed card, not a spinner.
    return shell(
      <div role="status" className="flex flex-col gap-4">
        <p className="text-sm text-text-secondary">Confirming your payment. Keep this page open.</p>
        <div className="h-12 w-3/4 animate-pulse rounded-token-sm bg-surface-raised motion-reduce:animate-none" />
        <div className="flex flex-col gap-2 border-y border-border-subtle py-5">
          <div className="h-9 w-2/3 animate-pulse rounded-token-sm bg-surface-raised motion-reduce:animate-none" />
          <div className="h-5 w-1/2 animate-pulse rounded-token-sm bg-surface-raised motion-reduce:animate-none" />
        </div>
        <div className="h-11 animate-pulse rounded-token-full bg-surface-raised motion-reduce:animate-none" />
      </div>
    );
  }
  if (status === "slow") {
    return message(
      "Payment is still processing",
      <>
        Some cards take a little longer. Your slot is held while it completes, and the confirmation email arrives as soon as it
        does. Refresh this page in a minute, or write to {contact} with reference <span className="tabular">{ref}</span>.
      </>,
      false
    );
  }
  if (status === "not-found") {
    return message("Booking not found", "Check the link from your email. If you just paid, refresh in a few seconds.");
  }
  if (status === "error") {
    return message(
      "We couldn’t load this booking",
      <>
        Refresh the page to try again. If it keeps happening, write to {contact} with reference{" "}
        <span className="tabular">{ref}</span>.
      </>,
      false
    );
  }
  if (status === "cancelled") {
    return message(
      "This booking was cancelled",
      <>
        If a refund was issued, it goes back to the card you paid with. Questions: {contact}, reference{" "}
        <span className="tabular">{ref}</span>.
      </>
    );
  }
  if (status === "completed") {
    return message("This booking has already taken place", <>Questions: {contact}, reference <span className="tabular">{ref}</span>.</>);
  }
  if (status !== "confirmed" || !booking || !room) {
    // Expired, including a hold that lapsed and was paid anyway (payment_issue).
    return message(
      "This booking isn’t confirmed",
      <>
        The hold on this slot ended before payment went through. If your card was charged anyway, email {contact} with reference{" "}
        <span className="tabular">{ref}</span> and we will refund or rebook you.
      </>
    );
  }

  const { line1, line2, city, region, zip } = SITE.address;
  return shell(
    <>
      {/* Not text-success: that green measures 4.48:1 as small text on the canvas. */}
      <p className="text-sm font-semibold text-text-primary">Confirmed</p>
      <h1 className="type-page text-text-primary [text-wrap:balance]">{room.name}</h1>
      <div className="flex flex-col gap-2 border-y border-border-subtle py-5">
        <p className="text-[2rem] font-semibold leading-tight tabular-nums text-text-primary sm:text-4xl">
          {formatDateShort(booking.date)}
          <br />
          {timeRange(booking.startTime, booking.endTime)}
        </p>
        <p className="text-sm text-text-secondary">
          {zoneLabel(SITE.timeZone)} ({zoneAbbrev(SITE.timeZone, booking.date)})
        </p>
        <p className="tabular text-sm text-text-secondary">
          Paid {formatUsd(booking.priceCents)} · Ref {ref}
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <h2 className="type-subhead text-text-primary">Where to go</h2>
        <address className="not-italic text-text-secondary">
          {SITE.name}
          <br />
          {line1}, {line2}
          <br />
          {city}, {region} {zip}
        </address>
        <p className="text-text-secondary">
          <a href={`tel:${SITE.phone}`} className="text-text-accent underline underline-offset-4">{SITE.phone}</a>
          {" · "}
          {contact}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-sm text-text-secondary">Add it to your calendar now; the confirmation email carries the same invite.</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="secondary" href={googleCalendarUrl(booking, room)} external className="flex-1">
            Google Calendar
          </Button>
          <Button variant="secondary" href={outlookCalendarUrl(booking, room)} external className="flex-1">
            Outlook
          </Button>
          <Button variant="secondary" href={`/api/bookings/${booking.id}/calendar`} download className="flex-1">
            Apple / .ics
          </Button>
        </div>
      </div>
      <div className="flex gap-6 pt-2 text-sm">
        <Link href="/account" className="inline-flex min-h-11 items-center text-text-secondary hover:text-text-primary hover:underline">
          Your bookings
        </Link>
        <Link href="/#rooms" className="inline-flex min-h-11 items-center text-text-secondary hover:text-text-primary hover:underline">
          Back to rooms
        </Link>
      </div>
    </>
  );
}
