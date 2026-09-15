import "server-only";
import { SITE, SITE_URL } from "@/lib/site-config";
import { generateIcs, googleCalendarUrl } from "@/lib/calendar";
import { formatDateLong, formatTime12h, formatUsd } from "@/lib/format";
import type { Booking, Room } from "@/types/domain";

/**
 * Booking confirmation email via Resend's HTTP API (no SDK, one fetch).
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
  const { line1, line2, city, region, zip } = SITE.address;
  const html = `
    <div style="font-family:system-ui,sans-serif;color:#221e1a;max-width:520px">
      <p>Hi ${escape(booking.customerName)},</p>
      <p>You're booked into <strong>${escape(room.name)}</strong>.</p>
      <p style="font-size:18px;margin:16px 0"><strong>${escape(when)}</strong></p>
      <p>Total paid: ${formatUsd(booking.priceCents)}<br>Reference: ${booking.id.slice(0, 8)}</p>
      <p><strong>Where to go</strong><br>
        ${escape(SITE.name)}<br>${escape(line1)}, ${escape(line2)}<br>${escape(`${city}, ${region} ${zip}`)}<br>
        ${escape(SITE.phone)} · ${escape(SITE.contactEmail)}</p>
      <p>The calendar invite is attached. You can also
        <a href="${googleCalendarUrl(booking, room)}">add it to Google Calendar</a> or
        <a href="${link}">view your booking</a>.</p>
      <p>Questions? Reply to this email.</p>
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
    signal: AbortSignal.timeout(8000),
  });
  // Status only: an error body can echo request fields, including the customer's address.
  if (!res.ok) console.error(`Resend rejected confirmation for ${booking.id}: ${res.status}`);
  return res.ok;
}
