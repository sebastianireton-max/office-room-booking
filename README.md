# Room Booking Platform

Book content rooms, podcast suites, and a conference room by the hour — exact date and time slots, Stripe payments, add-to-calendar confirmation.

Built from the design package delivered alongside this codebase (tokens, components, room data model, UX copy, accessibility audit, security requirements). See `PROJECT_CONTEXT.md` for the full handoff — read that first if you're picking this up in Claude Code or another tool.

## Stack

- **Next.js 16** (App Router, TypeScript) + **Tailwind CSS v4** — theme tokens in `src/app/globals.css` mirror the Figma design system exactly.
- **Data**: bookings persist via Node's built-in `node:sqlite` (`src/lib/db/`) — zero external dependencies, real parameterized SQL. Rooms are a typed catalog in `src/lib/rooms-data.ts`. `prisma/schema.prisma` documents the production (Postgres) data model this is designed to graduate into — see the comment at the top of that file for the migration path.
- **Stripe**: Payment Element (client) + PaymentIntents + signature-verified webhooks (server). Card data never touches this server.
- **Calendar**: `.ics` generation (`ics` package) + Google/Outlook "add event" links — no OAuth required.
- **Validation**: `zod` on every API route input.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in your own Stripe keys — see below
npm run dev
```

Visit http://localhost:3000. The homepage, room detail pages, and the date/time picker all work with zero configuration — no Stripe keys needed to browse and reach the payment step. The payment step itself shows a clear "Stripe isn't connected yet" message until you add your keys.

## Connecting your own Stripe account

This app is built so **you** connect Stripe — your secret key is never entered into or handled by any AI tool used to build this project.

1. Get your API keys from https://dashboard.stripe.com/apikeys (test mode to start).
2. In `.env.local`, set `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
3. For webhooks (required — this is how a booking actually gets marked "confirmed", see Security below):
   - **Local dev**: install the [Stripe CLI](https://stripe.com/docs/stripe-cli), run `stripe listen --forward-to localhost:3000/api/webhooks/stripe`, and copy the `whsec_...` it prints into `STRIPE_WEBHOOK_SECRET`.
   - **Production**: create a webhook endpoint in the Stripe Dashboard pointing at `https://your-domain.com/api/webhooks/stripe`, subscribed to at least `payment_intent.succeeded`, and put its signing secret in `STRIPE_WEBHOOK_SECRET`.

## Project structure

```
src/
  app/
    page.tsx                        Homepage (hero + room grid)
    rooms/[id]/page.tsx              Room detail + booking flow entry
    confirmation/[bookingId]/page.tsx  Post-payment confirmation + calendar links
    api/
      rooms/                        GET room catalog
      availability/                 GET open slots for a room/date/duration
      bookings/hold/                POST create a time-based slot hold
      bookings/[id]/                GET a booking (+ /calendar for .ics download)
      checkout/create-payment-intent/  POST create a Stripe PaymentIntent for a held booking
      webhooks/stripe/              POST — Stripe webhook, confirms bookings
  components/                       Button, RoomTypeBadge, StepIndicator, InputField,
                                     TimeSlotChip, RoomCard — mirror the Figma components
  components/booking/                BookingFlow (steps 1–2), PaymentStep (step 3, Stripe Elements)
  lib/
    rooms-data.ts                   The 6-room catalog — single source of truth, edit here to add/remove rooms
    db/                             Booking persistence + the slot-hold booking engine
    stripe.ts / stripe-client.ts    Server/client Stripe wrappers
    calendar.ts                     .ics + Google/Outlook link generation
    validation.ts                   zod schemas for every API input
    rate-limit.ts                   In-memory rate limiter for booking/checkout endpoints
prisma/schema.prisma                 Production (Postgres) data model reference
```

## Adding or changing rooms

Edit the `ROOMS` array in `src/lib/rooms-data.ts`. Nothing else needs to change — cards, filters, badges, and the booking flow all read room data through that one file. Individual room marketing pages are intentionally out of scope for v1 (all rooms share the detail template) — see `PROJECT_CONTEXT.md`.

## Security

Implements the checklist from the design package (Section 10) — see that document (or `PROJECT_CONTEXT.md`'s summary) for the full list. Highlights:

- Card data never reaches this server (Stripe Elements tokenizes directly to Stripe).
- A booking is only ever marked `confirmed` by the signature-verified webhook handler (`src/app/api/webhooks/stripe/route.ts`), never by a client-side redirect.
- Price is always computed server-side from the room's stored rate, snapshotted onto the booking at hold time — never trusted from the client.
- All API input is validated server-side with `zod`.
- Security headers (CSP, HSTS, frame-ancestors, etc.) are set in `next.config.ts`.
- Secrets are environment-variable-only — see `.env.example`. Nothing is hardcoded.

**If you're running a security audit** (the project owner mentioned doing this via a separate skill/process): `PROJECT_CONTEXT.md` has the full requirements checklist in one place to check the code against.

## Known v1 limitations (by design, not oversights — see `PROJECT_CONTEXT.md`)

- SQLite-via-`node:sqlite` is a single-file, single-process store — fine for development and a low-traffic launch, but won't survive a serverless/multi-instance production deployment. Migrate to the included `prisma/schema.prisma` (Postgres) before scaling — see that file's top comment.
- No customer accounts/auth — guest checkout only, matching the requested v1 scope.
- Individual room marketing/landing pages are deferred — all rooms use one shared detail template.
- Equipment upsell and liability-waiver/COI upload (seen in the competitor research) are documented but not built — the data model doesn't block adding them later.

## Testing

```bash
npm run build   # type-checks + production build
```

Playwright is a good fit for end-to-end testing this flow (booking a room end-to-end, availability edge cases, webhook-driven confirmation) — see `PROJECT_CONTEXT.md` for suggested test scenarios if you're setting this up in Claude Code.
