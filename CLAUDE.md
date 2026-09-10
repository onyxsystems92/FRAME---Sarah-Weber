# Claude Code Handoff — Raum & Zeit Multi-Page Website

MODEL: Claude Code
INTELLIGENCE: SONNET unless a harder engineering problem materially requires Opus.
ENVIRONMENT: CLOUD unless local-only media/assets are supplied.

## Objective

Validate and, once the approved hosting path is known, deploy the already-implemented **Editorial Green Practice multi-page prototype** for Sarah Weber / Raum und Zeit Physiotherapie.

The website strategy, information architecture, design direction and current content boundaries are already decided. **Do not redesign them.**

## Read first

1. `README.md`
2. `DESIGN.md`
3. all HTML pages
4. `styles.css`
5. `script.js`

## Current architecture to preserve

- real multi-page site, not a one-pager
- homepage = Navigation Home
- pages: Arbeitsweise, Therapie, Team, Praxisbesuch / Termin, Karriere, Aktuelles
- deep forest green + warm ivory + muted sage
- editorial serif + readable sans-serif
- abstract hourglass / Z signature
- progressive information depth
- no backend
- no medical AI / diagnosis / triage
- no patient or health data
- no analytics yet
- `noindex,nofollow` until explicit production approval

## Validation

Serve locally:

```bash
python3 -m http.server 8000
```

Validate at minimum:
- desktop ~1440px
- tablet ~900px
- mobile ~390px
- every navigation link and page route
- mobile menu open / close / Escape behavior
- all therapy `<details>` controls
- phone link
- anchors such as `praxis.html#termin`
- no horizontal overflow
- no console errors
- keyboard usability
- meaningful heading order
- `prefers-reduced-motion`
- no accidental external tracking or patient-data collection

Fix implementation defects only. Prefer narrow fixes over rewrites.

## Content that must remain unresolved until confirmed

Do not invent:
- postcode
- final public email
- final appointment URL
- Maps destination/embed
- current team roster / bios
- exact current method list
- real news
- opening hours
- legal copy
- final photography

The prototype intentionally exposes some of these as preview placeholders.

## Production handoff gate

Before choosing or introducing a production framework/CMS, use Tilmann’s confirmed Plesk-compatible handoff requirements.

Required answer / evidence:
- deployment target
- static upload vs repository build/deploy
- how updates are applied
- how Sarah edits ordinary content safely
- hosting/security constraints

Do not move production to Cloudflare/Vercel/Netlify merely because the prototype can run there.

## Fonts

The preview currently loads Google Fonts. For public production, self-host or use a privacy-approved delivery method.

## Deployment

Only after Franklyn explicitly approves production cutover:
1. preserve the existing live site until replacement is verified
2. deploy to the approved staging/production target
3. smoke-test all pages and links
4. verify noindex is intentionally removed only when launch is approved
5. report exact deployment evidence

## Completion report

Return only:
- VALIDATION STATUS
- ISSUES FOUND / FIXED
- DEPLOYMENT / HANDOFF TARGET
- PREVIEW URL
- UNRESOLVED CONTENT
- NEXT REQUIRED HUMAN DECISION
