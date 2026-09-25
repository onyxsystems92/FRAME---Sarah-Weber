#!/usr/bin/env node
// Optional, host-independent publish path: uploads dist/ to a real web
// host over SFTP (the standard secure-copy protocol any professional host,
// including Plesk, supports — nothing host-specific is assumed).
//
// This script invents no host, user, path or credential. It only reads
// them from environment variables (optionally via a local, gitignored
// .env.publish file) that Franklyn/Tilmann must set once real, confirmed
// access exists. Until then, every required variable is simply unset and
// --live refuses to run.
//
// Modes:
//   --dry-run (default)  Builds dist/, lists exactly what would be
//                         uploaded and shows the sftp batch plan. Makes
//                         NO network connection. Safe to run any time.
//   --live                Builds dist/, then actually uploads over SFTP.
//                          Refuses unless: all required env vars are set,
//                          the process is running in an interactive
//                          terminal (not CI/automation), and the operator
//                          types an exact confirmation phrase naming the
//                          real target host. This exists specifically so a
//                          stray "npm run publish:live" cannot silently
//                          push to a real site.
//
// This has never been run against a real host (see AGENTS.md — the Plesk
// side is Tilmann's open integration gate, not tested or assumed here).
"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");
const readline = require("readline");
const { spawnSync } = require("child_process");

const root = path.join(__dirname, "..");
const distDir = path.join(root, "release");

// Optional local, gitignored env file — never committed, never invented.
const envFile = path.join(root, ".env.publish");
if (fs.existsSync(envFile)) {
  try {
    require("dotenv").config({ path: envFile });
  } catch {
    console.warn("[publish] .env.publish exists but 'dotenv' could not be loaded; run npm install first.");
  }
}

const live = process.argv.includes("--live");
const dryRun = !live;

const REQUIRED = ["RZ_SFTP_HOST", "RZ_SFTP_USER", "RZ_SFTP_REMOTE_PATH"];
const config = {
  host: process.env.RZ_SFTP_HOST || "",
  port: process.env.RZ_SFTP_PORT || "22",
  user: process.env.RZ_SFTP_USER || "",
  remotePath: process.env.RZ_SFTP_REMOTE_PATH || "",
  keyPath: process.env.RZ_SFTP_KEY_PATH || "",
};

function listFiles(dir, base = dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listFiles(full, base));
    } else {
      out.push(path.relative(base, full));
    }
  }
  return out;
}

function build() {
  console.log("[publish] Baue den aktuellen öffentlichen Export release/ (npm run export) ...");
  const result = spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "export"], {
    cwd: root,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    console.error("[publish] Build fehlgeschlagen — Abbruch, kein Upload.");
    process.exit(1);
  }
}

function printMissingConfig() {
  console.log("Fehlende Angaben für den SFTP-Upload (keine erfunden, keine hinterlegt):\n");
  for (const key of REQUIRED) {
    console.log(`  ${key} = ${process.env[key] ? "(gesetzt)" : "NICHT GESETZT"}`);
  }
  console.log(
    "\nDiese Werte müssen von Tilmann bestätigt und lokal gesetzt werden (Umgebungsvariablen " +
      "oder eine nicht eingecheckte .env.publish Datei im Projektordner), bevor ein echter " +
      "Upload möglich ist. Siehe README.md / EDITING.md."
  );
}

function main() {
  if (!fs.existsSync(root)) {
    console.error("[publish] Projektordner nicht gefunden.");
    process.exit(1);
  }

  build();

  if (!fs.existsSync(distDir)) {
    console.error("[publish] dist/ wurde nicht erzeugt — Abbruch.");
    process.exit(1);
  }

  const files = listFiles(distDir).sort();
  console.log(`\n[publish] ${files.length} Dateien in dist/ bereit zum Hochladen:`);
  files.forEach((f) => console.log("  " + f));

  const missing = REQUIRED.filter((key) => !process.env[key]);

  console.log("\n[publish] Ziel (aus Umgebungsvariablen, nichts erfunden):");
  console.log(`  Host: ${config.host || "(nicht gesetzt)"}`);
  console.log(`  Port: ${config.port}`);
  console.log(`  Benutzer: ${config.user || "(nicht gesetzt)"}`);
  console.log(`  Remote-Pfad: ${config.remotePath || "(nicht gesetzt)"}`);
  console.log(`  Schlüssel: ${config.keyPath || "(nicht gesetzt — SFTP-Batch benötigt einen bereits eingerichteten SSH-Schlüssel/Agenten)"}`);

  const sftpArgs = ["-oBatchMode=yes", "-oStrictHostKeyChecking=yes", "-P", config.port];
  if (config.keyPath) sftpArgs.push("-i", config.keyPath);
  sftpArgs.push(`${config.user}@${config.host}`);

  const batchLines = [`lcd ${distDir}`, `cd ${config.remotePath}`, "put -r *"];

  if (dryRun) {
    console.log(
      "\n[publish] DRY RUN — es wurde KEINE Netzwerkverbindung hergestellt und NICHTS hochgeladen."
    );
    if (missing.length) {
      console.log("");
      printMissingConfig();
    } else {
      console.log("\nGeplanter Befehl (würde bei --live ausgeführt):");
      console.log(`  sftp ${sftpArgs.join(" ")}`);
      console.log("Geplantes sftp-Batch-Skript:");
      batchLines.forEach((l) => console.log("  " + l));
      console.log(
        "\nHinweis: der Remote-Pfad muss auf dem Host bereits existieren — sftp legt keine " +
          "verschachtelten Ordner automatisch an."
      );
    }
    console.log("\nEchter Upload: npm run publish:live (fragt vor jedem Live-Push nochmal nach Bestätigung).");
    return;
  }

  // Restrict batch commands to a normal absolute path. Never let user-provided
  // newlines, wildcards, shell quoting or relative paths turn into SFTP commands.
  const safeTarget = /^[A-Za-z0-9.-]+$/.test(config.host) &&
    /^[A-Za-z0-9_.-]+$/.test(config.user) &&
    /^\/[A-Za-z0-9_./-]+$/.test(config.remotePath) &&
    !config.remotePath.split("/").includes("..") &&
    /^\d{1,5}$/.test(config.port) &&
    Number(config.port) > 0 && Number(config.port) <= 65535;
  if (!safeTarget && !missing.length) {
    console.error("[publish] Ungültige Host-/Benutzer-/Pfadangabe; sicherer absoluter Zielpfad nötig.");
    process.exit(1);
  }

  // --live from here on.
  if (missing.length) {
    console.error("\n[publish] LIVE-UPLOAD ABGEBROCHEN — Pflichtangaben fehlen:\n");
    printMissingConfig();
    process.exit(1);
  }

  if (!process.stdin.isTTY) {
    console.error(
      "\n[publish] LIVE-UPLOAD ABGEBROCHEN — kein interaktives Terminal erkannt. " +
        "Ein echter Upload verlangt eine Bestätigung durch einen Menschen und läuft " +
        "deshalb nicht automatisiert/unbeaufsichtigt."
    );
    process.exit(1);
  }

  const confirmPhrase = `UPLOAD ${config.host}`;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  console.log(
    `\n[publish] Das lädt jetzt ${files.length} Dateien nach ${config.user}@${config.host}:${config.remotePath} hoch. ` +
      "Das ist ein echter Live-Upload, keine Vorschau."
  );
  rl.question(`Zum Bestätigen exakt eintippen: "${confirmPhrase}"\n> `, (answer) => {
    rl.close();
    if (answer.trim() !== confirmPhrase) {
      console.error("[publish] Bestätigung stimmt nicht überein — Abbruch, kein Upload.");
      process.exit(1);
    }

    const batchFile = path.join(os.tmpdir(), `rz-publish-${Date.now()}.batch`);
    fs.writeFileSync(batchFile, batchLines.join("\n") + "\n");

    console.log("[publish] Starte sftp ...");
    const result = spawnSync("sftp", ["-b", batchFile, ...sftpArgs], {
      cwd: root,
      stdio: "inherit",
    });
    fs.rmSync(batchFile, { force: true });

    if (result.error) {
      console.error(`[publish] sftp konnte nicht gestartet werden: ${result.error.message}`);
      process.exit(1);
    }
    if (result.status !== 0) {
      console.error(`[publish] sftp meldete einen Fehler (Exit-Code ${result.status}). Nichts wurde bestätigt als vollständig hochgeladen.`);
      process.exit(result.status || 1);
    }
    console.log("[publish] sftp abgeschlossen ohne gemeldeten Fehler. Bitte die Website live prüfen.");
  });
}

main();
