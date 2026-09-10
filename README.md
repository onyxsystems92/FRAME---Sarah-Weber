# Raum & Zeit Website

Multi page concept website for **Raum und Zeit Physiotherapie · Sarah Weber · Düsseldorf Oberkassel**.

## Status

**Experience prototype. Not production.**

The current revision supersedes the August one page concept and the first category based Navigation Home draft. It implements the agreed patient facing FRAME Navigation Layer while keeping the site static and portable until Tilmann confirms the production handoff for the existing Plesk environment.

## Information architecture

- `index.html`: Navigation Home
- `arbeitsweise.html`: how Raum und Zeit works
- `therapie.html`: treatment contexts and deeper professional methods
- `team.html`: Sarah and team structure
- `praxis.html`: visit, contact and appointment path
- `karriere.html`: employer and recruiting surface
- `aktuelles.html`: maintainable practice updates

The homepage starts from visitor state rather than website taxonomy:

1. Ich bin neu hier.
2. Ich bin bereits Patient:in.
3. Ich möchte eine Behandlung besser verstehen.
4. Ich möchte bei Raum und Zeit arbeiten.

After the first choice, only relevant next routes are shown. The multi page structure remains available through the normal navigation.

FRAME translation:

`visitor state → relevance → useful route → next action`

This is deterministic orientation. It is not medical AI, diagnosis or triage.

## Design direction

Selected synthesis: **Professional editorial structure + botanical warmth.**

The first visible homepage area remains deep green. The uploaded Raum und Zeit logo is used as a restrained accent, not as the dominant visual device. The rest of the system uses warm ivory, muted sage, editorial serif type, readable sans serif type, fine rules and generous space.

See `DESIGN.md` for the binding design and copy contract.

## Navigation intelligence boundary

Phase 1 prepares privacy minimal navigation signals only.

Implemented browser signals:

- `rz:navigation-intent-selected`
- `rz:navigation-route-selected`

The first selected visitor state and the current selected visitor state are held only in `sessionStorage` for the current browser session. Intent events expose both where relevant, so a later approved adapter can distinguish the original entry choice from a changed choice before routing. If an approved analytics adapter is added later, it can expose `window.rzTrack` and consume the same bounded event contract.

No external analytics endpoint is activated by this repository. Do not collect symptoms, diagnoses, patient names, medical free text or other clinical data through this navigation layer.

## Copy rule

Public website copy avoids Gedankenstriche as a stylistic device and avoids artificial AI style hyphen constructions. Use natural German sentences instead. Correct technical syntax, URLs, established abbreviations and genuinely required compounds are not to be damaged by mechanical replacement.

## Run locally

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000`.

No build command or dependency installation is required.

## Production boundary

Do not treat the current static structure as a final CMS or framework decision.

The production architecture remains gated by Tilmann’s answer on:

- Plesk compatible deployment path
- update and handoff workflow
- Sarah’s protected content editing surface
- hosting, security and operational continuity

Do not move production to an alternative host merely because this prototype can run there.

## Unresolved content before public launch

Verify with Sarah and Tilmann:

- correct postcode
- final public email address
- final online appointment URL
- Google Maps destination or embed
- current team roster, roles and approved short bios
- final qualifications and method inventory
- first real `Aktuelles` entry
- final practice and team photography
- current opening and contact information
- legal imprint and privacy content
- production safe font delivery

All pages stay `noindex,nofollow` until explicit launch approval.

## Implementation handoff

`CLAUDE.md` is the operational validation and deployment contract. The website strategy, visitor logic and design direction are already decided. Validation may repair defects, but must not redesign the experience.
