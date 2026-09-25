#!/usr/bin/env node
// Copy the public site only. The local content editor must never go online.
"use strict";
const fs = require("fs");
const path = require("path");
const root = path.resolve(__dirname, "..");
const source = path.join(root, "dist");
const output = path.join(root, "release");
if (!fs.existsSync(path.join(source, "index.html"))) {
  console.error("Run npm run build first.");
  process.exit(1);
}
fs.rmSync(output, { recursive: true, force: true });
fs.cpSync(source, output, {
  recursive: true,
  filter: (file) => {
    const relative = path.relative(source, file);
    return relative !== "admin" && !relative.startsWith("admin" + path.sep);
  },
});
if (fs.existsSync(path.join(output, "admin"))) throw new Error("Editor leaked to public output");
console.log("Public export ready: release/ (no local editor).");
