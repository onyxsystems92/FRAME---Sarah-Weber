#!/usr/bin/env node
// Export the "Funktioneller Status" prototype as a self-contained package.
//
//   node scripts/prototype-export.mjs
//
// Output: prototype-release/funktioneller-status/
//   site/                 the prototype (static files, fonts and logo copied
//                         from src/assets, so the website stays the single
//                         source of brand assets)
//   serve-local.mjs       offline presentation server (Node built-ins only)
//   *.command             double-click launcher for macOS
//   LIES MICH.txt         short operating note
//   MANIFEST.json         source commit and per-file SHA-256
//
// The prototype is deliberately NOT part of the website build (src/ → dist/)
// or the website export (release/): it must never reach the practice website.
import { createHash } from "node:crypto";
import { execSync } from "node:child_process";
import { chmodSync, cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "prototype", "funktioneller-status");
const out = join(root, "prototype-release", "funktioneller-status");
const site = join(out, "site");

const TITLE = "Raum & Zeit · Funktioneller Status";
const ROUTE = "/funktioneller-status/";
const LAUNCHER = "Funktioneller Status starten.command";

const git = (cmd) => execSync(`git ${cmd}`, { cwd: root, encoding: "utf8" }).trim();

rmSync(out, { recursive: true, force: true });
mkdirSync(join(site, "assets", "fonts"), { recursive: true });

for (const file of ["index.html", "config.js", "app.js", "styles.css"]) {
  cpSync(join(source, file), join(site, file));
}
cpSync(join(root, "src", "assets", "logo-raum-und-zeit.png"), join(site, "assets", "logo-raum-und-zeit.png"));
for (const file of readdirSync(join(root, "src", "assets", "fonts"))) {
  if (/\.(woff2|txt)$/.test(file)) cpSync(join(root, "src", "assets", "fonts", file), join(site, "assets", "fonts", file));
}

// Guard: the prototype makes no requests outside its own folder.
for (const file of ["index.html", "app.js", "styles.css", "config.js"]) {
  const text = readFileSync(join(site, file), "utf8");
  if (/https?:\/\//i.test(text.replace(/http:\/\/www\.w3\.org\/2000\/svg/g, ""))) {
    throw new Error(`External URL found in ${file}; the prototype must stay self-contained.`);
  }
  if (/localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|sendBeacon/.test(text)) {
    throw new Error(`Storage or network API found in ${file}.`);
  }
}

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}
const files = {};
for (const full of walk(site).sort()) {
  files[relative(site, full).split(sep).join("/")] = createHash("sha256").update(readFileSync(full)).digest("hex");
}
const siteSha256 = createHash("sha256").update(JSON.stringify(files)).digest("hex");

const manifest = {
  title: TITLE,
  route: ROUTE,
  sourceRepository: "onyxsystems92/FRAME---Sarah-Weber",
  sourceBranch: git("rev-parse --abbrev-ref HEAD"),
  sourceCommit: git("rev-parse HEAD"),
  sourceTreeClean: git("status --porcelain -- prototype scripts/prototype-export.mjs scripts/prototype-serve-local.mjs src/assets") === "",
  exportedAt: new Date().toISOString(),
  class: "SELF-CONTAINED PROSPECT PREVIEW · derived presentation material, not source truth",
  data: "synthetic demo case only; no patient data; state in memory only",
  siteSha256,
  files,
};
writeFileSync(join(out, "MANIFEST.json"), JSON.stringify(manifest, null, 2) + "\n");

cpSync(join(root, "scripts", "prototype-serve-local.mjs"), join(out, "serve-local.mjs"));

const launcher = `#!/bin/bash
# Offline-Präsentation starten: Doppelklick genügt.
# Läuft ohne Internet, ohne Installation und ohne Dev-Server. Das Fenster
# offen lassen, solange präsentiert wird; Schließen beendet die Präsentation.
HERE="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"

NODE=""
for candidate in \\
  "$(command -v node 2>/dev/null)" \\
  /usr/local/bin/node \\
  /opt/homebrew/bin/node \\
  "$HOME"/.nvm/versions/node/*/bin/node \\
  "$HOME/.volta/bin/node"; do
  if [ -n "$candidate" ] && [ -x "$candidate" ]; then
    NODE="$candidate"
    break
  fi
done

if [ -z "$NODE" ]; then
  echo "Node.js wurde nicht gefunden. Alternativ site/index.html direkt im Browser öffnen."
  open "$HERE/site/index.html"
  read -r -p "Enter zum Schließen."
  exit 1
fi

exec "$NODE" "$HERE/serve-local.mjs"
`;
writeFileSync(join(out, LAUNCHER), launcher);
chmodSync(join(out, LAUNCHER), 0o755);

const readme = `${TITLE} · Prototyp für Sarah Weber
${"=".repeat(TITLE.length + 26)}

OFFLINE PRÄSENTIEREN
Doppelklick auf „${LAUNCHER}“.
Der Browser öffnet den Prototyp lokal (http://127.0.0.1:4427/ oder der nächste
freie Port). Kein Internet, keine Installation, kein Dev-Server nötig.
Das Terminal-Fenster offen lassen, solange präsentiert wird; Schließen beendet.
Notfalls funktioniert auch ein Doppelklick auf site/index.html.

WAS DAS IST
Interaktiver Prototyp: Status → relevante Faktoren → funktionelles Problem →
Interventionskandidaten → Dokumentation. Sarah bestätigt, ändert oder verwirft
jeden Vorschlag. Ausschließlich synthetischer Demo-Fall, keine Patientendaten.
Nichts wird gespeichert oder gesendet; Neu laden oder „Demo zurücksetzen“
stellt den Ausgangsfall wieder her.

Abgeleitetes Präsentationsmaterial, keine Quelle. Quelle und Version liegen in
GitHub (${manifest.sourceRepository}, Branch ${manifest.sourceBranch},
Commit ${manifest.sourceCommit.slice(0, 7)}; siehe MANIFEST.json).
Inhalte ändern: prototype/funktioneller-status/config.js im Repository,
danach npm run prototype:export.

NACH DEM GESPRÄCH
Behalten, aktualisieren oder entfernen (KEEP / UPDATE / RETIRE), damit keine
alten Vorschauen liegen bleiben.
`;
writeFileSync(join(out, "LIES MICH.txt"), readme);

if (existsSync(join(root, "release", "funktioneller-status"))) {
  throw new Error("Prototype leaked into the website export (release/).");
}
console.log(`Prototype export ready: ${relative(root, out)}/ (site ${siteSha256.slice(0, 12)}, ${Object.keys(files).length} files)`);
