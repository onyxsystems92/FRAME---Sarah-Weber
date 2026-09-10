# Raum & Zeit Website

Multi-page first-draft website for **Raum und Zeit Physiotherapie · Sarah Weber · Düsseldorf-Oberkassel**.

## Status

**Design / content prototype — not production.**

This revision supersedes the August one-page concept. It translates the validated practice direction into a real multi-page information architecture while keeping the implementation intentionally static and dependency-free until Tilmann confirms the production handoff for the existing Plesk environment.

## Information architecture

- `index.html` — Navigation Home
- `arbeitsweise.html` — how Raum & Zeit works
- `therapie.html` — treatment contexts + deeper professional methods
- `team.html` — Sarah + team structure
- `praxis.html` — visit, contact, appointment path
- `karriere.html` — employer / recruiting surface
- `aktuelles.html` — maintainable news / practice updates

The homepage follows:

`visitor intent → relevant page → concise practice information → useful next action`

This is deterministic information architecture, not medical AI or triage.

## Design direction

Selected synthesis: **Professional editorial structure + botanical warmth.**

The site keeps the green identity but makes it darker, calmer and more mature:
- deep forest green
- warm ivory / stone
- muted sage
- one restrained warm sand accent
- editorial serif display type + highly readable sans-serif body
- hairline borders, generous whitespace, almost no shadows
- abstract hourglass / “Z” as the signature device
- practice/team photography should replace the abstract placeholders before launch

See `DESIGN.md` for the design contract.

## Run locally

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000`.

No build command or dependency installation is required.

## Production boundary

Do **not** treat the current static structure as a final CMS/framework decision.

The production architecture remains gated by Tilmann’s answer on:
- Plesk-compatible deployment path
- update / handoff workflow
- Sarah’s protected content-editing surface
- hosting / security / operational continuity

The static files are deliberately portable so the final technical choice can wrap or absorb them without redesigning the experience.

## Unresolved content before public launch

Verify with Sarah / Tilmann:
- correct postcode (owned website and external listings currently conflict)
- final public email address
- final online appointment URL
- real Google Maps / route destination
- current team roster, roles and approved short bios
- final qualifications / method inventory
- first real `Aktuelles` entry
- final practice / team photography
- current opening / contact information
- legal imprint and privacy content
- production-safe font delivery (prefer self-hosting rather than Google Fonts)

All pages stay `noindex,nofollow` in this prototype.

## Data / intelligence boundary

No analytics, patient data, symptoms, medical free text, diagnosis or autonomous routing are implemented.

Future privacy-minimal navigation signals may be added only after technical/privacy review. Existing practice systems remain the operational/clinical source of truth.

## Claude Code

`CLAUDE.md` is intentionally reduced to final validation and deployment/handoff work.
