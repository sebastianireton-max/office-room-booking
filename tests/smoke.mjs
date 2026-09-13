// End-to-end smoke test against a running server. Never points at real data.
//
//   $env:DATABASE_PATH="data/smoke.db"; $env:AUTH_SECRET="smoke-secret-smoke-secret-smoke-secret"
//   $env:ADMIN_EMAILS="admin@smoke.test"; $env:GOOGLE_CLIENT_ID="smoke"; $env:GOOGLE_CLIENT_SECRET="smoke"
//   npm run dev -- --port 3002      (same env), then:  npm run test:smoke
//
// Exits non-zero on the first failed check.
import { DatabaseSync } from "node:sqlite";
import { createHmac, randomUUID } from "node:crypto";
import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3002";
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
check("home renders the finder", home.includes("Find an open room"));
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

const hold = (body) =>
  get("/api/bookings/hold", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
// Simulate the webhook outcomes: one confirmed booking, one paid-after-expiry.
db.prepare("UPDATE bookings SET status='confirmed', hold_expires_at=NULL WHERE id=?").run(firstBody.booking.id);
db.prepare("UPDATE bookings SET status='expired', payment_issue='Charged after the hold moved to \"expired\". Refund or rebook.' WHERE id=?").run(formula.booking.id);
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
check("dashboard surfaces the paid-but-unbooked customer", await page.getByText("Charged but not booked").isVisible());

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
await page.getByRole("button", { name: "Cancel booking" }).click();
await page.waitForURL(/notice=/);
check("admin cancel succeeds", (await page.textContent("[role=status]"))?.includes("Cancelled"));
const after = (await (await get(`/api/availability?roomId=content-a&date=${day(3)}&durationMinutes=60`)).json()).slots;
check("cancelled slot is closed only by the block, not the booking", after.find((s) => s.startTime === "10:00")?.unavailableReason === "closed");

await page.goto(`${BASE}/admin/activity`);
check("audit log records the actions", (await page.textContent("table"))?.includes("cancel"));

// --- No horizontal scroll at phone width --------------------------------------
const phone = await browser.newContext({ viewport: { width: 390, height: 844 } });
await phone.addCookies([{ name: "cr_session", value: adminCookie.split("=").slice(1).join("="), url: BASE }]);
const p = await phone.newPage();
for (const path of ["/", "/rooms/podcast-a", "/pricing", "/faq", "/signin", "/admin", "/admin/bookings"]) {
  await p.goto(BASE + path, { waitUntil: "networkidle" });
  const overflow = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check(`no horizontal scroll at 390px on ${path}`, overflow <= 0, `overflow ${overflow}px`);
}

await browser.close();
console.log(`\n${passed} checks passed`);
