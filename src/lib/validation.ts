import { z } from "zod";

/**
 * Server-side input validation for every API route. Client-side validation
 * is a UX convenience only — this is the real security boundary. Design
 * package Section 10.5.
 */

export const availabilityQuerySchema = z.object({
  roomId: z.string().min(1).max(64),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  durationMinutes: z.coerce.number().int().min(30).max(480),
});

export const createHoldSchema = z.object({
  roomId: z.string().min(1).max(64),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "startTime must be HH:mm"),
  durationMinutes: z.coerce.number().int().min(30).max(480),
  customerName: z.string().trim().min(1).max(200),
  customerEmail: z.string().trim().email().max(320),
  customerPhone: z
    .string()
    .trim()
    .max(40)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
});

export const createPaymentIntentSchema = z.object({
  bookingId: z.string().uuid(),
});

export type CreateHoldInput = z.infer<typeof createHoldSchema>;
