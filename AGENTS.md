# AGENTS.md — FRAME · Raum & Zeit engineering handoff

Status: CURRENT ENGINEERING ENTRYPOINT
Updated: 2026-09-25

This contract applies equally to Claude Code and Codex. Claude Code remains the primary substantive builder; Codex is an equivalent capability-fit surface when explicitly selected. For access, secret and current-session capability proof, follow `onyxsystems92/onyx-core/docs/engineering/BUILDER_CAPABILITY_PARITY.md`.

## Objective

Implement the newly accepted WEBSITE-REWORK direction from Franklyn's current Sarah Weber Praxisakte while preserving the already validated Experience. The previous deployment-only mandate is superseded for this work. Deliver a NEAR-ACCEPTANCE-READY COMPLETE seven-page website in one focused engineering pass, migrated fully to an independently runnable local static-site-generator/template, with a usable Sarah-facing editor for text/image/team/news changes, independent preview/publication, and a portable, documented build/backup/restore handoff. The deliverable is the finished review website, not a standalone spike, architecture memo or merely an unintegrated prototype. Do not select or touch production hosting without Tilmann's Plesk/security/operations agreement and Sarah's explicit final approval. Build and validate on an isolated work branch; the existing public GitHub Pages preview on main is not a production endpoint.

Architecture selection must be empirically viable, not protracted: perform a bounded real-world candidate check INSIDE the same continuous full-site migration, then build and test the complete seven-page website and Sarah's editing/export/publication workflow. Publii remains a candidate, not a mandate. If it cannot preserve all key navigation interactions, team/profile editing, stable URLs, independent publication and an exportable single content owner without heavy custom plugins, choose the smallest capable local SSG + non-GitHub-dependent editorial workflow; explain the tradeoff while continuing towards a near-finished review deliverable. Do not create a custom hosted admin/backend, GitHub-dependent publishing, a parallel FRAME CMS or a second production host. Do not prolong the project with a separate customer-facing PoC and another generic framework-question round.

The current `main` is expected to contain the agreed Editorial Green Practice design, FRAME Navigation Home, six visible homepage subpage cards, the bounded Aktuelles content contract, the real practice logo, Google Maps contact route and the full multi-page structure. Verify repository/runtime facts rather than trusting this sentence when exact current state matters.

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

The green card is a near-square editorial rectangle with fine border, restrained shadow and flat visitor-state rows. Do not restore rounded app-card geometry.

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

The whole card is clickable. Pointer hover and keyboard focus turn it green. Desktop uses a balanced three-by-two composition, intermediate widths two columns and mobile one column.

The treatment-context section remains below.

## Aktuelles contract

`content/aktuelles.json` is the bounded prototype content source. It starts empty intentionally. Do not invent demo news.

`aktuelles.html` renders all active published items and keeps a calm empty state when there are none.

The homepage always exposes the Aktuelles page card. A compact homepage notice section appears only when at least one active published item has `showOnHomepage: true`, and shows at most two items.

Validate the renderer and filtering contract from `CONTENT.md`:

- only `status: published`;
- future `publishedAt` remains hidden;
- past `expiresAt` remains hidden;
- homepage requires `showOnHomepage: true`;
- newest active items first;
- text is inserted as text, not trusted HTML;
- no patient or health data.

If useful for local validation, use a temporary local fixture and revert it before any commit. Never leave fictional content in the repository.

For this new work, deliver ordinary independent content editing through an existing local/static generator's bounded editing capability, including actual text/image updates, a newly added team member with image and short biography, and Aktuelles. The existing JSON contract is prototype behavior, not a permanent mandated storage format. Verify Sarah can preview and publish without Franklyn's GitHub account or Tilmann's manual involvement. Do not create a bespoke online admin service, a second FRAME CMS, a patient-data surface or another source of truth. Later FRAME editing is a separate opt-in product phase and must write through the final owning website content source, not copy it into a competing store.

## Intelligence boundary

Preserve:

- `rz:navigation-intent-selected`;
- `rz:navigation-route-selected`;
- session first intent and current intent;
- optional `window.rzTrack` hook only.

Do not introduce external analytics during deployment. Do not collect symptoms, diagnoses, patient names, medical free text or clinical data.

## Google Maps

`praxis.html` contains `Auf Google Maps öffnen` for Raum und Zeit at Düsseldorfer Str. 101 in Düsseldorf.

Keep it as an explicit click-through. No Maps iframe, SDK or API key. No Google Maps request should occur merely from loading the page. Do not infer the disputed postcode from Maps.

## Public copy

Avoid Gedankenstriche as a stylistic device and artificial AI-style hyphen constructions. Do not mechanically damage valid URLs, code, established abbreviations or necessary German compounds.

## Rework validation and smoke test

Preserve Sarah's positively received existing visual identity, all seven pages, patient-navigation routes, direct treatment/contact/appointment paths, URL and event semantics as binding experience regression baseline. Franklyn explicitly requests a coherent, noticeably more lively/polished but recognizably continuous visual upgrade using the actual design skills available in the current Claude Code environment. Discover and use relevant existing design skills if available; if none is present, deliver a restrained professional editorial design upgrade with existing design-system primitives rather than claim to have used an unavailable skill. Implement visuals in the FINAL generator theme, not a throwaway legacy HTML version. Strengthen team/qualification presence selectively without requiring placement on each therapy page or rearranging Navigation Home. No fictitious final photos, team members or unsupported medical claims. Sarah's positive initial reaction is not final acceptance. Deliver a near-final review build after complete local tests; retain noindex/nofollow and no external analytics on all previews.

Validate at about 1440, 900 and 390 pixels:

- all seven pages and internal links;
- white first homepage field;
- editorial rectangular green Navigation Home;
- all four visitor-state accordions, close and switch behavior;
- `aria-expanded`, `aria-pressed`, keyboard access and focus;
- exactly six homepage page cards and correct destinations;
- three-by-two, two-column and one-column responsive card layout;
- hover and keyboard focus states;
- real logo;
- conditional homepage Aktuelles section;
- Aktuelles empty state and data renderer contract;
- treatment-context deep links;
- `praxis.html#termin`;
- Google Maps behavior;
- mobile menu including Escape;
- phone links;
- no horizontal overflow;
- no console errors;
- heading order;
- reduced motion;
- `noindex,nofollow`;
- FRAME navigation events;
- no new external analytics transmission.

Keep the old preview on main as before/after regression reference and complete the ENTIRE migration and bounded design/team upgrade on the isolated engineering branch. Produce a near-ready review URL or portable locally inspectable review artifact if safe staging access is available; do not accidentally replace the current public GitHub Pages preview. Validate all seven pages, stable URL mapping, unchanged visitor-intent interactions, responsive/keyboard navigation and content fixture cleanup. Prove two clean repeatable builds from identical inputs; real text/photo/new-team/news edit → preview → static export → independent simulated publication; full editable-source backup/restore on another machine; safe credentials and portable host transfer. Where live Plesk publish cannot be tested without Tilmann's authorization, mark it as the ONE remaining hosting integration gate, not as already solved. No invented live personnel, clinical claims, news or credentials. Work towards the complete review finish line without waiting for another abstract commercial or technical scope debate.

## Commercial and FRAME independence boundary

The original website-plus-12-month FRAME offer is sent but UNACCEPTED and UNPAID. Franklyn is considering a standalone website sale and only optional later FRAME. This does not authorize any new binding price, revenue claim, customer send, or payment action. He plans to flag the possibility of changing the original offer in the accompanying NEAR-FINAL website review message, without prematurely promising a final website price. Do not postpone the full non-production build for another extended pricing/discovery loop; minimize feature creep and list genuinely missing Sarah-supplied photography, staff facts, legal text and host credentials clearly. FRAME compatibility now means only a documented single authoritative exportable website content source, independent navigation and an optional future integration seam. Do not implement future FRAME functionality, client tracking, separate CMS or mandatory FRAME runtime. A deterministic independent site build and routine content editing without AI after handoff must be demonstrated; do not claim no AI was used while designing/building.

## Production boundary

Tilmann retains authority over Plesk, hosting, server/security settings, server access and the host-side publication/backup contract. Franklyn owns delivery and documentation of the website product, local generator/template and Sarah's bounded editor/workflow. The production interface (least-privilege publishing credential, deployment directory, preview/rollback, maintenance and backup owner) remains a specific open integration gate; access to a repo is not access to production. Sarah owns professional content, commercial choice and final website approval.

If his confirmed Plesk-compatible deployment and content source are available, use exactly that path. Otherwise keep GitHub Pages as preview only and do not choose Cloudflare, Vercel, Netlify, a new CMS or another production host.

The current JSON file is a prototype semantic contract, not a production database commitment.

Keep `noindex,nofollow` until explicit public launch approval.

Before production, replace or self-host the current Google Fonts delivery through a privacy-reviewed path approved for Tilmann's environment.

## Builder capability boundary

Repository access does not imply production access. If production deployment/smoke proof is requested, the selected builder must prove the task-required hosting/deployment/browser capabilities in the current session under the central parity contract. Do not manufacture a parallel hosting path because one builder lacks Tilmann's approved production access.

## Completion report

Report evidence for:

REWORK / DEPLOYMENT STATUS

CURRENT MAIN SHA

NEAR-FINAL REVIEW URL OR ARTIFACT AND ACTUAL COMPLETENESS

DESIGN SKILLS USED (only verified) / BEFORE-AFTER EXPERIENCE DELTAS

PREVIEW OR TARGET URL

SMOKE TEST STATUS

FRAME NAVIGATION STATUS

HOMEPAGE SUBPAGE NAVIGATION STATUS

AKTUELLES STATUS

GOOGLE MAPS STATUS

ISSUES FOUND / FIXED

NOINDEX STATUS

EXTERNAL TRACKING STATUS

LOCAL GENERATOR + TEMPLATE STATUS

REPRODUCIBLE BUILD / RESET + RESTORE STATUS

SARAH SELF-EDIT AND SELF-PUBLISH STATUS (text, photo, new staff member, news)

FULL SOURCE, ASSET AND HOST-MIGRATION STATUS

EDITOR / ACCESS / BACKUP / UPDATE RESPONSIBILITY

PRODUCTION HANDOFF STATUS

NEXT REQUIRED HUMAN DECISION

## Hygiene

`AGENTS.md` is the canonical active instruction file. `CLAUDE.md` is a compatibility pointer only. Historical Claude-specific handoffs remain in Git history and must not compete with this contract.
