// WCAG AA contrast audit of every rendered text node on all seven pages.
//
//   node scripts/contrast-check.mjs --base-url http://127.0.0.1:8099
//
// Disclosures are opened and reveal animations are forced to their end state
// first, so copy that is only visible after an interaction is measured too.
import { chromium } from "playwright";
const baseArgIndex = process.argv.indexOf("--base-url");
const base = baseArgIndex !== -1 ? process.argv[baseArgIndex + 1] : "http://127.0.0.1:8099";
const PAGES = ["index","arbeitsweise","therapie","team","praxis","karriere","aktuelles"];
const b = await chromium.launch();
const ctx = await b.newContext({ viewport:{width:1440,height:900} });
const page = await ctx.newPage();
const all = new Map();

for (const p of PAGES) {
  await page.goto(`${base}/${p}.html`, { waitUntil:"networkidle" });
  // open every disclosure so hidden copy is measured too
  await page.evaluate(() => {
    document.querySelectorAll('details').forEach(d => d.open = true);
    document.querySelectorAll('[data-intent-button]').forEach((b,i) => { if (i===0) b.click(); });
    document.querySelectorAll('[data-reveal-item]').forEach(e => e.classList.add('is-in'));
  });
  await page.waitForTimeout(400);
  const res = await page.evaluate(() => {
    const lum = ([r,g,b]) => { const f=c=>{c/=255;return c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4)}; return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b); };
    const parse = s => (s.match(/[\d.]+/g)||[]).map(Number);
    const blend = (fg, bg) => { const a = fg[3] ?? 1; return [0,1,2].map(i => fg[i]*a + bg[i]*(1-a)); };
    const bgOf = el => {
      let n = el;
      while (n && n !== document.documentElement) {
        const c = parse(getComputedStyle(n).backgroundColor);
        if (c.length >= 3 && (c[3] === undefined || c[3] > 0.92)) return [c[0],c[1],c[2]];
        n = n.parentElement;
      }
      return [255,255,255];
    };
    const out = [];
    document.querySelectorAll('body *').forEach(el => {
      const hasText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1);
      if (!hasText) return;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity < 0.5) return;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const fg = blend(parse(cs.color), bgOf(el));
      const bg = bgOf(el);
      const L1 = lum(fg), L2 = lum(bg);
      const ratio = (Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05);
      const px = parseFloat(cs.fontSize);
      const bold = parseInt(cs.fontWeight,10) >= 700;
      const large = px >= 24 || (px >= 18.66 && bold);
      const need = large ? 3 : 4.5;
      if (ratio < need) out.push({ sel: `${el.tagName}.${(el.className||'').toString().trim().split(/\s+/)[0]}`, ratio: +ratio.toFixed(2), need, px, text: el.textContent.trim().slice(0,42) });
    });
    return out;
  });
  res.forEach(r => all.set(`${r.sel}|${r.text}`, { page: p, ...r }));
}
await b.close();
if (!all.size) console.log("CONTRAST: all measured text meets WCAG AA");
else {
  console.log(`CONTRAST: ${all.size} findings`);
  [...all.values()].forEach(r => console.log(` - [${r.page}] ${r.sel} ${r.ratio}:1 (needs ${r.need}) ${r.px}px — "${r.text}"`));
  process.exit(1);
}
