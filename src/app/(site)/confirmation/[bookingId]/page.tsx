"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/Button";
import { formatDateLong, formatTime12h, formatUsd } from "@/lib/format";
import { googleCalendarUrl, outlookCalendarUrl } from "@/lib/calendar-links";
import { SITE } from "@/lib/site-config";
import type { PublicBooking } from "@/lib/public-booking";
import type { Room } from "@/types/domain";

type Status = "loading" | "processing" | "slow" | "confirmed" | "not-found" | "unconfirmed" | "error";

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

        if (data.booking.status === "confirmed") return setStatus("confirmed");
        if (data.booking.status === "pending_payment") {
          if (attempts < 12) {
            setStatus("processing");
            setTimeout(poll, 1500);
          } else setStatus("slow");
          return;
        }
        setStatus("unconfirmed");
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  const shell = (children: React.ReactNode) => (
    <main className="flex flex-1 items-center justify-center px-6 py-20">
      <div className="flex w-full max-w-lg flex-col gap-4">{children}</div>
    </main>
  );
  const contact = (
    <a href={`mailto:${SITE.contactEmail}?subject=Booking ${bookingId}`} className="font-medium text-text-accent hover:underline">
      {SITE.contactEmail}
    </a>
  );

  if (status === "loading" || status === "processing") {
    return shell(
      <div className="flex items-center gap-3" role="status">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-border-default border-t-accent motion-reduce:animate-none" />
        <p className="text-text-secondary">Confirming your payment. Keep this page open.</p>
      </div>
    );
  }
  if (status === "slow") {
    return shell(
      <>
        <h1 className="font-display text-4xl font-semibold text-text-primary">Payment is still processing</h1>
        <p className="text-text-secondary">
          Some cards take a little longer. Your slot is held while it completes, and the confirmation email arrives as soon as it
          does. Refresh this page in a minute, or write to {contact} with reference {bookingId}.
        </p>
      </>
    );
  }
  if (status === "not-found") {
    return shell(
      <>
        <h1 className="font-display text-4xl font-semibold text-text-primary">Booking not found</h1>
        <p className="text-text-secondary">Check the link from your email. If you just paid, refresh in a few seconds.</p>
        <Button href="/" className="w-fit">Back to rooms</Button>
      </>
    );
  }
  if (status !== "confirmed" || !booking || !room) {
    // Not "your card was not charged": in the lapsed-hold case it was, and the
    // studio has been flagged to refund or rebook.
    return shell(
      <>
        <h1 className="font-display text-4xl font-semibold text-text-primary">This booking isn&apos;t confirmed</h1>
        <p className="text-text-secondary">
          The hold on this slot ended before payment completed. If you were charged, the studio has been alerted and will refund
          or rebook you. Questions: {contact}, reference {bookingId}.
        </p>
        <Button href="/#find" className="w-fit">Find another time</Button>
      </>
    );
  }

  return shell(
    <>
      <p className="tabular text-sm text-text-accent">Confirmed</p>
      <h1 className="font-display text-5xl font-semibold leading-[1] text-text-primary">You&apos;re booked.</h1>
      <div className="flex flex-col gap-1 border-y border-border-subtle py-5">
        <p className="text-xl font-semibold text-text-primary">{room.name}</p>
        <p className="tabular text-text-primary">
          {formatDateLong(booking.date)}, {formatTime12h(booking.startTime)} to {formatTime12h(booking.endTime)}
        </p>
        <p className="tabular text-sm text-text-secondary">
          Paid {formatUsd(booking.priceCents)} · Ref {booking.id.slice(0, 8)}
        </p>
      </div>
      <p className="text-sm text-text-secondary">Add it to your calendar now; the confirmation email carries the same invite.</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button variant="secondary" href={googleCalendarUrl(booking, room)} className="flex-1">
          Google Calendar
        </Button>
        <Button variant="secondary" href={outlookCalendarUrl(booking, room)} className="flex-1">
          Outlook
        </Button>
        <a
          href={`/api/bookings/${booking.id}/calendar`}
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-token-full border border-border-default bg-surface px-6 text-sm font-semibold text-text-primary hover:border-border-accent hover:text-text-accent"
        >
          Apple / .ics
        </a>
      </div>
      <div className="flex gap-6 pt-2 text-sm">
        <Link href="/account" className="text-text-secondary hover:text-text-primary hover:underline">Your bookings</Link>
        <Link href="/" className="text-text-secondary hover:text-text-primary hover:underline">Back to rooms</Link>
      </div>
    </>
  );
}
