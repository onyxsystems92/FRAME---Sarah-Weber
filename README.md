# Raum & Zeit Website

Multi page concept website for **Raum und Zeit Physiotherapie · Sarah Weber · Düsseldorf Oberkassel**.

## Status

**Experience prototype. Not production.**

The current revision supersedes the August one page concept and the first category based Navigation Home draft. It implements the agreed patient facing FRAME Navigation Layer while keeping the site static and portable until Tilmann confirms the production handoff for the existing Plesk environment.

## Information architecture

- `index.html`: Navigation Home and visible subpage entry surface
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

The first composition uses a white positioning field and a green Navigation Home card. Each visitor state opens its relevant next routes directly underneath the selected row. Clicking the open row again closes it. Opening another row closes the previous one.

Immediately below that orientation layer, the homepage makes the multi page structure explicit through six clickable page cards:

1. Arbeitsweise
2. Therapie
3. Team
4. Praxisbesuch
5. Karriere
6. Aktuelles

These cards replace the former passive differentiator cards and the separate homepage Arbeitsweise feature. The previous `Was uns prägt` and `Verstehen, bevor behandelt wird.` sections are now one compact navigation section. The differentiators Zeit, funktionelles Kontextdenken, fachliche Tiefe and persönliche Kontinuität remain in the supporting copy.

Each page card turns green on pointer hover and keyboard focus, and the whole card opens the corresponding subpage. The six cards use a balanced three by two desktop grid, two columns on intermediate widths and one column on mobile.

The treatment context preview remains below this section and continues to route visitors into deeper therapy anchors.

FRAME translation:

`visitor state → relevance → useful route → next action`

This is deterministic orientation. It is not medical AI, diagnosis or triage.

## Aktuelles content contract

Sarah explicitly needs ordinary practice news and notices to be maintainable without developer dependency.

The prototype therefore includes:

- `content/aktuelles.json`: bounded semantic source for current notices
- `aktuelles.html`: all active published notices
- a conditional homepage notice surface that appears only when an active item is marked `showOnHomepage: true`
- a permanent `Aktuelles` page card on the homepage even when no notice is currently published

The repository starts with no fictional news items. The public Aktuelles page shows a calm empty state until a real notice is approved.

See `CONTENT.md` for the content schema and the future FRAME editing boundary.

The intended future flow is:

`Sarah input → FRAME structure and preview → Sarah approval → authoritative website content source → publish or deploy → FRAME sync`

This does not make FRAME a second CMS or state authority. The final production write target remains gated by Tilmann’s content maintenance and Plesk decision.

## Design direction

Selected synthesis: **Professional editorial structure + botanical warmth.**

The green Navigation Home card is the main interactive accent inside a white first section. It uses a near square editorial geometry rather than rounded app card styling. The uploaded Raum und Zeit logo is used selectively as a restrained accent, including the site brand and the merged homepage navigation section. It is not the dominant visual device. The rest of the system uses warm ivory, muted sage, editorial serif type, readable sans serif type, fine rules and generous space.

See `DESIGN.md` for the binding design and copy contract.

## Navigation intelligence boundary

Phase 1 prepares privacy minimal navigation signals only.

Implemented browser signals:

- `rz:navigation-intent-selected`
- `rz:navigation-route-selected`

The first selected visitor state remains available for the browser session. The currently open visitor state can change as people compare routes and is cleared when the active row is closed. Intent events expose the original first state and the current state where relevant. If an approved analytics adapter is added later, it can expose `window.rzTrack` and consume the same bounded event contract.

No external analytics endpoint is activated by this repository. Do not collect symptoms, diagnoses, patient names, medical free text or other clinical data through this navigation layer or through Aktuelles content.

## Contact and Google Maps

The practice contact section in `praxis.html` includes a direct external link that opens the exact Raum und Zeit location in Google Maps. Google Maps is not embedded and no Maps iframe is loaded on page view. Google is contacted only after the visitor actively follows the link.

The Maps route is for orientation only. The disputed postcode remains a separate launch verification item and is deliberately not required to construct the Maps destination.

## Copy rule

Public website copy avoids Gedankenstriche as a stylistic device and avoids artificial AI style hyphen constructions. Use natural German sentences instead. Correct technical syntax, URLs, established abbreviations and genuinely required compounds are not to be damaged by mechanical replacement.

## Run locally

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000`.

No build command or dependency installation is required.

## Production boundary

Do not treat the current static structure, JSON notice source or renderer as a final CMS or framework decision.

The production architecture remains gated by Tilmann’s answer on:

- Plesk compatible deployment path
- update and handoff workflow
- Sarah’s protected content editing surface
- authoritative production content source
- hosting, security and operational continuity

Do not move production to an alternative host merely because this prototype can run there.

## Unresolved content before public launch

Verify with Sarah and Tilmann:

- correct postcode
- final public email address
- final online appointment URL
- current team roster, roles and approved short bios
- final qualifications and method inventory
- first real `Aktuelles` entry
- final practice and team photography
- current opening and contact information
- legal imprint and privacy content
- production safe font delivery
- final production content maintenance path for Sarah

All pages stay `noindex,nofollow` until explicit launch approval.

## Implementation handoff

`CLAUDE.md` is the operational deployment and smoke test contract. The website strategy, visitor logic, design direction, homepage page hierarchy, Aktuelles content contract and interaction behavior are already decided. Deployment may repair a genuine technical defect, but must not redesign the experience or build a speculative CMS.
