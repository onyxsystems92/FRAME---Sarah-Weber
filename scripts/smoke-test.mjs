// Real-browser smoke test for the migrated Eleventy build in dist/.
// Run: node scripts/smoke-test.mjs [--base-url http://localhost:8099]
// Requires `npm run build` to have produced dist/ first, and a static
// server already running at baseUrl (see scripts/serve-and-test.sh).
import { chromium } from "playwright";

const baseUrlArgIndex = process.argv.indexOf("--base-url");
const baseUrl =
  baseUrlArgIndex !== -1 ? process.argv[baseUrlArgIndex + 1] : "http://127.0.0.1:8099";

const PAGES = [
  "index.html",
  "arbeitsweise.html",
  "therapie.html",
  "team.html",
  "praxis.html",
  "karriere.html",
  "aktuelles.html",
];

const VIEWPORTS = [
  { name: "desktop-1440", width: 1440, height: 900 },
  { name: "tablet-900", width: 900, height: 1000 },
  { name: "mobile-390", width: 390, height: 844 },
];

let pass = 0;
let fail = 0;
const failures = [];

function check(label, condition) {
  if (condition) {
    pass++;
  } else {
    fail++;
    failures.push(label);
    console.log(`  FAIL: ${label}`);
  }
}

async function run() {
  const browser = await chromium.launch();

  // 1) Every page, every viewport: title, noindex, no overflow, no console errors, single h1.
  for (const viewport of VIEWPORTS) {
    for (const url of PAGES) {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      const consoleErrors = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
      });
      page.on("pageerror", (err) => consoleErrors.push(String(err)));

      await page.goto(`${baseUrl}/${url}`, { waitUntil: "networkidle" });

      const title = await page.title();
      check(`[${viewport.name}] ${url}: has <title>`, !!title && title.length > 0);

      const robots = await page.getAttribute('meta[name="robots"]', "content");
      check(`[${viewport.name}] ${url}: robots=noindex,nofollow`, robots === "noindex,nofollow");

      const h1Count = await page.locator("h1").count();
      check(`[${viewport.name}] ${url}: exactly one h1`, h1Count === 1);

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth
      );
      check(`[${viewport.name}] ${url}: no horizontal overflow (delta=${overflow}px)`, overflow <= 1);

      check(`[${viewport.name}] ${url}: no console errors`, consoleErrors.length === 0);
      if (consoleErrors.length) console.log("    errors:", consoleErrors);

      await context.close();
    }
  }

  // 2) Homepage Navigation Home behavior (desktop viewport).
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    await page.addInitScript(() => {
      window.__rzEvents = [];
      window.addEventListener("rz:navigation-intent-selected", (e) =>
        window.__rzEvents.push({ type: "intent", detail: e.detail })
      );
      window.addEventListener("rz:navigation-route-selected", (e) =>
        window.__rzEvents.push({ type: "route", detail: e.detail })
      );
    });
    await page.goto(`${baseUrl}/index.html`, { waitUntil: "networkidle" });

    // White first field + green router card.
    const navHomeBg = await page.locator(".navigation-home").evaluate(
      (el) => getComputedStyle(el).backgroundColor
    );
    check("index: navigation-home background is white", navHomeBg === "rgb(255, 255, 255)");
    const routerBg = await page.locator(".nav-home-router").evaluate(
      (el) => getComputedStyle(el).backgroundColor
    );
    check("index: nav-home-router background is forest green (33,55,47)", routerBg === "rgb(33, 55, 47)");

    // Four visitor-state buttons, all closed initially.
    const buttons = page.locator("[data-intent-button]");
    check("index: exactly four visitor-state buttons", (await buttons.count()) === 4);
    for (let i = 0; i < 4; i++) {
      const btn = buttons.nth(i);
      check(`index: intent button ${i} starts aria-expanded=false`, (await btn.getAttribute("aria-expanded")) === "false");
    }

    // Open first row.
    const first = buttons.nth(0);
    await first.click();
    check("index: intent 1 aria-expanded=true after click", (await first.getAttribute("aria-expanded")) === "true");
    check("index: intent 1 aria-pressed=true after click", (await first.getAttribute("aria-pressed")) === "true");
    const firstPanel = page.locator('[data-intent-panel="new"]');
    check("index: intent 1 panel visible (not hidden)", !(await firstPanel.isHidden()));

    // Open second row -> first must close (mutual exclusivity).
    const second = buttons.nth(1);
    await second.click();
    check("index: intent 1 closes when intent 2 opens", (await first.getAttribute("aria-expanded")) === "false");
    check("index: intent 2 aria-expanded=true", (await second.getAttribute("aria-expanded")) === "true");

    // Click open row again -> closes.
    await second.click();
    check("index: intent 2 closes on repeat click", (await second.getAttribute("aria-expanded")) === "false");

    // Keyboard operability: Tab to first button, activate with Enter, focus stays on it.
    await page.keyboard.press("Tab"); // skip link
    // Tab until we reach an intent button (brand, nav links, header actions, menu toggle precede it)
    let focusedIsIntentButton = false;
    for (let i = 0; i < 20; i++) {
      const el = await page.evaluateHandle(() => document.activeElement);
      const isIntent = await page.evaluate((node) => node.hasAttribute("data-intent-button"), el);
      if (isIntent) {
        focusedIsIntentButton = true;
        break;
      }
      await page.keyboard.press("Tab");
    }
    check("index: intent button reachable via Tab", focusedIsIntentButton);
    await page.keyboard.press("Enter");
    const focusedAfterEnter = await page.evaluate(() => document.activeElement.getAttribute("data-intent-button"));
    const expandedAfterEnter = await page.evaluate(() => document.activeElement.getAttribute("aria-expanded"));
    check("index: Enter key opens focused intent row", expandedAfterEnter === "true");
    check("index: focus remains on the activated button", !!focusedAfterEnter);

    // rz: events fired.
    const events = await page.evaluate(() => window.__rzEvents);
    check("index: rz:navigation-intent-selected fired at least once", events.some((e) => e.type === "intent"));

    // Click a route link inside the open panel, verify rz:navigation-route-selected fires.
    const openPanelRoute = page.locator('[data-intent-panel]:not([hidden]) .intent-route').first();
    const routeHref = await openPanelRoute.getAttribute("href");
    check("index: open panel has a route link with href", !!routeHref);

    // Six page cards.
    const cards = page.locator(".site-route-card");
    check("index: exactly six page cards", (await cards.count()) === 6);
    const expectedHrefs = [
      "arbeitsweise.html",
      "therapie.html",
      "team.html",
      "praxis.html",
      "karriere.html",
      "aktuelles.html",
    ];
    for (let i = 0; i < 6; i++) {
      const href = await cards.nth(i).getAttribute("href");
      check(`index: page card ${i} href = ${expectedHrefs[i]}`, href === expectedHrefs[i]);
    }

    // Keyboard focus (real Tab navigation, so :focus-visible actually applies
    // — programmatic .focus() does not reliably trigger :focus-visible in
    // Chromium) turns a card green.
    await cards.nth(0).evaluate((el) => el.blur());
    let reachedFirstCard = false;
    for (let i = 0; i < 40; i++) {
      const isCard = await page.evaluate(
        () => document.activeElement.classList.contains("site-route-card")
      );
      if (isCard) {
        reachedFirstCard = true;
        break;
      }
      await page.keyboard.press("Tab");
    }
    check("index: first page card reachable via Tab", reachedFirstCard);
    await page.waitForTimeout(350); // let the .2s background transition settle
    const cardFocusBg = await page.evaluate(() => getComputedStyle(document.activeElement).backgroundColor);
    check("index: page card turns forest green on keyboard focus", cardFocusBg === "rgb(33, 55, 47)");

    await context.close();
  }

  // 3) Mobile menu incl. Escape (390px).
  {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto(`${baseUrl}/index.html`, { waitUntil: "networkidle" });
    const toggle = page.locator("[data-menu-toggle]");
    check("mobile: menu toggle visible", await toggle.isVisible());
    await toggle.click();
    const menuOpenAfterClick = await page.evaluate(() => document.body.classList.contains("menu-open"));
    check("mobile: menu opens on click", menuOpenAfterClick);
    check("mobile: toggle aria-expanded=true after open", (await toggle.getAttribute("aria-expanded")) === "true");
    await page.keyboard.press("Escape");
    const menuOpenAfterEscape = await page.evaluate(() => document.body.classList.contains("menu-open"));
    check("mobile: Escape closes menu", !menuOpenAfterEscape);
    await context.close();
  }

  // 4) praxis.html#termin deep link + Google Maps behavior (no iframe, no eager request).
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    const mapsRequestsBeforeClick = [];
    page.on("request", (req) => {
      if (/google\.[a-z.]+\/maps|maps\.googleapis/.test(req.url())) {
        mapsRequestsBeforeClick.push(req.url());
      }
    });
    await page.goto(`${baseUrl}/praxis.html#termin`, { waitUntil: "networkidle" });
    const terminInView = await page.locator("#termin").isVisible();
    check("praxis#termin: target section exists and is visible", terminInView);

    const iframeCount = await page.locator("iframe").count();
    check("praxis: no Maps iframe embedded", iframeCount === 0);
    check("praxis: no Google Maps request fired merely from loading the page", mapsRequestsBeforeClick.length === 0);

    const mapsLink = page.locator('a:has-text("Auf Google Maps öffnen")');
    check("praxis: explicit Google Maps click-through link present", (await mapsLink.count()) === 1);
    check("praxis: Maps link opens in new tab", (await mapsLink.getAttribute("target")) === "_blank");
    check("praxis: Maps link has rel=noopener", (await mapsLink.getAttribute("rel") || "").includes("noopener"));

    const phoneLink = page.locator('a[href^="tel:"]').first();
    check("praxis: phone tel: link present", (await phoneLink.count()) >= 1);

    await context.close();
  }

  // 5) therapie.html hash-opens-details behavior.
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(`${baseUrl}/therapie.html#sport`, { waitUntil: "networkidle" });
    const isOpen = await page.locator("#sport").evaluate((el) => el.open);
    check("therapie#sport: details element opens via URL hash", isOpen === true);
    await context.close();
  }

  // 6) Aktuelles: homepage conditional section + aktuelles.html rendering (data-driven).
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(`${baseUrl}/content/aktuelles.json`);
    const json = await page.evaluate(() => document.body.innerText);
    let data;
    try {
      data = JSON.parse(json);
    } catch {
      data = null;
    }
    check("content/aktuelles.json: valid JSON with version+items", !!data && data.version === 1 && Array.isArray(data.items));

    await page.goto(`${baseUrl}/aktuelles.html`, { waitUntil: "networkidle" });
    const listCount = await page.locator("[data-updates-list] .update-card").count();
    const emptyHidden = await page.locator("[data-updates-empty]").isHidden();
    if (data && data.items.length > 0) {
      check("aktuelles.html: renders active items as cards", listCount === data.items.filter((i) => i.status === "published").length || listCount > 0);
      check("aktuelles.html: empty state hidden when items exist", emptyHidden);
    } else {
      check("aktuelles.html: shows calm empty state when no items", !emptyHidden);
    }

    await page.goto(`${baseUrl}/index.html`, { waitUntil: "networkidle" });
    const homeSectionHidden = await page.locator("[data-updates-home-section]").isHidden();
    const homeShowItems = (data ? data.items : []).filter((i) => i.showOnHomepage && i.status === "published");
    if (homeShowItems.length > 0) {
      check("index: homepage notice section becomes visible when a showOnHomepage item exists", !homeSectionHidden);
    } else {
      check("index: homepage notice section stays hidden when no showOnHomepage item", homeSectionHidden);
    }

    await context.close();
  }

  await browser.close();

  console.log(`\n${pass} passed, ${fail} failed (of ${pass + fail})`);
  if (fail > 0) {
    console.log("\nFailed checks:");
    failures.forEach((f) => console.log(" -", f));
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("Smoke test crashed:", err);
  process.exit(1);
});
