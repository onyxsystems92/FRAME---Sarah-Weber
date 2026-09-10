# Claude Code Handoff · Raum & Zeit

## Objective

Deploy and smoke test the already implemented Raum und Zeit website. Do not redesign it, reopen product decisions or invent a new architecture.

The current `main` is expected to contain the agreed Editorial Green Practice design, FRAME Navigation Home, six visible homepage subpage cards, the bounded Aktuelles content contract, the real practice logo, Google Maps contact route and the full multi page structure.

## Read first

1. `README.md`
2. `DESIGN.md`
3. `CONTENT.md`
4. all HTML pages
5. `styles.css`
6. `frame-navigation.css`
7. `aktuelles.css`
8. `script.js`
9. `content/aktuelles.json`

## Preserve the accepted experience

The homepage begins with a white positioning field and a green FRAME Navigation Home card.

The green card is a near square editorial rectangle with fine border, restrained shadow and flat visitor state rows. Do not restore rounded app card geometry.

First choices remain:

1. Ich bin neu hier.
2. Ich bin bereits Patient:in.
3. Ich möchte eine Behandlung besser verstehen.
4. Ich möchte bei Raum und Zeit arbeiten.

Each choice is an inline accordion. Relevant routes open directly beneath the selected row. Clicking the open row closes it. Opening another row closes the previous one.

Immediately below, the merged `Was uns prägt` / `Verstehen, bevor behandelt wird.` section contains exactly six full page cards:

1. Arbeitsweise
2. Therapie
3. Team
4. Praxisbesuch
5. Karriere
6. Aktuelles

The whole card is clickable. Pointer hover and keyboard focus turn it green. Desktop uses a balanced three by two composition, intermediate widths two columns and mobile one column.

The treatment context section remains below.

## Aktuelles contract

`content/aktuelles.json` is the bounded prototype content source. It starts empty intentionally. Do not invent demo news.

`aktuelles.html` renders all active published items and keeps a calm empty state when there are none.

The homepage always exposes the Aktuelles page card. A compact homepage notice section appears only when at least one active published item has `showOnHomepage: true`, and shows at most two items.

Validate the renderer and filtering contract from `CONTENT.md`:

- only `status: published`
- future `publishedAt` remains hidden
- past `expiresAt` remains hidden
- homepage requires `showOnHomepage: true`
- newest active items first
- text is inserted as text, not trusted HTML
- no patient or health data

If useful for local validation, use a temporary local fixture and revert it before any commit. Never leave fictional content in the repository.

Future FRAME editing is a product direction, not part of this deployment. Do not build authentication, a CMS, an admin panel or a production content API. FRAME may later provide Sarah a `Website / Aktuelles` editing and preview surface, but after human approval it must write through the authoritative production content source chosen with Tilmann. FRAME is not a second content truth store.

## Intelligence boundary

Preserve:

- `rz:navigation-intent-selected`
- `rz:navigation-route-selected`
- session first intent and current intent
- optional `window.rzTrack` hook only

Do not introduce external analytics during deployment. Do not collect symptoms, diagnoses, patient names, medical free text or clinical data.

## Google Maps

`praxis.html` contains `Auf Google Maps öffnen` for Raum und Zeit at Düsseldorfer Str. 101 in Düsseldorf.

Keep it as an explicit click through. No Maps iframe, SDK or API key. No Google Maps request should occur merely from loading the page. Do not infer the disputed postcode from Maps.

## Public copy

Avoid Gedankenstriche as a stylistic device and artificial AI style hyphen constructions. Do not mechanically damage valid URLs, code, established abbreviations or necessary German compounds.

## Deployment and smoke test

Do not perform another design or product iteration.

Validate at about 1440, 900 and 390 pixels:

- all seven pages and internal links
- white first homepage field
- editorial rectangular green Navigation Home
- all four visitor state accordions, close and switch behavior
- `aria-expanded`, `aria-pressed`, keyboard access and focus
- exactly six homepage page cards and correct destinations
- three by two, two column and one column responsive card layout
- hover and keyboard focus states
- real logo
- conditional homepage Aktuelles section
- Aktuelles empty state and data renderer contract
- treatment context deep links
- `praxis.html#termin`
- Google Maps behavior
- mobile menu including Escape
- phone links
- no horizontal overflow
- no console errors
- heading order
- reduced motion
- `noindex,nofollow`
- FRAME navigation events
- no new external analytics transmission

Fix only a genuine technical defect, keep the fix narrow, validate again and merge only after a clean diff. If no defect exists, do not change code.

## Production boundary

Tilmann retains technical authority for production hosting, security, deployment and the final content maintenance path.

If his confirmed Plesk compatible deployment and content source are available, use exactly that path. Otherwise keep GitHub Pages as preview only and do not choose Cloudflare, Vercel, Netlify, a new CMS or another production host.

The current JSON file is a prototype semantic contract, not a production database commitment.

Keep `noindex,nofollow` until explicit public launch approval.

Before production, replace or self host the current Google Fonts delivery through a privacy reviewed path approved for Tilmann’s environment.

## Completion report

Return only:

DEPLOYMENT STATUS

CURRENT MAIN SHA

PREVIEW OR TARGET URL

SMOKE TEST STATUS

FRAME NAVIGATION STATUS

HOMEPAGE SUBPAGE NAVIGATION STATUS

AKTUELLES STATUS

GOOGLE MAPS STATUS

ISSUES FOUND / FIXED

NOINDEX STATUS

EXTERNAL TRACKING STATUS

PRODUCTION HANDOFF STATUS

NEXT REQUIRED HUMAN DECISION
