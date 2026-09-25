#!/usr/bin/env node
// One command, one terminal window: starts the local content editor
// (Static CMS proxy, loopback only) and the live preview server (Eleventy
// --serve, with watch+rebuild on save) together, so Sarah does not need to
// open and manage two terminal windows herself. Ctrl+C stops both.
"use strict";

const { spawn } = require("child_process");
const path = require("path");

const root = path.join(__dirname, "..");

function run(label, command, args) {
  const child = spawn(command, args, { cwd: root, env: process.env });
  const prefix = `[${label}] `;
  const forward = (stream, data) => {
    data
      .toString()
      .split("\n")
      .filter((line) => line.length > 0)
      .forEach((line) => stream.write(prefix + line + "\n"));
  };
  child.stdout.on("data", (data) => forward(process.stdout, data));
  child.stderr.on("data", (data) => forward(process.stderr, data));
  return child;
}

console.log("Starte Editor (lokal, nur dieser Rechner) und Vorschau ...");
console.log("Vorschau: http://localhost:8080/  ·  Editor: http://localhost:8080/admin/");
console.log("Zum Beenden: Ctrl+C\n");

const eleventyCli = path.join(root, "node_modules", "@11ty", "eleventy", "cmd.cjs");

const cms = run("editor", process.execPath, [path.join(__dirname, "cms-server.js")]);
const preview = run("vorschau", process.execPath, [
  "--require", path.join(__dirname, "loopback-only.js"),
  eleventyCli,
  "--input=src",
  "--output=dist",
  "--serve",
  "--port=8080",
]);

let shuttingDown = false;
function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log("\nBeende Editor und Vorschau ...");
  cms.kill();
  preview.kill();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

let exited = 0;
function onChildExit(code) {
  exited += 1;
  if (!shuttingDown && code && code !== 0) {
    shutdown();
  }
  if (exited === 2) {
    process.exit(shuttingDown ? 0 : 1);
  }
}
cms.on("exit", onChildExit);
preview.on("exit", onChildExit);
