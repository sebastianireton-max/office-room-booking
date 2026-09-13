import "server-only";
import { SITE, SITE_URL } from "@/lib/site-config";
import { generateIcs, googleCalendarUrl } from "@/lib/calendar";
import { formatDateLong, formatTime12h, formatUsd } from "@/lib/format";
import type { Booking, Room } from "@/types/domain";

/**
 * Booking confirmation email via Resend's HTTP API (no SDK, one fetch).
 * The booking form has always promised "We'll send your confirmation and
 * calendar invite here"; before this nothing was sent.
 * Needs RESEND_API_KEY and EMAIL_FROM (a sender on a domain verified in Resend).
 */
export const isEmailConfigured = () => Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);

const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function sendBookingConfirmation(booking: Booking, room: Room): Promise<boolean> {
  if (!isEmailConfigured()) {
    console.warn(`Email not configured; no confirmation sent for booking ${booking.id}.`);
    return false;
  }
  const when = `${formatDateLong(booking.date)}, ${formatTime12h(booking.startTime)} to ${formatTime12h(booking.endTime)}`;
  const link = `${SITE_URL}/confirmation/${booking.id}`;
  const html = `
    <div style="font-family:system-ui,sans-serif;color:#221e1a;max-width:520px">
      <p>Hi ${escape(booking.customerName)},</p>
      <p>You're booked into <strong>${escape(room.name)}</strong>.</p>
      <p style="font-size:18px;margin:16px 0"><strong>${escape(when)}</strong></p>
      <p>Total paid: ${formatUsd(booking.priceCents)}<br>Reference: ${booking.id}</p>
      <p>The calendar invite is attached. You can also
        <a href="${googleCalendarUrl(booking, room)}">add it to Google Calendar</a> or
        <a href="${link}">view your booking</a>.</p>
      <p>Questions? Reply to this email or write to ${escape(SITE.contactEmail)}.</p>
      <p>${escape(SITE.name)}</p>
    </div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [booking.customerEmail],
      reply_to: SITE.contactEmail,
      subject: `Booked: ${room.name}, ${formatDateLong(booking.date)}`,
      html,
      attachments: [{ filename: "booking.ics", content: Buffer.from(generateIcs(booking, room)).toString("base64") }],
    }),
  });
  if (!res.ok) console.error(`Resend rejected confirmation for ${booking.id}: ${res.status} ${await res.text()}`);
  return res.ok;
}
