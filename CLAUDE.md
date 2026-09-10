# Codex Handoff · Raum & Zeit

## Objective

Validate and deploy the already implemented Raum und Zeit website. Do not redesign it and do not invent a new architecture.

The current `main` implements the agreed Editorial Green Practice design, the FRAME Navigation Home, the real practice logo and the multi page structure.

## Read first

1. `README.md`
2. `DESIGN.md`
3. all HTML pages
4. `styles.css`
5. `frame-navigation.css`
6. `script.js`

## Binding experience to preserve

The first visible homepage area is green and combines brief positioning with visitor state navigation.

First choices are:

1. Ich bin neu hier.
2. Ich bin bereits Patient:in.
3. Ich möchte eine Behandlung besser verstehen.
4. Ich möchte bei Raum und Zeit arbeiten.

After selection, reveal only relevant next routes. Keep the classic multi page navigation available. Do not turn this back into a category list or one pager.

The real logo at `assets/logo-raum-und-zeit.png` is an accent, not the main visual device.

## Intelligence boundary

The current site prepares only non clinical navigation signals through:

- `rz:navigation-intent-selected`
- `rz:navigation-route-selected`
- ephemeral `sessionStorage` for the first selected state
- optional `window.rzTrack` adapter hook

No external analytics service should be introduced during deployment unless an explicitly approved integration already exists. Do not collect symptoms, diagnoses, patient names, medical free text or other clinical data.

## Public copy rule

Avoid Gedankenstriche as a stylistic device and avoid artificial AI style hyphen constructions. Do not damage correct URLs, code, established abbreviations or genuinely necessary German compounds through mechanical replacement.

## Validation

Serve locally with:

```bash
python3 -m http.server 8000
```

Validate at minimum at about 1440, 900 and 390 pixels.

Check:

- all seven pages and all internal links
- first screen visual hierarchy
- all four visitor state controls
- correct reveal and hiding of intent panels
- `aria-pressed` state and keyboard access
- focus behavior after selection
- real logo rendering
- mobile menu including Escape
- therapy details controls
- deep links such as `praxis.html#termin` and therapy hashes
- phone links
- no horizontal overflow
- no console errors
- heading order
- reduced motion behavior
- `noindex,nofollow`
- custom navigation events fire as intended
- no external analytics or unintended network transmission is introduced

Run a public copy audit for en dash and em dash punctuation. Repair only genuine public copy violations. Do not rewrite established technical strings or medically established abbreviations merely because they contain a hyphen.

Fix implementation defects only and keep fixes narrow.

## Content that remains unresolved

Do not invent postcode, public email, appointment URL, Maps destination, current team roster, final methods, news, opening hours, legal copy or final photography.

## Deployment boundary

Tilmann retains technical authority for the production path.

If a confirmed Plesk compatible deployment and content maintenance path is available, deploy exactly through it.

If it is not available, do not choose Cloudflare, Vercel, Netlify, a new CMS or another production host. The pre existing GitHub Pages setup may remain a preview surface only.

Keep `noindex,nofollow` until explicit public launch approval.

## Completion report

Return only:

VALIDATION STATUS

ISSUES FOUND / FIXED

DEPLOYMENT / HANDOFF TARGET

PREVIEW URL

UNRESOLVED CONTENT

NEXT REQUIRED HUMAN DECISION
