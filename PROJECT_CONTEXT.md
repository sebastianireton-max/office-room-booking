# Project Context — Room Booking Platform

**Read this first.** This is the living handoff for the project — a fresh Claude
session, another tool, or a human gets full context here without re-deriving
any of it. `CLAUDE.md` imports this file, so Claude Code loads it automatically.

Owner: thedreamgivers@icloud.com. Last rewritten: August 30, 2026; revamp
section §0 added September 13, 2026 and extended September 15, 2026 (build
team); §0 takes precedence where they differ.

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
- **2026-09-13**: "review the whole site for flaws and AI slop and fully revamp
  it, give it an admin page with the things it needs to function, a continue
  with Google, and fully build in the pages it needs to be on Google."

---

## 0. Revamp of 2026-09-13 — read this before §2 (it supersedes parts of it)

### Build team 2026-09-15 (newest; supersedes the rest of §0 where they differ)

Owner request: "a pro level formatted booking system", professional not AI
slop, clean code, a system that runs flawlessly. Eight review lenses, a lead
plan, then eight build packages (WP1 to WP8) integrated on
`wip/windows-uncommitted-2026-09-11`. **Not yet on `main`** (see §2).

**Booking panel (room pages).** Three steps, "Time", "Details", "Review & pay"
(`aria-current="step"`). Time: Length 1h/2h/3h with totals; a 7-day week strip
from today in the studio zone with open counts (new `GET /api/availability/week`,
zod, rate-limited, 404 for unknown rooms), paging within `maxAdvanceDays`, plus
"Pick a date"; a zone line derived from `SITE.timeZone` via Intl; **only open
start times**, grouped Morning / Afternoon / Evening, with one truthful muted
line for the rest ("Earlier times today need 2 hours' notice.", "2 times already
booked."); empty days offer "Next available". Details: server field errors
inline, focus to the first invalid field. Review & pay: booking/you/price with
Edit, honest policy line, "Held for you until 3:42 PM EDT" from the extended
hold `create-payment-intent` now returns, "Ending soon:" plus one sr-only alert
under 2 minutes, "Your hold has ended." with a way back, Try again / Change time
when payment cannot start, and "Pay $N". Homepage deep links with an open start
land on Details. Mobile: a fixed bottom bar carries the one primary action.

**Rulings from the lead brief** (they override earlier notes, including the
§8.1 per-chip labels): unavailable chips are gone from the room panel, replaced
by the summary line; the hold notice is a calm absolute time, never a ticking
countdown or red; **no Express Checkout Element** (the Payment Element already
shows Apple Pay / Google Pay / Link once enabled in the Stripe dashboard, an
owner step); no hold-extend button (essential timing); en-dash allowed only as a
time-range glyph in the panel. **Kashu verdict: stay on Stripe.** Its AUP forbids
charging for a business other than the one applied for, fees run about 2x and it
holds a reserve; no payment-provider seam was added.

**Design rulings recorded**: Geist Mono (`.tabular`) only on times, prices,
references and the admin grid; one filled accent per viewport and teal never a
status; one H1 axis and the `type-page` / `type-section` / `type-subhead` scale;
room art band capped at lg (40vh) with the caption under the image; no hero image
until real photos exist; the dark footer stays, its statement capped at
`clamp(2rem, 3.5vw, 2.75rem)` (recorded as an allowed exception in
design-verified); boxed "How booking works" became a plain list.

**Also shipped**: fonts self-hosted through `next/font` (the `@fontsource-variable/*`
packages and unused `date-fns` removed); honest confirmation states (cancelled,
expired, load error); webhook logs no event payload, email sent in `after()`;
admin status colours, one "Charged, not booked" label, shared filters for list and
CSV; `/api/health` (`SELECT 1`), `onRequestError` one-line sanitized logging,
error pages; a production build refuses to run without `NEXT_PUBLIC_SITE_URL`.

**The repeatable system (WP8)**:
- `npm run verify` = build, then `tsc --noEmit`, then eslint (via
  `tests/ci.mjs verify`, which supplies a localhost `NEXT_PUBLIC_SITE_URL` only
  when none is set, so the production-URL guard does not block verification).
- `npm run ci` = verify, then `tests/ci.mjs`: `next start` on port 3100 with a
  fresh `data/ci.db` and the non-secret smoke env, `tests/smoke.mjs` (90 checks
  now: adds payment_failed release, .ics route, admin Mark handled and Remove
  block, cancelled confirmation copy, every in-page fragment on five pages,
  `/api/health`, and the booking panel: week strip counts, only open times,
  keyboard Tab / Space / arrows in the time radiogroup, deep link to Details,
  Review & pay price and hold notice), then design:verify; the server is always
  stopped.
- `.github/workflows/ci.yml`: push to `main` and `wip/**` plus weekly; npm ci,
  Playwright Chromium, `npm audit --omit=dev --audit-level=high`, `npm run ci`,
  `.design-audit/` uploaded on failure. No repository secrets.
- `scripts/backup.mjs`: see **Backups** in §5.
- Saved review team in `.claude/agents/` (security, design, accessibility,
  booking-ux, copy, seo, systems, code-quality), all report-only with shared run
  rules, and `.claude/workflows/site-review.js`, which fans them out and ends in
  a lead that verifies in code and runs `npm run ci`.

Driven by three independent audits (design/slop, security, Google-search
readiness) plus GBrain's anti-slop reference, then built and verified in one pass.

**Verdict on "AI slop"** (kept here because the design-auditor disagreed): the
tokens, contrast and mechanics were sound and still are. The template feel came
from composition, not palette: one heading trick ("lowercase + HEAVY CAPS")
repeated about seven times per page, lowercase room names, a hero that was only
a slogan, art tiles you could not compare, and no way to see open times without
opening six pages. The palette, fonts and radius were kept (owner-approved);
the weight-contrast lockup now appears **once**, in the hero brand line. Every
other heading is plain sentence case. Do not reintroduce the lockup elsewhere.

**Public site**
- Pages live in the `src/app/(site)` route group (URLs unchanged); the root
  layout is chrome-free so `/admin` has its own.
- Homepage: hero with `AvailabilityFinder` (live open times for every room on a
  date, via `/api/availability/day`, deep-linking `?date=&start=&duration=#book`
  into the room's `BookingFlow`, which preselects it); rooms as a comparison list.
- Room pages: breadcrumbs, spec row, "Included in the rate" list, rates box,
  "Illustration of the setup" caption (imagery is honest about being artwork).
- Confirmation page: Outlook link now carries dates; the "not confirmed" state
  no longer claims "your card was not charged" (false in the lapsed-hold case).
- `/signin`, `/account` (bookings by user id OR Google-verified email), root
  `not-found.tsx`. Privacy page updated for Google sign-in and Resend.
- Deleted: create-next-app SVGs in `public/`, unused `RoomTypeBadge`.

**Booking engine fixes (real bugs found in audit)**
- Server accepted holds for past dates, inside the notice window, off the hour
  grid and years ahead; the UI only greyed them out. Now refused in `createHold`.
- "Today" mixed the UTC date with server-local hours. Now computed in
  `SITE.timeZone` (`nowInZone` in `format.ts`). PLACEHOLDER zone: America/New_York.
- `BOOKING_CONFIG.turnoverBufferMinutes` (15) is still **not enforced**. With
  60-minute slots enforcing it would block back-to-back bookings; owner decision.

**Google sign-in** (SECURITY-RELEVANT): plain OIDC code flow + PKCE + state +
nonce, no auth library (`src/lib/auth/`). ID token claims validated (iss, aud,
exp, nonce, email_verified) without JWKS, because the token comes straight from
Google's token endpoint over TLS with the client secret (OIDC Core 3.1.3.7; the
first security pass asked for JWKS + `jose` and that was declined on these
grounds). Session = HMAC-signed httpOnly cookie, 14 days, stateless (no per-device
revocation). Users keyed on Google `sub`, never email.

**Admin** at `/admin` (SECURITY-RELEVANT): access = `ADMIN_EMAILS`, re-checked on
every page, server action and route handler via `requireAdmin()` (a layout check
alone does not protect actions). Today view (stats, per-room hour grid, setup
health checklist of every missing env var/placeholder), bookings list + filters +
CSV export (formula-injection safe), booking detail (cancel, cancel + full Stripe
refund with idempotency key `refund-<id>`, resend confirmation), "Charged but not
booked" queue (`payment_issue`, set by the webhook when a lapsed hold gets paid),
block-outs (`room_blocks`, enforced in availability and holds), activity log.

**Also new**: confirmation email via Resend HTTP API with .ics attached (the form
had always promised one; nothing was sent); webhook handles `charge.refunded`;
public booking API no longer returns email/phone/Stripe ids; CSP adds
`object-src`, `base-uri`, `frame-ancestors`, `form-action`, and `unsafe-eval` in
development only. **Next.js 16.3.0 had a critical unauthenticated RCE advisory**
(GHSA-p293-qw3h-jr36, GHSA-2xp9-vwfh-vxw4); bumped to 16.3.5, prod tree 0 vulns.

**Google search**: `metadataBase`, per-page canonicals, `LocalBusiness` JSON-LD
(from `SITE`, so NAP stays consistent), `Service` + `BreadcrumbList` per room,
`FAQPage`, generated `opengraph-image`, per-room PNG share images in
`public/rooms/og/`, `manifest.ts`, sitemap with `lastModified`, robots blocking
`/admin /account /signin /api /confirmation`, `GOOGLE_SITE_VERIFICATION` env.
Fixed: every room page title said "Clockroom" twice. No `aggregateRating`, ever.

**Tests**: `tests/smoke.mjs` (`npm run test:smoke`), 63 checks against a running
server (dev or `next start`) with a throwaway `DATABASE_PATH`: SEO endpoints, hold
guards, PII trimming, **Stripe webhooks signed exactly as Stripe signs them**
(confirm, idempotent replay, lapsed-hold flag, partial vs full refund, bad
signature), a **12-way concurrent double-booking race** (exactly one wins), auth
gates, OAuth PKCE/state, CSV, admin block + cancel in Chromium, a **keyboard-only
booking pass** (skip link, Tab to a slot, visible ring, Enter selects), and no
horizontal scroll at 390px on ten routes. Setup is at the top of the file.

### Design pass 2 (same day): hallmark audit, applied

Ran GBrain's design material (anti-slop reference, animation reference, the new
`conventions/web-compliance-defaults`) through ONE critique lens, hallmark's
`audit` verb, with design-verified as the governing ruleset. GBrain's standing
note is not to stack hallmark + taste-skill + ui-ux-pro-max; that was followed.
Found and fixed:
- **AI nav** (full-bleed sticky bar + hairline) -> floating contained pill; the
  hamburger icon is now a text "Menu" button (design-verified 4.6 bans
  hand-rolled SVG icons).
- **AI footer** (four link columns + tiny copyright) -> dark statement footer:
  "Open every day, 8:00 AM to 10:00 PM." + full NAP block + one inline row each
  of rooms and site links. New semantic tokens `--color-bg-inverse`,
  `--color-text-on-inverse(-strong)`, `--color-border-inverse`; focus ring on
  ink switches to teal-300 (teal-600 is only ~3:1 there).
- **Hero stat row** (banned by design-verified 4.1) removed. **The six rooms
  appeared twice** (finder + list) -> one `RoomBoard`: sticky day/length/type
  controls, and per room the art, specs, price for the chosen length and up to
  four real open times ("6 PM"), each deep-linking into booking. `RoomCard` and
  `AvailabilityFinder` deleted.
- **Three equal cards** (room page cross-sell) -> compact "Other rooms" list.
  Checkmark SVGs on the equipment list removed.
- **Bouncy overshoot easing + `transition-all`** on buttons -> named properties,
  ease-out. `--ease-spring` token deleted. Scroll `.reveal` deleted; motion is
  one load entrance (`.enter`, transform-only, staggered) and press feedback.
  MOTION_INTENSITY is now 3.
- **Spinner** on the confirmation page -> skeleton in the card's shape.
- **Compliance defaults**: skip-to-content link + `#main-content` target,
  `/accessibility` statement (only claims the smoke suite verifies), linked in
  the footer and sitemap.
- Contact page 2x2 uppercase-label cards -> a definition list. Removed two
  invented claims there ("a real person reads it", "Staffed during open hours").
- FAQ content moved to `src/lib/faq.ts`, shared by `/faq` and the homepage's
  "Before you pay" disclosure list, so they cannot drift.
Still true and NOT fixed, because only the owner can: the room illustrations
read as AI art (hallmark "AI-illustration look"). Real photos are the fix; the
caption keeps them honest meanwhile.

---

## 2. Current state (verified on the working branch, NOT all on `main`)

**`origin/main` is behind.** As of 2026-09-15 it still pins `next` 16.3.0, the
version with the critical unauthenticated RCE advisory (§0), and has none of the
2026-09-13 revamp or the 2026-09-15 build. The work lives on
`wip/windows-uncommitted-2026-09-11` until the owner approves fast-forwarding
`main` after CI passes. Parts of the list below also predate §0; §0 wins.

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
- **Design**: **"Warm sun / analog film" — Awwwards Premium on a light
  substrate** (owner-requested palette change, 2026-08-31, superseding the
  Aug 30 dark overhaul, which superseded the Aug 7 light editorial direction).
  Warm-paper canvas (`#f7f1e6`) with a lighter sheet (`#fdfaf4`) for bands and
  cards, one **deep-teal** accent (`teal-600 #0f766e` fill / `teal-700 #115e59`
  text), and a **film-grain emulsion**
  over the whole page (one fixed `body::after`, inline SVG `feTurbulence`
  multiplied at ~2% — no library, no image request, removed under
  `prefers-contrast: more`).
  Unchanged across the flip because the **pack did not change**, only its
  substrate arm: Bricolage Grotesque display + Geist body + Geist Mono for
  tabular figures, the weight-contrast headline pattern (light lowercase
  against heavy caps), and radius 10/18/28 with pill CTAs. Shadows are real
  again (they did not read on near-black) and tinted warm brown, never black.
  All tokens still in `src/app/globals.css` (Primitives → Semantics).
  **This still overrides design-verified §2.1**, which grandfathered Fraunces
  as owner-approved; the owner chose the Aug 30 overhaul explicitly after being
  told that was the cost. Do not "restore" Fraunces, cream, or coral.

  **Contrast rule RE-inverted — do not memorise it, recompute it.** It has now
  flipped once per substrate: cream → white on the fill; warm-black →
  near-black on the fill; warm-paper → **white again** (near-white on
  `teal-600` = 5.25:1; near-black on it = 3.02:1 and fails). Full table and the
  two traps that survive a token swap silently (`opacity-NN`, and Stripe
  Elements' cross-origin `appearance` object) are in ORCHESTRATION.md
  guardrail 7.

  **The accent was burnt orange for a few hours on Aug 31.** The owner replaced
  it, and the reason generalises: the room illustrations are drawn in coral, so
  a warm accent put every button in the same hue family as the artwork behind
  it and the controls stopped reading as controls. Teal is the complement, so
  the paper stays warm and the interface separates from the imagery by hue
  rather than by luminance alone. `status-info` moved off teal onto `#2c5581`
  at the same time: two things that mean different things must not share a
  colour. Check any future accent against the *artwork*, not just the canvas.

  Deleted rather than recoloured in this pass, because the light substrate
  removed the reason each existed: the room-card/room-hero **inset artwork
  plate** (it framed the cream illustrations so they would not punch a
  light-mode hole through the dark page), and the **per-type colour dots** on
  the room badges and homepage group headers (three category hues is three
  accents on a one-accent page, §4.3, and §4.6 bans decorative status dots).
  The hero's **soft gradient wash** went the same way: it is on the banned-tells
  list (no generic startup gradients) and it was the one element on the page
  whose purpose a visitor could not name. Scale and air replaced it.

- **B-roll ready, 2026-08-31.** Owner asked for the site to show each room off
  as a premium creator space, with places designed for video. Every media
  surface now renders through **one component**, `src/components/MediaSlot.tsx`,
  which resolves `video → still image → labelled slot` and pauses autoplaying
  video under `prefers-reduced-motion`. `Room` gained two optional fields,
  `reel` (one silent loopable hero clip) and `clips` (2 to 4 detail shots).
  **Both are empty today and that is correct** — no footage has been shot and
  nothing may depict a space that does not exist as shown. Filling them in is a
  data edit in `src/lib/rooms-data.ts` and nothing else:
  `public/rooms/video/<id>.mp4` for the reel, `<id>-01.mp4`… for the clips.
  The room-detail "in the room" strip renders only when that room has clips, so
  the site never shows empty labelled boxes to a visitor.

- **Homepage room showcase rebuilt, 2026-08-31.** Six structurally identical
  cards became asymmetric pairs on a 5-column grid, with the wide side
  alternating down the page and tiles top-aligned so their natural heights
  stagger. Each tile leads with the room's own tagline (real copy, already
  grounded in its equipment list) and closes on a mono spec rail. `RoomCard`
  still exists and is still correct for the compact 3-up cross-sell rail on
  room pages; the two jobs are different and were deliberately not merged
  behind a `variant` prop. Room detail gained a **full-bleed cinematic band**
  outside the `max-w-6xl` container: the single biggest "expensive" lever on
  that page, and it cost one wrapper.
- **Verified 2026-08-31**: `npm run build`, `npx tsc --noEmit`, `npm run lint`
  all clean; `npm run design:verify` **PASS** at 390px and 1440px across all
  six audited routes. Measured in real Chromium, not eyeballed: no horizontal
  scroll at either width, `color-scheme: light`, grain layer live
  (`mix-blend-mode: multiply`, z 60), `CREATE.` 6.59:1, disabled slot chip
  5.73:1 (was ~2.0:1 before the `opacity-45` fix), disabled Continue 4.86:1,
  room badge 4.86:1.

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
`STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_SITE_URL`. Added 2026-09-13, same rule
(owner sets them, never through chat): `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
`AUTH_SECRET`, `ADMIN_EMAILS`, `RESEND_API_KEY`, `EMAIL_FROM`,
`GOOGLE_SITE_VERIFICATION`. `.env.example` explains where each comes from, and
`/admin` lists whichever are still missing. The webhook now also needs the
`charge.refunded` event.
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

`npm audit` (2026-08-30): **production tree 0 vulnerabilities**. Four high
findings were open before this pass; three came from `prisma`, which sat in
`dependencies` despite having zero imports in `src/` (the app runs on
`node:sqlite`). npm's suggested "fix" was a *downgrade* to 6.12.0; instead
`prisma` and `@prisma/client` moved to `devDependencies`, which removes them
from the production tree entirely. The fourth, `nanoid < 3.3.18` via `ics` and
`postcss`, is pinned up by an `overrides` entry in `package.json`.
Four high findings remain in the **dev-only** tree (2026-09-15 recount):
`prisma`, `@prisma/config` and `deepmerge-ts` through prisma's config loader, and
`mysql2`, which prisma 7 now pulls in. Deliberately accepted: not in the
production tree, not in any request path, and only "fixable" by downgrading
prisma. CI gates on `npm audit --omit=dev --audit-level=high`, which is 0.
NOTE: do not run bare `npm install -D prisma` — it resolves to `8.0.0-rc.12`,
a release candidate that drags in an `alchemy`/`composer` tree with hono and
lodash advisories. Pin the 7.x line.

Also: `.env.example` was accidentally gitignored (`.env*`) and never tracked —
fixed with `!.env.example`; its placeholders reworded so GitHub push
protection doesn't false-positive on them. Open, deliberate: CSP still allows
`'unsafe-inline'` — migrate to nonces only when Stripe Elements can be tested
with real keys in a browser.

The full line-by-line checklist lives in this repo's history (original §7) and
in `.claude/agents/security-auditor.md`, which re-verifies it each pass.

**Backups** (launch default: RPO 24h, RTO 1h). Run nightly on the host:
`DATABASE_PATH=<live db> BACKUP_DIR=<off-repo folder> node scripts/backup.mjs`.
It writes `bookings-YYYY-MM-DD.db` with `VACUUM INTO` (safe while the app runs)
and keeps the newest 14. The copies hold PII: keep them off the web root and out
of git; off-box storage is an owner decision (§8). **Restore drill**, at least
once before launch and after any schema change: copy the newest backup to a
scratch path, `next start` against it (`DATABASE_PATH=<copy>`, a spare port),
check `/api/health` is 200, then run the smoke suite's read checks against that
server (home, a room page, `/api/availability`, admin sign-in with a test
session) and compare `SELECT count(*) FROM bookings` with the source. Never run
the full smoke suite against a restored real database; it writes bookings.

## 6. Design/Figma state

- **Code is still the source of truth.** Figma is now a mirror of it, not a
  competing spec. Never "reconcile" code back toward Figma; push code into
  Figma when they drift.

- **DRIFT, 2026-08-31: Figma is a full substrate behind code.** The file still
  mirrors the Aug 30 warm-black + ember system; code shipped the warm-paper +
  burnt-orange one on Aug 31 and the sync was not run in that pass. Everything
  in the Aug 30 entry below describes the file's *current* state, not the
  site's. Re-syncing is mostly a Primitives repoint again (the ramp direction
  never changed, so the semantic aliases survive by id), plus: `accent-ember/*`
  renames to `accent-sun/*` with new values, `color/text/on-accent` inverts
  back to the light end of the ramp, the status quartet re-tunes for paper, the
  four shadow effects become real warm-brown drop shadows, and the Room Card
  and Room Detail artwork plates lose their inset frame. The film grain has no
  Figma equivalent worth faking. Text styles and radius do NOT change, because
  the pack did not change.
- **Re-synced 2026-08-30** to the dark overhaul. Variables and styles carry
  most of it, because the file mirrors `globals.css` structurally:
  - **Primitives** repointed to the warm-black ramp and the ember family
    (`accent-coral/*` renamed in place to `accent-ember/*`, so every Color
    alias survived by id). Status colors retuned for dark: the old values
    measured 3.77 to 4.01:1 here and all failed. `cream` deleted after
    `color/bg/canvas` was repointed off it.
  - **All 23 Color semantics re-aliased**, including `color/text/on-accent`
    inverting to `neutral/50`. Radius 6/12/20 to 10/18/28.
  - **Text styles** moved from Fraunces/Inter to Bricolage Grotesque/Geist.
    The two `* Italic` styles became `* Emphasis` (ExtraBold), which is the new
    weight-contrast pattern. Added `Mono/Tabular` (Geist Mono).
    Note Bricolage and Geist use `SemiBold`/`ExtraBold` with NO space, like
    Fraunces and unlike Inter's `Semi Bold`.
  - **486 text segments remapped by hand** across the prototype page. Style
    updates alone were not enough: the italic + CAPS lockup was built as
    per-segment font overrides inside single text nodes, so those nodes were
    not style-bound and kept rendering Fraunces after the ramp changed.
  - Hero rebuilt left-aligned (120px, 0.92 leading, ember `CREATE.`, tungsten
    bloom); Room Card given the inset artwork plate; Primary/Disabled button
    variant given the real disabled treatment.
  - Still behind code, on top of the pre-existing Room Detail drift below: the
    room-detail hero image is not yet inset, and the how-it-works numerals are
    not yet Geist Mono.

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
2. Room photography — `public/rooms/art/<id>.webp` are illustrations; drop real
   photos in at the same paths (and regenerate `public/rooms/og/<id>.png`, and
   remove the "Illustration of the setup" caption on the room page).
3. Founder story — dashed placeholder block on `/about`.
4. Room B-roll — `reel` and `clips` on each room in `src/lib/rooms-data.ts`
   (see §2). The layout, the grid and the component seam are already in place;
   they are waiting on footage, not on code.
5. Cancellation policy — `/faq` and `/terms` honestly say "being finalized";
   decide terms, then replace those blocks.
6. Review `/terms` + `/privacy` drafts (counsel recommended).
7. ~~Site name~~ — DONE (2026-08-20). The brand is **Clockroom**, set in
   `site-config.ts` and flowing to every title/metadata surface. Tagline:
   "Show up. Clock in. Create." The wordmark is `src/components/Wordmark.tsx`
   (typography, not an image) and the square mark is `src/app/icon.svg`.
   NOTE: the name has only had an informal collision spot-check. Run a real
   USPTO / state-registry / domain search before printing anything.
8. `SITE.timeZone` in `site-config.ts` — set to the studio's real IANA zone.
9. Google, Resend and admin env vars (§4). Until set: no sign-in, no
   confirmation emails, no admin access.

## 8. Next steps, in priority order

1. ~~Fix the "Booked" slot mislabel.~~ DONE (2026-08-20). `TimeSlot` now
   carries `unavailableReason: "booked" | "too-soon"`, set at the single place
   in `listAvailableSlots` that knows the difference; too-soon slots label
   `· Closed` and the booking widget states the notice rule once above the
   grid ("Same-day bookings need 2 hours' notice... They are not booked.")
   instead of stamping a reason on ten chips. `available` itself is computed
   by the same unchanged `isRangeFree` call, so no booking logic moved.
2. **Stripe test keys + real payment test** (§4) — the one untested leg.
3. **Deploy** — webhooks need a public URL. While on SQLite, deploy to one
   always-on Node instance with a persistent disk (Fly, Railway, Render or a
   VPS); Vercel or serverless needs #4 first. The host also decides proxy trust
   for the rate limiter.
4. **Prisma + Postgres migration** (schema already written; swap the
   repository functions).
5. **Functional tests.** MOSTLY DONE (2026-09-15): `tests/smoke.mjs`, 90
   checks via `npm run ci`, including signed webhooks, the double-booking race
   and the booking panel (§0). Still to do: a real test-mode card payment
   through Stripe Elements (needs keys).
5a. **Operations.** DONE in code (2026-09-15): `/api/health`, `npm run ci` in
   GitHub Actions (push and weekly), `scripts/backup.mjs` with a restore drill
   (§5). Owner steps: merge approval to fast-forward `main` (it still ships
   next 16.3.0), optional branch protection requiring the CI job, an uptime
   monitor on `/api/health`, Stripe failed-webhook email alerts, a nightly
   backup schedule with off-box storage, and optionally an error sink.
6. When real content exists: testimonials section, membership/events pages —
   currently excluded on purpose (no fabricated social proof or offers).
7. **Figma is now three revisions behind** (warm-paper palette, the 2026-09-13
   revamp, and design pass 2). Re-sync when Figma work resumes; code wins.
8. Owner decisions: turnover buffer between bookings (config exists, not
   enforced); whether admin cancellations should email the customer; whether
   guest bookings typed with someone's email should appear in that person's
   account without an email confirmation step.

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
