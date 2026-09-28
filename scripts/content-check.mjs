// Content ownership check. No browser, no network.
//
//   node scripts/content-check.mjs        (after `npm run build`)
//
// 1. Templates hold structure, not prose: any run of three or more words of
//    visible text left in a .njk file fails, unless it is one of the few
//    fixed interface labels listed below.
// 2. Every text in src/_data/copy/*.yaml actually appears on the built site,
//    so no editable field is silently ignored and no page shows a stale,
//    hard-coded duplicate instead.
// 3. The local editor (admin/config.yml) has a field for every key of every
//    file it edits, and no field without data. The editor rewrites a whole
//    file on save; a key without a field could otherwise be lost.
import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const src = path.join(root, "src");
const dist = path.join(root, "dist");

// Fixed interface labels: they name a control or a data field, not content
// Sarah would rewrite. Changing them changes the product, not the copy.
const INTERFACE_LABELS = new Set([
  "Zum Inhalt springen",              // skip link, accessibility
  "Raum & Zeit Physiotherapie",       // legal name in the footer
  "Auf Google Maps öffnen",           // external map link (contract in AGENTS.md)
  "Online einen Termin vereinbaren",  // booking link, shown only when confirmed
]);

const failures = [];

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const full = path.join(dir, entry.name);
  return entry.isDirectory() ? walk(full) : [full];
});

// --- 1. Prose in templates -------------------------------------------------
for (const file of walk(src).filter((f) => f.endsWith(".njk"))) {
  let text = fs.readFileSync(file, "utf8");
  text = text.replace(/^---[\s\S]*?\n---\n/, "");          // front matter (page metadata)
  text = text.replace(/\{#[\s\S]*?#\}/g, " ");               // Nunjucks comments
  text = text.replace(/\{%[\s\S]*?%\}/g, " ");               // Nunjucks tags
  text = text.replace(/\{\{[\s\S]*?\}\}/g, " ");             // Nunjucks output
  text = text.replace(/<svg[\s\S]*?<\/svg>/g, " ");
  text = text.replace(/<[^>]+>/g, "\n");                     // markup and attributes
  for (const raw of text.split("\n")) {
    const run = raw.replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
    const words = run.match(/[A-Za-zÄÖÜäöüß]{2,}/g) || [];
    if (words.length >= 3 && !INTERFACE_LABELS.has(run)) {
      failures.push(`${path.relative(root, file)}: hard-coded text "${run}"`);
    }
  }
}

// --- 2. Every editable text is rendered ------------------------------------
if (!fs.existsSync(path.join(dist, "index.html"))) {
  console.error("Run `npm run build` first.");
  process.exit(1);
}
const decode = (s) => s
  .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ");
const rendered = walk(dist)
  .filter((f) => f.endsWith(".html"))
  .map((f) => decode(fs.readFileSync(f, "utf8").replace(/<br\s*\/?>/g, " ").replace(/<[^>]+>/g, " ")))
  .join(" ")
  .replace(/\s+/g, " ");

const leaves = (value, trail) => {
  if (typeof value === "string") return [[trail, value]];
  if (Array.isArray(value)) return value.flatMap((v, i) => leaves(v, `${trail}[${i}]`));
  if (value && typeof value === "object") return Object.entries(value).flatMap(([k, v]) => leaves(v, `${trail}.${k}`));
  return [];
};

let fields = 0;
const copyDir = path.join(src, "_data", "copy");
for (const file of fs.readdirSync(copyDir).filter((f) => f.endsWith(".yaml"))) {
  const data = yaml.load(fs.readFileSync(path.join(copyDir, file), "utf8"));
  for (const [trail, value] of leaves(data, file.replace(".yaml", ""))) {
    if (!value.trim()) continue;
    fields += 1;
    // Placeholders ([Telefon], [Adresse], [Google Maps]) render as practice
    // data, so each text segment around them is checked on its own.
    const segments = value.split(/\[(?:Telefon|Adresse|Google Maps)\]/i)
      .flatMap((part) => part.split(/\n\s*\n|\n/))
      .map((part) => part.replace(/\s+/g, " ").trim())
      .filter((part) => part.length > 1);
    for (const segment of segments) {
      if (!rendered.includes(segment)) failures.push(`copy/${trail}: not rendered on any page ("${segment.slice(0, 60)}")`);
    }
  }
}

// --- 3. Editor fields match the edited files --------------------------------
const config = yaml.load(fs.readFileSync(path.join(root, "admin", "config.yml"), "utf8"));
const dataKeys = (value, trail = "") =>
  typeof value === "string" || Array.isArray(value) || value === null || typeof value !== "object"
    ? [trail]
    : Object.entries(value).flatMap(([k, v]) => dataKeys(v, trail ? `${trail}.${k}` : k));
const fieldKeys = (fields, trail = "") =>
  fields.flatMap((f) => (f.widget === "object"
    ? fieldKeys(f.fields, trail ? `${trail}.${f.name}` : f.name)
    : [trail ? `${trail}.${f.name}` : f.name]));
for (const collection of config.collections.filter((c) => c.files)) {
  for (const entry of collection.files) {
    const data = yaml.load(fs.readFileSync(path.join(root, entry.file), "utf8")) || {};
    const have = new Set(dataKeys(data));
    const fields = new Set(fieldKeys(entry.fields));
    [...have].filter((k) => !fields.has(k)).forEach((k) => failures.push(`${entry.file}: key "${k}" has no editor field and could be lost on save`));
    [...fields].filter((k) => !have.has(k)).forEach((k) => failures.push(`${entry.file}: editor field "${k}" has no value in the file`));
  }
}

if (failures.length) {
  console.log(`CONTENT: ${failures.length} problems`);
  failures.forEach((f) => console.log(" - " + f));
  process.exit(1);
}
console.log(`CONTENT: templates carry no prose; all ${fields} editable texts are rendered; editor fields match every edited file.`);
