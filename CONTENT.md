# Raum & Zeit Content Contract

## Purpose

Sarah must be able to maintain ordinary website content without becoming dependent on Franklyn or a developer for every small change. The first bounded content case is `Aktuelles`.

The prototype therefore defines one small semantic content contract without deciding the final production CMS, framework or storage layer.

## Current Eleventy source and generated feed

The authoritative editable source is one Markdown file per announcement in
src/aktuelles/*.md. A local Static CMS interface edits those files. Eleventy
generates dist/content/aktuelles.json (and release/content/aktuelles.json)
for the existing frontend renderer. This JSON is a build artifact, not a
second editable source or a production database. Only status=published
items enter the public JSON feed; drafts stay in the local source folder.
A future-dated published notice is not displayed by the frontend until
that date, but its text can already be read in the public JSON feed after
export. Do not enter embargoed/confidential information into scheduled
public notices. Entire website export and actual host upload are separate
actions. See EDITING.md for the real local edit/publication boundaries.

Schema per item:

```json
{
  "id": "ferien-winter-2026",
  "status": "draft",
  "title": "Kurzer Titel",
  "text": "Kurzer Hinweis für Praxisbesucher.",
  "publishedAt": "2026-12-20",
  "expiresAt": "2027-01-05",
  "showOnHomepage": true
}
```

Rules:

- `id` is stable and unique.
- `status` is `draft` or `published`.
- `title` and `text` contain public practice information only.
- `publishedAt` uses `YYYY-MM-DD`. A future date keeps the item hidden until that date.
- `expiresAt` is optional. After that date the item is no longer rendered.
- `showOnHomepage` controls whether an active published item may appear in the compact homepage notice surface.
- The homepage shows at most two active items.
- `aktuelles.html` shows all active published items, newest first.
- Never put patient names, symptoms, diagnoses, treatment records or other health information into this content source.

The repository starts with an empty item list. Do not create fictional practice news for the preview.

## Content ownership

One rule separates Sarah's content from the website implementation:

| Kind | Where it lives | Who edits it |
| --- | --- | --- |
| Public editorial copy of all seven pages and the footer | `src/_data/copy/<page>.yaml` | Sarah, local editor → „Seiteninhalte“ |
| Practice master data (phone, address, map and booking link) | `src/_data/site.yaml` | Sarah → „Praxis-Angaben“ |
| Photographs and their alt text and crop | `src/_data/images.yaml`, files in `src/images/` | Sarah → „Praxisbilder“, „Medien“ |
| Team profiles | `src/team/*.md` | Sarah → „Team“ |
| Current notices | `src/aktuelles/*.md` | Sarah → „Aktuelles“ |
| Layout, components, colours, motion | `src/**/*.njk`, `src/*.css`, `src/script.js` | developer |
| Navigation structure: page list, visitor states and routes, treatment anchors | `src/_data/pages.js`, `intents.js`, `contexts.js` | developer (binding UX contract) |

Copy files (`home`, `arbeitsweise`, `therapie`, `team`, `praxis`, `karriere`,
`aktuelles`, `global`) are grouped by page section with fields named after
their meaning (`hero.title`, `method.steps[].text`, `cta.button`), never
after layout geometry. They are plain text: templates always escape them.
A blank line starts a new paragraph. In the Praxisbesuch notes,
`[Telefon]`, `[Adresse]` and `[Google Maps]` insert the practice data from
`site.yaml`, so contact data exists in exactly one place.

Fixed-count lists (four facts, three process steps, five treatment
contexts) are locked in the editor with `min`/`max`/`allow_add: false`,
because the layout and the deep-link anchors depend on them. Their wording
is free.

Deliberately template-owned text: the navigation labels and the four
binding visitor states with their routes (DESIGN.md contract), the
interface labels „Telefon“, „Adresse“, „Termin online“, „Auf Google Maps
öffnen“, „Online einen Termin vereinbaren“ and „Termin & Kontakt“, the
legal name in the footer, accessibility helper strings, the card label
„Praxisinformation“ on notices, and the page `<title>` and meta
description in each page's front matter.

`npm run content-check` guards this: it fails when a template contains
three or more words of visible text outside that list, when a copy text
is not rendered anywhere, or when `admin/config.yml` and an edited data
file disagree on their keys. The local editor rewrites a whole file when
it saves: comments disappear and quoting changes, values stay; any key
without an editor field could be lost, which is why that third check
exists.

## Practice imagery

`src/_data/images.yaml` holds nine named image slots, one per place in the layout that is designed for a
photograph. Each slot has:

- `src` — the image path (uploads land in `src/images/`), empty for a quiet brand surface;
- `alt` — screen reader description, required as soon as `src` is set;
- `focus` — the CSS `object-position` focal point for cropped formats;
- `note` — what the photograph should show; an editor note, never rendered.

Rules:

- Slot names are fixed; the templates reference them by name. Do not rename
  or remove a slot without changing the template that uses it.
- An empty slot is a valid state. It renders a quiet brand surface at the
  same aspect ratio, so a later photograph replaces it without any layout
  change.
- Only real, rights cleared practice photography. No stock imagery, no
  generated pictures of a practice or of people, and no photograph of an
  identifiable person without their consent.
- No patient may be identifiable in a published photograph.

## Website behavior

`Aktuelles` is a real sixth website destination alongside Arbeitsweise, Therapie, Team, Praxisbesuch and Karriere.

The homepage always exposes the `Aktuelles` page through the multi page navigation cards.

A compact homepage notice section is conditional. It remains hidden when no active item with `showOnHomepage: true` exists. When Sarah publishes a relevant item, the section appears without requiring a homepage redesign.

`aktuelles.html` has a calm public empty state when no active item exists.

## Future FRAME editing path

The intended product relationship is:

`Sarah input → FRAME structure and preview → Sarah review and approval → authoritative website content source → publish or deploy → FRAME syncs the resulting state`

FRAME is the authenticated inside view of the practice. The public website is the outside Navigation Layer. This makes website editing a legitimate future FRAME capability, but FRAME must not become a second website truth store.

A future Sarah facing surface may therefore expose a bounded `Website / Aktuelles` editor with exactly the fields above, preview the public result and let Sarah publish, unpublish or expire a notice after review.

The website's local leading content source is now the source files in
src/aktuelles. Their hosting and upload workflow remains subject to Tilmann's
Plesk approval, and Sarah must approve the total website. Later FRAME editing,
if separately commissioned, must use that one leading content source or an
explicit approved successor, never maintain a parallel CMS.

Do not build authentication, a generic CMS, a second deployment system or a broad website editor from this prototype alone.

## Responsibility

Sarah owns the professional truth of notices and ordinary content approval.

Franklyn owns experience, information architecture and Visibility Intelligence direction.

Tilmann owns production hosting, security, deployment continuity and the final technical content maintenance path.

FRAME may prepare, preview and coordinate content changes. The responsible human approves publication, and the production website content owner remains authoritative.
