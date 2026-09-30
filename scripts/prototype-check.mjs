// Real-browser check for the exported "Funktioneller Status" prototype.
//
//   npm run prototype:check                 (exports first)
//   node scripts/prototype-check.mjs [--shots <dir>]
//
// Runs the complete demo story twice, once through the offline launcher's
// local server (http://127.0.0.1) and once straight from file://, and checks:
// every step, edit/add/remove/reclassify flows, confirmation, documentation
// sync, copy/download, reset, no requests outside the prototype, no browser
// storage, no console errors, no horizontal overflow at 1440/900/390,
// keyboard focus and reduced motion.
import { spawn } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
// PROTOTYPE_PACKAGE=<dir> checks a copied package, e.g. the offline presentation folder.
const pkg = process.env.PROTOTYPE_PACKAGE || join(root, "prototype-release", "funktioneller-status");
const shotsIndex = process.argv.indexOf("--shots");
const shots = shotsIndex !== -1 ? process.argv[shotsIndex + 1] : null;
if (shots) mkdirSync(shots, { recursive: true });

let pass = 0;
const failures = [];
function check(label, condition, detail = "") {
  if (condition) pass++;
  else { failures.push(label); console.log(`  FAIL: ${label}${detail ? ` (${detail})` : ""}`); }
}

function startServer() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [join(pkg, "serve-local.mjs"), "--no-open"], { stdio: ["ignore", "pipe", "pipe"] });
    child.stdout.on("data", (chunk) => {
      const match = /Läuft: (http:\/\/127\.0\.0\.1:\d+\/)/.exec(String(chunk));
      if (match) resolve({ child, url: match[1] });
    });
    child.on("error", reject);
    setTimeout(() => reject(new Error("offline server did not start")), 8000);
  });
}

// PROTOTYPE_URL=<url> checks an already running server instead (e.g. the
// Basic-Auth Worker under `wrangler dev`). Credentials come from
// PROTOTYPE_USER / PROTOTYPE_PASS and are only ever sent to a local host.
const remoteUrl = process.env.PROTOTYPE_URL || null;
const auth = process.env.PROTOTYPE_USER ? { username: process.env.PROTOTYPE_USER, password: process.env.PROTOTYPE_PASS || "" } : null;
if (auth && remoteUrl && !["127.0.0.1", "localhost"].includes(new URL(remoteUrl).hostname)) {
  throw new Error("Credentials are only used against a local host.");
}

async function newPage(browser, origin, opts = {}) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }, acceptDownloads: true,
    ...(auth && origin.startsWith("http") ? { httpCredentials: auth } : {}), ...opts,
  });
  if (origin.startsWith("http")) await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin });
  const page = await context.newPage();
  const log = { errors: [], foreign: [] };
  page.on("console", (m) => { if (m.type() === "error") log.errors.push(m.text()); });
  page.on("pageerror", (e) => log.errors.push(e.message));
  page.on("request", (r) => {
    const url = r.url();
    if (!(url.startsWith(origin) || url.startsWith("blob:") || url.startsWith("data:"))) log.foreign.push(url);
  });
  return { context, page, log };
}

const stepTitle = (page) => page.locator("#step-title").innerText();
const next = (page) => page.locator('[data-key="nav-next"]').click();

async function story(browser, url, label) {
  const origin = url.startsWith("file:") ? "file://" : new URL(url).origin;
  const { context, page, log } = await newPage(browser, origin);
  const t = (name) => `[${label}] ${name}`;
  await page.goto(url);

  // 1 · Demo-Fall öffnen
  check(t("opens on Status erfassen"), (await stepTitle(page)) === "Status erfassen");
  check(t("demo case is prefilled"), (await page.locator("#field-anamnese").inputValue()).includes("Ziehender Schmerz"));
  check(t("demo badge visible"), (await page.locator(".demo-badge").innerText()).includes("synthetische"));
  check(t("real logo loaded"), await page.locator(".brand__logo").evaluate((img) => img.complete && img.naturalWidth > 0));
  check(t("heading order h1 → h2"), (await page.locator("h1").count()) === 1 && (await page.locator("h2#step-title").count()) === 1);

  // 2 · Statusfeld ändern
  await page.locator("#field-sport").fill("Laufen viermal pro Woche, Halbmarathon in zehn Wochen, Umfang stark gesteigert.");
  check(t("changed status field is marked"), await page.locator(".field.is-touched #field-sport").count() === 1);

  // 3 · Faktoren: ändern, entfernen (+ rückgängig), ergänzen, umklassifizieren
  await next(page);
  check(t("step 2 title"), (await stepTitle(page)) === "Relevante Faktoren");
  check(t("factor from changed status flagged"), await page.locator('[data-factor="f-umfang"] .flag').count() === 1);
  await page.locator('[data-key="factor-f-bws-edit"]').click();
  await page.locator('[data-key="factor-f-bws-input"]').fill("Rotation der BWS deutlich eingeschränkt");
  await page.keyboard.press("Enter");
  check(t("factor edited"), (await page.locator('[data-factor="f-bws"] .factor__text').innerText()) === "Rotation der BWS deutlich eingeschränkt");
  await page.locator('[data-key="factor-f-regeneration-remove"]').click();
  check(t("factor removed"), await page.locator('[data-factor="f-regeneration"]').count() === 0);
  await page.locator('[data-key="toast-undo"]').click();
  check(t("factor removal undone"), await page.locator('[data-factor="f-regeneration"]').count() === 1);
  await page.locator('[data-key="factor-f-regeneration-remove"]').click();
  await page.locator('[data-key="add-factor-modifiable"]').click();
  await page.locator('[data-key="add-factor-modifiable-input"]').fill("Fußgewölbe rechts unter Last abgeflacht");
  await page.locator('[data-key="add-factor-modifiable-input-save"]').click();
  check(t("own factor added"), (await page.locator(".factor-col--modifiable .factor.is-own").innerText()).includes("Fußgewölbe"));
  await page.locator('[data-key="factor-f-schuh-cat-modifiable"]').click();
  check(t("factor reclassified"), await page.locator('.factor-col--modifiable [data-factor="f-schuh"]').count() === 1);
  check(t("reclassify keeps focus"), await page.evaluate(() => document.activeElement?.dataset.key) === "factor-f-schuh-cat-modifiable");

  // 4 · Funktionelle Synthese editieren und bestätigen
  await next(page);
  check(t("step 3 title"), (await stepTitle(page)) === "Funktionelles Problem");
  check(t("removed factor shown as removed on statement"), await page.locator('[data-statement="s-6"] .chip.is-removed').count() === 1);
  const hyp = page.locator("#hypothesis");
  await hyp.click();
  await hyp.evaluate((el) => el.setSelectionRange(el.value.length, el.value.length));
  await page.keyboard.type(" Verlauf nach zwei Wochen prüfen.");
  check(t("hypothesis edited"), (await hyp.inputValue()).endsWith("Verlauf nach zwei Wochen prüfen."));
  await page.locator('[data-key="confirm"]').click();
  check(t("hypothesis confirmed"), (await page.locator(".hypothesis .pill").innerText()).includes("Bestätigt"));
  await page.locator('[data-key="add-st-question"]').click();
  await page.locator('[data-key="add-st-question-input"]').fill("Wie sieht das Laufbild nach 8 km aus?");
  await page.keyboard.press("Enter");
  check(t("statement added"), (await page.locator(".statement-col--question").innerText()).includes("Laufbild nach 8 km"));
  check(t("change after confirmation reopens draft"), (await page.locator(".hypothesis .pill").innerText()).includes("nach Bestätigung geändert"));
  await page.locator('[data-statement="s-4"] select').selectOption("observation");
  check(t("statement retyped"), await page.locator('.statement-col--observation [data-statement="s-4"]').count() === 1);
  await page.locator('[data-key="confirm"]').click();
  check(t("reconfirmed"), (await page.locator(".flow__value.is-confirmed").innerText()) === "Bestätigt");

  // 5–7 · Interventionen übernehmen, anpassen, entfernen, eigene hinzufügen
  await next(page);
  check(t("step 4 title"), (await stepTitle(page)) === "Interventionskandidaten");
  check(t("seven candidates"), await page.locator("article.icard").count() === 7);
  await page.locator('[data-key="i-i-hueftmob-accept"]').click();
  await page.locator('[data-key="i-i-einbein-accept"]').click();
  check(t("interventions accepted"), await page.locator("article.icard.is-accepted").count() === 2);
  await page.locator('[data-key="i-i-lpstab-adjust"]').click();
  await page.locator("#adjust-i-lpstab-title").fill("Lumbopelvine Stabilisation im Stand und Laufschritt");
  await page.locator("#adjust-i-lpstab-dosage").fill("2× pro Woche, 20 Minuten");
  await page.locator('form[data-intervention="i-lpstab"] button[type="submit"]').click();
  check(t("intervention adjusted"), (await page.locator('[data-intervention="i-lpstab"]').innerText()).includes("angepasst"));
  await page.locator('[data-key="i-i-lpstab-accept"]').click();
  await page.locator('[data-key="i-i-weichteil-remove"]').click();
  check(t("intervention removed"), await page.locator('article[data-intervention="i-weichteil"]').count() === 0);
  check(t("removed list shows it"), (await page.locator(".removed-list summary").innerText()).includes("(1)"));
  await page.locator('[data-key="add-own"]').click();
  await page.locator("#own-title").fill("Atemarbeit in Rückenlage");
  await page.locator("#own-category").selectOption("zentrierung");
  await page.locator("#own-rationale").fill("Ruhige Zentrierung vor der Stabilisation.");
  await page.locator('[data-key="own-pick-f-stabil"]').click();
  await page.locator(".icard--own-form button[type=submit]").click();
  check(t("own intervention added and accepted"), (await page.locator("article.icard.is-own.is-accepted").innerText()).includes("Atemarbeit"));
  check(t("plan bar counts"), (await page.locator(".plan-bar").innerText()).includes("4 übernommen"));

  // 8–9 · Dokumentation spiegelt den bestätigten Stand
  await next(page);
  check(t("step 5 title"), (await stepTitle(page)) === "Dokumentation");
  const doc = await page.locator("#doc-text").inputValue();
  const has = (s) => doc.includes(s);
  check(t("doc: changed status"), has("Umfang stark gesteigert"));
  check(t("doc: edited factor"), has("- Rotation der BWS deutlich eingeschränkt"));
  check(t("doc: own factor"), has("- Fußgewölbe rechts unter Last abgeflacht"));
  check(t("doc: removed factor absent"), !has("Regeneration zwischen den Einheiten nicht erfragt"));
  check(t("doc: reclassified factor under veränderbar"),
    doc.indexOf("Einfluss des Laufschuhwechsels") > doc.indexOf("Therapeutisch veränderbar") && doc.indexOf("Einfluss des Laufschuhwechsels") < doc.indexOf("Unveränderbar / Kontext"));
  check(t("doc: confirmed hypothesis"), has("Arbeitshypothese (bestätigt)") && has("Verlauf nach zwei Wochen prüfen."));
  check(t("doc: added question"), has("- Wie sieht das Laufbild nach 8 km aus?"));
  check(t("doc: accepted plan"), has("1. Hüftextension rechts mobilisieren (Mobilisation)"));
  check(t("doc: adjusted plan item with dosage"), has("Lumbopelvine Stabilisation im Stand und Laufschritt") && has("Umfang: 2× pro Woche, 20 Minuten"));
  check(t("doc: own intervention marked"), has("Atemarbeit in Rückenlage (Zentrierung · eigene Ergänzung)"));
  check(t("doc: undecided/removed not in plan"), !has("Weichteilbehandlung Hüftbeuger") && !has("Rotationsmobilisation der BWS"));
  check(t("doc: undecided notice"), (await page.locator(".notice").innerText()).includes("3 Vorschläge"));

  // Manuell bearbeiten → Schritte ändern → Hinweis → neu erzeugen
  await page.locator("#doc-text").click();
  await page.locator("#doc-text").evaluate((el) => el.setSelectionRange(el.value.length, el.value.length));
  await page.keyboard.type("\nNotiz: Rückruf in einer Woche.");
  check(t("doc marked manual"), await page.locator(".doc__manual").count() === 1);
  await page.locator('[data-key="flow-interventions"]').click();
  await page.locator('[data-key="i-i-bwsrot-accept"]').click();
  await page.locator('[data-key="flow-documentation"]').click();
  check(t("manual text kept"), (await page.locator("#doc-text").inputValue()).includes("Rückruf in einer Woche"));
  check(t("stale notice shown"), await page.locator(".notice--strong").count() === 1);
  await page.locator('[data-key="doc-regenerate-inline"]').click();
  const regenerated = await page.locator("#doc-text").inputValue();
  check(t("regenerated includes new plan item"), regenerated.includes("Rotationsmobilisation der BWS"));

  // Kopieren und Sichern
  await page.locator('[data-key="doc-copy"]').click();
  const copied = await page.waitForFunction(() => document.querySelector(".toast")?.textContent.includes("Zwischenablage"), null, { timeout: 3000 })
    .then(() => true, () => false);
  check(t("copy confirmed"), copied, await page.locator(".toast").innerText().catch(() => "no toast"));
  const [download] = await Promise.all([page.waitForEvent("download"), page.locator('[data-key="doc-download"]').click()]);
  const saved = readFileSync(await download.path(), "utf8");
  check(t("download equals document"), saved.trim() === regenerated.trim() && download.suggestedFilename() === "funktioneller-status-demo.txt");

  if (shots) {
    await page.locator('[data-key="flow-interventions"]').click();
    await page.screenshot({ path: join(shots, `${label}-story-interventions.png`), fullPage: true });
    await page.locator('[data-key="flow-problem"]').click();
    await page.screenshot({ path: join(shots, `${label}-story-problem.png`), fullPage: true });
    await page.locator('[data-key="flow-factors"]').click();
    await page.screenshot({ path: join(shots, `${label}-story-factors.png`), fullPage: true });
  }

  // 10 · Zurücksetzen
  await page.locator("[data-reset]").click();
  check(t("reset asks once"), (await page.locator("[data-reset]").innerText()).includes("Wirklich"));
  await page.locator("[data-reset]").click();
  check(t("reset returns to step 1"), (await stepTitle(page)) === "Status erfassen");
  check(t("reset restores status"), (await page.locator("#field-sport").inputValue()).startsWith("Laufen drei- bis viermal"));
  await page.locator('[data-key="flow-factors"]').click();
  check(t("reset restores factors"), await page.locator(".factor").count() === 9 && await page.locator('[data-factor="f-regeneration"]').count() === 1);
  await page.locator('[data-key="flow-interventions"]').click();
  check(t("reset restores candidates"), await page.locator("article.icard").count() === 7 && await page.locator("article.icard.is-accepted").count() === 0);

  // Datenschutz / Netzwerk
  const storage = await page.evaluate(() => {
    try { return localStorage.length + sessionStorage.length + document.cookie.length; } catch { return 0; }
  });
  check(t("no browser storage used"), storage === 0, String(storage));
  check(t("no requests outside the prototype"), log.foreign.length === 0, log.foreign.join(", "));
  check(t("no console errors"), log.errors.length === 0, log.errors.join(" | "));
  await context.close();
}

async function layout(browser, url) {
  for (const vp of [{ w: 1440, h: 900 }, { w: 900, h: 1100 }, { w: 390, h: 844 }]) {
    const { context, page, log } = await newPage(browser, new URL(url).origin, { viewport: { width: vp.w, height: vp.h } });
    await page.goto(url);
    for (let i = 0; i < 5; i++) {
      await page.locator(".flow__button").nth(i).click();
      await page.waitForTimeout(350);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      check(`[${vp.w}] step ${i + 1}: no horizontal overflow`, overflow <= 0, `${overflow}px`);
      if (shots) await page.screenshot({ path: join(shots, `vp${vp.w}-step${i + 1}.png`), fullPage: true });
    }
    if (vp.w === 390) {
      check("[390] step caption visible", await page.locator(".flow__caption").isVisible());
      const small = await page.evaluate(() => [...document.querySelectorAll("button:not(.segmented__option)")]
        .filter((b) => b.offsetParent && b.getBoundingClientRect().height < 30).map((b) => b.textContent.trim()));
      check("[390] touch targets ≥ 30px", small.length === 0, small.join(", "));
    }
    check(`[${vp.w}] no console errors`, log.errors.length === 0, log.errors.join(" | "));
    await context.close();
  }
}

async function keyboardAndMotion(browser, url) {
  const { context, page } = await newPage(browser, new URL(url).origin);
  await page.goto(url);
  await page.keyboard.press("Tab");
  check("keyboard: first stop is skip link", await page.evaluate(() => document.activeElement?.classList.contains("skip-link")));
  await page.keyboard.press("Tab");
  check("keyboard: reset reachable", await page.evaluate(() => document.activeElement?.dataset.key === "reset"));
  await page.keyboard.press("Tab");
  const ring = await page.evaluate(() => { const s = getComputedStyle(document.activeElement); return `${s.outlineStyle} ${s.outlineWidth}`; });
  check("keyboard: visible focus ring on flow", ring.startsWith("solid 2px"), ring);
  await page.keyboard.press("Tab"); // step 2
  await page.keyboard.press("Enter");
  check("keyboard: step switch moves focus to title", await page.evaluate(() => document.activeElement?.id === "step-title"));
  check("keyboard: aria-current on active step", await page.locator('[data-key="flow-factors"][aria-current="step"]').count() === 1);
  await page.locator('[data-key="factor-f-bws-edit"]').focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Escape");
  check("keyboard: Escape cancels and returns focus", await page.evaluate(() => document.activeElement?.dataset.key === "factor-f-bws-edit"));
  await context.close();

  const reduced = await newPage(browser, new URL(url).origin, { reducedMotion: "reduce" });
  await reduced.page.goto(url);
  await reduced.page.locator('[data-key="flow-problem"]').click();
  check("reduced motion: no step entrance animation", !(await reduced.page.locator("#stage").evaluate((el) => el.classList.contains("is-entering"))));
  const duration = await reduced.page.locator('[data-key="confirm"]').evaluate((el) => parseFloat(getComputedStyle(el).transitionDuration));
  check("reduced motion: transitions neutralised", duration <= 0.01, String(duration));
  await reduced.context.close();
}

// WCAG AA over every rendered text node on every step, including the
// accepted, confirmed, stale and notice states.
async function contrast(browser, url) {
  const { context, page } = await newPage(browser, new URL(url).origin, { reducedMotion: "reduce" });
  await page.goto(url);
  await page.locator("#field-sport").fill("Geändert");
  const failing = [];
  for (let i = 0; i < 5; i++) {
    await page.locator(".flow__button").nth(i).click();
    if (i === 2) await page.locator('[data-key="confirm"]').click();
    if (i === 3) await page.locator('[data-key="i-i-hueftmob-accept"]').click();
    const bad = await page.evaluate(() => {
      const parse = (s) => (s.match(/[\d.]+/g) || []).map(Number);
      const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
      const bgOf = (el) => {
        for (let n = el; n; n = n.parentElement) {
          const c = parse(getComputedStyle(n).backgroundColor);
          if (c.length === 3 || (c.length === 4 && c[3] > 0.5)) return c.slice(0, 3);
        }
        return [255, 255, 255];
      };
      const out = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const seen = new Set();
      while (walker.nextNode()) {
        const el = walker.currentNode.parentElement;
        if (!walker.currentNode.textContent.trim() || seen.has(el) || !el.offsetParent) continue;
        seen.add(el);
        const cs = getComputedStyle(el);
        if (el.closest(".skip-link,.visually-hidden,noscript,option")) continue;
        const fg = parse(cs.color); const bg = bgOf(el);
        const a = fg[3] ?? 1; const mixed = [0, 1, 2].map((k) => fg[k] * a + bg[k] * (1 - a));
        const [l1, l2] = [lum(mixed), lum(bg)].sort((x, y) => y - x);
        const ratio = (l1 + 0.05) / (l2 + 0.05);
        const size = parseFloat(cs.fontSize); const bold = parseInt(cs.fontWeight, 10) >= 700;
        const need = size >= 24 || (bold && size >= 18.66) ? 3 : 4.5;
        if (ratio < need) out.push(`${el.textContent.trim().slice(0, 30)} ${ratio.toFixed(2)}`);
      }
      return out;
    });
    failing.push(...bad.map((b) => `step ${i + 1}: ${b}`));
  }
  check("contrast: all rendered text meets WCAG AA", failing.length === 0, failing.slice(0, 8).join(" | "));
  await context.close();
}

const browser = await chromium.launch();
const server = remoteUrl ? { url: remoteUrl, child: { kill() {} } } : await startServer();
try {
  await story(browser, server.url, "http");
  if (!remoteUrl) await story(browser, pathToFileURL(join(pkg, "site", "index.html")).href, "file");
  await layout(browser, server.url);
  await keyboardAndMotion(browser, server.url);
  await contrast(browser, server.url);
} catch (error) {
  failures.push(`crash: ${error.message}`);
  console.error(error);
} finally {
  await browser.close();
  server.child.kill();
}
console.log(`\nPROTOTYPE: ${pass} passed, ${failures.length} failed (of ${pass + failures.length})`);
process.exit(failures.length ? 1 : 0);
