---
name: design-verified
description: Single merged design skill for this repo. Combines the eight design packs (design-taste-frontend, high-end-visual-design, minimalist-ui, gpt-taste, stitch-design-taste, industrial-brutalist-ui, redesign-existing-projects, brandkit) into one document with their contradictions resolved, and makes Playwright verification mandatory rather than optional. Read before any prompt that touches this app's frontend.
---

# design-verified

> One document replacing eight overlapping packs. The packs disagree with each
> other in specific, load-bearing ways (serif choice, Inter, eyebrows, radius,
> centered heroes, motion). Section 2 resolves every conflict explicitly and
> states which pack wins and why. Do not consult the originals to overturn a
> ruling here.
>
> **Scope:** marketing and landing surfaces. Section 1.C names what this skill
> is *not* for, and that boundary is a hard rule in this repo, not a preference.
>
> **The verification loop in Section 9 is mandatory.** Every claim this skill
> makes about a rendered page is mechanically checkable, and there is a script
> that checks it. "It looks right" is not evidence. A screenshot you took is.

---

## 1. Before anything else

### 1.A Declare the design read

One line, before any code:

**"Reading this as: \<page kind> for \<audience>, with a \<vibe> language, leaning toward \<pack + system>."**

If the read genuinely diverges, ask exactly **one** question. If you can infer
it, do not ask - declare and proceed.

### 1.B Set the three dials

* **`DESIGN_VARIANCE`** - 1 = perfect symmetry, 10 = artsy chaos
* **`MOTION_INTENSITY`** - 1 = static, 10 = cinematic
* **`VISUAL_DENSITY`** - 1 = gallery airy, 10 = cockpit

Baseline `8 / 6 / 4`. Override from the read:

| Signal | VARIANCE | MOTION | DENSITY |
|---|---|---|---|
| minimalist / calm / editorial / Linear-style | 5-6 | 3-4 | 2-3 |
| premium consumer / luxury / brand | 7-8 | 5-7 | 3-4 |
| playful / agency / Awwwards / experimental | 9-10 | 8-10 | 3-4 |
| landing page / portfolio (default) | 7-9 | 6-8 | 3-5 |
| trust-first / regulated / accessibility-critical | 3-4 | 2-3 | 4-5 |
| **payment / checkout / booking flow** | **2-3** | **1-2** | **4-5** |
| redesign - preserve | match existing | +1 | match |
| redesign - overhaul | +2 | +2 | match |

The payment row is this repo's addition and it is not negotiable. See 1.C.

### 1.C Out of scope (hard boundary in this repo)

This skill does **not** govern: dashboards, dense product UI, data tables,
multi-step wizards, code editors, native mobile, realtime collab.

**Specifically for this repo** (carried from `CLAUDE.md`, which is the authority):

* **In scope, full dials:** homepage, room detail pages, pricing, FAQ, about,
  contact, legal pages.
* **Restrained only:** `BookingFlow.tsx` (the 3 steps) and `PaymentStep.tsx`.
  Trust and frictionlessness outrank visual flair on the page where someone
  types a card number. Contrast fixes, `color-scheme`, tactile press feedback,
  focus rings: correct. A redesign chasing "more impressive": not correct, and
  must be raised as a judgment call rather than shipped solo.
* Never treat a payment or webhook change as purely visual. Flag it as
  security-relevant even when you are confident (`ORCHESTRATION.md` guardrail 2).

---

## 2. Conflict rulings (the reason this merge exists)

The source packs contradict each other. These rulings are final within this repo.

### 2.1 Serif fonts

* `stitch-design-taste` recommends **Fraunces** and **Instrument Serif** by name.
* `minimalist-ui` recommends **Playfair Display / Instrument Serif**.
* `design-taste-frontend` **bans both by name** as the two LLM-favourite display
  serifs, and bans serif-as-default outright.

**Ruling: the ban wins.** Serif is not the default for "creative / premium /
editorial" briefs. Reach for a sans display first (Geist Display, Cabinet
Grotesk Display, PP Neue Montreal, GT Walsheim, Söhne Breit). A serif is
justified only when the brand brief names one, or the family is genuinely
editorial / luxury / publication / heritage **and you can articulate why this
serif fits this brand**. If justified, rotate from: PP Editorial New, GT Sectra
Display, Reckless Neue, Tiempos Headline, Recoleta, Canela, Domaine Display,
Saol Display, EB Garamond, Cormorant Garamond.

**Shipped faces (owner-approved):** this repo's display face is **Bricolage
Grotesque** (a sans, headings only), with **Geist** for all words and **Geist
Mono** (`.tabular`) only for figures that are compared or copied: times, prices,
references, the admin hour grid. Fraunces was the display face until the
2026-08-30 overhaul and is gone; do not "restore" it. The serif ban above
governs *new* choices, and an owner's explicit decision outranks a default.

### 2.2 Inter

* Banned outright by `high-end-visual-design`, `gpt-taste`, `minimalist-ui`.
* Explicitly recommended (Extra Bold / Black) by `industrial-brutalist-ui`.
* Discouraged-with-override by `design-taste-frontend`.

**Ruling: discouraged as a default, permitted on a stated override.** Valid
overrides: the user asks for neutral / standard / Linear-style; the brief is
public-sector or accessibility-first; the chosen pack is Industrial Brutalist,
where heavy Inter is the correct macro face. This repo does not ship Inter
(body is Geist since 2026-08-30).

### 2.3 Eyebrows (small uppercase wide-tracked labels above headings)

* `high-end-visual-design` **mandates** them before major H1/H2s.
* `gpt-taste` **bans** meta-labels entirely.
* `design-taste-frontend` caps them at **1 per 3 sections** and calls this the
  single most-violated rule in production tests.

**Ruling: the cap wins, and it is mechanical.** Maximum
`ceil(sectionCount / 3)` eyebrows per page, hero counts as one. Never *mandate*
an eyebrow. Never number them (`001 · Capabilities`, `06 · how it works`) - that
part of the `gpt-taste` ban survives in full. The verifier in Section 9 counts
them for you; do not count by eye.

### 2.4 Corner radius

* `high-end-visual-design`: exaggerated squircles, `rounded-[2rem]`, pill CTAs.
* `minimalist-ui`: radius capped at 8-12px, `rounded-full` **banned** on large
  containers and primary buttons.
* `industrial-brutalist-ui`: radius **zero**, 90-degree corners only.

**Ruling: these are pack-level identities, not global rules.** Pick ONE pack per
project (Section 3) and take its radius system whole. What is banned everywhere
is *mixing*: round buttons in a square layout, square cards on a pill-button
page. One radius scale per page, or one documented rule (e.g. "buttons pill,
cards 16px, inputs 8px") followed everywhere without exception.

### 2.5 Centered heroes

* `gpt-taste`: "Cinematic Center (Highly Preferred)".
* `stitch-design-taste` and `design-taste-frontend`: banned above variance 4.

**Ruling: variance-gated.** Above `DESIGN_VARIANCE 4`, reach for split, offset,
or asymmetric-whitespace structures first. Centered is still correct for
editorial / manifesto / launch briefs where the message *is* the design, and for
low-variance trust-first pages. State which case applies.

### 2.6 Motion

* `gpt-taste`: "static interfaces are strictly forbidden", GSAP mandatory.
* `design-taste-frontend`: every animation must be motivated in one sentence;
  reduced-motion mandatory above intensity 3.

**Ruling: motivated motion wins.** Before adding any animation, name what it
communicates: hierarchy, storytelling, feedback, or state transition. "It looked
cool" is not an answer and GSAP-because-GSAP-is-available is amateur. But the
converse binds too: if `MOTION_INTENSITY > 4`, the page must actually move.
A static page claiming intensity 7 is broken - either ship the motion or drop
the dial to 3 and ship a clean static page. Never half-build motion.

Reduced-motion is not dial-gated and not optional: anything above intensity 3
collapses to static under `prefers-reduced-motion: reduce`.

### 2.7 Images

* `design-taste-frontend`: image-gen tool first, then real photography, then
  clearly-labelled placeholder slots. Div-based fake screenshots banned.
* `brandkit`: art-directed imagery, no generic stock people or office photos.

**Ruling: compatible, both apply.** But this repo overrides the *source*:
room photography stays an obvious placeholder until the owner supplies real
photos (`PROJECT_CONTEXT.md` §7). Do not generate fake room photos and do not
substitute stock interiors. The shipped pattern is the room illustrations at
`public/rooms/art/<id>.webp`, captioned "Illustration of the setup" as a text
line under the image (never a pill on the art). Real photos drop in at the same
paths; then remove the caption. No image goes into the homepage hero until real
photos exist, and room art bands stay height-capped so the booking widget top
sits within the first 900px at 1440.

### 2.8 Em-dash

Only `design-taste-frontend` bans it, and it bans it absolutely.

**Ruling: adopted globally, zero tolerance.** No `—` and no `–` as a separator
anywhere a user can see: headlines, eyebrows, pills, body, quotes, attribution,
captions, buttons, alt text. Use a period, a comma, parentheses, a colon, or a
plain hyphen. The verifier greps for it, so this one is not a matter of taste.
One exception: an en-dash as a range glyph inside a time range
("7:00 – 9:00 PM") in the booking panel. Nowhere else.

---

## 3. Aesthetic packs (pick exactly one)

Each pack is a coherent identity absorbed from a source skill. Mixing packs is
what makes output look templated. Choose from the design read, state the choice,
commit to it.

| Pack | From | Palette | Type | Radius | Motion | Use when |
|---|---|---|---|---|---|---|
| **Editorial Light** | `minimalist-ui` | Warm bone / off-white, near-black text, desaturated pastel spots | Sans body + one justified display face | 8-12px | Invisible, 600ms fades | Calm, document-like, trust-forward. |
| **Awwwards Premium** | `high-end-visual-design` | OLED black or warm cream, one accent | Geist / Clash Display / PP Editorial | `2rem` squircles, pill CTAs | Spring physics, staggered reveals, magnetic hover | Agency, portfolio, premium consumer, high variance. **This repo's current pack, on a warm-paper light substrate, at MOTION_INTENSITY 3.** |
| **Industrial Brutalist** | `industrial-brutalist-ui` | Newsprint `#F4F4F0` + carbon ink + hazard red, OR CRT `#0A0A0A` + phosphor + red | Heavy grotesk macro + mono micro, all caps | **0** | Minimal, mechanical | Declassified-blueprint, telemetry, data-dense editorial |
| **Cinematic Motion** | `gpt-taste` | Dark with ambient depth | Satoshi / Cabinet Grotesk / Outfit | Varies | GSAP pinning, scrubbing, stacking | Scrolltelling where motion carries the narrative |

Never mix substrates within a pack: Industrial Brutalist is light **or** dark,
never both in one interface. Same for every pack - one theme per page, no
section flips (a single dark band in an otherwise light page reads as a
copy-paste accident, not a design choice).

**Allowed chrome exception (this repo):** the dark statement footer
(`--color-bg-inverse`) on every public page. It is site chrome, not a mid-page
section flip, and was a recorded hallmark pass-2 decision. Its statement line is
capped at `clamp(2rem, 3.5vw, 2.75rem)` so every page H1 outranks it. No other
dark band.

**Brand asset generation** (`brandkit`) stays a separate skill. It governs logo
boards, mockups, and brand imagery, not page layout. Invoke it directly when
generating brand assets; do not inline its prompt language into page work. Its
rules that *do* carry over: one dominant palette with repeating accents, very
little text, no random floating icons, no generic startup gradients, no cheap
neon, no fake tiny UI.

---

## 4. Hard rules (every pack, every page)

### 4.1 Hero

* Fits the initial viewport. Headline max 2 lines desktop, subtext max 20 words
  and max 4 lines, CTA visible without scrolling.
* Max 4 text elements total: eyebrow **or** brand strip (or neither), headline,
  subtext, CTAs (1 primary + max 1 secondary).
* Top padding max `pt-24` at desktop. More than that and the content floats
  halfway down the viewport and reads as a bug.
* Banned in the hero: tiny tagline under the CTAs, trust micro-strip, pricing
  teaser, feature bullets, avatar row, version labels (`V0.6`, `BETA`), stat
  blocks, decoration text strips (`BRAND. MOTION. SPATIAL.`).
* "Trusted by" logo walls go **under** the hero, as their own section, logos
  only, no category labels underneath.
* A 4-line headline is a font-size error, never a copy-length error.

### 4.2 Layout

* Navigation on ONE line at desktop, height ≤ 80px.
* No two sections share a layout family. Eight sections need at least four
  families. Max 2 consecutive image+text splits; the third is a failure.
* No "left big headline + right small explainer paragraph" section headers.
  Stack vertically instead.
* Bento grids have exactly as many cells as you have content for, use
  `grid-flow-dense`, and at least 2-3 cells carry real visual variation rather
  than white-on-white text.
* CSS Grid over flexbox percentage math. `min-h-[100dvh]`, never `h-screen`.
* Every multi-column layout declares its `< 768px` collapse in the same
  component. No "Tailwind will handle it".
* Lists over 5 items need a different component, not a longer list.

### 4.3 Color and shape locks

* One accent for the whole page. A warm-grey site does not grow a blue CTA in
  section 7.
* One radius system (Section 2.4).
* One theme, locked at the page level.
* No pure `#000000` or `#ffffff`.
* Saturation under 80% by default. No AI-purple glow, no neon.
* Shadows tinted to the background hue, never pure black on light.
* **This repo:** all tokens live in `src/app/globals.css` (Primitives →
  Semantics). Restyles are token swaps. White text needs the 600-level accent
  fill, never the 500 display accent - compute the ratio for any new pairing.

### 4.4 States and accessibility

* Loading = skeletons matching the final shape, not spinners.
* Empty and error states composed, not afterthoughts. Errors inline, never
  `window.alert()`.
* Visible focus ring on every interactive element. Non-negotiable.
* `:active` gets tactile feedback (`scale-[0.98]` or `-translate-y-px`).
* Tap targets ≥ 44×44px even when the visible control is smaller.
* WCAG AA minimum: 4.5:1 body, 3:1 for large text (≥24px, or ≥18.66px bold).
  AAA target for hero copy.
* Unavailable states carry a **text label**, never opacity alone - and the label
  must be **true**. A slot that is merely in the past is not "Booked".
* Dark mode designed from the start unless the brief says otherwise.

### 4.5 Copy

* Zero em-dashes (2.8).
* Re-read every visible string before shipping. Cut anything grammatically
  broken, with unclear referents, or that reads as an LLM trying to sound
  thoughtful. Boring beats cute.
* No filler verbs: elevate, seamless, unleash, next-gen, revolutionize, delve.
* No generic names, no Acme / Nexus / SmartFlow, no Lorem Ipsum.
* No fake-precise numbers unless real or explicitly labelled mock.
* Sentence case headers, not Title Case On Everything.
* One copy register per page.
* **This repo:** no fabricated testimonials, ratings, urgency, membership
  offers, cancellation terms, or business details. Undecided things say so
  honestly. Placeholders stay obviously fake until the owner replaces them.

### 4.6 Banned AI tells

Section-number eyebrows · scroll cues (`Scroll to explore`, bouncing chevrons) ·
decorative status dots · locale/weather/time strips · version footers on
marketing pages · photo-credit captions as decoration · pills overlaid on images ·
`border-t` + `border-b` on every row of a long list · div-based fake screenshots ·
hand-rolled SVG icons · three equal feature cards · custom mouse cursors ·
`window.addEventListener('scroll')` · emojis in UI · more than one marquee per
page · micro-meta sentences under eyebrows · "Quietly trusted by" · poetic
section labels ("Field notes", "On our desks").

---

## 5. Stack rules

* Next.js App Router, Server Components by default. Motion, scroll listeners,
  and pointer physics live in isolated `'use client'` leaves.
* Tailwind v4, CSS-first tokens. Never `useState` for continuous values - use
  `useMotionValue` / `useTransform` / `useScroll`.
* Animate `transform` and `opacity` only. `backdrop-blur` on fixed/sticky
  elements only. Grain on fixed `pointer-events-none` layers only.
* Icons from one family: Phosphor, HugeIcons, Radix, or Tabler. Never hand-rolled
  paths. Standardize stroke width.
* Fonts via `next/font`, never a `<link>` to Google Fonts.
* **Check `package.json` before importing anything.** No exceptions.
* `useEffect` animations get cleanup functions.

---

## 6. Redesign protocol

Detect the mode first: greenfield, preserve, or overhaul. Misclassifying is the
biggest source of bad redesign output.

Audit before touching: brand tokens, IA, content blocks, what to preserve, what
to retire, the existing dial reading, and the SEO baseline (the #1 redesign
risk).

Never change without explicit approval: URL structure, nav labels, form field
names or order, logo, legal copy.

Apply levers in order, stop when the brief is satisfied: typography → spacing
and rhythm → color recalibration → motion layer → hero recomposition → full
block replacement.

**This repo:** code is the design source of truth. The Figma file
(`LlgUu20D5khynwb0ilOKBa`) predates both the light-editorial restyle and the
build-out. Never reconcile code back toward it. After the owner's seat upgrade,
push code state *into* Figma.

---

## 7. Pre-flight (judgment)

Things a script cannot check. Answer each honestly before running Section 9.

- [ ] Design read declared, dials stated and reasoned
- [ ] Exactly one aesthetic pack chosen and committed to
- [ ] Redesign mode detected, audit done
- [ ] Every animation justifiable in one sentence
- [ ] Motion claimed = motion shown (or dial dropped to 3)
- [ ] No two sections share a layout family
- [ ] Bento cells = content count, no empty cells
- [ ] Real images or honestly-labelled placeholder slots, no fake screenshots
- [ ] Copy self-audit done, every visible string re-read
- [ ] No duplicate CTA intent ("Get in touch" + "Let's talk" = fail)
- [ ] Nothing fabricated: no invented reviews, terms, or business details
- [ ] Payment-flow changes flagged as security-relevant

---

## 8. Pre-flight (mechanical)

Every box below is checked by the script in Section 9. Do not tick them by eye.

- [ ] Zero em-dashes in visible text
- [ ] No horizontal scroll at 390px
- [ ] Every text/background pair meets WCAG AA
- [ ] No CTA label wraps to 2+ lines at desktop
- [ ] Eyebrow count ≤ ceil(sections / 3)
- [ ] Every tap target ≥ 44×44px
- [ ] Nav on one line, ≤ 80px tall
- [ ] Screenshots captured at 390px and 1440px

---

## 9. VERIFY (mandatory)

Reading the code is not verification. This repo's own history is the argument:
the Stripe.js eager-load bug looked correct on the page and was only caught by
running the app, and a slot-availability copy bug ("· Booked" on slots that were
merely in the past) was only visible in a rendered screenshot.

### 9.A Run it

```bash
npm run dev -- --port 3002          # in a session that survives the turn
node .agents/skills/design-verified/verify.mjs --base http://localhost:3002
```

Useful flags:

```
--base <url>        base URL (default http://localhost:3002)
--routes a,b,c      comma-separated routes (default: the repo's marketing pages)
--out <dir>         screenshot + report output (default .design-audit)
--widths 390,1440   viewports to test
--json              machine-readable report to stdout
```

Exit code is non-zero when any mechanical check fails, so it composes into a
pipeline. It writes full-page screenshots per route per width, plus
`report.json` and `report.md`.

### 9.B The full pass, in order

1. `rm -rf .next && npm run verify` (build, then typecheck, then lint: the
   build generates the route types `tsc` needs). `npm run ci` adds the smoke
   suite and this verifier against `next start` on port 3100 with a fresh
   `data/ci.db`.
2. `npm audit` if `package.json` changed. Grep `.next/static` for
   `sk_live|sk_test` if anything Stripe-adjacent changed.
3. `verify.mjs` at 390px **first**, then desktop.
4. Look at the screenshots. The script catches what is measurable; you catch
   what is ugly. Both are required.
5. Read the full diff of what is about to be pushed.
6. Report with evidence: what was verified and how, not "done".

### 9.C Reporting rules

* Never report a mechanical check as passing without the script's output.
* If a check fails and you decide to ship anyway, say so explicitly and say why.
* If a subagent claims a number, recompute it. This repo's history includes
  hand-confirming 2.19:1 and 8.48:1 exactly this way.
* A finding that does not survive a second look gets retracted plainly.

---

## 10. Provenance

Merged from `.agents/skills/`: `design-taste-frontend` (structure, dials,
anti-slop bans, pre-flight), `high-end-visual-design` (Awwwards pack, haptic
detail, motion choreography), `minimalist-ui` (Editorial Light pack), `gpt-taste`
(Cinematic Motion pack, hero line limits, gapless bento), `stitch-design-taste`
(semantic token vocabulary, responsive rules), `industrial-brutalist-ui`
(Industrial pack), `redesign-existing-projects` (Section 6 audit-first framing),
`brandkit` (kept separate, Section 3).

The originals remain on disk and are unmodified. Where they disagree with this
document, this document governs; where a ruling here is wrong, fix it here
rather than reaching past it to a source pack.
