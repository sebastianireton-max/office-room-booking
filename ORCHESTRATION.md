# Orchestration rules — Room Booking Platform

How any session coordinating this repo (main conversation, or a fresh session
picking up a trigger) runs its subagents. The specialists live in
`.claude/agents/`: **`design-auditor`** (visual/UX/WCAG) and
**`security-auditor`** (secrets, Stripe integrity, injection, rate limiting).

## The orchestrating session is the oversight layer

Subagent reports are claims, not facts. Before treating any subagent's work as
finished, verified, or ready to push:

- **Independently re-run the build** — `npm run build && npx tsc --noEmit &&
  npm run lint` yourself, from a clean `.next`, rather than trusting a
  "verified" line in a report. **Build first, then typecheck.** Next 16
  generates `PageProps` / `LayoutProps` / `RouteContext` into `.next/types`
  during the build, so after `rm -rf .next` a leading `tsc --noEmit` always
  fails with `Cannot find name 'PageProps'`. That is a missing codegen step,
  not a type error in your diff.
- **Read the actual diff** (`git show`/`git diff`), not the agent's summary of
  it. Summaries describe intent; diffs show what happened.
- **Recompute checkable claims.** A contrast ratio, a rate, a count — if an
  agent asserts a number that matters, compute it yourself (this repo's
  history includes doing exactly that and confirming 2.19:1 / 8.48:1 by hand).
- **Run the app when the claim is about runtime behavior.** Reading code
  missed the Stripe.js eager-load bug; a real browser caught it. Dev server +
  the Playwright Chromium at `/opt/pw-browsers/chromium` is the loop:
  screenshot at 390px first, then 1440px, and check `document.documentElement.
  scrollWidth` — don't eyeball "no horizontal scroll."
- If a subagent's finding doesn't survive the second look, say so plainly and
  correct it — never pass along a specialist's mistake because a specialist
  made it.

Push policy: this repo currently pushes **direct to `main`** (no PR gate).
That makes independent verification BEFORE push non-negotiable — there is no
review stage after you.

## Dispatch

- Visual/UX/accessibility work or review → **design-auditor**.
- Anything touching secrets, payment, webhooks, validation, headers, deps →
  **security-auditor**.
- Run audit agents in **isolated worktrees** (`isolation: worktree`) and in
  the background; they may push to `main` themselves — fetch and re-verify
  their commits when the notification lands, exactly as above.
- Concurrent agents: they rebase over each other's pushes; after both land,
  re-run the full verification once on the merged result.
- Feature building can happen inline in the orchestrating session — the
  agents are for audits and specialist passes, not a required path for
  every change.

## Hard guardrails (every agent, every session — no exceptions)

1. **Stripe keys never pass through chat, code, or commits.** The owner sets
   `.env.local` personally. Don't ask for keys, don't accept pasted ones,
   don't write placeholders shaped like real keys (GitHub push protection
   flags them — history proves it).
2. **Payment/webhook logic changes must be flagged as security-relevant** in
   the report/commit, even when confident. The double-booking guard class of
   bug lives exactly there.
3. **No fabricated content.** No invented testimonials, ratings, urgency,
   membership offers, cancellation terms, or business details. Undecided
   things say so honestly ("policy being finalized — contact us").
4. **Personalized details stay obvious placeholders** (`site-config.ts`,
   founder story, room photos) until the owner supplies the real ones.
5. **Code is the design source of truth, not Figma.** Figma is a mirror and is
   pushed to from code (PROJECT_CONTEXT.md §6, last synced 2026-08-30). Never
   "reconcile" code back toward Figma; where they drift, code wins.
6. **Don't touch `data/*.db`** — real booking data once live keys exist.
7. **Contrast discipline**: compute ratios for any new color pairing, always.
   Do not memorise the rule — it has now flipped twice, once per substrate:

   | Substrate | Accent | Text on an accent fill |
   |---|---|---|
   | cream (Aug 07) | dark coral | **white** |
   | warm-black (Aug 30) | bright ember | **near-black** |
   | warm-paper (Aug 31, current) | dark teal | **white** again |

   Current values: near-white on `teal-600` measures 5.25:1 and passes;
   near-black on it measures 3.02:1 and fails. Body-size accent TEXT uses
   `teal-700` (6.75:1), not `teal-600` (4.87:1). Same care for the status
   fills. Never carry a contrast rule across a substrate change: recompute.

   The accent shipped burnt orange for a few hours on Aug 31 before the owner
   replaced it with teal. The reason is worth keeping: the six room
   illustrations are drawn in coral, so a warm accent left every control
   sharing a hue with the artwork behind it. **Check a new accent against the
   imagery, not only against the background.**

   **Two traps this project has actually hit**, both of which survive a token
   swap silently because neither is a token:
   - **`opacity-NN` is not a colour.** It multiplies against whatever ground
     the new substrate provides. `opacity-45` on the time slot chips read fine
     on near-black and landed at ~2.0:1 on paper. Use explicit disabled tokens.
   - **Stripe Elements renders cross-origin.** `PaymentStep.tsx`'s `appearance`
     object takes literal hexes and cannot see this document's custom
     properties. It must be re-checked by hand on every palette change, and it
     is a payment surface, so guardrail 2 applies to touching it.

## Verification loop (the standard pass, in order)

1. `rm -rf .next && npm run build && npx tsc --noEmit && npm run lint`
   (build first — it generates the route types `tsc` needs; see above)
2. `npm audit` if `package.json` changed; grep `.next/static` for
   `sk_live|sk_test` if anything Stripe-adjacent changed.
3. Dev server + Chromium screenshots, 390px then desktop, for anything visual.
4. Read the full diff of whatever is about to be pushed.
5. Push to `main`, update the task list, report with evidence — what was
   verified and how, not just "done."
