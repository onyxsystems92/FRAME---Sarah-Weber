// Real-browser check for the exported "Funktioneller Status" prototype.
//
//   npm run prototype:check                 (exports first)
//   node scripts/prototype-check.mjs [--shots <dir>]
//
// Runs two stories, each once through the offline launcher's local server
// (http://127.0.0.1) and once straight from file://:
// - overview story (V2): the work surface opens first, relationship focus,
//   dependency review after upstream changes, confirmation qualification,
//   plan and documentation preview reacting, overview ↔ detail round trips;
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
  // Bildschirmfotos erst, wenn Übergänge abgeschlossen sind.
  const shot = async (name) => { if (shots && label === "http") { await page.waitForTimeout(600); await page.screenshot({ path: join(shots, `ov-${name}.png`) }); } };
  await page.goto(url);

  // A · Überblick zuerst, alles Wesentliche ohne Scrollen bei 1440×900
  check(t("opens on the overview"), await page.locator("#overview-title").isVisible() && await page.locator('[data-key="flow-overview"][aria-current="page"]').count() === 1);
  check(t("heading order h1 → h2 → h3"), (await page.locator("h1").count()) === 1 && (await page.locator("h2#overview-title").count()) === 1 && (await page.locator(".zone__title").count()) === 5);
  check(t("case identity visible"), (await page.locator("#overview-title").innerText()).includes("Rückenbeschwerden") && (await page.locator(".casebar__ref").innerText()).includes("Verordnung"));
  const aboveFold = await page.evaluate(() => {
    const sel = ["#overview-title", '[data-node="status:anamnese"]', ".fgroup--modifiable", ".fgroup--context", ".fgroup--open", "#ov-hypothesis",
      '[data-key="ov-confirm"]', '[data-node="intervention:i-hueftmob"]', ".review-chip", "[data-docstate]"];
    return sel.filter((s) => { const el = document.querySelector(s); return !el || el.getBoundingClientRect().top > window.innerHeight - 20; });
  });
  check(t("case, status, factor groups, hypothesis, plan, review and doc state above the fold"), aboveFold.length === 0, aboveFold.join(", "));
  check(t("ten factors in three groups"), await page.locator(".node--factor").count() === 10 && await page.locator(".fgroup").count() === 3);
  check(t("seven candidates, plan empty"), await page.locator(".node--intervention").count() === 7 && await page.locator(".node--intervention.is-accepted").count() === 0);
  check(t("nothing to review initially"), (await page.locator(".review-chip").innerText()).includes("Nichts"));
  check(t("doc preview live"), (await docState(page)).includes("aus aktuellem Stand") && (await docPreview(page)).includes("FUNKTIONELLES PROBLEM"));
  await shot("1-initial");

  // B · Zusammenhänge: Statusangabe wählen
  await ovNode(page, "status", "sport").click();
  check(t("status selected (aria-pressed)"), await ovNode(page, "status", "sport").getAttribute("aria-pressed") === "true");
  check(t("status → factors related"), await isRelated(page, "factor:f-umfang") && await isRelated(page, "factor:f-termin"));
  check(t("status → statement related"), await isRelated(page, "statement:s-1"));
  check(t("status → intervention related"), await isRelated(page, "intervention:i-laufumfang"));
  check(t("unrelated stays unrelated"), !(await isRelated(page, "intervention:i-bwsrot")) && !(await isRelated(page, "factor:f-bws")));
  check(t("relation lines drawn"), await page.locator(".relations path").count() >= 3);
  check(t("relation summary for screen readers"), /verbunden mit .*2 Faktoren/.test(await page.locator("[data-relation-summary]").innerText()));
  check(t("related marked in accessible name"), (await ovNode(page, "factor", "f-umfang").innerText()).includes("verbunden"));
  await shot("2-focus-status");
  await page.keyboard.press("Escape");
  check(t("Escape clears selection"), await page.locator(".surface.has-focus").count() === 0 && await page.locator(".relations path").count() === 0);

  // Faktor wählen: Kette bis zur Intervention
  await ovNode(page, "factor", "f-hueftext").click();
  check(t("factor → source, statement, interventions"),
    await isRelated(page, "status:veraenderbar") && await isRelated(page, "statement:s-3") &&
    await isRelated(page, "intervention:i-hueftmob") && await isRelated(page, "intervention:i-weichteil") && await isRelated(page, "intervention:i-alltag"));
  check(t("statement → intervention lines for factor focus"), await page.locator(".relations path").count() >= 5);
  await shot("3-focus-factor");

  // C · Grundlage ändern: Status im Detail bearbeiten, zurück zum Überblick
  await ovNode(page, "status", "sport").click();
  await page.locator('[data-key="node-status-sport-detail"]').click();
  check(t("direct path into status editor"), (await stepTitle(page)) === "Status erfassen" && await page.evaluate(() => document.activeElement?.id === "field-sport"));
  await page.locator("#field-sport").fill("Laufen fünfmal pro Woche, zusätzlich Bergläufe, Umfang stark gesteigert.");
  await backToOverview(page);
  check(t("return keeps selection"), await ovNode(page, "status", "sport").getAttribute("aria-pressed") === "true");
  check(t("changed status marked"), (await ovNode(page, "status", "sport").innerText()).includes("geändert"));
  check(t("dependent factors need review"), await needsReview(page, "factor:f-umfang") && await needsReview(page, "factor:f-termin"));
  check(t("review reason names the source"), (await page.locator('[data-node="factor:f-umfang"] .node__flag').getAttribute("title")).includes("Sport / Belastung"));
  check(t("dependent statement and intervention need review"), await needsReview(page, "statement:s-1") && await needsReview(page, "intervention:i-laufumfang"));
  check(t("unrelated not flagged"), !(await needsReview(page, "factor:f-bws")) && !(await needsReview(page, "intervention:i-hueftmob")));
  check(t("review chip counts"), /^\d+ prüfen$/.test((await page.locator(".review-chip").innerText()).trim()));
  check(t("flow shows review badge"), (await page.locator('[data-flow-badge="overview"]').innerText()).trim() !== "");
  await page.locator('[data-key="clear-focus"]').click();
  await shot("4-stale");
  await page.locator('[data-key="review-next"]').click();
  check(t("review chip jumps to first item"), await ovNode(page, "factor", "f-umfang").getAttribute("aria-pressed") === "true");
  await page.locator('[data-key="ov-review-factor-f-umfang"]').click();
  check(t("Geprüft clears the factor, dependents stay to be reviewed"), !(await needsReview(page, "factor:f-umfang")) && await needsReview(page, "statement:s-1"));

  // Faktoren im Überblick: umordnen, entfernen + rückgängig; Bearbeiten und Ergänzen im Detail
  await ovNode(page, "factor", "f-schuh").click();
  await page.locator('[data-key="ov-factor-f-schuh-cat-modifiable"]').click();
  check(t("factor reclassified in overview"), await page.locator('.fgroup--modifiable [data-node="factor:f-schuh"]').count() === 1);
  check(t("statement on reclassified factor needs review"), await needsReview(page, "statement:s-5"));
  await ovNode(page, "factor", "f-regeneration").click();
  await page.locator('[data-key="ov-factor-f-regeneration-remove"]').click();
  check(t("factor removed in overview"), await page.locator('[data-node="factor:f-regeneration"]').count() === 0 && await needsReview(page, "statement:s-6"));
  await page.locator('[data-key="toast-undo"]').click();
  check(t("factor removal undone"), await page.locator('[data-node="factor:f-regeneration"]').count() === 1 && !(await needsReview(page, "statement:s-6")));
  await ovNode(page, "factor", "f-bws").click();
  await page.locator('[data-key="node-factor-f-bws-detail"]').click();
  check(t("direct path into factor editor"), await page.evaluate(() => document.activeElement?.dataset.key === "factor-f-bws-input"));
  await page.locator('[data-key="factor-f-bws-input"]').fill("Rotation der BWS deutlich eingeschränkt");
  await page.keyboard.press("Enter");
  await page.locator('[data-key="add-factor-open"]').click();
  await page.locator('[data-key="add-factor-open-input"]').fill("Schlafqualität noch nicht erfragt");
  await page.keyboard.press("Enter");
  await backToOverview(page);
  check(t("edited factor in overview"), (await ovNode(page, "factor", "f-bws").innerText()).includes("deutlich"));
  check(t("added factor in overview"), (await page.locator(".fgroup--open").innerText()).includes("Schlafqualität"));
  check(t("dependents of edited factor need review"), await needsReview(page, "statement:s-4") && await needsReview(page, "intervention:i-bwsrot"));

  // E · Synthese editieren und bestätigen, dann Grundlage ändern
  const hyp = page.locator("#ov-hypothesis");
  await hyp.click();
  await hyp.evaluate((el) => el.setSelectionRange(el.value.length, el.value.length));
  await page.keyboard.type(" Verlauf nach zwei Wochen prüfen.");
  check(t("hypothesis editable in overview"), (await hyp.inputValue()).endsWith("Verlauf nach zwei Wochen prüfen."));
  await page.locator('[data-key="ov-confirm"]').click();
  check(t("confirmed"), (await page.locator(".zone--problem .pill").innerText()).trim() === "Bestätigt");
  check(t("confirming clears statement review"), !(await needsReview(page, "statement:s-1")) && !(await needsReview(page, "statement:s-4")));
  check(t("doc preview shows confirmation"), (await docPreview(page)).includes("(bestätigt)"));
  await ovNode(page, "factor", "f-termin").click();
  await page.locator('[data-key="ov-factor-f-termin-cat-open"]').click();
  check(t("upstream change qualifies confirmation"), (await page.locator(".zone--problem .pill").innerText()).includes("Grundlage geändert"));
  check(t("re-confirm offered"), (await page.locator('[data-key="ov-confirm"]').innerText()).includes("Erneut"));
  check(t("doc preview shows qualification"), (await docPreview(page)).includes("Grundlage seither geändert"));
  check(t("problem in review queue"), Number.parseInt(await page.locator(".review-chip").innerText(), 10) >= 1);
  await page.locator('[data-key="ov-confirm"]').click();
  check(t("re-confirmed"), (await page.locator(".zone--problem .pill").innerText()).trim() === "Bestätigt");

  // F · Interventionen im Überblick
  await page.locator('[data-key="ov-i-i-hueftmob-accept"]').click();
  const moving = await page.locator('[data-node="intervention:i-hueftmob"]').evaluate((el) => el.getAnimations().length);
  check(t("accepted intervention enters the plan"), await page.locator('.pgroup--accepted [data-node="intervention:i-hueftmob"]').count() === 1);
  check(t("plan entry is animated (FLIP)"), moving > 0, String(moving));
  check(t("doc preview updated"), (await docPreview(page)).includes("1. Hüftextension rechts mobilisieren"));
  check(t("changed preview line highlighted"), await page.locator(".docprev__line.is-new").count() >= 1);
  await page.locator('[data-key="ov-i-i-einbein-accept"]').click();
  await page.locator('[data-key="ov-i-i-einbein-accept"]').click();
  check(t("withdraw returns to candidates"), await page.locator('.pgroup--accepted [data-node="intervention:i-einbein"]').count() === 0);
  await ovNode(page, "intervention", "i-lpstab").click();
  await page.locator('[data-key="node-intervention-i-lpstab-detail"]').click();
  check(t("direct path into adjust form"), await page.evaluate(() => document.activeElement?.id === "adjust-i-lpstab-title"));
  await page.locator("#adjust-i-lpstab-dosage").fill("2× pro Woche, 20 Minuten");
  await page.locator('form[data-intervention="i-lpstab"] button[type="submit"]').click();
  await page.locator('[data-key="i-i-lpstab-accept"]').click();
  await backToOverview(page);
  check(t("adjusted intervention in plan with dosage"), (await page.locator('.pgroup--accepted [data-node="intervention:i-lpstab"]').innerText()).includes("2× pro Woche"));
  await shot("5-plan-updated");
  await ovNode(page, "intervention", "i-weichteil").click();
  await page.locator('[data-key="ov-i-i-weichteil-remove"]').click();
  check(t("intervention removed in overview"), await page.locator('[data-node="intervention:i-weichteil"]').count() === 0 && (await page.locator('[data-key="ov-removed"]').innerText()).includes("1"));
  await page.locator('[data-key="toast-undo"]').click();
  check(t("removal undone, item selected again"), await page.locator('[data-node="intervention:i-weichteil"]').count() === 1 && await ovNode(page, "intervention", "i-weichteil").getAttribute("aria-pressed") === "true");
  await page.locator('[data-key="ov-i-i-weichteil-remove"]').click();
  await page.locator('[data-key="ov-removed"]').click();
  await page.locator('[data-key="i-i-weichteil-restore"]').click();
  await backToOverview(page);
  check(t("restored via detail"), await page.locator('[data-node="intervention:i-weichteil"]').count() === 1);
  await page.locator('[data-key="ov-add-own"]').click();
  await page.locator("#own-title").fill("Atemarbeit in Rückenlage");
  await page.locator("#own-category").selectOption("zentrierung");
  await page.locator('[data-key="own-pick-f-stabil"]').click();
  await page.locator(".icard--own-form button[type=submit]").click();
  await backToOverview(page);
  check(t("own intervention in plan"), (await page.locator(".pgroup--accepted").innerText()).includes("Atemarbeit"));
  check(t("own intervention relates to its factor"), await (async () => { await ovNode(page, "factor", "f-stabil").click(); return page.locator(".node--intervention.is-own.is-related").count(); })() === 1);

  // G · Dokumentation: Vorschau, voll bearbeiten, veraltet, neu erzeugen
  check(t("doc preview lists the plan"), (await docPreview(page)).includes("Atemarbeit in Rückenlage"));
  await page.locator('[data-key="ov-doc-open"]').click();
  check(t("full documentation opens"), (await stepTitle(page)) === "Dokumentation");
  await page.locator("#doc-text").click();
  await page.locator("#doc-text").evaluate((el) => el.setSelectionRange(el.value.length, el.value.length));
  await page.keyboard.type("\nNotiz: Rückruf in einer Woche.");
  await backToOverview(page);
  check(t("doc state manual"), (await docState(page)).includes("manuell bearbeitet"));
  await page.locator('[data-key="ov-i-i-bwsrot-accept"]').click();
  check(t("doc state stale after later change"), (await docState(page)).includes("veraltet"));
  await shot("6-doc-stale");
  await page.locator('[data-key="ov-doc-open"]').click();
  check(t("manual text kept"), (await page.locator("#doc-text").inputValue()).includes("Rückruf in einer Woche"));
  await page.locator('[data-key="doc-regenerate-inline"]').click();
  await backToOverview(page);
  check(t("doc live again"), (await docState(page)).includes("aus aktuellem Stand") && (await docPreview(page)).includes("Rotationsmobilisation der BWS"));

  // Zurücksetzen und Neuladen: kanonischer Ausgangszustand
  await page.locator("[data-reset]").click();
  await page.locator("[data-reset]").click();
  check(t("reset: overview, nothing to review"), await page.locator("#overview-title").isVisible() && await page.locator(".needs-review").count() === 0 && (await page.locator(".review-chip").innerText()).includes("Nichts"));
  check(t("reset: canonical factors and plan"), await page.locator(".node--factor").count() === 10 && await page.locator(".node--intervention.is-accepted").count() === 0 && await page.locator(".node--intervention").count() === 7);
  check(t("reset: hypothesis and doc"), (await page.locator("#ov-hypothesis").inputValue()).endsWith("als Ursache.") && (await docState(page)).includes("aus aktuellem Stand"));
  await page.locator('[data-key="ov-i-i-hueftmob-accept"]').click();
  await page.reload();
  check(t("reload returns to the canonical state"), await page.locator("#overview-title").isVisible() && await page.locator(".node--intervention.is-accepted").count() === 0);

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
  await page.locator('[data-key="flow-status"]').click();
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
  await page.locator('[data-key="flow-status"]').click();
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
  for (const vp of [{ w: 1440, h: 900 }, { w: 900, h: 1100 }, { w: 390, h: 844 }]) {
    const { context, page, log } = await newPage(browser, new URL(url).origin, { viewport: { width: vp.w, height: vp.h } });
    await page.goto(url);
    for (let i = 0; i < 6; i++) {
      await page.locator(".flow__button").nth(i).click();
      await page.waitForTimeout(350);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      const name = i === 0 ? "overview" : `step ${i}`;
      check(`[${vp.w}] ${name}: no horizontal overflow`, overflow <= 0, `${overflow}px`);
      const clipped = await page.evaluate(() => [...document.querySelectorAll("#stage button, #stage textarea")]
        .filter((el) => el.offsetParent && getComputedStyle(el).visibility !== "hidden")
        .filter((el) => { const r = el.getBoundingClientRect(); return r.right > window.innerWidth + 1 || r.left < -1; })
        .map((el) => el.dataset.key || el.id || el.textContent.trim().slice(0, 20)));
      check(`[${vp.w}] ${name}: no clipped controls`, clipped.length === 0, clipped.join(", "));
      if (shots) { await page.waitForTimeout(300); await page.screenshot({ path: join(shots, `vp${vp.w}-${i === 0 ? "overview" : `step${i}`}.png`), fullPage: true }); }
      if (i === 0) {
        await page.locator('[data-key="node-factor-f-hueftext"]').click();
        await page.waitForTimeout(350);
        const overflowFocus = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        check(`[${vp.w}] overview with selection: no horizontal overflow`, overflowFocus <= 0, `${overflowFocus}px`);
        const lines = await page.locator(".relations path").count();
        check(`[${vp.w}] relation lines only on wide layout`, vp.w >= 1180 ? lines > 0 : lines === 0, String(lines));
        check(`[${vp.w}] related items highlighted`, await page.locator(".node.is-related").count() >= 3);
        if (shots) await page.screenshot({ path: join(shots, `vp${vp.w}-overview-focus.png`), fullPage: true });
      }
    }
    if (vp.w === 390) {
      check("[390] step caption visible", await page.locator(".flow__caption").isVisible());
      await page.locator('[data-key="flow-overview"]').click();
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
  check("keyboard: overview is current", await page.evaluate(() => document.activeElement?.dataset.key === "flow-overview" && document.activeElement.getAttribute("aria-current") === "page"));
  // Überblick: Element per Tastatur wählen, Escape hebt auf und behält den Fokus.
  await page.locator('[data-key="node-status-sport"]').focus();
  await page.keyboard.press("Enter");
  check("keyboard: Enter selects an overview item", await page.locator('[data-key="node-status-sport"][aria-pressed="true"]').count() === 1 && await page.locator(".node.is-related").count() >= 3);
  check("keyboard: selection keeps focus on the item", await page.evaluate(() => document.activeElement?.dataset.key === "node-status-sport"));
  await page.keyboard.press("Tab");
  check("keyboard: item actions follow the item", await page.evaluate(() => document.activeElement?.dataset.key === "node-status-sport-detail"));
  await page.keyboard.press("Escape");
  check("keyboard: Escape clears and returns focus", await page.locator(".surface.has-focus").count() === 0 && await page.evaluate(() => document.activeElement?.dataset.key === "node-status-sport"));
  await page.locator('[data-key="flow-status"]').focus();
  await page.keyboard.press("Tab"); // step 2
  await page.keyboard.press("Enter");
  check("keyboard: step switch moves focus to title", await page.evaluate(() => document.activeElement?.id === "step-title"));
  check("keyboard: aria-current on active step", await page.locator('[data-key="flow-factors"][aria-current="page"]').count() === 1);
  await page.locator('[data-key="factor-f-bws-edit"]').focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Escape");
  check("keyboard: Escape cancels and returns focus", await page.evaluate(() => document.activeElement?.dataset.key === "factor-f-bws-edit"));
  await page.locator('[data-key="nav-overview"]').focus();
  await page.keyboard.press("Enter");
  check("keyboard: back to overview lands on the case title", await page.evaluate(() => document.activeElement?.id === "overview-title"));
  await context.close();

  const reduced = await newPage(browser, new URL(url).origin, { reducedMotion: "reduce" });
  await reduced.page.goto(url);
  await reduced.page.locator('[data-key="node-factor-f-hueftext"]').click();
  check("reduced motion: relationships still shown", await reduced.page.locator(".node.is-related").count() >= 3 && await reduced.page.locator(".relations path").count() > 0);
  await reduced.page.locator('[data-key="ov-i-i-hueftmob-accept"]').click();
  check("reduced motion: plan updates without animation", await reduced.page.locator('.pgroup--accepted [data-node="intervention:i-hueftmob"]').count() === 1 &&
    await reduced.page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running" && Number(a.effect?.getComputedTiming().duration) > 10).length) === 0);
  if (shots) await reduced.page.screenshot({ path: join(shots, "reduced-motion-overview.png") });
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
  await page.locator('[data-key="flow-status"]').click();
  await page.locator("#field-sport").fill("Geändert");
  const failing = [];
  // 0..5: Überblick (mit Auswahl, Prüfbedarf, Plan), dann die fünf Detailschritte;
  // 6: Überblick ohne Auswahl.
  for (let i = 0; i < 7; i++) {
    await page.locator(".flow__button").nth(i % 6).click();
    if (i === 0) {
      await page.locator('[data-key="ov-i-i-laufumfang-accept"]').click();
      await page.locator('[data-key="ov-confirm"]').click();
      await page.locator('[data-key="node-factor-f-umfang"]').click();
    }
    if (i === 3) await page.locator('[data-key="confirm"]').click().catch(() => {});
    if (i === 4) await page.locator('[data-key="i-i-hueftmob-accept"]').click();
    if (i === 6) await page.locator('[data-key="clear-focus"]').click();
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
    failing.push(...bad.map((b) => `${i % 6 === 0 ? "overview" : `step ${i}`}: ${b}`));
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
