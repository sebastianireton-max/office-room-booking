# Project Context — Room Booking Platform

**Read this first.** This file is the handoff from a Claude (Cowork) session that
researched, designed, and built the first version of this project. It exists so a
fresh Claude Code session — or any other tool, or a human — has full context
without re-deriving any of it. If you're Claude Code and `CLAUDE.md` imported this
file automatically, you already have everything below in context.

Owner: thedreamgivers@icloud.com. Written: August 6, 2026.

---

## 1. What this project is, in the owner's own words

The project is a booking website for content/TikTok rooms, podcast rooms, and a
rentable conference room. Below are the owner's requirements as given, kept close
to verbatim so nothing gets lost in paraphrase:

> I want you to think while making this app that I want to make this ready to
> accept Stripe payments. I want exact time bookings, exact days. I wanted to have
> a connection to a calendar, like a Calendly, or some sort of connection to where
> people can add this to their calendar. I want there to be a full system to where
> they can pick through all their... what days they want, what room they want. I
> want also just placeholders for the rooms — for now, just make six rooms, two of
> them content rooms, two of them podcast rooms, one of them a conference. Make it
> leave room to add more, less, and then we'll build the extra structure for
> advertising the rooms on pages later.

(Note: the owner's dictation said "two... two... one" for six rooms, which totals
five, not six. This was resolved as 2 Content + 2 Podcast + **2** Conference = 6,
flagged as an assumption at the time. Confirm this is right, or adjust
`src/lib/rooms-data.ts` — it's one array, trivial to change.)

> I wanna keep it all Figma, MCP, [Playwright] MCP, Claude Code — will that be
> effective? Will I be able to create all this and then just attach Stripe to it
> by myself, or would I have to go to another app?

Yes — that's exactly how this was built. No other app-builder platform was used.
Figma (design) + this real Next.js codebase (application logic) + Claude Code /
Playwright (for you to continue building, testing, and auditing) is the full
toolchain. Stripe is deliberately **not** connected by any AI tool — see Section 5.

> Make sure this site is ready to... this site is gonna be published and routed to
> for people who wanna book these content rooms. I want everything to be security
> audited. I want all things that need to be hashed, hashed — things that need to
> be kept secret, stop people from accessing. I will run you through an audit
> check through another skill.

Section 7 below is written specifically so that audit has a concrete checklist to
verify against the actual code, not just a description of intent.

**Explicitly deferred by the owner, not forgotten:** individual marketing pages
per room ("we'll build the extra structure for advertising the rooms on pages
later"). All six rooms currently share one detail-page template.

---

## 2. What already exists (don't redo this)

### 2.1 The design package (delivered as a separate 31-page .docx)

Filename: `Room-Booking-Platform-Design-Development-Package.docx`, delivered
earlier in the same session that produced this codebase. If you don't have that
file, ask the owner to re-share it, or treat this file + the code as the working
source of truth going forward (the code is now more current than the doc in a few
places — see the accessibility note in 2.3).

It contains: competitor/market research synthesis (sourced from the owner's own
NotebookLM notebook — podcast studios, content/social studios, corporate meeting
spaces), a user research plan, the full design system spec, the six-room data
model, UX copy, a design critique, a WCAG 2.1 AA accessibility audit, a developer
handoff spec, security requirements, and Figma status.

### 2.2 Figma

File: "Room Booking Platform — Design", key `LlgUu20D5khynwb0ilOKBa`,
https://www.figma.com/design/LlgUu20D5khynwb0ilOKBa

Built and token-bound: the full design token system (colors, spacing, radius,
type, effects) and 5 of 6 core components (Button, Room Type Badge, Step
Indicator Dot, Input Field, Time Slot Chip). **Blocked mid-build** on the Room
Card component and all 3 screens (homepage, room detail, checkout) — the Figma
account (a View seat on a Starter-plan team) hit a hard MCP rate limit (6 tool
calls/month for View/Collab seats, confirmed by Figma's own docs). Resume once
the monthly quota resets, or move the account to a Pro+/Full-or-Dev seat.

Because Figma got blocked, the Room Card and all three screens were designed
directly in code instead (see 2.3) rather than waiting. If Figma work resumes
later, treat the live code as the more current spec for those pieces, and update
Figma to match — not the other way around.

### 2.3 This codebase — what's built and verified

A working Next.js 16 app implementing the full flow: browse rooms → pick an exact
date and time slot → enter details → pay via Stripe → confirmation with add-to-
calendar. See `README.md` for setup and the directory map.

**Verified end-to-end with Playwright** (real browser, real API calls, real
SQLite-backed booking engine — not a mockup) immediately before handoff:

- Homepage renders the hero and all 6 room cards
- Room detail page loads correctly per room
- The empty-state copy ("No open slots on this day. Try another date.") renders
  correctly when a day has no bookable slots left (tested against a real edge
  case: booking late at night, inside the minimum-notice window)
- Switching to a day with open hours shows 14 available hourly slots
- Selecting a slot → filling contact details → advancing creates a real booking
  hold in the database
- **The slot-hold race-condition guard actually works**: after creating a hold,
  re-querying availability for that room/day shows the held slot removed from
  the available list — this is the "time-based cart lock" the owner's research
  called out as necessary, and it's confirmed functioning, not just written.
- The payment step correctly detects that no Stripe keys are configured yet and
  shows a clear message instead of erroring, since this build environment
  intentionally has no real Stripe keys (the owner connects their own — see
  Section 5).

**Not yet verified** (couldn't be, without a real Stripe account in the build
sandbox): an actual successful payment, the webhook-driven confirmation, and the
calendar-download/add-to-calendar links on the real confirmation page. Once real
test-mode keys are added (Section 5), this is the first thing to test.

**Two accessibility fixes from the design audit are already applied in the code**
(not just documented) — see `src/app/globals.css`'s top comment block:
1. Primary button default-state background moved from accent-violet/500 to /600
   (white text now hits 5.60:1 contrast; the original 4.38:1 failed AA).
2. `border/default` reassigned from neutral/300 to neutral/500 (4.66:1, was
   1.63:1). Figma still has the old, failing values — update it to match the
   code when screen work resumes there.

---

## 3. Architecture, and why

- **Next.js 16 (App Router) + TypeScript + Tailwind v4.** Tailwind v4 uses
  CSS-first config — the whole design-token system lives in
  `src/app/globals.css` as CSS custom properties, structured in the same
  Primitives → Semantics layers as the Figma variables, on purpose, so the two
  stay comparable.
- **Bookings persist via Node's built-in `node:sqlite`**, not Prisma. Prisma's
  query engine binary couldn't be downloaded in the build sandbox (network
  restriction specific to that environment, not a design choice) — outside that
  sandbox, `npx prisma generate` will work normally. `prisma/schema.prisma` is
  included as the intended **production** data model (Postgres). The repository
  functions in `src/lib/db/bookings-repository.ts` are the swap point: reimplement
  them against Prisma and nothing that calls them needs to change. **Do this
  before real production traffic** — a single SQLite file won't survive a
  serverless/multi-instance deployment.
- **Room catalog is a typed array (`src/lib/rooms-data.ts`), not a DB table.**
  Deliberate for v1: it's genuinely data-driven (no component hardcodes room
  info, everything reads through `getRoomById`/`ROOMS`), just not
  admin-editable yet. Promote it to the `Room` model already sketched in
  `prisma/schema.prisma` if/when rooms need to be edited without a code change.
- **Stripe.** Card data never reaches this server — the Payment Element
  tokenizes directly to Stripe. A booking is marked `confirmed` **only** by the
  signature-verified webhook handler (`src/app/api/webhooks/stripe/route.ts`)
  reacting to `payment_intent.succeeded` — never by a client-side redirect. This
  matters: it's what stops a manipulated client from marking an unpaid booking
  as paid.
- **Calendar.** `.ics` generation + Google/Outlook "add event" links are all
  URL-template-based — no OAuth, no calendar API credentials needed.

---

## 4. Codebase map

```
src/
  app/
    page.tsx                            Homepage
    rooms/[id]/page.tsx                  Room detail + booking flow entry
    confirmation/[bookingId]/page.tsx    Post-payment confirmation, polls for webhook confirmation
    api/rooms/                           GET room catalog
    api/availability/                    GET open slots (roomId, date, durationMinutes)
    api/bookings/hold/                   POST create a time-based slot hold
    api/bookings/[id]/                   GET a booking; /calendar sub-route serves the .ics download
    api/checkout/create-payment-intent/  POST — creates the Stripe PaymentIntent for a held booking
    api/webhooks/stripe/                 POST — signature-verified, the ONLY place status becomes "confirmed"
  components/            Button, RoomTypeBadge, StepIndicator, InputField, TimeSlotChip, RoomCard
  components/booking/    BookingFlow.tsx (steps 1-2 + orchestration), PaymentStep.tsx (step 3, Stripe Elements)
  lib/
    rooms-data.ts         The 6-room catalog — single source of truth
    db/client.ts           node:sqlite connection + schema
    db/bookings-repository.ts   The booking engine: availability, holds, confirm, expire — read this file
                                  to understand the race-condition guard
    stripe.ts / stripe-client.ts   Server/client Stripe wrappers
    calendar.ts             .ics + calendar link generation
    validation.ts           zod schemas — the real security boundary for every API route
    rate-limit.ts           In-memory rate limiter (note: swap for shared store before multi-instance prod)
  types/domain.ts          Room/Booking/TimeSlot types + BOOKING_CONFIG (operating hours, hold duration, etc.)
prisma/schema.prisma        Production (Postgres) data model — read the top comment before using it
```

---

## 5. Environment variables (none are set — that's intentional)

Copy `.env.example` to `.env.local` and fill in real values yourself:

- `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — from
  https://dashboard.stripe.com/apikeys. The owner explicitly wants to connect
  these personally rather than hand keys to any AI tool — respect that; don't
  ask for or accept a raw key pasted into chat.
- `STRIPE_WEBHOOK_SECRET` — from the Stripe CLI (`stripe listen`) for local dev,
  or a Dashboard-created webhook endpoint for production. Without this, bookings
  will create holds and reach the payment form, but will never flip to
  `confirmed`, because that only happens via the verified webhook.

---

## 6. Known v1 limitations (intentional, not bugs)

- SQLite-via-`node:sqlite`: single-file, single-process. Fine for dev/low-traffic
  launch; migrate to the included Prisma/Postgres schema before scaling — see
  Section 3.
- No customer accounts — guest checkout only, matching the requested scope.
- Individual room marketing pages: deferred by the owner, all rooms share one
  detail template.
- Equipment upsell + liability-waiver/COI upload (seen in the competitor
  research, documented in the design package): not built, data model doesn't
  block adding later.
- Cancellation/rescheduling/overtime-billing policies (also seen in the
  research): documented, not built into v1.
- In-memory rate limiting won't work correctly across multiple server instances
  — fine for one instance, needs a shared store (e.g. Redis) beyond that.

---

## 7. Security checklist — for the owner's planned audit

Everything below should be checkable directly against the code, not taken on
faith. This mirrors the design package's Section 10.

- [ ] No secret ever hardcoded — `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
      any future DB credentials are environment-variable-only
      (`src/lib/stripe.ts`, `.env.example`). `.env*` is gitignored.
      `data/*.db` is gitignored too (may contain real customer PII once live).
- [ ] Card data never touches this server — verify no code path reads raw card
      fields; only `stripe.paymentIntents.create` (amount, currency, metadata)
      is called server-side (`src/app/api/checkout/create-payment-intent/route.ts`).
- [ ] Webhook signature verification happens before anything is trusted —
      `stripe.webhooks.constructEvent(...)` in
      `src/app/api/webhooks/stripe/route.ts`, wrapped in try/catch that rejects
      on failure.
- [ ] A booking becomes `confirmed` **only** inside the webhook handler
      (`confirmBookingByPaymentIntent`), never from client code.
- [ ] Price is computed server-side from the room's stored rate and snapshotted
      onto the booking at hold time (`createHold` in
      `src/lib/db/bookings-repository.ts`) — grep the codebase for anywhere a
      client-submitted price might be trusted; there shouldn't be one.
- [ ] Every API route validates input with `zod`
      (`src/lib/validation.ts`) before touching the database.
- [ ] Bookings are written via parameterized queries only (`db.prepare(...).run(...)`
      in `bookings-repository.ts`) — no string-concatenated SQL anywhere.
- [ ] Security headers are set globally in `next.config.ts`: CSP, HSTS,
      X-Frame-Options, X-Content-Type-Options, Referrer-Policy,
      Permissions-Policy. Check the CSP still matches if you add any new
      third-party script/embed.
- [ ] Rate limiting is applied to `/api/availability`, `/api/bookings/hold`, and
      `/api/checkout/create-payment-intent` (`src/lib/rate-limit.ts`).
- [ ] Before shipping: grep the production client bundle for `sk_live`/`sk_test`
      to confirm no secret key leaked into client-side code.
- [ ] No authentication exists yet — if/when added, passwords must be hashed
      with bcrypt (cost ≥ 12) or argon2id, sessions in httpOnly+secure+sameSite
      cookies, never localStorage. Nothing to check yet, but don't let a future
      change skip this.

---

## 8. What Claude Code (or you) can do from here

This was built and verified in a cloud sandbox with real constraints: no real
Stripe account, no ability to fetch Prisma's binary, no Google Fonts network
access (worked around — see `layout.tsx`'s self-hosted-font comment). A local
Claude Code session has fewer constraints and is a natural next step for:

1. **Full payment testing.** Add real Stripe test-mode keys, run
   `stripe listen --forward-to localhost:3000/api/webhooks/stripe`, and actually
   complete a booking end-to-end — this is the single highest-value next step,
   since it's the one part that couldn't be tested here.
2. **A real Playwright test suite.** An ad-hoc verification script proved the
   flow works (see the checks listed in Section 2.3) but isn't a committed test
   suite. Porting it into `@playwright/test` under a `tests/` or `e2e/`
   directory, plus adding coverage for the double-booking race condition
   specifically (two concurrent holds on the same slot — one should win, one
   should get the 409), the expired-hold cleanup path, and the webhook handler
   with a signed test payload, would meaningfully raise confidence before
   launch.
3. **The security audit itself.** Section 7 above is written to be checked
   line-by-line. Claude Code can also run `npm audit`, check for
   typosquatted/unmaintained dependencies, and inspect the built output for
   leaked secrets.
4. **Migrate to Prisma + Postgres** for production, per Section 3 — the schema
   is already written and commented with the exact steps.
5. **CI/CD**: a GitHub Actions workflow running `npm run build` and the test
   suite on every push/PR, and a deploy pipeline (Vercel or wherever this ends
   up hosted).
6. **Resume the Figma work** once the rate limit clears — build the Room Card
   and compose the 3 screens using the design package's spec, and reconcile
   Figma's still-failing accessibility values with the fix already live in code
   (Section 2.3).
7. **Build the deferred v1 features** when ready: per-room marketing pages,
   equipment upsell, cancellation/reschedule policies, customer accounts.
8. **General iteration** — this is a real, running codebase now, not a mockup;
   treat it like any other Next.js project from here (branches, PRs, code
   review, refactors).

### Suggested first message to Claude Code

```
Read PROJECT_CONTEXT.md and README.md in this repo, then run `npm install` and
`npm run build` to confirm everything still works in this environment. After
that, walk me through the security checklist in PROJECT_CONTEXT.md Section 7
against the actual code and tell me what you find before we do anything else.
```

---

## 9. Everything else the owner said, verbatim, for completeness

These are additional instructions given during the build that shaped decisions
above but are worth keeping in full in case anything was missed:

> Will I be able to create all this on Figma, Playwright MCP, through Claude
> Code, and then just attach Stripe to it by myself, or would I have to go to
> another app? Because I wanna keep it all Figma, MCP, or Playwright MCP, Claude
> Code. Will that be effective?

> To have the highest quality site, what to do — (in response to being asked to
> choose between writing the design package first, starting real code first, or
> waiting on Figma; the owner delegated the decision). The path taken: write the
> full design package as the source of truth first, then build the real
> application code from that same spec immediately after, in parallel with
> Figma screen work resuming whenever its rate limit clears.
