// One command for local and GitHub CI. Never touches data/bookings.db.
//
//   node tests/ci.mjs verify   build, then typecheck (the build generates route types), then lint
//   node tests/ci.mjs          boot `next start` on 3100 with a fresh data/ci.db, run the smoke
//                              suite and design:verify against it, always stop the server
//
// The env below is the non-secret smoke env from tests/smoke.mjs. The Stripe values are
// deliberately not key-shaped; no real key or network call is involved.
import { spawn } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";

const PORT = 3100;
const BASE = `http://localhost:${PORT}`;
const DB = "data/ci.db";
const env = {
  ...process.env,
  // A production build refuses to run without a public origin; CI serves on localhost.
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? BASE,
  DATABASE_PATH: DB,
  AUTH_SECRET: "smoke-secret-smoke-secret-smoke-secret",
  ADMIN_EMAILS: "admin@smoke.test",
  GOOGLE_CLIENT_ID: "smoke",
  GOOGLE_CLIENT_SECRET: "smoke",
  STRIPE_SECRET_KEY: "smoke-not-a-real-key",
  STRIPE_WEBHOOK_SECRET: "smoke-webhook-secret",
  BASE,
};

const run = (args, opts = {}) =>
  new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { stdio: "inherit", env: opts.env ?? env });
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${args.join(" ")} exited ${code}`))));
    child.on("error", reject);
  });

if (process.argv[2] === "verify") {
  // Only the build needs the origin; keep the developer's own env otherwise.
  const buildEnv = { ...process.env, NEXT_PUBLIC_SITE_URL: env.NEXT_PUBLIC_SITE_URL };
  await run(["node_modules/next/dist/bin/next", "build"], { env: buildEnv });
  await run(["node_modules/typescript/bin/tsc", "--noEmit"], { env: buildEnv });
  await run(["node_modules/eslint/bin/eslint.js"], { env: buildEnv });
  process.exit(0);
}

mkdirSync("data", { recursive: true });
for (const suffix of ["", "-wal", "-shm", "-journal"]) rmSync(DB + suffix, { force: true });

const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(PORT)], { stdio: "inherit", env });
let failed = false;
try {
  let up = false;
  for (let i = 0; i < 120 && !up; i++) {
    if (server.exitCode !== null) throw new Error(`next start exited ${server.exitCode}`);
    up = await fetch(`${BASE}/api/health`).then((r) => r.ok, () => false);
    if (!up) await new Promise((r) => setTimeout(r, 500));
  }
  if (!up) throw new Error(`server did not answer ${BASE}/api/health within 60s`);
  await run(["tests/smoke.mjs"]);
  await run([".agents/skills/design-verified/verify.mjs", "--base", BASE]);
} catch (err) {
  failed = true;
  console.error(`\nci failed: ${err.message}`);
} finally {
  server.kill();
  await new Promise((r) => (server.exitCode !== null ? r() : server.once("exit", r)));
}
process.exit(failed ? 1 : 0);
