@AGENTS.md
@PROJECT_CONTEXT.md
@ORCHESTRATION.md

## Design skill — reference on every prompt touching UI

**Start here: `.agents/skills/design-verified/SKILL.md`** (symlinked at
`.claude/skills/design-verified`). It merges the eight design packs into one
document, resolves the places where they contradict each other (serif choice,
Inter, eyebrow count, corner radius, centered heroes, motion), and makes
verification mandatory instead of optional. Where it disagrees with a source
pack, it governs; fix a bad ruling there rather than reaching past it.

Its verifier is real and runs against the live app:

```bash
npm run dev -- --port 3002
npm run design:verify -- --base http://localhost:3002
```

That checks contrast, horizontal scroll at 390px, em-dashes, eyebrow budget,
CTA wrapping, nav height, and tap targets, and writes full-page screenshots
plus a report to `.design-audit/` (gitignored). Non-zero exit on failure.
Do not tick a mechanical checkbox by eye when the script can check it.

The source packs below remain on disk, unmodified, for reference.

`.agents/skills/design-taste-frontend/SKILL.md` (symlinked at
`.claude/skills/design-taste-frontend`) is a standing reference for any
prompt that touches this app's frontend — read it before making visual/UX
changes, not just when a `design-auditor` subagent is explicitly invoked.

Scope it honestly, per the skill's own header: it targets landing pages,
portfolios, and redesigns — explicitly **not** multi-step product UI. That
means:
- **Homepage, room detail pages** — squarely in scope. Apply the brief
  inference, the three dials, and anti-default discipline freely.
- **The booking flow itself** (`BookingFlow.tsx`'s 3 steps, `PaymentStep.tsx`)
  — treat the skill's heavier dials (high `MOTION_INTENSITY`/`DESIGN_VARIANCE`,
  the Awwwards-leaning packs like `high-end-visual-design`/`gpt-taste`) as
  **not** applicable here. This is a payment flow; trust and frictionlessness
  outrank visual flair. Contrast/accessibility fixes and restrained polish
  (the kind already shipped: WCAG contrast, `color-scheme: dark`, tactile
  press feedback) are exactly the right kind of change — a redesign chasing
  "more impressive" on the page where someone is entering a card number is
  not, and should be flagged as a judgment call rather than shipped solo.

Also available at `.agents/skills/`: `high-end-visual-design`, `minimalist-ui`,
`industrial-brutalist-ui`, `stitch-design-taste`, `gpt-taste`, `brandkit`,
`redesign-existing-projects` (audit-first framing), and the `ponytail`
family (YAGNI/minimal-code discipline — applies repo-wide, not just UI).
