#!/usr/bin/env node
/**
 * Offline presentation server for the exported "Funktioneller Status" prototype.
 *
 * Node built-ins only: no npm install, no dev server, no Internet. Serves the
 * sibling site/ folder on 127.0.0.1 (never the network): "/" → index.html,
 * otherwise exact files. Opens the browser once it listens and reuses an
 * already running copy of the same export.
 *
 *   node serve-local.mjs            serve and open the browser
 *   node serve-local.mjs --no-open  serve only (also: PREVIEW_NO_OPEN=1)
 *
 * Copied next to the export by scripts/prototype-export.mjs.
 */

import { createServer, get } from "node:http";
import { spawn } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, normalize, sep } from "node:path";
import { argv } from "node:process";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SITE = join(HERE, "site");
const MANIFEST = JSON.parse(readFileSync(join(HERE, "MANIFEST.json"), "utf8"));
const ID = `${MANIFEST.route}@${MANIFEST.siteSha256}`;
const HOST = "127.0.0.1";
const FIRST_PORT = 4427;
const OPEN = !argv.includes("--no-open") && process.env.PREVIEW_NO_OPEN !== "1";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".woff2": "font/woff2",
};

const HEADERS = {
  "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet",
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
};

const server = createServer((req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url ?? "/", "http://local").pathname);
  } catch {
    res.writeHead(400, HEADERS);
    res.end();
    return;
  }
  if (pathname === "/__preview-id") {
    res.writeHead(200, { ...HEADERS, "Content-Type": "text/plain; charset=utf-8" });
    res.end(ID);
    return;
  }
  const rel = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const file = normalize(join(SITE, rel));
  if (!file.startsWith(SITE + sep) || !existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404, { ...HEADERS, "Content-Type": "text/plain; charset=utf-8" });
    res.end("Nicht gefunden.");
    return;
  }
  res.writeHead(200, { ...HEADERS, "Content-Type": TYPES[extname(file).toLowerCase()] ?? "application/octet-stream" });
  res.end(readFileSync(file));
});

function openBrowser(url) {
  if (!OPEN) return;
  const chrome = "/Applications/Google Chrome.app";
  const args = existsSync(chrome) ? ["-a", "Google Chrome", url] : [url];
  spawn("open", args, { stdio: "ignore", detached: true }).unref();
}

function alreadyServing(port) {
  return new Promise((done) => {
    const req = get({ host: HOST, port, path: "/__preview-id", timeout: 800 }, (res) => {
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => done(body === ID));
    });
    req.on("error", () => done(false));
    req.on("timeout", () => { req.destroy(); done(false); });
  });
}

async function listen(port) {
  if (port > FIRST_PORT + 20) {
    console.error(`Kein freier lokaler Port gefunden (${FIRST_PORT}–${FIRST_PORT + 20}).`);
    process.exit(1);
  }
  if (await alreadyServing(port)) {
    const url = `http://${HOST}:${port}/`;
    console.log(`Die Präsentation läuft bereits: ${url}`);
    openBrowser(url);
    process.exit(0);
  }
  server.once("error", (err) => {
    if (err.code === "EADDRINUSE") listen(port + 1);
    else throw err;
  });
  server.listen(port, HOST, () => {
    const url = `http://${HOST}:${port}/`;
    console.log(`${MANIFEST.title} · offline`);
    console.log(`Läuft: ${url}`);
    console.log("Beenden: dieses Fenster schließen oder Ctrl+C.");
    openBrowser(url);
  });
}

listen(FIRST_PORT);
