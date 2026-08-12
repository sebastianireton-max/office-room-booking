#!/usr/bin/env node
/**
 * design-verified: mechanical verification pass.
 *
 * Implements every box in SKILL.md Section 8. Reading code cannot catch these;
 * a rendered page can. Run it against a live dev server.
 *
 *   node .agents/skills/design-verified/verify.mjs --base http://localhost:3002
 *
 * Exit code 0 = all checks pass, 1 = at least one failure, 2 = could not run.
 */

import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_ROUTES = ["/", "/rooms/podcast-a", "/pricing", "/faq", "/about", "/contact"];
const DEFAULT_WIDTHS = [390, 1440];

function parseArgs(argv) {
  const args = { base: "http://localhost:3002", out: ".design-audit", json: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--base") args.base = argv[++i];
    else if (a === "--out") args.out = argv[++i];
    else if (a === "--routes") args.routes = argv[++i].split(",").map((r) => r.trim());
    else if (a === "--widths") args.widths = argv[++i].split(",").map((w) => parseInt(w.trim(), 10));
    else if (a === "--json") args.json = true;
    else if (a === "--help") args.help = true;
  }
  args.routes ??= DEFAULT_ROUTES;
  args.widths ??= DEFAULT_WIDTHS;
  return args;
}

/**
 * Runs inside the page. Returns raw findings; all WCAG math happens here so we
 * only cross the bridge once per route/width.
 */
function auditInPage() {
  const parseColor = (str) => {
    const m = String(str).match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(/[,/]/).map((v) => parseFloat(v.trim()));
    if (p.length < 3 || p.some((v) => Number.isNaN(v))) return null;
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };

  const luminance = ({ r, g, b }) => {
    const f = (c) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };

  const ratio = (fg, bg) => {
    const l1 = luminance(fg);
    const l2 = luminance(bg);
    const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
    return (hi + 0.05) / (lo + 0.05);
  };

  const composite = (fg, bg) => ({
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  });

  /** Walk ancestors to find the effective painted background behind `el`. */
  const effectiveBg = (el) => {
    let node = el;
    let acc = null;
    while (node && node !== document.documentElement.parentNode) {
      const cs = getComputedStyle(node);
      if (cs.backgroundImage && cs.backgroundImage !== "none") return { unknown: true };
      const c = parseColor(cs.backgroundColor);
      if (c && c.a > 0) {
        acc = acc ? composite(acc, c) : c;
        if (acc.a >= 0.999) return acc;
      }
      node = node.parentElement;
    }
    return acc && acc.a >= 0.999 ? acc : { r: 255, g: 255, b: 255, a: 1 };
  };

  const visible = (el) => {
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none" || parseFloat(cs.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };

  const ownText = (el) =>
    Array.from(el.childNodes)
      .filter((n) => n.nodeType === Node.TEXT_NODE)
      .map((n) => n.textContent.trim())
      .join(" ")
      .trim();

  const findings = { contrast: [], tapTargets: [], wrappedCtas: [], eyebrows: [], emDashes: [] };

  // ---- contrast -----------------------------------------------------------
  const seen = new Set();
  for (const el of document.querySelectorAll("body *")) {
    const text = ownText(el);
    if (!text || !visible(el)) continue;
    const cs = getComputedStyle(el);
    const fgRaw = parseColor(cs.color);
    if (!fgRaw) continue;
    const bg = effectiveBg(el);
    if (bg.unknown) continue; // background image: cannot compute honestly
    const fg = fgRaw.a < 1 ? composite(fgRaw, bg) : fgRaw;
    const size = parseFloat(cs.fontSize);
    const weight = parseInt(cs.fontWeight, 10) || 400;
    const large = size >= 24 || (size >= 18.66 && weight >= 700);
    const required = large ? 3 : 4.5;
    const r = ratio(fg, bg);
    if (r < required) {
      const key = `${cs.color}|${cs.fontSize}|${text.slice(0, 40)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      findings.contrast.push({
        text: text.slice(0, 60),
        tag: el.tagName.toLowerCase(),
        color: cs.color,
        background: `rgb(${Math.round(bg.r)}, ${Math.round(bg.g)}, ${Math.round(bg.b)})`,
        fontSize: cs.fontSize,
        fontWeight: weight,
        ratio: Math.round(r * 100) / 100,
        required,
      });
    }
  }

  // ---- tap targets --------------------------------------------------------
  // WCAG 2.5.5 (AAA) wants 44x44. 2.5.8 (AA) wants 24x24 and explicitly exempts
  // links inline in a block of text. Flagging every footer link is noise, so
  // only genuine controls are measured: form fields, buttons, and links that
  // are styled as buttons (block/flex box with its own background or padding).
  const isButtonLike = (el) => {
    if (el.tagName === "BUTTON" || el.getAttribute("role") === "button") return true;
    if (["INPUT", "SELECT", "TEXTAREA"].includes(el.tagName)) return true;
    if (el.tagName !== "A") return false;
    const cs = getComputedStyle(el);
    if (cs.display === "inline") return false;
    const bg = parseColor(cs.backgroundColor);
    const hasFill = bg && bg.a > 0;
    const hasPad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) >= 12;
    const hasBorder = parseFloat(cs.borderTopWidth) > 0;
    return hasFill || hasPad || hasBorder;
  };
  for (const el of document.querySelectorAll("a, button, input, select, textarea, [role='button']")) {
    if (!visible(el) || !isButtonLike(el)) continue;
    if (el.tagName === "INPUT" && el.type === "hidden") continue;
    const r = el.getBoundingClientRect();
    if (r.width < 44 || r.height < 44) {
      findings.tapTargets.push({
        tag: el.tagName.toLowerCase(),
        text: (el.innerText || el.value || el.getAttribute("aria-label") || "").trim().slice(0, 40),
        width: Math.round(r.width),
        height: Math.round(r.height),
      });
    }
  }

  // ---- wrapped CTAs (buttons whose label spans >1 visual line) ------------
  for (const el of document.querySelectorAll("button, a[class*='btn'], [role='button']")) {
    if (!visible(el)) continue;
    const text = el.innerText?.trim();
    if (!text) continue;
    const range = document.createRange();
    range.selectNodeContents(el);
    const rects = Array.from(range.getClientRects()).filter((r) => r.width > 0 && r.height > 0);
    const tops = new Set(rects.map((r) => Math.round(r.top)));
    if (tops.size > 1) {
      findings.wrappedCtas.push({ text: text.slice(0, 40), lines: tops.size });
    }
  }

  // ---- eyebrow count ------------------------------------------------------
  // An eyebrow is a label above a *section headline*. Site chrome uses the same
  // typography for nav and footer column headings, which are not eyebrows, so
  // header/footer subtrees are excluded rather than inflating the count.
  const inChrome = (el) => !!el.closest("header, footer, nav");
  const scope = document.querySelector("main") || document.body;
  for (const el of scope.querySelectorAll("*")) {
    const text = ownText(el);
    if (!text || text.length > 60 || !visible(el) || inChrome(el)) continue;
    const cs = getComputedStyle(el);
    const size = parseFloat(cs.fontSize);
    const tracking = parseFloat(cs.letterSpacing);
    const isUpper = cs.textTransform === "uppercase" || (text === text.toUpperCase() && /[A-Z]{3}/.test(text));
    if (!isUpper || size > 15 || !Number.isFinite(tracking) || tracking / size < 0.06) continue;
    // A real eyebrow sits directly above a heading. A metadata strip does not.
    const container = el.parentElement;
    const followedByHeading =
      !!el.nextElementSibling?.matches?.("h1, h2, h3") ||
      !!container?.querySelector("h1, h2, h3");
    if (followedByHeading) findings.eyebrows.push(text.slice(0, 40));
  }

  const sectionCount = Math.max(
    1,
    document.querySelectorAll("main section, section").length ||
      (document.querySelector("main")?.children.length ?? 0)
  );

  // ---- em-dashes ----------------------------------------------------------
  // The em-dash ban is absolute. The en-dash is only a violation when used as a
  // prose separator; between digits ("8:00 AM-10:00 PM") it is correct range
  // typography, so those are not reported.
  const bodyText = document.body.innerText || "";
  for (const ch of ["—", "–"]) {
    let idx = bodyText.indexOf(ch);
    while (idx !== -1 && findings.emDashes.length < 40) {
      const before = bodyText.slice(Math.max(0, idx - 10), idx);
      const after = bodyText.slice(idx + 1, idx + 11);
      // A range has a number on each side with nothing sentence-like between,
      // which covers "8:00 AM-10:00 PM" and "2018-2026" but not prose dashes.
      const isNumericRange = /\d[^.,;:!?]{0,7}$/.test(before) && /^[^.,;:!?]{0,7}\d/.test(after);
      if (!(ch === "–" && isNumericRange)) {
        findings.emDashes.push({
          char: ch === "—" ? "em-dash" : "en-dash",
          context: bodyText.slice(Math.max(0, idx - 30), idx + 30).replace(/\s+/g, " "),
        });
      }
      idx = bodyText.indexOf(ch, idx + 1);
    }
  }

  // ---- nav ----------------------------------------------------------------
  // Cluster nav items by vertical centre with a tolerance, so items whose tops
  // differ by a few px (icon vs text baseline) are not counted as extra rows.
  const nav = document.querySelector("header nav, nav");
  let navInfo = null;
  if (nav && visible(nav)) {
    const r = nav.getBoundingClientRect();
    const centres = Array.from(nav.querySelectorAll("a, button"))
      .filter(visible)
      .map((k) => {
        const kr = k.getBoundingClientRect();
        return kr.top + kr.height / 2;
      })
      .sort((a, b) => a - b);
    const rows = [];
    for (const c of centres) {
      if (!rows.length || c - rows[rows.length - 1] > 16) rows.push(c);
    }
    navInfo = { height: Math.round(r.height), rows: Math.max(1, rows.length) };
  }

  return {
    findings,
    sectionCount,
    eyebrowBudget: Math.ceil(sectionCount / 3),
    nav: navInfo,
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    title: document.title,
  };
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log(`design-verified verifier

  --base <url>       base URL (default http://localhost:3002)
  --routes a,b,c     routes to test (default: repo marketing pages)
  --widths 390,1440  viewport widths
  --out <dir>        output directory (default .design-audit)
  --json             print machine-readable report to stdout`);
    process.exit(0);
  }

  // Fail loudly rather than producing a green report against a dead server.
  try {
    const res = await fetch(args.base, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch (err) {
    console.error(`Cannot reach ${args.base}: ${err.message}`);
    console.error("Start the dev server first:  npm run dev -- --port 3002");
    process.exit(2);
  }

  await mkdir(args.out, { recursive: true });
  const browser = await chromium.launch();
  const results = [];

  for (const width of args.widths) {
    const context = await browser.newContext({
      viewport: { width, height: width < 700 ? 844 : 900 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    const consoleErrors = [];
    // React needs eval() for dev-only debugging features and this repo's CSP
    // deliberately omits 'unsafe-eval'. Dev-mode noise, not a page defect.
    const KNOWN_DEV_NOISE = [/eval\(\) is not supported in this environment/];
    page.on("console", (m) => {
      if (m.type() !== "error") return;
      const text = m.text();
      if (KNOWN_DEV_NOISE.some((re) => re.test(text))) return;
      consoleErrors.push(text.slice(0, 200));
    });

    for (const route of args.routes) {
      const url = new URL(route, args.base).toString();
      let audit = null;
      let error = null;
      try {
        const resp = await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
        if (resp && resp.status() >= 400) error = `HTTP ${resp.status()}`;
        else {
          audit = await page.evaluate(auditInPage);
          const slug = route === "/" ? "home" : route.replace(/^\//, "").replace(/[^\w-]/g, "-");
          const shot = path.join(args.out, `${slug}-${width}.png`);
          await page.screenshot({ path: shot, fullPage: true });
          audit.screenshot = shot;
        }
      } catch (err) {
        error = err.message.split("\n")[0];
      }
      results.push({ route, width, url, error, audit, consoleErrors: [...consoleErrors] });
      consoleErrors.length = 0;
    }
    await context.close();
  }

  await browser.close();

  // ---- collate ------------------------------------------------------------
  const failures = [];
  const warnings = [];
  for (const r of results) {
    const where = `${r.route} @ ${r.width}px`;
    if (r.error) {
      failures.push(`${where}: page error - ${r.error}`);
      continue;
    }
    const a = r.audit;
    const f = a.findings;

    if (a.scrollWidth > a.clientWidth + 1) {
      failures.push(`${where}: horizontal scroll (scrollWidth ${a.scrollWidth} > clientWidth ${a.clientWidth})`);
    }
    for (const c of f.contrast) {
      failures.push(
        `${where}: contrast ${c.ratio}:1 (needs ${c.required}:1) - "${c.text}" ${c.color} on ${c.background}`
      );
    }
    for (const c of f.emDashes) {
      failures.push(`${where}: ${c.char} in "...${c.context}..."`);
    }
    if (r.width >= 1024) {
      for (const c of f.wrappedCtas) {
        failures.push(`${where}: CTA "${c.text}" wraps to ${c.lines} lines`);
      }
      if (a.nav && a.nav.rows > 1) failures.push(`${where}: nav renders on ${a.nav.rows} lines`);
      if (a.nav && a.nav.height > 80) failures.push(`${where}: nav is ${a.nav.height}px tall (max 80)`);
    }
    if (f.eyebrows.length > a.eyebrowBudget) {
      failures.push(
        `${where}: ${f.eyebrows.length} eyebrows over ${a.sectionCount} sections (budget ${a.eyebrowBudget}) - ${f.eyebrows.join(", ")}`
      );
    }
    for (const t of f.tapTargets) {
      warnings.push(`${where}: tap target ${t.width}x${t.height}px <${t.tag}> "${t.text}"`);
    }
    for (const e of r.consoleErrors) warnings.push(`${where}: console error - ${e}`);
  }

  const report = {
    base: args.base,
    routes: args.routes,
    widths: args.widths,
    failures,
    warnings,
    screenshots: results.filter((r) => r.audit?.screenshot).map((r) => r.audit.screenshot),
    pass: failures.length === 0,
  };

  await writeFile(path.join(args.out, "report.json"), JSON.stringify({ report, results }, null, 2));

  const md = [
    `# design-verified report`,
    ``,
    `Base: ${args.base}`,
    `Routes: ${args.routes.join(", ")}`,
    `Widths: ${args.widths.join(", ")}`,
    ``,
    `## Result: ${report.pass ? "PASS" : `FAIL (${failures.length})`}`,
    ``,
    ...(failures.length ? [`### Failures`, ...failures.map((x) => `- ${x}`), ``] : []),
    ...(warnings.length ? [`### Warnings`, ...warnings.map((x) => `- ${x}`), ``] : []),
    `### Screenshots`,
    ...report.screenshots.map((s) => `- ${s}`),
  ].join("\n");
  await writeFile(path.join(args.out, "report.md"), md);

  if (args.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(md);
  }
  process.exit(report.pass ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
