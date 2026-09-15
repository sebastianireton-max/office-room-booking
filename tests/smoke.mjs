// End-to-end smoke test against a running server. Never points at real data.
//
//   $env:DATABASE_PATH="data/smoke.db"; $env:AUTH_SECRET="smoke-secret-smoke-secret-smoke-secret"
//   $env:ADMIN_EMAILS="admin@smoke.test"; $env:GOOGLE_CLIENT_ID="smoke"; $env:GOOGLE_CLIENT_SECRET="smoke"
//   $env:STRIPE_SECRET_KEY="smoke-not-a-real-key"; $env:STRIPE_WEBHOOK_SECRET="smoke-webhook-secret"
//   npm run dev -- --port 3002      (same env), then:  npm run test:smoke
//
// `npm run ci` does all of that on port 3100 with a fresh data/ci.db (tests/ci.mjs).
//
// The Stripe values are deliberately not key-shaped: webhook signatures are
// checked locally, so no real key or network call is involved.
// Exits non-zero on the first failed check.
import { DatabaseSync } from "node:sqlite";
import { createHmac, randomUUID } from "node:crypto";
import { chromium } from "playwright";
import Stripe from "stripe";

const BASE = process.env.BASE ?? process.env.BASE_URL ?? "http://localhost:3002";
const DB = process.env.DATABASE_PATH;
const SECRET = process.env.AUTH_SECRET;
if (!DB || !SECRET || DB.includes("bookings.db")) throw new Error("Set DATABASE_PATH (not bookings.db) and AUTH_SECRET to match the server.");

let passed = 0;
const check = (name, ok, detail = "") => {
  if (!ok) {
    console.error(`FAIL  ${name} ${detail}`);
    process.exit(1);
  }
  passed++;
  console.log(`ok    ${name}`);
};
const get = (path, init) => fetch(BASE + path, { redirect: "manual", ...init });
const day = (n) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);
const sign = (payload) => {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${createHmac("sha256", SECRET).update(body).digest("base64url")}`;
};

// --- Public pages and search plumbing -------------------------------------
const home = await (await get("/")).text();
check("health endpoint answers", (await get("/api/health")).status === 200);
check("home renders the room board", home.includes("Open start times") && home.includes("The Boardroom"));
check("skip link is present", home.includes('href="#main-content"') && home.includes('id="main-content"'));
check("accessibility statement served", (await get("/accessibility")).status === 200);
check("home has LocalBusiness JSON-LD", home.includes('"@type":"LocalBusiness"'));

const room = await (await get("/rooms/podcast-a")).text();
const title = room.match(/<title>(.*?)<\/title>/)?.[1] ?? "";
check("room title names the brand once", (title.match(/Clockroom/g) ?? []).length === 1, title);
check("room has Service + BreadcrumbList JSON-LD", room.includes('"@type":"Service"') && room.includes('"@type":"BreadcrumbList"'));
check("room has canonical", room.includes('rel="canonical"') && room.includes("/rooms/podcast-a"));

const robots = await (await get("/robots.txt")).text();
check("robots blocks admin and account", robots.includes("Disallow: /admin") && robots.includes("Disallow: /account"));
const sitemap = await (await get("/sitemap.xml")).text();
check("sitemap lists all rooms", ["content-a", "content-b", "podcast-a", "podcast-b", "conference-a", "conference-b"].every((id) => sitemap.includes(`/rooms/${id}`)));
const og = await get("/opengraph-image");
check("OG image is a PNG", og.status === 200 && og.headers.get("content-type")?.includes("image/png"));
check("manifest served", (await get("/manifest.webmanifest")).status === 200);
check("unknown URL is a real 404", (await get("/definitely-not-a-page")).status === 404);
const confirmation = await (await get(`/confirmation/${randomUUID()}`)).text();
check("confirmation page is noindex", /<meta name="robots" content="noindex/.test(confirmation));
check("CSP forbids framing", (await get("/")).headers.get("content-security-policy")?.includes("frame-ancestors 'none'"));

// --- Booking engine guards ---------------------------------------------------
const dayRes = await (await get(`/api/availability/day?date=${day(2)}&durationMinutes=60`)).json();
check("day availability covers 6 rooms", dayRes.rooms?.length === 6);

// Each request looks like a different client, so the per-IP hold limit (10/min)
// does not trip mid-suite. Locally there is no proxy, so the header is honoured.
let ip = 0;
const hold = (body) =>
  get("/api/bookings/hold", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": `10.0.0.${++ip}` },
    body: JSON.stringify({ roomId: "content-a", durationMinutes: 60, customerName: "Smoke Test", customerEmail: "guest@smoke.test", ...body }),
  });
check("server refuses a past date", (await hold({ date: day(-1), startTime: "10:00" })).status === 400);
check("server refuses beyond the booking horizon", (await hold({ date: day(400), startTime: "10:00" })).status === 400);
check("server refuses off-grid start", (await hold({ date: day(3), startTime: "10:30" })).status === 400);

const first = await hold({ date: day(3), startTime: "10:00" });
const firstBody = await first.json();
check("hold succeeds for an open slot", first.status === 200, JSON.stringify(firstBody));
check("hold response carries no email", !JSON.stringify(firstBody).includes("guest@smoke.test"));
check("second hold on same slot is refused", (await hold({ date: day(3), startTime: "10:00" })).status === 409);
const publicRead = await (await get(`/api/bookings/${firstBody.booking.id}`)).json();
check("public booking read hides PII", !JSON.stringify(publicRead).includes("guest@smoke.test") && publicRead.booking.status === "pending_payment");

const formula = await (await hold({ date: day(3), startTime: "15:00", customerName: "=HYPERLINK(\"x\")" })).json();

// --- Seed users directly (the server already created the schema) ------------
const db = new DatabaseSync(DB);
const now = new Date().toISOString();
const adminId = randomUUID();
const userId = randomUUID();
db.prepare("INSERT INTO users (id, google_sub, email, name, picture, created_at, last_login_at) VALUES (?,?,?,?,?,?,?)").run(adminId, `sub-${adminId}`, "admin@smoke.test", "Admin", null, now, now);
db.prepare("INSERT INTO users (id, google_sub, email, name, picture, created_at, last_login_at) VALUES (?,?,?,?,?,?,?)").run(userId, `sub-${userId}`, "guest@smoke.test", "Guest", null, now, now);

// --- Stripe webhook, signed exactly as Stripe signs it -------------------------
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "smoke-webhook-secret";
const stripeLocal = new Stripe("smoke-not-a-real-key");
const webhook = (type, object, secret = WEBHOOK_SECRET) => {
  const payload = JSON.stringify({ id: `evt_${randomUUID()}`, object: "event", type, data: { object } });
  const header = stripeLocal.webhooks.generateTestHeaderString({ payload, secret });
  return get("/api/webhooks/stripe", { method: "POST", headers: { "stripe-signature": header, "Content-Type": "application/json" }, body: payload });
};
const statusOf = (id) => db.prepare("SELECT status, payment_issue, stripe_refund_id FROM bookings WHERE id=?").get(id);
// attachPaymentIntent's effect, without calling Stripe's API.
const attach = (id, pi) => db.prepare("UPDATE bookings SET stripe_payment_intent_id=? WHERE id=?").run(pi, id);

check("webhook rejects a bad signature", (await webhook("payment_intent.succeeded", { id: "pi_x" }, "wrong-secret")).status === 400);
attach(firstBody.booking.id, "pi_smoke_first");
check("signed payment_intent.succeeded is accepted", (await webhook("payment_intent.succeeded", { id: "pi_smoke_first", object: "payment_intent" })).status === 200);
check("webhook confirms the held booking", statusOf(firstBody.booking.id).status === "confirmed");
await webhook("payment_intent.succeeded", { id: "pi_smoke_first", object: "payment_intent" });
check("replayed webhook is idempotent", statusOf(firstBody.booking.id).status === "confirmed");

attach(formula.booking.id, "pi_smoke_late");
db.prepare("UPDATE bookings SET status='expired' WHERE id=?").run(formula.booking.id);
await webhook("payment_intent.succeeded", { id: "pi_smoke_late", object: "payment_intent" });
const late = statusOf(formula.booking.id);
check("payment after a lapsed hold is flagged, not confirmed", late.status === "expired" && Boolean(late.payment_issue));

const refundable = await (await hold({ date: day(5), startTime: "09:00" })).json();
attach(refundable.booking.id, "pi_smoke_refund");
await webhook("payment_intent.succeeded", { id: "pi_smoke_refund", object: "payment_intent" });
await webhook("charge.refunded", { id: "ch_1", object: "charge", refunded: false, payment_intent: "pi_smoke_refund", refunds: { data: [{ id: "re_partial" }] } });
check("partial refund leaves the booking confirmed", statusOf(refundable.booking.id).status === "confirmed");
await webhook("charge.refunded", { id: "ch_1", object: "charge", refunded: true, payment_intent: "pi_smoke_refund", refunds: { data: [{ id: "re_full" }] } });
const refunded = statusOf(refundable.booking.id);
check("full refund cancels the booking and records the refund", refunded.status === "cancelled" && refunded.stripe_refund_id === "re_full");

const failing = await (await hold({ date: day(5), startTime: "13:00" })).json();
attach(failing.booking.id, "pi_smoke_failed");
await webhook("payment_intent.payment_failed", { id: "pi_smoke_failed", object: "payment_intent" });
check("signed payment_intent.payment_failed releases the hold", statusOf(failing.booking.id).status === "expired");
const rehold = await hold({ date: day(5), startTime: "13:00" });
const pending = await rehold.json();
check("released slot can be held again", rehold.status === 200);

// --- Calendar file ------------------------------------------------------------
const ics = await get(`/api/bookings/${firstBody.booking.id}/calendar`);
check("confirmed booking downloads as text/calendar", ics.status === 200 && ics.headers.get("content-type")?.includes("text/calendar"));
check("pending booking has no calendar file", (await get(`/api/bookings/${pending.booking.id}/calendar`)).status === 404);

// --- Double-booking race: 12 customers, one slot, same instant -------------------
const race = await Promise.all(Array.from({ length: 12 }, () => hold({ date: day(4), startTime: "12:00", roomId: "podcast-b" })));
const codes = race.map((r) => r.status);
check("concurrent holds on one slot: exactly one wins", codes.filter((c) => c === 200).length === 1 && codes.filter((c) => c === 409).length === 11, codes.join(","));
const exp = Math.floor(Date.now() / 1000) + 3600;
const adminCookie = `cr_session=${sign({ uid: adminId, exp })}`;
const userCookie = `cr_session=${sign({ uid: userId, exp })}`;

// --- Auth gates ----------------------------------------------------------------
const anon = await get("/admin");
check("admin redirects anonymous users to sign-in", anon.status === 307 && anon.headers.get("location")?.includes("/signin"));
const forged = await get("/admin", { headers: { cookie: `cr_session=${sign({ uid: adminId, exp }).slice(0, -2)}xx` } });
check("tampered session cookie is rejected", forged.headers.get("location")?.includes("/signin"));
const expired = await get("/admin", { headers: { cookie: `cr_session=${sign({ uid: adminId, exp: 1 })}` } });
check("expired session cookie is rejected", expired.headers.get("location")?.includes("/signin"));
const nonAdmin = await get("/admin", { headers: { cookie: userCookie } });
check("non-admin is turned away", nonAdmin.headers.get("location")?.includes("/account?denied=1"));
check("CSV export is admin-only", (await get("/admin/bookings/export", { headers: { cookie: userCookie } })).status === 404);

const account = await (await get("/account", { headers: { cookie: userCookie } })).text();
check("customer sees bookings made with their email", !account.includes("Nothing booked yet") && account.includes(`/confirmation/${firstBody.booking.id}`));

const oauth = await get("/api/auth/google?next=//evil.example");
const loc = oauth.headers.get("location") ?? "";
check("Google start uses PKCE + state + nonce", loc.startsWith("https://accounts.google.com/") && loc.includes("code_challenge_method=S256") && loc.includes("state=") && loc.includes("nonce="));
check("OAuth state cookie is httpOnly", /cr_oauth=.*HttpOnly/i.test(oauth.headers.get("set-cookie") ?? ""));
const cb = await get("/api/auth/google/callback?code=x&state=forged");
check("callback without matching state fails closed", cb.headers.get("location")?.includes("/signin?error=expired"));

const csv = await (await get("/admin/bookings/export", { headers: { cookie: adminCookie } })).text();
check("CSV export works for admin", csv.startsWith('"reference"') || csv.startsWith("reference"));
check("CSV neutralises spreadsheet formulas", csv.includes(`"'=HYPERLINK(""x"")"`));

// --- Admin UI in a real browser -----------------------------------------------
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
await ctx.addCookies([{ name: "cr_session", value: adminCookie.split("=").slice(1).join("="), url: BASE }]);
const page = await ctx.newPage();

await page.goto(`${BASE}/admin`);
check("dashboard loads", await page.getByRole("heading", { name: "Today" }).isVisible());
check("dashboard surfaces the paid-but-unbooked customer", await page.getByRole("heading", { name: "Charged, not booked" }).isVisible());

await page.goto(`${BASE}/admin/bookings/${formula.booking.id}`);
await page.getByRole("button", { name: "Mark handled" }).click();
await page.waitForURL(/notice=/);
check("admin Mark handled clears the payment issue", !statusOf(formula.booking.id).payment_issue);

await page.goto(`${BASE}/admin/blocks`);
await page.selectOption('select[name="roomId"]', "content-a");
await page.fill('input[name="date"]', day(3));
await page.selectOption('select[name="startTime"]', "09:00");
await page.selectOption('select[name="endTime"]', "12:00");
await page.fill('input[name="reason"]', "Smoke test repair");
await page.getByRole("button", { name: "Block" }).click();
await page.waitForURL(/notice=/);
check("block-out warns about the confirmed booking inside it", (await page.textContent("[role=status]"))?.includes("1 confirmed booking"));
const slots = (await (await get(`/api/availability?roomId=content-a&date=${day(3)}&durationMinutes=60`)).json()).slots;
check("blocked slot shows closed", slots.find((s) => s.startTime === "11:00")?.unavailableReason === "closed");

await page.goto(`${BASE}/admin/bookings/${firstBody.booking.id}`);
// A refund would call Stripe's API, which this suite never does.
const refundBox = page.locator('input[name="refund"]');
if (await refundBox.count()) await refundBox.uncheck();
await page.getByRole("button", { name: "Cancel booking" }).click();
await page.waitForURL(/notice=/);
check("admin cancel succeeds", (await page.textContent("[role=status]"))?.includes("Cancelled"));
const after = (await (await get(`/api/availability?roomId=content-a&date=${day(3)}&durationMinutes=60`)).json()).slots;
check("cancelled slot is closed only by the block, not the booking", after.find((s) => s.startTime === "10:00")?.unavailableReason === "closed");

await page.goto(`${BASE}/admin/blocks`);
await page.getByRole("button", { name: "Remove" }).first().click();
await page.waitForURL(/notice=/);
const reopened = (await (await get(`/api/availability?roomId=content-a&date=${day(3)}&durationMinutes=60`)).json()).slots;
check("removing the block reopens the slot", reopened.find((s) => s.startTime === "10:00")?.available === true);

await page.goto(`${BASE}/confirmation/${refundable.booking.id}`);
await page.getByText(/was cancelled/).first().waitFor();
check("cancelled booking's confirmation says it was cancelled", (await page.textContent("main"))?.includes("was cancelled"));

// Every in-page link has to land on something (a dead /#find shipped once).
const probe = await ctx.newPage();
const probed = new Set();
for (const path of ["/", "/about", "/account", "/pricing", "/definitely-not-a-page"]) {
  await page.goto(BASE + path, { waitUntil: "networkidle" });
  const hrefs = [...new Set(await page.$$eval("a[href*='#']", (as) => as.map((a) => a.href)))];
  for (const href of hrefs) {
    const url = new URL(href);
    if (url.origin !== new URL(BASE).origin || url.hash.length < 2 || probed.has(url.pathname + url.hash)) continue;
    probed.add(url.pathname + url.hash);
    await probe.goto(href, { waitUntil: "networkidle" });
    const found = await probe.evaluate((id) => Boolean(document.getElementById(id)), decodeURIComponent(url.hash.slice(1)));
    check(`fragment ${url.pathname}${url.hash} on ${path} resolves`, found);
  }
}
await probe.close();

await page.goto(`${BASE}/admin/activity`);
const audit = (await page.textContent("table")) ?? "";
check("audit log records the actions", ["Cancelled", "Marked handled", "Blocked time", "Removed block"].every((a) => audit.includes(a)));

// --- Keyboard only: the claims on /accessibility have to be true ----------------
const kb = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
await kb.goto(BASE + "/", { waitUntil: "networkidle" });
await kb.keyboard.press("Tab");
check("first Tab lands on the skip link", (await kb.evaluate(() => document.activeElement?.textContent)) === "Skip to content");
await kb.keyboard.press("Enter");
check("skip link moves focus to the content", (await kb.evaluate(() => document.activeElement?.id)) === "main-content");

// --- Booking panel ------------------------------------------------------------
// podcast-b has one held hour (the race winner) at 12:00 on day(4).
await kb.goto(`${BASE}/rooms/podcast-b?date=${day(4)}&duration=60#book`, { waitUntil: "networkidle" });
const dateGroup = kb.getByRole("radiogroup", { name: "Date" });
await kb.waitForFunction(() => [...document.querySelectorAll("input[type=radio][aria-label]")].some((r) => /open time/.test(r.getAttribute("aria-label"))));
const dayLabels = await dateGroup.getByRole("radio").evaluateAll((rs) => rs.map((r) => r.getAttribute("aria-label")));
check("week strip shows 7 days with open counts", dayLabels.length === 7 && dayLabels.every((l) => /open time/.test(l)), dayLabels.join(" | "));
const timeGroup = kb.getByRole("radiogroup", { name: /^Start time on/ });
await timeGroup.waitFor();
const times = await timeGroup.locator("label").allInnerTexts();
check("only available start times render", !times.includes("12 PM") && times.includes("11 AM"), times.join(","));
check("unavailable times are summarised in one line", (await kb.textContent("#book"))?.includes("1 time already booked."));

let onSlot = false;
for (let i = 0; i < 40 && !onSlot; i++) {
  await kb.keyboard.press("Tab");
  onSlot = await kb.evaluate(() => document.activeElement?.type === "radio" && /^\d{1,2} [AP]M$/.test(document.activeElement.closest("label")?.textContent ?? ""));
}
check("a time slot is reachable by Tab", onSlot);
check("focused time shows a visible ring", (await kb.evaluate(() => getComputedStyle(document.activeElement.closest("label")).outlineStyle)) !== "none");
await kb.keyboard.press("Space");
const firstTime = await kb.evaluate(() => document.activeElement.checked && document.activeElement.closest("label").textContent);
check("Space selects the focused time", Boolean(firstTime));
await kb.keyboard.press("ArrowRight");
const nextTime = await kb.evaluate(() => document.activeElement.checked && document.activeElement.closest("label").textContent);
check("arrow keys move within the time radiogroup", Boolean(nextTime) && nextTime !== firstTime, `${firstTime} -> ${nextTime}`);

// A time picked on the homepage board opens straight on Details.
await kb.goto(`${BASE}/rooms/content-b?date=${day(6)}&start=10:00&duration=60#book`, { waitUntil: "networkidle" });
await kb.getByLabel("Full name").waitFor();
check("deep link opens the Details step", (await kb.textContent('[aria-current="step"]'))?.includes("Details"));
await kb.getByLabel("Full name").fill("Smoke Panel");
await kb.getByLabel("Email").fill("panel@smoke.test");
// Stripe is never called from this suite: stand in for the intent route; the hold is real.
await kb.route("**/api/checkout/create-payment-intent", (r) =>
  r.fulfill({ json: { clientSecret: "smoke_client_secret", holdExpiresAt: new Date(Date.now() + 30 * 60_000).toISOString() } })
);
await kb.getByRole("button", { name: "Review booking" }).click();
await kb.getByText(/Held for you until/).waitFor();
const review = (await kb.textContent("#book")) ?? "";
check("Review & pay shows the price breakdown", /1 hour × \$\d+/.test(review) && (await kb.textContent('[aria-current="step"]'))?.includes("Review"), review.slice(0, 300));
check("hold notice gives a clock time", /Held for you until \d{1,2}:\d{2}\s[AP]M/.test(review));
// This build has no publishable key, so PaymentStep shows its neutral message instead of "Pay $".
const payButton = await kb.getByRole("button", { name: /^Pay \$\d/ }).count();
check("payment area shows Pay $ or the neutral not-switched-on message", payButton > 0 || /Online payment isn.t switched on yet/.test(review));

// --- No horizontal scroll at phone width --------------------------------------
const phone = await browser.newContext({ viewport: { width: 390, height: 844 } });
await phone.addCookies([{ name: "cr_session", value: adminCookie.split("=").slice(1).join("="), url: BASE }]);
const p = await phone.newPage();
for (const path of ["/", "/rooms/podcast-a", "/pricing", "/faq", "/contact", "/accessibility", "/signin", "/account", "/admin", "/admin/bookings"]) {
  await p.goto(BASE + path, { waitUntil: "networkidle" });
  const overflow = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check(`no horizontal scroll at 390px on ${path}`, overflow <= 0, `overflow ${overflow}px`);
}

await browser.close();
console.log(`\n${passed} checks passed`);
