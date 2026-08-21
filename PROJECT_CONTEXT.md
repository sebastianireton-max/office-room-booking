# Project Context — Room Booking Platform

**Read this first.** This is the living handoff for the project — a fresh Claude
session, another tool, or a human gets full context here without re-deriving
any of it. `CLAUDE.md` imports this file, so Claude Code loads it automatically.

Owner: thedreamgivers@icloud.com. Last rewritten: August 7, 2026 (supersedes the
original August 6 handoff, which described the project pre-restyle and pre-build-out).

Repo: https://github.com/sebastianireton-max/office-room-booking (branch `main`,
pushed directly — no PR gate is established for this repo yet).

---

## 1. What this project is, in the owner's own words

A booking website for the office: content/TikTok rooms, podcast rooms, and
rentable conference rooms. Key requirements as originally given:

> I want you to think while making this app that I want to make this ready to
> accept Stripe payments. I want exact time bookings, exact days. I wanted to
> have a connection to a calendar… where people can add this to their calendar.
> …make six rooms, two of them content rooms, two of them podcast rooms,
> [two] conference. Make it leave room to add more.

> This site is gonna be published and routed to for people who wanna book these
> content rooms. I want everything to be security audited. I want all things
> that need to be hashed, hashed — things that need to be kept secret, stop
> people from accessing.

Later directives that shaped the current state:
- **Style**: make the site look like a studio-rental reference site the owner
  likes (light, editorial, warm) — *style direction only, no cloning*.
- **Placeholders**: anything personalized (contact info, founder story, room
  photos) stays an obvious placeholder until the owner supplies the real thing.
- **No fabricated content**: no invented reviews/testimonials, social proof,
  membership offers, or policy terms the owner hasn't decided.
- **Figma export**: wanted, but deferred until the owner upgrades their Figma
  seat (see Section 6).

---

## 2. Current state (all verified, all on `main`)

A complete, working studio-rental site — not just a booking funnel:

- **Pages**: Home (hero, room grid, how-it-works, FAQ teaser, CTA band) ·
  6 per-room landing pages (`/rooms/[id]`: identity hero + tagline, marketing
  copy, "made FOR" chips, equipment, embedded booking flow, cross-sell) ·
  `/pricing` (rates computed from the same catalog the engine charges from) ·
  `/faq` · `/about` · `/contact` · `/terms` · `/privacy` (drafts flagged for
  review) · confirmation page · `sitemap.xml` + `robots.txt`.
- **Chrome**: `SiteHeader` (desktop nav + accessible mobile hamburger, both
  with a Book CTA) and `SiteFooter` (rooms directory, links, contact, legal).
- **Booking engine**: exact-slot holds with race-condition guards (see §5),
  Stripe PaymentIntent + signature-verified webhook confirmation,
  add-to-calendar (.ics/Google/Outlook) — all end-to-end verified except the
  real-payment leg (needs the owner's Stripe test keys; see §4).
- **Design**: light editorial system — warm cream/neutral palette, coral
  accent, Fraunces display serif + Inter body, lowercase-italic + CAPS
  headline pattern. All tokens in `src/app/globals.css` (Primitives →
  Semantics), so restyles are token swaps.
- **Verified**: `npm run build` + `npm run lint` clean; browser-checked at
  390px and 1440px (real Chromium via Playwright — mobile menu, pricing table
  both layouts, no horizontal scroll at 390px, measured).

## 3. Architecture (unchanged from original design, still true)

- Next.js 16 App Router + TypeScript + Tailwind v4 (CSS-first tokens).
- Bookings persist via `node:sqlite` (`src/lib/db/`); `prisma/schema.prisma`
  is the intended production (Postgres) model. The repository functions in
  `bookings-repository.ts` are the swap seam — migrate before real traffic.
- Room catalog is a typed array (`src/lib/rooms-data.ts`) including the
  landing-page marketing fields (`tagline`, `marketingDescription`,
  `idealFor`). Copy there is grounded strictly in each room's equipment list.
- Business details (contact, address, socials, hours) live ONLY in
  `src/lib/site-config.ts` — obvious placeholders; going live is one edit.
- A booking becomes `confirmed` ONLY via the signature-verified Stripe
  webhook. Price is always computed server-side. Zod validates every route.
  Rate limiting on availability/hold/payment-intent.

## 4. Environment variables — owner connects Stripe personally

Unchanged policy: **never ask for or accept a raw Stripe key in chat.** The
owner copies `.env.example` → `.env.local` themselves:
`STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`,
`STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_SITE_URL`.
First thing to test once keys exist: a full real test-mode payment with
`stripe listen --forward-to localhost:3000/api/webhooks/stripe`.

## 5. Security state — audited twice, four real fixes shipped

Two independent audit passes (a full checklist pass + an adversarial second
pass) plus runtime verification. Fixes landed, in order:

1. **Rate-limit key spoofing** — `clientKey()` trusted the leftmost
   `X-Forwarded-For` entry (client-controlled); now uses the rightmost.
2. **Webhook double-booking race** — a late-but-legitimate
   `payment_intent.succeeded` could resurrect an expired hold after the slot
   was resold. `confirmBookingByPaymentIntent` now only transitions
   `pending_payment → confirmed` (idempotent on retries) and loudly logs
   anything else for manual reconciliation.
3. **Preventive half of #2** — `attachPaymentIntent` extends the hold to
   `paymentGraceMinutes` (30 min) once payment starts; failed/canceled
   payments release the slot immediately (`releaseHoldOnPaymentFailure`);
   callers must check `attachPaymentIntent`'s boolean (orphaned intents get
   cancelled + 409).
4. **Stripe.js eager load** — importing `@stripe/stripe-js` root injects
   Stripe's script on EVERY page via module side effect; switched to
   `@stripe/stripe-js/pure`. (Found only by running the app — reading the
   gate logic looked correct.)

Also: `.env.example` was accidentally gitignored (`.env*`) and never tracked —
fixed with `!.env.example`; its placeholders reworded so GitHub push
protection doesn't false-positive on them. Open, deliberate: CSP still allows
`'unsafe-inline'` — migrate to nonces only when Stripe Elements can be tested
with real keys in a browser. `npm audit`: 0 vulnerabilities as of last check.

The full line-by-line checklist lives in this repo's history (original §7) and
in `.claude/agents/security-auditor.md`, which re-verifies it each pass.

## 6. Design/Figma state

- **Code is still the source of truth.** Figma is now a mirror of it, not a
  competing spec. Never "reconcile" code back toward Figma; push code into
  Figma when they drift.
- **Re-synced 2026-08-21** to the Clockroom rebrand. Both pages updated:
  - Wordmark: all 20 `room booking platform` text nodes are now the `clockROOM`
    lockup (Fraunces `SemiBold Italic` for "clock", `SemiBold` for "ROOM"), and
    a `Logo` auto-layout was inserted in all ten screen headers carrying the
    square mark as an SVG node tree. Footer copyright reads "© Clockroom".
  - Homepage rebuilt to match code: hero headline is now the brand line
    ("show up. clock in. CREATE."), the hero and "Our Rooms" eyebrows are gone,
    the room grid is grouped into Content/Podcast/Conference pairs with ruled
    headers, "How it works" is heading-left + hairline step list, and the FAQ
    teaser band was merged into the closing band as a secondary link.
  - Room Type Badge component variants gained the 1px `border-default` stroke
    (the 1.15:1 fix), which propagates to every instance.
  - Room artwork applied to all six cards plus the room-detail hero.
  - Slot chips read `· Closed`, and the room detail screen carries the
    two-hour-notice line, mirroring the §8.1 fix.

  **Three gotchas worth keeping:**
  1. **Upload PNG, never WEBP.** `upload_assets` accepts `image/webp`, returns
     `success: true` and a real `imageHash` — and then the renderer never
     decodes it. Every fill rendered blank, including the uploader's own temp
     frames. PNG works. Re-converted from `public/rooms/art/*.webp`.
  2. **`get_metadata` with no nodeId under-reports this file's pages** — it
     lists only `Foundations & Components`. Both pages are really there; list
     them with a read-only `use_figma` (`figma.root.children`) instead.
  3. The uploaded originals are parked in a frame named
     `Room artwork — source (do not delete)` at x≈16400 on the prototype page,
     off to the right of the screens. It keeps the image blobs referenced and
     gives a designer the source art.

  **Known remaining drift (Figma behind code, not fixed this pass):** the
  Room Detail screen still stacks the booking widget below the marketing copy
  and has no "not quite right? TRY THESE." cross-sell row; code has copy-left /
  sticky-widget-right on desktop and a cross-sell rail. Pre-existing, called out
  rather than silently left.

- **Synced 2026-08-12** (seat is now Full on Pro, so the old Starter-plan
  rate limit no longer applies). The file `LlgUu20D5khynwb0ilOKBa` now
  matches the shipped light-editorial code:
  - Primitives repointed to the warm neutral ramp + coral family + `cream`;
    the five `accent-violet/*` variables were verified unreferenced and
    removed. All 23 semantic Color variables alias the same primitives
    `globals.css` does, and the missing `color/text/on-success` was added.
  - Text styles moved to Fraunces for Display/Heading and Inter for
    Body/Label, at the sizes and tracking actually used in `page.tsx`.
    Added `Display/Hero Italic`, `Heading/H2 Italic`, and `Eyebrow` for the
    lowercase-italic + CAPS headline pattern. Note Fraunces' Figma style
    string is `SemiBold` (no space), unlike Inter's `Semi Bold`.
  - **Room Card** component built (it was the one component the original
    build never reached).
  - **File structure is now two pages**: `Foundations & Components` (tokens,
    styles, the six components) and `Prototype — Full Site` (all ten screens
    in one row). The three original `Screens — *` pages were consolidated and
    removed once empty, because **Figma prototype flows cannot navigate across
    pages**: a clickable full-site preview requires every frame on one page.
  - **Ten screens**: Homepage, Pricing, Room Detail, Checkout step 2, Checkout
    step 3, Confirmation, FAQ, About, Contact, and a Legal template covering
    Terms and Privacy.
  - **Clickable prototype**, flow starting point on Homepage. 191 links wired:
    header and footer navigation on every screen, room cards and pricing rows
    into Room Detail, and the booking path Room Detail → step 2 → step 3 →
    Confirmation, with working Back links. Transitions are instant; Smart
    Animate cross-dissolves between unrelated pages read as a glitch.
    Preview: https://www.figma.com/proto/LlgUu20D5khynwb0ilOKBa/Room-Booking-Platform-Design?node-id=39-5&starting-point-node-id=39-5
  - Nav labels are wrapped in padded `Nav / <label>` hit areas. Raw text
    hotspots were 40x17px and are unreliable to click.
- Figma deliberately mirrors the shipped `· Booked` slot wording, including
  the known mislabel bug (§8 item 1). Do not "fix" copy in Figma that has
  not shipped in code — that recreates the drift this sync just removed.
- Subagents: `.claude/agents/design-auditor.md` (visual/WCAG passes; knows
  the skill packs in `.agents/skills/`) and `security-auditor.md`.
  `CLAUDE.md` scopes the design-taste skills honestly: marketing pages yes,
  payment flow restrained.

## 7. Placeholders the owner must replace before launch

1. `src/lib/site-config.ts` — email, phone, address, socials (all obviously
   fake: `hello@yourstudio.example`, `123 Your Street`).
2. Room photography — `public/rooms/*.svg` are styled placeholders; drop real
   photos in per room (layout already takes them, zero code changes).
3. Founder story — dashed placeholder block on `/about`.
4. Cancellation policy — `/faq` and `/terms` honestly say "being finalized";
   decide terms, then replace those blocks.
5. Review `/terms` + `/privacy` drafts (counsel recommended).
6. ~~Site name~~ — DONE (2026-08-20). The brand is **Clockroom**, set in
   `site-config.ts` and flowing to every title/metadata surface. Tagline:
   "Show up. Clock in. Create." The wordmark is `src/components/Wordmark.tsx`
   (typography, not an image) and the square mark is `src/app/icon.svg`.
   NOTE: the name has only had an informal collision spot-check. Run a real
   USPTO / state-registry / domain search before printing anything.

## 8. Next steps, in priority order

1. ~~Fix the "Booked" slot mislabel.~~ DONE (2026-08-20). `TimeSlot` now
   carries `unavailableReason: "booked" | "too-soon"`, set at the single place
   in `listAvailableSlots` that knows the difference; too-soon slots label
   `· Closed` and the booking widget states the notice rule once above the
   grid ("Same-day bookings need 2 hours' notice... They are not booked.")
   instead of stamping a reason on ten chips. `available` itself is computed
   by the same unchanged `isRangeFree` call, so no booking logic moved.
2. **Stripe test keys + real payment test** (§4) — the one untested leg.
3. **Deploy** (Vercel is the natural fit) — webhooks need a public URL.
   Remember: SQLite won't survive serverless; do #4 first or deploy to a
   single persistent instance initially.
4. **Prisma + Postgres migration** (schema already written; swap the
   repository functions).
5. **Committed Playwright test suite.** `@playwright/test` is now installed
   and there is a working harness at
   `.agents/skills/design-verified/verify.mjs` (`npm run design:verify`), but
   it only covers *visual/a11y* checks. The functional suite is still to do:
   the booking flow end to end, the double-booking race, and the webhook
   handler with signed test payloads.
6. When real content exists: testimonials section, membership/events pages —
   currently excluded on purpose (no fabricated social proof or offers).

---

## 9. Suggested first message for a fresh session

```
Read PROJECT_CONTEXT.md (auto-loaded via CLAUDE.md) in the office-room-booking
repo. Run npm install, npm run build, npm run lint to confirm the environment,
then tell me: (a) anything broken, (b) which placeholders from Section 7 are
still unfilled, and (c) which of Section 8's next steps you can do right now
without my input. Don't redo the security audits or the restyle — they're
done and verified; build forward from the current state.
```
