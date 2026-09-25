// Visual review evidence: real Chromium screenshots of the built site.
//
//   node scripts/design-review-shots.mjs --base-url http://127.0.0.1:8099 --out ../review-shots
//   node scripts/design-review-shots.mjs --out ./shots --viewport 1440
//
// Produces, per page and viewport, an above-the-fold and a full-page capture,
// plus the interaction states that a static page capture cannot show. The page
// is scrolled through before each capture so scroll-triggered reveals have run;
// otherwise a screenshot would show content the visitor never sees that way.
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i !== -1 ? process.argv[i + 1] : fallback;
};
const baseUrl = arg("--base-url", "http://127.0.0.1:8099");
const outDir = path.resolve(arg("--out", "review-shots"));
const onlyViewport = arg("--viewport", null);

const PAGES = ["index", "arbeitsweise", "therapie", "team", "praxis", "karriere", "aktuelles"];
const VIEWPORTS = [
  { name: "1440", width: 1440, height: 900 },
  { name: "900", width: 900, height: 1000 },
  { name: "390", width: 390, height: 844 },
];

fs.mkdirSync(outDir, { recursive: true });

// Scrolling must be instant: the stylesheet sets scroll-behavior: smooth, and a
// smooth scroll is still in flight when the next step fires.
const settle = (page) =>
  page.evaluate(async () => {
    const step = window.innerHeight * 0.6;
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo({ top: y, behavior: "instant" });
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo({ top: 0, behavior: "instant" });
    await new Promise((r) => setTimeout(r, 700));
  });

const browser = await chromium.launch();

for (const viewport of VIEWPORTS) {
  if (onlyViewport && onlyViewport !== viewport.name) continue;
  const isPhone = viewport.width <= 430;
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    hasTouch: isPhone,
    isMobile: isPhone,
  });
  const page = await context.newPage();

  for (const name of PAGES) {
    await page.goto(`${baseUrl}/${name}.html`, { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    await settle(page);
    await page.screenshot({ path: path.join(outDir, `${name}-${viewport.name}-fold.png`) });
    await page.screenshot({ path: path.join(outDir, `${name}-${viewport.name}-full.png`), fullPage: true });
  }

  // Navigation Home with the first visitor state opened.
  await page.goto(`${baseUrl}/index.html`, { waitUntil: "networkidle" });
  await page.locator("[data-intent-button]").first().click();
  await page.waitForTimeout(700);
  await page.locator(".nav-home-router").scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, `index-${viewport.name}-navhome-open.png`) });

  await context.close();
}

// Interaction states that only exist while something is hovered, focused or open.
if (!onlyViewport || onlyViewport === "1440") {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto(`${baseUrl}/index.html`, { waitUntil: "networkidle" });
  await settle(page);
  await page.locator(".practice-navigation-section").scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await page.locator(".site-route-card").nth(1).hover();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, "state-routecard-hover.png") });
  await page.locator(".site-route-card").nth(4).evaluate((el) => el.focus());
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, "state-routecard-focus.png") });

  await page.goto(`${baseUrl}/therapie.html`, { waitUntil: "networkidle" });
  await settle(page);
  await page.locator("#sport summary").scrollIntoViewIfNeeded();
  await page.locator("#sport summary").click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outDir, "state-therapie-details.png") });

  await page.goto(`${baseUrl}/arbeitsweise.html`, { waitUntil: "networkidle" });
  await settle(page);
  await page.locator(".time-mark").scrollIntoViewIfNeeded();
  await page.waitForTimeout(2200);
  await page.screenshot({ path: path.join(outDir, "state-time-mark.png") });
  await context.close();
}

if (!onlyViewport || onlyViewport === "390") {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/index.html`, { waitUntil: "networkidle" });
  await page.locator("[data-menu-toggle]").tap();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, "state-mobile-menu.png") });
  await page.reload({ waitUntil: "networkidle" });
  await page.locator("[data-intent-button]").first().tap();
  await page.waitForTimeout(600);
  await page.locator(".nav-home-router").scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, "state-mobile-navhome-open.png") });
  await context.close();
}

await browser.close();
console.log(`Review screenshots written to ${outDir}`);
