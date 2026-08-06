"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/Button";
import { formatDateLong, formatTime12h, formatUsd } from "@/lib/format";
import type { Booking, Room } from "@/types/domain";

type Status = "loading" | "processing" | "confirmed" | "not-found" | "error";

export default function ConfirmationPage(props: PageProps<"/confirmation/[bookingId]">) {
  const { bookingId } = use(props.params);
  const [status, setStatus] = useState<Status>("loading");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [room, setRoom] = useState<Room | null>(null);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    async function poll() {
      attempts += 1;
      try {
        const res = await fetch(`/api/bookings/${bookingId}`);
        if (res.status === 404) {
          if (!cancelled) setStatus("not-found");
          return;
        }
        if (!res.ok) throw new Error("failed");
        const data = await res.json();
        if (cancelled) return;

        setBooking(data.booking);
        setRoom(data.room);

        if (data.booking.status === "confirmed") {
          setStatus("confirmed");
          return;
        }
        if (data.booking.status === "pending_payment" && attempts < 10) {
          setStatus("processing");
          setTimeout(poll, 1500);
        } else if (data.booking.status === "pending_payment") {
          // Stopped polling after ~15s — the webhook may just be slow.
          setStatus("processing");
        } else {
          setStatus("error");
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  if (status === "loading" || status === "processing") {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-24">
        <div className="flex max-w-md flex-col items-center gap-3 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border-default border-t-accent" />
          <p className="text-text-secondary">Processing your payment — don&apos;t close this window.</p>
        </div>
      </main>
    );
  }

  if (status === "not-found") {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-24">
        <div className="flex max-w-md flex-col items-center gap-3 text-center">
          <h1 className="text-2xl font-semibold text-text-primary">Booking not found</h1>
          <p className="text-text-secondary">
            We couldn&apos;t find that booking. If you just paid, refresh this page in a few seconds.
          </p>
          <Button href="/" className="mt-2">
            Back to rooms
          </Button>
        </div>
      </main>
    );
  }

  if (status === "error" || !booking || !room) {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-24">
        <div className="flex max-w-md flex-col items-center gap-3 text-center">
          <h1 className="text-2xl font-semibold text-text-primary">Something went wrong</h1>
          <p className="text-text-secondary">
            Something went wrong saving your booking. Your card has not been charged — please try again, or
            contact us with reference #{bookingId}.
          </p>
          <Button href="/" className="mt-2">
            Back to rooms
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="flex w-full max-w-lg flex-col gap-6 rounded-token-lg bg-surface p-8 text-center shadow-[var(--shadow-medium)]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success text-2xl text-on-accent">
          ✓
        </div>
        <h1 className="text-3xl font-semibold tracking-[-0.5px] text-text-primary">You&apos;re booked!</h1>
        <p className="text-text-secondary">
          {room.name} · {formatDateLong(booking.date)} · {formatTime12h(booking.startTime)}–
          {formatTime12h(booking.endTime)}
        </p>
        <p className="text-sm text-text-secondary">
          Total paid {formatUsd(booking.priceCents)} · Reference #{booking.id}
        </p>

        <div className="flex flex-col gap-3 border-t border-border-subtle pt-6">
          <p className="text-sm font-medium text-text-primary">Add to your calendar</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="secondary"
              href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
                `${room.name} — Booking Confirmation`
              )}&dates=${booking.date.replaceAll("-", "")}T${booking.startTime.replace(
                ":",
                ""
              )}00/${booking.date.replaceAll("-", "")}T${booking.endTime.replace(":", "")}00`}
              className="flex-1"
            >
              Add to Google Calendar
            </Button>
            <Button
              variant="secondary"
              href={`https://outlook.live.com/calendar/0/deeplink/compose?path=%2Fcalendar%2Faction%2Fcompose&rru=addevent&subject=${encodeURIComponent(
                `${room.name} — Booking Confirmation`
              )}`}
              className="flex-1"
            >
              Add to Outlook
            </Button>
          </div>
          <a
            href={`/api/bookings/${booking.id}/calendar`}
            className="text-sm font-medium text-text-accent hover:underline"
          >
            Download .ics
          </a>
        </div>

        <Link href="/" className="text-sm text-text-secondary hover:text-text-primary hover:underline">
          Back to rooms
        </Link>
      </div>
    </main>
  );
}
