// Real-browser check for the exported "Funktioneller Status" prototype.
//
//   npm run prototype:check                 (exports first)
//   node scripts/prototype-check.mjs [--shots <dir>]
//
// Runs two stories, each once through the offline launcher's local server
// (http://127.0.0.1) and once straight from file://:
// - overview story (V3): a radically simpler entry opens first with four signals,
//   one functional assessment and three intervention candidates; detail remains on demand;
// - detail story (V1): every editor, edit/add/remove/reclassify flows,
//   confirmation, documentation sync, copy/download, reset.
// Plus: no requests outside the prototype, no browser storage, no console
// errors, no horizontal overflow at 1440/900/390, keyboard, reduced motion,
// WCAG AA contrast.
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


const isRelated = (page, key) => page.locator(`[data-node="${key}"]`).evaluate((el) => el.classList.contains("is-related"));
const needsReview = (page, key) => page.locator(`[data-node="${key}"]`).evaluate((el) => el.classList.contains("needs-review"));
const ovNode = (page, kind, id) => page.locator(`[data-key="node-${kind}-${id}"]`);
const backToOverview = (page) => page.locator('[data-key="nav-overview"]').click();
const docPreview = (page) => page.locator("[data-docprev]").innerText();
const docState = (page) => page.locator("[data-docstate]").innerText();

async function overviewStory(browser, url, label) {
  const origin = url.startsWith("file:") ? "file://" : new URL(url).origin;
  const { context, page, log } = await newPage(browser, origin);
  const t = (name) => `[${label}] overview: ${name}`;
  const shot = async (name) => { if (shots && label === "http") { await page.waitForTimeout(350); await page.screenshot({ path: join(shots, `ov-${name}.png`), fullPage: true }); } };
  await page.goto(url);

  check(t("opens on the simple overview"), await page.locator("#overview-title").isVisible() && await page.locator(".simple-overview").count() === 1);
  check(t("step navigation is hidden on entry"), await page.locator(".flow.is-overview").count() === 1 && !(await page.locator(".flow").isVisible()));
  check(t("case identity visible"), (await page.locator("#overview-title").innerText()).includes("Rückenbeschwerden"));
  check(t("only three primary sections"), await page.locator(".simple-block").count() === 3 && await page.locator(".simple-block__title").count() === 3);
  check(t("four concise signals"), await page.locator(".simple-signal").count() === 4);
  check(t("three intervention candidates only"), await page.locator(".simple-choice").count() === 3);
  check(t("no factors, relation graph or documentation on entry"), await page.locator(".node--factor,.relations,[data-docprev]").count() === 0);
  const below = await page.evaluate(() => ["#overview-title", ".simple-signals", ".simple-hypothesis"]
    .filter((sel) => { const el = document.querySelector(sel); return !el || el.getBoundingClientRect().top > window.innerHeight - 20; }));
  check(t("case, signals and assessment start inside first viewport"), below.length === 0, below.join(", "));
  await shot("1-simple-initial");

  // One obvious signal opens the exact status field instead of exposing a relationship graph.
  await page.locator('[data-key="overview-signal-training"]').click();
  check(t("signal opens the relevant detail field"), (await stepTitle(page)) === "Status erfassen" && await page.evaluate(() => document.activeElement?.id === "field-sport"));
  await page.locator("#field-sport").fill("Laufen fünfmal pro Woche, zusätzlich Bergläufe, Umfang stark gesteigert.");
  await backToOverview(page);
  check(t("overview returns without exposing the full workflow"), await page.locator(".simple-overview").isVisible() && !(await page.locator(".flow").isVisible()));
  check(t("changed source is quietly marked"), (await page.locator('[data-key="overview-signal-training"]').innerText()).includes("Status geändert"));
  check(t("review appears only when needed"), await page.locator('[data-key="overview-review"]').count() === 1);
  await shot("2-changed-signal");

  // The assessment is readable first; editing remains one click deeper.
  check(t("assessment shown as readable text"), (await page.locator(".simple-hypothesis__text").innerText()).includes("Eingeschränkte Hüftbeweglichkeit"));
  await page.locator('[data-key="overview-hypothesis-edit"]').click();
  check(t("assessment edit opens the existing problem editor"), (await stepTitle(page)) === "Funktionelles Problem");
  const hyp = page.locator("#hypothesis");
  await hyp.click();
  await hyp.evaluate((el) => el.setSelectionRange(el.value.length, el.value.length));
  await page.keyboard.type(" Verlauf nach zwei Wochen prüfen.");
  await page.locator('[data-key="confirm"]').click();
  await backToOverview(page);
  check(t("confirmed assessment is visible but calm"), (await page.locator(".simple-state").innerText()).includes("Bestätigt"));
  check(t("edited assessment returns as a concise preview"), (await page.locator(".simple-hypothesis__text").innerText()).startsWith("Die Kombination") && (await page.locator(".simple-hypothesis__text").innerText()).length < 320);

  // Three candidates are actionable without showing the whole plan system.
  await page.locator('[data-key="overview-choice-i-lpstab"]').click();
  check(t("candidate can be accepted in place"), await page.locator('[data-key="overview-choice-i-lpstab"]').getAttribute("aria-pressed") === "true" && await page.locator('[data-key="overview-choice-i-lpstab"]').evaluate((el) => el.closest(".simple-choice").classList.contains("is-accepted")));
  await page.locator('[data-key="overview-choice-i-lpstab-detail"]').click();
  check(t("candidate detail opens existing adjust form"), await page.evaluate(() => document.activeElement?.id === "adjust-i-lpstab-title"));
  await page.locator("#adjust-i-lpstab-dosage").fill("2× pro Woche, 20 Minuten");
  await page.locator('form[data-intervention="i-lpstab"] button[type="submit"]').click();
  await backToOverview(page);
  check(t("accepted candidate survives detail round trip"), await page.locator('[data-key="overview-choice-i-lpstab"]').getAttribute("aria-pressed") === "true");
  await page.locator('[data-key="overview-all-interventions"]').click();
  check(t("all candidates remain available on demand"), (await stepTitle(page)) === "Interventionskandidaten" && await page.locator("article.icard").count() === 7);
  await backToOverview(page);
  await shot("3-selected-next-step");

  // The primary CTA opens the full case only when requested.
  await page.locator('[data-key="overview-details"]').click();
  check(t("primary detail CTA opens full case"), (await stepTitle(page)) === "Status erfassen" && await page.locator(".flow").isVisible());
  await backToOverview(page);

  // Reset and reload stay deterministic.
  await page.locator("[data-reset]").click();
  await page.locator("[data-reset]").click();
  check(t("reset restores simple overview"), await page.locator(".simple-overview").isVisible() && await page.locator('[data-key="overview-review"]').count() === 0);
  check(t("reset clears plan"), await page.locator(".simple-choice.is-accepted").count() === 0);
  await page.locator('[data-key="overview-choice-i-lpstab"]').click();
  await page.reload();
  check(t("reload returns to canonical state"), await page.locator(".simple-overview").isVisible() && await page.locator(".simple-choice.is-accepted").count() === 0);

  const storage = await page.evaluate(() => {
    let n = 0;
    try { n += localStorage.length + sessionStorage.length + document.cookie.length; } catch { /* blockiert */ }
    return n;
  });
  const idb = await page.evaluate(async () => (indexedDB.databases ? (await indexedDB.databases()).length : 0));
  check(t("no browser storage used"), storage === 0 && idb === 0, `${storage}/${idb}`);
  check(t("no requests outside the prototype"), log.foreign.length === 0, log.foreign.join(", "));
  check(t("no console errors"), log.errors.length === 0, log.errors.join(" | "));
  await context.close();
}

async function detailStory(browser, url, label) {
  const origin = url.startsWith("file:") ? "file://" : new URL(url).origin;
  const { context, page, log } = await newPage(browser, origin);
  const t = (name) => `[${label}] ${name}`;
  await page.goto(url);

  // 1 · Demo-Fall öffnen, in die Detailansicht Status wechseln
  await page.locator('[data-key="overview-details"]').click();
  check(t("detail: Status erfassen reachable"), (await stepTitle(page)) === "Status erfassen");
  check(t("demo case is prefilled"), (await page.locator("#field-anamnese").inputValue()).includes("Ziehender Schmerz"));
  check(t("demo badge visible"), (await page.locator(".demo-badge").innerText()).includes("synthetische"));
  check(t("real logo loaded"), await page.locator(".brand__logo").evaluate((img) => img.complete && img.naturalWidth > 0));
  check(t("heading order h1 → h2 (detail)"), (await page.locator("h1").count()) === 1 && (await page.locator("h2#step-title").count()) === 1);

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
  check(t("reconfirmed"), (await page.locator('[data-flow-badge="problem"].is-confirmed').innerText()) === "Bestätigt");

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
  check(t("reset returns to the overview"), await page.locator("#overview-title").isVisible());
  await page.locator('[data-key="overview-details"]').click();
  check(t("reset restores status"), (await page.locator("#field-sport").inputValue()).startsWith("Laufen drei- bis viermal"));
  await page.locator('[data-key="flow-factors"]').click();
  check(t("reset restores factors"), await page.locator(".factor").count() === 10 && await page.locator('[data-factor="f-regeneration"]').count() === 1);
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
  const stepKeys = ["status", "factors", "problem", "interventions", "documentation"];
  for (const vp of [{ w: 1440, h: 900 }, { w: 900, h: 1100 }, { w: 390, h: 844 }]) {
    const { context, page, log } = await newPage(browser, new URL(url).origin, { viewport: { width: vp.w, height: vp.h } });
    await page.goto(url);
    const inspect = async (name) => {
      await page.waitForTimeout(220);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      check(`[${vp.w}] ${name}: no horizontal overflow`, overflow <= 0, `${overflow}px`);
      const clipped = await page.evaluate(() => [...document.querySelectorAll("#stage button, #stage textarea")]
        .filter((el) => el.offsetParent && getComputedStyle(el).visibility !== "hidden")
        .filter((el) => { const r = el.getBoundingClientRect(); return r.right > window.innerWidth + 1 || r.left < -1; })
        .map((el) => el.dataset.key || el.id || el.textContent.trim().slice(0, 20)));
      check(`[${vp.w}] ${name}: no clipped controls`, clipped.length === 0, clipped.join(", "));
      if (shots) await page.screenshot({ path: join(shots, `vp${vp.w}-${name.replaceAll(" ", "-")}.png`), fullPage: true });
    };
    await inspect("overview");
    await page.locator('[data-key="overview-details"]').click();
    for (const key of stepKeys) {
      await page.locator(`[data-key="flow-${key}"]`).click();
      await inspect(key);
    }
    if (vp.w === 390) check("[390] step caption visible in detail", await page.locator(".flow__caption").isVisible());
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
  await page.locator('[data-key="overview-signal-training"]').focus();
  const ring = await page.evaluate(() => { const s = getComputedStyle(document.activeElement); return `${s.outlineStyle} ${s.outlineWidth}`; });
  check("keyboard: overview actions have a visible focus ring", ring.startsWith("solid 2px"), ring);
  await page.keyboard.press("Enter");
  check("keyboard: signal Enter opens exact field", await page.evaluate(() => document.activeElement?.id === "field-sport"));
  await page.locator('[data-key="nav-overview"]').focus();
  await page.keyboard.press("Enter");
  check("keyboard: return lands on the originating signal", await page.evaluate(() => document.activeElement?.dataset.key === "overview-signal-training"));
  await page.locator('[data-key="overview-hypothesis-edit"]').focus();
  await page.keyboard.press("Enter");
  check("keyboard: assessment edit opens problem", (await stepTitle(page)) === "Funktionelles Problem");
  await page.locator('[data-key="nav-overview"]').click();
  await page.locator('[data-key="overview-choice-i-lpstab"]').focus();
  await page.keyboard.press("Enter");
  check("keyboard: intervention toggles", await page.locator('[data-key="overview-choice-i-lpstab"]').getAttribute("aria-pressed") === "true");
  await context.close();

  const reduced = await newPage(browser, new URL(url).origin, { reducedMotion: "reduce" });
  await reduced.page.goto(url);
  await reduced.page.locator('[data-key="overview-choice-i-lpstab"]').click();
  check("reduced motion: choice updates without long animation", await reduced.page.locator(".simple-choice.is-accepted").count() === 1 &&
    await reduced.page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running" && Number(a.effect?.getComputedTiming().duration) > 10).length) === 0);
  if (shots) await reduced.page.screenshot({ path: join(shots, "reduced-motion-overview.png") });
  await reduced.page.locator('[data-key="overview-hypothesis-edit"]').click();
  const duration = await reduced.page.locator('[data-key="confirm"]').evaluate((el) => parseFloat(getComputedStyle(el).transitionDuration));
  check("reduced motion: detail transitions neutralised", duration <= 0.01, String(duration));
  await reduced.context.close();
}

// WCAG AA over every rendered text node on every step, including the
// accepted, confirmed, stale and notice states.
async function contrast(browser, url) {
  const { context, page } = await newPage(browser, new URL(url).origin, { reducedMotion: "reduce" });
  await page.goto(url);
  const failing = [];
  const audit = async (name) => {
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
    failing.push(...bad.map((b) => `${name}: ${b}`));
  };
  await audit("overview");
  await page.locator('[data-key="overview-choice-i-lpstab"]').click();
  await audit("overview accepted");
  await page.locator('[data-key="overview-details"]').click();
  for (const key of ["status", "factors", "problem", "interventions", "documentation"]) {
    await page.locator(`[data-key="flow-${key}"]`).click();
    if (key === "problem") await page.locator('[data-key="confirm"]').click().catch(() => {});
    if (key === "interventions") await page.locator('[data-key="i-i-hueftmob-accept"]').click();
    await audit(key);
  }
  check("contrast: all rendered text meets WCAG AA", failing.length === 0, failing.slice(0, 8).join(" | "));
  await context.close();
}

const browser = await chromium.launch();
const server = remoteUrl ? { url: remoteUrl, child: { kill() {} } } : await startServer();
try {
  await overviewStory(browser, server.url, "http");
  await detailStory(browser, server.url, "http");
  if (!remoteUrl) {
    await overviewStory(browser, pathToFileURL(join(pkg, "site", "index.html")).href, "file");
    await detailStory(browser, pathToFileURL(join(pkg, "site", "index.html")).href, "file");
  }
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
