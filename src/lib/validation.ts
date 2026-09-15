import { z } from "zod";

/**
 * Server-side input validation for every API route. Client-side validation
 * is a UX convenience only — this is the real security boundary.
 */

export const availabilityQuerySchema = z.object({
  roomId: z.string().min(1).max(64),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  durationMinutes: z.coerce.number().int().min(30).max(480),
});

const NAME = "Enter your name.";
const EMAIL = "Enter an email like name@example.com.";

// Customer field messages are shown next to the form fields, so they are plain English.
export const createHoldSchema = z.object({
  roomId: z.string().min(1).max(64),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "startTime must be HH:mm"),
  durationMinutes: z.coerce.number().int().min(30).max(480),
  customerName: z.string({ error: NAME }).trim().min(1, NAME).max(200, "Use 200 characters or fewer."),
  customerEmail: z.string({ error: EMAIL }).trim().email(EMAIL).max(320, EMAIL),
  customerPhone: z
    .string({ error: "Enter a phone number, or leave it blank." })
    .trim()
    .max(40, "Use 40 characters or fewer.")
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
});

export const CUSTOMER_FIELDS = ["customerName", "customerEmail", "customerPhone"] as const;

/** Correcting name/email/phone on a live hold, without giving up the slot. */
export const updateHoldSchema = createHoldSchema
  .pick({ customerName: true, customerEmail: true, customerPhone: true })
  .extend({ bookingId: z.string().uuid() });

export const createPaymentIntentSchema = z.object({
  bookingId: z.string().uuid(),
});
