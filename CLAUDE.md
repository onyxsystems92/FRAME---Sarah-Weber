# Claude Code Handoff · Raum & Zeit

## Objective

Deploy and smoke test the already implemented Raum und Zeit website. Do not redesign it and do not invent a new architecture.

The current `main` is expected to contain the agreed Editorial Green Practice design, the FRAME Navigation Home, the real practice logo, the Google Maps contact route and the multi page structure.

## Read first

1. `README.md`
2. `DESIGN.md`
3. all HTML pages
4. `styles.css`
5. `frame-navigation.css`
6. `script.js`

## Binding experience to preserve

The first homepage composition has a white positioning field and a green Navigation Home card.

First choices are:

1. Ich bin neu hier.
2. Ich bin bereits Patient:in.
3. Ich möchte eine Behandlung besser verstehen.
4. Ich möchte bei Raum und Zeit arbeiten.

Each choice is an inline accordion row. Its relevant routes must open directly underneath the selected row. Clicking the open row again closes it. Opening another row closes the previous one. Do not move the revealed routes into a detached panel below the full choice list.

Keep the classic multi page navigation available. Do not turn this back into a category list or one pager.

The real logo at `assets/logo-raum-und-zeit.png` is an accent, not the main visual device. It is used in the site brand and as a restrained visual accent in the homepage Arbeitsweise section.

## Intelligence boundary

The current site prepares only non clinical navigation signals through:

- `rz:navigation-intent-selected`
- `rz:navigation-route-selected`
- ephemeral `sessionStorage` for first and current visitor state
- optional `window.rzTrack` adapter hook

The first selected state should remain stable for the session. The current state should reflect the currently open accordion and may be cleared when that accordion is closed.

No external analytics service should be introduced during deployment unless an explicitly approved integration already exists. Do not collect symptoms, diagnoses, patient names, medical free text or other clinical data.

## Google Maps contact route

`praxis.html` contains a direct `Auf Google Maps öffnen` link for the practice location.

This is intentionally a click through rather than an embedded Maps iframe. The page must not contact Google Maps merely because the visitor opens the contact section. Google Maps may load only after the visitor actively follows the external link.

Smoke test that the link resolves to the intended Raum und Zeit Physiotherapie location at Düsseldorfer Str. 101 in Düsseldorf. Do not infer or rewrite the disputed postcode from the Maps destination. Postcode remains a separate launch verification item.

Do not replace this with an iframe, Maps SDK, API key or new consent management implementation during this deployment pass.

## Public copy rule

Avoid Gedankenstriche as a stylistic device and avoid artificial AI style hyphen constructions. Do not damage correct URLs, code, established abbreviations or genuinely necessary German compounds through mechanical replacement.

## Deployment and smoke test

Do not perform another design or product iteration.

After deployment, smoke test at minimum at about 1440, 900 and 390 pixels.

Check:

- all seven pages and all internal links
- white first homepage field and green Navigation Home card
- all four visitor state controls
- routes open directly below the selected row
- clicking the active row closes it
- opening another row closes the previous row
- `aria-expanded`, `aria-pressed` and keyboard access
- real logo rendering in header and homepage Arbeitsweise accent
- Google Maps link in the contact and address section
- no Google Maps request before active click
- external Maps link opens the intended practice location
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
- no external analytics transmission is introduced

Fix only a genuine implementation defect and keep any fix narrow. If no defect exists, do not change the website.

## Content that remains unresolved

Do not invent postcode, public email, appointment URL, current team roster, final methods, news, opening hours, legal copy or final photography.

## Deployment boundary

Tilmann retains technical authority for the production path.

If a confirmed Plesk compatible deployment and content maintenance path is available, deploy exactly through it.

If it is not available, do not choose Cloudflare, Vercel, Netlify, a new CMS or another production host. The pre existing GitHub Pages setup may remain a preview surface only.

Keep `noindex,nofollow` until explicit public launch approval.

Before production, replace or self host the current Google Fonts delivery through a privacy reviewed path approved for Tilmann’s environment.

## Completion report

Return only:

DEPLOYMENT STATUS

CURRENT MAIN SHA

PREVIEW OR TARGET URL

SMOKE TEST STATUS

GOOGLE MAPS STATUS

ISSUES FOUND / FIXED

NOINDEX STATUS

EXTERNAL TRACKING STATUS

PRODUCTION HANDOFF STATUS

NEXT REQUIRED HUMAN DECISION