# Getting worktrees onto another machine, and reaching them later

Written 2026-09-11 against the real state of both machines.

## First, the error on the MacBook screen

`Can't reach localhost:3000` is not a worktree problem. **Nothing is running on
that port.** Orca's browser is pointing at a dev server that was never started.

```bash
cd ~/orca/office-room-booking      # or the worktree you want
npm install
npx prisma generate
npm run dev                        # next dev -> :3000
```

Two things will still stop it after that, and neither is in git:

- **`.env` is not committed** (correctly — it holds secrets). The Mac has no
  `DATABASE_URL`, so Prisma cannot connect. Copy `.env` across by hand, or point
  it at a hosted Postgres.
- **`npm install` must run per worktree.** `node_modules` is gitignored, so a
  fresh worktree has none. This is why a cloned worktree looks broken.

## The `moonfish` worktree showing "rename failed"

Orca could not rename that worktree's directory, usually because a process still
has it open (a dev server, an editor, a terminal sitting in it). Close anything
using it, then either retry the rename or rebuild it cleanly:

```bash
git worktree list                       # see what git thinks exists
git worktree remove --force <path>      # the BRANCH survives this
git worktree prune                      # clear stale registrations
git worktree add ../workspaces/<name> <branch>
```

**Removing a worktree never deletes its branch.** That is the safety net.

## Getting every worktree onto the Mac

You do not copy worktrees. You clone the repo and recreate them from branches —
all of which are already pushed.

```bash
mkdir -p ~/orca ~/orca/workspaces && cd ~/orca

git clone https://github.com/sebastianireton-max/optimized-aminos
git clone https://github.com/sebastianireton-max/collage-maxxing
git clone https://github.com/sebastianireton-max/office-room-booking

cd ~/orca/optimized-aminos && git checkout claude/kashu-checkout-path
for a in operations-manager seo-lead ads-manager funnel-lead content-lead \
         store-engineer quality-auditor design-auditor; do
  git worktree add "../workspaces/optimized-aminos/$a" "agent/$a"
done

cd ~/orca/collage-maxxing
for a in cadence-engine lead-scout site-smith; do
  git worktree add "../workspaces/collage-maxxing/$a" "agent/$a"
done

cd ~/orca/office-room-booking
for a in design-auditor security-auditor; do
  git worktree add "../workspaces/office-room-booking/$a" "agent/$a"
done
```

Then `npm install` in each worktree you actually intend to run.

## "Run them on a server so I can access them later"

This is two different wishes, and they have different answers. Be clear which
one you mean before building anything.

### Wish A — "I want to open the app from any device"

**Use per-branch preview deploys.** This is exactly the problem they solve: push
a branch, get a URL, open it from the Mac, the phone, anywhere. **No machine of
yours has to be running.**

For `office-room-booking` (Next.js), Vercel does this natively — every branch,
including every `agent/*` branch, gets its own URL automatically on push. It is
the single highest-value thing you can set up for this goal.

One prerequisite that will bite: this app uses **Prisma**, so a deploy needs a
**hosted** Postgres (Neon, Supabase, Vercel Postgres) and `DATABASE_URL` set as
an environment variable in the host. A local SQLite/localhost database cannot be
reached from a deployed app.

`optimized-aminos` already deploys through Lovable — same idea, different host.

### Wish B — "I want to reach my actual running machine and its agents"

Preview deploys do not do this. A deployed branch is a *build*; it is not your
dev server, your G Brain, or your logged-in browser session.

**Use Tailscale.** It puts your machines on one private network, so the Mac can
open `http://<windows-machine>:3000` as if it were local. It is the same answer
as serving G Brain over HTTP (`gbrain serve --http --port 8322`) — one always-on
box, everything else connects to it.

Cloudflare Tunnel does the same with a public URL, which you want only if
someone outside your devices needs access.

**The cost is honest and unavoidable: the machine has to stay awake.** A laptop
that sleeps is not a server.

### What will NOT work

- **Putting worktrees in Dropbox / iCloud / OneDrive.** Two machines writing one
  `.git` corrupts it. Git is already the sync tool.
- **Expecting a cloud agent to do CRM work.** It can reach GitHub; it cannot
  reach a browser logged into Kashu. Repo work travels, session-bound browser
  work does not.

## The rule that prevents the real disaster

Before switching machines:

```bash
git push origin HEAD
```

On 2026-09-11 this repo had **22 modified files and one new component**
uncommitted on the Windows machine — roughly 1,000 lines that existed on exactly
one disk and on no branch. They are now on `wip/windows-uncommitted-2026-09-11`.
Anything not pushed is invisible to the other machine and one `git clean` from
gone.
