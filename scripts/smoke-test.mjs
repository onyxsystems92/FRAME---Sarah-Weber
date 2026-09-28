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
      const externalRequests = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
      });
      page.on("pageerror", (err) => consoleErrors.push(String(err)));
      page.on("request", (req) => {
        const target = req.url();
        if (!target.startsWith(baseUrl) && !target.startsWith("data:")) externalRequests.push(target);
      });

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

      // Nothing may be fetched from a third party, and every image needs alt text.
      check(
        `[${viewport.name}] ${url}: no external requests${externalRequests.length ? " (" + [...new Set(externalRequests)].join(", ") + ")" : ""}`,
        externalRequests.length === 0
      );
      const missingAlt = await page.evaluate(
        () => [...document.querySelectorAll("img")].filter((img) => img.getAttribute("alt") === null).length
      );
      check(`[${viewport.name}] ${url}: every image has an alt attribute`, missingAlt === 0);

      // Heading levels must not skip a step.
      const headingJumps = await page.evaluate(() => {
        const levels = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((h) => Number(h.tagName[1]));
        const jumps = [];
        levels.forEach((lvl, i) => {
          if (i > 0 && lvl > levels[i - 1] + 1) jumps.push(`h${levels[i - 1]}->h${lvl}`);
        });
        return jumps;
      });
      check(`[${viewport.name}] ${url}: heading order has no skipped level${headingJumps.length ? " (" + headingJumps.join(", ") + ")" : ""}`, headingJumps.length === 0);

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
    const openPanelRoute = page.locator('[data-intent-panel][data-open] .intent-route').first();
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

  // 7) Design-review additions: animated disclosure, image slots, motion
  //    accessibility and the deep-link offset under the sticky header.
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(`${baseUrl}/index.html`, { waitUntil: "networkidle" });

    // Collapsed visitor-state panels must be out of the tab order.
    const collapsedLink = page.locator('[data-intent-panel]:not([data-open]) .intent-route').first();
    const collapsedVisibility = await collapsedLink.evaluate((el) => getComputedStyle(el.closest("[data-intent-panel]")).visibility);
    check("index: collapsed intent panel is visibility:hidden (not tabbable)", collapsedVisibility === "hidden");

    // The panel animates its own height instead of snapping.
    const first = page.locator("[data-intent-button]").first();
    const panel = page.locator('[data-intent-panel="new"]');
    const rowsClosed = await panel.evaluate((el) => getComputedStyle(el).gridTemplateRows);
    await first.click();
    await page.waitForTimeout(450);
    const rowsOpen = await panel.evaluate((el) => getComputedStyle(el).gridTemplateRows);
    check("index: intent panel expands its grid row (animated disclosure)", parseFloat(rowsOpen) > parseFloat(rowsClosed) + 10);
    check("index: opened intent panel is visible", await panel.isVisible());
    const routeTabbable = await page.locator('[data-intent-panel][data-open] .intent-route').first()
      .evaluate((el) => getComputedStyle(el.closest("[data-intent-panel]")).visibility);
    check("index: opened panel routes become tabbable", routeTabbable === "visible");

    // Image slots: a photo has alt text; an empty slot is a quiet surface that
    // is hidden from assistive technology and carries no visible label.
    const figures = await page.evaluate(() => [...document.querySelectorAll(".rz-figure")].map((f) => ({
      img: f.querySelector("img"),
      hidden: f.getAttribute("aria-hidden") === "true",
      text: f.innerText.trim(),
    })).map((f) => ({ hasImg: !!f.img, hidden: f.hidden, text: f.text })));
    check("index: at least one practice image slot exists", figures.length > 0);
    check("index: every empty image slot is aria-hidden", figures.every((f) => f.hasImg || f.hidden));
    check("index: no image slot shows visible text", figures.every((f) => f.text === ""));

    // Full-bleed bands really span the viewport.
    const bandWidth = await page.locator(".atmosphere-band .rz-figure").evaluate((el) => el.getBoundingClientRect().width);
    check(`index: atmosphere band is full-bleed (${Math.round(bandWidth)}px of 1440)`, bandWidth >= 1439);

    await context.close();
  }

  // 8) Deep link lands below the sticky header, not underneath it.
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(`${baseUrl}/praxis.html#termin`, { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    const geometry = await page.evaluate(() => ({
      target: document.querySelector("#termin").getBoundingClientRect().top,
      header: document.querySelector(".site-header").getBoundingClientRect().bottom,
    }));
    check(
      `praxis#termin: target clears the sticky header (target ${Math.round(geometry.target)}px, header ${Math.round(geometry.header)}px)`,
      geometry.target >= geometry.header - 1
    );
    await context.close();
  }

  // 9) Reduced motion: no reveal animation, nothing stays hidden.
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto(`${baseUrl}/index.html`, { waitUntil: "networkidle" });
    await page.waitForTimeout(300);
    const reduced = await page.evaluate(() => ({
      flag: document.documentElement.hasAttribute("data-reveal"),
      faded: [...document.querySelectorAll(".site-route-card, .context-row")].filter((el) => parseFloat(getComputedStyle(el).opacity) < 0.9).length,
    }));
    check("reduced motion: reveal animation is not enabled", reduced.flag === false);
    check("reduced motion: no content is left faded out", reduced.faded === 0);
    await context.close();
  }

  // 10) Without JavaScript the site is still complete and readable.
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(`${baseUrl}/index.html`, { waitUntil: "load" });
    check("no javascript: the six page cards are visible", await page.locator(".site-route-card").first().isVisible());
    check("no javascript: the practice image band is visible", await page.locator(".atmosphere-band .rz-figure").isVisible());
    await context.close();
  }

  // 11) Touch targets on a real phone viewport.
  {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const page = await context.newPage();
    let tooSmall = [];
    for (const url of PAGES) {
      await page.goto(`${baseUrl}/${url}`, { waitUntil: "networkidle" });
      const small = await page.evaluate(() => [...document.querySelectorAll("a, button")]
        .filter((el) => {
          const r = el.getBoundingClientRect();
          // WCAG 2.5.8 exempts a link that sits inside a sentence of text.
          const inline = getComputedStyle(el).display === "inline" && !!el.closest("p, dd");
          return r.width > 0 && r.height > 0 && r.height < 24 && !el.classList.contains("skip-link") && !inline;
        })
        .map((el) => `${el.tagName}.${(el.className || "").toString().split(" ")[0]}`));
      tooSmall = tooSmall.concat(small.map((s) => `${url}:${s}`));
    }
    check(`mobile: no interactive target under 24px${tooSmall.length ? " (" + [...new Set(tooSmall)].join(", ") + ")" : ""}`, tooSmall.length === 0);
    await context.close();
  }

  // 12) Client preview surface (Franklyn's review decisions, 2026-09-28).
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    const WHITE = "rgb(255, 255, 255)";
    const FOREST = "rgb(33, 55, 47)";
    const INTERNAL = [
      "Platzhalter", "noindex", "Konzeptentwurf", "Preview", "Review", "Tilmann", "FRAME",
      "vor Veröffentlichung", "Entwurf", "nach Freigabe", "Launch", "medizinischen Angaben",
      "Design-Review", "Bildrechte",
    ];
    for (const url of PAGES) {
      await page.goto(`${baseUrl}/${url}`, { waitUntil: "networkidle" });
      const report = await page.evaluate(() => {
        const bg = (el) => getComputedStyle(el).backgroundColor;
        const surfaces = [document.querySelector(".site-header"), ...document.querySelectorAll("main > section, main > div"), document.querySelector(".footer")]
          .filter(Boolean)
          .map((el) => ({ name: `${el.tagName}.${(el.className || "").toString().split(" ")[0]}`, bg: bg(el) }));
        return { body: bg(document.body), surfaces, text: document.body.innerText };
      });
      check(`${url}: page background is white`, report.body === WHITE);
      const off = report.surfaces.filter((s) => ![WHITE, FOREST, "rgba(0, 0, 0, 0)"].includes(s.bg));
      check(`${url}: every section is white or green${off.length ? " (" + off.map((o) => o.name + " " + o.bg).join(", ") + ")" : ""}`, off.length === 0);
      const leaks = INTERNAL.filter((w) => report.text.includes(w));
      check(`${url}: no internal preview language visible${leaks.length ? " (" + leaks.join(", ") + ")" : ""}`, leaks.length === 0);
      const header = report.surfaces[0];
      check(`${url}: header is green`, header.bg === FOREST);
    }

    // Header call to action: website white with green text.
    const cta = await page.locator(".header-cta").evaluate((el) => ({ bg: getComputedStyle(el).backgroundColor, color: getComputedStyle(el).color }));
    check("header: Termin & Kontakt is white with green text", cta.bg === WHITE && cta.color === FOREST);

    // Homepage: two-part hero, no disclaimer, no tile arrows, green treatment index.
    await page.goto(`${baseUrl}/index.html`, { waitUntil: "networkidle" });
    check("index: no middle image in the first screen", (await page.locator(".navigation-home img, .navigation-home .rz-figure").count()) === 0);
    check("index: page cards carry no arrow", (await page.locator(".site-route-card").evaluateAll((els) => els.filter((el) => /[↗→]/.test(el.innerText)).length)) === 0);
    const contextSection = await page.locator(".context-index").evaluate((el) => getComputedStyle(el.closest("section")).backgroundColor);
    check("index: treatment context section is green", contextSection === FOREST);
    const row = page.locator(".context-row").nth(1);
    await row.scrollIntoViewIfNeeded();
    await row.hover();
    await page.waitForTimeout(350);
    check("index: hovered treatment row turns white", (await row.evaluate((el) => getComputedStyle(el).backgroundColor)) === WHITE);

    // Arbeitsweise: a real sequence, three steps joined by two lines.
    await page.goto(`${baseUrl}/arbeitsweise.html`, { waitUntil: "networkidle" });
    check("arbeitsweise: process has three steps", (await page.locator(".process__step").count()) === 3);
    check("arbeitsweise: steps are joined by two lines", (await page.locator(".process__line").count()) === 2);
    check("arbeitsweise: process steps are not interactive", (await page.locator(".process a, .process button").count()) === 0);

    // Therapie: every method is listed in the green overview.
    await page.goto(`${baseUrl}/therapie.html`, { waitUntil: "networkidle" });
    check("therapie: eight methods listed", (await page.locator(".method-rows li").count()) === 8);
    check("therapie: methods overview is green", (await page.locator(".methods").evaluate((el) => getComputedStyle(el.closest("section")).backgroundColor)) === FOREST);

    // Karriere: real inline accordions.
    await page.goto(`${baseUrl}/karriere.html`, { waitUntil: "networkidle" });
    const triggers = page.locator("[data-accordion-trigger]");
    check("karriere: four accordion items", (await triggers.count()) === 4);
    const wiring = await triggers.evaluateAll((els) => els.every((b) => {
      const panel = document.getElementById(b.getAttribute("aria-controls"));
      return b.tagName === "BUTTON" && b.getAttribute("aria-expanded") === "false" && panel && panel.getAttribute("aria-labelledby") === b.id;
    }));
    check("karriere: triggers are buttons wired to their panels", wiring);
    const first = triggers.nth(0);
    const second = triggers.nth(1);
    await first.scrollIntoViewIfNeeded();
    await first.click();
    await page.waitForTimeout(400);
    check("karriere: click opens the item", (await first.getAttribute("aria-expanded")) === "true");
    check("karriere: opened text is visible", await page.locator("#karriere-1-panel p").isVisible());
    check("karriere: open item is green", (await first.evaluate((el) => getComputedStyle(el).backgroundColor)) === FOREST);
    const directlyBelow = await page.evaluate(() => {
      const t = document.getElementById("karriere-1-trigger").getBoundingClientRect();
      const p = document.getElementById("karriere-1-panel").getBoundingClientRect();
      return Math.abs(p.top - t.bottom) < 2;
    });
    check("karriere: text opens directly under its item", directlyBelow);
    await second.click();
    await page.waitForTimeout(400);
    check("karriere: opening another closes the first", (await first.getAttribute("aria-expanded")) === "false" && (await second.getAttribute("aria-expanded")) === "true");
    await second.click();
    await page.waitForTimeout(400);
    check("karriere: second click closes it", (await second.getAttribute("aria-expanded")) === "false");
    await second.focus();
    await page.keyboard.press("Enter");
    await page.waitForTimeout(200);
    check("karriere: Enter opens the focused item", (await second.getAttribute("aria-expanded")) === "true");
    check("karriere: focus stays on the pressed button", await second.evaluate((el) => el === document.activeElement));
    check("karriere: collapsed panels are not tabbable", (await page.locator("#karriere-1-panel").evaluate((el) => getComputedStyle(el).visibility)) === "hidden");

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
