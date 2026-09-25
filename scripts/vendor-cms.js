// Copies the installed Static CMS app bundle into admin/vendor so the
// local editor (admin/index.html) is fully self-hosted — no CDN, no
// internet dependency at edit time. Runs automatically after `npm install`.
const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "..", "node_modules", "@staticcms", "app", "dist");
const dest = path.join(__dirname, "..", "admin", "vendor", "static-cms-app");

if (!fs.existsSync(src)) {
  console.error("[vendor-cms] @staticcms/app not found in node_modules — run npm install first.");
  process.exit(1);
}

fs.rmSync(dest, { recursive: true, force: true });
fs.mkdirSync(dest, { recursive: true });
fs.cpSync(src, dest, { recursive: true });
console.log(`[vendor-cms] copied ${src} -> ${dest}`);
